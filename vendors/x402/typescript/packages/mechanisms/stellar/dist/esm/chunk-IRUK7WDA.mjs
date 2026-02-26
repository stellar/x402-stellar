import {
  handleSimulationResult
} from "./chunk-4HPDVFME.mjs";
import {
  getEstimatedLedgerCloseTimeSeconds,
  getNetworkPassphrase,
  getRpcClient,
  getRpcUrl,
  isStellarNetwork,
  validateStellarAssetAddress,
  validateStellarDestinationAddress
} from "./chunk-YFZMLK7W.mjs";

// src/exact/client/scheme.ts
import { nativeToScVal, TransactionBuilder, contract } from "@stellar/stellar-sdk";
import { Api } from "@stellar/stellar-sdk/rpc";
var DEFAULT_BASE_FEE_STROOPS = 1e4;
var ExactStellarScheme = class {
  /**
   * Creates a new ExactStellarScheme instance.
   *
   * @param signer - The Stellar signer for client operations
   * @param rpcConfig - Optional configuration with custom RPC URL
   * @returns ExactStellarScheme instance
   */
  constructor(signer, rpcConfig) {
    this.signer = signer;
    this.rpcConfig = rpcConfig;
    this.scheme = "exact";
  }
  /**
   * Creates a payment payload for the Exact scheme.
   *
   * @param x402Version - The x402 protocol version
   * @param paymentRequirements - The payment requirements
   * @returns Promise resolving to a payment payload
   */
  async createPaymentPayload(x402Version, paymentRequirements) {
    try {
      this.validateCreateAndSignPaymentInput(paymentRequirements);
    } catch (error) {
      throw new Error(`Invalid input parameters for creating Stellar payment, cause: ${error}`);
    }
    const sourcePublicKey = this.signer.address;
    const { network, payTo, asset, amount, extra, maxTimeoutSeconds } = paymentRequirements;
    const networkPassphrase = getNetworkPassphrase(network);
    const rpcUrl = getRpcUrl(network, this.rpcConfig);
    if (!extra.areFeesSponsored) {
      throw new Error(`Exact scheme requires areFeesSponsored to be true`);
    }
    const rpcServer = getRpcClient(network, this.rpcConfig);
    const latestLedger = await rpcServer.getLatestLedger();
    const currentLedger = latestLedger.sequence;
    const estimatedLedgerSeconds = await getEstimatedLedgerCloseTimeSeconds(rpcServer);
    const maxLedger = currentLedger + Math.ceil(maxTimeoutSeconds / estimatedLedgerSeconds);
    const tx = await contract.AssembledTransaction.build({
      contractId: asset,
      method: "transfer",
      args: [
        // SEP-41 spec: https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0041.md#interface
        nativeToScVal(sourcePublicKey, { type: "address" }),
        // from
        nativeToScVal(payTo, { type: "address" }),
        // to
        nativeToScVal(amount, { type: "i128" })
        // amount
      ],
      networkPassphrase,
      rpcUrl,
      parseResultXdr: (result) => result
    });
    handleSimulationResult(tx.simulation);
    let missingSigners = tx.needsNonInvokerSigningBy();
    if (!missingSigners.includes(sourcePublicKey) || missingSigners.length > 1) {
      throw new Error(
        `Expected to sign with [${sourcePublicKey}], but got [${missingSigners.join(", ")}]`
      );
    }
    await tx.signAuthEntries({
      address: sourcePublicKey,
      signAuthEntry: this.signer.signAuthEntry,
      expiration: maxLedger
    });
    await tx.simulate();
    handleSimulationResult(tx.simulation);
    missingSigners = tx.needsNonInvokerSigningBy();
    if (missingSigners.length > 0) {
      throw new Error(`unexpected signer(s) required: [${missingSigners.join(", ")}]`);
    }
    const finalTx = tx.simulation && Api.isSimulationSuccess(tx.simulation) ? TransactionBuilder.cloneFrom(tx.built, {
      fee: (DEFAULT_BASE_FEE_STROOPS + parseInt(tx.simulation.minResourceFee, 10)).toString(),
      sorobanData: tx.simulationData.transactionData,
      networkPassphrase
    }).build() : tx.built;
    return {
      x402Version,
      payload: {
        transaction: finalTx.toXDR()
      }
    };
  }
  /**
   * Validates the input parameters for the createAndSignPayment function.
   *
   * @param paymentRequirements - Payment requirements
   * @throws Error if validation fails
   */
  validateCreateAndSignPaymentInput(paymentRequirements) {
    const { scheme, network, payTo, asset, amount } = paymentRequirements;
    if (typeof amount !== "string" || !Number.isInteger(Number(amount)) || Number(amount) <= 0) {
      throw new Error(`Invalid amount: ${amount}. Amount must be a positive integer.`);
    }
    if (scheme !== "exact") {
      throw new Error(`Unsupported scheme: ${scheme}`);
    }
    if (!isStellarNetwork(network)) {
      throw new Error(`Unsupported Stellar network: ${network}`);
    }
    if (!validateStellarDestinationAddress(payTo)) {
      throw new Error(`Invalid Stellar destination address: ${payTo}`);
    }
    if (!validateStellarAssetAddress(asset)) {
      throw new Error(`Invalid Stellar asset address: ${asset}`);
    }
  }
};

export {
  ExactStellarScheme
};
//# sourceMappingURL=chunk-IRUK7WDA.mjs.map