import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const writeFileAsync = promisify(fs.writeFile);

export default async function ({ distFolder, pagefiles, componentFiles, routerConfig, pagesFolder }) {
  const content = buildFile({ routerConfig, pagefiles, pagesFolder, componentFiles });
  await writeFileAsync(path.join(distFolder, 'entry.js'), content);
};


function buildFile({ routerConfig, pagefiles, pagesFolder, componentFiles }) {
  return `// globalThis polyfill
(function() {
	if (typeof globalThis === 'object') return;
	Object.prototype.__defineGetter__('__magic__', function() {
		return this;
	});
	__magic__.globalThis = __magic__; // lolwat
	delete Object.prototype.__magic__;
}());

import './@webformula/pax-core/index.js';
import './component-templates.js';
import './@webformula/pax-core/client.js';
import ${routerConfig.root} from './${path.join(pagesFolder, `${routerConfig.root.replace('.js', '')}.js`)}';
${componentFiles.map(({ importPath }) => `import '${importPath}';`).join('\n')}

${pagefiles.map(({ importPath, pageClassname }) => {
  return html`
    import ${pageClassname} from '.${importPath}';
    globalThis.${pageClassname} = ${pageClassname};
    if (${pageClassname}.routes && ${pageClassname}.routes.length) ${pageClassname}.routes.forEach(route => router.add(route, '${pageClassname}'));
  `;
}).join('\n')}

globalThis.$${routerConfig.root} = new ${routerConfig.root}();
globalThis.currentPageClass = globalThis.$${routerConfig.root};
setTimeout(function () {
  globalThis.$${routerConfig.root}.connectedCallback();
}, 0);
  `;
}
