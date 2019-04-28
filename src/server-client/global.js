const glob = require('glob');
const path = require('path');

const resolverFileGlob = '**/*.js';
const CWD = process.cwd();
const slash_REG = /^\/|\/$/g;
const globals = {};

Object.defineProperties(globals, {
  loadFolder: {
    value: loadFolder,
    writable: false,
    configurable: false,
    enumerable: false
  },

  buildClient_: {
    value: buildClient,
    writable: false,
    configurable: false,
    enumerable: false
  },

  buildServer_: {
    value: buildServer,
    writable: false,
    configurable: false,
    enumerable: false
  }
});


function loadFolder(uri, ignore = []) {
  const resolverFiles = path.join(uri, resolverFileGlob);
  const jsFiles = glob.sync(resolverFiles, { ignore: ignore }) || [];
  jsFiles.forEach(f => {
    const convertedURL = convertToUrl(f, uri);
    if (globals[convertedURL]) throw Error(`Cannot load module "${convertedURL}", it already exists on global`);
    globals[convertedURL] = require(path.join(CWD, f));
  });
}

function convertToUrl(str, uri) {
  return str
    .replace(uri, '') // remove folder path
    .replace('index.js', '') // do not use index.js. instead use folder
    .replace('.js', '') //js extension
    .replace(slash_REG, ''); // trailing slash
}

function buildClient() {
  return Object.keys(globals).reduce((str, name) => {
    return `${str}\nwindow.${name} = ${globals[name].toString()}`
  }, '');
}

// Do i need this, since the user will just require it?
function buildServer() {

}

module.exports = globals;
