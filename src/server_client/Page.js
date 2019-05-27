// there is a seperate model for the server in server-only
module.exports = class Page {
  constructor() {}
  // called once page is renderd
  connectedCallback() {}
  // called once page is removed
  disconnectedCallback() {}

  // render page html
  render() {
    if (this.beforeRender) this.beforeRender();
    const renderBlock = document.querySelector('render-block-page');
    if (!renderBlock) throw Error('Could not find <render-block-page>');
    renderBlock.innerHTML = `<style>${this.styles()}</style>${this.template()}`;
    if (this.afterRender) this.afterRender();
  }
  // Called before render(). placeholder, can be overidden
  // This does not include the initial cloneNode
  beforeRender() {}
  // Called after render(). placeholder, can be overidden
  // This does not include the initial cloneNode
  afterRender() {}

  // add css that will be injected to the template
  styles() {}

  // File path from root of project
  stylesFile() {}

  // add html template, This will be used to create the template and direct render
  template() {}
}
