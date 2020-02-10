export default class HTMLElementExtended extends HTMLElement {
  constructor() {
    super();
  }

  get _templateId() {
    return `${this.nodeName.toLowerCase()}--template`;
  }

  /* Clone from pre built htmlTemplate
   *   - Rerender: replaces html but not styles. This is usefull for dynamic templates
   */
  cloneTemplate(rerender) {
    let template = document.getElementById(this._templateId);
    
    // create template on the fly
    if (!template) template = this._createTemplate();

    const templateContent = template.content;
    const shadowRoot = this.shadowRoot ? this.shadowRoot : this.attachShadow({ mode: 'open' });
    const clone = templateContent.cloneNode(true);

    if (rerender) {
      // this.__isBuildProcess is present during the build process and will be undefined in the browser
      if (!this.__isBuildProcess && this.beforeRender) this.beforeRender();
      clone.querySelector('render-block').innerHTML = this.template();
    }

    shadowRoot.appendChild(clone);
    if (!this.__isBuildProcess && this.afterRender) this.afterRender();

  }

  _createTemplate() {
    const templateElement = document.createElement('template');
    templateElement.setAttribute('id', this._templateId);
    templateElement.innerHTML = `
        <style>
          ${this.styles()}
        </style>
        <render-block>
          ${this.template()}
        </render-block>
    `;
    document.body.insertAdjacentElement('beforeend', templateElement);
    return templateElement;
  }

  connectedCallback() {
    // Detect super?
    if (!this.__isBuildProcess && this.addEvents) this.addEvents();
  }

  disconnectedCallback() {
    // Detect super?
    if (!this.__isBuildProcess && this.removeEvents) this.removeEvents();
  }

  render() {
    // this.__isBuildProcess is present during the build process and will be undefined in the browser
    if (this.__isBuildProcess) return;

    const renderBlock = this.shadowRoot.querySelector('render-block');
    if (!renderBlock) throw Error('Could not find <render-block>');

    if (this.removeEvents) this.removeEvents();
    if (this.beforeRender) this.beforeRender();
    renderBlock.innerHTML = this.template();
    if (this.afterRender) this.afterRender();
    if (this.addEvents) this.addEvents();
  }

  // Called before render(). placeholder, can be overidden
  // This does not include the initial cloneNode
  beforeRender() { }

  // Called after render(). placeholder, can be overidden
  // This does not include the initial cloneNode
  afterRender() { }

  // this is called when the component is connected
  // This is also called after render, events are first remoed before render so you dont have multiple events
  addEvents() { }

  // this is called when the component is disconnected
  // This is also called prior to render, after render addEvents is called. This will make sure you old elements dont retain events
  removeEvents() { }

  // add css that will be injected to the template
  styles() { }

  // add css to the document root
  externalStyles() { }

  // add html template, This will be used to create the template and direct render
  template() { }
}
