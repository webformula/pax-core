import fs from 'fs';
import path from 'path';
import { promisify, inspect } from 'util';

const writeFileAsync = promisify(fs.writeFile);

export default async function ({ rootFolder, distFolder, pagesFolder, routerConfig = {}, pagefiles }) {
  routerConfig.custom = routerConfig.custom || {};
  routerConfig.custom = Object.assign({}, routerConfig.custom, pagefiles.reduce((a, b) => {
    const route = b.sourcePath.replace(path.join(rootFolder, pagesFolder), '').replace('.js', '');
    a[route] = b.pageClassname;
    return a;
  }, {}));

  if (!routerConfig.root) {
    routerConfig.root = routerConfig.custom['/'] || routerConfig.custom.home || routerConfig.custom.index || routerConfig.custom[Object.keys(routerConfig.custom).pop()];
  }

  await writeFileAsync(path.join(distFolder, 'routerConfig.js'), `export const routerConfig = ${inspect(routerConfig, { compact: false, depth: null })};`);

  return routerConfig;
}
