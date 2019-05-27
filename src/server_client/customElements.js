const fs = require('fs');
const path = require('path');
const HTMLElement = require('./HTMLElement.js')
const HTMLElementExtended = require('./HTMLElementExtended.js')
const { html, stripIndents } = require('common-tags');
const css = html;
const components = {};

module.exports = {
  define(name, constructor) {
    if (components[name]) throw Error(`component "${name}" has already been registered. Please change the components name`);
    components[name] = constructor;
  },

  getStaticExternalStyle() {
    // memoize
    return _getStaticExternalStyle();
  },

  getStaticFile() {
    // memoize
    return _getStaticFile();
  }
};


function _getStaticExternalStyle() {
  return Object
    .keys(components)
    .map(key => new components[key](key).externalStyles())
    .join('\n');
}

function _getStaticFile() {
  return `
    document.addEventListener("DOMContentLoaded", function (event) {
      ${Object
        .keys(components)
        .map(key => buildComponentScript(key, components[key]))
        .join('\n\n')}
    });
  `;
}

function buildComponentScript(name, _class) {
  const instance = eval('new '+_class);
  let styleString = '';
  if (instance.stylesFile) styleString = fs.readFileSync(path.relative(process.cwd(), instance.stylesFile()));
  else styleString = instance.styles();

  // this code will create the tempalte for cloning
  const templateIIFE = `(function(){
    var t=document.createElement('template');
    t.setAttribute('id','${name}--template');
    t.innerHTML=\`
    <style>
      ${styleString}
    </style>
    <render-block>
      ${instance.template()}
    </render-block>
    \`;
    document.body.insertAdjacentElement('beforeend', t);
  }());`;
  return `${templateIIFE}\n\ncustomElements.define("${name}", ${_class.toString().replace('super()', `super("${name}")`)});`;
}
