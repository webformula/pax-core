import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import glob from 'glob';
import tags from 'common-tags';
import defaultLayout from './defaultLayout.js';

const { html } = tags;
const existsAsync = promisify(fs.exists);
const mkdirAsync = promisify(fs.mkdir);
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const copyFileAsync = promisify(fs.copyFile);
const pacCoreFolder = 'pax-core';
const patternImport = new RegExp(/import(?:["'\s]*([\w*${}\n\r\t, ]+)from\s*)?["'\s]["'\s](.*[@\w_-]+)["'\s].*;$/, 'mg')

export default async function ({ rootFolder, pagesFolder = 'pages', distFolder = 'dist', layout = defaultLayout, routeConfig }) {
  const pages = glob.sync(path.join(rootFolder, pagesFolder, '*')) || [];
  const srcFiles = await getAllSrcFiles(pages, pagesFolder, rootFolder, distFolder);
  const head = buildHead({ routeConfig, pages, pagesFolder });
  const { body, title } = await renderRootPage({ routeConfig, rootFolder, pagesFolder });
  const indexHTML = layout({ head, title, body });
  const { corePath, pagesPath } = await checkDirs({ distFolder, pagesFolder });
  // const filesToCopy = await getAllFilesToCopy(pages, pagesFolder, rootFolder, distFolder);

  await Promise.all([
    // pax-core files
    copyFileAsync('./node_modules/@webformula/pax-core/src/Page.js', path.join(corePath, 'Page.js')),
    copyFileAsync('./node_modules/@webformula/pax-core/src/HTMLElementExtended.js', path.join(corePath, 'HTMLElementExtended.js')),
    copyFileAsync('./node_modules/@webformula/pax-core/src/Router.js', path.join(corePath, 'Router.js')),
    copyFileAsync('./node_modules/@webformula/pax-core/src/client.js', path.join(corePath, 'client.js')),
    copyFileAsync('./node_modules/@webformula/pax-core/src/browserIndex.js', path.join(corePath, 'index.js')),

    // write router config
    writeFileAsync(`${corePath}/routerConfig.js`, html`
      export const routerConfig = ${JSON.stringify(routeConfig || {})};
    `),

    // copy over index.html
    writeFileAsync(`./${distFolder}/index.html`, indexHTML),

    copysrcFiles(srcFiles)
  ]).catch(e => console.error(e));
}



async function getAllSrcFiles(pages, pagesFolder, rootFolder, distFolder) {
  const packagejson = await readFileAsync('./package.json');
  const dependencies = JSON.parse(packagejson).dependencies;

  let filesToCopy = [].concat(pages);
  const subImportPaths = await Promise.all(pages.map(sourcePath => evaluteImports(sourcePath, rootFolder, distFolder, dependencies)));
  const files = subImportPaths.reduce((a, b) => {
    a[b.sourcePath] = b;
    return a;
  }, {});

  // recursivly loop thought imports and load new ones
  let newFiles = getNewFilesFromImport(files, dependencies);
  while (newFiles.length) {
    const newImports = await Promise.all(newFiles.map(sourcePath => evaluteImports(sourcePath, rootFolder, distFolder, dependencies)));
    newImports.forEach(a => {
      files[a.sourcePath] = a;
    });
    newFiles = getNewFilesFromImport(files, dependencies);
  }

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
    await writeFileAsync(files[key].distPath, files[key].fileStr);
  }));
}

function getNewFilesFromImport(file, dependencies) {
  return Object.keys(file).reduce((a, filePath) => {
    const nonExisting = file[filePath].imports.map(data => {
      // ignore pax core files
      if (data.path.includes(`${pacCoreFolder}`)) return data.path;
      // ignore installed dependencies in package.json
      if (dependencies[data.path] !== undefined) return data.path;

      // extract file from path
      return path.join(removeFileFromPath(filePath), data.path);
    }).filter(newPath => {
      // ignore pax core files
      if (newPath.includes(`${pacCoreFolder}`)) return false;
      // ignore installed dependencies in package.json
      if (dependencies[newPath] !== undefined) return false;
      return file[newPath] === undefined;
    });
    return a.concat(nonExisting);
  }, []);
}

