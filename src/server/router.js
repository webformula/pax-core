import path from 'node:path';
import { readFile, readdir, access } from 'node:fs/promises';
import { buildPathRegexes, matchPath } from '../helper.js';


const CWD = process.cwd();
const controllers = {};
const controllerPathMap = {}; // allow multiple paths to map to same page
let pathRegexes = [];
let pagesFolder;
let rootAppFolder = '';
let indexTemplate;


export function routeMiddleware(options = {
  pagesFolder: 'app/pages',
  routeAlternatives: {'alt-path': 'pages-folder-name'}
}) {
  pagesFolder = options?.pagesFolder || 'app/pages';

  // TODO can i do this better?
  // root folder needed for file sending. Might be able to remove the need for it.
  if (pagesFolder.includes('/')) {
    const match = pagesFolder.match(/(^[^\/]*\/)/, '');
    if (match) rootAppFolder = match[1];
  }

  // dynamically load controllers
  readdir(pagesFolder)
    .then(async values => {
      await Promise.all(values
        .filter(item => path.extname(item) === '')
        .map(async item => {
          try {
            await access(path.join(CWD, pagesFolder, item, 'controller.js'));
            await registerController(path.join(CWD, pagesFolder, item, 'controller.js'));
          } catch (e) {}
        }));
    })
    .catch(e => console.log(e));

  // NOTE express specific right now
  return async function routeMiddleware(req, res, next) {
    const cleanPath = cleanReqPath(req.path);

    // send static file
    if (isStaticFile(cleanPath)) return await staticHandler(req, res);

    const matched = matchPath(cleanPath, pathRegexes);
    if (!matched) next(new Error('no matching path'));

    const controller = controllers[controllerPathMap[matched.configuredPath]];

    try {
      const pageContent = await controller.renderTemplate(req, pagesFolder);
      const scriptTags = await getScriptTags(controller);
      const indexTemplate = await getIndexTemplate();
      const index = renderTemplate(indexTemplate, { pageContent, scriptTags });

      res.send(index);
    } catch (e) {
      return next(e);
    }
  }
}


const controllerFolderPartRegex = /\/(.*?)\//;
async function registerController(controllerPath) {
  const folder = controllerPath.split(pagesFolder)[1].match(controllerFolderPartRegex)[1];
  const imported = await import(controllerPath);
  imported.default.folder = folder;
  controllers[folder] = imported.default;
  controllerPathMap[folder] = folder;
  imported.default.routes.forEach(route => {
    controllerPathMap[route] = folder;
  });
  pathRegexes = buildPathRegexes(Object.keys(controllerPathMap));
}

function isStaticFile(cleanPath) {
  const extension = path.extname(cleanPath);
  if (extension && extension !== '.html') return true;
  if (cleanPath.includes('@webformula/pax-core')) return true;
  if (matchPath(cleanPath, pathRegexes)) return false;
  return true;
}

async function staticHandler(req, res) {
  const extension = path.extname(req.path);

  // for some reason the files can come through without pax-core in the path
  // auto map to client code
  if (req.path.includes('/@webformula')) {
    if (!extension) {
      return res.sendFile(path.join(CWD, 'node_modules', '@webformula/pax-core/src/client/index.js'));
    }

    // make sure pax-core is in path
    return res.sendFile(path.join(CWD, 'node_modules/@webformula/pax-core/src/client', req.path.replace('@webformula/pax-core/client', '').replace('@webformula/pax-core', '').replace('@webformula', '')));
  }

  // NOTE modify pax cor import for relative path
  // Allows the use of import '@webformula/pax-core'
  if (extension === '.js') {
    const file = await readFile(path.join(CWD, rootAppFolder, req.path), 'utf-8');
    res.set('Content-Type', 'application/javascript');
    if (file.includes('/@webformula')) res.send(file);
    return res.send(file.replace('@webformula', '/@webformula'));
  }

  return res.sendFile(path.join(CWD, rootAppFolder, req.path));
}


async function getIndexTemplate() {
  if (!indexTemplate) indexTemplate = (await readFile(`${pagesFolder}/index.html`)).toString();
  return indexTemplate;
}

const leadingSlashRegex = /^\//;
function cleanReqPath(reqPath) {
  let cleanPath = reqPath.replace(leadingSlashRegex, '');
  if (cleanPath === '') cleanPath = 'home';
  return cleanPath;
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
window.routeMap = ${JSON.stringify(controllerPathMap, null, 2)};
</script>

<script src="/@webformula/pax-core/client" type="module"></script>`;
}
