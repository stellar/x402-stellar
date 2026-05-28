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
| Tarball size | ~6.3 MB |

## How it was built

```bash
git clone --depth 1 --branch class-xdr https://github.com/stellar/js-stellar-sdk.git
cd js-stellar-sdk
pnpm install
pnpm run build:prod        # clean + rollup (lib + axios) + tsc types — succeeded, exit 0
npm pack                   # -> stellar-stellar-sdk-15.0.1.tgz
```

Built `lib/` is 37 MB on disk (esm 10 MB, cjs 7.8 MB, axios variant 18 MB, types 8 KB).

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
