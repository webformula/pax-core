const { html } = require('common-tags');
const Page = require('./Page');
const Router = require('../client-only/Router');
const clienTags = `
  window.html = function (strings, ...expressionValues) {
    let finalString = '';
    let i = 0;
    let length = strings.length;
    for(; i < length; i++) {
      if (i > 0) finalString += expressionValues[i - 1];
      finalString += strings[i];
    }
    return finalString;
  };
  window.stripIndents = function (strings, ...expressionValues) {
    let finalString = '';
    let i = 0;
    let length = strings.length;
    for(; i < length; i++) {
      if (i > 0) finalString += expressionValues[i - 1];
      finalString += strings[i];
    }
    const match = finalString.match(/^[^\\S\\n]*(?=\\S)/gm);
    const indent = match && Math.min(...match.map(el => el.length));
    if (indent) {
      const regexp2 = new RegExp('^.{'+indent+'}', 'gm');
      return finalString.replace(regexp2, '');
    }
    return finalString;
  };
  window.escapeHTML = function (html) {
    return html.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  };
  window.htmlSafe = window.html;
  window.cssStr = window.html;
  window.stripIndent = window.html;
  window.oneLine = window.html;
  window.oneLineTrim = window.html;
`;

exports.client = (pageMapper) => {
  const pageInstance = new Page();
  const PageClassStr = pageInstance.constructor.toString();
  return `${clienTags}\n\nconst router = new ${Router.toString()}(${JSON.stringify(pageMapper.routes, null, 2)});\n\n${PageClassStr}`;
};

exports.server = () => {
  const pageInstance = new Page();
  const PageClassStr = pageInstance.constructor.toString();
  return `${clienTags}\n\n${PageClassStr}`;
};
