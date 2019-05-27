const config = require('./config.js');
const customElements = require('../server_client/customElements.js');
const mainScriptBuilder = require('../server_client/mainScriptBuilder.js');
const serviceWorkerLoader_js = require('./serviceWorkerLoader.js');
const serviceWorker_js = require('./serviceWorker.js');
const global = require('../server_client/global.js');
const HTMLElementExtended = require('../server_client/HTMLElementExtended.js');


function validate(params) {
  if (!params) throw Error('Requires params');
  if (!params.path) throw Error('Requires params.path');
}

function getMime(file) {
  if (file.includes('.js')) return 'text/javascript';
  if (file.includes('.css')) return 'text/css';
  if (file.includes('.html')) return 'text/html';
  return 'text/plain';
}


exports.handleScripts = (params) => {
  validate(params);
  if (params.path.includes('pax.js')) return `
// main util methods
${mainScriptBuilder.server()}

// global classes
${global._buildClient()}

// Use this in place of HTMLElement to get the advanced features
${HTMLElementExtended.toString()}

// customElemnts
${customElements.getStaticFile()}
  `;
  if (params.path.includes('load-service-worker.js')) return `${serviceWorkerLoader_js()}`;
  if (params.path.includes('service-worker.js')) return `${serviceWorker_js(params)}`;
};

exports.handleCSS = (params) => {
   validate(params);
   if (params.path.includes('pax.css')) return `${customElements.getStaticExternalStyle()}`;
};

exports.expressFileHandler = (req, res, next) => {
  const mime = getMime(req.path);
  let content;
  if (mime === 'text/javascript') content = exports.handleScripts({
    path: req.path
  });
  if (mime === 'text/css') content = exports.handleCSS({
    path: req.path
  });

  if (!content) return next();
  res.type(mime);
  // res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(content);
};
