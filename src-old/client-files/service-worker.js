module.exports = () => `
  var _cacheName = 'wcn-cache';

  self.addEventListener('install', function (event) {
    event.waitUntil(
      caches.open(_cacheName).then(function (cache) {
        return cache.addAll(
          [
            // TODO get list of html css and javascript
            // can use page mapper and then parse links and scripts
          ]
        );
      })
    );
  });

  self.addEventListener('activate', function (event) {
    event.waitUntil(
      caches.keys().then(function (cacheNames) {
        return Promise.all(
          cacheNames.filter(function (cacheName) {
            return cacheName === _cacheName;
          }).map(function (cacheName) {
            return caches.delete(cacheName);
          })
        );
      })
    );
  });


  self.addEventListener('fetch', function (event) {
    event.respondWith(
      caches.open(_cacheName).then(function (cache) {
        return cache.match(event.request).then(function (response) {
          return response || fetch(event.request).then(function (response) {
            if (!event.request.url.includes('load-service-worker.js')) cache.put(event.request, response.clone());
            return response;
          }).catch(function() {
            return caches.match('/offline.html');
          }).catch(function() {
            return new Response("<h2>No page loaded</h2><p>You are currently offline and the page is not cahced, Please check you internet and reload to access this page.</p>", {
              headers: {'Content-Type': 'text/html'}
            });
          });
        });
      }).catch(function (e) {
        throw e;
      })
    );
  });
`;
