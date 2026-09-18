# Furniva Load Tests

Isolated k6 load-testing harness for the Furniva API.  
Lives in `/loadtests` — entirely separate from the Jest/Supertest unit-test suite in `/server/tests`.

---

## Prerequisites

### 1. Install k6

**Windows (recommended):**
```powershell
winget install k6 --source winget
# or via Chocolatey:
choco install k6
```

**macOS:**
```bash
brew install k6
```

**Linux (Debian/Ubuntu):**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
  | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6
```

Verify: `k6 version`

---

### 2. Prepare the Test User

The load-test scenarios authenticate against the live API. Before running tests, seed a dedicated test user:

```bash
# from /loadtests
npm run seed

# or with custom credentials / host:
BASE_URL=http://localhost:5000 \
TEST_USER_EMAIL=loadtest@furniva.dev \
TEST_USER_PASSWORD=LoadTest123! \
npm run seed
```

Expected output:
```
🔧  Furniva Load-Test Seeder
    API  → http://localhost:5000
    User → loadtest@furniva.dev       # Seed product catalogue (if not already done)
```

### 3. Set up the load-test user

```powershell
# From the loadtests/ directory
cd loadtests
node helpers/seed-test-user.js
```

Expected output:
```
🔧  Furniva Load-Test Seeder
    API  → http://localhost:5000
    User → loadtest@furniva.dev

  [1/3] Attempting registration …
       ✅  User registered successfully.
  [2/3] Logging in to obtain JWT …
       ✅  Login successful. Token obtained.
  [3/3] Writing token to runs/.token …
       ✅  Token written to: .../loadtests/runs/.token

✅  Seed complete! You can now run k6 scenarios.
```

### 4. Configure environment (optional)

```powershell
cp .env.example .env
# Edit .env if using a non-default BASE_URL or different credentials
```

---

## Running Scenarios

All commands are run from the `loadtests/` directory.

### Scenario A — Browse Products (unauthenticated, pagination + filters)

```powershell
# 100 VUs
k6 run --out json=runs/browse-100vus.json scenarios/01-browse-products.js --env MAX_VUS=100

# 1 000 VUs
k6 run --out json=runs/browse-1000vus.json scenarios/01-browse-products.js --env MAX_VUS=1000

# 10 000 VUs  ⚠️ expect rate-limiter 429s to dominate
k6 run --out json=runs/browse-10000vus.json scenarios/01-browse-products.js --env MAX_VUS=10000
```

### Scenario B — Product Detail Cache

```powershell
k6 run --out json=runs/detail-100vus.json   scenarios/02-product-detail.js --env MAX_VUS=100
k6 run --out json=runs/detail-1000vus.json  scenarios/02-product-detail.js --env MAX_VUS=1000
k6 run --out json=runs/detail-10000vus.json scenarios/02-product-detail.js --env MAX_VUS=10000
```

### Scenario C — Authenticated Cart Flow

```powershell
k6 run --out json=runs/cart-100vus.json   scenarios/03-cart-flow.js --env MAX_VUS=100
k6 run --out json=runs/cart-1000vus.json  scenarios/03-cart-flow.js --env MAX_VUS=1000
k6 run --out json=runs/cart-10000vus.json scenarios/03-cart-flow.js --env MAX_VUS=10000
```

> **Note:** The JWT is obtained once in `setup()`. All VUs share the same auth token to avoid hitting the `authLimiter` (10 req / 15 min / IP).

### Scenario D — Mixed Realistic Traffic (all combined)

```powershell
k6 run --out json=runs/mixed-100vus.json   scenarios/04-mixed-traffic.js --env CONCURRENCY=100
k6 run --out json=runs/mixed-1000vus.json  scenarios/04-mixed-traffic.js --env CONCURRENCY=1000
k6 run --out json=runs/mixed-10000vus.json scenarios/04-mixed-traffic.js --env CONCURRENCY=10000
```

Traffic split: **50% browse / 30% detail / 20% cart**

---

## npm Scripts (shorthand)

```powershell
npm run seed               # Create load-test user

npm run test:browse:100    # Scenario A @ 100  VUs
npm run test:browse:1000   # Scenario A @ 1000 VUs
npm run test:browse:10000  # Scenario A @ 10000 VUs

npm run test:detail:100    # Scenario B @ 100  VUs
npm run test:detail:1000   # Scenario B @ 1000 VUs
npm run test:detail:10000  # Scenario B @ 10000 VUs

