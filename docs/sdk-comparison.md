# Stellar SDK comparison — published 15.0.0 vs PR #1422 `class-xdr`

Direct, package-to-package comparison of the **previous** `@stellar/stellar-sdk@15.0.0`
(published on npm) against the **new** `15.0.1` from the
[`class-xdr` branch / PR #1422](https://github.com/stellar/js-stellar-sdk/pull/1422)
(commit `0f58fa7`), built from source with `pnpm run build:prod`.

No vendoring, no app integration — both artifacts measured standalone.

## Headline

| Metric | Prev 15.0.0 | New `class-xdr` 15.0.1 | Δ |
|--------|-------------|------------------------|---|
| **Browser bundle, gzipped** (`dist/stellar-sdk.min.js`, over-the-wire) | 253,345 B (247 KB) | **177,265 B (173 KB)** | **−30.0%** |
| **Browser bundle, raw minified** | 1,002,386 B (979 KB) | **801,771 B (783 KB)** | **−20.0%** |
| **Dependency tree** (SDK + all transitive, `npm ls --all`) | 61 pkgs | **39 pkgs** | **−36%** |
| Direct prod dependencies | 9 | 12 | +3 |

## Dependency structure (the substantive change)

| | Prev 15.0.0 | New `class-xdr` |
|---|---|---|
| `@stellar/stellar-base` | separate dependency (~3.8 MB pkg) | **inlined into the SDK — gone** |
| `@stellar/js-xdr` | transitive (via stellar-base) | **direct dep, `4.0.0`** — still present |
| TOML parser | `toml@3` | `smol-toml@1.6` |
| crypto | (via stellar-base) | `@noble/ed25519`, `@noble/hashes` (modern, audited) |
| misc | `urijs`, `randombytes` | dropped; `buffer`, `base32.js`, `uint8array-extras` added |

The "class XDR" rewrite collapses the old `stellar-sdk → stellar-base → js-xdr`
chain: `stellar-base` is folded into the SDK and the core XDR layer is replaced by
the in-tree class-based implementation. `@stellar/js-xdr` is **not removed** — it
is still pulled in directly (the `contract/` spec codec uses it) — but the overall
tree is 36% smaller.

## Disk / tarball — NOT a fair comparison yet

| Metric | Prev 15.0.0 | New `class-xdr` |
|--------|-------------|-----------------|
| Publishable tarball | 2.5 MB | 6.4 MB |
| Unpacked package | 14 MB | 59 MB |
| `lib/` | 4.8 MB | 37 MB |
| `dist/` | 9.6 MB | 22 MB |

⚠️ These are inflated for the branch because it is a **draft build**: it ships
sourcemaps and a full second `axios` transport variant that a production npm
release would strip (the published 15.0.0 carries no sourcemaps). Treat tarball /
unpacked size as **not yet comparable** — the wire-size (gzipped bundle) and
dependency count above are the fair signals.

## Performance / memory

- **Wire / load:** −30% gzipped bundle and a 36%-smaller dependency tree mean less
  to download, parse, and resolve.
- **Runtime:** not separately benchmarked here. The class-based XDR uses native
  `bigint` and property access instead of factory-call enums and object-boxed
  primitives, which should reduce per-call allocation, but that's a design
  expectation, not a measured number in this comparison.

## How to reproduce

```bash
# previous (published)
npm pack @stellar/stellar-sdk@15.0.0      # tarball + dist/stellar-sdk.min.js
npm i @stellar/stellar-sdk@15.0.0         # footprint: 61 pkgs

# new (branch, built from source)
git clone --depth 1 -b class-xdr https://github.com/stellar/js-stellar-sdk.git
cd js-stellar-sdk && pnpm install && pnpm run build:prod
npm pack                                  # tarball + dist/stellar-sdk.min.js (39-pkg tree)

# wire size:
gzip -9 -c dist/stellar-sdk.min.js | wc -c
```

> Note: the `class-xdr` branch cannot currently be installed as a plain pnpm/npm
> git dependency — its `prepare` script ends with `git config ...` which fails in
> the package manager's temporary (non-git) build dir. It must be built from a real
> git checkout, as above.
