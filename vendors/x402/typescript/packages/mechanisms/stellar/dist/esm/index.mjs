import {
  ExactStellarScheme
} from "./chunk-IRUK7WDA.mjs";
import {
  gatherAuthEntrySignatureStatus,
  handleSimulationResult
} from "./chunk-4HPDVFME.mjs";
import {
  DEFAULT_ESTIMATED_LEDGER_SECONDS,
  DEFAULT_TESTNET_RPC_URL,
  DEFAULT_TOKEN_DECIMALS,
  STELLAR_ASSET_ADDRESS_REGEX,
  STELLAR_DESTINATION_ADDRESS_REGEX,
  STELLAR_NETWORK_TO_PASSPHRASE,
  STELLAR_PUBNET_CAIP2,
  STELLAR_TESTNET_CAIP2,
  STELLAR_WILDCARD_CAIP2,
  USDC_PUBNET_ADDRESS,
  USDC_TESTNET_ADDRESS,
  convertToTokenAmount,
  getEstimatedLedgerCloseTimeSeconds,
  getNetworkPassphrase,
  getRpcClient,
  getRpcUrl,
  getUsdcAddress,
  isStellarNetwork,
  validateStellarAssetAddress,
  validateStellarDestinationAddress
} from "./chunk-YFZMLK7W.mjs";

// src/signer.ts
import { Keypair } from "@stellar/stellar-sdk";
import { basicNodeSigner } from "@stellar/stellar-sdk/contract";
function createEd25519Signer(privateKey, defaultNetwork = STELLAR_TESTNET_CAIP2) {
  const kp = Keypair.fromSecret(privateKey);
  const networkPassphrase = getNetworkPassphrase(defaultNetwork);
  const address = kp.publicKey();
  const { signAuthEntry, signTransaction } = basicNodeSigner(kp, networkPassphrase);
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
export {
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
};
//# sourceMappingURL=index.mjs.map