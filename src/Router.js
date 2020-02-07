export default class Router {
  constructor() {
    this.routes = {};

    // regexes for parsing uri's
    this.PARAMETER_REGEXP = /([:*])(\w+)/g;
    this.WILDCARD_REGEXP = /\*/g;
    this.REPLACE_VARIABLE_REGEXP = '([^\/]+)';
    this.REPLACE_WILDCARD = '(?:.*)';
    this.FOLLOWED_BY_SLASH_REGEXP = '(?:\/$|$)';
    this.MATCH_REGEXP_FLAGS = '';

    if (this.path === '' || this.path === '/') this.showPage();
  }

  init() {
    // browser events for url changes
    window.addEventListener('hashchange', this._resolve.bind(this));
    window.addEventListener('DOMContentLoaded', () => {
      this._resolve(undefined, true);
    });
  }

  add(path, pageLocation) {
    if (this.routes[path]) throw Error(`Path already exists: ${path}`);
    this.routes[path] = pageLocation;
  }

  setRoot(pageLocation) {
    if (this.routes['/']) throw Error('Path already exists: /');
    this.routes['/'] = pageLocation;
  }

  set404(pageLocation) {
    this._notFoundRoute = pageLocation;
  }

  get path() {
    let path = window.location.hash.replace(/.*#/, '');
    if (path.includes('?')) path = path.split('?')[0];
    if (path.charAt(0) !== '/') path = '/'+path;
    return path;
  }

  get current() {
    return this._clean(window.location.href);
  }

  getQueryParameters() {
    return this._extractGETParameters(this.current).split(',').filter(a => !!a).reduce((a, b) => {
      const split = b.split('=');
      a[split[0]] = split[1];
      return a;
    }, {});
  }

  getQueryParameter(name) {
    return this.getQueryParameters()[name];
  }

  addQueryParameter(name, value) {
    const parameters = this.getQueryParameters();
    parameters[name] = value;
    window.location.href = window.location.href.split('?')[0] + '?' + Object.keys(parameters).map(key => `${key}=${parameters[key]}`).join(',');
  }

  getUrlParameters(parseStringOrRegex) {
    if (!parseStringOrRegex) {
      const match = this._match(this.path);
      if (!match) return {};
      return match.params || {};
    }
    const { regexp, paramNames } = this._replaceDynamicURLParts(parseStringOrRegex);
    const match = this.path.replace(/^\/+/, '/').match(regexp);
    return this._regExpResultToParams(match, paramNames);
  }

  getUrlParameter(name) {
    return this.getUrlParameters()[name];
  }


  // --- private ---

  // resolve path and update page
  _resolve(event, initial = false) {
    // prevent page looping
    if (initial === false && event.oldURL === event.newURL);

    const path = this.path;
    const match = this._match(path);

    if (match === false) {
      if (this._notFoundRoute) return this._changePage(this._notFoundRoute);
      else return console.warn('no page found and default not found page setup');
    }

    let url = path;
    let GETParameters = this._extractGETParameters(this.current);
    if (GETParameters) url += `?${GETParameters}`;
    window.location.hash = url;

    // prevent page from loading home on initial render
    if (initial && url === '/') return;
    return this._changePage(match.className);
  }

  // change and render page
  _changePage(className) {
    this._prepCurrentPageFormTransition();

    this._buildNextPage();

    this._transition();


    // figure out scrolling
    // const renderBlock = document.querySelector('render-block-page');
    // // this covers desktop
    // renderBlock.parentNode.scrollTop = 0;
    // // this covers mobile
    // document.documentElement.scrollTop = 0;
  }

  _prepCurrentPageFormTransition() {
    // we are going to add a sedond render block so we need to be able to tell the difference
    const renderBlock = document.querySelector('render-block-page');
    renderBlock.classList.add('previous');

    const currentPage = window.currentPageClass
    // disconnect current page before rendering next one
    currentPage.disconnectedCallback();
    currentPage._disableRender = true;

    const id = '$' + currentPage.constructor.name; // page var name ( $Name.somefunc() )
    window[id] = undefined;
  }

  _buildNextPage(className) {
    // --- handle class ---
    
    // try uppercassing the first letter to follow class standards
    if (!window[className]) className = className.charAt(0).toUpperCase() + className.slice(1);

    const instance = eval(`new ${className}()`);
    const id = '$' + instance.constructor.name; // page var name ( $Name.somefunc() )
    window[id] = instance;
    window.activePage = instance;
    window.currentPageClass = instance;
    window.currentPageClass._disableRender = false;

    const currentRenderBlock = document.querySelector('render-block-page');
    const nextRenderBlock = document.createElement('render-block-page');
    nextRenderBlock.classList.add = 'hide-page-on-load';
    // the render method will find the render-block-page element
    window[id].render();

    currentRenderBlock.insertAdjacentElement('afterend', nextRenderBlock);

    const pageTitle = document.querySelector('title');
    if (pageTitle) pageTitle.innerText = instance.title;

    setTimeout(() => {
      if (window[id].connectedCallback) window[id].connectedCallback();
    }, 0);
  }

  _transition() {
    document.createElementNS('render-block-page:not(.previous)').classList.remove('hide-page-on-load');
  }

  _clean(str) {
    if (str instanceof RegExp) return s;
    return str.replace(/\/+$/, '').replace(/^\/+/, '/');
  }

  _extractGETParameters(url) {
    return url.split(/\?(.*)?$/).slice(1).join('');
  }

  _match(url) {
    let matched = this._findMatchedRoutes(url);
    if (!matched.length) return false;
    else if (matched.length === 1) return matched[0];
    else {
      return matched.sort((a, b) => {
        if (b.params) return 1;
        return -1;
      })[0];
    }
  }

  _findMatchedRoutes(url) {
    return Object.keys(this.routes)
      .map(route => {
        const { regexp, paramNames } = this._replaceDynamicURLParts(this._clean(route));
        const match = url.replace(/^\/+/, '/').match(regexp);
        const params = this._regExpResultToParams(match, paramNames);
        return !match ? false : {
          match,
          route,
          params,
          className: this.routes[route]
        };
      })
      .filter(m => m && m.match[0] !== '');
  }

  _replaceDynamicURLParts(route) {
    let paramNames = [];
    let regexp = '';

    if (route instanceof RegExp) {
      regexp = route;
    } else {
      regexp = new RegExp(
        this._clean(route)
          .replace(this.PARAMETER_REGEXP, (full, dots, name) => {
            paramNames.push(name);
            return this.REPLACE_VARIABLE_REGEXP;
          })
          .replace(this.WILDCARD_REGEXP, this.REPLACE_WILDCARD) + this.FOLLOWED_BY_SLASH_REGEXP, this.MATCH_REGEXP_FLAGS
      );
    }
    return { regexp, paramNames };
  }

  _regExpResultToParams(match, names) {
    if (names.length === 0) return null;
    if (!match) return null;
    return match
      .slice(1, match.length)
      .reduce((params, value, index) => {
        if (params === null) params = {};
        params[names[index]] = decodeURIComponent(value);
        return params;
      }, null);
  }
}
