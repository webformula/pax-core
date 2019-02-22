const { html } = require('common-tags');
const fs = require('fs');
const pageBuilder = require('../server-client/pageBuilder');
const buildMainScript = require('../server-client/buildMainScript');
const customElements = require('../server-client/customElements');

// TODO can we make the pageMapper optional?

module.exports = ({ pageMapper, layout, indexHTML, path = 'dist' }) => {
  const mainScript = buildMainScript.client(pageMapper);
  const indexPage = pageBuilder.client(pageMapper.getIndex());
  const pages = Object.keys(pageMapper.modules).map(uri => {
    return pageBuilder.client(pageMapper.modules[uri]);
  });
  const pageClasses = pages.map(p => p.classStr).join('\n\n');
  const headScript = html`
    <script>
      ${mainScript}

      ${customElements.getStaticFile()}

      ${pageClasses}

      window.${indexPage.id} = new ${indexPage.className}();
      window.currentPageClass = window.${indexPage.id};
      setTimeout(function () {
        ${indexPage.id}.connectedCallback();
      }, 0);
    </script>
  `;

  const headStyle = html`
    <style>
      ${customElements.getStaticExternalCSS()}
    </style>
  `;

  let pageLayout = '';
  if (layout) {
    pageLayout = layout({
      head: html`
        ${headScript}

        ${headStyle}
      `,
      title: indexPage.title,
      body: indexPage.template
    });
  } else if (indexHTML) {
    const splitHTML = indexHTML.split('</head>');
    pageLayout = [splitHTML[0], headScript, headStyle, '</head>', splitHTML[1]].join('\n');
  } else {
    throw Error('Either `layout` or `indexHTML` is required');
  }

  if (!fs.existsSync(path)) fs.mkdirSync(path);
  fs.writeFileSync(`${path}/index.html`, pageLayout);
};
