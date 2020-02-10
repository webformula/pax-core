import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import glob from 'glob';
import tags from 'common-tags';
import window from '../polyfills/window.js';
import navigator from '../polyfills/navigator.js';
import document from '../polyfills/document.js';
import localStorage from '../polyfills/localStorage.js';
import location from '../polyfills/location.js';
import HTMLElementExtended from '../HTMLElementExtended.js';
import customElements from '../polyfills/customElements.js';
import { removeFileFromPath } from './utils.js';

const { html } = tags;
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const componentNameRegex = /customElements\.define\(('|")(.*)('|")/;

global.HTMLElementExtended = HTMLElementExtended;
global.html = html;

export default async function ({ distFolder, componentFiles }) {
  const cwd = process.cwd();
  const templates = await Promise.all(componentFiles.map(async file => {
    await import(path.join(cwd, file.sourcePath));
    const componentClass = customElements.getComponent(file.componentName);
    const componentVarName = file.componentName.replace(/[-]+/g, '');
    const instance = new componentClass();
    const template = instance.template();
    let styleString = instance.styles ? instance.styles() : '';
    let internalStylesFile;
    if (instance.internalStylesFile) {
      internalStylesFile = path.join(removeFileFromPath(file.sourcePath), instance.internalStylesFile)
      const internalStylesFileContent = await readFileAsync(path.join(cwd, internalStylesFile));
      styleString = internalStylesFileContent.toString();
    }
    return {
      internalStylesFile,
      templateScript: !(template || styleString) ? undefined : html`
        var ${componentVarName} = document.createElement('template');
        ${componentVarName}.setAttribute('id','${file.componentName}--template');
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
  await writeFileAsync(path.join(distFolder, 'component-templates.js'), makeFile(templates));

  // return internal component css files. These should not be inscluded with the concated css
  return templates.filter(s => s.internalStylesFile !== undefined).map(s => s.internalStylesFile);
}

function makeFile(components) {
  return html`
    // create custom element templates
    window.addEventListener('DOMContentLoaded', function () {
      ${components.map(d => d.templateScript).join('\n')}
    });
  `;
}
