const { setConfig } = require('./config.js');
const buildPage = require('./buildPage.js');
const { handleScripts, handleCSS, expressFileHandler } = require('./fileHandler.js');

module.exports = {
  setConfig,
  buildPage,
  handleScripts,
  handleCSS,
  expressFileHandler
};
