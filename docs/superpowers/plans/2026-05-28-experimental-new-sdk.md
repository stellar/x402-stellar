# Experimental New SDK (js-stellar-sdk PR #1422 "class-xdr") Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development to implement. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Replace `@stellar/stellar-sdk@15.0.0` with the unreleased `15.0.1` "class-xdr" build from [stellar/js-stellar-sdk#1422](https://github.com/stellar/js-stellar-sdk/pull/1422), get the whole monorepo green (build/typecheck/lint/test + Docker), and report on the work, impressions, and gains.

**Architecture:** The class-xdr branch is a from-source TS SDK (rollup + tsc build, `prepare` script). For a reproducible install that works with Docker `pnpm install --frozen-lockfile`, build it once locally, `pnpm pack` into a tarball, vendor it under `vendor/`, and force resolution via a root `pnpm.overrides` entry pointing at the tarball. This forces all workspace consumers (facilitator dep, paywall devDep) onto the same prebuilt artifact.

**Tech Stack:** pnpm workspaces + turbo, tsup (node builds), esbuild (paywall browser bundle → embedded template), vitest + node:test, Docker multi-stage (alpine).

**Key risk assessment:** Repo uses **only high-level SDK APIs** (`Keypair`, `TransactionBuilder`, `Operation`, `Account`, `Networks`, `BASE_FEE`, `rpc`, `nativeToScVal`, `scValToNative`, `AssembledTransaction`, `SignAuthEntry`). **No low-level `xdr.*` / `.switch()` / `toXDR()` usage** — the bulk of PR #1422's breaking changes are in the low-level XDR layer and should not touch repo source. Primary risks are: (a) the SDK building cleanly from source, (b) high-level helpers (`nativeToScVal`/`scValToNative`/`AssembledTransaction`) behaving identically, (c) ESM/CJS interop + Buffer→Uint8Array shifts in the browser bundle.

**SDK consumers (7 source files + 1 generated):**
- `packages/paywall/src/browser/useStellarBalance.ts` — `AssembledTransaction` (`/contract`), `nativeToScVal`, `scValToNative`
- `packages/paywall/src/browser/useSWKSigner.ts` — `type SignAuthEntry` (`/contract`)
- `examples/facilitator/scripts/generate-channel-accounts.ts` — `Keypair`, `Networks`, `TransactionBuilder`, `Operation`, `Account`, `BASE_FEE`, `rpc`
- `examples/facilitator/scripts/lib/stellar-helpers.ts` — `rpc`
- `examples/facilitator/scripts/refund-accounts-from-env.ts` — `Keypair`
- `examples/facilitator/tests/setup.ts`, `examples/facilitator/tests/config/env.test.ts` — `Keypair`
- `packages/paywall/src/gen/template.ts` — generated (browser bundle embeds the SDK inline)

---

### Task 1: Baseline metrics (current 15.0.0)
- [ ] Record installed SDK size: `du -sh node_modules/.pnpm/@stellar+stellar-sdk@*`
- [ ] Build everything: `pnpm build` (capture wall time)
- [ ] Record paywall browser bundle size (esbuild output in `src/browser/dist/` + generated `template.ts`)
- [ ] Run `pnpm typecheck`, `pnpm lint`, `pnpm test` — record pass/fail + timing
- [ ] Build Docker `facilitator` + `server` targets, record image sizes
- [ ] Save all numbers to `docs/superpowers/sdk-swap-metrics.md` under "Before"

### Task 2: Build & vendor the class-xdr SDK
- [ ] Clone `stellar/js-stellar-sdk` `class-xdr` into `/tmp`, `pnpm install`, `pnpm run build:prod`
- [ ] `pnpm pack` → tarball; copy to `vendor/stellar-sdk-15.0.1-class-xdr.tgz`
- [ ] Record built `lib/` size and whether `@stellar/js-xdr` is still a real runtime dep (verify the agent's "eliminated" claim empirically)

### Task 3: Swap dependency + install
- [ ] Add root `pnpm.overrides`: `"@stellar/stellar-sdk": "file:./vendor/stellar-sdk-15.0.1-class-xdr.tgz"`
- [ ] Bump the two consumer manifests' specifier comment to note the experimental pin
- [ ] `pnpm install` (no `--frozen-lockfile`) to update `pnpm-lock.yaml`
- [ ] Verify resolution: `pnpm why @stellar/stellar-sdk`
- [ ] Commit + push

### Task 4: Green the monorepo
- [ ] `pnpm build` → fix breakages
- [ ] `pnpm typecheck` → fix
- [ ] `pnpm lint` → fix
- [ ] `pnpm test` → fix
- [ ] Rebuild paywall browser bundle (codegen) — verify it still bundles & runs (Buffer/Uint8Array)
- [ ] Commit + push after each green milestone

### Task 5: After metrics + Docker
- [ ] Re-measure SDK size, bundle size, timings
- [ ] Rebuild Docker `facilitator` + `server`, record sizes; update Dockerfile prune list if the new SDK changed transitive deps
- [ ] Save numbers under "After" + compute deltas

### Task 6: Reviews + report
- [ ] Run `/code-review` (or review subagents) on the diff
- [ ] superpowers:verification-before-completion — confirm every claim with command output
- [ ] Write concise report: work done, impressions, gains (memory/bundle/perf/Docker)
- [ ] Final push
