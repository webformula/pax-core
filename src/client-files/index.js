const components = require('../componentRegistry');
const files = {
  main_js: require('./main.js'),
  serviceWorkerLoader_js: require('./service-worker-loader'),
  serviceWorker_js: require('./service-worker'),
  components_js: components.staticFile,
  components_css: components.staticComponentCSS
};
const reg = /-([a-z])/g;

function toCamelCase(str) {
  return str.replace(reg, g => g[1].toUpperCase());
}

module.exports = params => {
  const cameled = toCamelCase(params.fileName.replace('.js', '_js').replace('.css', '_css'));
  if (!files[cameled]) throw Error('file not found');
  return {
    content: files[cameled](params),
    mime: getMime(params.fileName)
  };
};

function getMime(file) {
  if (file.includes('.js')) return 'text/javascript';
  if (file.includes('.css')) return 'text/css';
  if (file.includes('.html')) return 'text/html';
  return 'text/plain';
}


exports.getJavascript = () => {
  
}
