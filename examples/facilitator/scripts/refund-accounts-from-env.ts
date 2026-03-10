/**
 * Re-fund facilitator accounts via Friendbot after a testnet reset.
 *
 * Reads secret keys from environment variables, derives public addresses,
 * and funds any that are not already active on the network.
 *
 * At least one of the following must be set:
 *   FACILITATOR_STELLAR_PRIVATE_KEY
 *   FACILITATOR_STELLAR_FEE_BUMP_SECRET
 *   FACILITATOR_STELLAR_CHANNEL_SECRETS
 *
 * All present env vars are processed independently — they are not mutually exclusive.
 *
 * Usage:
 *   npx tsx scripts/refund-accounts-from-env.ts
 */

import "dotenv/config";

import { Keypair } from "@stellar/stellar-sdk";

import { fundAddressesWithFriendbot } from "./lib/stellar-helpers.js";

async function main() {
  console.log("=== Refund Facilitator Accounts ===\n");

  const facilitatorSecret = process.env.FACILITATOR_STELLAR_PRIVATE_KEY?.trim() || undefined;
  const feeBumpSecret = process.env.FACILITATOR_STELLAR_FEE_BUMP_SECRET?.trim() || undefined;
  const channelSecretsRaw = process.env.FACILITATOR_STELLAR_CHANNEL_SECRETS?.trim() || undefined;

  if (!facilitatorSecret && !feeBumpSecret && !channelSecretsRaw) {
    throw new Error(
      "No accounts to fund. Set FACILITATOR_STELLAR_PRIVATE_KEY and/or " +
        "(FACILITATOR_STELLAR_FEE_BUMP_SECRET + FACILITATOR_STELLAR_CHANNEL_SECRETS) " +
        "in your .env or environment.",
    );
  }

  const addresses: string[] = [];

  if (facilitatorSecret) {
    const addr = Keypair.fromSecret(facilitatorSecret).publicKey();
    console.log(`Facilitator: ${addr}`);
    addresses.push(addr);
  }

  if (feeBumpSecret) {
    const addr = Keypair.fromSecret(feeBumpSecret).publicKey();
    console.log(`Fee-bump signer: ${addr}`);
    addresses.push(addr);
  }

  if (channelSecretsRaw) {
    const channelSecrets = channelSecretsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const secret of channelSecrets) {
      addresses.push(Keypair.fromSecret(secret).publicKey());
    }
    console.log(`Channel accounts: ${channelSecrets.length}`);
  }

  const uniqueAddresses = [...new Set(addresses)];

  console.log(`\nTotal accounts to check: ${uniqueAddresses.length}\n`);

  await fundAddressesWithFriendbot(uniqueAddresses, { label: "account" });

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
