/**
 * Shared helpers for facilitator scripts.
 *
 * Centralises Friendbot funding, testnet constants, and file-output logic
 * so that every script in this directory stays DRY.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { rpc as StellarRpc } from "@stellar/stellar-sdk";

export const TESTNET_RPC =
  process.env.STELLAR_RPC_URL?.trim() || "https://soroban-testnet.stellar.org";

export const TESTNET_FRIENDBOT = "https://friendbot.stellar.org";

export async function isAccountFunded(
  address: string,
  server: StellarRpc.Server,
): Promise<boolean> {
  try {
    await server.getAccount(address);
    return true;
  } catch (error: unknown) {
    // server.getAccount() throws `Error("Account not found: <addr>")` when
    // the ledger entry doesn't exist.  Any other failure (network timeout,
    // RPC error, etc.) should bubble up so callers can handle it.
    if (error instanceof Error && error.message.startsWith("Account not found:")) {
      return false;
    }
    throw error;
  }
}

/** @throws if Friendbot returns a non-2xx response. */
export async function fundWithFriendbot(address: string): Promise<void> {
  const url = `${TESTNET_FRIENDBOT}?addr=${address}`;
  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Friendbot funding failed for ${address}: ${response.status} ${body}`);
  }
}

/** Fund multiple addresses sequentially via Friendbot, skipping already-funded accounts. */
export async function fundAddressesWithFriendbot(
  addresses: string[],
  { label = "address" }: { label?: string } = {},
): Promise<void> {
  const server = new StellarRpc.Server(TESTNET_RPC);
  for (let i = 0; i < addresses.length; i++) {
    const addr = addresses[i];
    const prefix = `  ${label} ${i + 1}/${addresses.length} (${addr})`;
    if (await isAccountFunded(addr, server)) {
      console.log(`${prefix}: already funded, skipping`);
      continue;
    }
    console.log(`${prefix}: funding via Friendbot...`);
    await fundWithFriendbot(addr);
  }
}

const OUTPUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "output");

/** Write env-var lines to `scripts/output/<timestamp>.env`. Returns the file path. */
export function saveEnvFile(entries: Record<string, string>): string {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outputFile = path.join(OUTPUT_DIR, `${timestamp}.env`);
  const content = Object.entries(entries)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  fs.writeFileSync(outputFile, content + "\n");
  return outputFile;
}
