import { loadHTML } from "./main.js";

export default class HTMLElementExtended extends HTMLElement {
  useShadowRoot = false;
  // static templateString = 'string or path of html';
  // static cssString = 'string or path of css';

  #initiated = false;

  constructor() {
    super();

    // this.id = this.id || this.#templateId;
  }

  async beforeRender() { }
  async afterRender() { }

  template() {
    return /*html*/'';
  }

  async render() {
    if (!this.#initiated) {
      if (this.useShadowRoot) {
        this.attachShadow({ mode: 'open' });
        this.rootElement = this.shadowRoot;
      } else {
        this.rootElement = this;
      }

      this.#initiated = true;
    }

    await this.beforeRender();

    let renderedTemplate;
    if (this.templateString) {
      if (this.templateString.match(/.*\.html$/) !== null) {
        this.templateString = await loadHTML(this.templateString);
      }
      renderedTemplate = new Function(`return \`${this.templateString}\`;`).call(this, this);
    } else {
      renderedTemplate = this.template.call(this, this);
    }

    this.rootElement.innerHTML = renderedTemplate;

    await this.afterRender();
  }


  // TODO look into how this would happen without rerender?
  // #createTemplate() {
  //   document.body.insertAdjacentHTML('beforeend', /*html*/`
  //     <template id="${this.#templateId}">
  //       <tr>
  //         <td class="record"></td>
  //         <td></td>
  //       </tr>
  //     </template>
  //   `);
  // }
}
