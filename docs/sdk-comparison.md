# Stellar SDK comparison — published 15.0.0 vs PR #1422 `class-xdr`

Direct, package-to-package comparison of the **previous** `@stellar/stellar-sdk@15.0.0`
(published on npm) against the **new** `15.0.1` from the
[`class-xdr` branch / PR #1422](https://github.com/stellar/js-stellar-sdk/pull/1422)
(commit `0f58fa7`), built from source with `pnpm run build:prod`.

No vendoring, no app integration — both artifacts measured standalone. Numbers are
reproducible (see bottom). Benchmarks are best-of-3, stable across runs.

## 1. Bundle size

| Metric | Prev 15.0.0 | New `class-xdr` | Δ |
|--------|-------------|-----------------|---|
| **Tree-shaken to x402's actual imports**¹, gzipped | 447 KB | **113 KB** | **−75%** |
| Tree-shaken to x402's actual imports, raw | 1.63 MB | **529 KB** | **−68%** |
| Full standalone browser build (`dist/stellar-sdk.min.js`), gzipped | 247 KB | **173 KB** | **−30%** |
| Full standalone browser build, raw minified | 979 KB | 783 KB | −20% |

¹ Bundling only `{ Keypair, Networks, TransactionBuilder, Operation, Account, BASE_FEE,
rpc, nativeToScVal, scValToNative }` + `AssembledTransaction` from `/contract` (exactly
what this repo imports), via esbuild `--bundle --minify --format=esm --platform=browser`.

**This is the headline.** The old SDK is monolithic — importing *anything* drags in
Horizon, federation, stellartoml, etc., so a few symbols still cost 447 KB gzipped. The
new modular build tree-shakes cleanly: the same imports come out **~4× smaller (113 KB)**.
That matches the ~72% drop seen earlier in the app's real paywall bundle.

## 2. Dependencies & install profile

| Metric | Prev 15.0.0 | New `class-xdr` | Δ |
|--------|-------------|-----------------|---|
| Dependency tree (SDK + all transitive, `npm ls --all`) | 61 pkgs | **39 pkgs** | **−36%** |
| Direct prod dependencies | 9 | 12 | +3 |
| **Native modules** (`.node` / `binding.gyp`) | 0 | 0 | both pure-JS |

- **Removed (~25 transitive):** `@stellar/stellar-base` (now inlined into the SDK),
  `toml`, `urijs`, `randombytes`, `https-proxy-agent`/`agent-base`/`debug`, and a pile of
  browserify-era polyfills (`safe-buffer`, `sha.js`, `inherits`, `is-typed-array`,
  `call-bind`, `which-typed-array`, …).
- **Added (3):** `@noble/ed25519`, `smol-toml`, `uint8array-extras` (modern, audited,
  ESM-native).
- **`@stellar/js-xdr` is NOT eliminated** — it moves from transitive (via stellar-base)
  to a direct `4.0.0` dependency (the `contract/` spec codec still uses it).

## 3. Memory & load

| Metric | Prev 15.0.0 | New `class-xdr` | Δ |
|--------|-------------|-----------------|---|
| RSS after `require()` (full SDK) | 34.4 MB | **29.4 MB** | **−15%** |
| Cold import time (full SDK, Node) | ~62 ms | ~71 ms | ≈ wash (slightly slower) |
| Top-level exports | 74 | 72 | ≈ same |

## 4. Runtime micro-benchmarks (ops/sec, higher = better)

| Operation | Prev 15.0.0 | New `class-xdr` | Δ |
|-----------|-------------|-----------------|---|
| **i128 ↔ native round-trip** (`nativeToScVal`/`scValToNative`) | 1.70 M | **6.27 M** | **+270% (3.7×)** |
| vec ↔ native round-trip | 2.18 M | 3.05 M | +40% |
| **string ↔ native round-trip** | 9.6 M | **4.76 M** | **−51% (~2× slower)** |
| Keypair sign | 5.7 K | 7.8 K | +37% |
| Keypair verify | 1.24 K | 2.25 K | +82% |

- **Wide ints (i128) are 3.7× faster** — the core class-xdr win: native `bigint` vs the old
  object-boxed `Hyper`/`Int128`. i128 is the type Soroban token *amounts* use, so this is
  directly on the x402 payment path.
- **Strings are ~2× slower** — a real regression, not a clean sweep. Worth flagging upstream.
- Crypto (sign/verify) is faster via `@noble/ed25519` v3.

## 5. Disk / tarball — NOT comparable yet

| Metric | Prev 15.0.0 | New `class-xdr` |
|--------|-------------|-----------------|
| Publishable tarball | 2.5 MB | 6.4 MB |
| Unpacked package | 14 MB | 59 MB |

⚠️ The branch is a **draft build**: it ships sourcemaps and a full second `axios` transport
variant that a production npm release would strip (the published 15.0.0 carries no
sourcemaps). Ignore these until they publish — sections 1–4 are the fair signals.

## Verdict

| | |
|---|---|
| **Better** | App bundle (−75% tree-shaken), dependency tree (−36%, no stellar-base), import memory (−15%), wide-int XDR (3.7×), crypto (+37–82%) |
| **Worse** | String XDR conversion (~2× slower); raw on-disk size (draft-build artifact only) |
| **Neutral** | Cold import time, export surface, native deps (none either way), js-xdr (still present) |

Net: a clear win for this app's use case (small selective imports, Soroban i128 amounts),
with one honest regression (string codec) and one caveat (it's an unpublished draft — and
it can't be installed as a plain git dependency, see note below).

## How to reproduce

```bash
# previous (published)
npm pack @stellar/stellar-sdk@15.0.0 ; npm i @stellar/stellar-sdk@15.0.0   # 61-pkg tree

# new (branch, from source)
git clone --depth 1 -b class-xdr https://github.com/stellar/js-stellar-sdk.git
cd js-stellar-sdk && pnpm install && pnpm run build:prod && npm pack         # 39-pkg tree

# bundle / wire size:        gzip -9 -c dist/stellar-sdk.min.js | wc -c
# tree-shaken size:          esbuild entry.mjs --bundle --minify --format=esm --platform=browser
# memory / import / bench:   node require() + process.memoryUsage().rss, hrtime loops
```

> The `class-xdr` branch cannot currently be installed as a plain pnpm/npm git dependency —
> its `prepare` script ends with `git config ...`, which fails in the package manager's
> temporary (non-git) build dir. It must be built from a real git checkout.
