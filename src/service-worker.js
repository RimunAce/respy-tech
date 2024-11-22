const CACHE_NAME = 'respy-tech-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/api-providers/index.html',
  '/api-providers/styles2.css',
  '/styles.css',
  '/dist/bundle.js',
  '/vendor/gsap.min.js',
  '/assets/background/bgavif.avif',
  '/assets/background/bgavif-mobile.avif',
  '/assets/icons/cache.png',
  '/assets/icons/web.png',
  '/assets/icons/discord.png',
  '/assets/icons/github.png'
];

const DYNAMIC_CACHE = 'respy-tech-dynamic-v1';

// Install event - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME && name !== DYNAMIC_CACHE)
          .map(name => caches.delete(name))
      );
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Return cached response
        }

        // Clone the request because it can only be used once
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // Check if response is valid
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response because it can only be used once
          const responseToCache = response.clone();

          // Cache the fetched response
          caches.open(DYNAMIC_CACHE)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
  );
});

// Handle offline fallback
self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/offline.html');
      })
    );
  }
});