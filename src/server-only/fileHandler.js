const config = require('./config');
const customElements = require('../server-client/customElements');
const buildMainScripts = require('../server-client/buildMainScript');
const serviceWorkerLoader_js = require('./service-worker-loader.js');
const serviceWorker_js = require('./service-worker.js');

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

exports.scripts = (params) => {
  validate(params);
  if (params.path.includes('pax.js')) return `${buildMainScripts.server()}\n\n${customElements.getStaticFile()}`;
  if (params.path.includes('load-service-worker.js')) return `${serviceWorkerLoader_js()}`;
  if (params.path.includes('service-worker.js')) return `${serviceWorker_js(params)}`;
};

exports.css = (params) => {
   validate(params);
   if (params.path.includes('pax.css')) return `${customElements.getStaticExternalCSS()}`;
};

exports.expressFileHandler = (req, res, next) => {
  const mime = getMime(req.path);
  let content;
  if (mime === 'text/javascript') content = exports.scripts({
    path: req.path
  });
  if (mime === 'text/css') content = exports.css({
    path: req.path
  });

  if (!content) return next();
  res.type(mime);
  // res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(content);
};
