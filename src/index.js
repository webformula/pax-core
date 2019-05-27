const client = require('./client/index.js');
const server = require('./server/index.js');
const {
  HTMLElementExtended,
  Page,
  PageMapper,
  customElements,
  global
} = require('./server_client/index.js');
const {
  html,
  stripIndents,
  escapeHTML
} = require('common-tags')

module.exports = {
  client,
  server,
  HTMLElementExtended,
  Page,
  PageMapper,
  customElements,
  global,
  html,
  css: html,
  stripIndents,
  escapeHTML
};
