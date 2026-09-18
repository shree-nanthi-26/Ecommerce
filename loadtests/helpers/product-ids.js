/**
 * loadtests/helpers/product-ids.js
 *
 * k6 helper — fetches the first two pages of products during setup() and
 * returns an array of product ID strings. VU functions use these IDs to hit
 * detail endpoints without repeated listing calls.
 *
 * Usage:
 *   import { getProductIds } from '../helpers/product-ids.js';
 *   export function setup() {
 *     return { ids: getProductIds() };
 *   }
 */

import http from "k6/http";
import { check } from "k6";

const BASE_URL    = __ENV.BASE_URL    || "http://localhost:5000";
const PAGE_SIZE   = parseInt(__ENV.PRODUCT_PAGE_SIZE || "12", 10);

/**
 * Must be called from k6 setup() (single-VU init phase).
 * Returns an array of product ID strings (up to PAGE_SIZE * 2).
 */
export function getProductIds() {
  const ids = [];

  for (let page = 1; page <= 2; page++) {
    const url = `${BASE_URL}/api/products?page=${page}&limit=${PAGE_SIZE}`;
    const res = http.get(url, { tags: { name: "setup_product_list" } });

    const ok = check(res, {
      [`setup: products page ${page} status 200`]: (r) => r.status === 200,
    });

    if (!ok) {
      console.error(`[product-ids.js] Failed to fetch product page ${page}: ${res.status}`);
      continue;
    }

    let body;
    try {
      body = res.json();
    } catch (e) {
      console.error(`[product-ids.js] JSON parse error on page ${page}`);
      continue;
    }

    const products = body?.products || [];
    for (const p of products) {
      if (p._id) ids.push(p._id);
    }
  }

  if (ids.length === 0) {
    console.error("[product-ids.js] No product IDs fetched — seed the DB first (npm run seed in /server).");
  } else {
    console.log(`[product-ids.js] Fetched ${ids.length} product IDs for test scenarios.`);
  }

  return ids;
}
