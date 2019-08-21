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
