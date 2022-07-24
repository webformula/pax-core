import { readdir, access } from 'node:fs/promises';
import path from 'node:path';
import { buildPathRegexes } from './helper.js';
import { register } from './router.js';

const CWD = process.cwd();
const controllerFolderPartRegex = /\/(.*?)\//;


export async function configureApp(options) {
  const path404 = options?.path404 || 'app/pages/404/page.html';
  const allowSPA = options?.allowSPA || false;
  const pageFolderPath = options?.pageFolderPath || 'app/pages';
  const splitPageFolderPath = pageFolderPath.split('/');
  const pageFolder = splitPageFolderPath.pop();
  const appPath = splitPageFolderPath.join('/');

  const results = await loadApp(pageFolderPath);
  register({
    pageFolderPath,
    pageFolder,
    appPath,
    path404,
    allowSPA,
    ...results
  });
}

async function loadApp(pageFolderPath) {
  const controllers = {};
  const controllerPathMap = {};
  const pages = await readdir(pageFolderPath);

  await Promise.all(
    pages
      .filter(item => path.extname(item) === '') // folders only
      .map(async item => {
        const controllerPath = path.join(CWD, pageFolderPath, item, 'controller.js');
        try {
          await access(controllerPath);
          const results = await registerController(controllerPath, pageFolderPath);
          controllers[results.folder] = results.controller;
          Object.assign(controllerPathMap, results.controllerPathMap);
        } catch (e) { }
      })
  );

  const pathRegexes = buildPathRegexes(Object.keys(controllerPathMap));

  return {
    controllers,
    controllerPathMap,
    pathRegexes
  };
}

async function registerController(controllerPath, pageFolderPath) {
  const controllerPathMap = {};
  const folder = controllerPath.split(pageFolderPath)[1].match(controllerFolderPartRegex)[1];
  const imported = await import(controllerPath);
  imported.default.folder = folder;
  controllerPathMap[folder] = folder;
  (imported.default.routes || []).forEach(route => {
    controllerPathMap[route] = folder;
  });

  return {
    folder,
    controller: imported.default,
    controllerPathMap
  };
}
