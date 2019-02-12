const { html } = require('common-tags');
const Page = require('../server-client/Page');

module.exports = (page) => {
  let instance = undefined;

  // is a class
  if (page.prototype && page.prototype.constructor) {
    instance = new page();
  // returns a function that returns class.build() returned
  } else if (typeof page === 'function') {
    instance = page();
  }

  const className = getClassName(instance);
  const template = buildTemplate(instance);

  return {
    className: className,
    id: `$${className}`,
    pageTitle: instance.title,
    classStr: instance.constructor.toString(),
    template
  };
};


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
