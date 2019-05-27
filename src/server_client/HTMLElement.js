/* Dummy class
 *   - Used for serverside rendering
 *   - Used for build steps
 */
module.exports = class HTMLElement {
  constructor() {
    this.style = {};
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
