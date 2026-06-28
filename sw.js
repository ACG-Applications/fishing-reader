// ===== SERVICE WORKER =====
// Graded Japanese Readers - Offline Support

const CACHE_NAME = 'jp-readers-v1';
const ASSETS = [
  // HTML
  './',
  './index.html',
  
  // Icons
  './favicon.ico',
  './icon-48x48.png',
  './icon-72x72.png',
  './icon-96x96.png',
  './icon-144x144.png',
  './icon-192x192.png',
  './icon-512x512.png',
  
  // Audio files
  './Reader L01-Fishing-Malaysia.mp4',
  './Reader L01-Fishing-Malaysia.mp3',
  
  // PDFs (optional - can be large, but we cache them for offline access)
  './Reader L01-Fishing-Malaysia.pdf',
  './Reader L01-Fishing-Malaysia-Test.pdf',
  
  // Screenshot
  './Fishing.png'
];

// ===== INSTALL =====
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching assets...');
        return cache.addAll(ASSETS);
      })
      .then(() => {
        console.log('[SW] Installation complete!');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Installation failed:', error);
      })
  );
});

// ===== ACTIVATE =====
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        // Remove old caches
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Activation complete!');
        return self.clients.claim();
      })
  );
});

// ===== FETCH =====
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return cached response if available
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Otherwise fetch from network
        return fetch(event.request)
          .then(response => {
            // Only cache successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response
            const responseToCache = response.clone();
            
            // Cache the new resource
            caches.open(CACHE_NAME)
              .then(cache => {
                try {
                  cache.put(event.request, responseToCache);
                } catch (e) {
                  // Silently fail if can't cache
                }
              });
            
            return response;
          })
          .catch(error => {
            console.warn('[SW] Fetch failed:', error);
            // Optional: return a fallback page for HTML requests
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('./index.html');
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

console.log('[SW] Service worker loaded!');