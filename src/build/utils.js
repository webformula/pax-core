import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const existsAsync = promisify(fs.exists);
const mkdirAsync = promisify(fs.mkdir);

export async function createDir(...paths) {
  const p = path.join.apply(null, paths);
  const exists = await existsAsync(p);
  if (!exists) await mkdirAsync(p, { recursive: true });
  return p;
}

export function removeFileFromPath(filePath) {
  let noFilePath = filePath.split('/');
  noFilePath.pop();
  return noFilePath.join('/');
}
