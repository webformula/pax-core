import glob from 'glob';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const pageClassnameRegex = /export default class\s(.*)\sextends/;

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

export default async function build({ rootFolder = 'app', pagesFolder = 'pages', paxCorePath = '@webformula/pax-core', entryFilePath, templateFile = false, templateFilePath, routerConfig = { root: '', fourOFour: '', ignoreFileInPath } }) {
  entryFilePath = entryFilePath || path.join(rootFolder, 'pax-entry.js');
  templateFilePath = templateFilePath || path.join(rootFolder, 'pax-templates.js');
  const ignoreFileInPath = routerConfig.ignoreFileInPath || 'page.js';
  const [pageFiles, componentFiles] = await Promise.all([
    await getPageFiles({ rootFolder, pagesFolder, entryFilePath, ignoreFileInPath }),
    await getComponentFiles({ rootFolder, entryFilePath })
  ]);
  
  if (templateFile) {
    const templates = Object.fromEntries(pageFiles.filter(({ template }) => !!template[0]).map(({ template }) => template));
    await writeFileAsync(templateFilePath, `/* eslint-disable quotes */\n/* eslint-disable no-template-curly-in-string */\nwindow._templates = ${JSON.stringify(templates, null, 2)};`);
  }

  const entryFileContents = entryTemplate({ pageFiles, routerConfig, componentFiles, paxCorePath, templateFile, templateFilePath, rootFolder });
  await writeFileAsync(entryFilePath, entryFileContents);
}

async function getPageFiles({ rootFolder, pagesFolder, entryFilePath, ignoreFileInPath = 'page.js' }) {
  const pageFilesUnfiltered = await Promise.all((glob.sync(path.join(rootFolder, pagesFolder, '/**/*.js')) || [])
    .map(async fullPath => {
      const file = await readFileAsync(fullPath)
      const content = file.toString();
      const prepedPath = fullPath.substring(fullPath.indexOf(pagesFolder) + pagesFolder.length).replace('.js', '').replace(/^\/+/g, '');

      // remove last part of path if it matches ignore
      let route = prepedPath;
      const spitPath = prepedPath.split('/');
      if (spitPath.pop() === ignoreFileInPath.replace('.js', '')) {
        route = spitPath.join('/');
      }

      const classMatch = pageClassnameRegex.exec(content);
      const className = classMatch ? classMatch[1] : prepedPath.split('/').pop();
      const relativePath = `./${path.relative(path.parse(entryFilePath).dir, fullPath)}`;
      const template = await getTemplate(content, pagesFolder, rootFolder, fullPath);
      return {
        fullPath,
        relativePath,
        route,
        className,
        content,
        template
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

function entryTemplate({ pageFiles = [], componentFiles = [], routerConfig = {}, paxCorePath, templateFile, templateFilePath, rootFolder }) {
  return `${componentFiles.map(({ relativePath }) => `import '${relativePath}';`).join('\n')}

import { router } from '${paxCorePath}';
${pageFiles.map(({ className, relativePath }) => `import ${className} from '${relativePath}';`).join('\n')}

${pageFiles.map(({ className, route }) => `router.addPageClass(${className}, '${route}');`).join('\n')}
${!!routerConfig.root ? `router.setRoot('${routerConfig.root}');` : ''}
router.init();
window.router = router;

export {
  router
};
`;
}

async function getTemplate(content, pagesFolder, rootFolder, fullPath) {
  const match = /template\(\)\s+\{\s+(?<content>.+)\s+\}/gm.exec(content);
  if (match && match.groups && match.groups.content) {
    if (match.groups.content.includes('.html')) {
      const pageTemplatePath = match.groups.content.replace('return', '').replace(';', '').replace(/\'/g, '').replace(/"/g, '').trim();
      const pageClassDir = path.dirname(fullPath);
      const templatePath = path.join(pageClassDir, pageTemplatePath);
      try {
        return [
          templatePath.replace(`${rootFolder}/`, ''),
          (await readFileAsync(templatePath)).toString()
        ];
      } catch (e) {
        console.error(e);
        return ['', ''];
      }
    }
  }
  
  return ['', ''];
}
