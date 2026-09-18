/**
 * loadtests/scenarios/04-mixed-traffic.js
 *
 * Scenario D — Mixed Realistic Traffic
 *
 * Simulates a realistic production traffic mix using k6's named scenarios
 * with `constantArrivalRate` executor:
 *
 *   ┌─────────────────────┬────────┬─────────────────────────────────┐
 *   │ Scenario            │ Weight │ Description                     │
 *   ├─────────────────────┼────────┼─────────────────────────────────┤
 *   │ browseCatalogue     │  50%   │ Product listing with filters    │
 *   │ productDetail       │  30%   │ Individual product page opens   │
 *   │ cartOperations      │  20%   │ Authenticated cart CRUD         │
 *   └─────────────────────┴────────┴─────────────────────────────────┘
 *
 * Concurrency sweeps:
 *   --env CONCURRENCY=100   →  100 VU max across all executors
 *   --env CONCURRENCY=1000  → 1000 VU max across all executors
 *   --env CONCURRENCY=10000 → 10000 VU max across all executors
 *
 * Run:
 *   k6 run scenarios/04-mixed-traffic.js --env CONCURRENCY=100
 *   k6 run --out json=runs/mixed-1000vus.json scenarios/04-mixed-traffic.js --env CONCURRENCY=1000
 *
 * Env vars:
 *   BASE_URL      (default: http://localhost:5000)
 *   CONCURRENCY   (default: 100)
 *   TEST_USER_EMAIL
 *   TEST_USER_PASSWORD
 */

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";
import { getToken } from "../helpers/auth.js";
import { getProductIds } from "../helpers/product-ids.js";

// ── Custom metrics ────────────────────────────────────────────────────────────
const overallErrorRate = new Rate("mixed_error_rate");
const browseLatency    = new Trend("mixed_browse_latency", true);
const detailLatency    = new Trend("mixed_detail_latency", true);
const cartLatency      = new Trend("mixed_cart_latency", true);
const rateLimitHits    = new Counter("mixed_rate_limit_hits");

// ── Config ────────────────────────────────────────────────────────────────────
const BASE_URL    = __ENV.BASE_URL    || "http://localhost:5000";
const CONCURRENCY = parseInt(__ENV.CONCURRENCY || "100", 10);

// Distribute VUs: 50% browse, 30% detail, 20% cart
const BROWSE_VUS = Math.ceil(CONCURRENCY * 0.50);
const DETAIL_VUS = Math.ceil(CONCURRENCY * 0.30);
const CART_VUS   = Math.max(1, Math.floor(CONCURRENCY * 0.20));

// Arrival rates (requests per second) derived from VU allocation
// Assumption: each VU does ~0.5 rps after think-time
const BROWSE_RPS = Math.ceil(BROWSE_VUS * 0.5);
const DETAIL_RPS = Math.ceil(DETAIL_VUS * 0.5);
const CART_RPS   = Math.max(1, Math.ceil(CART_VUS * 0.3));

// ── k6 options ────────────────────────────────────────────────────────────────
export const options = {
  scenarios: {
    browseCatalogue: {
      executor:        "ramping-arrival-rate",
      startRate:       1,
      timeUnit:        "1s",
      preAllocatedVUs: Math.ceil(BROWSE_VUS * 0.5),
      maxVUs:          BROWSE_VUS,
      stages: [
        { duration: "30s", target: Math.ceil(BROWSE_RPS * 0.5) },
        { duration: "60s", target: BROWSE_RPS },
        { duration: "30s", target: 0 },
      ],
      exec: "browseFn",
      tags: { scenario_name: "browse" },
    },

    productDetail: {
      executor:        "ramping-arrival-rate",
      startRate:       1,
      timeUnit:        "1s",
      preAllocatedVUs: Math.ceil(DETAIL_VUS * 0.5),
      maxVUs:          DETAIL_VUS,
      stages: [
        { duration: "30s", target: Math.ceil(DETAIL_RPS * 0.5) },
        { duration: "60s", target: DETAIL_RPS },
        { duration: "30s", target: 0 },
      ],
      exec: "detailFn",
      tags: { scenario_name: "detail" },
    },

    cartOperations: {
      executor:        "ramping-arrival-rate",
      startRate:       1,
      timeUnit:        "1s",
      preAllocatedVUs: Math.ceil(CART_VUS * 0.5),
      maxVUs:          CART_VUS,
      stages: [
        { duration: "30s", target: Math.ceil(CART_RPS * 0.5) },
        { duration: "60s", target: CART_RPS },
        { duration: "30s", target: 0 },
      ],
      exec: "cartFn",
      tags: { scenario_name: "cart" },
    },
  },

  thresholds: {
    mixed_error_rate:                ["rate<0.10"],  // up to 10% tolerated (rate limiting expected at high VUs)
    "http_req_failed":               ["rate<0.10"],
    "mixed_browse_latency":          ["p(95)<800"],
    "mixed_detail_latency":          ["p(95)<500"],
    "mixed_cart_latency":            ["p(95)<1500"],
  },
};

