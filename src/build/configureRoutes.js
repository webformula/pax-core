import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import glob from 'glob';
import { checkPageFiles, convertPathToName } from './utils.js';

const readFileAsync = promisify(fs.readFile);

export default async function ({ rootFolder, pagesFolder, routeConfig = {} }) {
  const pagesPath = pagesFolder === undefined ? '' : path.join(rootFolder, pagesFolder, '**/*.js');
  const potentialPageFiles = pagesPath === '' ? [] : glob.sync(pagesPath) || [];
  const pagefiles = await checkPageFiles(potentialPageFiles);

  routeConfig.custom = routeConfig.custom || {};
  routeConfig.custom = Object.assign({}, pagefiles.reduce((a, b) => {
    const route = b.replace(path.join(rootFolder, pagesFolder), '').replace(/^\/+/, '').replace('.js', '');
    a[route] = convertPathToName(route);
    return a;
  }, {}));

  if (!routeConfig.root) {
    routeConfig.root = routeConfig.custom['/'] || routeConfig.custom.home || routeConfig.custom.index || routeConfig.custom[Object.keys(routeConfig.custom).pop()];
  }

  return routeConfig;
}
