const { html, stripIndent } = require('common-tags');
const Page = require('./Page.js');
const Router = require('../client/Router.js');

const clienTags = stripIndent`
  const w = window;
  w.html=(strs, ...ev) => {
    let f='',i=0;
    const len = strs.length;
    for(;i<len;i++) {
      if(i>0)f+=ev[i-1];
      f+=strs[i];
    }
    return f;
  };
  w.stripIndents=(strs, ...ev) => {
    let f='',i=0;
    const len=strs.length;
    for(;i<len;i++) {
      if(i>0)f+=ev[i-1];
      f+=strs[i];
    }
    const m = f.match(/^[^\\S\\n]*(?=\\S)/gm);
    const ind = m && Math.min(...m.map(el => el.length));
    if (ind) {
      const rg = new RegExp('^.{'+ind+'}','gm');
      return f.replace(rg, '');
    }
    return f;
  };
  w.escapeHTML=html => html.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  w.htmlSafe=w.html;
  w.css=w.html;
  w.stripIndent=w.html;
  w.oneLine=w.html;
  w.oneLineTrim=w.html;
`;

// export script string for browser / client
exports.client = (pageMapper) => {
  const pageInstance = new Page();
  const PageClassStr = pageInstance.constructor.toString();
  return `${clienTags}\n\nconst router = new ${Router.toString()}(${JSON.stringify(pageMapper.routes, null, 2)});\n\n${PageClassStr}`;
};

// export script string for server
exports.server = () => {
  const pageInstance = new Page();
  const PageClassStr = pageInstance.constructor.toString();
  return `${clienTags}\n\n${PageClassStr}`;
};
