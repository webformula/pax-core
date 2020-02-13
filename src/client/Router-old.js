export class Router {
  constructor() {
    this.routes = {};
    this.classReference = {};

    this.pageClassnameRegex = /class\s(.*)\sextends/;

    // regexes for parsing uri's
    this.PARAMETER_REGEXP = /([:*])(\w+)/g;
    this.WILDCARD_REGEXP = /\*/g;
    this.REPLACE_VARIABLE_REGEXP = '([^\/]+)';
    this.REPLACE_WILDCARD = '(?:.*)';
    this.FOLLOWED_BY_SLASH_REGEXP = '(?:\/$|$)';
    this.MATCH_REGEXP_FLAGS = '';

    // if (this.path === '' || this.path === '/') this.showPage();
  }

  init() {
    // browser events for url changes
    window.addEventListener('hashchange', this._resolve.bind(this));
    window.addEventListener('DOMContentLoaded', () => {
      this._resolve(undefined, true);
    });
  }

  addGlobalString(path, pageLocation) {
    if (this.routes[path]) throw Error(`Path already exists: ${path}`);
    this.routes[path] = pageLocation;
  }

  addClass(Class, defaultPath) {
    const classMatch = this.pageClassnameRegex.exec(Class);
    const className = classMatch ? classMatch[1] : defaultPath.split('/').pop().replace('.js', '');

    if (defaultPath) {
      if (this.routes[defaultPath]) throw Error(`Path already exists: ${defaultPath}`);
      this.classReference[className] = Class;
      this.routes[defaultPath] = className;
    }

    (Class.routes || []).forEach(path => {
      if (defaultPath === path) return;
      if (this.routes[path]) throw Error(`Path already exists: ${path}`);
      this.classReference[className] = Class;
      this.routes[path] = className;
    });
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
    if (path.charAt(0) !== '/') path = '/' + path;
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

  // showPage() {
  //   document.querySelector('page-render-block:not(.previous)').classList.remove('hide-page-on-load');
  // }


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
    if (initial && url === '/' && this._pageIsPreRendered()) return;
    return this._changePage(match);
  }

  // change and render page
  _changePage({ className, Class }) {
    this._prepCurrentPageFormTransition();
    this._buildNextPage({ className, Class });

    requestAnimationFrame(() => {
      this._transition();
    });


    // figure out scrolling
    // const renderBlock = document.querySelector('page-render-block');
    // // this covers desktop
    // renderBlock.parentNode.scrollTop = 0;
    // // this covers mobile
    // document.documentElement.scrollTop = 0;
  }

  _pageIsPreRendered() {
    const renderBlock = document.querySelector('page-render-block');
    if (renderBlock && renderBlock.children.length > 0) return true;
    return false;
  }

  _isInitailPage() {
    const renderBlock = document.querySelector('page-render-block');
    if (!renderBlock) return true;

    if (renderBlock.classList.contains('initial-page')) return true;
    if (!renderBlock.classList.contains('loaded-page')) return true;
    if (renderBlock.children.length = 0) return true;
    return false;
  }

  _prepCurrentPageFormTransition() {
    // we are going to add a sedond render block so we need to be able to tell the difference
    const renderBlock = document.querySelector('page-render-block');
    if (!renderBlock) return;

    // handle initial page
    if (this._isInitailPage()) {
      renderBlock.classList.remove('initial-page')
      return;
    }
    renderBlock.classList.add('previous');

    const currentPage = window.currentPageClass
    // disconnect current page before rendering next one
    currentPage.disconnectedCallback();
    currentPage._disableRender = true;

    const id = '$' + currentPage.constructor.name; // page var name ( $Name.somefunc() )
    window[id] = undefined;
  }

  _buildNextPage({ className, Class }) {
    // --- handle class ---

    let instance;
    if (className) {
      if (this.classReference[className]) instance = new this.classReference[className]();
      else if (window[className]) instance = eval(`new ${window[className]}()`);
      else {
        // try uppercassing the first letter to follow class standards
        className = className.charAt(0).toUpperCase() + className.slice(1);
        if (window[className]) instance = eval(`new ${window[className]}()`);
        else if (this.classReference[className]) instance = new this.classReference[className]();
      }
    } else {
      instance = new Class();
    }

    const id = '$' + instance.constructor.name; // page var name ( $Name.somefunc() )
    window[id] = instance;
    window.activePage = instance;
    window.currentPageClass = instance;
    window.currentPageClass._disableRender = false;

    const currentRenderBlock = document.querySelector('page-render-block');
    let nextRenderBlock;
    // create new render block
    if (currentRenderBlock.classList.contains('previous')) {
      nextRenderBlock = document.createElement('page-render-block');
      // nextRenderBlock.classList.add('hide-page-on-load');
      nextRenderBlock.classList.add('next');
      // the render method will find the page-render-block element
      currentRenderBlock.insertAdjacentElement('afterend', nextRenderBlock);
    }

    window[id].render();

    const pageTitle = document.querySelector('title');
    if (pageTitle) pageTitle.innerText = instance.title;

    setTimeout(() => {
      if (window[id].connectedCallback) window[id].connectedCallback();
    }, 0);
  }

  _transition() {
    const transitionBlockPage = document.querySelector('.transition-block-page ');
    if (transitionBlockPage) transitionBlockPage.classList.add('in-transition');
    const previousRenderBlock = document.querySelector('page-render-block.previous');
    const nextRenderBlock = document.querySelector('page-render-block:not(.previous)');

    if (previousRenderBlock) previousRenderBlock.classList.add('animate-transition');
    nextRenderBlock.classList.add('animate-transition');
    this.showPage();

    let complete = false;
    const self = this;

    function transitionComplete() {
      if (!complete) return complete = true;
      
      previousRenderBlock.removeEventListener('transitionend', transitionComplete);
      nextRenderBlock.removeEventListener('transitionend', transitionComplete);
      self._onTransitionComplete();
    }

    if (previousRenderBlock) {
      previousRenderBlock.addEventListener('transitionend', transitionComplete);
      nextRenderBlock.addEventListener('transitionend', transitionComplete);
    } else {
      this._onTransitionComplete();
    }
  }

  _onTransitionComplete() {
    const previousRenderBlock = document.querySelector('page-render-block.previous');
    if (previousRenderBlock) previousRenderBlock.remove();

    const nextRenderBlock = document.querySelector('page-render-block:not(.previous)');
    nextRenderBlock.classList.remove('next');
    nextRenderBlock.classList.remove('animate-transition');

    const transitionBlockPage = document.querySelector('.transition-block-page');
    if (transitionBlockPage) transitionBlockPage.classList.remove('in-transition');
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
        const isString = typeof this.routes[route] === 'string';

        return !match ? false : {
          match,
          route,
          params,
          [isString ? 'className' : 'Class']: this.routes[route]
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
