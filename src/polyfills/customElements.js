const customElements = new class {
  constructor() {
    this.components = {};
  }

  define(name, constructor) {
    if (this.components[name]) throw Error(`component "${name}" has already been registered. Please change the components name`);
    this.components[name] = constructor;
  }

  getComponent(name) {
    if (!this.components[name]) throw Error(`componenet does not exist: "${name}"`);
    return this.components[name];
  }
};

global.customElements = customElements;

export default customElements;
