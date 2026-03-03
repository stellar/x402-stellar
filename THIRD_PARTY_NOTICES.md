# Third-Party Notices

This file documents third-party dependencies with licenses flagged by the
Stellar org's Socket Security policy. It is generated from the Socket Security
report on PR #1 and should be updated as dependencies change.

This project (x402-stellar) is licensed under **Apache-2.0**.

---

## Bundled Code — License Clean

The `@x402-stellar/paywall` browser bundle is built by esbuild with
`bundle: true`. Only the following `stellar-wallets-kit` wallet modules are
imported (via per-module deep imports, not `defaultModules()`):

- `FreighterModule` — `@creit.tech/stellar-wallets-kit/modules/freighter` (no external deps)
- `HanaModule` — `@creit.tech/stellar-wallets-kit/modules/hana` (no external deps)
- `KleverModule` — `@creit.tech/stellar-wallets-kit/modules/klever` (no external deps)
- `OneKeyModule` — `@creit.tech/stellar-wallets-kit/modules/onekey` (no external deps, export added via pnpm patch)

None of these modules have external dependencies. No GPL, AGPL, T-RSL, or
other copyleft-licensed code is included in the published bundle.

---

## Policy Violations (install-time only, NOT bundled)

These packages are transitive dependencies of `@creit.tech/stellar-wallets-kit`
(a devDependency of `@x402-stellar/paywall`). They exist in `node_modules` at
install time but are **not** reachable from the bundle entry point because the
paywall imports only the 4 individual wallet modules listed above.

### GPL-3.0

| Package                          | Version | Dependency chain                                                      |
| -------------------------------- | ------- | --------------------------------------------------------------------- |
| `@lobstrco/signer-extension-api` | 2.0.0   | `@creit.tech/stellar-wallets-kit` -> `@lobstrco/signer-extension-api` |

**Not bundled.** Only reachable through `LobstrModule`, which is not imported.

### LicenseRef-T-RSL (Trezor Restricted Source License)

| Package                          | Version | Dependency chain                                                    |
| -------------------------------- | ------- | ------------------------------------------------------------------- |
| `@trezor/connect-web`            | 9.6.4   | `stellar-wallets-kit` -> `@trezor/connect-web`                      |
| `@trezor/connect`                | 9.6.4   | `stellar-wallets-kit` -> `@trezor/connect-web` -> `@trezor/connect` |
| `@trezor/connect-plugin-stellar` | 9.2.3   | `stellar-wallets-kit` -> `@trezor/connect-plugin-stellar`           |
| `@trezor/blockchain-link`        | 2.5.4   | `...` -> `@trezor/connect` -> `@trezor/blockchain-link`             |
| `@trezor/connect-common`         | 0.4.4   | `...` -> `@trezor/connect` -> `@trezor/connect-common`              |
| `@trezor/transport`              | 1.5.4   | `...` -> `@trezor/connect` -> `@trezor/transport`                   |
| `@trezor/utxo-lib`               | 2.4.4   | `...` -> `@trezor/connect` -> `@trezor/utxo-lib`                    |
| `@trezor/utils`                  | 9.4.3   | `...` -> `@trezor/connect` -> `@trezor/utils`                       |
| `@trezor/utils`                  | 9.4.4   | `...` -> `@trezor/connect-web` -> `@trezor/utils`                   |

**Not bundled.** Only reachable through `TrezorModule`, which is not imported.

### AGPL-3.0-or-later

| Package        | Version | Dependency chain                                                              |
| -------------- | ------- | ----------------------------------------------------------------------------- |
| `ua-parser-js` | 2.0.9   | `stellar-wallets-kit` -> `@trezor/*` -> `@trezor/env-utils` -> `ua-parser-js` |

**Not bundled.** Deep transitive of the Trezor stack, which is not imported.

### HPND-sell-MIT-disclaimer-xserver

| Package      | Version | Dependency chain                                                                           |
| ------------ | ------- | ------------------------------------------------------------------------------------------ |
| `dijkstrajs` | 1.0.3   | `stellar-wallets-kit` -> `@reown/appkit` -> `@reown/appkit-ui` -> `qrcode` -> `dijkstrajs` |

**Not bundled.** The `dijkstrajs` LICENSE.md text is detected as
HPND-sell-MIT-disclaimer-xserver by Socket's license scanner. The actual
license is a permissive MIT-style license (likely a scanner misclassification).
Reachable only through `WalletConnectModule`, which is not imported.

### Other violation-flagged packages

| Package        | Version      | License (SPDX)                                                                         | Notes                                                                                                                |
| -------------- | ------------ | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `typescript`   | 5.9.3        | `LicenseRef-W3C-Community-Final-Specification-Agreement` (in ThirdPartyNoticeText.txt) | Direct devDependency. The TypeScript compiler itself is Apache-2.0; the flag is for bundled third-party notice text. |
| `usb`          | 2.17.0       | `LGPL-2.1` (in bundled libusb)                                                         | Transitive via `@trezor/transport`. Not bundled.                                                                     |
| `caniuse-lite` | 1.0.30001774 | `CC-BY-4.0`                                                                            | Transitive devDependency via `browserslist` (Babel). Data-only, not bundled in output.                               |

