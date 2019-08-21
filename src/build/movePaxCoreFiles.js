import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const paxCoreFolder = '@webformula/pax-core';
const existsAsync = promisify(fs.exists);
const mkdirAsync = promisify(fs.mkdir);
const copyFileAsync = promisify(fs.copyFile);
const writeFileAsync = promisify(fs.writeFile);

export default async function ({ distFolder = 'dist', routeConfig }) {
  const { corePath } = await checkDirs({ distFolder });

  await Promise.all([
    copyFileAsync('./node_modules/@webformula/pax-core/src/Page.js', path.join(corePath, 'Page.js')),
    copyFileAsync('./node_modules/@webformula/pax-core/src/HTMLElementExtended.js', path.join(corePath, 'HTMLElementExtended.js')),
    copyFileAsync('./node_modules/@webformula/pax-core/src/Router.js', path.join(corePath, 'Router.js')),
    copyFileAsync('./node_modules/@webformula/pax-core/src/client.js', path.join(corePath, 'client.js')),
    copyFileAsync('./node_modules/@webformula/pax-core/src/browserIndex.js', path.join(corePath, 'index.js')),
    writeFileAsync(`${corePath}/routerConfig.js`, html`
      export const routerConfig = ${JSON.stringify(routeConfig || {})};
    `)
  ]).catch(e => console.error(e));
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
