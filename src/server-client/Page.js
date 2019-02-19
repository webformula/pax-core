// there is a seperate model for the server in server-only
module.exports = class Page {
  constructor() {}
  connectedCallback() {}
  template() { return ''; }
  css() { return ''; }
  render() {
    const renderBlock = document.querySelector('render-block-page');
    if (!renderBlock) throw Error('Could not find <render-block-page>');
    renderBlock.innerHTML = this.template();
  }
}