npm run test:cart:100      # Scenario C @ 100  VUs
npm run test:cart:1000     # Scenario C @ 1000 VUs
npm run test:cart:10000    # Scenario C @ 10000 VUs

npm run test:mixed:100     # Scenario D @ 100  VUs
npm run test:mixed:1000    # Scenario D @ 1000 VUs
npm run test:mixed:10000   # Scenario D @ 10000 VUs

npm run test:all:100       # Run all 4 scenarios @ 100 VUs sequentially
npm run test:all:1000      # Run all 4 scenarios @ 1000 VUs sequentially

npm run report             # Parse runs/*.json and print bottleneck report
```

---

## Generating the Report (Task 3)

After running scenarios, generate the bottleneck analysis:

```powershell
node report/analyze.js

# Markdown output (pipe to a file):
node report/analyze.js --markdown > report/results.md
```

Example output:
```
════════════════════════════════════════════════════════
  METRICS SUMMARY
════════════════════════════════════════════════════════

Scenario      VUs      RPS    p50ms    p95ms    p99ms    Err%     429%       Reqs
────────────────────────────────────────────────────────────────────────────────
browse        100     45.2     38.4     91.3    148.7    0.12%    0.00%      4032
browse       1000    312.1    108.2  ⚠ 924.8   1847.2    2.41%    1.34%     28819
browse      10000    811.3    341.9  ⚠1842.3   3901.7  ⚠22.3%  ⚠18.7%     73301
...

════════════════════════════════════════════════════════
  TASK 3 — BOTTLENECK REPORT
════════════════════════════════════════════════════════

  ⏱  Latency Degradation (p95 > 800 ms)
  ──────────────────────────────────────────────────────
  Scenario   : browse
  Breaks at  : 1000 VUs
  Symptom    : p95 latency exceeded 800 ms (got 924 ms)
  Root cause : Single Node.js process CPU saturation ...
```

---

## Architecture Notes

### Why k6 (not Artillery)?

| Feature | k6 | Artillery |
|---|---|---|
| Config style | Pure JS (ES6 modules) | YAML + optional JS engine |
| Built-in metrics | p50/p95/p99/RPS natively | Requires reporter plugins |
| VU model | Green threads (goroutines) | Node.js event loop per worker |
| Custom metrics | `Counter`, `Trend`, `Rate` built-in | Limited without plugins |
| Binary | Standalone, zero npm deps | Requires `npm install` |

### Rate-Limit Awareness

The server has two rate limiters:

| Limiter | Limit | Applied to |
|---|---|---|
| `authLimiter` | 10 req / 15 min / IP | `/api/auth/login`, `/register` |
| `generalLimiter` | 200 req / 15 min / IP | All routes |

**Mitigation in tests:** The JWT is fetched once in `setup()` (single call to `/auth/login`). VUs share this token. At ≥ 800 VUs from localhost, the `generalLimiter` will trigger and intentionally surface the bottleneck.

### Custom Metrics

| Metric | Type | Scenario |
|---|---|---|
| `browse_cache_hits` | Counter | A — reads `X-Cache: HIT` header |
| `browse_cache_misses` | Counter | A |
| `browse_list_latency` | Trend | A |
| `detail_cache_hits` | Counter | B |
| `detail_latency` | Trend | B |
| `cart_error_rate` | Rate | C |
| `cart_read_latency` | Trend | C |
| `cart_write_latency` | Trend | C |
| `mixed_rate_limit_hits` | Counter | D — counts 429 responses |

---

## Directory Structure

```
loadtests/
├── package.json              ← npm scripts for all runs
├── .env.example              ← environment variable template
├── README.md                 ← this file
├── helpers/
│   ├── seed-test-user.js     ← Node.js: register + login + save JWT
│   ├── auth.js               ← k6: getToken() for setup()
│   └── product-ids.js        ← k6: getProductIds() for setup()
├── scenarios/
│   ├── 01-browse-products.js ← Scenario A: browsing
│   ├── 02-product-detail.js  ← Scenario B: cache hit/miss
│   ├── 03-cart-flow.js       ← Scenario C: authenticated cart
│   └── 04-mixed-traffic.js   ← Scenario D: realistic mix
├── runs/
│   └── .gitkeep              ← JSON outputs land here (git-ignored)
└── report/
    └── analyze.js            ← Task 2+3 report generator
```
