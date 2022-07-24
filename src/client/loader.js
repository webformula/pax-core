import { getPath } from './helper.js';
import { registerPage } from './router.js';

export async function loadPages() {
  const path = getPath();

  // built on server side
  const pageClassPaths = window.pageClassPaths.sort((a) => a[0] === path ? -1 : 1);
  await Promise.all(pageClassPaths.map(async ([route, path]) => {
    const instance = await loadJavascript(path);
    const htmlTemplatePath = window.pageClassHTMLTemplatePaths[route];
    let HTMLTemplateString;
    if (htmlTemplatePath) HTMLTemplateString = await loadHTML(htmlTemplatePath);
    registerPage(instance.default, { route, HTMLTemplateString });
  }));


  // TODO build from static client files
}

async function loadJavascript(path) {
  return await import(path);
}

async function loadHTML(path) {
  const response = await fetch(path);
  return await response.text();
}
