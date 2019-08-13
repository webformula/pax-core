const HTMLElement = require('./HTMLElement.js');
const document = require('./document.js');
const window = require('./window.js');


module.exports = class HTMLElementExtended extends HTMLElement {
  constructor(name) {
    super();
    this.__name = name;
  }

  /* Clone from pre built htmlTemplate
   *   - Rerender: replaces html but not styles. This is usefull for dynamic templates
   */
  cloneTemplate(rerender) {
    var template = document.getElementById(`${this.__name}--template`);
    var templateContent = template.content;
    var shadowRoot = this.shadowRoot ? this.shadowRoot : this.attachShadow({mode: 'open'});
    var clone = templateContent.cloneNode(true);
    if (rerender) clone.querySelector('render-block').innerHTML = this.template();
    shadowRoot.appendChild(clone);
  }

  render() {
    if (this.removeEvents) this.removeEvents();
    if (this.beforeRender) this.beforeRender();
    const renderBlock = this.shadowRoot.querySelector('render-block');
    if (!renderBlock) throw Error('Could not find <render-block>');
    renderBlock.innerHTML = this.template();
    if (this.afterRender) this.afterRender();
    if (this.addEvents) this.addEvents();
  }

  // Called before render(). placeholder, can be overidden
  // This does not include the initial cloneNode
  beforeRender() {}
  // Called after render(). placeholder, can be overidden
  // This does not include the initial cloneNode
  afterRender() {}

  // this is called when the component is connected
  // This is also called after render, events are first remoed before render so you dont have multiple events
  addEvents() {}
  // this is called when the component is disconnected
  // This is also called prior to render, after render addEvents is called. This will make sure you old elements dont retain events
  removeEvents() {}

  // add css that will be injected to the template
  styles() {}

  // add css to the document root
  externalStyles() {}

  // File path from root of project
  // stylesFile() {}

  // add html template, This will be used to create the template and direct render
  template() {}
};
