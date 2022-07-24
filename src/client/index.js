import Page from './Page.js';
import { registerPage } from './router.js';
import { loadPages } from './loader.js';

export {
  Page,
  registerPage
}

loadPages();
