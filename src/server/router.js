import path from 'node:path';
import { readFile, readdir, access } from 'node:fs/promises';
import { buildPathRegexes, matchPath, cleanReqPath } from '../helper.js';


const CWD = process.cwd();
const controllerFolderPartRegex = /\/(.*?)\//;
const controllers = {};
const controllerPathMap = {}; // allow multiple paths to map to same page
let pathRegexes = [];
let pagesFolder;
let rootAppFolder = '';
let indexTemplate;
let path404;


export function configureApp(options) {
  pagesFolder = options?.pagesFolder || 'app/pages';
  path404 = options?.path404 || 'app/pages/404/page.html';

  // TODO can i do this better?
  // root folder needed for file sending. Might be able to remove the need for it.
  if (pagesFolder.includes('/')) {
    const match = pagesFolder.match(/(^[^\/]*\/)/, '');
    if (match) rootAppFolder = match[1];
  }

  loadControllers();
}

export async function handleRoute(urlPath, body, urlPathParameters, urlSearchParameters) {
  const cleanPath = cleanReqPath(urlPath);
  if (cleanPath === '') cleanPath = 'home';

  // send static file
  if (isStaticFile(cleanPath)) return await staticHandler(cleanPath);

  const matched = matchPath(cleanPath, pathRegexes);
  if (!matched) throw Error('no matching path');

  const controller = controllers[controllerPathMap[matched.configuredPath]];

  try {
    const pageContent = await controller.renderTemplate(cleanPath, pagesFolder);
    const scriptTags = await getScriptTags(controller);
    const indexTemplate = await getIndexTemplate();
    const index = renderTemplate(indexTemplate, { pageContent, scriptTags, pageTitle: controller.pageTitle });
    return {
      headers: { 'Content-Type': 'text/html' },
      statusCode: 200,
      responseBody: index
    };
  } catch (error) {
    return { error };
  }
}


async function loadControllers() {
  const pages = await readdir(pagesFolder);
  await Promise.all(
    pages
      .filter(item => path.extname(item) === '')
      .map(async item => {
        const itemPath = path.join(CWD, pagesFolder, item, 'controller.js');
        try {
          await access(itemPath);
          await registerController(itemPath);
        } catch (e) { }
      })
  );
}

async function registerController(controllerPath) {
  const folder = controllerPath.split(pagesFolder)[1].match(controllerFolderPartRegex)[1];
  const imported = await import(controllerPath);
  imported.default.folder = folder;
  controllers[folder] = imported.default;
  controllerPathMap[folder] = folder;
  (imported.default.routes || []).forEach(route => {
    controllerPathMap[route] = folder;
  });
  pathRegexes = buildPathRegexes(Object.keys(controllerPathMap));
}

function isStaticFile(cleanPath) {
  const extension = path.extname(cleanPath);
  if (extension && extension !== '.html') return true;
  if (cleanPath.includes('@webformula/pax-core')) return true;
  if (matchPath(cleanPath, pathRegexes)) return false;
  if (cleanPath === 'home') true;
  return true;
}

async function staticHandler(reqPath) {
  if (reqPath === '/') reqPath = `/${pagesFolder.replace(rootAppFolder, '')}/home/page.html`;
  const extension = path.extname(reqPath);

  // for some reason the files can come through without pax-core in the path
  // auto map to client code
  if (reqPath.includes('@webformula')) {
    if (!extension) {
      return {
        filePath: path.join(CWD, 'node_modules', '@webformula/pax-core/src/client/index.js')
      };
    }

    // make sure pax-core is in path
    return {
      filePath: path.join(CWD, 'node_modules/@webformula/pax-core/src/client', reqPath.replace('@webformula/pax-core/client', '').replace('@webformula/pax-core', '').replace('@webformula', ''))
    };
  }

  // NOTE modify pax cor import for relative path
  // Allows the use of import '@webformula/pax-core'
  if (extension === '.js') {
    const file = await readFile(path.join(CWD, rootAppFolder, reqPath), 'utf-8');

    let fileData;
    if (file.includes('/@webformula')) fileData = res.send(file);
    else fileData = file.replace('@webformula', '/@webformula');

    return {
      headers: { 'Content-Type': 'application/javascript' },
      statusCode: 200,
      responseBody: fileData
    };
  }

  const filePath = path.join(CWD, rootAppFolder, reqPath);
  try {
    await access(filePath);
  } catch (e) {
    return { filePath: path.join(CWD, path404) };
  }
  return { filePath };
}

async function getIndexTemplate() {
  if (!indexTemplate) indexTemplate = (await readFile(`${pagesFolder}/index.html`)).toString();
  return indexTemplate;
}

function renderTemplate(templateString, data) {
  const page = data;
  return new Function('page', `return \`${templateString}\`;`).call(data, page);
}

async function getScriptTags(controller) {
  return `<script>
window.serverRendered = true;
window.pagesFolder = '${pagesFolder}';
window.pageClassPaths = ${JSON.stringify(Object.values(controllers).map(controller => ([
  controller.folder,
  path.join('/', pagesFolder, controller.folder, controller.classPath).replace(rootAppFolder, '')
])), null, 2)};
window.pageClassHTMLTemplatePaths = ${JSON.stringify(Object.fromEntries(Object.values(controllers).map(controller => ([
  controller.folder,
  path.join('/', pagesFolder, controller.folder, controller.templatePath).replace(rootAppFolder, '')
]))), null, 2)};
window.routeMap = ${JSON.stringify(controllerPathMap, null, 2)};
</script>

<script src="/@webformula/pax-core/client" type="module"></script>`;
}
