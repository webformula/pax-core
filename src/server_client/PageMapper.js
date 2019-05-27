const path = require('path');
const glob = require('glob');
const Page = require('./Page.js');

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
      this.routeMap[convertedURL] = this._getClassName(mod)
      return a;
    }, {});
  }

  // Find page based on uri: (folder/filenameWithoutExtension)
  findPage(uri) {
    if (uri && uri[0] !== '/') uri = '/' + uri;
    if (this._root && uri === '/') return this._root;
    const module = this.modules[uri.replace(slash_REG, '')];
    // cannot find page class or page function
    if (!module || (!(module.prototype instanceof Page) && typeof module !== 'function')) return this._404 || noop;
    return module;
  }

  // get root
  getIndex() {
    return this._root;
  }

  get routes() {
    return this.routeMap;
  }

  get pageNotFount() {
    return this._404;
  }

  set pageNotFount(url) {
    this._404 = this.findPage(url);
    this.routeMap['/404'] = this._getClassName(this._404);
  }

  get root() {
    return this._root;
  }

  set root(url) {
    this._root = this.findPage(url);
    this.routeMap['/'] = this._getClassName(this._root);
  }

  _getClassName(mod) {
    return mod.name;
  }
};

// take a file path and strip it of extra slashed and extentions to turn it into a uri
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