async function evaluteImports(sourcePath, rootFolder, distFolder, dependencies) {
  const file = await readFileAsync(sourcePath);
  let fileStr = file.toString();
  const imports = extractImports(fileStr);

  // make paths relitive for pax-core
  imports.forEach(item => {
    if (item.path === '@webformula/pax-core') {
      item.browserPath = localizeImportPath(distFolder, `${pacCoreFolder}/index.js`);
      // replace import with browser relitive path
      const newImport = item.full.replace(item.path, item.browserPath);
      fileStr = fileStr.replace(item.full, newImport);
    }

    // temporary fix for global browser dependencies
    // This assumes the user will import the dependcy using a script tag
    else if (dependencies[item.path] !== undefined) {
      fileStr = fileStr.replace(item.full, `// ${item.full} // browser dependencies are global and do not need imports`);
    }
  });

  return {
    sourcePath,
    distPath: sourcePath.replace(rootFolder, distFolder),
    imports,
    fileStr
  };
}

function extractImports(str) {
  return [...str.matchAll(patternImport)].map(v => ({
    full: v[0],
    importNames: v[1].replace('{', '').replace('}', '').replace(/\r?\n|\r/g, '').trim().split(','),
    path: v[2]
  }));
}

function localizeImportPath(destPath, replaceWith) {
  const nestLevel = destPath.split('/').length;
  const dirModifier = `./${[...new Array(nestLevel)].map(() => '../').join('')}`;
  return `${dirModifier}${replaceWith}`;
}

function removeFileFromPath(filePath) {
  let noFilePath = filePath.split('/');
  noFilePath.pop();
  return noFilePath.join('/');
}

async function checkDirs({ distFolder, pagesFolder }) {
  const exists = await existsAsync(distFolder);
  if (!exists) await mkdirAsync(distFolder);

  const corePath = path.join(distFolder, pacCoreFolder);
  const existsPaxCore = await existsAsync(corePath);
  if (!existsPaxCore) await mkdirAsync(corePath);

  const pagesPath = path.join(distFolder, pagesFolder);
  const existsPages = await existsAsync(pagesPath);
  if (!existsPages) await mkdirAsync(pagesPath);

  return {
    corePath,
    pagesPath
  }
}

function buildHead({ routeConfig, pages, pagesFolder }) {
  return html`
    <script type="module" src="pax-core/index.js"></script>

    <script type="module">
      ${pages.map(pagePath => {
        const classFileName = pagePath.split(pagesFolder)[1];
        const className = classFileName.replace('/', '').replace('.js', '');
        return html`
          import ${className} from '/${path.join(pagesFolder, classFileName)}';
          window.${className} = ${className};
        `;
      }).join('\n')}
    </script>

    <script type="module" src="pax-core/client.js"></script>

    <!-- create globally accessable instance of page class -->
    <script type="module">
      import ${routeConfig.root} from '/${path.join(pagesFolder, `${routeConfig.root.replace('.js', '')}.js`)}';

      window.$${routeConfig.root} = new ${routeConfig.root}();
      window.currentPageClass = window.$${routeConfig.root};
      setTimeout(function () {
        window.$${routeConfig.root}.connectedCallback();
      }, 0);
    </script>
  `;
}

async function renderRootPage({ routeConfig, rootFolder, pagesFolder }) {
  if (routeConfig && routeConfig.root) {
    const cwd = process.cwd();
    const rootPagePath = path.join(cwd, rootFolder, pagesFolder, `${routeConfig.root.replace('.js', '')}.js`);
    const rootPageExists = await existsAsync(rootPagePath);
    if (rootPageExists) {
      const rootClass = await import(rootPagePath);
      if (!rootClass.default) throw Error('pages must export using default: "export default class Home extends Page {}"');
      const instance = new rootClass.default();
      return {
        body: buildTemplate(instance),
        title: `<span class="pax-core-title">${instance.title}</span>`
      };
    }
  }

  return {
    body: buildTemplate(),
    title: '<span class="pax-core-title">Home</span>'
  };
}

function buildTemplate(instance) {
  return html`
    <render-block-page>
      ${instance ? instance.template() : ''}
    </render-block-page>
  `;
}
