import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import glob from 'glob';
import { checkPageFiles, removeFileFromPath } from './utils.js';

const patternImport = new RegExp(/import(?:["'\s]*([\w*${}\n\r\t, ]+)from\s*)?["'\s]["'\s](.*[@\w_-]+)["'\s].*;$/, 'mg');
const existsAsync = promisify(fs.exists);
const mkdirAsync = promisify(fs.mkdir);
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

export default async function ({ rootFolder, pagesFolder, distFolder = 'dist', layoutFilePath, customHTMLElementExtendedName }) {
  const srcFiles = await getFiles(rootFolder, distFolder, pagesFolder, layoutFilePath, customHTMLElementExtendedName);
  await copysrcFiles(srcFiles);
}

async function getFiles(rootFolder, distFolder, pagesFolder, layoutFilePath, customHTMLElementExtendedName) {
  const packagejson = await readFileAsync('./package.json');
  const dependencies = JSON.parse(packagejson).dependencies;
  const pagesPath = pagesFolder === undefined ? '' : path.join(rootFolder, pagesFolder, '**/*.js');
  const ignore = [pagesPath];
  if (layoutFilePath) ignore.push(layoutFilePath);
  const jsfiles = glob.sync(path.join(rootFolder, '**/*.js'), { ignore }) || [];
  const potentialPageFiles = pagesPath === '' ? [] : glob.sync(pagesPath) || [];
  const pagefiles = await checkPageFiles(potentialPageFiles);

  const pagesFiles = await Promise.all(pagefiles.map(sourcePath => evaluteImports(sourcePath, rootFolder, distFolder, dependencies)));
  const nonPagesFiles = await Promise.all(jsfiles.map(sourcePath => evaluteImports(sourcePath, rootFolder, distFolder, dependencies, customHTMLElementExtendedName)));
  const imports = [].concat(nonPagesFiles).concat(pagesFiles).reduce((a, b) => {
    b.imports.forEach(d => {
      const p = dependencies[d.path] !== undefined ? d.path : path.join(removeFileFromPath(b.sourcePath), d.path);
      a[p] = {
        path: d.path,
        isDependency: dependencies[d.path] !== undefined
      };
    });
    a[b]
    return a;
  }, {});
  const files = nonPagesFiles.reduce((a, b) => {
    if (imports[b.sourcePath] || b.isComponent) a[b.sourcePath] = b;
    return a;
  }, {});
  pagesFiles.forEach(p => files[p.sourcePath] = p)

  return files;
}

async function copysrcFiles(files) {
  // write all files to dist folder
  await Promise.all(Object.keys(files).map(async key => {
    const folderPath = removeFileFromPath(files[key].distPath);

    // check if folder path exists
    const exists = await existsAsync(folderPath);
    if (!exists) await mkdirAsync(folderPath, { recursive: true });

    // write file with modified imports
    // TODO change to copy id no import modification happens
    await writeFileAsync(files[key].distPath, files[key].fileStr);
  }));
}

async function evaluteImports(sourcePath, rootFolder, distFolder, dependencies, customHTMLElementExtendedName) {
  const file = await readFileAsync(sourcePath);
  let fileStr = file.toString();
  const imports = extractImports(fileStr);

  // make paths relitive for pax-core
  imports.forEach(item => {
    if (item.path === '@webformula/pax-core') {
      item.browserPath = '/@webformula/pax-core/index.js';
      if (item.importNames.includes('customElements')) item.importNames = item.importNames.filter(c => c !== 'customElements');
      // replace import with browser relitive path
      let newImport = `import { ${item.importNames.join(', ')} } from '${item.browserPath}'`;
      fileStr = fileStr.replace(item.full, newImport);
    }

    // temporary fix for global browser dependencies
    // This assumes the user will import the dependcy using a script tag
    else if (dependencies[item.path] !== undefined) {
      fileStr = fileStr.replace(item.full, `// ${item.full} // browser dependencies are global and do not need imports`);
    }
  });

  if (customHTMLElementExtendedName !== undefined) {
    fileStr = fileStr.replace(/HTMLElementExtended/g, customHTMLElementExtendedName.replace('.js', ''));
  }

  return {
    sourcePath,
    distPath: sourcePath.replace(rootFolder, distFolder),
    imports,
    fileStr,
    isComponent: fileStr.includes('customElements.define')
  };
}

function extractImports(str) {
  return [...str.matchAll(patternImport)].map(v => ({
    full: v[0],
    importNames: !v[1] ? '' : v[1].replace('{', '').replace('}', '').replace(/\r?\n|\r/g, '').trim().split(','),
    path: v[2]
  }));
}
