const pageClasses = {};
let pathRegexes = [];
let initialRouteCompleted = false;

const containsVariableOrWildcardRegex = /\/:|\*/g;
const parameterRegex = /([:*])(\w+)/g;
const wildcardRegex = /\*/g;
const replaceWidCardString = '(?:.*)';
const followedBySlashRegexString = '(?:\/$|$)';


export function registerPage(pageClass, options = { route: 'path' }) {
  pageClasses[options.route] = pageClass;
  handleInitialRoute();
}

if (window.pageClassPaths) pageLoader();



async function pageLoader() {
  const path = getPath();
  const pageClassPaths = window.pageClassPaths.sort((a) => a[0] === path ? -1 : 1);
  pathRegexes = buildPathRegexes(Object.keys(window.routeMap));
  await Promise.all(pageClassPaths.map(async ([route, path]) => {
    const instance = await import(path);
    registerPage(instance.default, { route });
  }));
}


// window.addEventListener('hashchange', hashchange);
// window.addEventListener('DOMContentLoaded', () => {
//   // handleInitialRoute();
// });

// async function hashchange(event) {
//   const path = getPath();
//   const pageClass = routes[path.replace('/', '')];
//   pageClass.template = await fetchTemplate();
//   pageClass.render();
// }

const leadingSlashRegex = /^\//;
const urlHashRegex = /.*#/;
function getPath() {
  let path;
  
  if (window.serverRendered) path = window.location.pathname.replace(leadingSlashRegex, '');
  // SPA with hashes
  else path = window.location.hash.replace(urlHashRegex, '');

  if (path.indexOf('?') > -1) path = path.split('?')[0];
  return path;
}

function handleInitialRoute() {
  if (initialRouteCompleted === true) return; 

  const path = getPath();
  const match = matchPath(path, pathRegexes);
  if (!match) return;

  const pageClassRoute = window.routeMap[match.configuredPath];
  if (!pageClassRoute || !pageClasses[pageClassRoute]) return;
  initialRouteCompleted = true;

  window.page = new pageClasses[pageClassRoute]();
  window.page._setUrlData({
    urlParameters: match.parameters,
    searchParameters: {}
  });

  // TODO render template
  if (!window.serverRendered) {
    
  }

  window.page.connectedCallback();
}




// TODO import of helper.js is broken on front end
export function buildPathRegexes(allPaths = []) {
  return allPaths.map(path => {
    let regex;
    if (path.match(containsVariableOrWildcardRegex) === null) regex = new RegExp(`^${path}$`);
    else regex = new RegExp(
      `^${path
        .replace(parameterRegex, (_full, _dots, name) => `(?<${name}>[^\/]+)`)
        .replace(wildcardRegex, replaceWidCardString)
      }${followedBySlashRegexString}$`,
      ''
    );

    return [regex, path];
  });
}

export function matchPath(reqPath, pathRegexes) {
  const found = pathRegexes.find(([regex]) => reqPath.match(regex) !== null);
  if (!found) return;

  const match = reqPath.match(found[0]);
  return {
    reqPath,
    configuredPath: found[1],
    parameters: match.groups,
    match: reqPath.match(match[0])
  };
}
