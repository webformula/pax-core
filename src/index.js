// const { set } = require('./src/config');
// const fileHandler = require('./src/fileHandler');


const HTMLElementExtended = require('./server-client/HTMLElementExtended');
const customElements = require('./server-client/customElements');
const PageMapper = require('./server-client/PageMapper');
const Page = require('./server-client/Page');
const build = require('./client-only/build');
const { html, css } = require('common-tags');

module.exports = {
  HTMLElementExtended,
  customElements,
  PageMapper,
  Page,
  buildClient: build,
  html,
  css
  // setConfig: set,
  // fileHandler,
};
