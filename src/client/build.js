const { html } = require('common-tags');
const fs = require('fs');
const pageBuilder = require('../server_client/pageBuilder.js');
const mainScriptBuilder = require('../server_client/mainScriptBuilder.js');
const customElements = require('../server_client/customElements.js');
const HTMLElementExtended = require('../server_client/HTMLElementExtended.js');
const global = require('../server_client/global.js');
const document = require('../server_client/document.js');
const window = require('../server_client/window.js');

module.exports = ({ pageMapper, layout, indexHTML, path = 'dist' }) => {
  const mainScript = mainScriptBuilder.client(pageMapper);
  const indexPage = pageBuilder.client(pageMapper.getIndex());
  const pages = Object.keys(pageMapper.modules).map(uri => {
    return pageBuilder.client(pageMapper.modules[uri]);
  });
  const pageClasses = pages.map(p => p.classStr).join('\n\n');
  const headScript = html`
    <script>
      // main util methods
      ${mainScript}

      // global classes
      ${global._buildClient()}

      // Use this in place of HTMLElement to get the advanced features
      ${HTMLElementExtended.toString()}

      // customElemnts
      ${customElements.getStaticFile()}

      // Pages
      ${pageClasses}

      // build initial page
      window.${indexPage.id} = new ${indexPage.className}();
      window.currentPageClass = window.${indexPage.id};
      setTimeout(function () {
        ${indexPage.id}.connectedCallback();
      }, 0);
    </script>
  `;

  const headStyle = html`
    <style>
      ${customElements.getStaticExternalStyle()}
    </style>
  `;

  let pageLayout = '';
  if (layout) {
    pageLayout = layout({
      head: html`
        <!-- --- Scripts --- -->
        ${headScript}

        <!-- --- Styles --- -->
        ${headStyle}
      `,
      title: `<span class="pax-core-title-inject">${indexPage.title}</span>`,
      body: indexPage.template
    });
  } else if (indexHTML) {
    const splitHTML = indexHTML.split('</head>');
    pageLayout = [splitHTML[0], headScript, '</head>', splitHTML[1]].join('\n');
  } else {
    throw Error('Either `layout` or `indexHTML` is required');
  }

  if (!fs.existsSync(path)) fs.mkdirSync(path);
  fs.writeFileSync(`${path}/index.html`, pageLayout);
};
