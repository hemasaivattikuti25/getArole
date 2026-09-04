/**
 * getArole Service Worker (Production PWA Caching Strategy)
 * Version: 2.5.0 - Network First for HTML and Static Assets, Cache fallback for offline
 */

const CACHE_VERSION = 'getarole-v2.5.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;

const PRECACHE_ASSETS = [
  '/',
  '/dashboard/',
  '/explore/',
  '/matches/',
  '/profile/',
  '/preferences/',
  '/onboarding/',
  '/resume-builder/',
  '/cover-letter-builder/',
  '/logo.svg',
  '/js/getarole-core.js',
  '/js/mobile-nav.js',
  '/js/storage-sync.js'
];

// Install: Pre-cache shell assets & skip waiting
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Pre-cache warning:', err);
      });
    })
  );
});

// Activate: Clean up outdated cache versions immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE && key !== API_CACHE) {
            console.log('[SW] Purging outdated cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Listen for messages from frontend clients (e.g. logout or purge)
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'CLEAR_USER_CACHE') {
    caches.delete(API_CACHE).then(() => {
      console.log('[SW] User API cache successfully purged.');
    });
  }
  if (event.data && event.data.action === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch: Network First for HTML and JS/CSS to guarantee fresh updates
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and dynamic user/auth endpoints
  if (request.method !== 'GET') return;
  if (
    url.pathname.startsWith('/api/user') ||
    url.pathname.startsWith('/api/ai') ||
    url.pathname.startsWith('/api/candidate')
  ) {
    return; // Direct network pass-through
  }

  // 1. API Route: Stale-While-Revalidate for Job Listings
  if (url.pathname.startsWith('/api/jobs')) {
    event.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 2. HTML Navigation Pages & Static Assets: Network First with Cache Fallback
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/dashboard');
          }
        });
      })
  );
});
