/**
 * Generate a fee-payer account and 19 channel accounts on Stellar testnet.
 *
 * The fee-payer account is funded via Friendbot. Channel accounts are created
 * with zero balance using sponsored reserves (BeginSponsoringFutureReserves +
 * CreateAccount + EndSponsoringFutureReserves).
 *
 * Outputs:
 *  - A timestamped JSON file under scripts/output/ with all generated keys
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
import * as fs from "node:fs";
import * as path from "node:path";

const CHANNEL_COUNT = 19;
const TESTNET_RPC = process.env.STELLAR_RPC_URL?.trim() || "https://soroban-testnet.stellar.org";
const TESTNET_FRIENDBOT = "https://friendbot.stellar.org";
const TESTNET_PASSPHRASE = process.env.STELLAR_NETWORK_PASSPHRASE?.trim() || Networks.TESTNET;

interface GeneratedAccount {
  publicKey: string;
  secretKey: string;
}

async function fundWithFriendbot(address: string): Promise<void> {
  const url = `${TESTNET_FRIENDBOT}?addr=${address}`;
  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Friendbot funding failed for ${address}: ${response.status} ${body}`);
  }
}

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
  const channels: { keypair: Keypair; account: GeneratedAccount }[] = [];
  for (let i = 0; i < CHANNEL_COUNT; i++) {
    const kp = Keypair.random();
    channels.push({
      keypair: kp,
      account: { publicKey: kp.publicKey(), secretKey: kp.secret() },
    });
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
    // BeginSponsoringFutureReserves: fee payer sponsors the channel account
    builder.addOperation(
      Operation.beginSponsoringFutureReserves({
        sponsoredId: ch.keypair.publicKey(),
        source: feePayer.publicKey(),
      }),
    );

    // CreateAccount with zero balance (sponsored)
    builder.addOperation(
      Operation.createAccount({
        destination: ch.keypair.publicKey(),
        startingBalance: "0",
        source: feePayer.publicKey(),
      }),
    );

    // EndSponsoringFutureReserves: the channel account confirms sponsorship
    builder.addOperation(
      Operation.endSponsoringFutureReserves({
        source: ch.keypair.publicKey(),
      }),
    );
  }

  builder.setTimeout(120);
  const transaction = builder.build();

  // Sign with fee payer (source of BeginSponsoring + CreateAccount)
  transaction.sign(feePayer);

  // Sign with each channel account (source of EndSponsoring)
  for (const ch of channels) {
    transaction.sign(ch.keypair);
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

  // 6. Save to timestamped file
  const outputDir = path.join(import.meta.dirname, "output");
  fs.mkdirSync(outputDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outputFile = path.join(outputDir, `${timestamp}.json`);

  const output = {
    generatedAt: new Date().toISOString(),
    transactionHash: result.hash,
    feePayer: {
      publicKey: feePayer.publicKey(),
      secretKey: feePayer.secret(),
    },
    channelAccounts: channels.map((ch) => ch.account),
  };

  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
  console.log(`Accounts saved to: ${outputFile}\n`);

  // 7. Print env variables
  const channelSecrets = channels.map((ch) => ch.account.secretKey).join(",");
  console.log("=== Environment Variables ===\n");
  console.log(`FACILITATOR_STELLAR_FEE_BUMP_SECRET=${feePayer.secret()}`);
  console.log(`FACILITATOR_STELLAR_CHANNEL_SECRETS=${channelSecrets}`);
  console.log("\nCopy these into your .env file.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
