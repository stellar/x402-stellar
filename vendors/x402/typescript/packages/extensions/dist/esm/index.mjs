import {
  BAZAAR,
  bazaarResourceServerExtension,
  declareDiscoveryExtension,
  extractDiscoveryInfo,
  extractDiscoveryInfoFromExtension,
  extractDiscoveryInfoV1,
  extractResourceMetadataV1,
  isBodyExtensionConfig,
  isDiscoverableV1,
  isMcpExtensionConfig,
  isQueryExtensionConfig,
  validateAndExtract,
  validateDiscoveryExtension,
  withBazaar
} from "./chunk-ANAQVNUK.mjs";
import {
  InMemorySIWxStorage,
  SIGN_IN_WITH_X,
  SIWxPayloadSchema,
  SOLANA_DEVNET,
  SOLANA_MAINNET,
  SOLANA_TESTNET,
  buildSIWxSchema,
  createSIWxClientHook,
  createSIWxMessage,
  createSIWxPayload,
  createSIWxRequestHook,
  createSIWxSettleHook,
  declareSIWxExtension,
  decodeBase58,
  encodeBase58,
  encodeSIWxHeader,
  extractEVMChainId,
  extractSolanaChainReference,
  formatSIWEMessage,
  formatSIWSMessage,
  getEVMAddress,
  getSolanaAddress,
  isEVMSigner,
  isSolanaSigner,
  parseSIWxHeader,
  signEVMMessage,
  signSolanaMessage,
  siwxResourceServerExtension,
  validateSIWxMessage,
  verifyEVMSignature,
  verifySIWxSignature,
  verifySolanaSignature,
  wrapFetchWithSIWx
} from "./chunk-O34SGKEP.mjs";
import {
  PAYMENT_IDENTIFIER,
  PAYMENT_ID_MAX_LENGTH,
  PAYMENT_ID_MIN_LENGTH,
  PAYMENT_ID_PATTERN,
  appendPaymentIdentifierToExtensions,
  declarePaymentIdentifierExtension,
  extractAndValidatePaymentIdentifier,
  extractPaymentIdentifier,
  generatePaymentId,
  hasPaymentIdentifier,
  isPaymentIdentifierExtension,
  isPaymentIdentifierRequired,
  isValidPaymentId,
  paymentIdentifierResourceServerExtension,
  paymentIdentifierSchema,
  validatePaymentIdentifier,
  validatePaymentIdentifierRequirement
} from "./chunk-73HCOE6N.mjs";

// src/eip2612-gas-sponsoring/types.ts
var EIP2612_GAS_SPONSORING = { key: "eip2612GasSponsoring" };

// src/eip2612-gas-sponsoring/resourceService.ts
var eip2612GasSponsoringSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  properties: {
    from: {
      type: "string",
      pattern: "^0x[a-fA-F0-9]{40}$",
      description: "The address of the sender."
    },
    asset: {
      type: "string",
      pattern: "^0x[a-fA-F0-9]{40}$",
      description: "The address of the ERC-20 token contract."
    },
    spender: {
      type: "string",
      pattern: "^0x[a-fA-F0-9]{40}$",
      description: "The address of the spender (Canonical Permit2)."
    },
    amount: {
      type: "string",
      pattern: "^[0-9]+$",
      description: "The amount to approve (uint256). Typically MaxUint."
    },
    nonce: {
      type: "string",
      pattern: "^[0-9]+$",
      description: "The current nonce of the sender."
    },
    deadline: {
      type: "string",
      pattern: "^[0-9]+$",
      description: "The timestamp at which the signature expires."
    },
    signature: {
      type: "string",
      pattern: "^0x[a-fA-F0-9]+$",
      description: "The 65-byte concatenated signature (r, s, v) as a hex string."
    },
    version: {
      type: "string",
      pattern: "^[0-9]+(\\.[0-9]+)*$",
      description: "Schema version identifier."
    }
  },
  required: ["from", "asset", "spender", "amount", "nonce", "deadline", "signature", "version"]
};
function declareEip2612GasSponsoringExtension() {
  const key = EIP2612_GAS_SPONSORING.key;
  return {
    [key]: {
      info: {
        description: "The facilitator accepts EIP-2612 gasless Permit to `Permit2` canonical contract.",
        version: "1"
      },
      schema: eip2612GasSponsoringSchema
    }
  };
}

