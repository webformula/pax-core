const config = require('./config');
const { memoize } = require('./cache');

module.exports = class Page {
  get memoize() {
    if (!this._memoize) this._memoize = config.get('memoize');
    return this._memoize;
  }

  set memoize(value) {
    this._memoize = value;
  }

  connectedCallback() {}
  html() { return ''; }
  css() { return ''; }
  render() {}

  template() {
    return `
<style>
${this.css()}
</style>

<render-block>
${this.html()}
</render-block>
    `;
  }

  build(vm = {}) {
    if (this.memoize) {
      if (!this.buildMemoized) this.buildMemoized = memoize(this._build.bind(this));
      return this.buildMemoized(vm);
    }
    return this._build(vm);
  }

  _build(vm) {
    Object.assign(this, vm); // allow data to be passed in on build for server side rendering
    return {
      title: this.title,
      body: this.template(),
      head: `
<script>
${this._getClassAsString()}
const $${this._getClassName()} = new ${this._getClassName()}();
setTimeout(function () {
  $${this._getClassName()}.connectedCallback();
}, 0);
</script>
      `
    };
  }


  // --- Private ---

  _getClassAsString() {
    return `
      class Page {
        connectedCallback() {}
        render() {
          const renderBlock = document.querySelector('render-block');
          if (!renderBlock) throw Error('Could not find <render-block>');
          renderBlock.innerHTML = this.html();
        }
      }
      ${this.constructor.toString()}
    `;
  }

  _getClassName() {
    return this.constructor.name;
  }
};
