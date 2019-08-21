import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import glob from 'glob';
import tags from 'common-tags';
import customElements from './polyfills/customElements.js';
import HTMLElementExtended from './HTMLElementExtended.js';
import document from './polyfills/document.js';
// import tags from 'common-tags';


const { html } = tags;
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const existsAsync = promisify(fs.exists);
const mkdirAsync = promisify(fs.mkdir);
const regex = /customElements\.define\(('|")(.*)('|")/;

global.HTMLElementExtended = HTMLElementExtended;
global.html = html;


export default async function ({ rootFolder, distFolder = 'dist' }) {
  const jsfiles = glob.sync(path.join(rootFolder, '**/*.js')) || [];
  const cssfiles = glob.sync(path.join(rootFolder, '**/*.css')) || [];
  const categorized = await categorizeFiles(jsfiles);

  // build components js
  const components = await buildComponents(categorized.filter(d => d.isComponent));
  const file = makeFile(components);

  // build css
  const cssStr = await buildCSS(cssfiles, components.filter(d => d.stylesFile !== undefined).map(d => d.stylesFile.replace(/^\/+/, '')));
  await checkDirs({ distFolder });
  await Promise.all([
    writeFileAsync(`./${distFolder}/components.js`, file),
    writeFileAsync(`./${distFolder}/components.css`, cssStr)
  ]);
}

function categorizeFiles(filePaths) {
  return Promise.all(filePaths.map(async filePath => {
    const file = await readFileAsync(filePath);
    const fileStr = file.toString();
    const fileExtension = filePath.split('.').pop();
    let isComponent = false;
    let componentName;

    if (['js', 'mjs', 'jsx'].includes(fileExtension)) {
      isComponent = fileStr.includes('customElements.define');
      if (isComponent) componentName = regex.exec(fileStr)[2];
    }

    return {
      filePath,
      fileExtension,
      isComponent,
      componentName,
      fileStr
    };
  }));
}

async function buildCSS(files, styleFiles) {
  const cwd = process.cwd();
  const arr = await Promise.all(files.filter(filePath => !styleFiles.includes(filePath)).map(async filePath => {
    const file = await readFileAsync(path.join(cwd, filePath));
    return file.toString();
  }));
  return arr.join('\n');
}

async function buildComponents(componentsInfo) {
  return Promise.all(componentsInfo.map(async data => {
    const { templateScript, stylesFile } = await buildFileClass(data);
    return {
      componentName: data.componentName,
      filePath: data.filePath,
      fileStr: data.fileStr,
      templateScript,
      stylesFile
    };
  }));
}

async function buildFileClass(data) {
  const cwd = process.cwd();
  await import(path.join(cwd, data.filePath));
  const componentClass = customElements.getComponent(data.componentName);
  const componentName = data.componentName;
  const componentVarName = componentName.replace(/[-]+/g, '');
  const instance = new componentClass();
  let styleString = instance.styles ? instance.styles() : '';
  if (instance.stylesFile) {
    const stylesFile = await readFileAsync(path.join(cwd, instance.stylesFile));
    styleString = stylesFile.toString();
  }

  const template = instance.template();
  let templateScript = '';
  if (template || styleString) {
    templateScript = html`
      var ${componentVarName} = document.createElement('template');
      ${componentVarName}.setAttribute('id','${data.componentName}--template');
      ${componentVarName}.innerHTML= \`
        <style>
          ${styleString}
        </style>
        <render-block>
          ${instance.template()}
        </render-block>
      \`;
      document.body.insertAdjacentElement('beforeend', ${componentVarName});
    `
  }

  return {
    stylesFile: instance.stylesFile,
    templateScript
  };
}


function makeFile(components) {
  return html`
    document.addEventListener('DOMContentLoaded', function (event) {
      // custom element templates
      ${components.map(d => d.templateScript).join('\n')}

      // custom elements
      ${components.map(d => d.fileStr).join('\n')}
    });
  `;
}

async function checkDirs({ distFolder }) {
  const exists = await existsAsync(distFolder);
  if (!exists) await mkdirAsync(distFolder);
}
