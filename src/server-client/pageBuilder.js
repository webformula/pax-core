const { html } = require('common-tags');
const Page = require('./Page');

exports.client = (page) => {
  const instance = new page();
  return build(instance);
};

exports.server = async (page) => {
  const instance = new page();
  if (serverRender) await instance.serverRender();
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
      ${instance.html()}
    </render-block-page>
  `;
}

function getClassName(instance) {
  return instance.constructor.name;
}
