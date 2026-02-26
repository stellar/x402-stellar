"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/exact/client/index.ts
var client_exports = {};
__export(client_exports, {
  ExactStellarScheme: () => ExactStellarScheme
});
module.exports = __toCommonJS(client_exports);

// src/exact/client/scheme.ts
var import_stellar_sdk3 = require("@stellar/stellar-sdk");
var import_rpc2 = require("@stellar/stellar-sdk/rpc");

// src/shared.ts
var import_stellar_sdk = require("@stellar/stellar-sdk");
var import_rpc = require("@stellar/stellar-sdk/rpc");
function handleSimulationResult(simulation) {
  if (!simulation) {
    throw new Error("Simulation result is undefined");
  }
  if (import_rpc.Api.isSimulationRestore(simulation)) {
    throw new Error(
      `Stellar simulation result has type "RESTORE" with restorePreamble: ${simulation.restorePreamble}`
    );
  }
  if (import_rpc.Api.isSimulationError(simulation)) {
    const msg = `Stellar simulation failed${simulation.error ? ` with error message: ${simulation.error}` : ""}`;
    throw new Error(msg);
  }
}

// src/utils.ts
var import_stellar_sdk2 = require("@stellar/stellar-sdk");

// src/constants.ts
var STELLAR_PUBNET_CAIP2 = "stellar:pubnet";
var STELLAR_TESTNET_CAIP2 = "stellar:testnet";
var DEFAULT_TESTNET_RPC_URL = "https://soroban-testnet.stellar.org";
var STELLAR_DESTINATION_ADDRESS_REGEX = /^(?:[GC][ABCD][A-Z2-7]{54}|M[ABCD][A-Z2-7]{67})$/;
var STELLAR_ASSET_ADDRESS_REGEX = /^(?:[C][ABCD][A-Z2-7]{54})$/;
var STELLAR_NETWORK_TO_PASSPHRASE = /* @__PURE__ */ new Map([
  [STELLAR_PUBNET_CAIP2, "Public Global Stellar Network ; September 2015"],
  [STELLAR_TESTNET_CAIP2, "Test SDF Network ; September 2015"]
]);

// src/utils.ts
var DEFAULT_ESTIMATED_LEDGER_SECONDS = 5;
var RPC_LEDGERS_SAMPLE_SIZE = 20;
function isStellarNetwork(network) {
  return STELLAR_NETWORK_TO_PASSPHRASE.has(network);
}
function validateStellarDestinationAddress(address) {
  return STELLAR_DESTINATION_ADDRESS_REGEX.test(address);
}
function validateStellarAssetAddress(address) {
  return STELLAR_ASSET_ADDRESS_REGEX.test(address);
}
function getNetworkPassphrase(network) {
  const networkPassphrase = STELLAR_NETWORK_TO_PASSPHRASE.get(network);
  if (!networkPassphrase) {
    throw new Error(`Unknown Stellar network: ${network}`);
  }
  return networkPassphrase;
}
function getRpcUrl(network, rpcConfig) {
  const customRpcUrl = rpcConfig?.url;
  switch (network) {
    case STELLAR_TESTNET_CAIP2:
      return customRpcUrl || DEFAULT_TESTNET_RPC_URL;
    case STELLAR_PUBNET_CAIP2:
      if (!customRpcUrl) {
        throw new Error(
          "Stellar mainnet requires a non-empty rpcUrl. For a list of RPC providers, see https://developers.stellar.org/docs/data/apis/rpc/providers#publicly-accessible-apis"
        );
      }
      return customRpcUrl;
    default:
      throw new Error(`Unknown Stellar network: ${network}`);
  }
}
function getRpcClient(network, rpcConfig) {
  const rpcUrl = getRpcUrl(network, rpcConfig);
  return new import_stellar_sdk2.rpc.Server(rpcUrl, {
    allowHttp: network === STELLAR_TESTNET_CAIP2
    // Allow HTTP for testnet
  });
}
async function getEstimatedLedgerCloseTimeSeconds(server) {
  try {
    const latestLedger = await server.getLatestLedger();
    const startLedger = latestLedger.sequence;
    const { ledgers } = await server.getLedgers({
      startLedger,
      pagination: { limit: RPC_LEDGERS_SAMPLE_SIZE }
    });
    if (!ledgers || ledgers.length < 2) return DEFAULT_ESTIMATED_LEDGER_SECONDS;
    const oldestTs = parseInt(ledgers[0].ledgerCloseTime);
    const newestTs = parseInt(ledgers[ledgers.length - 1].ledgerCloseTime);
    const intervals = ledgers.length - 1;
    return Math.ceil((newestTs - oldestTs) / intervals);
  } catch {
    return DEFAULT_ESTIMATED_LEDGER_SECONDS;
  }
}

// src/exact/client/scheme.ts
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
    const tx = await import_stellar_sdk3.contract.AssembledTransaction.build({
      contractId: asset,
      method: "transfer",
      args: [
        // SEP-41 spec: https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0041.md#interface
        (0, import_stellar_sdk3.nativeToScVal)(sourcePublicKey, { type: "address" }),
        // from
        (0, import_stellar_sdk3.nativeToScVal)(payTo, { type: "address" }),
        // to
        (0, import_stellar_sdk3.nativeToScVal)(amount, { type: "i128" })
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
    const finalTx = tx.simulation && import_rpc2.Api.isSimulationSuccess(tx.simulation) ? import_stellar_sdk3.TransactionBuilder.cloneFrom(tx.built, {
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ExactStellarScheme
});
//# sourceMappingURL=index.js.map