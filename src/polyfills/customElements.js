export default new class customElements {
  constructor() {
    this.components = {};
  }

  define(name, constructor) {
    if (this.components[name]) throw Error(`component "${name}" has already been registered. Please change the components name`);
    this.components[name] = constructor;
  }
};

global.customElements = customElements;
