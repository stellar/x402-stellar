export { ExactStellarScheme } from './exact/client/index.js';
export { C as ClientStellarSigner, D as DEFAULT_ESTIMATED_LEDGER_SECONDS, E as Ed25519Signer, F as FacilitatorStellarSigner, R as RpcConfig, c as convertToTokenAmount, a as createEd25519Signer, g as getEstimatedLedgerCloseTimeSeconds, b as getNetworkPassphrase, d as getRpcClient, e as getRpcUrl, f as getUsdcAddress, i as isClientStellarSigner, h as isFacilitatorStellarSigner, j as isStellarNetwork, v as validateStellarAssetAddress, k as validateStellarDestinationAddress } from './signer-3F8PvIJj.js';
import { Transaction } from '@stellar/stellar-sdk';
import { Api } from '@stellar/stellar-sdk/rpc';
import '@x402/core/types';
import '@stellar/stellar-sdk/contract';

/**
 * Exact Stellar payload structure containing a base64 encoded Stellar transaction
 */
type ExactStellarPayloadV2 = {
    /**
     * Base64 encoded Stellar transaction
     */
    transaction: string;
};

/**
 * CAIP-2 network identifiers for Stellar (V2)
 */
declare const STELLAR_PUBNET_CAIP2 = "stellar:pubnet";
declare const STELLAR_TESTNET_CAIP2 = "stellar:testnet";
declare const STELLAR_WILDCARD_CAIP2 = "stellar:*";
/**
 * Default testnet RPC URL
 */
declare const DEFAULT_TESTNET_RPC_URL = "https://soroban-testnet.stellar.org";
/**
 * Stellar validation regex for destination and asset addresses
 */
declare const STELLAR_DESTINATION_ADDRESS_REGEX: RegExp;
declare const STELLAR_ASSET_ADDRESS_REGEX: RegExp;
/**
 * USDC contract addresses (default stablecoin)
 */
declare const USDC_PUBNET_ADDRESS = "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75";
declare const USDC_TESTNET_ADDRESS = "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";
declare const STELLAR_NETWORK_TO_PASSPHRASE: ReadonlyMap<string, string>;
/**
 * Default token decimals
 */
declare const DEFAULT_TOKEN_DECIMALS = 7;

/**
 * Handles the simulation result of a Stellar transaction.
 *
 * @param simulation - The simulation result to handle
 * @throws An error if the simulation result is of type "RESTORE" or "ERROR"
 */
declare function handleSimulationResult(simulation?: Api.SimulateTransactionResponse): void;
/**
 * Analysis result of transaction signers
 */
type ContractSigners = {
    /** Accounts that have already signed auth entries */
    alreadySigned: string[];
    /** Accounts that still need to sign auth entries */
    pendingSignature: string[];
};
/**
 * Input parameters for gathering auth entry signature status
 */
type GatherAuthEntrySignatureStatusInput = {
    /** The transaction to analyze */
    transaction: Transaction;
    /** Optional simulation response to assemble with transaction before analysis */
    simulationResponse?: Api.SimulateTransactionResponse;
    /** Whether to simulate/assemble the transaction with simulation data (default: true if simulationResponse was not provided) */
    simulate?: boolean;
};
/**
 * Gathers the signature status of auth entries in a Stellar transaction.
 *
 * This function inspects the auth entries in the transaction's InvokeHostFunction
 * operation and categorizes them based on their signature status.
 *
 * @param input - Input containing transaction and optional simulation data
 * @param input.transaction - The transaction to analyze
 * @param input.simulationResponse - Optional simulation response to assemble with transaction before analysis
 * @param input.simulate - Whether to simulate/assemble the transaction with simulation data (default: true if simulationResponse was not provided)
 * @returns ContractSigners with arrays of signed and pending signer addresses
 * @throws Error if transaction doesn't have exactly one InvokeHostFunction operation
 *
 * @example
 * ```ts
 * const status = gatherAuthEntrySignatureStatus({
 *   transaction: tx,
 *   simulationResponse: simResult
 * });
 * console.log('Already signed:', status.alreadySigned);
 * console.log('Pending:', status.pendingSignature);
 * ```
 */
declare function gatherAuthEntrySignatureStatus({ transaction, simulationResponse, simulate, }: GatherAuthEntrySignatureStatusInput): ContractSigners;

export { type ContractSigners, DEFAULT_TESTNET_RPC_URL, DEFAULT_TOKEN_DECIMALS, type ExactStellarPayloadV2, type GatherAuthEntrySignatureStatusInput, STELLAR_ASSET_ADDRESS_REGEX, STELLAR_DESTINATION_ADDRESS_REGEX, STELLAR_NETWORK_TO_PASSPHRASE, STELLAR_PUBNET_CAIP2, STELLAR_TESTNET_CAIP2, STELLAR_WILDCARD_CAIP2, USDC_PUBNET_ADDRESS, USDC_TESTNET_ADDRESS, gatherAuthEntrySignatureStatus, handleSimulationResult };
