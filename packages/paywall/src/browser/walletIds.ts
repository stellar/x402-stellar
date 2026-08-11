/**
 * Which wallets the paywall offers, kept free of any Stellar Wallets Kit
 * import so the selection logic stays unit-testable — the SWK modules are
 * browser-only and cannot be loaded under Node.
 */

/**
 * Wallet ids the paywall knows how to build, in their default display order.
 *
 * Only wallets whose SWK module takes no constructor arguments are listed. The
 * hardware modules (Ledger, Trezor) and WalletConnect need per-integrator
 * configuration — a transport, a project id — so they cannot be enabled by id
 * alone and are deliberately left out.
 */
export const SUPPORTED_WALLET_IDS = [
  "freighter",
  "xbull",
  "lobstr",
  "albedo",
  "rabet",
  "hana",
  "klever",
  "onekey",
] as const;

export type WalletId = (typeof SUPPORTED_WALLET_IDS)[number];

const SUPPORTED = new Set<string>(SUPPORTED_WALLET_IDS);

/**
 * Normalizes configured wallet ids down to the ones the paywall can build.
 *
 * Unknown ids are dropped with a console warning rather than thrown, so a
 * single typo in a host's config cannot take the whole paywall down. An empty
 * or fully-unknown list falls back to every supported wallet, because a paywall
 * offering no wallets cannot be paid at all.
 *
 * @param walletIds - Ids from `window.x402.config.wallets`; omit for the default set.
 * @returns Known wallet ids, de-duplicated, in the order requested.
 */
export function resolveWalletIds(walletIds?: string[]): WalletId[] {
  if (!walletIds || walletIds.length === 0) {
    return [...SUPPORTED_WALLET_IDS];
  }

  const resolved: WalletId[] = [];
  for (const raw of walletIds) {
    const id = raw.trim().toLowerCase();
    if (!SUPPORTED.has(id)) {
      console.warn(
        `Unknown wallet id "${raw}" in x402 config; supported ids: ${SUPPORTED_WALLET_IDS.join(", ")}`,
      );
      continue;
    }
    if (!resolved.includes(id as WalletId)) {
      resolved.push(id as WalletId);
    }
  }

  if (resolved.length === 0) {
    console.warn("No usable wallet ids in x402 config; falling back to all supported wallets.");
    return [...SUPPORTED_WALLET_IDS];
  }

  return resolved;
}
