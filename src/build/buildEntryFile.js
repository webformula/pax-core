import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const writeFileAsync = promisify(fs.writeFile);

export default async function ({ distFolder, pagefiles, componentFiles, routerConfig, pagesFolder }) {
  const content = buildFile({ routerConfig, pagefiles, pagesFolder, componentFiles });
  await writeFileAsync(path.join(distFolder, 'entry.js'), content);
};


function buildFile({ routerConfig, pagefiles, pagesFolder, componentFiles }) {
  return `import './@webformula/pax-core/index.js';
import './component-templates.js';
import './@webformula/pax-core/client.js';
import ${routerConfig.root} from './${path.join(pagesFolder, `${routerConfig.root.replace('.js', '')}.js`)}';
${componentFiles.map(({ importPath }) => `import '${importPath}';`).join('\n')}

${pagefiles.map(({ importPath, pageClassname }) => {
  return html`
    import ${pageClassname} from '.${importPath}';
    window.${pageClassname} = ${pageClassname};
  `;
}).join('\n')}

window.$${routerConfig.root} = new ${routerConfig.root}();
window.currentPageClass = window.$${routerConfig.root};
setTimeout(function () {
  window.$${routerConfig.root}.connectedCallback();
}, 0);
  `;
}
