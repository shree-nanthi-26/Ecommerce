/**
 * loadtests/scenarios/03-cart-flow.js
 *
 * Scenario C — Login + Authenticated Cart Operations
 *
 * Simulates a logged-in user session:
 *   1. GET  /api/cart               — view current cart
 *   2. POST /api/cart/items         — add a random product
 *   3. GET  /api/cart               — confirm cart updated
 *   4. PUT  /api/cart/items/:id     — update quantity
 *   5. DELETE /api/cart/items/:id   — remove item
 *
 * IMPORTANT: The JWT is obtained ONCE in setup() to avoid hitting the
 * rate-limited /api/auth/login endpoint (max 10 req / 15 min per IP).
 * All VUs share the same token — this is intentional for load testing;
 * it stresses the cart DB layer, not the auth layer.
 *
 * Run:
 *   k6 run scenarios/03-cart-flow.js
 *   k6 run scenarios/03-cart-flow.js --env MAX_VUS=200
 *   k6 run --out json=runs/cart-200vus.json scenarios/03-cart-flow.js --env MAX_VUS=200
 *
 * Env vars:
 *   BASE_URL          (default: http://localhost:5000)
 *   MAX_VUS           (default: 100)
 *   RAMP_DURATION     (default: 30s)
 *   STEADY_DURATION   (default: 120s)
 *   TEST_USER_EMAIL
 *   TEST_USER_PASSWORD
 */

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";
import { getToken } from "../helpers/auth.js";
import { getProductIds } from "../helpers/product-ids.js";

// ── Custom metrics ────────────────────────────────────────────────────────────
const cartErrorRate  = new Rate("cart_error_rate");
const cartReadLat    = new Trend("cart_read_latency", true);
const cartWriteLat   = new Trend("cart_write_latency", true);
const authFailures   = new Counter("cart_auth_failures");

// ── Config ────────────────────────────────────────────────────────────────────
const BASE_URL        = __ENV.BASE_URL        || "http://localhost:5000";
const MAX_VUS         = parseInt(__ENV.MAX_VUS         || "100", 10);
const RAMP_DURATION   = __ENV.RAMP_DURATION   || "30s";
const STEADY_DURATION = __ENV.STEADY_DURATION || "120s";

// ── k6 options ────────────────────────────────────────────────────────────────
export const options = {
  stages: [
    { duration: RAMP_DURATION,   target: Math.ceil(MAX_VUS * 0.25) },
    { duration: RAMP_DURATION,   target: Math.ceil(MAX_VUS * 0.75) },
    { duration: STEADY_DURATION, target: MAX_VUS },
    { duration: RAMP_DURATION,   target: 0 },
  ],
  thresholds: {
    "http_req_duration{scenario:cart}": ["p(95)<1200"],
    cart_error_rate: ["rate<0.05"],
  },
};

// ── Setup (runs once, single VU) ──────────────────────────────────────────────
export function setup() {
  const token = getToken();
  if (!token) throw new Error("Could not obtain JWT — is the server running and test user seeded?");

  const ids = getProductIds();
  if (ids.length === 0) throw new Error("No product IDs available — seed the product catalogue first.");

  console.log(`[cart] Setup complete. ${ids.length} product IDs ready.`);
  return { token, ids };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function authHeaders(token) {
  return {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    tags: { scenario: "cart" },
  };
}

function pickId(ids) {
  return ids[Math.floor(Math.random() * ids.length)];
}

// ── VU function ───────────────────────────────────────────────────────────────
export default function (data) {
  const { token, ids } = data;
  const hdrs = authHeaders(token);
  let addedProductId = null;

  // ── Step 1: View cart ────────────────────────────────────────────────────
  group("cart: GET /api/cart", () => {
    const res = http.get(`${BASE_URL}/api/cart`, hdrs);
    cartReadLat.add(res.timings.duration);

    const ok = check(res, {
      "cart-get: status 200": (r) => r.status === 200,
      "cart-get: has items":  (r) => Array.isArray(r.json("items")),
    });
    if (res.status === 401) authFailures.add(1);
    cartErrorRate.add(!ok);
  });

  sleep(0.3 + Math.random() * 0.5);

  // ── Step 2: Add item ─────────────────────────────────────────────────────
  const productId = pickId(ids);
  group("cart: POST /api/cart/items", () => {
    const res = http.post(
      `${BASE_URL}/api/cart/items`,
      JSON.stringify({ productId, quantity: 1 }),
      hdrs
    );
    cartWriteLat.add(res.timings.duration);

    const ok = check(res, {
      "cart-add: status 200":    (r) => r.status === 200,
      "cart-add: has items":     (r) => Array.isArray(r.json("items")),
    });
    if (res.status === 401) authFailures.add(1);
    cartErrorRate.add(!ok);
    addedProductId = productId;
  });

  sleep(0.3 + Math.random() * 0.5);

  // ── Step 3: Confirm cart updated ─────────────────────────────────────────
  group("cart: GET /api/cart (verify)", () => {
    const res = http.get(`${BASE_URL}/api/cart`, hdrs);
    cartReadLat.add(res.timings.duration);
    check(res, { "cart-verify: status 200": (r) => r.status === 200 });
  });

  sleep(0.2);

  // ── Step 4: Update quantity ───────────────────────────────────────────────
  if (addedProductId) {
    group("cart: PUT /api/cart/items/:id", () => {
      const res = http.put(
        `${BASE_URL}/api/cart/items/${addedProductId}`,
        JSON.stringify({ quantity: 2 }),
        hdrs
      );
      cartWriteLat.add(res.timings.duration);
      check(res, { "cart-update: status 200": (r) => r.status === 200 });
    });

    sleep(0.2 + Math.random() * 0.3);

    // ── Step 5: Remove item ───────────────────────────────────────────────
    group("cart: DELETE /api/cart/items/:id", () => {
      const res = http.del(
        `${BASE_URL}/api/cart/items/${addedProductId}`,
        null,
        hdrs
      );
      cartWriteLat.add(res.timings.duration);
      check(res, { "cart-remove: status 200": (r) => r.status === 200 });
    });
  }

  // Think time between full cart interaction cycles
  sleep(1 + Math.random() * 2);
}

export function teardown(data) {
  console.log("[cart] Scenario complete.");
}
