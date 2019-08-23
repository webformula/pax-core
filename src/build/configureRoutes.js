import fs from 'fs';
import path from 'path';
import { promisify, inspect } from 'util';

const writeFileAsync = promisify(fs.writeFile);

export default async function ({ rootFolder, distFolder, pagesFolder, routeConfig = {}, pagefiles }) {
  routeConfig.custom = routeConfig.custom || {};
  routeConfig.custom = Object.assign({}, pagefiles.reduce((a, b) => {
    const route = b.sourcePath.replace(path.join(rootFolder, pagesFolder), '').replace('.js', '');
    a[route] = b.pageClassname;
    return a;
  }, {}));

  if (!routeConfig.root) {
    routeConfig.root = routeConfig.custom['/'] || routeConfig.custom.home || routeConfig.custom.index || routeConfig.custom[Object.keys(routeConfig.custom).pop()];
  }

  await writeFileAsync(path.join(distFolder, 'routerConfig.js'), `export const routerConfig = ${inspect(routeConfig, { compact: false, depth: null })};`);

  return routeConfig;
}
