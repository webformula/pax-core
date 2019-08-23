import fs from 'fs';
import { promisify } from 'util';

const readFileAsync = promisify(fs.readFile);


export async function checkPageFiles(files) {
  const content = await Promise.all(files.map(async p => {
    const file = await readFileAsync(p);
    return {
      path: p,
      constainsPage: file.toString().includes('extends Page')
    };
  }));
  return content.filter(({ constainsPage }) => constainsPage === true).map(p => p.path);
}

export async function getComponentFiles(srcFiles) {
  const contents = await Promise.all(srcFiles.map(async p => {
    const file = await readFileAsync(p);
    return {
      path: p,
      isComponent: file.toString().includes('customElements.define')
    };
  }));

  return contents.filter(({ isComponent }) => isComponent === true).map(p => p.path);
}

export function removeFileFromPath(filePath) {
  let noFilePath = filePath.split('/');
  noFilePath.pop();
  return noFilePath.join('/');
}


export function convertPathToName(path) {
  return path.replace('.js', '').replace(/[\/\-\.]/g, '_');
}
