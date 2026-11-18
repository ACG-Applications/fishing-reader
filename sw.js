// ===== SERVICE WORKER =====
// Graded Japanese Readers - Offline Support

const CACHE_NAME = 'jp-readers-v8';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './offline.html',

  // Icons
  './favicon.ico',
  './icon-48x48.png',
  './icon-72x72.png',
  './icon-96x96.png',
  './icon-144x144.png',
  './icon-192x192.png',
  './icon-512x512.png',

  // Audio
  './ReaderL01-Fishing-Malaysia.mp4',

  // PDF
  './ReaderL01-Fishing-Malaysia.pdf'
];

// ===== INSTALL =====
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
      .catch(error => console.error('[SW] Installation failed:', error))
  );
});

// ===== ACTIVATE =====
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// ===== FETCH =====
self.addEventListener('fetch', event => {
  if (!event.request.url.startsWith(self.location.origin) || event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request)
        .then(response => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            try { cache.put(event.request, responseToCache); } catch (e) {}
          });

          return response;
        })
        .catch(error => {
          const acceptHeader = event.request.headers.get('accept');
          if (acceptHeader && acceptHeader.includes('text/html')) {
            return caches.match('./offline.html');
          }
          return new Response('Network error', { status: 503 });
        });
    })
  );
});

// ===== MESSAGE HANDLING =====
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