---

## Monitored Licenses

These packages use licenses that are permissive but flagged for monitoring by
the Stellar org Socket Security policy. They do not require action but are
listed for transparency.

### BSD-3-Clause (31 packages)

Protobuf ecosystem (`@protobufjs/*`): `aspromise@1.1.2`, `base64@1.1.2`,
`codegen@2.0.4`, `eventemitter@1.1.0`, `fetch@1.1.0`, `float@1.0.2`,
`inquire@1.1.0`, `path@1.1.2`, `pool@1.1.0`, `utf8@1.1.0`,
`protobufjs@7.4.0`.

Crypto/encoding: `buffer-equal-constant-time@1.0.1`, `charenc@0.0.2`,
`crypt@0.0.2`, `ieee754@1.2.1`, `md5@2.3.0`, `sha1@1.1.1`, `sha.js@2.4.12`,
`secure-json-parse@4.1.0`.

Stellar SDK: `@stellar/js-xdr@3.1.2`, `@stellar/stellar-sdk@13.3.0`,
`@stellar/stellar-sdk@14.5.0` (bundled third-party notices).

Lit framework: `lit@3.3.0`, `lit-element@4.2.2`, `lit-html@3.3.2`,
`@lit/react@1.0.8`, `@lit/reactive-element@2.1.2`,
`@lit-labs/ssr-dom-shim@1.5.1`.

Other: `source-map-js@1.2.1`, `source-map@0.7.6`, `stream-chain@2.2.5`,
`stream-json@1.9.1`, `tough-cookie@5.1.2`, `esquery@1.7.0`, `qs@6.15.0`,
`fast-uri@3.1.0`, `confbox@0.1.8`, `@phosphor-icons/webcomponents@2.1.5`.

Esbuild (Android/OpenHarmony cross-compile binaries):
`@esbuild/android-arm@0.25.12`, `@esbuild/android-x64@0.25.12`,
`@esbuild/openharmony-arm64@0.25.12`, `@esbuild/android-arm@0.27.3`,
`@esbuild/android-x64@0.27.3`, `@esbuild/openharmony-arm64@0.27.3`.

### 0BSD (4 packages)

`tslib@1.14.1`, `tslib@2.7.0`, `tslib@2.8.1`,
`@tailwindcss/oxide-wasm32-wasi@4.2.1`.

### Unlicense (4 packages)

`tweetnacl@1.0.3`, `tweetnacl-util@0.15.1`, `text-encoding-utf-8@1.0.2`,
`big-integer@1.6.36`.

### CC0-1.0 (1 package)

`fastestsmallesttextencoderdecoder@1.0.22`.

### MIT-0 (1 package)

`@csstools/color-helpers@5.1.0`.

### Python-2.0 (1 package)

`argparse@2.0.1`.

### Other monitored

`vitest@3.2.4` (bundled ISC/BSD-3-Clause third-party code),
`vite@7.3.1` (bundled BSD-2-Clause/CC0-1.0/ISC third-party code).

---

## Non-License Alerts

| Alert            | Package           | Version | Details                                                       |
| ---------------- | ----------------- | ------- | ------------------------------------------------------------- |
| `deprecated`     | `whatwg-encoding` | 3.1.1   | Transitive via `jsdom` (vitest). Use `@exodus/bytes` instead. |
| `obfuscatedFile` | `entities`        | 6.0.1   | False positive on minified code.                              |
| `obfuscatedFile` | `vite`            | 6.4.1   | False positive on bundled code.                               |
| `obfuscatedFile` | `xrpl`            | 4.6.0   | False positive on bundled code.                               |

---

## Recommendations

1. **`@creit.tech/stellar-wallets-kit`** is the root cause of all GPL-3.0,
   T-RSL, and AGPL-3.0 install-time alerts. The paywall now uses per-module
   deep imports (`./modules/freighter`, `./modules/hana`, `./modules/klever`,
   `./modules/onekey`) instead of `defaultModules()`, so no copyleft code
   reaches the bundle. A pnpm patch adds the missing `./modules/onekey` export
   to the SWK package (upstream bug in v2.0.0).

2. **`ua-parser-js@2.x`** switched from MIT to AGPL-3.0. It is not bundled
   (only reachable via Trezor). If the install-time alert is a concern,
   pinning to `ua-parser-js@1.x` (still MIT) via pnpm overrides is an option.

3. **Monitoring-level alerts** (BSD-3-Clause, 0BSD, Unlicense, CC0-1.0, MIT-0,
   Python-2.0) are all permissive open-source licenses. These should be added
   to the Stellar org's Socket Security allow-list.
