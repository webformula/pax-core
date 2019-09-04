/* Dummy class
 *   - Used for serverside rendering
 *   - Used for build steps
 */
const HTMLElement = class {
  constructor() {
    this.style = {};
    this.nodeName = 'temp';
  }
  appendChild() {}
  attachShadow() {
    this.shadowRoot = new ShadowRoot();
    return this.shadowRoot;
  }
  hasAttribute() {}
  getAttribute() {}
  setAttribute() {}
  removeAttribute() {}
  addEventListener() {}
  removeEventListener() {}
  getAttribute() { return ''; }
  hasAttribute() {}
  setAttribute() {}
  insertAdjacentHTML() {}
  get parentNode() {
    return {
      hasAttribute() {},
      getAttribute() {},
      setAttribute() {},
      removeAttribute() {},
      addEventListener() {},
      removeEventListener() {},
      getAttribute() { return ''; },
      hasAttribute() {},
      setAttribute() {}
    };
  }
  get classList() {
    return {
      add() {},
      remove() {},
      contains() {}
    }
  }
};

class ShadowRoot {
  innerHTML() {}
  appendChild() {}
  querySelector(selector) {
    if (selector === 'render-block') return {};
  }
}

// make it global so we do not need to import it into files and cause problems with the browser
global.HTMLElement = HTMLElement;

export default HTMLElement;
