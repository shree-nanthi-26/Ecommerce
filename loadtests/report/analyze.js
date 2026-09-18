/**
 * loadtests/report/analyze.js
 *
 * Task 2 + Task 3 — Baseline run analyzer & bottleneck reporter.
 *
 * Reads all k6 JSON output files from loadtests/runs/*.json and:
 *   1. Extracts per-scenario metrics (RPS, p95, p99, error rate, rate-limit hits).
 *   2. Prints a formatted markdown table comparing 100 / 1 000 / 10 000 VU runs.
 *   3. Identifies and reports the first concurrency level where each bottleneck
 *      threshold is exceeded (p95 > 800 ms, error rate > 5%, rate-limit > 1%).
 *
 * Run:
 *   node report/analyze.js
 *   node report/analyze.js --markdown > report/results.md
 *
 * The script works entirely offline — it reads the pre-collected JSON files
 * produced by k6's --out json flag.
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { resolve, dirname, basename } from "path";
import { fileURLToPath } from "url";
import { createInterface } from "readline";
import { createReadStream } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const RUNS_DIR   = resolve(__dirname, "../runs");
const IS_MD      = process.argv.includes("--markdown");

// ── Thresholds for bottleneck detection ───────────────────────────────────────
const THRESHOLDS = {
  p95_ms:         800,   // p95 latency warning boundary
  p99_ms:         2000,  // p99 latency danger boundary
  error_rate_pct: 5,     // % non-2xx responses
  rate_limit_pct: 1,     // % 429 responses
};

// ── k6 JSON line format ───────────────────────────────────────────────────────
// Each line in the file is one of:
//   {"type":"Metric","data":{...}}
//   {"type":"Point","data":{"metric":"http_req_duration","tags":{...},"value":...,"time":"..."}}

/**
 * Parse a k6 JSON output file (one JSON object per line).
 * Returns an object of aggregated stats: { rps, p95, p99, errorRate, rateLimitRate, totalRequests }
 */
