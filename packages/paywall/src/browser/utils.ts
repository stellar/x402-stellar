/**
 * Stellar-only utility functions for the browser paywall.
 * Replaces the multi-chain paywallUtils.ts (which depends on viem/chains).
 */

import { getX402ErrorMessage, parseX402Header } from "@x402-stellar/shared";

/**
 * Provides a human-readable display name for a Stellar network.
 *
 * @param network - The network identifier (CAIP-2 format, e.g. "stellar:testnet").
 * @returns A display name suitable for UI use.
 */
export function getNetworkDisplayName(network: string): string {
  if (network.startsWith("stellar:")) {
    const ref = network.split(":")[1];
    return ref === "testnet" ? "Stellar Testnet" : "Stellar Mainnet";
  }
  return network;
}

/**
 * Formats a raw bigint value with the given number of decimals.
 * Drop-in replacement for viem's `formatUnits` — avoids pulling in the
 * entire viem library just for this one function.
 *
 * @param value - The raw bigint value (e.g. balance in stroops).
 * @param decimals - Number of decimal places.
 * @returns Formatted string (e.g. "12.3456789").
 */
export function formatUnits(value: bigint, decimals: number): string {
  const str = value.toString();

  if (decimals === 0) {
    return str;
  }

  const isNegative = str.startsWith("-");
  const abs = isNegative ? str.slice(1) : str;
  const padded = abs.padStart(decimals + 1, "0");
  const intPart = padded.slice(0, padded.length - decimals);
  const fracPart = padded.slice(padded.length - decimals);

  // Trim trailing zeros from the fractional part
  const trimmed = fracPart.replace(/0+$/, "");

  const result = trimmed.length > 0 ? `${intPart}.${trimmed}` : intPart;
  return isNegative ? `-${result}` : result;
}

/**
 * Builds the Stellar Expert URL for a settled transaction.
 *
 * Stellar Expert names the public network `public`, while x402 uses the CAIP-2
 * reference `pubnet`; everything else maps straight through.
 *
 * @param network - CAIP-2 network id, e.g. "stellar:testnet".
 * @param transactionHash - Hash of the settled transaction.
 * @returns An explorer URL, or `null` when either input is missing or the
 * network is not a Stellar one.
 */
export function getExplorerTxUrl(
  network: string | undefined,
  transactionHash: string | undefined,
): string | null {
  if (!network || !transactionHash || !network.startsWith("stellar:")) {
    return null;
  }

  const reference = network.split(":")[1];
  if (!reference) {
    return null;
  }

  const explorerNetwork = reference === "pubnet" ? "public" : reference;
  return `https://stellar.expert/explorer/${explorerNetwork}/tx/${encodeURIComponent(transactionHash)}`;
}

/**
 * Shortens a hash for display, keeping enough of both ends to compare against
 * an explorer by eye.
 *
 * @param value - The hash to shorten.
 * @param edge - Characters to keep at each end.
 * @returns The shortened hash, or the original when it is already short enough.
 */
export function truncateHash(value: string, edge = 8): string {
  if (value.length <= edge * 2 + 1) {
    return value;
  }
  return `${value.slice(0, edge)}…${value.slice(-edge)}`;
}

/**
 * Formats a duration in milliseconds for the payment receipt.
 *
 * @param ms - Elapsed milliseconds.
 * @returns A short human-readable duration, e.g. "820ms" or "4.1s".
 */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) {
    return "—";
  }
  return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`;
}

export function formatPaymentError(
  prefix: string,
  status: number,
  body: string,
  paymentRequiredHeader?: string | null,
): string {
  const paymentRequiredError = getX402ErrorMessage(
    parseX402Header<Record<string, unknown>>(paymentRequiredHeader, (err) => {
      console.warn("Malformed x402 payment-required header:", err);
    }),
  );
  if (paymentRequiredError) {
    return `${prefix}: ${paymentRequiredError}`;
  }

  const trimmed = body.trim();
  if (!trimmed) {
    return `${prefix}: ${status}`;
  }
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === "object") {
      const message = parsed.error || parsed.message || parsed.detail;
      if (typeof message === "string") {
        return `${prefix}: ${message}`;
      }
    }
  } catch {
    /* body is not JSON */
  }
  if (trimmed.startsWith("<") || trimmed.length > 200) {
    console.error(
      `${prefix} (${status}) — response body (first 2000 chars):`,
      trimmed.slice(0, 2000),
    );
    return `${prefix}: ${status} (see browser console for details)`;
  }
  return `${prefix}: ${trimmed}`;
}
