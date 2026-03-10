/**
 * Generate a fee-payer account and 19 channel accounts on Stellar testnet.
 *
 * The fee-payer account is funded via Friendbot. Channel accounts are created
 * with zero balance using sponsored reserves (BeginSponsoringFutureReserves +
 * CreateAccount + EndSponsoringFutureReserves).
 *
 * Outputs:
 *  - A timestamped .env file under scripts/output/ with the generated secrets
 *  - The env variables to paste into .env
 *
 * Usage:
 *   npx tsx scripts/generate-channel-accounts.ts
 */

import {
  Keypair,
  Networks,
  TransactionBuilder,
  Operation,
  Account,
  BASE_FEE,
} from "@stellar/stellar-sdk";
import { rpc as StellarRpc } from "@stellar/stellar-sdk";

import { TESTNET_RPC, fundWithFriendbot, saveEnvFile } from "./lib/stellar-helpers.js";

const CHANNEL_COUNT = 19;
const TESTNET_PASSPHRASE = process.env.STELLAR_NETWORK_PASSPHRASE?.trim() || Networks.TESTNET;

async function main() {
  console.log("=== Stellar Channel Account Generator ===\n");

  // 1. Create fee-payer keypair
  const feePayer = Keypair.random();
  console.log(`Fee Payer public key:  ${feePayer.publicKey()}`);
  console.log(`Fee Payer secret key:  ${feePayer.secret()}\n`);

  // 2. Fund fee-payer via Friendbot
  console.log("Funding fee payer via Friendbot...");
  await fundWithFriendbot(feePayer.publicKey());
  console.log("Fee payer funded.\n");

  // 3. Generate channel account keypairs
  const channels: Keypair[] = [];
  for (let i = 0; i < CHANNEL_COUNT; i++) {
    channels.push(Keypair.random());
  }
  console.log(`Generated ${CHANNEL_COUNT} channel account keypairs.\n`);

  // 4. Build the transaction with sponsored account creation
  const server = new StellarRpc.Server(TESTNET_RPC);
  const feePayerAccount = await server.getAccount(feePayer.publicKey());
  const sourceAccount = new Account(feePayerAccount.accountId(), feePayerAccount.sequenceNumber());

  const builder = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: TESTNET_PASSPHRASE,
  });

  for (const ch of channels) {
    builder.addOperation(
      Operation.beginSponsoringFutureReserves({
        sponsoredId: ch.publicKey(),
        source: feePayer.publicKey(),
      }),
    );

    builder.addOperation(
      Operation.createAccount({
        destination: ch.publicKey(),
        startingBalance: "0",
        source: feePayer.publicKey(),
      }),
    );

    builder.addOperation(
      Operation.endSponsoringFutureReserves({
        source: ch.publicKey(),
      }),
    );
  }

  builder.setTimeout(120);
  const transaction = builder.build();

  // Sign with fee payer (source of BeginSponsoring + CreateAccount)
  transaction.sign(feePayer);

  // Sign with each channel account (source of EndSponsoring)
  for (const ch of channels) {
    transaction.sign(ch);
  }

  // 5. Submit the transaction
  console.log("Submitting channel account creation transaction...");
  const result = await server.sendTransaction(transaction);

  if (result.status === "ERROR") {
    console.error("Transaction submission failed:", JSON.stringify(result, null, 2));
    process.exit(1);
  }

  // Poll for confirmation
  let getResult = await server.getTransaction(result.hash);
  while (getResult.status === "NOT_FOUND") {
    console.log("Waiting for transaction confirmation...");
    await new Promise((r) => setTimeout(r, 2000));
    getResult = await server.getTransaction(result.hash);
  }

  if (getResult.status === "SUCCESS") {
    console.log(`Transaction confirmed: ${result.hash}\n`);
  } else {
    console.error("Transaction failed:", JSON.stringify(getResult, null, 2));
    process.exit(1);
  }

  // 6. Save to timestamped .env file
  const channelSecrets = channels.map((ch) => ch.secret()).join(",");
  const envEntries = {
    FACILITATOR_STELLAR_FEE_BUMP_SECRET: feePayer.secret(),
    FACILITATOR_STELLAR_CHANNEL_SECRETS: channelSecrets,
  };

  const outputFile = saveEnvFile(envEntries);
  console.log(`Accounts saved to: ${outputFile}\n`);

  // 7. Print env variables
  console.log("=== Environment Variables ===\n");
  for (const [key, value] of Object.entries(envEntries)) {
    console.log(`${key}=${value}`);
  }
  console.log("\nCopy these into your .env file.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