// src/eip2612-gas-sponsoring/facilitator.ts
function extractEip2612GasSponsoringInfo(paymentPayload) {
  if (!paymentPayload.extensions) {
    return null;
  }
  const extension = paymentPayload.extensions[EIP2612_GAS_SPONSORING.key];
  if (!extension?.info) {
    return null;
  }
  const info = extension.info;
  if (!info.from || !info.asset || !info.spender || !info.amount || !info.nonce || !info.deadline || !info.signature || !info.version) {
    return null;
  }
  return info;
}
function validateEip2612GasSponsoringInfo(info) {
  const addressPattern = /^0x[a-fA-F0-9]{40}$/;
  const numericPattern = /^[0-9]+$/;
  const hexPattern = /^0x[a-fA-F0-9]+$/;
  const versionPattern = /^[0-9]+(\.[0-9]+)*$/;
  return addressPattern.test(info.from) && addressPattern.test(info.asset) && addressPattern.test(info.spender) && numericPattern.test(info.amount) && numericPattern.test(info.nonce) && numericPattern.test(info.deadline) && hexPattern.test(info.signature) && versionPattern.test(info.version);
}
export {
  BAZAAR,
  EIP2612_GAS_SPONSORING,
  InMemorySIWxStorage,
  PAYMENT_IDENTIFIER,
  PAYMENT_ID_MAX_LENGTH,
  PAYMENT_ID_MIN_LENGTH,
  PAYMENT_ID_PATTERN,
  SIGN_IN_WITH_X,
  SIWxPayloadSchema,
  SOLANA_DEVNET,
  SOLANA_MAINNET,
  SOLANA_TESTNET,
  appendPaymentIdentifierToExtensions,
  bazaarResourceServerExtension,
  buildSIWxSchema,
  createSIWxClientHook,
  createSIWxMessage,
  createSIWxPayload,
  createSIWxRequestHook,
  createSIWxSettleHook,
  declareDiscoveryExtension,
  declareEip2612GasSponsoringExtension,
  declarePaymentIdentifierExtension,
  declareSIWxExtension,
  decodeBase58,
  encodeBase58,
  encodeSIWxHeader,
  extractAndValidatePaymentIdentifier,
  extractDiscoveryInfo,
  extractDiscoveryInfoFromExtension,
  extractDiscoveryInfoV1,
  extractEVMChainId,
  extractEip2612GasSponsoringInfo,
  extractPaymentIdentifier,
  extractResourceMetadataV1,
  extractSolanaChainReference,
  formatSIWEMessage,
  formatSIWSMessage,
  generatePaymentId,
  getEVMAddress,
  getSolanaAddress,
  hasPaymentIdentifier,
  isBodyExtensionConfig,
  isDiscoverableV1,
  isEVMSigner,
  isMcpExtensionConfig,
  isPaymentIdentifierExtension,
  isPaymentIdentifierRequired,
  isQueryExtensionConfig,
  isSolanaSigner,
  isValidPaymentId,
  parseSIWxHeader,
  paymentIdentifierResourceServerExtension,
  paymentIdentifierSchema,
  signEVMMessage,
  signSolanaMessage,
  siwxResourceServerExtension,
  validateAndExtract,
  validateDiscoveryExtension,
  validateEip2612GasSponsoringInfo,
  validatePaymentIdentifier,
  validatePaymentIdentifierRequirement,
  validateSIWxMessage,
  verifyEVMSignature,
  verifySIWxSignature,
  verifySolanaSignature,
  withBazaar,
  wrapFetchWithSIWx
};
//# sourceMappingURL=index.mjs.map