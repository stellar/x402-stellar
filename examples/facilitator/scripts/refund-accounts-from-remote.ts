/**
 * Fund Stellar signer addresses listed on a remote facilitator's /supported endpoint.
 *
 * Fetches the endpoint, extracts all addresses from "signers"."stellar:*",
 * and funds any that are not already active on the network via Friendbot.
 *
 * Usage:
 *   npx tsx scripts/refund-accounts-from-remote.ts                           # uses default URL
 *   npx tsx scripts/refund-accounts-from-remote.ts https://custom-url/facilitator/supported
 */

import { fundAddressesWithFriendbot } from "./lib/stellar-helpers.js";

const DEFAULT_SUPPORTED_URL = "https://www.x402.org/facilitator/supported";

interface SupportedResponse {
  signers?: Record<string, string[]>;
}

function extractStellarAddresses(signers: Record<string, string[]>): string[] {
  const addresses: string[] = [];
  for (const [key, values] of Object.entries(signers)) {
    if (key.startsWith("stellar:")) {
      addresses.push(...values);
    }
  }
  return [...new Set(addresses)];
}

async function main() {
  const supportedUrl = process.argv[2] || DEFAULT_SUPPORTED_URL;

  console.log("=== Fund Facilitator Signers ===\n");
  console.log(`Fetching: ${supportedUrl}\n`);

  const response = await fetch(supportedUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${supportedUrl}: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as SupportedResponse;
  const addresses = extractStellarAddresses(data.signers ?? {});

  if (addresses.length === 0) {
    console.log("No Stellar signer addresses found in the /supported response.");
    return;
  }

  console.log(`Found ${addresses.length} Stellar signer address(es):\n`);
  for (const addr of addresses) {
    console.log(`  ${addr}`);
  }
  console.log();

  await fundAddressesWithFriendbot(addresses, { label: "signer" });

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
