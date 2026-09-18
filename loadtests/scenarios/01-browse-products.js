/**
 * loadtests/scenarios/01-browse-products.js
 *
 * Scenario A — Browse Products (pagination + filtering)
 *
 * Simulates users browsing the product catalogue with random categories,
 * pages, price bands, and sort orders — the most common unauthenticated
 * traffic pattern on an e-commerce site.
 *
 * Run:
 *   k6 run scenarios/01-browse-products.js
 *   k6 run scenarios/01-browse-products.js --env MAX_VUS=1000
 *   k6 run --out json=runs/browse-1000vus.json scenarios/01-browse-products.js --env MAX_VUS=1000
 *
 * Env vars:
 *   BASE_URL          (default: http://localhost:5000)
 *   MAX_VUS           (default: 100)
 *   RAMP_DURATION     (default: 30s)
 *   STEADY_DURATION   (default: 60s)
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

// ── Custom metrics ────────────────────────────────────────────────────────────
const cacheHits     = new Counter("browse_cache_hits");
const cacheMisses   = new Counter("browse_cache_misses");
const errorRate     = new Rate("browse_error_rate");
const listLatency   = new Trend("browse_list_latency", true); // in ms

// ── Config ────────────────────────────────────────────────────────────────────
const BASE_URL        = __ENV.BASE_URL        || "http://localhost:5000";
const MAX_VUS         = parseInt(__ENV.MAX_VUS         || "100", 10);
const RAMP_DURATION   = __ENV.RAMP_DURATION   || "30s";
const STEADY_DURATION = __ENV.STEADY_DURATION || "60s";

// ── k6 options ────────────────────────────────────────────────────────────────
export const options = {
  stages: [
    { duration: RAMP_DURATION,   target: Math.ceil(MAX_VUS * 0.5) }, // ramp to 50%
    { duration: RAMP_DURATION,   target: MAX_VUS },                  // ramp to full
    { duration: STEADY_DURATION, target: MAX_VUS },                  // hold steady
    { duration: RAMP_DURATION,   target: 0 },                        // ramp-down
  ],
  thresholds: {
    // Keep p95 under 800 ms and error rate under 5 %
    "http_req_duration{scenario:browse}": ["p(95)<800"],
    browse_error_rate: ["rate<0.05"],
  },
};

// ── Data pools ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  "Sofas & Seating",
  "Beds & Bedroom",
  "Dining Furniture",
  "Living Room",
  "Tables & Desks",
  "Storage & Cabinets",
];
const SORT_OPTIONS = ["price_asc", "price_desc", "rating", ""];
const PRICE_BANDS = [
  { min: 0,    max: 500   },
  { min: 500,  max: 1500  },
  { min: 1500, max: 5000  },
  { min: 5000, max: 50000 },
  { min: null, max: null  }, // no price filter
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── VU function ───────────────────────────────────────────────────────────────
export default function () {
  const category  = pick(CATEGORIES);
  const sort      = pick(SORT_OPTIONS);
  const band      = pick(PRICE_BANDS);
  const page      = Math.ceil(Math.random() * 5);
  const limit     = pick([12, 24]);

  let url = `${BASE_URL}/api/products?page=${page}&limit=${limit}&category=${category}`;
  if (sort)         url += `&sort=${sort}`;
  if (band.min !== null) url += `&minPrice=${band.min}&maxPrice=${band.max}`;

  const res = http.get(url, {
    tags: { scenario: "browse", category },
  });

  // Track cache header if server sets X-Cache (add this header in a future enhancement)
  const xCache = res.headers["X-Cache"] || res.headers["x-cache"] || "";
  if (xCache.toLowerCase() === "hit")  cacheHits.add(1);
  if (xCache.toLowerCase() === "miss") cacheMisses.add(1);

  listLatency.add(res.timings.duration);

  const success = check(res, {
    "browse: status 200":        (r) => r.status === 200,
    "browse: has products array":(r) => Array.isArray(r.json("products")),
    "browse: has total count":   (r) => r.json("total") >= 0,
  });

  errorRate.add(!success);

  // Realistic think time: users pause 1–4 s between page loads
  sleep(1 + Math.random() * 3);
}
