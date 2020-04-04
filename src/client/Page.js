export default class Page {
    constructor() {
      this._rendered = false;
      this.global = typeof globalThis !== 'undefined' ? globalThis : window;
    }

    // called once page is renderd
    connectedCallback() {
      // Detect super?
      if (this.addEvents) this.addEvents();
    }

    // called once page is removed
    disconnectedCallback() {
      // Detect super?
      if (this.removeEvents) this.removeEvents();
    }

    static CreateAndSet() {
      const instance = new this();
      window.activePage = instance;

      const pageTitle = document.querySelector('title');
      if (pageTitle) pageTitle.innerText = instance.title;

      instance.render();
      // TODO use mutation observer
      setTimeout(() => {
        if (instance.connectedCallback) instance.connectedCallback();
      }, 0);

      return instance;
    }

    // render page html
    render() {
      if (this._disableRender === true) return;

      const renderBlock = document.querySelector('page-render-block:not(.previous)');
      if (!renderBlock) throw Error('Could not find <page-render-block>');

      if (this.removeEvents && this._rendered) this.removeEvents();
      if (this.beforeRender && this._rendered) this.beforeRender();
      renderBlock.innerHTML = `<style>${this.styles()}</style>${this.template()}`;
      if (this.afterRender) this.afterRender();
      if (this.addEvents) this.addEvents();

      this._rendered = true;
    }

    // Called before render(). placeholder, can be overidden
    // This does not include the initial cloneNode
    beforeRender() { }

    // Called after render(). placeholder, can be overidden
    // This does not include the initial cloneNode
    afterRender() { }

    // add css that will be injected to the template
    styles() { }

    // add html template, This will be used to create the template and direct render
    template() { }
}
