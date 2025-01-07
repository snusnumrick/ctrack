const CACHE_NAME = 'plants-tracker-v1';
const ASSETS = [
  'ctrack/',
  'ctrack/index.html',
  'ctrack/app.js',
  'ctrack/manifest.json',
  'ctrack/icons/icon-192x192.png',
  'ctrack/icons/icon-512x512.png',
  'ctrack/favicon.ico',
  'ctrack/icons/icon-16x16.png',
  'ctrack/icons/icon-32x32.png',
  'ctrack/icons/icon-48x48.png'
];

// Install service worker and cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
  );
});

// Serve cached assets
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});

// Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});
