const HTMLElement = require('./HTMLElement.js');
const document = require('./document.js');


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
    if (this.beforeRender) this.beforeRender();
    const renderBlock = this.shadowRoot.querySelector('render-block');
    if (!renderBlock) throw Error('Could not find <render-block>');
    renderBlock.innerHTML = this.template();
    if (this.afterRender) this.afterRender();
  }

  // Called before render(). placeholder, can be overidden
  // This does not include the initial cloneNode
  beforeRender() {}
  // Called after render(). placeholder, can be overidden
  // This does not include the initial cloneNode
  afterRender() {}

  // add css that will be injected to the template
  styles() {}

  // add css to the document root
  externalStyles() {}

  // File path from root of project
  // stylesFile() {}

  // add html template, This will be used to create the template and direct render
  template() {}
};
