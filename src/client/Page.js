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

  // override
  connectedCallback() {

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
