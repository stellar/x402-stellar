# Experimental SDK Swap — Report

**Branch:** `experimental-new-sdk` · **SDK:** `@stellar/stellar-sdk@15.0.1` from
[js-stellar-sdk#1422 "[DRAFT] Class XDR Implementation"](https://github.com/stellar/js-stellar-sdk/pull/1422)
(branch `class-xdr`, commit `c7eb18e`).

## The work

1. **Mapped the blast radius first.** Only 7 source files import the SDK, and they
   use **exclusively high-level APIs** (`Keypair`, `TransactionBuilder`, `Operation`,
   `Account`, `Networks`, `BASE_FEE`, `rpc`, `nativeToScVal`, `scValToNative`,
   `AssembledTransaction`, `SignAuthEntry`). PR #1422's breaking changes are almost
   entirely in the **low-level `xdr.*` layer** (unions `.switch()`→`.type`, enum
   singletons, `bigint` wide-ints, `toXDR`→`toXdr`). The repo touches none of it.
2. **Built the draft SDK from source** (`pnpm install` + `build:prod` → rollup + tsc,
   clean exit) and **vendored it as a tarball** (`vendor/stellar-sdk-15.0.1-class-xdr.tgz`).
   A git dependency would re-run that heavy `prepare` build on every install and break
   Docker's `--frozen-lockfile`; a prebuilt tarball is deterministic and CI-safe.
3. **Repointed via a single `pnpm.overrides` entry** so all workspace consumers
   (facilitator dep, paywall devDep, and transitively stellar-wallets-kit) resolve to
   the one build.
4. **One-line Dockerfile fix:** `COPY vendor/ vendor/` before `pnpm install`, since the
   lockfile now references the tarball by `file:` path.
5. **Zero application source changes were needed** — the swap is config-only.

## Impressions

- **Drop-in at the high-level API.** Despite being a ground-up XDR rewrite, nothing in
  the surface this app uses changed. Build, typecheck, lint, and **296/296 tests pass**
  with no code edits.
- **The headline win is tree-shaking.** The class-based XDR (native `bigint`, property
  access instead of factory-call enums, discriminated unions) is dramatically more
  shakeable — the browser bundle this app ships shrank by ~72%.
- **The "removes js-xdr" framing is inaccurate (so far).** The built output still depends
  on `@stellar/js-xdr@4.0.0`: the class rewrite replaces the *core* XDR layer, but the
  `contract/` codec (`assembled_transaction`, `spec`, `client`) still imports js-xdr.
- **It's a DRAFT off a `modernization` base** — not production-ready, no published tag.
  Building from source ships ESM+CJS+axios variants + sourcemaps, which inflates the
  on-disk install (an artifact of the source build, not the SDK design).

## Gains

| Dimension | Before (15.0.0) | After (15.0.1 class-xdr) | Δ |
|-----------|-----------------|--------------------------|---|
| **Browser bundle** (shipped to users, embedded in paywall HTML) | 3,846,480 B (3.67 MB) | **1,068,846 B (1.02 MB)** | **−72%** |
| `entry.js` (esbuild IIFE, minified) | ~3.6 MB | 1,038,325 B (0.99 MB) | −~71% |
| Build / typecheck / lint / test wall time | 4.86 / 2.03 / 2.00 / 3.05 s | 4.83 / 1.81 / 1.65 / 2.88 s | ≈ same (within noise) |
| Tests | green | **296 pass / 0 fail** | no regressions |
| **Docker — facilitator** | 366 MB | **325 MB** | **−41 MB (−11%)** |
| **Docker — server** | 374 MB | **327 MB** | **−47 MB (−13%)** |
| node_modules SDK (on disk) | 14 MB | **9.2 MB** | **−4.8 MB** |
| Vendored tarball | — | **672 KB** | slimmed from 6.3 MB |

**Bundle size** is the clear win: **−72%** on the artifact end users download — directly
from the new XDR layer's tree-shakeability.

**Performance / memory:** build & test times are unchanged (within noise); no separate
runtime-memory benchmark was run, but a 2.8 MB smaller browser bundle means proportionally
less parse/compile and heap for the SDK in-browser. No runtime regressions observed across
296 tests.

**Docker:** net-positive after slimming the vendored tarball — facilitator −41 MB (−11%),
server −47 MB (−13%). The initial from-source build was 58 MB on disk (net-neutral after
evicting the old duplicate SDK copies `14.2.0`/`14.6.1`/`15.0.0`); **slimming** out the
unused axios variant + standalone `dist/` + sourcemaps cut the installed SDK to 9.2 MB
(below the 14 MB baseline), which flows straight through to the images. Required one extra
`COPY vendor/` line in the Dockerfile.

## Caveats / honesty notes

- The vendored tarball is **slimmed** (672 KB, 9.2 MB unpacked) by dropping the axios
  transport variant, the standalone `dist/` browser bundles, and sourcemaps — none of which
  this repo imports. The raw from-source build was 58 MB unpacked.
- `@stellar/js-xdr` is **not** eliminated (verified in built output).
- The stellar-wallets-kit `^13.3.0` peer warning is **pre-existing** (present with 15.0.0).
- This is a **draft** branch — fine for evaluation, not for shipping.

Full numbers and command output: [`sdk-swap-metrics.md`](./sdk-swap-metrics.md).
