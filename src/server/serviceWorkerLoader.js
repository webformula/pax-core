const { getConfig } = require('./config.js');

const register = `
if ('serviceWorker' in navigator) {
  console.log('register capable')
  navigator.serviceWorker.register('/service-worker.js')
    .then(function(registration) {
      console.log('Registration successful, scope is:', registration.scope);
    })
    .catch(function(error) {
      console.log('Service worker registration failed, error:', error);
    });
}
`;

const unregister = `
if ('serviceWorker' in navigator) {
  console.log('unregister capable')
  navigator.serviceWorker.getRegistrations().then(function (registrations) {
    for(let registration of registrations) {
      registration.unregister();
    }
  });
}
`;

module.exports = () => getConfig('serviceWorker') ? register : unregister;
