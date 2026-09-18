/**
 * loadtests/helpers/seed-test-user.js
 *
 * Run ONCE before any load test:
 *   node helpers/seed-test-user.js
 *
 * Creates (or verifies) the dedicated load-test user account and writes the
 * JWT token to loadtests/runs/.token so k6 scenarios can read it.
 *
 * Requirements: Node >= 18 (uses native fetch). Server must be running.
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── Config ──────────────────────────────────────────────────────────────────
const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
const EMAIL    = process.env.TEST_USER_EMAIL    || "loadtest@furniva.dev";
const PASSWORD = process.env.TEST_USER_PASSWORD || "LoadTest123!";
const NAME     = "Load Test User";
const TOKEN_PATH = resolve(__dirname, "../runs/.token");
const RUNS_DIR   = resolve(__dirname, "../runs");

// ── Helpers ──────────────────────────────────────────────────────────────────
async function post(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🔧  Furniva Load-Test Seeder`);
  console.log(`    API  → ${BASE_URL}`);
  console.log(`    User → ${EMAIL}\n`);

  // 1. Attempt to register (will 400 if already exists — that's fine)
  console.log("  [1/3] Attempting registration …");
  const reg = await post("/api/auth/register", { name: NAME, email: EMAIL, password: PASSWORD });

  if (reg.status === 201) {
    console.log("       ✅  User registered successfully.");
  } else if (reg.status === 400 && (reg.data?.message || "").includes("already exists")) {
    console.log("       ℹ️   User already exists — skipping registration.");
  } else {
    console.error("       ❌  Unexpected registration response:", reg.status, reg.data);
    process.exit(1);
  }

  // 2. Login to get a fresh JWT
  console.log("  [2/3] Logging in to obtain JWT …");
  const login = await post("/api/auth/login", { email: EMAIL, password: PASSWORD });

  if (login.status !== 200) {
    console.error("       ❌  Login failed:", login.status, login.data);
    process.exit(1);
  }
  const token = login.data?.token;
  if (!token) {
    console.error("       ❌  No token in login response:", login.data);
    process.exit(1);
  }
  console.log("       ✅  Login successful. Token obtained.");

  // 3. Persist token
  console.log("  [3/3] Writing token to runs/.token …");
  mkdirSync(RUNS_DIR, { recursive: true });
  writeFileSync(TOKEN_PATH, token, "utf-8");
  console.log(`       ✅  Token written to: ${TOKEN_PATH}`);

  console.log("\n✅  Seed complete! You can now run k6 scenarios.\n");
}

main().catch((err) => {
  console.error("\n❌  Seeder error:", err.message);
  process.exit(1);
});
