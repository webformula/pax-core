export default class Page {
  pageTitle;
  routes; // ['/a', '/b'];

  #urlParameters;
  #searchParameters;

  constructor(pageTitle, routes) {
    this.pageTitle = pageTitle;
    this.routes = routes;
  }


  get searchParameters() {
    return this.#searchParameters;
  }

  get urlParameters() {
    return this.#urlParameters;
  }

  // override
  connectedCallback() { }
  disconnectedCallback() { }

  // beforeRender not called on initial render
  async beforeRender() { }
  async afterRender() { }

  /**
   * Return HTML template string.
   * 
   *  page.js
   *  new class one extends Page {
   *    template() {
   *       return `<div>${this.var}</div>`;
   *    }
   *  }
   */
  template() {
    return /*html*/``;
  }

  /**
   * For html file is loaded as raw text and uses template liters
   * 
   *  page.html
   *  <div>${page.var}</div>
   * 
   *  page.js
   *  import html from 'page.html`;
   *  new class one extends Page {
   *    template() {
   *       return this.renderTemplateString(html);
   *    }
   *  }
   */
  renderTemplateString(template = '') {
    return new Function('page', `return \`${template}\`;`).call(this, this);
  }

  async render() {
    const pageContent = document.querySelector('page-content');
    if (!pageContent) throw Error('Could not find <page-content>');

    await this.beforeRender();
    // TODO replace with setHTML when supported. https://developer.mozilla.org/en-US/docs/Web/API/Element/setHTML
    // currently security concerns should be mitigated by the template literal
    pageContent.innerHTML = this.template.call(this, this);
    const title = document.querySelector('title');
    title.innerText = this.pageTitle;
    await this.afterRender();
  }

  // called by router
  _setUrlData(params = {
    urlParameters: {},
    searchParameters: {}
  }) {
    this._urlParameters = params?.urlParameters || {};
    this._searchParameters = params?.searchParameters || {};
  }
}




// --- old ---

// export default class Page {
//   // can be specified when registering page
//   // routes = '/path';
//   // routes = ['/a', '/b'];

//   // html string or file path
//   templateString = '';


//   constructor() {
//     // these are set by the route
//     this._urlParameters = undefined;
//     this._searchParameters = undefined;
//   }

//   set pageTitle(value) {
//     this._pageTitle = value;
//   }

//   get searchParameters() {
//     return this._searchParameters;
//   }

//   get urlParameters() {
//     return this._urlParameters;
//   }

//   // override
//   connectedCallback() { }
//   disconnectedCallback() { }
//   async beforeRender() { }
//   async afterRender() { }

//   // dynamic method
//   template() {
//     return /*html*/``;
//   }

//   async _renderTemplate() {
//     const pageContent = document.querySelector('page-content');
//     if (!pageContent) throw Error('Could not find <page-content>');

//     await this.beforeRender();

//     let renderedTemplate;
//     if (this.templateString) renderedTemplate = new Function('page', `return \`${this.templateString}\`;`).call(this, this);
//     else renderedTemplate = this.template.call(this, this);

//     // TODO replace with setHTML when supported. https://developer.mozilla.org/en-US/docs/Web/API/Element/setHTML
//     // currently security concerns should be mitigated by the template literal
//     pageContent.innerHTML = renderedTemplate;
//     document.querySelector('title').innerText = this.pageTitle;

//     await this.afterRender();
//   }

//   // called by router
//   _setUrlData(params = {
//     urlParameters: {},
//     searchParameters: {}
//   }) {
//     this._urlParameters = params?.urlParameters || {};
//     this._searchParameters = params?.searchParameters || {};
//   }
// }
