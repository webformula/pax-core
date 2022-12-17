/** HTMLElementExtended
 *  Used to make customElements (web components)
 *  This extended class adds a few features to make it easier to build web components
 *    - Template
 *    - Render
 *    - before and after render methods
 *    - Easy to render with or without shadowDom
 *    - Uses template elements to increase performance
 */
const templateElements = {};


export default class HTMLElementExtended extends HTMLElement {
  #rendered = false;
  #templateString = this.template();
  #templateElement;
  #root = this;


  constructor(useShadowRoot = false, useTemplate = true) {
    super();

    if (this.#templateString) {
      this.#prepareRender(useShadowRoot, useTemplate);
      this.render();
    }
  }

  get rendered() {
    return this.#rendered;
  }

  // connectedCallback exists in customElement->HTMLElement. Called by browser when added to DOM
  connectedCallback() { }
  // disconnectedCallback exists in customElement->HTMLElement. Called by browser when removed from DOM
  disconnectedCallback() { }


  // beforeRender not called on initial render
  beforeRender() { }
  afterRender() { }

  // Return an HTML template string
  // If template is set then initial rendering will happen automatically
  template() {
    return /*html*/'';
  }

  // If template is set then initial rendering will happen automatically
  render() {
    if (this.#rendered) this.beforeRender();
    this.#root.replaceChildren(this.#templateElement.content.cloneNode(true));
    this.#rendered = true;
    this.afterRender();
  }

  #prepareRender(useShadowRoot, useTemplate) {
    if (useTemplate) {
      if (!templateElements[this.constructor.name]) {
        templateElements[this.constructor.name] = document.createElement('template');
        templateElements[this.constructor.name].innerHTML = this.#templateString;
      }

      this.#templateElement = templateElements[this.constructor.name];
    } else {
      this.#templateElement = document.createElement('template');
    }

    if (useShadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.#root = this.shadowRoot;
    } else this.#root = this;
  }

  // TODO replace with sanitizer api when supported https://developer.mozilla.org/en-US/docs/Web/API/HTML_Sanitizer_API
  // makes html safe from executing malicious code
  // Should be used for any user inputted data
  // htmlEscape(value = '') {
  //   return value
  //     .replace(/&/g, '&amp;')
  //     .replace(/>/g, '&gt;')
  //     .replace(/</g, '&lt;')
  //     .replace(/"/g, '&quot;')
  //     .replace(/'/g, '&#39;')
  //     .replace(/`/g, '&#96;');
  // }
}




// --- old --- 

// import { loadHTML } from "./main.js";

// export default class HTMLElementExtended extends HTMLElement {
//   useShadowRoot = false;
//   // static templateString = 'string or path of html';
//   // static cssString = 'string or path of css';

//   #initiated = false;

//   constructor() {
//     super();

//     // this.id = this.id || this.#templateId;
//   }

//   async beforeRender() { }
//   async afterRender() { }

//   // TODO replace with sanitizer api when supported https://developer.mozilla.org/en-US/docs/Web/API/HTML_Sanitizer_API
//   // makes html safe from executing malicious code
//   // Should be used for any user inputted data
//   htmlEscape(value = '') {
//     return value
//       .replace(/&/g, '&amp;')
//       .replace(/>/g, '&gt;')
//       .replace(/</g, '&lt;')
//       .replace(/"/g, '&quot;')
//       .replace(/'/g, '&#39;')
//       .replace(/`/g, '&#96;');
//   }

//   template() {
//     return /*html*/'';
//   }

//   async render() {
//     if (!this.#initiated) {
//       if (this.useShadowRoot) {
//         this.attachShadow({ mode: 'open' });
//         this.rootElement = this.shadowRoot;
//       } else {
//         this.rootElement = this;
//       }

//       this.#initiated = true;
//     }

//     await this.beforeRender();

//     let renderedTemplate;
//     if (this.templateString) {
//       if (this.templateString.match(/.*\.html$/) !== null) {
//         this.templateString = await loadHTML(this.templateString);
//       }
//       renderedTemplate = new Function(`return \`${this.templateString}\`;`).call(this, this);
//     } else {
//       renderedTemplate = this.template.call(this, this);
//     }

//     this.rootElement.innerHTML = renderedTemplate;

//     await this.afterRender();
//   }


//   // TODO look into how this would happen without rerender?
//   // #createTemplate() {
//   //   document.body.insertAdjacentHTML('beforeend', /*html*/`
//   //     <template id="${this.#templateId}">
//   //       <tr>
//   //         <td class="record"></td>
//   //         <td></td>
//   //       </tr>
//   //     </template>
//   //   `);
//   // }
// }
