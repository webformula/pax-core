/* Dummy class
 *   - Used for serverside rendering
 *   - Used for build steps
 */

class BaseHTMLElement {
  constructor() {
    this.style = {};
  }

  get classList() {
   return {
     add() {},
     remove() {},
     contains() {}
   };
  }

  get nodeName() { return ''; }

  appendChild() {}
  remove() {}
  insertAdjacentHTML() {}
  querySelector() { return null; }

  hasAttribute() {}
  getAttribute() {}
  setAttribute() {}
  removeAttribute() {}

  addEventListener() {}
  removeEventListener() {}

  attachShadow() {
   this.shadowRoot = new ShadowRoot();
   return this.shadowRoot;
  }
}

class ShadowRoot {
  innerHTML() {}
  appendChild() {}
  querySelector(selector) {
   if (selector === 'render-block') return {};
  }
}

const HTMLElement = class extends BaseHTMLElement {
  constructor() {
    super();

    this.parentNode = new BaseHTMLElement();
  }
};

// make it global so we do not need to import it into files and cause problems with the browser
global.HTMLElement = HTMLElement;

export default HTMLElement;
