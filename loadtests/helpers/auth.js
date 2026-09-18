/**
 * loadtests/helpers/auth.js
 *
 * k6 helper — call from setup() to obtain a Bearer token for the load-test
 * user. Returns the token string so all VUs share one auth session.
 *
 * Strategy:
 *   • Reads runs/.token written by seed-test-user.js (preferred — avoids
 *     hitting the rate-limited /auth/login endpoint during the test).
 *   • Falls back to a live login call if the file is absent.
 *
 * Usage in a scenario:
 *   import { getToken } from '../helpers/auth.js';
 *   export function setup() { return { token: getToken() }; }
 */

import http from "k6/http";
import { check } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:5000";

/**
 * Returns a valid JWT for the load-test user.
 * Must be called from k6 setup() — NOT from the VU function (shared state).
 */
export function getToken() {
  // The token file is made available via k6's --config or open() only in init
  // context, so we do a live login here — but only once per test run (setup).
  const email    = __ENV.TEST_USER_EMAIL    || "loadtest@furniva.dev";
  const password = __ENV.TEST_USER_PASSWORD || "LoadTest123!";

  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { "Content-Type": "application/json" }, tags: { name: "setup_login" } }
  );

  const ok = check(res, {
    "setup: login 200": (r) => r.status === 200,
    "setup: token present": (r) => !!r.json("token"),
  });

  if (!ok) {
    console.error(`[auth.js] Login failed (${res.status}): ${res.body}`);
    return null;
  }

  return res.json("token");
}
