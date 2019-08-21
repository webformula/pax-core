import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import glob from 'glob';
import tags from 'common-tags';
import customElements from '../polyfills/customElements.js';
import HTMLElementExtended from '../HTMLElementExtended.js';

const { html } = tags;
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const componentNameRegex = /customElements\.define\(('|")(.*)('|")/;

global.HTMLElementExtended = HTMLElementExtended;
global.html = html;


export default async function ({ rootFolder, distFolder }) {
  const srcFiles = glob.sync(path.join(rootFolder, '**/*.js')) || [];
  const componentFiles = await getComponentFiles(srcFiles);
  const templates = await getTemplates(componentFiles);
  console.log(makeFile(templates));
}

function makeFile(components) {
  return html`
    // create custom element templates
    document.addEventListener('DOMContentLoaded', function (event) {
      ${components.map(d => d.templateScript).join('\n')}
    });
  `;
}

async function getTemplates(componentFiles) {
  const cwd = process.cwd();
  return Promise.all(componentFiles.map(async filePath => {
    await import(path.join(cwd, filePath));
    const file = await readFileAsync(filePath);
    const fileStr = file.toString();
    const componentName = componentNameRegex.exec(fileStr)[2];
    const componentClass = customElements.getComponent(componentName);
    const componentVarName = componentName.replace(/[-]+/g, '');
    const instance = new componentClass();
    const template = instance.template();
    let styleString = instance.styles ? instance.styles() : '';
    if (instance.stylesFile) {
      const stylesFile = await readFileAsync(path.join(cwd, instance.stylesFile));
      styleString = stylesFile.toString();
    }

    return {
      componentName,
      filePath,
      stylesFile: instance.stylesFile,
      styleString,
      template,
      templateScript: !(template || styleString) ? undefined : html`
        var ${componentVarName} = document.createElement('template');
        ${componentVarName}.setAttribute('id','${componentName}--template');
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
    };
  }));
}

async function getComponentFiles(srcFiles) {
  const contents = await Promise.all(srcFiles.map(async p => {
    const file = await readFileAsync(p);
    return {
      path: p,
      isComponent: file.toString().includes('customElements.define')
    };
  }));

  return contents.filter(({ isComponent }) => isComponent === true).map(p => p.path);
}
