// there is a seperate model for the server in server-only
module.exports = class Page {
  constructor() {}
  connectedCallback() {}
  template() { return ''; }
  styles() { return ''; }
  beforeRender() {}
  render() {
    if (this.beforeRender) this.beforeRender();
    const renderBlock = document.querySelector('render-block-page');
    if (!renderBlock) throw Error('Could not find <render-block-page>');
    renderBlock.innerHTML = `<style>${this.styles()}</style>${this.template()}`;
    if (this.afterRender) this.afterRender();
  }
  afterRender() {}
}
