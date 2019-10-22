export default class Page {
  constructor() {
    if (globalThis.displayPageContentOnly) this.displayPageContentOnly(true);
  }

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

  // hide any non immidiate elements above or on the same level ad the page content
  displayPageContentOnly(reverse = false) {
    const renderBlock = document.querySelector('render-block-page');
    const html = document.documentElement;
    let node = renderBlock;
    let sibling;
    let directPatent = renderBlock;

    while (node.parentNode && node.parentNode !== html) {
      node = node.parentNode;
      sibling = node.firstChild;
      while (sibling) {
    		if (sibling.nodeType === 1 && sibling !== directPatent) {
    			if (reverse) sibling.classList.remove('mdw-hide-other-than-page-content');
          else sibling.classList.add('mdw-hide-other-than-page-content');
    		}
    		sibling = sibling.nextSibling
    	}
      directPatent = node;
    }

    globalThis.displayPageContentOnly = !reverse;
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
