// const config = require('./config');
// const { memoize } = require('./cache');
const fs = require('fs');
const path = require('path');
const HTMLElement = require('./HTMLElement')
const { html, stripIndents } = require('common-tags');
const cssStr = html;
const components = {};

module.exports = {
  define(name, constructor) {
    if (components[name]) throw Error(`component "${name}" has already been registered. Please change the components name`);
    components[name] = constructor;
  },

  getStaticExternalCSS() {
    // if (this.memoize) {
    //   if (!this.getStaticExternalCSSMemoized) this.getStaticExternalCSSMemoized = memoize(_getStaticExternalCSS);
    //   return this.getStaticExternalCSSMemoized();
    // }
    return _getStaticExternalCSS();
  },

  getStaticFile() {
    // if (this.memoize) {
    //   if (!this.getStaticFileMemoized) this.getStaticFileMemoized = memoize(_getStaticFile);
    //   return this.getStaticFileMemoized();
    // }
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
        .map(key => buildComponentScript(key, components[key]))
        .join('\n\n')}
    });
  `;
}

function buildComponentScript(name, _class) {
  const { partial, full } = buildHTMLElementExtended(name, _class.toString());
  const instance = eval('new '+partial);

  let cssSTR = '';
  if (instance.cssFile) cssSTR = fs.readFileSync(path.relative(process.cwd(), instance.cssFile()));
  else cssSTR = instance.css();
  const templateIIFE = `(function(){
    var t=document.createElement('template');
    t.setAttribute('id','${name}');
    t.innerHTML=\`
    <style>
      ${cssSTR}
    </style>
    <render-block>
      ${instance.template()}
    </render-block>
    \`;
    document.body.insertAdjacentElement('beforeend', t);
  }());`;
  return `${templateIIFE}\n\ncustomElements.define("${name}", ${full});`;
}

function buildHTMLElementExtended(name, content) {
  if (!content.includes('HTMLElementExtended')) return content;

  // get component name
  const id = toCamelCase(name);
  const classContent = getClassContent(content);
  let { preConstructor, constructor, postConstructor } = splitOnConstructor(classContent)
  // constructor = addLineToConstructor(constructor, `this.setAttribute('id', '$${id}');`);
  const hasCSS = content.includes('css()'); // TODO use regex to allow for space
  const hasTemplate = content.includes('template()'); // TODO use regex to allow for space
  const modifiedContent = `
    ${preConstructor}
    ${constructor}
    ${postConstructor}

    ${hasCSS ? '' : 'css() { return ""; }'}
    ${hasTemplate ? '' : 'template() { return ""; }'}
  `;

  return {
    partial: `
      class ${id} extends HTMLElement {
        ${modifiedContent}
        render() {}
        cloneTemplate() {}
      }
    `,
    full: `
      class ${id} extends HTMLElement {
        ${modifiedContent}

        render() {
          const renderBlock = this.shadowRoot.querySelector('render-block');
          if (!renderBlock) throw Error('Could not find <render-block>');
          renderBlock.innerHTML = this.template();
        }

        cloneTemplate(rerender = false) {
          var template = document.getElementById('${name}');
          var templateContent = template.content;
          var shadowRoot = this.shadowRoot ? this.shadowRoot : this.attachShadow({mode: 'open'});
          var clone = templateContent.cloneNode(true);
          if (rerender) clone.querySelector('render-block').innerHTML = this.template();
          shadowRoot.appendChild(clone);
        }
      }
    `
  };
}

function splitOnConstructor(classContent) {
  const cpos = classContent.indexOf('constructor');
  if (cpos > -1) {
    let constructor = classContent.slice(cpos);
    const closingBracketIndex = constructor.search(/}[\n\r\s]+/g);
    return {
      preConstructor: classContent.slice(0, cpos),
      constructor: constructor.slice(0, closingBracketIndex + 1),
      postConstructor: constructor.slice(closingBracketIndex + 1)
    };
  }

  return {
    preConstructor: '',
    constructor: 'constructor() {\nsuper();\n}',
    postConstructor: classContent
  };
}

function getClassContent(content) {
  return content.slice(content.indexOf('{') + 1, content.lastIndexOf('}'));
}

function getComponentName(content) {
  return content.match(/define\(["'](.*?)["']/)[1];
}

function toCamelCase(name) {
  return name.replace(/\-([a-z])/g, m => m.toUpperCase()).replace(/-/g,'');
}

function extractClass(content) {
  let closingIndex = content.lastIndexOf(');');
  if (closingIndex === -1) closingIndex = content.lastIndexOf(')');
  return content.slice(content.indexOf(',') + 1, closingIndex);
}

// function addLineToConstructor(constructor, line) {
//   return `${constructor.slice(0, constructor.lastIndexOf('}'))}
//   ${line}
// }`;
// }
