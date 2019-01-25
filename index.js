const customElements = require('./src/customElements');
const PageMapper = require('./src/PageMapper');
const fileHandler = require('./src/fileHandler');
const { set } = require('./src/config');
const { css, html } = require('./src/template-literal-tags');
const HTMLElementExtended = require('./src/HTMLElementExtended');
const Page = require('./src/Page');

module.exports = {
  customElements,
  PageMapper,
  html,
  css,
  setConfig: set,
  fileHandler,
  HTMLElementExtended,
  Page
};
