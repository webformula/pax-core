const registeredPages = {};
let initialRouteCompleted = false;



if (window.SPA === true) {
  document.addEventListener('click', async event => {
    // TODO how do i handle external links
    if (!event.target.matches('a[href]')) return;
    event.preventDefault();
    hookUpPage(new URL(event.target.href).pathname);
  });
}



export function registerPage({
  url,
  pageTitle,
  pageClass,
  templateString,
  routeRegex
}) {
  registeredPages[url] = {
    url,
    pageTitle,
    pageClass,
    templateString,
    routeRegex
  };
  handleInitialRoute();
}

function handleInitialRoute() {
  if (initialRouteCompleted === true) return;
  hookUpPage(location.pathname);
}

function doesUrlMatchWindowLocation(url) {
  if (url === window.location.href) return true;
  if (url === window.location.pathname) return true;
  return false;
}

function matchRoute(path, routes) {
  const found = Object.values(routes).find(({ routeRegex }) => path.match(routeRegex) !== null);
  if (!found) return;

  const match = path.match(found.routeRegex);
  return {
    ...found,
    urlParameters: match.groups
  };
}

async function hookUpPage(url) {
  const currentPage = window.page;
  const path = url || location.pathname;
  const routeMatch = matchRoute(path, registeredPages);
  if (!routeMatch) {
    if (initialRouteCompleted === true) console.warn(`No page found for url: ${url}`);
    return;
  }

  const nextPage = new routeMatch.pageClass();
  nextPage.pageTitle = routeMatch.pageTitle;
  nextPage.templateString = routeMatch.templateString;

  let isRendered = initialRouteCompleted === false;

  // used for initial page. Pages are dynamically loaded; meaning this could be called before page is available.
  if (initialRouteCompleted !== true) initialRouteCompleted = true;

  const urlMatches = doesUrlMatchWindowLocation(url);
  if (!urlMatches) window.history.pushState({}, '', url);

  if (currentPage) currentPage.disconnectedCallback();
  window.page = nextPage;
  nextPage._setUrlData({
    urlParameters: routeMatch.urlParameters,
    searchParameters: {}
  });

  if (!isRendered) await nextPage._renderTemplate();
  nextPage.connectedCallback();
}