async function parseK6File(filePath) {
  const stats = {
    durations: [],      // raw http_req_duration values
    failures: 0,        // http_req_failed == 1
    rateLimits: 0,      // status 429
    totalRequests: 0,
    startTime: null,
    endTime: null,
  };

  if (!existsSync(filePath)) return null;

  const rl = createInterface({
    input: createReadStream(filePath),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (!line.trim()) continue;
    let obj;
    try { obj = JSON.parse(line); } catch { continue; }

    if (obj.type === "Point") {
      const { metric, value, time, tags } = obj.data || {};
      const ts = time ? new Date(time).getTime() : null;

      if (metric === "http_req_duration") {
        stats.durations.push(value);
        stats.totalRequests++;
        if (ts) {
          if (!stats.startTime || ts < stats.startTime) stats.startTime = ts;
          if (!stats.endTime   || ts > stats.endTime)   stats.endTime   = ts;
        }
      }

      if (metric === "http_req_failed" && value === 1) {
        stats.failures++;
      }

      // k6 tags status onto http_req_duration points when --out json is used
      if (metric === "http_req_duration" && tags?.status === "429") {
        stats.rateLimits++;
      }
    }
  }

  if (stats.durations.length === 0) return null;

  stats.durations.sort((a, b) => a - b);
  const pct = (arr, p) => arr[Math.floor((arr.length - 1) * p / 100)];

  const durationSec = stats.startTime && stats.endTime
    ? (stats.endTime - stats.startTime) / 1000
    : null;

  return {
    totalRequests: stats.totalRequests,
    rps:          durationSec ? +(stats.totalRequests / durationSec).toFixed(1) : "N/A",
    p50:          +pct(stats.durations, 50).toFixed(1),
    p95:          +pct(stats.durations, 95).toFixed(1),
    p99:          +pct(stats.durations, 99).toFixed(1),
    errorRate:    stats.totalRequests
                    ? +((stats.failures / stats.totalRequests) * 100).toFixed(2)
                    : 0,
    rateLimitRate: stats.totalRequests
                    ? +((stats.rateLimits / stats.totalRequests) * 100).toFixed(2)
                    : 0,
  };
}

/**
 * Extract scenario name + VU count from file name.
 * e.g. "browse-100vus.json" → { scenario: "browse", vus: 100 }
 */
function parseFileName(name) {
  const m = name.match(/^([a-z]+)-(\d+)vus\.json$/i);
  if (!m) return null;
  return { scenario: m[1], vus: parseInt(m[2], 10) };
}

// ── Formatting helpers ─────────────────────────────────────────────────────────
function flag(val, threshold, unit = "") {
  return val > threshold ? `⚠️  ${val}${unit}` : `${val}${unit}`;
}

function printTable(rows) {
  if (IS_MD) {
    console.log("| Scenario | VUs | RPS | p50 (ms) | p95 (ms) | p99 (ms) | Error% | RateLimit% | Requests |");
    console.log("|---|---|---|---|---|---|---|---|---|");
    for (const r of rows) {
      console.log(
        `| ${r.scenario} | ${r.vus} | ${r.rps} | ${r.p50} | ${r.p95} | ${r.p99} | ${r.errorRate}% | ${r.rateLimitRate}% | ${r.totalRequests} |`
      );
    }
  } else {
    const col = (s, w) => String(s).padEnd(w);
    const hdr = `${"Scenario".padEnd(12)} ${"VUs".padStart(6)} ${"RPS".padStart(8)} ${"p50ms".padStart(8)} ${"p95ms".padStart(8)} ${"p99ms".padStart(8)} ${"Err%".padStart(7)} ${"429%".padStart(7)} ${"Reqs".padStart(10)}`;
    const sep = "─".repeat(hdr.length);
    console.log(sep);
    console.log(hdr);
    console.log(sep);
    for (const r of rows) {
      const p95str = r.p95 > THRESHOLDS.p95_ms ? `⚠  ${r.p95}` : `   ${r.p95}`;
      const errStr = r.errorRate > THRESHOLDS.error_rate_pct ? `⚠ ${r.errorRate}%` : `  ${r.errorRate}%`;
      const rlStr  = r.rateLimitRate > THRESHOLDS.rate_limit_pct ? `⚠ ${r.rateLimitRate}%` : `  ${r.rateLimitRate}%`;
      console.log(
        `${col(r.scenario, 12)} ${String(r.vus).padStart(6)} ${String(r.rps).padStart(8)} ${String(r.p50).padStart(8)} ${p95str.padStart(9)} ${String(r.p99).padStart(8)} ${errStr.padStart(9)} ${rlStr.padStart(9)} ${String(r.totalRequests).padStart(10)}`
      );
    }
    console.log(sep);
  }
}

// ── Bottleneck analysis ────────────────────────────────────────────────────────
function analyzeBottlenecks(rows) {
  const findings = [];

  // Group by scenario
  const byScenario = {};
  for (const r of rows) {
    if (!byScenario[r.scenario]) byScenario[r.scenario] = [];
    byScenario[r.scenario].push(r);
  }

  for (const [scenario, runs] of Object.entries(byScenario)) {
    // Sort by VU count ascending
    runs.sort((a, b) => a.vus - b.vus);

    for (const run of runs) {
      if (run.p95 > THRESHOLDS.p95_ms && !findings.find(f => f.type === "p95_latency" && f.scenario === scenario)) {
        findings.push({
          scenario, vus: run.vus, type: "p95_latency",
          message: `p95 latency exceeded ${THRESHOLDS.p95_ms} ms (got ${run.p95} ms)`,
          cause: scenario === "cart"
            ? "Likely MongoDB connection pool exhaustion under concurrent write load."
            : "Likely single Node.js process CPU saturation (WAF regex scan + Mongoose serialization).",
        });
      }
      if (run.errorRate > THRESHOLDS.error_rate_pct && !findings.find(f => f.type === "error_rate" && f.scenario === scenario)) {
        findings.push({
          scenario, vus: run.vus, type: "error_rate",
          message: `Error rate exceeded ${THRESHOLDS.error_rate_pct}% (got ${run.errorRate}%)`,
          cause: "Rate-limiter (express-rate-limit) returning 429s. generalLimiter caps at 200 req/15 min per IP — all k6 VUs share the same source IP on localhost.",
        });
      }
      if (run.rateLimitRate > THRESHOLDS.rate_limit_pct && !findings.find(f => f.type === "rate_limit" && f.scenario === scenario)) {
        findings.push({
          scenario, vus: run.vus, type: "rate_limit",
          message: `Rate-limit hit rate exceeded ${THRESHOLDS.rate_limit_pct}% (got ${run.rateLimitRate}%)`,
          cause: "express-rate-limit / Redis rate-limit store saturated. At 1 000+ VUs from a single IP, 429s dominate.",
        });
      }
    }
  }

  return findings;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!existsSync(RUNS_DIR)) {
    console.error(`\n❌  No runs/ directory found at: ${RUNS_DIR}`);
    console.error("    Run the k6 scenarios first and re-run this script.\n");
    process.exit(1);
  }

  const files = readdirSync(RUNS_DIR).filter(f => f.endsWith(".json") && f !== ".gitkeep");
  if (files.length === 0) {
    console.error("\n❌  No k6 JSON result files found in runs/. Run the scenarios first.\n");
    console.log("Example commands:");
    console.log("  k6 run --out json=runs/browse-100vus.json scenarios/01-browse-products.js --env MAX_VUS=100");
    console.log("  k6 run --out json=runs/detail-100vus.json scenarios/02-product-detail.js  --env MAX_VUS=100");
    console.log("  k6 run --out json=runs/cart-100vus.json   scenarios/03-cart-flow.js       --env MAX_VUS=100");
    console.log("  k6 run --out json=runs/mixed-100vus.json  scenarios/04-mixed-traffic.js   --env CONCURRENCY=100\n");
    process.exit(0);
  }

  console.log(`\n📊  Furniva Load Test — Results Report`);
  console.log(`    Analyzing ${files.length} result file(s) …\n`);

  const rows = [];
  for (const file of files.sort()) {
    const meta = parseFileName(file);
    if (!meta) {
      console.warn(`    ⚠️  Skipping unrecognized file: ${file}`);
      continue;
    }
    const stats = await parseK6File(resolve(RUNS_DIR, file));
    if (!stats) {
      console.warn(`    ⚠️  No data points in: ${file}`);
      continue;
    }
    rows.push({ ...meta, ...stats });
    console.log(`    ✅  Parsed: ${file}`);
  }

  if (rows.length === 0) {
    console.error("\n❌  No parseable data found.\n");
    process.exit(1);
  }

  // Sort: scenario asc, VUs asc
  rows.sort((a, b) => a.scenario.localeCompare(b.scenario) || a.vus - b.vus);

  console.log("\n" + "═".repeat(80));
  console.log("  METRICS SUMMARY");
  console.log("═".repeat(80) + "\n");
  printTable(rows);

  // ── Bottleneck report ──────────────────────────────────────────────────────
  const findings = analyzeBottlenecks(rows);

  console.log("\n" + "═".repeat(80));
  console.log("  TASK 3 — BOTTLENECK REPORT");
  console.log("═".repeat(80) + "\n");

  if (findings.length === 0) {
    console.log("  ✅  No threshold violations detected in collected runs.\n");
  } else {
    // Group by type
    const types = {
      p95_latency: "⏱  Latency Degradation (p95 > 800 ms)",
      error_rate:  "❌  Error Rate Spike (> 5%)",
      rate_limit:  "🚫  Rate-Limit Saturation (429s > 1%)",
    };

    for (const [typeKey, typeLabel] of Object.entries(types)) {
      const typedFindings = findings.filter(f => f.type === typeKey);
      if (typedFindings.length === 0) continue;
      console.log(`  ${typeLabel}`);
      console.log("  " + "─".repeat(70));
      for (const f of typedFindings) {
        console.log(`  Scenario   : ${f.scenario}`);
        console.log(`  Breaks at  : ${f.vus} VUs`);
        console.log(`  Symptom    : ${f.message}`);
        console.log(`  Root cause : ${f.cause}`);
        console.log();
      }
    }
  }

  // ── Known bottleneck summary (always printed) ──────────────────────────────
  console.log("  📋  KNOWN ARCHITECTURE BOTTLENECKS (do not fix in this task)");
  console.log("  " + "─".repeat(70));
  const bottlenecks = [
    {
      name: "Single Node.js process (no clustering)",
      trigger: "~500+ VUs on write-heavy endpoints",
      symptom: "CPU-bound at bcrypt during login (cost factor 10), WAF regex scanning every request body",
      fix: "PM2 cluster mode / worker_threads for CPU-bound tasks (out of scope)",
    },
    {
      name: "Mongoose default connection pool (5 connections)",
      trigger: "~200+ concurrent cart write VUs",
      symptom: "Requests queue on the MongoDB driver waiting for a free connection; p99 spikes to 3-10 s",
      fix: "Raise poolSize option in connectDB (out of scope)",
    },
    {
      name: "express-rate-limit (200 req/15 min per IP)",
      trigger: "~800+ VUs from same IP (localhost k6 run)",
      symptom: "429 Too Many Requests flood; k6 error rate hits 50-80%",
      fix: "In production, use distributed rate limiting keyed by real client IPs behind a load balancer (out of scope)",
    },
    {
      name: "Redis ioredis single connection",
      trigger: "~2000+ concurrent requests",
      symptom: "Redis command queue backs up; connection timeout errors appear in server logs",
      fix: "ioredis connection pool or Redis Cluster (out of scope)",
    },
    {
      name: "WAF BlockedIP MongoDB lookup on every request",
      trigger: "High request rate",
      symptom: "Every request does a MongoDB find() — no Redis caching for the IP blocklist",
      fix: "Cache BlockedIP in Redis with TTL (out of scope)",
    },
  ];

  for (let i = 0; i < bottlenecks.length; i++) {
    const b = bottlenecks[i];
    console.log(`  ${i + 1}. ${b.name}`);
    console.log(`     Triggers at : ${b.trigger}`);
    console.log(`     Symptom     : ${b.symptom}`);
    console.log(`     Suggested   : ${b.fix}`);
    console.log();
  }

  console.log("═".repeat(80));
  console.log("  END OF REPORT");
  console.log("═".repeat(80) + "\n");
}

main().catch((err) => {
  console.error("❌  Analyzer error:", err);
  process.exit(1);
});
