import glob from 'glob';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import tags from 'common-tags';

const { html } = tags;
const pageClassnameRegex = /export default class\s(.*)\sextends/;

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

export default async function build({ rootFolder = app, pagesFolder = 'pages', distFolder = 'dist', routerConfig, preRenderRootPage }) {  
  const [pageFiles, componentFiles] = await Promise.all([
    await getPageFiles({ rootFolder, pagesFolder }),
    await getComponentFiles({ rootFolder })
  ]);
  const entryFileContents = entryTemplate({ pageFiles, routerConfig, componentFiles });
  const wPath = path.join(rootFolder, 'entry.js');
  await writeFileAsync(wPath, entryFileContents);
}

async function getPageFiles({ rootFolder, pagesFolder }) {
  // TODO make async
  const pageFilesUnfiltered = await Promise.all((glob.sync(path.join(rootFolder, pagesFolder, '/**/*.js')) || [])
    .map(async fullPath => {
      const file = await readFileAsync(fullPath)
      const content = file.toString();
      const prepedPath = fullPath.split(pagesFolder)[1].replace('.js', '').replace(/^\/+/g, '');
      const route = prepedPath.toLowerCase();
      const classMatch = pageClassnameRegex.exec(content);
      const className = classMatch ? classMatch[1] : prepedPath.split('/').pop();
      const relativePath = `./${fullPath.replace(rootFolder, '').replace(/^\/+/g, '')}`;
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

async function getComponentFiles({ rootFolder }) {
  // TODO make async
  const filesUnfiltered = await Promise.all((glob.sync(path.join(rootFolder, '/**/*.js')) || [])
    .map(async fullPath => {
      const relativePath = `./${fullPath.replace(rootFolder, '').replace(/^\/+/g, '')}`;
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

function entryTemplate({ pageFiles = [], componentFiles = [], routerConfig = {} }) {
  return html`
    ${componentFiles.map(({ relativePath }) => html`
      import '${relativePath}';
    `).join('\n')}

    import { Router } from '@webformula/pax-core/src/entry.js';
    ${pageFiles.map(({ className, relativePath }) => html`
      import ${className} from '${relativePath}';
    `).join('\n')}

    const routerConfig = ${JSON.stringify(routerConfig, null, 2)};
    const router = new Router();

    if (routerConfig.root) router.setRoot(routerConfig.root);
    if (routerConfig.fourOFour) router.set404(routerConfig.fourOFour);
    if (routerConfig.custom) {
      Object.keys(routerConfig.custom).forEach(key => {
        router.add(key, routerConfig.custom[key]);
      });
    }

    ${pageFiles.map(({ className, route }) => html`
      router.addClass(${className}, '${route}');
    `).join('\n')}

    router.init();

    window.router = router;
  `;
}