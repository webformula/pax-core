export default class Page {
    constructor() {
        // Can this work?
        // const renderBlock = document.querySelector('page-render-block');
        // this.__mutationObserver = new MutationObserver(() => {
        //     if ([this, ...this.parentNodes].some(el => el.nextSibling) || document.readyState !== 'loading') {
        //         this.childrenAvailableCallback()
        //         this.mutationObserver.disconnect()
        //     }
        // });

        // this.__mutationObserver.observe(this, { childList: true });

      if (globalThis.displayPageContentOnly) this.displayPageContentOnly(true);
    }

    // called once page is renderd
    connectedCallback() {
      // Detect super?
      if (!this.__isBuildProcess && this.addEvents) this.addEvents();
    }

    // called once page is removed
    disconnectedCallback() {
      // Detect super?
      if (!this.__isBuildProcess && this.removeEvents) this.removeEvents();
    }

    static CreateAndSet() {
      const instance = new this();
      window.activePage = instance;
      instance._disableRender = false;

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

      if (this.removeEvents) this.removeEvents();
      if (this.beforeRender) this.beforeRender();
      renderBlock.innerHTML = `<style>${this.styles()}</style>${this.template()}`;
      if (this.afterRender) this.afterRender();
      if (this.addEvents) this.addEvents();
    }

    // hide any non immidiate elements above or on the same level ad the page content
    displayPageContentOnly(reverse = false) {
      const renderBlock = document.querySelector('page-render-block');
      const html = document.documentElement;
      let node = renderBlock;
      let sibling;
      let directPatent = renderBlock;

      while (node.parentNode && node.parentNode !== html) {
          node = node.parentNode;
          sibling = node.firstChild;
          while (sibling) {
              if (sibling.nodeType === 1 && sibling !== directPatent) {
                  if (reverse) sibling.classList.remove('hide-other-than-page-content');
                  else sibling.classList.add('hide-other-than-page-content');
              }
              sibling = sibling.nextSibling
          }
          directPatent = node;
      }

      globalThis.displayPageContentOnly = !reverse;
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
