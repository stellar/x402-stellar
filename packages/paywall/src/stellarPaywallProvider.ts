import { createPaywall } from "./builder.js";
import { stellarPaywall } from "./stellar-handler.js";

/**
 * Pre-built paywall provider with Stellar network support.
 *
 * Pass this directly to `paymentMiddlewareFromConfig` (or `paymentMiddleware`)
 * so the paywall renders prices using Stellar's 7-decimal precision instead of
 * the upstream default which assumes 6 decimals and shows amounts 10x too high.
 *
 * @example
 * ```ts
 * import { stellarPaywallProvider } from "@x402-stellar/paywall";
 *
 * paymentMiddlewareFromConfig(
 *   routes,
 *   facilitatorClient,
 *   [{ network: "stellar:testnet", server: new ExactStellarScheme() }],
 *   undefined,           // paywallConfig
 *   stellarPaywallProvider,
 * );
 * ```
 */
export const stellarPaywallProvider = createPaywall().withNetwork(stellarPaywall).build();
