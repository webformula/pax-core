const { html } = require('common-tags');
const fs = require('fs');
const buildPage = require('./buiildPage');
const buildMainScript = require('../server-client/buildMainScript');
const customElements = require('../server-client/customElements');

// TODO can we make the pageMapper optional?

module.exports = ({ pageMapper, layout, indexHTML }) => {
  const mainScript = buildMainScript.client(pageMapper);
  const indexPage = buildPage(pageMapper.getIndex());
  const pages = Object.keys(pageMapper.modules).map(uri => {
    return buildPage(pageMapper.modules[uri]);
  });
  const pageClasses = pages.map(p => p.classStr).join('\n\n');
  const headScript = html`
    <script>
      ${mainScript}

      ${customElements.getStaticFile()}

      ${pageClasses}


      window.${indexPage.id} = new ${indexPage.className}();
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

  fs.writeFileSync('dist/index.html', pageLayout);
};
