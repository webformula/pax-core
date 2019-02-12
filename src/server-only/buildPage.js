const pageBuilder = require('../server-client/pageBuilder');

module.exports = async (page) => {
  const built = await pageBuilder.server(page);
  return {
    title: built.pageTitle,
    head: `
<script>
${built.classStr}
window.${built.id} = new ${built.className}();
setTimeout(function () {
  ${built.id}.connectedCallback();
}, 0);
</script>
    `,
    body: built.template
  };
};
