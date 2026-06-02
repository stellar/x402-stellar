# ──────────────────────────────────────────────────────────────
# Dockerfile — Fast build + small image for Stellar-only examples
#
# Targets:
#   facilitator  – x402 facilitator service (port 4022)
#   server       – simple-paywall Express server (port 3001)
#   client       – static SPA served by nginx (port 80)
#
# Optimizations:
#   - Alpine base images (node:22-alpine) — ~86MB smaller per stage
#   - No `pnpm deploy` — runs from workspace tree (fast builds)
#   - Aggressive pruning of EVM/SVM/non-Stellar deps + client/build bloat
#   - Build tools (turbo, typescript, eslint, etc.) excluded from runtime
#
# Build context MUST be the repository root.
#
# Examples:
#   docker build --target facilitator -t x402-facilitator .
#   docker build --target server      -t x402-server .
#   docker build --target client      -t x402-client .
# ──────────────────────────────────────────────────────────────

# ── Stage: base ──────────────────────────────────────────────
# Install deps, build examples, then prune non-Stellar bloat.
FROM node:22-alpine AS base

RUN corepack enable

WORKDIR /app

# Copy workspace manifests first for layer caching
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json tsconfig.base.json ./

# Activate pnpm version from package.json
RUN corepack install

# Own packages (built from source)
COPY packages/paywall/package.json                               packages/paywall/package.json
COPY packages/shared/package.json                                packages/shared/package.json

# Example package.json files (for dep resolution)
COPY examples/facilitator/package.json                           examples/facilitator/package.json
COPY examples/simple-paywall/server/package.json                 examples/simple-paywall/server/package.json
COPY examples/simple-paywall/client/package.json                 examples/simple-paywall/client/package.json

# Install all workspace deps.
RUN pnpm install --frozen-lockfile

# Copy own package source (needed for build:paywall + tsup)
COPY packages/paywall/src/       packages/paywall/src/
COPY packages/paywall/tsconfig.json packages/paywall/tsconfig.json
COPY packages/paywall/tsup.config.ts packages/paywall/tsup.config.ts
COPY packages/shared/src/        packages/shared/src/
COPY packages/shared/tsconfig.json packages/shared/tsconfig.json
COPY packages/shared/tsup.config.ts packages/shared/tsup.config.ts

# Copy example source and build
COPY examples/ examples/
RUN pnpm build

