import nodePath from 'node:path';
import { readFile } from 'node:fs/promises';
import { getFrameworkMiddleware } from './middleware.js';


export default class App {
  #appRoot;
  #indexTemplate;
  #notFoundTemplate;
  #SPA;
  #routes;
  #indexTemplateMethod;
  #scriptTagsCache;
  #routesArray = [];
  #containsVariableOrWildcardRegex = /\/:|\*/g;
  #parameterRegex = /([:*])(\w+)/g;
  #wildcardRegex = /\*/g;
  #replaceWidCardString = '(?:.*)';
  #followedBySlashRegexString = '(?:\/$|$)';
  #pageContentTagMatcher = /<page-content([^]+)?>([^]+)?<\/page-content>/g;
  #bodyTagMatcher = /<body([^]+)?>([^]+)?<\/body>/g;
  #titleTagMatcher = /<title([^]+)?>([^]+)?<\/title>/g;
  #closingHeadTagMatcher = /<\/head>/g;

  constructor(params = {
    appRoot: 'app',
    indexTemplate: 'pages/index.html',
    notFoundTemplate: 'pages/404.html',
    SPA: true
  }) {
    this.#appRoot = params?.appRoot || 'app';
    this.#indexTemplate = params?.indexTemplate || 'pages/index.html';
    this.#notFoundTemplate = params?.notFoundTemplate || 'pages/404.html';
    this.#routes = {};
    this.#SPA = params?.SPA === false ? false : true; 

    this.#init();
  }


  middleware() {
    let routeParser;

    return async (...args) => {
      if (!routeParser) routeParser = getFrameworkMiddleware(...args);
      return routeParser(...args, { appRoot: this.#appRoot }, async ({ path }) => {
        const routeData = this.#matchRoute(path, this.#routes);
        if (!routeData) {
          if (this.#isStaticFile(path)) return { filePath: path };
          return { filePath: this.#notFoundTemplate };
        }

        try {
          const pageData = await routeData.callback({ path, urlParameters: routeData.urlParameters });
          const pageContent = routeData.templateMethod(pageData);
          const scriptTags = this.#getScriptTags(this.#routes);
          const index = this.#indexTemplateMethod({ pageContent, scriptTags, pageTitle: routeData.pageTitle || '' });
          return {
            headers: { 'Content-Type': 'text/html' },
            statusCode: 200,
            responseBody: index
          };
        } catch (error) {
          return { error };
        }
      });
    };
  }

  async route(params = {
    url: '',
    template: '',
    pageTitle: '',
    controller: ''
  }, callback = () => ({})) {
    this.#routes[params.url] = {
      ...params,
      callback,
      routeRegex: this.#buildRouteRegex(params.url),
      templateMethod: await this.#getTemplateMethod(params.template)
    };
    this.#routesArray = Object.values(this.#routes);
  }



  async #init() {
    this.#indexTemplateMethod = await this.#getIndexTemplateMethod();
  }

  #getScriptTags(routes) {
    if (!this.#scriptTagsCache) {
      const routesData = Object.values(routes).map(route => ({
        ...route,
        routeRegexString: route.routeRegex.source
      }));
      this.#scriptTagsCache = `<script>
window.SPA = ${this.#SPA};
window.routes = ${JSON.stringify(routesData, null, 2)};
</script>
<script src="/@webformula/pax-core/client2" type="module"></script>`;
    }
    
    return this.#scriptTagsCache;
  }

  #buildRouteRegex(route) {
    let regex;
    if (route.match(this.#containsVariableOrWildcardRegex) === null) regex = new RegExp(`^${route}$`);
    else regex = new RegExp(
      `^${route
        .replace(this.#parameterRegex, (_full, _dots, name) => `(?<${name}>[^\/]+)`)
        .replace(this.#wildcardRegex, this.#replaceWidCardString)
      }${this.#followedBySlashRegexString}$`,
      ''
    );

    return regex;
  }

  #matchRoute(reqPath) {
    const found = this.#routesArray.find(({ routeRegex }) => reqPath.match(routeRegex) !== null);
    if (!found) return;

    const match = reqPath.match(found.routeRegex);
    return {
      ...found,
      urlParameters: match.groups
    };
  }

  #isStaticFile(routePath) {
    const extension = nodePath.extname(routePath);
    if (extension && extension !== '.html') return true;
    if (routePath.includes('@webformula/pax-core')) return true;
    if (routePath === 'home') true;
    return false;
  }

  async #getTemplateMethod(templatePath) {
    const filePath = nodePath.join(this.#appRoot, templatePath)
    const templateString = (await readFile(filePath)).toString();
    const renderMethod = new Function('page', `return \`${templateString}\`;`);
    return (page = {}) => renderMethod.call(page, page);
  }

  async #getIndexTemplateMethod() {
    const filePath = nodePath.join(this.#appRoot, this.#indexTemplate);
    let templateString = (await readFile(filePath)).toString();
    const pageContentMatch = templateString.match(this.#pageContentTagMatcher);
    if (pageContentMatch) templateString = templateString.replace(this.#pageContentTagMatcher, '<page-content>${this.pageContent}</page-content>');
    else templateString = templateString.replace(this.#bodyTagMatcher, '<body><page-content>${this.pageContent}</page-content></body>');

    const titleTagMatch = templateString.match(this.#titleTagMatcher);
    const closingHeadTagMatch = templateString.match(this.#closingHeadTagMatcher);

    if (closingHeadTagMatch) {
      if (!titleTagMatch) {
        templateString = templateString.replace(this.#closingHeadTagMatcher, '<title>${this.title}</title>${this.scriptTags}</head>');
      } else {
        templateString = templateString.replace(this.#titleTagMatcher, '<title>${this.title}</title>');
        templateString = templateString.replace(this.#closingHeadTagMatcher, '${this.scriptTags}</head>');
      }
    } else {
      templateString = templateString.replace(this.#closingHeadTagMatcher, '<head><title>${this.title}</title>${this.scriptTags}</head>');
    }

    const renderMethod = new Function('page', `return \`${templateString}\`;`);
    return (page = {}) => renderMethod.call(page, page);
  }
}
