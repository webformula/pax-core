// TODO make sure initial pages do not render an extra time
export default new class {
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

    this._transitionPages = false;
    this.bound_onTransitionComplete = this._onTransitionComplete.bind(this);
  }

  init() {
    // browser events for url changes
    window.addEventListener('hashchange', this._resolve.bind(this));
    window.addEventListener('DOMContentLoaded', () => {
      this._resolve(undefined, true);
    });
  }

  get transitionPages() {
    return this._transitionPages;
  }

  set transitionPages(value) {
    this._transitionPages = !!value;
  }

  get path() {
    let path = window.location.hash.replace(/.*#/, '');
    if (path.includes('?')) path = path.split('?')[0];
    if (path.charAt(0) !== '/') path = '/' + path;
    return path;
  }

  get urlParameters() {
    const match = this._match(this.path);
    return match ? match.params : {};
  }

  get searchParamters() {
    return this._extractSearchParameters(this._clean(window.location.href)).split(',').filter(a => !!a).reduce((a, b) => {
      const split = b.split('=');
      a[split[0]] = split[1];
      return a;
    }, {});
  }

  addTransitionCSS() {
    document.body.insertAdjacentHTML('beforebegin', `<style>
      page-container {
        display: flex;
      }

      page-container.in-transition {
        overflow-x: hidden;
      }

      page-render-block {
        width: 100%;
        flex-shrink: 0;
        opacity: 1;
      }

      page-render-block.before-transition-page-out {
        pointer-events: none;
        user-select: none;
      }

      page-render-block.before-transition-page-in {
        transform: scale(0.9) translateX(-100%);
        opacity: 0;
      }

      page-render-block.transition-page-out {
        transform: scale(0.9);
        opacity: 0;
        transition: opacity .16s linear,
                    transform .26s cubic-bezier(0,0,.2,1);
      }

      page-render-block.transition-page-in {
        transform: scale(1) translateX(-100%);
        transform-origin: -50% 0;
        opacity: 1;
        transition: opacity .18s linear,
                    transform .26s cubic-bezier(0,0,.2,1);
      }
    </style>`);
  }
  
  addClass(Class, optionalPath) {
    const classMatch = this.pageClassnameRegex.exec(Class);
    const className = classMatch ? classMatch[1] : optionalPath.split('/').pop().replace('.js', '');

    // handle optional path
    if (optionalPath) {
      if (this.routes[optionalPath]) throw Error(`Path already exists: ${optionalPath}`);
      this.classReference[className] = Class;
      this.routes[optionalPath] = className;
    }

    // add routes from page class
    (Class.routes || []).forEach(path => {
      if (optionalPath === path) return;
      if (this.routes[path]) throw Error(`Path already exists: ${path}`);
      this.classReference[className] = Class;
      this.routes[path] = className;
    });
  }

  set404({ Class }) {
    if (Class) this._notFoundRouteClass = Class;
  }


  // --- private ---

  _resolve(event, initial = false) {
    // no change
    if (initial === false && event.oldURL === event.newURL) return;

    const path = this.path;
    const match = this._match(path);

    if (!match) {
      if (this._notFoundRouteClass) return this._changePage(this._notFoundRouteClass);
      else return console.warn('no page found and no default not found page setup');
    }

    let url = path;
    if (initial && this._pageIsPreRendered()) return;

    // TODO
    let GETParameters = this._extractSearchParameters(this._clean(window.location.href));
    if (GETParameters) url += `?${GETParameters}`;
    window.location.hash = url;

    // prevent page change when no difference exists
    // this will cover the case of adding the #/ to the url
    if (event) {
      const urlDiff = event.oldURL.length > event.newURL.length ? event.oldURL.replace(event.newURL, '') : event.newURL.replace(event.oldURL, '');
      if (urlDiff === '' || urlDiff === '#/') return
    }

    // prevent page from loading on initial render
    return this._changePage(match);
  }

  _changePage({ Class }) {
    if (!Class) throw Error('no class found');

    const pageContainer = document.querySelector('page-container');
    if (!pageContainer) throw Error('<page-container> required for router to work');

    const renderBlock = document.querySelector('page-render-block');

    // --- inital page ---
    // A page can have no pre-rendered pages.
    // create render-block and render page immidiatly
    if (!renderBlock) {
      pageContainer.appendChild(document.createElement('page-render-block'));

      // create page class instance
      window.activePage = new Class();
      window.activePage.render();

      return;
    }
    
    // --- no transiton ---
    // change page immideatly if transitions are not on
    if (!this._transitionPages) {
      window.activePage.disconnectedCallback();
      // create page class instance
      window.activePage = new Class();
      window.activePage.render();

      setTimeout(() => {
        if (window.activePage.connectedCallback) window.activePage.connectedCallback();
      }, 0);
      return;
    }


    //--- transiton ---

    // prep for current page transition out
    renderBlock.classList.add('before-transition-page-out');
    window.activePage._disableRender = true;
    window.activePage.disconnectedCallback();

    // build next page and prep for transition
    const nextRenderBlock = document.createElement('page-render-block');
    nextRenderBlock.classList.add('before-transition-page-in');
    renderBlock.insertAdjacentElement('afterend', nextRenderBlock);

    const pageInstance = new Class();
    window.activePage = pageInstance;
    pageInstance.render();

    const pageTitle = document.querySelector('title');
    if (pageTitle) pageTitle.innerText = pageInstance.title;

    // TODO
    // can i use requestAnimationFrame?
    // should i call this after transition
    setTimeout(() => {
      if (pageInstance.connectedCallback) pageInstance.connectedCallback();
    }, 0);

    // --- transition ---
    pageContainer.classList.add('in-transition');

    // CONTINUE
    renderBlock.classList.add('transition-page-out');
    nextRenderBlock.classList.add('transition-page-in');

    renderBlock.addEventListener('transitionend', this.bound_onTransitionComplete);
    nextRenderBlock.addEventListener('transitionend', this.bound_onTransitionComplete);
  }

  _onTransitionComplete({ target }) {
    target.removeEventListener('transitionend', this.bound_onTransitionComplete);
    // remove old page
    if (target.classList.contains('transition-page-out')) target.remove();
    // remove animation state from new page
    else {
      target.classList.remove('before-transition-page-in');
      target.classList.remove('transition-page-in');
    }

    // remove transition state from page container
    if (!document.querySelector('page-render-block.previous') && !document.querySelector('page-render-block.next')) {
      document.querySelector('page-container').classList.remove('in-transition');
    }
  }
  

  _pageIsPreRendered() {
    const renderBlock = document.querySelector('page-render-block');
    if (renderBlock && renderBlock.children.length > 0) return true;
    return false;
  }

  _clean(str) {
    if (str instanceof RegExp) return s;
    return str.replace(/\/+$/, '').replace(/^\/+/, '/');
  }

  _extractSearchParameters(url) {
    return url.split(/\?(.*)?$/).slice(1).join('');
  }



  // --- matching ---

  _match(path) {
    let matched = this._findMatchedRoutes(path);
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
    return Object.entries(this.routes)
      .map(([route, className]) => {
        const { regexp, paramNames } = this._replaceDynamicURLParts(this._clean(route));
        const match = url.replace(/^\/+/, '/').match(regexp);
        const params = this._regExpResultToParams(match, paramNames);
        const Class = this.classReference[className];

        return !match ? false : {
          match,
          route,
          params,
          className,
          Class
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