import path from 'node:path';
import { readFile, access } from 'node:fs/promises';
import { matchPath, parseURL } from './helper.js';


const CWD = process.cwd();
const configData = {};

export function register(params = {
  pagesFolder,
  path404,
  allowSPA,
  rootAppFolder,
  controllers,
  controllerPathMap,
  pathRegexes
}) {
  Object.assign(configData, params);
}

export async function handleRoute(urlPath, body, urlPathParameters, urlSearchParameters) {
  const cleanPath = parseURL(urlPath);
  if (isStaticFile(cleanPath)) return await staticHandler(cleanPath);

  const matched = matchPath(cleanPath, configData.pathRegexes);
  if (!matched) throw Error('no matching path');

  const controller = configData.controllers[configData.controllerPathMap[matched.configuredPath]];

  try {
    const pageContent = await controller.renderTemplate(cleanPath, configData.pagesFolder);
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

function isStaticFile(cleanPath) {
  const extension = path.extname(cleanPath);
  if (extension && extension !== '.html') return true;
  if (cleanPath.includes('@webformula/pax-core')) return true;
  if (matchPath(cleanPath, configData.pathRegexes)) return false;
  if (cleanPath === 'home') true;
  return true;
}

async function staticHandler(reqPath) {
  if (reqPath === '/') reqPath = `/${configData.pagesFolder.replace(configData.rootAppFolder, '')}/home/page.html`;
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
    const file = await readFile(path.join(CWD, configData.rootAppFolder, reqPath), 'utf-8');

    let fileData;
    if (file.includes('/@webformula')) fileData = res.send(file);
    else fileData = file.replace('@webformula', '/@webformula');

    return {
      headers: { 'Content-Type': 'application/javascript' },
      statusCode: 200,
      responseBody: fileData
    };
  }

  const filePath = path.join(CWD, configData.rootAppFolder, reqPath);
  try {
    await access(filePath);
  } catch (e) {
    return { filePath: path.join(CWD, configData.path404) };
  }
  return { filePath };
}

async function getIndexTemplate() {
  if (!configData.indexTemplate) configData.indexTemplate = (await readFile(`${configData.pagesFolder}/index.html`)).toString();
  return configData.indexTemplate;
}

function renderTemplate(templateString, data) {
  const page = data;
  return new Function('page', `return \`${templateString}\`;`).call(data, page);
}

const scriptTagsCache = {};
async function getScriptTags(controller) {
  const cacheKey = `${controller.folder}-allowSPA${configData.allowSPA}`;
  if (!scriptTagsCache[cacheKey]) {
    scriptTagsCache[cacheKey] = {};
    scriptTagsCache[cacheKey].pageClassPaths = configData.allowSPA === false
      ? [[controller.folder, path.join('/', configData.pagesFolder, controller.folder, controller.classPath).replace(configData.rootAppFolder, '')]]
      : Object.values(configData.controllers).map(controller => ([
        controller.folder,
        path.join('/', configData.pagesFolder, controller.folder, controller.classPath).replace(configData.rootAppFolder, '')
      ]));

    scriptTagsCache[cacheKey].pageClassHTMLTemplatePaths = configData.allowSPA === false
      ? { [controller.folder]: path.join('/', configData.pagesFolder, controller.folder, controller.templatePath).replace(configData.rootAppFolder, '') }
      : Object.fromEntries(Object.values(configData.controllers).map(controller => ([
        controller.folder,
        path.join('/', configData.pagesFolder, controller.folder, controller.templatePath).replace(configData.rootAppFolder, '')
      ])));

    scriptTagsCache[cacheKey].routeMap = configData.allowSPA === false
      ? Object.fromEntries(Object.entries(configData.controllerPathMap).filter(([_, folder]) => folder === controller.folder))
      : configData.controllerPathMap;
  }
  
  return `<script>
window.serverRendered = true;
window.allowSPA = ${configData.allowSPA};
window.pagesFolder = '${configData.pagesFolder}';
window.pageClassPaths = ${JSON.stringify(scriptTagsCache[cacheKey].pageClassPaths, null, 2)};
window.pageClassHTMLTemplatePaths = ${JSON.stringify(scriptTagsCache[cacheKey].pageClassHTMLTemplatePaths, null, 2)};
window.routeMap = ${JSON.stringify(scriptTagsCache[cacheKey].routeMap, null, 2)};
</script>

<script src="/@webformula/pax-core/client" type="module"></script>`;
}
