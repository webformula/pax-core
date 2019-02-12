module.exports = class HTMLElementExtended {
  constructor() {
    this.style = {};
  }
  appendChild() {}
  attachShadow() {
    this.shadowRoot = new ShadowRoot();
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

  cloneTemplate() {}
  render() {}
  externalCSS() { return ''; }
  css() { return ''; }
  html() { return ''; }
};

class ShadowRoot {
  innerHTML() {}
}
