import fs from 'fs';
import path from 'path';
import tags from 'common-tags';
import defaultLayout from './defaultLayout.js';
import { promisify } from 'util';

const { html } = tags;
const existsAsync = promisify(fs.exists);
const writeFileAsync = promisify(fs.writeFile);


export default async function ({ rootFolder, distFolder, pagesFolder, pagefiles, componentFiles, layoutFilePath, routeConfig }) {
  const layout = layoutFilePath !== undefined ? (await import(path.join(process.cwd(), layoutFilePath))).default : defaultLayout;
  const head = buildHead({ routeConfig, pagefiles, pagesFolder, componentFiles });
  const { body, title } = await renderRootPage({ routeConfig, rootFolder, pagesFolder });
  const content = layout({ head, title, body });
  await writeFileAsync(path.join(distFolder, 'index.html'), content);
};

function buildHead({ routeConfig, pagefiles, pagesFolder, componentFiles }) {
  return html`
    <script type="module" src="@webformula/pax-core/index.js"></script>
    <script type="module" src="component-templates.js"></script>

    <script type="module">
      ${componentFiles.map(({ importPath }) => {
        return html`
          import '${importPath}';
        `;
      }).join('\n')}

      ${pagefiles.map(({ importPath, pageClassname }) => {
        return html`
          import ${pageClassname} from '${importPath}';
          window.${pageClassname} = ${pageClassname};
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
