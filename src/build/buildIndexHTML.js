import fs from 'fs';
import path from 'path';
import tags from 'common-tags';
import defaultLayout from './defaultLayout.js';
import { promisify } from 'util';
import { getServiceWorkerRegister } from './buildServiceWorker.js';

const { html } = tags;
const existsAsync = promisify(fs.exists);
const writeFileAsync = promisify(fs.writeFile);


export default async function ({ rootFolder, distFolder, pagesFolder, layoutFilePath, routerConfig, serviceWorker, cacheBust = false }) {
  const layout = layoutFilePath !== undefined ? (await import(path.join(process.cwd(), rootFolder, layoutFilePath))).default : defaultLayout;
  const head = buildHead({ serviceWorker, cacheBust });
  const { body, title } = await renderRootPage({ routerConfig, rootFolder, pagesFolder });
  const content = layout({ head, title, body });
  await writeFileAsync(path.join(distFolder, 'index.html'), content);
};

function buildHead({ serviceWorker, cacheBust }) {
  return html`
    <script>
      ${getServiceWorkerRegister(serviceWorker)}
    </script>

    <script type="module" src="entry.js${cacheBust ? `?${Date.now()}` : ''}"></script>

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
