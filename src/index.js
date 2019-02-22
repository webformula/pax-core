const { set } = require('./server-only/config');
const fileHandler = require('./server-only/fileHandler');
const HTMLElementExtended = require('./server-client/HTMLElementExtended');
const customElements = require('./server-client/customElements');
const PageMapper = require('./server-client/PageMapper');
const Page = require('./server-client/Page');
const buildClient = require('./client-only/build');
const buildPage = require('./server-only/buildPage');
const { html, stripIndents } = require('common-tags');
const escapeHTML = html => html.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

module.exports = {
  HTMLElementExtended,
  customElements,
  PageMapper,
  Page,
  buildClient,
  html,
  stripIndents,
  cssStr: html,
  escapeHTML,
  setConfig: set,
  fileHandler,
  buildPage
};
