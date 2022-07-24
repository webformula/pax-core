import {
  parseURL,
  buildPathRegexes,
  matchPath
} from './helper.js';

const allowSPA = window.allowSPA;
const registeredPages = {};
const routeMap = [];
let initialRouteCompleted = false;


if (allowSPA === true) {
  document.addEventListener('click', async event => {
    // TODO how do i handle external links
    if (!event.target.matches('a[href]')) return;
    event.preventDefault();
    hookUpPage(event.target.href);
  });
}


export function registerPage({
  defaultRoute,
  routes,
  pageTitle,
  pageClass,
  templateString
}) {
  registeredPages[defaultRoute] = {
    defaultRoute,
    routes,
    pageTitle,
    pageClass,
    templateString
  };

  routeMap.push(...buildPathRegexes(routes, defaultRoute));
  handleInitialRoute();
}




async function hookUpPage(url) {
  const currentPage = window.page;
  const path = parseURL(url);
  const match = matchPath(path, routeMap);
  if (!match) {
    if (initialRouteCompleted === true) console.warn(`No page found for url: ${url}`);
    return;
  }

  const pageConfiguration = registeredPages[match.configuredPath];
  if (!pageConfiguration) {
    if (initialRouteCompleted === true) console.warn(`No page found for url: ${url}`);
    return;
  }

  console.log(pageConfiguration);
  const nextPage = new pageConfiguration.pageClass();
  nextPage.pageTitle = pageConfiguration.pageTitle;
  nextPage.templateString = pageConfiguration.templateString;

  let isRendered = initialRouteCompleted === false;
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

  if (!isRendered) await nextPage._renderTemplate();

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
