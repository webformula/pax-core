import fs from 'fs';
import path from 'path';
import glob from 'glob';
import { promisify } from 'util';
import { createDir } from './utils.js';

const copyFileAsync = promisify(fs.copyFile);
const mkdirAsync = promisify(fs.mkdir);
const statAsync = promisify(fs.stat);

// copy files
//  from: bases on glob selector
//  to: dest folder based
export default async function ({ distFolder, copyFiles }) {
  if (!copyFiles || !copyFiles.length || !copyFiles[0].to) return [];

  const nestedPaths = await Promise.all(copyFiles.map(async ({ to, from }) => {
    const corePath = await createDir(to);
    const files = glob.sync(path.join(from)) || [];

    const paths = await Promise.all(files.filter(f => path.extname(f) !== '').map(async (f, i) => {
      const fromDir = path.parse(from).dir;
      const fileName = path.parse(f).base;
      const destPath = path.join(f.replace(fromDir, to).replace(`/${fileName}`, ''));
      const destFile = path.join(destPath, fileName)

      // create folders that dont exists
      try {
        await statAsync(destPath);
      } catch (e) {
        await mkdirAsync(destPath, { recursive: true });
      }

      // copy files
      try {
        await copyFileAsync(f, destFile);
        return destFile;
      } catch (e) {
        console.log(e);
        return undefined
      }
    }));

    return paths.filter(f => f !== undefined).map(f => f.replace(distFolder, ''));
  }));

  return nestedPaths.flat();
}


// public/**