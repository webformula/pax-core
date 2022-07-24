export default class Page {
  constructor() {
    // these are set by the route
    this._urlParameters = undefined;
    this._searchParameters = undefined;
  }

  get searchParameters() {
    return this._searchParameters;
  }
  get urlParameters() {
    return this._urlParameters;
  }
  
  get templateString() {
    return this._templateString;
  }
  set templateString(value) {
    this._templateString = value;
  }

  get pageTitle() {
    return this._pageTitle;
  }
  set pageTitle(value) {
    this._pageTitle = value;
  }

  // override
  connectedCallback() { }
  disconnectedCallback() { }
  async beforeRender() { }
  async afterRender() { }

  async _renderTemplate() {
    const pageContent = document.querySelector('page-content');
    if (!pageContent) throw Error('Could not find <page-content>');

    await this.beforeRender();

    if (!this.templateString) throw Error('No templateString');
    const renderedTemplate = new Function('page', `return \`${this.templateString}\`;`).call(this, this);

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

    this.onUrlData();
  }

  // override
  onUrlData() {

  }
}
