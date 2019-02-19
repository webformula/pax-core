const { html } = require('common-tags');
const Page = require('./Page');

exports.client = (page) => {
  // handle custom page functions
  if (!(page.prototype instanceof Page) && typeof page === 'function') {
    return page();
  }
  // handle standard page class
  const instance = new page();
  return build(instance);
};

exports.server = async (page) => {
  // handle custom page functions
  if (!(page.prototype instanceof Page) && typeof page === 'function') {
    return await page();
  }

  // handle standard page class
  const instance = new page();
  if (instance.serverRender) await instance.serverRender();
  return build(instance);
};

function build(instance) {
  const className = getClassName(instance);
  const template = buildTemplate(instance);

  return {
    className: className,
    id: `$${className}`,
    pageTitle: instance.title,
    classStr: instance.constructor.toString(),
    template
  };
}


function buildTemplate(instance) {
  return html`
    <render-block-page>
      ${instance.template()}
    </render-block-page>
  `;
}

function getClassName(instance) {
  return instance.constructor.name;
}
