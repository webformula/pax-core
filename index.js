import HTMLElement from './src/polyfills/HTMLElement.js';
import Page from './src/Page.js';
import Router from './src/Router.js';
import HTMLElementExtended from './src/HTMLElementExtended.js';
import customElements from './src/polyfills/customElements.js';
import build from './src/build/index.js';

import tags from 'common-tags';
const { html } = tags;
const css = html;

export {
  Page,
  Router,
  HTMLElementExtended,
  customElements,
  build,
  html,
  css
}
