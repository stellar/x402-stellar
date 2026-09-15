import { useCallback, useState } from "react";
import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit/sdk";
import { Asset, BASE_FEE, Operation, TransactionBuilder } from "@stellar/stellar-sdk";
import { Server } from "@stellar/stellar-sdk/rpc";
import type { Network } from "@x402/core/types";
import { getNetworkPassphrase, getRpcUrl } from "@x402/stellar";
import { parseError } from "@x402-stellar/shared";
import { statusError, statusInfo, statusSuccess, type Status } from "./status";
import type { AssetMetadata } from "./useStellarBalance";

/** How long to wait for the trustline transaction to leave the pending state. */
const CONFIRMATION_TIMEOUT_MS = 30_000;
const CONFIRMATION_POLL_INTERVAL_MS = 1_000;

export type UseAddTrustlineParams = {
  address: string | null;
  network: Network;
  assetMetadata: AssetMetadata | null;
  onStatus: (status: Status | null) => void;
  onAdded: () => void;
};

export type UseAddTrustlineReturn = {
  isAddingTrustline: boolean;
  /** `null` when the paywall does not have everything it needs to offer the action. */
  addTrustline: (() => Promise<void>) | null;
};

/**
 * Adds the trustline the payment asset requires, signing with the wallet that
 * is already connected to the paywall.
 *
 * Without a trustline the account cannot hold the asset at all, so the paywall
 * is otherwise a dead end: the Pay button is disabled and the only way forward
 * is to leave, add the trustline elsewhere, and come back.
 *
 * @param params - Hook parameters.
 * @param params.address - Connected wallet address that will hold the trustline.
 * @param params.network - Network to submit on (CAIP-2 format).
 * @param params.assetMetadata - Asset code and issuer, read from the SAC.
 * @param params.onStatus - Callback for status messages.
 * @param params.onAdded - Invoked once the trustline is confirmed on-ledger.
 * @returns The submit handler, or `null` when the action cannot be offered.
 */
export function useAddTrustline({
  address,
  network,
  assetMetadata,
  onStatus,
  onAdded,
}: UseAddTrustlineParams): UseAddTrustlineReturn {
  const [isAddingTrustline, setIsAddingTrustline] = useState(false);
  const runtimeRpcUrl = window.x402?.config?.rpcUrl;

  const addTrustline = useCallback(async () => {
    if (!address || !assetMetadata) {
      return;
    }

    setIsAddingTrustline(true);
    try {
      const networkPassphrase = getNetworkPassphrase(network);
      const server = new Server(getRpcUrl(network, { url: runtimeRpcUrl }));

      onStatus(statusInfo(`Building ${assetMetadata.code} trustline...`));
      const account = await server.getAccount(address);

      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase,
      })
        .addOperation(
          Operation.changeTrust({
            asset: new Asset(assetMetadata.code, assetMetadata.issuer),
          }),
        )
        .setTimeout(180)
        .build();

      onStatus(statusInfo("Waiting for user signature..."));
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(transaction.toXDR(), {
        address,
        networkPassphrase,
      });

      if (!signedTxXdr) {
        throw new Error("Wallet did not return a signed transaction.");
      }

      onStatus(statusInfo("Submitting trustline..."));
      const signed = TransactionBuilder.fromXDR(signedTxXdr, networkPassphrase);
      const sent = await server.sendTransaction(signed);

      if (sent.status === "ERROR") {
        throw new Error(
          `Trustline transaction was rejected by the network (${sent.errorResult?.result().switch().name ?? "unknown reason"}).`,
        );
      }

      await waitForTransaction(server, sent.hash);

      onStatus(statusSuccess(`${assetMetadata.code} trustline added.`));
      onAdded();
    } catch (error) {
      console.error("Failed to add trustline", error);
      onStatus(statusError(parseError(error, "Failed to add the trustline.")));
    } finally {
      setIsAddingTrustline(false);
    }
  }, [address, assetMetadata, network, onStatus, onAdded, runtimeRpcUrl]);

  return {
    isAddingTrustline,
    // Both the wallet and the asset identity are required; without either there
    // is nothing to sign or nothing to trust.
    addTrustline: address && assetMetadata ? addTrustline : null,
  };
}

/**
 * Polls until the transaction leaves `NOT_FOUND`, then throws unless it succeeded.
 */
async function waitForTransaction(server: Server, hash: string): Promise<void> {
  const deadline = Date.now() + CONFIRMATION_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const result = await server.getTransaction(hash);

    if (result.status === "SUCCESS") {
      return;
    }
    if (result.status === "FAILED") {
      throw new Error("Trustline transaction failed on-ledger.");
    }

    await new Promise((resolve) => setTimeout(resolve, CONFIRMATION_POLL_INTERVAL_MS));
  }

  throw new Error("Timed out waiting for the trustline transaction to confirm.");
}
