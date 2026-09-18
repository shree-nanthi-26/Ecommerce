/**
 * loadtests/scenarios/02-product-detail.js
 *
 * Scenario B — Product Detail Cache Hit/Miss
 *
 * Simulates users opening individual product pages. The first iteration
 * cold-starts the Redis cache; subsequent iterations from the pool of IDs
 * exercise the cache-hit path, letting us measure the Redis vs MongoDB
 * latency difference directly.
 *
 * Run:
 *   k6 run scenarios/02-product-detail.js
 *   k6 run scenarios/02-product-detail.js --env MAX_VUS=1000
 *   k6 run --out json=runs/detail-1000vus.json scenarios/02-product-detail.js --env MAX_VUS=1000
 *
 * Env vars:
 *   BASE_URL          (default: http://localhost:5000)
 *   MAX_VUS           (default: 100)
 *   RAMP_DURATION     (default: 30s)
 *   STEADY_DURATION   (default: 120s)
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";
import { getProductIds } from "../helpers/product-ids.js";

// ── Custom metrics ────────────────────────────────────────────────────────────
const cacheHits   = new Counter("detail_cache_hits");
const cacheMisses = new Counter("detail_cache_misses");
const errorRate   = new Rate("detail_error_rate");
const detailLatency = new Trend("detail_latency", true);

// ── Config ────────────────────────────────────────────────────────────────────
const BASE_URL        = __ENV.BASE_URL        || "http://localhost:5000";
const MAX_VUS         = parseInt(__ENV.MAX_VUS         || "100", 10);
const RAMP_DURATION   = __ENV.RAMP_DURATION   || "30s";
const STEADY_DURATION = __ENV.STEADY_DURATION || "120s";

// ── k6 options ────────────────────────────────────────────────────────────────
export const options = {
  stages: [
    { duration: RAMP_DURATION,   target: MAX_VUS },
    { duration: STEADY_DURATION, target: MAX_VUS },
    { duration: RAMP_DURATION,   target: 0 },
  ],
  thresholds: {
    // Cache-hit path should be very fast; p95 < 300 ms expected
    "http_req_duration{scenario:detail}": ["p(95)<500"],
    detail_error_rate: ["rate<0.05"],
  },
};

// ── Setup ─────────────────────────────────────────────────────────────────────
export function setup() {
  const ids = getProductIds();
  if (ids.length === 0) {
    throw new Error("No product IDs available — cannot run detail scenario.");
  }
  return { ids };
}

// ── VU function ───────────────────────────────────────────────────────────────
export default function (data) {
  const ids = data.ids;
  const id  = ids[Math.floor(Math.random() * ids.length)];

  const res = http.get(`${BASE_URL}/api/products/${id}`, {
    tags: { scenario: "detail" },
  });

  // Track cache header
  const xCache = res.headers["X-Cache"] || res.headers["x-cache"] || "";
  if (xCache.toLowerCase() === "hit")  cacheHits.add(1);
  if (xCache.toLowerCase() === "miss") cacheMisses.add(1);

  detailLatency.add(res.timings.duration);

  const success = check(res, {
    "detail: status 200":     (r) => r.status === 200,
    "detail: has _id":        (r) => !!r.json("_id"),
    "detail: has name":       (r) => typeof r.json("name") === "string",
    "detail: has price":      (r) => typeof r.json("price") === "number",
  });

  errorRate.add(!success);

  // Users briefly read a product page before moving on
  sleep(0.5 + Math.random() * 2);
}

// ── Teardown (optional reporting) ─────────────────────────────────────────────
export function teardown(data) {
  console.log(`[detail] Tested with ${data.ids.length} unique product IDs.`);
}
