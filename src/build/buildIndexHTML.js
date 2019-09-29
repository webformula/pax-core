import fs from 'fs';
import path from 'path';
import tags from 'common-tags';
import defaultLayout from './defaultLayout.js';
import { promisify } from 'util';

const { html } = tags;
const existsAsync = promisify(fs.exists);
const writeFileAsync = promisify(fs.writeFile);


export default async function ({ rootFolder, distFolder, pagesFolder, pagefiles, componentFiles, layoutFilePath, routerConfig }) {
  const layout = layoutFilePath !== undefined ? (await import(path.join(process.cwd(), layoutFilePath))).default : defaultLayout;
  const head = buildHead({ routerConfig, pagefiles, pagesFolder, componentFiles });
  const { body, title } = await renderRootPage({ routerConfig, rootFolder, pagesFolder });
  const content = layout({ head, title, body });
  await writeFileAsync(path.join(distFolder, 'index.html'), content);
};

function buildHead({ routerConfig, pagefiles, pagesFolder, componentFiles }) {
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
      import ${routerConfig.root} from '/${path.join(pagesFolder, `${routerConfig.root.replace('.js', '')}.js`)}';

      window.$${routerConfig.root} = new ${routerConfig.root}();
      window.currentPageClass = window.$${routerConfig.root};
      setTimeout(function () {
        window.$${routerConfig.root}.connectedCallback();
      }, 0);
    </script>
  `;
}

async function renderRootPage({ routerConfig, rootFolder, pagesFolder }) {
  if (routerConfig && routerConfig.root) {
    const cwd = process.cwd();
    const rootPagePath = path.join(cwd, rootFolder, pagesFolder, `${routerConfig.root.replace('.js', '')}.js`);
    const rootPageExists = await existsAsync(rootPagePath);
    if (rootPageExists) {
      const rootClass = await import(rootPagePath);
      if (!rootClass.default) throw Error('pages must export using default: "export default class Home extends Page {}"');
      const instance = new rootClass.default();
      return {
        body: buildTemplate(instance),
        title: instance.title
      };
    }
  }

  return {
    body: buildTemplate(),
    title: 'Home'
  };
}

function buildTemplate(instance) {
  return html`
    <render-block-page>
      ${instance ? instance.template() : ''}
    </render-block-page>
  `;
}
