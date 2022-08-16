const registeredPages = {};
let initialRouteCompleted = false;
const routes = window.routes.map(route => ({
  ...route,
  routeRegex: new RegExp(route.routeRegexString)
}));
const files = [];


if (window.SPA === true) {
  document.addEventListener('click', async event => {
    // TODO how do i handle external links
    if (!event.target.matches('a[href]')) return;
    event.preventDefault();
    hookUpPage(new URL(event.target.href).pathname);
  });
}

export class Page {
  constructor() {
    // these are set by the route
    this._urlParameters = undefined;
    this._searchParameters = undefined;
  }

  set pageTitle(value) {
    this._pageTitle = value;
  }

  get searchParameters() {
    return this._searchParameters;
  }

  get urlParameters() {
    return this._urlParameters;
  }

  set templateString(value) {
    this._templateString = value;
  }

  // override
  connectedCallback() { }
  disconnectedCallback() { }
  async beforeRender() { }
  async afterRender() { }

  async _renderTemplate() {
    const pageContent = document.querySelector('page-content');
    if (!pageContent) throw Error('Could not find <page-content>');

    await this.beforeRender();

    if (!this._templateString) throw Error('No templateString');
    const renderedTemplate = new Function('page', `return \`${this._templateString}\`;`).call(this, this);

    // TODO replace with setHTML when supported. https://developer.mozilla.org/en-US/docs/Web/API/Element/setHTML
    // currently security concerns should be mitigated by the template literal
    pageContent.innerHTML = renderedTemplate;
    document.querySelector('title').innerText = this.pageTitle;

    await this.afterRender();
  }

  // called by router
  _setUrlData(params = {
    urlParameters: {},
    searchParameters: {}
  }) {
    this._urlParameters = params?.urlParameters || {};
    this._searchParameters = params?.searchParameters || {};
  }
}


function registerPage({
  url,
  pageTitle,
  pageClass,
  // templateString,
  template,
  routeRegex
}) {
  registeredPages[url] = {
    url,
    pageTitle,
    pageClass,
    // templateString,
    template,
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
  let routeMatch = matchRoute(path, registeredPages);

  if (!routeMatch) {
    if (initialRouteCompleted === false) return;
    if (registeredPages._notfound) {
      routeMatch = {
        ...registeredPages._notfound,
        urlParameters: {}
      };
    } else {
      console.warn(`No page found for url: ${url}`);
      return;
    }
  }

  const nextPage = routeMatch.pageClass ? new routeMatch.pageClass() : {};
  nextPage.pageTitle = routeMatch.pageTitle;
  nextPage.templateString = await loadHTML(routeMatch.template);
  // nextPage.templateString = routeMatch.templateString;

  let isRendered = initialRouteCompleted === false;

  // used for initial page. Pages are dynamically loaded; meaning this could be called before page is available.
  if (initialRouteCompleted !== true) initialRouteCompleted = true;

  const urlMatches = doesUrlMatchWindowLocation(url);
  if (!urlMatches) window.history.pushState({}, '', url);

  if (currentPage) currentPage.disconnectedCallback();
  window.page = nextPage;
  if (nextPage._setUrlData) nextPage._setUrlData({
    urlParameters: routeMatch.urlParameters,
    searchParameters: {}
  });

  if (!isRendered) await nextPage._renderTemplate();
  if (nextPage.connectedCallback) nextPage.connectedCallback();
}


async function importJS(path) {
  if (!files[path]) {
    files[path] = import('/' + path);
  }
  return files[path];
}

async function loadHTML(path) {
  if (!files[path]) files[path] = fetchHTML(path);
  return files[path];
}

async function fetchHTML(path) {
  const response = await fetch('/' + path);
  return response.text();
}


async function loadPages() {
  const path = location.pathname;
  // make sure the current page is loaded first
  // if allowSPA = true, then all pages will be loaded

  routes.sort(({ routeRegex }) => path.match(routeRegex) !== null ? -1 : 1);

  // load current page first
  await [routes.shift()].map(async ({
    url,
    pageTitle,
    template,
    controller,
    routeRegex
  }) => {
    const pageModule = controller && await importJS(controller);
    registerPage({
      url,
      pageTitle,
      pageClass: pageModule?.default,
      // templateString,
      template,
      routeRegex
    });
    loadHTML(template);
  });

  await routes.map(async ({
    url,
    pageTitle,
    template,
    controller,
    routeRegex
  }) => {
    const pageModule = controller && await importJS(controller);
    registerPage({
      url,
      pageTitle,
      pageClass: pageModule?.default,
      // templateString,
      template,
      routeRegex
    });
    loadHTML(template);
  });
}

loadPages();
