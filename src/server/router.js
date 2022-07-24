import path from 'node:path';
import { readFile, access } from 'node:fs/promises';
import { matchPath, parseURL } from './helper.js';


const CWD = process.cwd();
const configData = {};

export function register(params = {
  pageFolderPath,
  pageFolder,
  appPath,
  path404,
  allowSPA,
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
    const pageContent = await controller.renderTemplate(cleanPath, configData.pageFolderPath);
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
  if (reqPath === '/') reqPath = `/${configData.pageFolder}/home/page.html`;
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
    const file = await readFile(path.join(CWD, configData.appPath, reqPath), 'utf-8');

    let fileData;
    if (file.includes('/@webformula')) fileData = res.send(file);
    else fileData = file.replace('@webformula', '/@webformula');

    return {
      headers: { 'Content-Type': 'application/javascript' },
      statusCode: 200,
      responseBody: fileData
    };
  }

  const filePath = path.join(CWD, configData.appPath, reqPath);
  try {
    await access(filePath);
  } catch (e) {
    return { filePath: path.join(CWD, configData.path404) };
  }
  return { filePath };
}

async function getIndexTemplate() {
  if (!configData.indexTemplate) configData.indexTemplate = (await readFile(`${configData.pageFolderPath}/index.html`)).toString();
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
    scriptTagsCache[cacheKey] = configData.allowSPA === false
      ? [{
          defaultRoute: controller.folder,
          routes: [...new Set([controller.folder, ...(controller.routes || [])])],
          pageTitle: controller.pageTitle,
          filePath: path.join('/', configData.pageFolder, controller.folder, controller.classPath),
          templatePath: path.join('/', configData.pageFolder, controller.folder, controller.templatePath)
        }]
      : Object.values(configData.controllers).map(controller => ({
        defaultRoute: controller.folder,
        routes: [...new Set([controller.folder, ...(controller.routes || [])])],
        pageTitle: controller.pageTitle,
        filePath: path.join('/', configData.pageFolder, controller.folder, controller.classPath),
        templatePath: path.join('/', configData.pageFolder, controller.folder, controller.templatePath)
      }));
  }
  
  return `<script>
window.serverRendered = true;
window.allowSPA = ${configData.allowSPA};
window.pageFolder = '${configData.pageFolder}';
window.pageConfigurations = ${JSON.stringify(scriptTagsCache[cacheKey], null, 2)};
</script>

<script src="/@webformula/pax-core/client" type="module"></script>`;
}
