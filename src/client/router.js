import {
  parseURL,
  buildPathRegexes,
  matchPath
} from './helper.js';

const serverRendered = window.serverRendered || false;
const allowSPA = !serverRendered ? true : window.allowSPA;
const routeMap = window.routeMap;
const pageClasses = {};
const pageTemplateStrings = {};
let pathRegexes = [];
let initialRouteCompleted = false;


export function registerPage(pageClass, options = { route: 'path', HTMLTemplateString }) {
  pageTemplateStrings[options.route] = options?.HTMLTemplateString;
  pageClasses[options.route] = pageClass;
  handleInitialRoute();
}



if (routeMap) pathRegexes = buildPathRegexes(Object.keys(routeMap));
if (allowSPA === true) {
  document.addEventListener('click', async event => {
    // TODO how do i handle external links
    if (!event.target.matches('a[href]')) return;
    event.preventDefault();
    hookUpPage(event.target.href);
  });
}


async function hookUpPage(url) {
  const currentPage = window.page;
  const path = parseURL(url);
  const match = matchPath(path, pathRegexes);
  if (!match) {
    if (initialRouteCompleted === true) console.warn(`No page found for url: ${url}`);
    return;
  }

  const pageClassRoute = routeMap[match.configuredPath];
  if (!pageClassRoute || !pageClasses[pageClassRoute]) {
    if (initialRouteCompleted === true) console.warn(`No page found for url: ${url}`);
    return;
  }

  const nextPage = new pageClasses[pageClassRoute]();
  if (serverRendered === true && pageTemplateStrings[pageClassRoute]) nextPage.templateString = pageTemplateStrings[pageClassRoute];

  // used for initial page. Pages are dynamically loaded; meaning this could be called before page is available.
  if (initialRouteCompleted !== true) initialRouteCompleted = true;

  const urlMatches = doesUrlMatchWindowLocation(url);
  if (!urlMatches) window.history.pushState({}, '', url);

  if (currentPage) currentPage.disconnectedCallback();
  window.page = nextPage;
  nextPage._setUrlData({
    urlParameters: match.parameters,
    searchParameters: {}
  });

  if (!urlMatches || (urlMatches && serverRendered !== true)) await nextPage._renderTemplate();

  nextPage.connectedCallback();
}

function doesUrlMatchWindowLocation(url) {
  if (url === window.location.href) return true;
  if (url === window.location.pathname) return true;
  return false;
}

function handleInitialRoute() {
  if (initialRouteCompleted === true) return;
  hookUpPage(window.location.pathname);
}
