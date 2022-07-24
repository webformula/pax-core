import { parseURL } from './helper.js';
import { registerPage } from './router.js';

const pageConfigurations = window.pageConfigurations;

export async function loadPages() {
  const path = parseURL();

  // make sure the current page is loaded first
  // if allowSPA = true, then all pages will be loaded
  pageConfigurations.sort((a) => a[0] === path ? -1 : 1);

  pageConfigurations.map(async ({
    defaultRoute,
    routes,
    pageTitle,
    filePath,
    templatePath
  }) => {
    const pageModule = await import(filePath);
    const templateString = await loadHTML(templatePath);
    registerPage({
      defaultRoute,
      routes,
      pageTitle,
      pageClass: pageModule.default,
      templateString
    });
  });
}

async function loadHTML(path) {
  const response = await fetch(path);
  return await response.text();
}
