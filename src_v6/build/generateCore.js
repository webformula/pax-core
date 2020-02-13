import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { createDir } from './utils.js';
import { html } from '../tags.js';

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const copyFileAsync = promisify(fs.copyFile);
const includes = {
  'HTMLElementExtended.js': true,
  'Page.js': true,
  'Router.js': true,
  'client.js': true,
  'tags.js': true
};

export default async function ({ distFolder }, { includeRouter = true, includePage = true, includeTags = true, includesHTMLExtended = true, customHTMLElementExtendedName }) {
  const corePath = await createDir(distFolder, '@webformula', 'pax-core');
  const _includes = Object.assign({}, includes, {
    'HTMLElementExtended.js': includesHTMLExtended,
    'Page.js': includePage,
    'Router.js': includeRouter,
    'client.js': includeRouter,
    'tags.js': includeTags
  });

  // get included file names
  const fileNames = Object.keys(_includes).filter(key => _includes[key] === true);
  // create renamed array
  const fileRenames = fileNames.reduce((a, b) => {
    if (b === 'HTMLElementExtended.js' && customHTMLElementExtendedName) a[b] = customHTMLElementExtendedName;
    else a[b] = b;
    return a;
  }, {});

  // copy core files
  const paths = await Promise.all(fileNames.map(async f => {
    // handle renaming HTMLElementExtended class
    if (f === 'HTMLElementExtended.js') {
      const content = await readFileAsync('./node_modules/@webformula/pax-core/src/HTMLElementExtended.js');
      const wPath = path.join(corePath, fileRenames[f]);
      await writeFileAsync(wPath, content.toString().replace('HTMLElementExtended', fileRenames[f].replace('.js', '')));
      return wPath;
    }
    const writePath = path.join(corePath, f);
    await copyFileAsync(`./node_modules/@webformula/pax-core/src/${f}`, writePath);
    return writePath;
  }));

  // create index file
  const wPath = path.join(corePath, 'index.js');
  await writeFileAsync(wPath, createIndex(fileNames, fileRenames));
  paths.push(wPath);

  return paths.map(p => p.replace(distFolder, ''));
}

function createIndex(fileNames, fileRenames) {
  fileNames = fileNames.filter(f => f !== 'client.js');
  return html`
    ${fileNames.map(f => html`import ${fileRenames[f].replace('.js', '')} from './${fileRenames[f]}';`).join('\n')}
    ${fileNames.includes('tags.js') ? 'const { html, css } = tags;' : ''}
    export {
      ${fileNames.map(f => {
        if (f === 'tags.js') return 'html,\ncss';
        return fileRenames[f].replace('.js', '');
      }).join(',\n')}
    };
  `;
}