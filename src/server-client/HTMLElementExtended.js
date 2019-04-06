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
  externalStyles() { return ''; }
  styles() { return ''; }
  template() { return ''; }
};

class ShadowRoot {
  innerHTML() {}
}
