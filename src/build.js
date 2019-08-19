import fs from 'fs';
import path from 'path';
import { promisify, inspect } from 'util';
import glob from 'glob';
import tags from 'common-tags';
import defaultLayout from './defaultLayout.js';

const { html } = tags;
const existsAsync = promisify(fs.exists);
const mkdirAsync = promisify(fs.mkdir);
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const copyFileAsync = promisify(fs.copyFile);
const pacCoreFolder = 'pax-core';

export default async function ({ rootFolder, pagesFolder = 'pages', distFolder = 'dist', layout = defaultLayout, routeConfig }) {
  const pages = glob.sync(path.join(rootFolder, pagesFolder, '*')) || [];
  const head = buildHead({ routeConfig, pages, pagesFolder });
  const { body, title } = await renderRootPage({ routeConfig, rootFolder, pagesFolder });
  const indexHTML = layout({ head, title, body });
  const { corePath, pagesPath } = await checkDirs({ distFolder, pagesFolder });

  await Promise.all([
    copyFileAsync('./node_modules/@webformula/pax-core/src/Page.js', path.join(corePath, 'Page.js')),
    copyFileAsync('./node_modules/@webformula/pax-core/src/HTMLElementExtended.js', path.join(corePath, 'HTMLElementExtended.js')),
    copyFileAsync('./node_modules/@webformula/pax-core/src/Router.js', path.join(corePath, 'Router.js')),
    copyFileAsync('./node_modules/@webformula/pax-core/src/client.js', path.join(corePath, 'client.js')),
    copyFileAsync('./node_modules/@webformula/pax-core/src/browserIndex.js', path.join(corePath, 'index.js')),
    writeFileAsync(`${corePath}/routerConfig.js`, html`
      export const routerConfig = ${JSON.stringify(routeConfig || {})};
    `),
    writeFileAsync(`./${distFolder}/index.html`, indexHTML)
  ].concat(pages.map(pagePath => modifyImports(pagePath, path.join(pagesPath, pagePath.split(pagesFolder)[1])))))
    .catch(e => console.error(e));
}


// fix import for browser
//  Example:
//    import { Page } from '@webformula/pax-core';
//    import { Page } from './pax-core';
async function modifyImports(source, dest) {
  const nestLevel = dest.split('/').length - 2;
  const dirModifier = `./${[...new Array(nestLevel)].map(() => '../').join('')}`;
  let file = await readFileAsync(source);
  file = file.toString().replace(/from\s'@webformula\/pax-core/g, `from '${dirModifier}pax-core/index.js`);
  await writeFileAsync(dest, file)
}

async function checkDirs({ distFolder, pagesFolder }) {
  const exists = await existsAsync(distFolder);
  if (!exists) await mkdirAsync(distFolder);

  const corePath = path.join(distFolder, pacCoreFolder);
  const existsPaxCore = await existsAsync(corePath);
  if (!existsPaxCore) await mkdirAsync(corePath);

  const pagesPath = path.join(distFolder, pagesFolder);
  const existsPages = await existsAsync(pagesPath);
  if (!existsPages) await mkdirAsync(pagesPath);

  return {
    corePath,
    pagesPath
  }
}

function buildHead({ routeConfig, pages, pagesFolder }) {
  return html`
    <script type="module" src="pax-core/index.js"></script>

    <script type="module">
      ${pages.map(pagePath => {
        const classFileName = pagePath.split(pagesFolder)[1];
        const className = classFileName.replace('/', '').replace('.js', '');
        return html`
          import ${className} from '/${path.join(pagesFolder, classFileName)}';
          window.${className} = ${className};
        `;
      }).join('\n')}
    </script>

    <script type="module" src="pax-core/client.js"></script>

    <!-- create globally accessable instance of page class -->
    <script type="module">
      import ${routeConfig.root} from '/${path.join(pagesFolder, `${routeConfig.root.replace('.js', '')}.js`)}';

      window.$${routeConfig.root} = new ${routeConfig.root}();
      window.currentPageClass = window.$${routeConfig.root};
      setTimeout(function () {
        window.$${routeConfig.root}.connectedCallback();
      }, 0);
    </script>
  `;
}

async function renderRootPage({ routeConfig, rootFolder, pagesFolder }) {
  if (routeConfig && routeConfig.root) {
    const cwd = process.cwd();
    const rootPagePath = path.join(cwd, rootFolder, pagesFolder, `${routeConfig.root.replace('.js', '')}.js`);
    const rootPageExists = await existsAsync(rootPagePath);
    if (rootPageExists) {
      const rootClass = await import(rootPagePath);
      if (!rootClass.default) throw Error('pages must export using default: "export default class Home extends Page {}"');
      const instance = new rootClass.default();
      return {
        body: buildTemplate(instance),
        title: `<span class="pax-core-title">${instance.title}</span>`
      };
    }
  }

  return {
    body: buildTemplate(),
    title: '<span class="pax-core-title">Home</span>'
  };
}

function buildTemplate(instance) {
  return html`
    <render-block-page>
      ${instance ? instance.template() : ''}
    </render-block-page>
  `;
}
