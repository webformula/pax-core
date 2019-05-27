module.exports = class Router {
  constructor(routes) {
    this.routes = routes;
    if (this.routes['/404']) this._notFountRoute = this.routes['/404'];

    // regexes for parsing uri's
    this.PARAMETER_REGEXP = /([:*])(\w+)/g;
    this.WILDCARD_REGEXP = /\*/g;
    this.REPLACE_VARIABLE_REGEXP = '([^\/]+)';
    this.REPLACE_WILDCARD = '(?:.*)';
    this.FOLLOWED_BY_SLASH_REGEXP = '(?:\/$|$)';
    this.MATCH_REGEXP_FLAGS = '';

    // browser events for url changes
    window.addEventListener('hashchange', this._resolve.bind(this));
    window.addEventListener('DOMContentLoaded', () => {
      this._resolve();
    });
  }

  // uri path
  path() {
    let path = window.location.hash.replace(/.*#/, '');
    if (path.includes('?')) path = path.split('?')[0];
    if (path.charAt(0) !== '/') { path = '/'+path; }
    return path;
  }

  getCurrent() {
    return this._clean(window.location.href);
  }

  getParameters() {
    return this._extractGETParameters(this.getCurrent()).split(',').filter(a => !!a).reduce((a, b) => {
      const split = b.split('=');
      a[split[0]] = split[1];
      return a;
    }, {});
  }

  getParameter(name) {
    return this.getParameters()[name];
  }

  addParameter(name, value) {
    const url = this.getCurrent();
    const parameters = this.getParameters();
    parameters[name] = value;
    window.location.href = window.location.href.split('?')[0] + '?' + Object.keys(parameters).map(key => `${key}=${parameters[key]}`).join(',');
  }

  // resolve path and update page
  _resolve() {
    const path = this.path();
    const match = this._match(path);

    if (match === false) {
      if (this._notFountRoute) return this._changePage(this._notFountRoute);
      else return console.warn('no page found and no default not found page setup');
    }

    let url = path;
    let GETParameters = this._extractGETParameters(this.getCurrent());
    if (GETParameters) url += `?${GETParameters}`;
    window.location.hash = url;
    return this._changePage(match.className);
  }

  // change and render page
  _changePage(className) {
    // disconnect current page before rendering next one
    window.currentPageClass.disconnectedCallback();

    const id = '$'+className; // page var name ( $Name.somefunc() )
    window[id] = eval('new ' + className + '()');
    window.currentPageClass = window[id];
    window[id].render();
    const pageTitle = document.querySelector('title');
    if (pageTitle) pageTitle.innerText = window[id].title;
    setTimeout(() => {
      if (window[id].connectedCallback) window[id].connectedCallback();
    }, 0);
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
        var { regexp, paramNames } = this._replaceDynamicURLParts(this._clean(route));
        var match = url.replace(/^\/+/, '/').match(regexp);
        var params = this._regExpResultToParams(match, paramNames);
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
};
