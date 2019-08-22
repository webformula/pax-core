import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import glob from 'glob';
import tags from 'common-tags';
import HTMLElementExtended from '../HTMLElementExtended.js';
import customElements from '../polyfills/customElements.js';
import { getComponentFiles, removeFileFromPath } from './utils.js';

const { html } = tags;
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const componentNameRegex = /customElements\.define\(('|")(.*)('|")/;

global.HTMLElementExtended = HTMLElementExtended;
global.html = html;


export default async function ({ rootFolder, distFolder }) {
  const cwd = process.cwd();
  const srcFiles = glob.sync(path.join(rootFolder, '**/*.js')) || [];
  const componentFiles = await getComponentFiles(srcFiles);
  const templates = await getTemplates(componentFiles);
  await writeFileAsync(path.join(distFolder, 'component-templates.js'), makeFile(templates));

  // return internal component css files. These should not be inscluded with the concated css
  return templates.filter(s => s.internalStylesFile !== undefined).map(s => s.internalStylesFile);
}

function makeFile(components) {
  return html`
    // create custom element templates
    ${components.map(d => d.templateScript).join('\n')}
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
    let internalStylesFile;
    if (instance.internalStylesFile) {
      internalStylesFile = path.join(removeFileFromPath(filePath), instance.internalStylesFile)
      const internalStylesFileContent = await readFileAsync(path.join(cwd, internalStylesFile));
      styleString = internalStylesFileContent.toString();
    }

    return {
      componentName,
      filePath,
      internalStylesFile,
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
