const containsVariableOrWildcardRegex = /\/:|\*/g;
const parameterRegex = /([:*])(\w+)/g;
const wildcardRegex = /\*/g;
const replaceWidCardString = '(?:.*)';
const followedBySlashRegexString = '(?:\/$|$)';
const routeConfigs = [];
const files = {};

document.addEventListener('click', async event => {
  if (!event.target.matches('a[href]')) return;

  // allow external links
  if (event.target.getAttribute('href').includes('://')) return;

  event.preventDefault();
  hookUpPage(new URL(event.target.href));
});


export function registerPage(pageClass, routes) {
  routes = routes || pageClass.routes;
  if (!routes) {
    console.warn('No routes provided for page');
    return;
  }

  [].concat(routes).forEach(value => {
    // TODO check for dup route
    const routeRegex = buildRouteRegex(value);
    [].concat(routes).forEach(value => routeConfigs.push({
      route: value,
      routeRegex,
      pageClass: pageClass.constructor
    }));

    const match = location.pathname.match(routeRegex);
    if (match !== null) hookUpPage(location);
  });
}

export async function loadHTML(path) {
  if (!files[path]) files[path] = fetchHTML(path);
  return files[path];
}


async function handleHashChange(locationObject) {
  const hash = locationObject.hash;
  if (hash === location.hash) return;
  window.history.pushState({}, '', hash);
  if (hash) window.dispatchEvent(new Event('hashchange'));
}


async function hookUpPage(locationObject) {
  const url = locationObject.pathname;
  const currentPage = window.page;
  if (currentPage && url === location.pathname) return handleHashChange(locationObject);
  
  const path = url || location.pathname;
  let routeMatch = matchRoute(path);
  if (currentPage === path) return;

  if (!routeMatch) {
    // if (notFoundPage) {
    //   routeMatch = {
    //     ...notFoundPage,
    //     urlParameters: {}
    //   };
    // } else {
      console.warn(`No page found for url: ${url}`);
      return;
    // }
  }
  const nextPage = routeMatch.pageClass ? new routeMatch.pageClass() : {};
  nextPage.pageTitle = routeMatch.pageTitle;
  if (nextPage.templateString) {
    if (nextPage.templateString.match(/.*\.html$/) !== null) {
      nextPage.templateString = await loadHTML(nextPage.templateString);
    }
  }

  // TODO look into when we should fire location change.
  // If the location change does not file when urls match, then it can mess up highlight js in the docs
  const urlMatches = doesUrlMatchWindowLocation(url);
  const hashMatches = locationObject.hash === location.hash;
  // window.dispatchEvent(new Event('locationchange'));
  if (!urlMatches) {
    window.history.pushState({}, '', `${url}${locationObject.hash}`);
    window.dispatchEvent(new Event('locationchange'));
  }
  if (locationObject.hash && !hashMatches) window.dispatchEvent(new Event('hashchange'));
  

  if (currentPage && currentPage.disconnectedCallback) currentPage.disconnectedCallback();
  window.page = nextPage;
  if (nextPage._setUrlData) nextPage._setUrlData({
    urlParameters: routeMatch.urlParameters,
    searchParameters: {}
  });

  await nextPage._renderTemplate();
  document.querySelector('html').scrollTop = 0;
  if (nextPage.connectedCallback) nextPage.connectedCallback();
}

function buildRouteRegex(route) {
  let regex;
  if (route.match(containsVariableOrWildcardRegex) === null) regex = new RegExp(`^${route}$`);
  else regex = new RegExp(
    `^${route
      .replace(parameterRegex, (_full, _dots, name) => `(?<${name}>[^\/]+)`)
      .replace(wildcardRegex, replaceWidCardString)
    }${followedBySlashRegexString}$`,
    ''
  );

  return regex;
}

function matchRoute(path) {
  const found = routeConfigs.find(({ routeRegex }) => path.match(routeRegex) !== null);
  if (!found) return;

  const match = path.match(found.routeRegex);
  return {
    ...found,
    urlParameters: match.groups
  };
}

async function fetchHTML(path) {
  const response = await fetch('/' + path);
  return response.text();
}

function doesUrlMatchWindowLocation(url) {
  if (url === location.href) return true;
  if (url === location.pathname) return true;
  return false;
}