// ═══════════════════════════════════════════════════════════════════════════════
// Furniva PWA Service Worker (sw.js)
// ═══════════════════════════════════════════════════════════════════════════════

const CACHE_NAME = "furniva-static-v1";
const DYNAMIC_CACHE = "furniva-dynamic-v1";

// Static assets to pre-cache on service worker installation
const PRECACHE_ASSETS = [
  "/",
  "/offline.html",
  "/favicon.svg",
  "/manifest.webmanifest",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-192.svg",
  "/icons/icon-maskable-512.svg",
];

// Sensitive endpoints that must NEVER be cached (private customer data, auth, payments)
const NEVER_CACHE_PATTERNS = [
  /\/api\/auth\//i,
  /\/api\/payment\//i,
  /\/api\/orders/i,
  /\/api\/cart/i,
  /\/api\/addresses/i,
  /\/api\/tickets/i,
  /\/api\/admin\//i,
  /\/api\/notifications/i,
  /\/api\/returns/i,
  /\/api\/coupons\/validate/i,
];

// External payment/checkout hosts that must NEVER be intercepted
const EXTERNAL_BYPASS_HOSTS = [
  "checkout.razorpay.com",
  "api.razorpay.com",
  "lumberjack.razorpay.com",
  "api.cloudinary.com",
];

// ── Service Worker Installation ──────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn("[SW] Pre-cache failed:", err);
      })
  );
});

// ── Service Worker Activation ────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME && key !== DYNAMIC_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch Event Interception ─────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. Only handle GET requests (Never interfere with POST, PUT, DELETE, PATCH)
  if (request.method !== "GET") {
    return;
  }

  // 2. Bypass Razorpay payment gateway and third-party sensitive hosts completely
  if (EXTERNAL_BYPASS_HOSTS.some((host) => url.hostname.includes(host))) {
    return;
  }

  // 3. Sensitive customer / auth / payment API endpoints must NEVER be cached
  if (NEVER_CACHE_PATTERNS.some((pattern) => pattern.test(url.pathname))) {
    return;
  }

  // Also bypass if request carries an Authorization header
  if (request.headers.has("Authorization")) {
    return;
  }

  // 4. HTML Navigation Requests (Network-First with offline.html fallback)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // If valid response, clone into cache for offline viewing
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(async () => {
          // If network failed, try matching cached route or return offline.html
          const cached = await caches.match(request);
          if (cached) return cached;
          const offlinePage = await caches.match("/offline.html");
          return offlinePage || Response.error();
        })
    );
    return;
  }

  // 5. Static Assets (JS, CSS, SVGs, Fonts, Images) -> Stale-While-Revalidate
  const isStaticAsset =
    url.pathname.match(/\.(js|css|svg|png|jpg|jpeg|webp|ico|woff|woff2|ttf|json)$/i) ||
    url.origin === self.location.origin && url.pathname.startsWith("/assets/");

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return networkResponse;
          })
          .catch(() => null);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 6. Public Product Catalog API (/api/products) -> Network-First (live data, cache fallback)
  if (url.pathname.startsWith("/api/products")) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return new Response(JSON.stringify({ products: [], offline: true }), {
            headers: { "Content-Type": "application/json" },
          });
        })
    );
    return;
  }
});
