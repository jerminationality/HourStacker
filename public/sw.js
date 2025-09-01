/* eslint-env serviceworker */
// Version from script query (?v=<commit>) for predictable cache busting
const VERSION = (() => {
  try {
    const url = new URL(self.location.href);
    return url.searchParams.get('v') || 'dev';
  } catch {
    return 'dev';
  }
})();

const PRECACHE = `hour-stacker-precache-${VERSION}`;
const RUNTIME = `hour-stacker-runtime`;

// Only stable, truly static assets go here. Do NOT precache '/'
const PRECACHE_URLS = [
  '/manifest.json',
  '/favicon.ico',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/offline.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PRECACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const currentCaches = [PRECACHE, RUNTIME];
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names.map((name) => {
            if (!currentCaches.includes(name)) {
              return caches.delete(name);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// Helpers
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
  return cached || networkPromise || new Response('Offline', { status: 503 });
};

const cacheFirst = async (request) => {
  const cache = await caches.open(RUNTIME);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.status === 200 && response.type !== 'opaque') {
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    if (request.destination === 'document') {
      return caches.match('/offline.html');
    }
    throw e;
  }
};

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never cache Next.js build/runtime assets to avoid staleness
  if (url.pathname.startsWith('/_next/')) {
    event.respondWith(fetch(request));
    return;
  }

  // Documents: network-first with offline fallback, do not cache HTML
  if (request.destination === 'document') {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request, { cache: 'no-store' });
        } catch {
          const offline = await caches.match('/offline.html');
          return offline || new Response('Offline', { status: 503 });
        }
      })()
    );
    return;
  }

  // Static assets (non-Next): cache-first
  if (['image', 'style', 'script', 'font'].includes(request.destination)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Same-origin others: stale-while-revalidate
  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
});

// Allow page to message the SW to force immediate activation
self.addEventListener('message', (event) => {
  if (event && event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
