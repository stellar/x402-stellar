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

// src/index.ts
var src_exports = {};
__export(src_exports, {
  DEFAULT_ESTIMATED_LEDGER_SECONDS: () => DEFAULT_ESTIMATED_LEDGER_SECONDS,
  DEFAULT_TESTNET_RPC_URL: () => DEFAULT_TESTNET_RPC_URL,
  DEFAULT_TOKEN_DECIMALS: () => DEFAULT_TOKEN_DECIMALS,
  ExactStellarScheme: () => ExactStellarScheme,
  STELLAR_ASSET_ADDRESS_REGEX: () => STELLAR_ASSET_ADDRESS_REGEX,
  STELLAR_DESTINATION_ADDRESS_REGEX: () => STELLAR_DESTINATION_ADDRESS_REGEX,
  STELLAR_NETWORK_TO_PASSPHRASE: () => STELLAR_NETWORK_TO_PASSPHRASE,
  STELLAR_PUBNET_CAIP2: () => STELLAR_PUBNET_CAIP2,
  STELLAR_TESTNET_CAIP2: () => STELLAR_TESTNET_CAIP2,
  STELLAR_WILDCARD_CAIP2: () => STELLAR_WILDCARD_CAIP2,
  USDC_PUBNET_ADDRESS: () => USDC_PUBNET_ADDRESS,
  USDC_TESTNET_ADDRESS: () => USDC_TESTNET_ADDRESS,
  convertToTokenAmount: () => convertToTokenAmount,
  createEd25519Signer: () => createEd25519Signer,
  gatherAuthEntrySignatureStatus: () => gatherAuthEntrySignatureStatus,
  getEstimatedLedgerCloseTimeSeconds: () => getEstimatedLedgerCloseTimeSeconds,
  getNetworkPassphrase: () => getNetworkPassphrase,
  getRpcClient: () => getRpcClient,
  getRpcUrl: () => getRpcUrl,
  getUsdcAddress: () => getUsdcAddress,
  handleSimulationResult: () => handleSimulationResult,
  isClientStellarSigner: () => isClientStellarSigner,
  isFacilitatorStellarSigner: () => isFacilitatorStellarSigner,
  isStellarNetwork: () => isStellarNetwork,
  validateStellarAssetAddress: () => validateStellarAssetAddress,
  validateStellarDestinationAddress: () => validateStellarDestinationAddress
});
module.exports = __toCommonJS(src_exports);

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
function gatherAuthEntrySignatureStatus({
  transaction,
  simulationResponse,
  simulate
}) {
  const shouldAssemble = simulate ?? simulationResponse !== void 0;
  let assembledTx = transaction;
  if (shouldAssemble && simulationResponse) {
    const assembledTxBuilder = (0, import_rpc.assembleTransaction)(transaction, simulationResponse);
    assembledTx = assembledTxBuilder.build();
  }
  if (assembledTx.operations.length !== 1) {
    throw new Error(
      `Expected transaction with exactly one operation, got ${assembledTx.operations.length}`
    );
  }
  const operation = assembledTx.operations[0];
  if (operation.type !== "invokeHostFunction") {
    throw new Error(`Expected InvokeHostFunction operation, got ${operation.type}`);
  }
  const invokeOp = operation;
  const alreadySigned = [];
  const pendingSignature = [];
  for (const entry of invokeOp.auth ?? []) {
    const credentialsType = entry.credentials().switch();
    if (credentialsType === import_stellar_sdk.xdr.SorobanCredentialsType.sorobanCredentialsSourceAccount()) {
      continue;
    }
    if (credentialsType === import_stellar_sdk.xdr.SorobanCredentialsType.sorobanCredentialsAddress()) {
      const addressCredentials = entry.credentials().address();
      const address = import_stellar_sdk.Address.fromScAddress(addressCredentials.address()).toString();
      const signature = addressCredentials.signature();
      const isSigned = signature.switch().name !== "scvVoid";
      if (isSigned) {
        alreadySigned.push(address);
      } else {
        pendingSignature.push(address);
      }
    }
  }
  return {
    alreadySigned: [...new Set(alreadySigned)],
    // Remove duplicates
    pendingSignature: [...new Set(pendingSignature)]
  };
}

// src/utils.ts
var import_stellar_sdk2 = require("@stellar/stellar-sdk");

