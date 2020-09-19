export default class Page {
  constructor() {
    this._rendered = false;
    this.global = typeof globalThis !== 'undefined' ? globalThis : window;

    // this._filePath = this._getCallerFilePath();
  }

  // called once page is rendered
  connectedCallback() {
    // Detect super?
    if (this.addEvents) this.addEvents();
  }

  // called once page is removed
  disconnectedCallback() {
    // Detect super?
    if (this.removeEvents) this.removeEvents();
  }

  // render page html
  async render() {
    if (this._disableRender === true) return;
    if (!this._templateSetup) await this._getTemplate();

    const renderBlock = document.querySelector('page-render-block:not(.previous)');
    if (!renderBlock) throw Error('Could not find <page-render-block>');

    if (this.removeEvents && this._rendered) this.removeEvents();
    if (this.beforeRender && this._rendered) this.beforeRender();
    renderBlock.innerHTML = `<style>${this.styles()}</style>${this._templateMethod()}`;
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

  /* Load and prep template
   *   templates can be strings or urls
   */
  async _getTemplate() {
    if (this._templateSetup === true) return;

    const template = this.template();
    const isUrl = template.match(/.html$/);

    if (isUrl) {
      // template from built template file
      if (window._templates && (window._templates[template] || window._templates[template.replace(/^\/+/, '')])) {
        this._templateMethod = new Function(`return \`${window._templates[template] || window._templates[template.replace(/^\/+/, '')]}\`;`);

      // load template url
      } else {
        // this._filePath is generated in the constructor
        const response = await fetch(template);
        const str = await response.text();
        // allow javascript template string syntax in external html file ( ${things} )
        this._templateMethod = new Function(`return \`${str}\`;`);
      }
    } else {
      this._templateMethod = this.template;
    }

    this._templateSetup = true;
  }


  // hack way to utilize stack traces to get the caller's file path
  _getCallerFilePath() {
    // we are going to temporarily override this method. Keep for restore
    const originalPrepareStackTrace = Error.prepareStackTrace;
    let callerFile;

    try {
      // temporary change
      Error.prepareStackTrace = (_, stack) => stack;
      const err = new Error();
      let currentFile = err.stack.shift().getFileName();
      while (err.stack.length) {
        callerFile = err.stack.shift().getFileName();
        if (currentFile !== callerFile) break;
      }
    } catch (err) { }

    // restore original method
    Error.prepareStackTrace = originalPrepareStackTrace; 
    return callerFile;
  }
}
