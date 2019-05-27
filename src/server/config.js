// Global Configuration

const config = {
  /*
   * This will memoize certain methods to prevent unnecessary processing
   * This is essantially equal to static file performance after the first request
   */
  // memoize: true,

  /*
   * default: true
   * user built in service worker to manage cache
   */
  serviceWorker: false
};

exports.getConfig = (name) => name !== undefined ? config[name] : config;
exports.setConfig = (params = {}) => {
  Object.keys(config).forEach(key => {
    if (params[key] !== undefined) config[key] = params[key];
  });
};
