import {
  getPath,
  buildPathRegexes,
  matchPath
} from './helper.js';

const pageClasses = {};
let pathRegexes = [];
let initialRouteCompleted = false;


export function registerPage(pageClass, options = { route: 'path', HTMLTemplateString }) {
  pageClass._templateString = options?.HTMLTemplateString;
  pageClasses[options.route] = pageClass;
  handleInitialRoute();
}

if (window.routeMap) pathRegexes = buildPathRegexes(Object.keys(window.routeMap));


// async function hashchange(event) {
//   const path = getPath();
//   const pageClass = routes[path.replace('/', '')];
//   pageClass.template = await fetchTemplate();
//   pageClass.render();
// }

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
