# SDK Swap Metrics

## Before (15.0.0)

### 1. Installed SDK Size

**Stellar SDK and dependencies in node_modules:**

| Package | Version | Size |
|---------|---------|------|
| @stellar/stellar-sdk | 15.0.0 | 14 MB |
| @stellar/stellar-sdk | 14.6.1 | 14 MB |
| @stellar/stellar-sdk | 14.2.0 | 13 MB |
| @stellar/stellar-base | 15.0.0 | 3.8 MB |
| @stellar/stellar-base | 14.1.0 | 3.8 MB |
| @stellar/stellar-base | 14.0.1 | 3.8 MB |
| @stellar/js-xdr | 4.0.0 | 832 KB |
| @stellar/js-xdr | 3.1.2 | 796 KB |

**Active dependency (for SDK 15.0.0):**
- @stellar/stellar-sdk@15.0.0: 14 MB
- @stellar/stellar-base@15.0.0: 3.8 MB
- @stellar/js-xdr@4.0.0: 832 KB

---

### 2. Full Build with Timing

**Command:** `pnpm build`

**Result:** ✅ SUCCESS

```
Tasks:    6 successful, 6 total
Cached:    0 cached, 6 total
  Time:    3.784s

Wall time: 4.859s (pnpm build 2>&1 6.84s user 1.08s system 163% cpu 4.859 total)
```

**Build details:**
- shared: built successfully
- paywall: ESM build success in 98ms
- simple-paywall-client: built in 416ms
- facilitator: build success in 7ms
- simple-paywall-server: build success in 10ms

---

### 3. Paywall Browser Bundle Size

**Browser distribution files:**

| File | Size |
|------|------|
| entry.js | 3.6 MB |
| stellar-paywall.html | 3.6 MB |
| entry.css | 87 KB |
| styles.css | 4.3 KB |

**Generated template (embeds bundle):**
- packages/paywall/src/gen/template.ts: **3,846,480 bytes** (3.67 MB)

**Package distribution directories:**

| Path | Size |
|------|------|
| packages/paywall/dist | 7.5 MB |
| packages/shared/dist | 16 KB |
| examples/facilitator/dist | 44 KB |
| examples/simple-paywall/server/dist | 112 KB |
| examples/simple-paywall/client/dist | 268 KB |

---

### 4. Typecheck / Lint / Test

#### Typecheck

**Command:** `pnpm typecheck`

**Result:** ✅ SUCCESS

```
Tasks:    9 successful, 9 total
Cached:    3 cached, 9 total
  Time:    1.587s

Wall time: 2.033s (pnpm typecheck 2>&1 6.93s user 0.72s system 376% cpu 2.033 total)
```

All packages:
- shared ✓
- paywall ✓
- simple-paywall-client ✓
- facilitator ✓
- client-cli ✓
- simple-paywall-server ✓

#### Lint

**Command:** `pnpm lint`

**Result:** ✅ SUCCESS

```
Tasks:    6 successful, 6 total
Cached:    0 cached, 6 total
  Time:    1.535s

Wall time: 2.003s (pnpm lint 2>&1 3.36s user 1.08s system 221% cpu 2.003 total)
```

All packages passed ESLint:
- shared ✓
- paywall ✓
- simple-paywall-client ✓
- facilitator ✓
- client-cli ✓
- simple-paywall-server ✓

#### Test

**Command:** `pnpm test`

**Result:** ✅ SUCCESS

```
Tasks:    5 successful, 5 total
Cached:    0 cached, 5 total
  Time:    2.594s

Wall time: 3.046s (pnpm test 2>&1 4.54s user 1.03s system 182% cpu 3.046 total)
```

**Test results summary:**

| Suite | Tests | Pass | Fail | Duration |
|-------|-------|------|------|----------|
| simple-paywall-client | 7 | 7 | 0 | 1485ms |
| simple-paywall-server (File 1) | 8 | 8 | 0 | 5ms |
| simple-paywall-server (File 2) | 15 | 15 | 0 | 16ms |
| simple-paywall-server (File 3) | 6 | 6 | 0 | 2ms |
| simple-paywall-server (File 4) | 6 | 6 | 0 | 43ms |
| simple-paywall-server (File 5) | 7 | 7 | 0 | 44ms |
| simple-paywall-server (File 6) | 69 | 69 | 0 | 8ms |
| **TOTAL** | **~151+** | **~151+** | **0** | **~1.36s (server)** |

---

### 5. Docker Image Sizes

**Result:** ✅ Both node targets built successfully (build context = repo root).

| Image | Tag | Size |
|-------|-----|------|
| x402-facilitator | baseline | 366 MB |
| x402-server | baseline | 374 MB |

---

## Summary

| Metric | Value | Status |
|--------|-------|--------|
| SDK install size (@stellar/stellar-sdk@15.0.0 + deps) | 14 MB + 3.8 MB + 832 KB | ✅ Captured |
| Build time | 4.859s | ✅ SUCCESS |
| Paywall bundle (entry.js) | 3.6 MB | ✅ Captured |
| Paywall template (generated) | 3,846,480 bytes | ✅ Captured |
| Typecheck | 2.033s | ✅ SUCCESS (9 tasks) |
| Lint | 2.003s | ✅ SUCCESS (6 tasks) |
| Test | 3.046s | ✅ SUCCESS (~151 tests, 0 failures) |
| Docker facilitator image | 366 MB | ✅ Built |
| Docker server image | 374 MB | ✅ Built |
