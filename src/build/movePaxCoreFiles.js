import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import tags from 'common-tags';

const { html } = tags;
const paxCoreFolder = '@webformula/pax-core';
const existsAsync = promisify(fs.exists);
const mkdirAsync = promisify(fs.mkdir);
const copyFileAsync = promisify(fs.copyFile);
const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);

export default async function ({ distFolder = 'dist', paxCoreIncludeOnly, customHTMLElementExtendedName, routeConfig = {} }) {
  const { corePath } = await checkDirs({ distFolder });

  const includes = {
    'HTMLElementExtended.js': true,
    'Page.js': true,
    'Router.js': true,
    'client.js': true,
    'tags.js': true,
    'browserIndex.js': true
  };

  if (paxCoreIncludeOnly !== undefined) {
    Object.keys(includes).forEach(key => {
      includes[key] = paxCoreIncludeOnly.includes(key);
    });
  }

  const fileCopyArr = Object.keys(includes).map(async key => {
    let writeName = key;
    if (writeName === 'browserIndex.js') writeName = 'index.js';

    // handle HTMLElementExtended
    if (writeName === 'HTMLElementExtended.js') {
      // custom file and class name
      if (customHTMLElementExtendedName) {
        writeName = customHTMLElementExtendedName;
        if (includes[key] === true) {
          const content = await readFileAsync(`./node_modules/@webformula/pax-core/src/${key}`);
          return writeFileAsync(path.join(corePath, writeName), content.toString().replace('HTMLElementExtended', customHTMLElementExtendedName.replace('.js', '')));
        }
      }
    }

    if (includes[key] === true) return copyFileAsync(`./node_modules/@webformula/pax-core/src/${key}`, path.join(corePath, writeName));
  }).filter(v => v !== undefined);

  // create index file is one does not exist
  if (includes['browserIndex.js'] === false) {
      fileCopyArr.push(writeFileAsync(path.join(corePath, 'index.js'), html`
        ${Object.keys(includes).map(key => {
          if (includes[key] !== true) return undefined;
          if (key === 'HTMLElementExtended.js') {
            if (customHTMLElementExtendedName) key = customHTMLElementExtendedName;
          }

          return `import ${key.replace('.js', '')} from './${key}';`;
        }).filter(v => v !== undefined).join('\n')}

        export {
          ${Object.keys(includes).map(key => {
            if (includes[key] !== true) return undefined;
            if (key === 'HTMLElementExtended.js') {
              if (customHTMLElementExtendedName) key = customHTMLElementExtendedName;
            }
            return key.replace('.js', '');
          }).filter(v => v !== undefined).join(',\n')}
        };
      `));
  }

  if (includes['client.js'] === true) {
    writeFileAsync(path.join(corePath, 'routerConfig.js'), `export const routerConfig = ${JSON.stringify(routeConfig)}`);
  }

  await Promise.all(fileCopyArr).catch(e => console.error(e));
}


async function checkDirs({ distFolder }) {
  const exists = await existsAsync(distFolder);
  if (!exists) await mkdirAsync(distFolder);

  const corePath = path.join(distFolder, paxCoreFolder);
  const existsPaxCore = await existsAsync(corePath);
  if (!existsPaxCore) await mkdirAsync(corePath, { recursive: true });

  return {
    corePath
  };
}
