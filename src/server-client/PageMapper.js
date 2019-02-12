const path = require('path');
const glob = require('glob');

const resolverFileGlob = '**/*.js';
const CWD = process.cwd();
const slash_REG = /\/$/;

/*
 * PageMapper will require all the files in a folder and its sub folders and let you use `findPage` to access them
 * This makes it easy to setup a single route to manage all your pages.
 * You can also setup a default 404 page here
 */
module.exports = class PageMapper {
  constructor(uri, ignore = []) {
    const resolverFiles = path.join(uri, resolverFileGlob);
    const jsFiles = glob.sync(resolverFiles, { ignore: ignore }) || [];
    this.routeMap = {};
    this.modules = jsFiles.reduce((a, f) => {
      const convertedURL = convertToUrl(f, uri);
      const mod = require(path.join(CWD, f));
      a[convertedURL] = mod;
      if (convertedURL.includes('404')) this._404 = mod;
      this.routeMap[convertedURL] = this.getClassName(mod)
      return a;
    }, {});
  }

  findPage(url) {
    if (url && url[0] !== '/') url = '/' + url;
    if (this._root && url === '/') return this._root;
    const module = this.modules[url.replace(slash_REG, '')];
    if (typeof module !== 'function' && typeof module !== 'object') return this._404 || noop;
    return this.modules[url.replace(slash_REG, '')];
  }

  getClassName(mod) {
    return mod.name;
  }

  getIndex() {
    return this._root;
  }

  get routes() {
    return this.routeMap;
  }

  set pageNotFount(url) {
    this._404 = this.findPage(url);
    this.routeMap['/404'] = this.getClassName(this._404);
  }

  set root(url) {
    this._root = this.findPage(url);
    this.routeMap['/'] = this.getClassName(this._root);
  }
};

function convertToUrl(str, uri) {
  return str
    .replace(uri, '') // remove folder path
    .replace('index.js', '') // do not use index.js. insterad use folder
    .replace('.js', '') //js extension
    .replace(slash_REG, ''); // trailing slash
}

function noop() {
  return {};
}
