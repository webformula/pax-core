import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const writeFileAsync = promisify(fs.writeFile);

export async function buildServiceWorker({ distFolder, cacheFiles }) {
  const version = `${Date.now()}_${parseInt(Math.random() * 999999)}`;
  await writeFileAsync(`${distFolder}/serviceWorker.js`, serviceWorkerFile({ version, cacheFiles: cacheFiles.join(`?${version}",\n"`) }));
}

export function getServiceWorkerRegister({ include = false, autoReload = true }) {
  if (include) return html`
if ('serviceWorker' in navigator) {
  let worker;
  let refreshing = false;
  const autoReloadWorker = ${autoReload === true ? 'true' : 'false'};

  // Register the service worker
  navigator.serviceWorker.register('./serviceWorker.js').then(reg => {
    reg.addEventListener('updatefound', () => {
      // An updated service worker has appeared in reg.installing!
      worker = reg.installing;

      worker.addEventListener('statechange', () => {
        // Has service worker state changed?
        switch (worker.state) {
          case 'installed':
            // There is a new service worker available, show the notification
            if (navigator.serviceWorker.controller) {
              if (autoReloadWorker) skipWaiting();
              else callOnNewServiceWorkerAvailable();
            }
            break;
        }
      });
    });
  });

  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (refreshing) return;
    window.location.reload();
    refreshing = true;
  });

  function skipWaiting() {
    if (worker) worker.postMessage({ action: 'skipWaiting' });
    else throw Error('no worker found')
  }
  window.serviceWorkerSkipWaiting = skipWaiting;

  const onNewServiceWorkerAvailableCallbacks = [];
  function onNewServiceWorkerAvailable(callback) {
    if (!onNewServiceWorkerAvailableCallbacks[callback]) onNewServiceWorkerAvailableCallbacks.push(callback);
  }
  window.onNewServiceWorkerAvailable= onNewServiceWorkerAvailable;

  function callOnNewServiceWorkerAvailable() {
    onNewServiceWorkerAvailableCallbacks.forEach(cb => cb());
  }
}
  `;

  return html`
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations()
      .then(registrations => {
        for(let registration of registrations) {
          registration.unregister();
        }
      });

    function noWorker() {
      throw Error('no worker registered')
    }
    window.serviceWorkerSkipWaiting = noWorker;
    window.onNewServiceWorkerAvailable= noWorker;
  }
  `;
}


function serviceWorkerFile({ version, cacheFiles }) {
  return `
const version = '${version}';

self.addEventListener('install', event => {
  event.waitUntil(cacheAll([
    "${cacheFiles}"
  ]));
});

self.addEventListener('activate', event => {
  event.waitUntil(deleteFromCache())
});

self.addEventListener('fetch', (event) => {
  event.respondWith(getFromNetworkFallbackCache(event.request))
});

// used for the update and reload process
self.addEventListener('message', event => {
  if (event.data.action === 'skipWaiting') self.skipWaiting();
});


// Alternate strategy that is currently not used
async function getFromNetworkFallbackCache(request) {
  try {
   return await fetchResourceAndCache(request);
 } catch {
   const resource = await cachedResource(request);
   if (!resource) throw Error('no resource found');
   return resource;
 }
}

async function getFromCacheThenNetwork(request) {
  try {
   const resource = await cachedResource(request);
   if (!resource) throw Error('no resource found');
   return resource;
 } catch (e) {
   try {
     return await fetchResourceAndCache(request);
   } catch (e) {
     throw e;
   }
 }
}


async function fetchResourceAndCache(request) {
  const cache = await caches.open(version);

  if (request.method === 'GET') {
    // cache busting url based on service worker version
    const url = request.url.indexOf('?') === -1 ? request.url + '?' + version : request.url + '&' + version;
    const response = await fetch(url);
    cache.put(request, response.clone());
    return response;
  } else {
    return fetch(request);
  }
}

async function cachedResource(request) {
  const cache = await caches.open(version);
  return cache.match(request)
}

async function cacheAll(resources) {
  const cache = await caches.open(version);
  return cache.addAll(resources);
}

async function deleteFromCache() {
  const keys = await caches.keys();
  return Promise.all(keys.filter(key => key !== version).map(key => caches.delete(key)));
}
  `;
}
