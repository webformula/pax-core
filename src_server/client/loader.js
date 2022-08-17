import { registerPage } from './router.js';

const routes = window.routes.map(route => ({
  ...route,
  routeRegex: new RegExp(route.routeRegexString)
}));
const files = [];


export async function loadPages() {
  const path = location.pathname;
  // make sure the current page is loaded first
  // if allowSPA = true, then all pages will be loaded

  routes.sort(({ routeRegex }) => path.match(routeRegex) !== null ? -1 : 1);
  routes.map(async ({
    url,
    pageTitle,
    template,
    controller,
    routeRegex
  }) => {
    const pageModule = controller && await importJS(controller);
    const templateString = await loadHTML(template);
    registerPage({
      url,
      pageTitle,
      pageClass: pageModule?.default,
      templateString,
      routeRegex
    });
  });
}


async function importJS(path) {
  if (!files[path]) {
    files[path] = import('/' + path);
  }
  return files[path];
}

async function loadHTML(path) {
  if (!files[path]) files[path] = fetchHTML(path);
  return files[path];
}

async function fetchHTML(path) {
  const response = await fetch('/' + path);
  return response.text();
}