const CATEGORIES = [
  "Sofas & Seating",
  "Beds & Bedroom",
  "Dining Furniture",
  "Living Room",
  "Tables & Desks",
  "Storage & Cabinets",
];
const SORT_OPTIONS = ["price_asc", "price_desc", "rating", ""];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ── Setup ─────────────────────────────────────────────────────────────────────
export function setup() {
  const token = getToken();
  if (!token) throw new Error("Could not obtain JWT — is the server running and test user seeded?");

  const ids = getProductIds();
  if (ids.length === 0) throw new Error("No product IDs — seed the product catalogue first.");

  console.log(`[mixed] CONCURRENCY=${CONCURRENCY}`);
  console.log(`        browse=${BROWSE_VUS} VUs @ ${BROWSE_RPS} rps`);
  console.log(`        detail=${DETAIL_VUS} VUs @ ${DETAIL_RPS} rps`);
  console.log(`        cart=${CART_VUS} VUs @ ${CART_RPS} rps`);

  return { token, ids };
}

// ── Executor functions ─────────────────────────────────────────────────────────

/** 50% of traffic — product listing with random filters */
export function browseFn(data) {
  const cat  = pick(CATEGORIES);
  const sort = pick(SORT_OPTIONS);
  const page = Math.ceil(Math.random() * 5);
  let url = `${BASE_URL}/api/products?page=${page}&limit=12&category=${cat}`;
  if (sort) url += `&sort=${sort}`;

  const res = http.get(url, { tags: { name: "mixed_browse" } });
  browseLatency.add(res.timings.duration);

  const ok = check(res, {
    "mixed-browse: 200": (r) => r.status === 200,
  });
  if (res.status === 429) rateLimitHits.add(1);
  overallErrorRate.add(!ok);
  sleep(0.5 + Math.random() * 1.5);
}

/** 30% of traffic — individual product pages */
export function detailFn(data) {
  const id = data.ids[Math.floor(Math.random() * data.ids.length)];
  const res = http.get(`${BASE_URL}/api/products/${id}`, { tags: { name: "mixed_detail" } });
  detailLatency.add(res.timings.duration);

  const ok = check(res, {
    "mixed-detail: 200": (r) => r.status === 200,
    "mixed-detail: _id": (r) => !!r.json("_id"),
  });
  if (res.status === 429) rateLimitHits.add(1);
  overallErrorRate.add(!ok);
  sleep(0.3 + Math.random() * 1.0);
}

/** 20% of traffic — authenticated cart operations */
export function cartFn(data) {
  const { token, ids } = data;
  const hdrs = {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    tags: { name: "mixed_cart" },
  };

  // GET cart
  const getRes = http.get(`${BASE_URL}/api/cart`, hdrs);
  cartLatency.add(getRes.timings.duration);
  const ok1 = check(getRes, { "mixed-cart: GET 200": (r) => r.status === 200 });
  if (getRes.status === 429) rateLimitHits.add(1);
  overallErrorRate.add(!ok1);

  sleep(0.3);

  // POST add item (50% of cart traffic)
  if (Math.random() < 0.5) {
    const productId = ids[Math.floor(Math.random() * ids.length)];
    const addRes = http.post(
      `${BASE_URL}/api/cart/items`,
      JSON.stringify({ productId, quantity: 1 }),
      hdrs
    );
    cartLatency.add(addRes.timings.duration);
    const ok2 = check(addRes, { "mixed-cart: ADD 200": (r) => r.status === 200 });
    if (addRes.status === 429) rateLimitHits.add(1);
    overallErrorRate.add(!ok2);
  }

  sleep(0.5 + Math.random() * 1.0);
}
