/**
 * getArole Service Worker (Production PWA Caching Strategy)
 * - Static Assets (CSS, JS, Fonts, Images): Cache First
 * - Job Search REST API (/api/jobs): Stale-While-Revalidate (10-minute fresh window)
 * - Navigation / HTML Documents: Network First with Cache Fallback
 */

const CACHE_VERSION = 'getarole-v1.2.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;

const PRECACHE_ASSETS = [
  '/',
  '/dashboard',
  '/explore',
  '/matches',
  '/profile',
  '/preferences',
  '/onboarding',
  '/logo.svg',
  '/js/getarole-core.js'
];

// Install: Pre-cache shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up outdated cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE && key !== API_CACHE) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Route-aware caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // 1. API Route: Stale-While-Revalidate for Job Listings
  if (url.pathname.startsWith('/api/jobs')) {
    event.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 2. Static Assets (JS, CSS, SVG, Images, Fonts): Cache First
  if (
    url.pathname.match(/\.(js|css|svg|png|jpg|jpeg|woff2|ico)$/) ||
    url.pathname.startsWith('/static/')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, networkResponse.clone()));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 3. HTML Navigation Pages: Network First with Cache Fallback
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, networkResponse.clone()));
        }
        return networkResponse;
      }).catch(() => {
        return caches.match(request).then((cached) => {
          return cached || caches.match('/dashboard');
        });
      })
    );
  }
});