// src/constants.ts
var STELLAR_PUBNET_CAIP2 = "stellar:pubnet";
var STELLAR_TESTNET_CAIP2 = "stellar:testnet";
var STELLAR_WILDCARD_CAIP2 = "stellar:*";
var DEFAULT_TESTNET_RPC_URL = "https://soroban-testnet.stellar.org";
var STELLAR_DESTINATION_ADDRESS_REGEX = /^(?:[GC][ABCD][A-Z2-7]{54}|M[ABCD][A-Z2-7]{67})$/;
var STELLAR_ASSET_ADDRESS_REGEX = /^(?:[C][ABCD][A-Z2-7]{54})$/;
var USDC_PUBNET_ADDRESS = "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75";
var USDC_TESTNET_ADDRESS = "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";
var STELLAR_NETWORK_TO_PASSPHRASE = /* @__PURE__ */ new Map([
  [STELLAR_PUBNET_CAIP2, "Public Global Stellar Network ; September 2015"],
  [STELLAR_TESTNET_CAIP2, "Test SDF Network ; September 2015"]
]);
var DEFAULT_TOKEN_DECIMALS = 7;

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
function getUsdcAddress(network) {
  switch (network) {
    case STELLAR_PUBNET_CAIP2:
      return USDC_PUBNET_ADDRESS;
    case STELLAR_TESTNET_CAIP2:
      return USDC_TESTNET_ADDRESS;
    default:
      throw new Error(`No USDC address configured for network: ${network}`);
  }
}
function convertToTokenAmount(decimalAmount, decimals = DEFAULT_TOKEN_DECIMALS) {
  const amount = parseFloat(decimalAmount);
  if (isNaN(amount)) {
    throw new Error(`Invalid amount: ${decimalAmount}`);
  }
  if (decimals < 0 || decimals > 20) {
    throw new Error(`Decimals must be between 0 and 20, got ${decimals}`);
  }
  const normalizedDecimal = /[eE]/.test(decimalAmount) ? amount.toFixed(Math.max(decimals, 20)) : decimalAmount;
  const [intPart, decPart = ""] = normalizedDecimal.split(".");
  const paddedDec = decPart.padEnd(decimals, "0").slice(0, decimals);
  return (intPart + paddedDec).replace(/^0+/, "") || "0";
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

// src/signer.ts
var import_stellar_sdk4 = require("@stellar/stellar-sdk");
var import_contract = require("@stellar/stellar-sdk/contract");
function createEd25519Signer(privateKey, defaultNetwork = STELLAR_TESTNET_CAIP2) {
  const kp = import_stellar_sdk4.Keypair.fromSecret(privateKey);
  const networkPassphrase = getNetworkPassphrase(defaultNetwork);
  const address = kp.publicKey();
  const { signAuthEntry, signTransaction } = (0, import_contract.basicNodeSigner)(kp, networkPassphrase);
  return {
    address,
    signAuthEntry,
    signTransaction
  };
}
function isFacilitatorStellarSigner(signer) {
  if (typeof signer !== "object" || signer === null) return false;
  const s = signer;
  return typeof s.address === "string" && typeof s.signAuthEntry === "function" && typeof s.signTransaction === "function";
}
function isClientStellarSigner(signer) {
  if (typeof signer !== "object" || signer === null) return false;
  const s = signer;
  return typeof s.address === "string" && typeof s.signAuthEntry === "function" && (s.signTransaction === void 0 || typeof s.signTransaction === "function");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DEFAULT_ESTIMATED_LEDGER_SECONDS,
  DEFAULT_TESTNET_RPC_URL,
  DEFAULT_TOKEN_DECIMALS,
  ExactStellarScheme,
  STELLAR_ASSET_ADDRESS_REGEX,
  STELLAR_DESTINATION_ADDRESS_REGEX,
  STELLAR_NETWORK_TO_PASSPHRASE,
  STELLAR_PUBNET_CAIP2,
  STELLAR_TESTNET_CAIP2,
  STELLAR_WILDCARD_CAIP2,
  USDC_PUBNET_ADDRESS,
  USDC_TESTNET_ADDRESS,
  convertToTokenAmount,
  createEd25519Signer,
  gatherAuthEntrySignatureStatus,
  getEstimatedLedgerCloseTimeSeconds,
  getNetworkPassphrase,
  getRpcClient,
  getRpcUrl,
  getUsdcAddress,
  handleSimulationResult,
  isClientStellarSigner,
  isFacilitatorStellarSigner,
  isStellarNetwork,
  validateStellarAssetAddress,
  validateStellarDestinationAddress
});
//# sourceMappingURL=index.js.map