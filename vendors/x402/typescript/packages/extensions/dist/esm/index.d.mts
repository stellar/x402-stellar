export { B as BAZAAR, a as BazaarClientExtension, b as BodyDiscoveryExtension, c as BodyDiscoveryInfo, D as DeclareBodyDiscoveryExtensionConfig, d as DeclareDiscoveryExtensionConfig, e as DeclareDiscoveryExtensionInput, f as DeclareMcpDiscoveryExtensionConfig, g as DeclareQueryDiscoveryExtensionConfig, h as DiscoveredHTTPResource, i as DiscoveredMCPResource, j as DiscoveredResource, k as DiscoveryExtension, l as DiscoveryInfo, m as DiscoveryResource, n as DiscoveryResourcesResponse, L as ListDiscoveryResourcesParams, M as McpDiscoveryExtension, o as McpDiscoveryInfo, Q as QueryDiscoveryExtension, p as QueryDiscoveryInfo, V as ValidationResult, W as WithExtensions, q as bazaarResourceServerExtension, r as declareDiscoveryExtension, s as extractDiscoveryInfo, t as extractDiscoveryInfoFromExtension, u as extractDiscoveryInfoV1, v as extractResourceMetadataV1, w as isBodyExtensionConfig, x as isDiscoverableV1, y as isMcpExtensionConfig, z as isQueryExtensionConfig, A as validateAndExtract, C as validateDiscoveryExtension, E as withBazaar } from './index-G8RNfr6X.mjs';
export { CompleteSIWxInfo, CreateSIWxHookOptions, DeclareSIWxOptions, EVMMessageVerifier, EVMSigner, InMemorySIWxStorage, SIGN_IN_WITH_X, SIWxExtension, SIWxExtensionInfo, SIWxExtensionSchema, SIWxHookEvent, SIWxPayload, SIWxPayloadSchema, SIWxSigner, SIWxStorage, SIWxValidationOptions, SIWxValidationResult, SIWxVerifyOptions, SIWxVerifyResult, SOLANA_DEVNET, SOLANA_MAINNET, SOLANA_TESTNET, SignatureScheme, SignatureType, SolanaSigner, SupportedChain, buildSIWxSchema, createSIWxClientHook, createSIWxMessage, createSIWxPayload, createSIWxRequestHook, createSIWxSettleHook, declareSIWxExtension, decodeBase58, encodeBase58, encodeSIWxHeader, extractEVMChainId, extractSolanaChainReference, formatSIWEMessage, formatSIWSMessage, getEVMAddress, getSolanaAddress, isEVMSigner, isSolanaSigner, parseSIWxHeader, signEVMMessage, signSolanaMessage, siwxResourceServerExtension, validateSIWxMessage, verifyEVMSignature, verifySIWxSignature, verifySolanaSignature, wrapFetchWithSIWx } from './sign-in-with-x/index.mjs';
export { PAYMENT_IDENTIFIER, PAYMENT_ID_MAX_LENGTH, PAYMENT_ID_MIN_LENGTH, PAYMENT_ID_PATTERN, PaymentIdentifierExtension, PaymentIdentifierInfo, PaymentIdentifierSchema, PaymentIdentifierValidationResult, appendPaymentIdentifierToExtensions, declarePaymentIdentifierExtension, extractAndValidatePaymentIdentifier, extractPaymentIdentifier, generatePaymentId, hasPaymentIdentifier, isPaymentIdentifierExtension, isPaymentIdentifierRequired, isValidPaymentId, paymentIdentifierResourceServerExtension, paymentIdentifierSchema, validatePaymentIdentifier, validatePaymentIdentifierRequirement } from './payment-identifier/index.mjs';
import { FacilitatorExtension, PaymentPayload } from '@x402/core/types';
import '@x402/core/http';
import 'zod';

/**
 * Type definitions for the EIP-2612 Gas Sponsoring Extension
 *
 * This extension enables gasless approval of the Permit2 contract for tokens
 * that implement EIP-2612. The client signs an off-chain permit, and the
 * facilitator submits it on-chain via `x402Permit2Proxy.settleWithPermit`.
 */

/**
 * Extension identifier for the EIP-2612 gas sponsoring extension.
 */
declare const EIP2612_GAS_SPONSORING: FacilitatorExtension;
/**
 * EIP-2612 gas sponsoring info populated by the client.
 *
 * Contains the EIP-2612 permit signature and parameters that the facilitator
 * needs to call `x402Permit2Proxy.settleWithPermit`.
 */
