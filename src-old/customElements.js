const config = require('./config');
const { memoize } = require('./cache');
const components = {};

module.exports = {
  define(name, constructor) {
    if (components[name]) throw Error(`component "${name}" has already been registered. Please change the components name`);
    components[name] = constructor;
  },

  getStaticExternalCSS() {
    if (this.memoize) {
      if (!this.getStaticExternalCSSMemoized) this.getStaticExternalCSSMemoized = memoize(_getStaticExternalCSS);
      return this.getStaticExternalCSSMemoized();
    }
    return _getStaticExternalCSS();
  },

  getStaticFile() {
    if (this.memoize) {
      if (!this.getStaticFileMemoized) this.getStaticFileMemoized = memoize(_getStaticFile);
      return this.getStaticFileMemoized();
    }
    return _getStaticFile();
  }
};

function _getStaticExternalCSS() {
  return Object
    .keys(components)
    .map(key => new components[key]().externalCSS())
    .join('\n');
}

function _getStaticFile() {
  return `
    document.addEventListener("DOMContentLoaded", function (event) {
      ${Object
        .keys(components)
        .map(key => {
          const comp = new components[key]();
          return [
            comp.getTemplateElementAsIIFE(key),
            comp.getClassAsString(key)
          ].join('\n');
        })
        .join('\n')}
    });
  `;
}
