const { set } = require('./server-only/config');
const fileHandler = require('./server-only/fileHandler');
const HTMLElementExtended = require('./server-client/HTMLElementExtended');
const customElements = require('./server-client/customElements');
const PageMapper = require('./server-client/PageMapper');
const Page = require('./server-client/Page');
const buildClient = require('./client-only/build');
const buildPage = require('./server-only/buildPage');
const { html, css } = require('common-tags');

module.exports = {
  HTMLElementExtended,
  customElements,
  PageMapper,
  Page,
  buildClient,
  html,
  css,
  setConfig: set,
  fileHandler,
  buildPage
};
