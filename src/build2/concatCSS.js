import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import glob from 'glob';

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);


export default async function ({ rootFolder, distFolder, componentCSSFiles }) {
  let cssFiles = glob.sync(path.join(rootFolder, '**/*.css')) || [];
  // remoe component interal styles
  cssFiles = cssFiles.filter(p => !componentCSSFiles.includes(p));
  const contents = await Promise.all(cssFiles.map(p => readFileAsync(p)));
  await writeFileAsync(path.join(distFolder, 'app.css'), contents.map(p => p.toString()).join('\n'));
}