# ── Prune everything not needed for Stellar-only runtime ─────
# This strips ~765MB of EVM, SVM, Aptos, XRPL, build tools,
# and other transitive bloat from node_modules/.pnpm/.
#
# Safe because:
#   - @x402-stellar/paywall template bundles @stellar/stellar-sdk inline
#   - @x402/express only imports @x402/core/server (viem/solana declared
#     but never imported at runtime)
#   - @x402/extensions dynamic import is in a try/catch (bazaar not used)
#   - @x402/core's require("@x402/paywall") is in a try/catch fallback
#
# Combined into a single RUN to avoid layer bloat from deletions.
RUN set -ex \
    #
    # ── EVM ecosystem ────────────────────────────────────────
    && rm -rf node_modules/.pnpm/viem@* \
    && rm -rf node_modules/.pnpm/wagmi@* \
    && rm -rf node_modules/.pnpm/@wagmi+* \
    && rm -rf node_modules/.pnpm/ethers@* \
    && rm -rf node_modules/.pnpm/@ethersproject+* \
    && rm -rf node_modules/.pnpm/ox@* \
    && rm -rf node_modules/.pnpm/@metamask+* \
    && rm -rf node_modules/.pnpm/@walletconnect+* \
    && rm -rf node_modules/.pnpm/@reown+* \
    && rm -rf node_modules/.pnpm/@coinbase+* \
    && rm -rf node_modules/.pnpm/@base-org+* \
    && rm -rf node_modules/.pnpm/porto@* \
    && rm -rf node_modules/.pnpm/siwe@* \
    #
    # ── SVM (Solana) ecosystem ───────────────────────────────
    && rm -rf node_modules/.pnpm/@solana+* \
    && rm -rf node_modules/.pnpm/@solana-program+* \
    #
    # ── Other chains ─────────────────────────────────────────
    && rm -rf node_modules/.pnpm/xrpl@* \
    && rm -rf node_modules/.pnpm/@aptos-labs+* \
    && rm -rf node_modules/.pnpm/near-api-js@* \
    #
    # ── Hardware wallets / multi-chain wallet infra ──────────
    && rm -rf node_modules/.pnpm/@trezor+* \
    && rm -rf node_modules/.pnpm/@ledgerhq+* \
    && rm -rf node_modules/.pnpm/@wallet-standard+* \
    && rm -rf node_modules/.pnpm/usb@* \
    #
    # ── Next.js (transitive from wagmi/coinbase, not used) ───
    && rm -rf node_modules/.pnpm/next@* \
    && rm -rf node_modules/.pnpm/@next+* \
    #
    # ── Build-only tools (not needed at runtime) ─────────────
    && rm -rf node_modules/.pnpm/turbo@* \
    && rm -rf node_modules/.pnpm/turbo-darwin-* \
    && rm -rf node_modules/.pnpm/turbo-linux-* \
    && rm -rf node_modules/.pnpm/turbo-windows-* \
    && rm -rf node_modules/.pnpm/typescript@* \
    && rm -rf node_modules/.pnpm/@types+* \
    && rm -rf node_modules/.pnpm/eslint@* \
    && rm -rf node_modules/.pnpm/@typescript-eslint+* \
    && rm -rf node_modules/.pnpm/prettier@* \
    && rm -rf node_modules/.pnpm/@esbuild+* \
    && rm -rf node_modules/.pnpm/esbuild@* \
    && rm -rf node_modules/.pnpm/vitest@* \
    && rm -rf node_modules/.pnpm/@vitest+* \
    && rm -rf node_modules/.pnpm/supertest@* \
    && rm -rf node_modules/.pnpm/tsx@* \
    && rm -rf node_modules/.pnpm/tsup@* \
    && rm -rf node_modules/.pnpm/pino-pretty@* \
    #
    # ── Image processing / CSS (build-only) ──────────────────
    && rm -rf node_modules/.pnpm/sharp@* \
    && rm -rf node_modules/.pnpm/@img+* \
    && rm -rf node_modules/.pnpm/lightningcss@* \
    && rm -rf node_modules/.pnpm/lightningcss-* \
    && rm -rf node_modules/.pnpm/tailwindcss@* \
    && rm -rf node_modules/.pnpm/@tailwindcss+* \
    #
    # ── Heavy UI/util libs (only used by paywall UI, not server) ─
    && rm -rf node_modules/.pnpm/@phosphor-icons+* \
    && rm -rf node_modules/.pnpm/date-fns@* \
    #
    # ── Client/build-only packages (SPA already bundled) ──────
    && rm -rf node_modules/.pnpm/react-dom@* \
    && rm -rf node_modules/.pnpm/react-router@* \
    && rm -rf node_modules/.pnpm/vite@* \
    && rm -rf node_modules/.pnpm/@vitejs+* \
    && rm -rf node_modules/.pnpm/rollup@* \
    && rm -rf node_modules/.pnpm/@rollup+* \
    && rm -rf node_modules/.pnpm/jsdom@* \
    && rm -rf node_modules/.pnpm/@twind+* \
    && rm -rf node_modules/.pnpm/@babel+types@* \
    && rm -rf node_modules/.pnpm/@babel+core@* \
    && rm -rf node_modules/.pnpm/@babel+helper-*@* \
    && rm -rf node_modules/.pnpm/@babel+plugin-*@* \
    && rm -rf node_modules/.pnpm/caniuse-lite@* \
    && rm -rf node_modules/.pnpm/@tanstack+* \
    && rm -rf node_modules/.pnpm/lit-html@* \
    && rm -rf node_modules/.pnpm/lit@* \
    && rm -rf node_modules/.pnpm/@lit+* \
    && rm -rf node_modules/.pnpm/@lit-labs+* \
    #
    # ── Non-Stellar chains (transitive via wallet-kit/trezor) ─
    && rm -rf node_modules/.pnpm/@emurgo+* \
    && rm -rf node_modules/.pnpm/@fivebinaries+* \
    #
    # ── Redundant/duplicate packages (not imported at runtime) ─
    && rm -rf node_modules/.pnpm/lodash@* \
    && rm -rf node_modules/.pnpm/@sinclair+typebox@* \
    && rm -rf node_modules/.pnpm/rxjs@* \
    && rm -rf node_modules/.pnpm/es-toolkit@* \
    #
    # ── Duplicate Stellar versions (only 14.6.1 / 14.0.4 needed) ─
    && rm -rf node_modules/.pnpm/@stellar+stellar-sdk@13.3.0 \
    && rm -rf node_modules/.pnpm/@stellar+stellar-base@13.1.0 \
    && rm -rf node_modules/.pnpm/@stellar+stellar-base@14.0.1 \
    #
    # ── Platform-specific native addons not for linux ────────
    && rm -rf node_modules/.pnpm/*-darwin-arm64@* \
    && rm -rf node_modules/.pnpm/*-darwin-x64@* \
    && rm -rf node_modules/.pnpm/*-win32-*@* \
    && rm -rf node_modules/.pnpm/*-android-*@* \
    && rm -rf node_modules/.pnpm/fsevents@* \
    #
    # ── Sodium native prebuilds: keep only linux-x64 ─────────
    && find node_modules/.pnpm/sodium-native@*/node_modules/sodium-native/prebuilds \
       -mindepth 1 -maxdepth 1 ! -name 'linux-x64' -exec rm -rf {} + 2>/dev/null || true