interface Eip2612GasSponsoringInfo {
    /** Index signature for compatibility with Record<string, unknown> */
    [key: string]: unknown;
    /** The address of the sender (token owner). */
    from: string;
    /** The address of the ERC-20 token contract. */
    asset: string;
    /** The address of the spender (Canonical Permit2). */
    spender: string;
    /** The amount to approve (uint256 as decimal string). Typically MaxUint256. */
    amount: string;
    /** The current EIP-2612 nonce of the sender (decimal string). */
    nonce: string;
    /** The timestamp at which the permit signature expires (decimal string). */
    deadline: string;
    /** The 65-byte concatenated EIP-2612 permit signature (r, s, v) as a hex string. */
    signature: string;
    /** Schema version identifier. */
    version: string;
}
/**
 * Server-side EIP-2612 gas sponsoring info included in PaymentRequired.
 * Contains a description and version; the client populates the rest.
 */
interface Eip2612GasSponsoringServerInfo {
    /** Index signature for compatibility with Record<string, unknown> */
    [key: string]: unknown;
    /** Human-readable description of the extension. */
    description: string;
    /** Schema version identifier. */
    version: string;
}
/**
 * The full extension object as it appears in PaymentRequired.extensions
 * and PaymentPayload.extensions.
 */
interface Eip2612GasSponsoringExtension {
    /** Extension info - server-provided or client-enriched. */
    info: Eip2612GasSponsoringServerInfo | Eip2612GasSponsoringInfo;
    /** JSON Schema describing the expected structure of info. */
    schema: Record<string, unknown>;
}

/**
 * Resource Service functions for declaring the EIP-2612 Gas Sponsoring extension.
 *
 * These functions help servers declare support for EIP-2612 gasless Permit2 approvals
 * in the PaymentRequired response extensions.
 */

/**
 * Declares the EIP-2612 gas sponsoring extension for inclusion in
 * PaymentRequired.extensions.
 *
 * The server advertises that it (or its facilitator) supports EIP-2612
 * gasless Permit2 approval. The client will populate the info with the
 * actual permit signature data.
 *
 * @returns An object keyed by the extension identifier containing the extension declaration
 *
 * @example
 * ```typescript
 * import { declareEip2612GasSponsoringExtension } from '@x402/extensions';
 *
 * const routes = [
 *   {
 *     path: "/api/data",
 *     price: "$0.01",
 *     extensions: {
 *       ...declareEip2612GasSponsoringExtension(),
 *     },
 *   },
 * ];
 * ```
 */
declare function declareEip2612GasSponsoringExtension(): Record<string, Eip2612GasSponsoringExtension>;

/**
 * Facilitator functions for extracting and validating EIP-2612 Gas Sponsoring extension data.
 *
 * These functions help facilitators extract the EIP-2612 permit data from payment
 * payloads and validate it before calling settleWithPermit.
 */

/**
 * Extracts the EIP-2612 gas sponsoring info from a payment payload's extensions.
 *
 * Returns the info if the extension is present and contains the required client-populated
 * fields (from, asset, spender, amount, nonce, deadline, signature, version).
 *
 * @param paymentPayload - The payment payload to extract from
 * @returns The EIP-2612 gas sponsoring info, or null if not present
 */
declare function extractEip2612GasSponsoringInfo(paymentPayload: PaymentPayload): Eip2612GasSponsoringInfo | null;
/**
 * Validates that the EIP-2612 gas sponsoring info has valid format.
 *
 * Performs basic validation on the info fields:
 * - Addresses are valid hex (0x + 40 hex chars)
 * - Amount, nonce, deadline are numeric strings
 * - Signature is a hex string
 * - Version is a numeric version string
 *
 * @param info - The EIP-2612 gas sponsoring info to validate
 * @returns True if the info is valid, false otherwise
 */
declare function validateEip2612GasSponsoringInfo(info: Eip2612GasSponsoringInfo): boolean;

export { EIP2612_GAS_SPONSORING, type Eip2612GasSponsoringExtension, type Eip2612GasSponsoringInfo, type Eip2612GasSponsoringServerInfo, declareEip2612GasSponsoringExtension, extractEip2612GasSponsoringInfo, validateEip2612GasSponsoringInfo };
