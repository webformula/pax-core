import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import glob from 'glob';
import { createDir, removeFileFromPath } from './utils.js';

const componentNameRegex = /customElements\.define\(('|")(.*)('|")/;
const pageClassnameRegex = /export default class\s(.*)\sextends/;
const patternImport = new RegExp(/import(?:["'\s]*([\w*${}\n\r\t, ]+)from\s*)?["'\s]["'\s](.*[@\w_-]+)["'\s].*;$/, 'mg');
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

export default async function ({ rootFolder, distFolder, pagesFolder, layoutFilePath, customHTMLElementExtendedName }) {
  const packagejson = await readFileAsync('./package.json');
  const dependencies = JSON.parse(packagejson).dependencies;
  const ignore = [];
  if (layoutFilePath) ignore.push(layoutFilePath);
  const jsfiles = glob.sync(path.join(rootFolder, '**/*.js'), { ignore }) || [];
  const files = await Promise.all(jsfiles.map(p => categorizeFile(p, rootFolder, distFolder)));
  const importSourcePaths = getImportSourcePaths(files);
  console.log(importSourcePaths);
  const filesToCopy = files.filter(({ sourcePath, isComponent, isPage }) => importSourcePaths.includes(sourcePath) || isComponent || isPage);
  const processedFiles = filesToCopy.map(file => processFile(file, customHTMLElementExtendedName, dependencies));
  await copysrcFiles(processedFiles);

  // return all page info except the content
  return files.map(({
    sourcePath,
    distPath,
    importPath,
    isComponent,
    componentName,
    isPage,
    pageClassname,
    imports
  }) => ({
    sourcePath,
    distPath,
    importPath,
    isComponent,
    componentName,
    isPage,
    pageClassname,
    imports
  }));
}

async function copysrcFiles(files) {
  await Promise.all(files.map(async file => {
    const folderPath = removeFileFromPath(file.distPath);
    await createDir(folderPath);
    await writeFileAsync(file.distPath, file.fileStr);
  }));
}

function processFile(file, customHTMLElementExtendedName, dependencies) {
  // rename HTMLElementExtended
  if (customHTMLElementExtendedName !== undefined) {
    file.fileStr = file.fileStr.replace(/HTMLElementExtended/g, customHTMLElementExtendedName.replace('.js', ''));
  }

  // adjust imports for browser
  file.imports.forEach(item => {
    // replace import with browser relitive path
    if (item.path === '@webformula/pax-core') {
      if (item.importNames.includes('customElements')) item.importNames = item.importNames.filter(c => c !== 'customElements');
      let newImport = `import { ${item.importNames.join(', ')} } from '/@webformula/pax-core/index.js'`;
      file.fileStr = file.fileStr.replace(item.full, newImport);
    }

    // temporary fix for global browser dependencies
    // This assumes the user will import the dependcy using a script tag
    else if (dependencies[item.path] !== undefined) {
      file.fileStr = file.fileStr.replace(item.full, `// ${item.full} // browser dependencies are global and do not need imports`);
    }
  });

  return file;
}

function getImportSourcePaths(files) {
  return files.reduce((a, b) => {
    return a.concat(b.imports.map(i => path.join(removeFileFromPath(b.sourcePath), i.path)));
  }, []);
}

async function categorizeFile(sourcePath, rootFolder, distFolder) {
  const file = await readFileAsync(sourcePath);
  const fileStr = file.toString();
  const isComponent = fileStr.includes('customElements.define');
  const componentName = !isComponent ? '' : componentNameRegex.exec(fileStr)[2];
  const isPage = fileStr.includes('extends Page');
  const pageClassname = !isPage ? '' : pageClassnameRegex.exec(fileStr)[1];
  return {
    sourcePath,
    distPath: sourcePath.replace(rootFolder, distFolder),
    importPath: sourcePath.replace(rootFolder, ''),
    isComponent: fileStr.includes('customElements.define'),
    componentName,
    isPage,
    pageClassname,
    imports: extractImports(fileStr),
    fileStr
  };
}

function extractImports(str) {
  return [...str.matchAll(patternImport)].map(v => ({
    full: v[0],
    importNames: !v[1] ? '' : v[1].replace('{', '').replace('}', '').replace(/\r?\n|\r/g, '').trim().split(','),
    path: v[2]
  }));
}
