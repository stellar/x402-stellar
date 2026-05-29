# Vendored Stellar SDK (experimental class-xdr build)

`stellar-sdk-15.0.1-class-xdr.tgz` is a from-source build of the unreleased
**class-xdr** branch of [stellar/js-stellar-sdk](https://github.com/stellar/js-stellar-sdk),
i.e. [PR #1422 — "[DRAFT] Class XDR Implementation"](https://github.com/stellar/js-stellar-sdk/pull/1422).

| | |
|---|---|
| Package | `@stellar/stellar-sdk` |
| Version | `15.0.1` |
| Branch | `class-xdr` (base: `modernization`) |
| Source commit | `c7eb18e` ("remove exports from the old js xdr") |
| Tarball size | ~672 KB (slimmed) |

## How it was built

```bash
git clone --depth 1 --branch class-xdr https://github.com/stellar/js-stellar-sdk.git
cd js-stellar-sdk
pnpm install
pnpm run build:prod        # clean + rollup (lib + axios) + tsc types — succeeded, exit 0

# --- slim: drop what this repo never imports ---
#   * lib/axios/  (18 MB) — the alternate axios-transport build; repo uses the
#     default feaxios build in lib/esm + lib/cjs via the base import + /contract + /rpc
#   * dist/       (22 MB) — standalone UMD/IIFE browser bundles; esbuild resolves
#     the SDK via the `module` field (lib/esm), never `dist/`
#   * **/*.map     (~9 MB) — sourcemaps, not needed for a vendored prod artifact
# Also pruned the ./axios* entries from `exports` and /dist from `files`, and
# stripped the `prepare`/`prepack` scripts so `npm pack` does NOT rebuild them back.
rm -rf lib/axios dist && find lib types -name '*.map' -delete
npm pack --ignore-scripts  # -> stellar-stellar-sdk-15.0.1.tgz (~672 KB)
```

Slimmed `lib/` is **9.2 MB** on disk (esm + cjs only, no sourcemaps), down from
37 MB for the full from-source build. Installed (unpacked) footprint is **9.2 MB**
— smaller than the published 15.0.0 baseline (14 MB).

## Why a vendored tarball (not a git dependency)

The branch builds from source via a `prepare` script (rollup + tsc). A
`github:` git dependency would re-run that heavy build on every `pnpm install`,
which breaks Docker's `pnpm install --frozen-lockfile` and slows CI. Vendoring a
prebuilt tarball gives a deterministic, fast, frozen-lockfile-compatible install.

It is wired in via a root `pnpm.overrides` entry so every workspace consumer
(`examples/facilitator` dependency, `packages/paywall` devDependency) resolves to
the same artifact.

## Note on `@stellar/js-xdr`

Despite the PR being a "class XDR" rewrite, the built output **still depends on
`@stellar/js-xdr@4.0.0`** at runtime — the `contract/` layer (`assembled_transaction`,
`spec`, `client`, etc.) continues to import it. The class-based XDR replaces the
*core* XDR layer, not the contract spec codec. Verified by grepping the built
`lib/esm` output.
