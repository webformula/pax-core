import { readdir, access } from 'node:fs/promises';
import path from 'node:path';
import { buildPathRegexes } from './helper.js';
import { register } from './router.js';

const CWD = process.cwd();
const controllerFolderPartRegex = /\/(.*?)\//;


export async function configureApp(options) {
  const pagesFolder = options?.pagesFolder || 'app/pages';
  const path404 = options?.path404 || 'app/pages/404/page.html';
  const allowSPA = options?.allowSPA || false;
  let rootAppFolder;

  // TODO can i do this better?
  // root folder needed for file sending. Might be able to remove the need for it.
  if (pagesFolder.includes('/')) {
    const match = pagesFolder.match(/(^[^\/]*\/)/, '');
    if (match) rootAppFolder = match[1];
  }

  const results = await loadApp(pagesFolder);
  register({
    pagesFolder,
    path404,
    allowSPA,
    rootAppFolder,
    ...results
  });
}

async function loadApp(pagesFolder) {
  const controllers = {};
  const controllerPathMap = {};
  const pages = await readdir(pagesFolder);

  await Promise.all(
    pages
      .filter(item => path.extname(item) === '') // folders only
      .map(async item => {
        const controllerPath = path.join(CWD, pagesFolder, item, 'controller.js');
        try {
          await access(controllerPath);
          const results = await registerController(controllerPath, pagesFolder);
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

async function registerController(controllerPath, pagesFolder) {
  const controllerPathMap = {};
  const folder = controllerPath.split(pagesFolder)[1].match(controllerFolderPartRegex)[1];
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
