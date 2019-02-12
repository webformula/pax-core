module.exports = class Page {
  constructor() {}
  connectedCallback() {}
  html() { return ''; }
  build() { return this; }
  render() {
    const renderBlock = document.querySelector('render-block-page');
    if (!renderBlock) throw Error('Could not find <render-block-page>');
    renderBlock.innerHTML = this.html();
  }
}
