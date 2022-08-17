export default class Page {
  // can be specified when registering page
  // routes = '/path';
  // routes = ['/a', '/b'];

  // html string or file path
  templateString = '';


  constructor() {
    // these are set by the route
    this._urlParameters = undefined;
    this._searchParameters = undefined;
  }

  set pageTitle(value) {
    this._pageTitle = value;
  }

  get searchParameters() {
    return this._searchParameters;
  }

  get urlParameters() {
    return this._urlParameters;
  }

  // override
  connectedCallback() { }
  disconnectedCallback() { }
  async beforeRender() { }
  async afterRender() { }

  // dynamic method
  template() {
    return /*html*/``;
  }

  async _renderTemplate() {
    const pageContent = document.querySelector('page-content');
    if (!pageContent) throw Error('Could not find <page-content>');

    await this.beforeRender();

    let renderedTemplate;
    if (this.templateString) renderedTemplate = new Function('page', `return \`${this.templateString}\`;`).call(this, this);
    else renderedTemplate = this.template.call(this, this);

    // TODO replace with setHTML when supported. https://developer.mozilla.org/en-US/docs/Web/API/Element/setHTML
    // currently security concerns should be mitigated by the template literal
    pageContent.innerHTML = renderedTemplate;
    document.querySelector('title').innerText = this.pageTitle;

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
