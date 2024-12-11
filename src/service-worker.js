const CACHE_NAME = 'respy-tech-v1.0.0';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/main.js',
  '/styles.css',
  '/dist/bundle.js',
  '/vendor/gsap.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle HTTP(S) requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Always try the network first
        return fetch(event.request)
          .then((networkResponse) => {
            // If network request succeeds, update the cache
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  // Only cache same-origin requests
                  if (new URL(event.request.url).origin === location.origin) {
                    cache.put(event.request, responseToCache);
                  }
                });
            }
            return networkResponse;
          })
          .catch(() => {
            // If network fails, serve from cache
            return response;
          });
      })
  );
});