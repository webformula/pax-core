import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import glob from 'glob';

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);


export default async function ({ rootFolder, distFolder, componentCSSFiles }) {
  let cssFiles = glob.sync(path.join(rootFolder, '**/*.css')) || [];
  // remove component interal styles
  cssFiles = cssFiles.filter(p => !componentCSSFiles.includes(p));
  const contents = await Promise.all(cssFiles.map(p => readFileAsync(p)));
  const writePath = path.join(distFolder, 'app.css');
  await writeFileAsync(writePath, contents.map(p => p.toString()).join('\n'));
  return writePath.replace(distFolder, '');
}
