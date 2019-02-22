module.exports = class Router {
  constructor(routes) {
    this.routes = routes;
    if (this.routes['/404']) this._notFountRoute = this.routes['/404'];

    this.PARAMETER_REGEXP = /([:*])(\w+)/g;
    this.WILDCARD_REGEXP = /\*/g;
    this.REPLACE_VARIABLE_REGEXP = '([^\/]+)';
    this.REPLACE_WILDCARD = '(?:.*)';
    this.FOLLOWED_BY_SLASH_REGEXP = '(?:\/$|$)';
    this.MATCH_REGEXP_FLAGS = '';

    window.addEventListener('hashchange', this.resolve.bind(this));
    window.addEventListener('DOMContentLoaded', () => {
      this.resolve();
    });
  }

  resolve() {
    const path = this.path();
    const match = this.match(path);

    if (match === false) {
      if (this._notFountRoute) return this.changePage(this._notFountRoute);
      else return console.warn('no page found and no default not found page setup');
    }

    let url = path;
    let GETParameters = this.extractGETParameters(this.getCurrent());
    if (GETParameters) url += `?${GETParameters}`;
    window.location.hash = url;
    return this.changePage(match.className);
  }

  changePage(className) {
    // disconnect current page before rendering next one
    if (window.currentPageClass.disconnectedCallback) window.currentPageClass.disconnectedCallback();

    const id = '$'+className;
    window[id] = eval('new ' + className + '()');
    window.currentPageClass = window[id];
    window[id].render();
    const pageTitle = document.querySelector('title');
    if (pageTitle) pageTitle.innerText = window[id].title;
    setTimeout(() => {
      if (window[id].connectedCallback) window[id].connectedCallback();
    }, 0);
  }

  path() {
    let path = window.location.hash.replace(/.*#/, '');
    if (path.includes('?')) path = path.split('?')[0];
    if (path.charAt(0) !== '/') { path = '/'+path; }
    return path;
  }

  getCurrent() {
    return this.clean(window.location.href);
  }

  clean(str) {
    if (str instanceof RegExp) return s;
    return str.replace(/\/+$/, '').replace(/^\/+/, '/');
  }

  extractGETParameters(url) {
    return url.split(/\?(.*)?$/).slice(1).join('');
  }

  getParameters() {
    return this.extractGETParameters(this.getCurrent()).split(',').filter(a => !!a).reduce((a, b) => {
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

  match(url) {
    let matched = this.findMatchedRoutes(url);
    if (!matched.length) return false;
    else if (matched.length === 1) return matched[0];
    else {
      return matched.sort((a, b) => {
        if (b.params) return 1;
        return -1;
      })[0];
    }
  }

  findMatchedRoutes(url) {
    return Object.keys(this.routes)
      .map(route => {
        var { regexp, paramNames } = this.replaceDynamicURLParts(this.clean(route));
        var match = url.replace(/^\/+/, '/').match(regexp);
        var params = this.regExpResultToParams(match, paramNames);
        return !match ? false : {
          match,
          route,
          params,
          className: this.routes[route]
        };
      })
      .filter(m => m && m.match[0] !== '');
  }

  replaceDynamicURLParts(route) {
    let paramNames = [];
    let regexp = '';

    if (route instanceof RegExp) {
      regexp = route;
    } else {
      regexp = new RegExp(
        this.clean(route)
          .replace(this.PARAMETER_REGEXP, (full, dots, name) => {
            paramNames.push(name);
            return this.REPLACE_VARIABLE_REGEXP;
          })
          .replace(this.WILDCARD_REGEXP, this.REPLACE_WILDCARD) + this.FOLLOWED_BY_SLASH_REGEXP, this.MATCH_REGEXP_FLAGS
      );
    }
    return { regexp, paramNames };
  }

  regExpResultToParams(match, names) {
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
