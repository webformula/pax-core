import fs from 'fs';
import path from 'path';
import tags from 'common-tags';
import defaultLayout from './defaultLayout.js';
import { promisify } from 'util';

const { html } = tags;
const existsAsync = promisify(fs.exists);
const writeFileAsync = promisify(fs.writeFile);


export default async function ({ rootFolder, distFolder, pagesFolder, layoutFilePath, routerConfig }) {
  const layout = layoutFilePath !== undefined ? (await import(path.join(process.cwd(), layoutFilePath))).default : defaultLayout;
  const head = buildHead();
  const { body, title } = await renderRootPage({ routerConfig, rootFolder, pagesFolder });
  const content = layout({ head, title, body });
  await writeFileAsync(path.join(distFolder, 'index.html'), content);
};

function buildHead() {
  return html`
    <script type="module" src="entry.js"></script>

    <style>
      .hide-page-on-load {
        display: none !important;
      }

      .mdw-hide-other-than-page-content {
        display: none;
      }
    </style>
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
    <render-block-page class="hide-page-on-load">
      ${instance ? instance.template() : ''}
    </render-block-page>
  `;
}
