import glob from 'glob';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const pageClassnameRegex = /export default class\s(.*)\sextends/;

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

export default async function build({ rootFolder = 'app', pagesFolder = 'pages', paxCorePath = '@webformula/pax-core', entryFilePath, routerConfig = { root: '', fourOFour: '' } }) {
  entryFilePath = entryFilePath || path.join(rootFolder, 'pax-entry.js');
  const [pageFiles, componentFiles] = await Promise.all([
    await getPageFiles({ rootFolder, pagesFolder, entryFilePath }),
    await getComponentFiles({ rootFolder, entryFilePath })
  ]);
  
  const entryFileContents = entryTemplate({ pageFiles, routerConfig, componentFiles, paxCorePath });
  await writeFileAsync(entryFilePath, entryFileContents);
}

async function getPageFiles({ rootFolder, pagesFolder, entryFilePath }) {
  const pageFilesUnfiltered = await Promise.all((glob.sync(path.join(rootFolder, pagesFolder, '/**/*.js')) || [])
    .map(async fullPath => {
      const file = await readFileAsync(fullPath)
      const content = file.toString();
      const prepedPath = fullPath.substring(fullPath.indexOf(pagesFolder) + pagesFolder.length).replace('.js', '').replace(/^\/+/g, '');
      const route = prepedPath.toLowerCase();
      const classMatch = pageClassnameRegex.exec(content);
      const className = classMatch ? classMatch[1] : prepedPath.split('/').pop();
      const relativePath = `./${path.relative(path.parse(entryFilePath).dir, fullPath)}`;
      return {
        fullPath,
        relativePath,
        route,
        className,
        content
      };
    }));

  return pageFilesUnfiltered.filter(({ content }) => content.includes('extends Page'));
}

async function getComponentFiles({ rootFolder, entryFilePath }) {
  const filesUnfiltered = await Promise.all((glob.sync(path.join(rootFolder, '/**/*.js')) || [])
    .map(async fullPath => {
      const relativePath = `./${path.relative(path.parse(entryFilePath).dir, fullPath)}`;
      const file = await readFileAsync(fullPath)
      const content = file.toString();
      return {
        fullPath,
        relativePath,
        content
      };
    }));

  return filesUnfiltered.filter(({ content }) => content.includes('customElements.define'));
}

function entryTemplate({ pageFiles = [], componentFiles = [], routerConfig = {}, paxCorePath }) {
  return `
${componentFiles.map(({ relativePath }) => `import '${relativePath}';`).join('\n')}

import { router } from '${paxCorePath}';
${pageFiles.map(({ className, relativePath }) => `import ${className} from '${relativePath}';`).join('\n')}

${pageFiles.map(({ className, route }) => `router.addPageClass(${className}, '${route}');`).join('\n')}
${!!routerConfig.root ? `router.setRoot('${routerConfig.root}');` : ''}
router.init();
window.router = router;

export {
  router
}
  `;
}
