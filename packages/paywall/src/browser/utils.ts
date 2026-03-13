/**
 * Stellar-only utility functions for the browser paywall.
 * Replaces the multi-chain paywallUtils.ts (which depends on viem/chains).
 */

import { parseX402PaymentRequiredHeaderError } from "@x402-stellar/shared";

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

export function resolvePaymentTargetUrl(windowLocationHref: string, _currentUrl?: string): string {
  return windowLocationHref;
}

export function formatPaymentError(
  prefix: string,
  status: number,
  body: string,
  paymentRequiredHeader?: string | null,
): string {
  const paymentRequiredError = parseX402PaymentRequiredHeaderError(paymentRequiredHeader);
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
