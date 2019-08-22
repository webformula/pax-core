import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import glob from 'glob';
import { checkPageFiles, removeFileFromPath } from './utils.js';

const readFileAsync = promisify(fs.readFile);

export default async function ({ rootFolder, pagesFolder, routeConfig = {} }) {
  const pagesPath = pagesFolder === undefined ? '' : path.join(rootFolder, pagesFolder, '**/*.js');
  const potentialPageFiles = pagesPath === '' ? [] : glob.sync(pagesPath) || [];
  const pagefiles = await checkPageFiles(potentialPageFiles);
  console.log(pagefiles);
  // TODO fill out custom routes section
  // TODO autofill root and fourOFour if possible

  return routeConfig;
}
