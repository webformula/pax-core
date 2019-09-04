export default class Page {
  constructor() {}

  // called once page is renderd
  connectedCallback() {}

  // called once page is removed
  disconnectedCallback() {}

  // render page html
  render() {
    if (this._disableRender === true) return;

    const renderBlock = document.querySelector('render-block-page');
    if (!renderBlock) throw Error('Could not find <render-block-page>');

    if (this.beforeRender) this.beforeRender();
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

  // add html template, This will be used to create the template and direct render
  template() {}
}
