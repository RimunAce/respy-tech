const CACHE_NAME = 'respy-cache-v1';
const ALLOWED_HOSTS = [
    'self',
    'scripts.simpleanalyticscdn.com',
    'cdn.skypack.dev',
    'queue.simpleanalyticscdn.com'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll([
                    '/',
                    '/index.html',
                    '/api-providers/index.html',
                    '/api-providers/styles2.css',
                    '/api-providers/script.js',
                    '/api-providers/bgImageLoader.js'
                ]);
            })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip chrome-extension requests
    if (event.request.url.startsWith('chrome-extension://')) return;

    // Check if the request is for allowed hosts
    const url = new URL(event.request.url);
    const isAllowedHost = ALLOWED_HOSTS.some(host => {
        return host === 'self' ? 
            url.origin === self.location.origin : 
            url.hostname.includes(host);
    });

    if (!isAllowedHost) return;

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }

                return fetch(event.request).then(response => {
                    // Check if we received a valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone the response
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        })
                        .catch(err => console.warn('Caching failed:', err));

                    return response;
                });
            })
            .catch(error => {
                console.warn('Fetch failed:', error);
                return new Response('Network error', { status: 408, statusText: 'Network error' });
            })
    );
});