# ── Stage: facilitator ──────────────────────────────────────
FROM node:22-alpine AS facilitator

WORKDIR /app

COPY --from=base /app/node_modules                               /app/node_modules
COPY --from=base /app/packages/shared/dist                       /app/packages/shared/dist
COPY --from=base /app/packages/shared/package.json               /app/packages/shared/package.json
COPY --from=base /app/examples/facilitator                       /app/examples/facilitator

EXPOSE 4022

WORKDIR /app/examples/facilitator
CMD ["node", "dist/index.js"]


# ── Stage: server ────────────────────────────────────────────
FROM node:22-alpine AS server

WORKDIR /app

COPY --from=base /app/node_modules                               /app/node_modules
COPY --from=base /app/packages/paywall/dist                      /app/packages/paywall/dist
COPY --from=base /app/packages/paywall/package.json              /app/packages/paywall/package.json
COPY --from=base /app/packages/shared/dist                       /app/packages/shared/dist
COPY --from=base /app/packages/shared/package.json               /app/packages/shared/package.json
COPY --from=base /app/examples/simple-paywall/server             /app/examples/simple-paywall/server

EXPOSE 3001

WORKDIR /app/examples/simple-paywall/server
CMD ["node", "dist/index.js"]


# ── Stage: client ────────────────────────────────────────────
FROM nginx:alpine AS client

COPY --from=base /app/examples/simple-paywall/client/dist /usr/share/nginx/html
COPY examples/simple-paywall/client/docker-entrypoint.sh /docker-entrypoint.d/40-runtime-config.sh
RUN chmod +x /docker-entrypoint.d/40-runtime-config.sh

RUN mkdir -p /etc/nginx/templates && printf 'server {\n\
  listen ${PORT};\n\
  location ~* /config\\.js$ {\n\
    root /usr/share/nginx/html;\n\
    add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0" always;\n\
    add_header Pragma "no-cache" always;\n\
    add_header Expires "0" always;\n\
    try_files $uri =404;\n\
  }\n\
  location / {\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    try_files $uri $uri/ /index.html;\n\
  }\n\
}\n' > /etc/nginx/templates/default.conf.template

ENV PORT=80
ENV NGINX_ENVSUBST_FILTER=PORT
EXPOSE 80

