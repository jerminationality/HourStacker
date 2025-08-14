// Enhanced service worker with versioned precache + runtime caching strategies
// Adjust VERSION on releases to force a new precache.
// Bump VERSION when changing caching logic so clients fetch a fresh SW.
const VERSION = 'v4';
const PRECACHE = `hour-stacker-precache-${VERSION}`;
const RUNTIME = 'hour-stacker-runtime';

// Core assets to always precache (app shell)
const PRECACHE_URLS = [
  '/manifest.json',
  '/favicon.ico',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/offline.html',
];

// Install: prefetch and cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PRECACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  const currentCaches = [PRECACHE, RUNTIME];
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        }),
      ),
    ).then(() => self.clients.claim()),
  );
});

// Strategy helpers
const staleWhileRevalidate = async (request) => {
  const cache = await caches.open(RUNTIME);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.status === 200 && response.type === 'basic') {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => undefined);
  return cached || networkPromise || new Response('Offline', {status: 503});
};

const cacheFirst = async (request) => {
  const cache = await caches.open(RUNTIME);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    if (request.destination === 'document') {
      // If you add an offline fallback page, return it here.
  return caches.match('/offline.html');
    }
    throw e;
  }
};

// Fetch handler with basic routing
self.addEventListener('fetch', (event) => {
  const {request} = event;
  const url = new URL(request.url);

  // Skip non-GET
  if (request.method !== 'GET') return;

  // Always bypass caching for Next.js build/runtime assets (especially in dev) to avoid stale chunks.
  if (url.pathname.startsWith('/_next/')) {
    event.respondWith(fetch(request));
    return;
  }

  // App shell documents: always network; only fallback offline on failure (no caching to avoid stale hashed asset refs)
  if (request.destination === 'document') {
    event.respondWith((async () => {
      try {
        return await fetch(request);
      } catch {
        return caches.match('/offline.html');
      }
    })());
    return;
  }

  // Static assets (images, style, script): cache-first
  if (['image', 'style', 'script', 'font'].includes(request.destination)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Same-origin API/data requests: stale-while-revalidate
  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Cross-origin: let network handle (could add specific CDN caching here)
});

// Optional: listen for skipWaiting trigger from page
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
