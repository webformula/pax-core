import fs from 'fs';
import path from 'path';
import tags from 'common-tags';
import defaultLayout from './defaultLayout.js';
import { checkPageFiles } from './utils.js';
import { promisify } from 'util';
import glob from 'glob';
import { getComponentFiles } from './utils.js';

const { html } = tags;
const existsAsync = promisify(fs.exists);
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);


export default async function ({ rootFolder, pagesFolder = 'pages', distFolder, layoutFilePath, routeConfig }) {
  const layout = layoutFilePath !== undefined ? (await import(path.join(process.cwd(), layoutFilePath))).default : defaultLayout;
  const pageFiles = glob.sync(path.join(rootFolder, pagesFolder, '**/*.js') || []);
  const pages = await checkPageFiles(pageFiles);
  const allFiles = glob.sync(path.join(rootFolder, '**/*.js') || []);
  const componentFiles = await getComponentFiles(allFiles);
  const head = buildHead({ routeConfig, pages, pagesFolder, componentFiles: componentFiles.map(f => f.replace(rootFolder, '')) });
  const { body, title } = await renderRootPage({ routeConfig, rootFolder, pagesFolder });
  const content = layout({ head, title, body });
  await writeFileAsync(path.join(distFolder, 'index.html'), content);
};

function buildHead({ routeConfig, pages, pagesFolder, componentFiles }) {
  return html`
    <script type="module" src="@webformula/pax-core/index.js"></script>
    <script type="module" src="component-templates.js"></script>

    <script type="module">
      ${componentFiles.map(componentPath => {
        return html`
          import '${componentPath}';
        `;
      }).join('\n')}

      ${pages.map(pagePath => {
        const classFileName = pagePath.split(pagesFolder).pop();
        const className = classFileName.split('/').pop().replace('.js', '').replace(/[-]+/g, '');
        return html`
          import ${className} from '/${path.join(pagesFolder, classFileName)}';
          window.${className} = ${className};
        `;
      }).join('\n')}
    </script>

    <script type="module" src="@webformula/pax-core/client.js"></script>

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
