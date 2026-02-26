import { rpc } from '@stellar/stellar-sdk';
import { Network } from '@x402/core/types';
import { SignAuthEntry, SignTransaction } from '@stellar/stellar-sdk/contract';

declare const DEFAULT_ESTIMATED_LEDGER_SECONDS = 5;
/**
 * Configuration for RPC client connections
 */
interface RpcConfig {
    /** Custom RPC URL to use instead of defaults */
    url?: string;
}
/**
 * Checks if a network is a Stellar network
 *
 * @param network - The CAIP-2 network identifier
 * @returns `true` if the network is a Stellar network, `false` otherwise
 */
declare function isStellarNetwork(network: Network): boolean;
/**
 * Validates a Stellar destination address (G-account, C-account, or M-account)
 *
 * @param address - Stellar destination address to validate
 * @returns `true` if the address is valid, `false` otherwise
 */
declare function validateStellarDestinationAddress(address: string): boolean;
/**
 * Validates a Stellar asset/contract address (C-account only)
 *
 * @param address - Stellar asset address to validate
 * @returns `true` if the address is valid, `false` otherwise
 */
declare function validateStellarAssetAddress(address: string): boolean;
/**
 * Gets the network passphrase for a given Stellar network
 *
 * @param network - The CAIP-2 network identifier
 * @returns The network passphrase string
 * @throws {Error} If the network is not a known Stellar network
 */
declare function getNetworkPassphrase(network: Network): string;
/**
 * Gets the RPC URL for a given Stellar network
 *
 * @param network - The CAIP-2 network identifier
 * @param rpcConfig - Optional RPC configuration with custom URL
 * @returns The RPC URL string
 * @throws {Error} If the network is unknown or mainnet RPC URL is not provided
 */
declare function getRpcUrl(network: Network, rpcConfig?: RpcConfig): string;
/**
 * Creates a Soroban RPC client for the given network
 *
 * @param network - The CAIP-2 network identifier
 * @param rpcConfig - Optional RPC configuration with custom URL
 * @returns A configured Soroban RPC Server instance
 * @throws {Error} If the network is not a valid Stellar network
 */
declare function getRpcClient(network: Network, rpcConfig?: RpcConfig): rpc.Server;
/**
 * Fetches the estimated ledger close time (seconds per ledger) from RPC getLedgers.
 *
 * @param server - The Soroban RPC Server instance
 * @returns Estimated seconds per ledger, or DEFAULT_ESTIMATED_LEDGER_SECONDS (5) on error
 */
declare function getEstimatedLedgerCloseTimeSeconds(server: rpc.Server): Promise<number>;
/**
 * Gets the default USDC contract address for a network
 *
 * @param network - The CAIP-2 network identifier
 * @returns The USDC contract address for the network
 * @throws {Error} If the network doesn't have a configured USDC address
 */
declare function getUsdcAddress(network: Network): string;
/**
 * Converts a decimal amount to token smallest units
 *
 * Handles both regular decimal strings (e.g., "0.10") and scientific notation (e.g., "1e-7").
 * The result is truncated (not rounded) to the specified number of decimal places.
 *
 * @param decimalAmount - The decimal amount as a string
 * @param decimals - Number of decimal places for the token (default: 7 for USDC)
 * @returns The amount in smallest units as a string with leading zeros removed
 * @throws {Error} If the amount is invalid or decimals is out of range
 *
 * @example
 * ```ts
 * convertToTokenAmount("0.1", 7)      // "1000000"
 * convertToTokenAmount("1.5", 7)      // "15000000"
 * convertToTokenAmount("1e-7", 7)     // "1"
 * convertToTokenAmount("1.5", 0)      // "1" (truncated)
 * ```
 */
declare function convertToTokenAmount(decimalAmount: string, decimals?: number): string;

/**
 * Ed25519 signer for Stellar transactions and auth entries.
 *
 * Implements SEP-43 interface (except signMessage).
 *
 * @see https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0043.md
 */
type Ed25519Signer = {
    address: string;
    signAuthEntry: SignAuthEntry;
    signTransaction: SignTransaction;
};
/**
 * Facilitator signer for Stellar transactions.
 *
 * Alias for Ed25519Signer. Used by x402 facilitators to verify and settle payments.
 *
 * @see https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0043.md
 */
type FacilitatorStellarSigner = Ed25519Signer;
/**
 * Client signer for Stellar transactions.
 *
 * Used by x402 clients to sign auth entries. Supports both classic (G) and contract (C) accounts.
 * signTransaction is optional for client signers.
 *
 * @see https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0043.md
 */
type ClientStellarSigner = {
    address: string;
    signAuthEntry: SignAuthEntry;
    signTransaction?: SignTransaction;
};
/**
 * Creates an Ed25519 signer for the given Stellar network.
 *
 * @param privateKey - Stellar classic (G) account private key
 * @param defaultNetwork - Is the network the signTransactiopn method will default to if no network is provided. Must use the CAIP-2 format identifier.
 * @returns Ed25519 signer implementing SEP-43 interface (except signMessage)
 * @see https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0043.md
 */
declare function createEd25519Signer(privateKey: string, defaultNetwork?: Network): Ed25519Signer;
/**
 * Type guard for FacilitatorStellarSigner.
 *
 * Checks for required methods: address, signAuthEntry, signTransaction.
 *
 * @param signer - Value to check
 * @returns `true` if signer is a FacilitatorStellarSigner
 */
declare function isFacilitatorStellarSigner(signer: unknown): signer is FacilitatorStellarSigner;
/**
 * Type guard for ClientStellarSigner.
 *
 * Checks for required methods: address, signAuthEntry. signTransaction is optional.
 *
 * @param signer - Value to check
 * @returns `true` if signer is a ClientStellarSigner
 */
declare function isClientStellarSigner(signer: unknown): signer is ClientStellarSigner;

export { type ClientStellarSigner as C, DEFAULT_ESTIMATED_LEDGER_SECONDS as D, type Ed25519Signer as E, type FacilitatorStellarSigner as F, type RpcConfig as R, createEd25519Signer as a, getNetworkPassphrase as b, convertToTokenAmount as c, getRpcClient as d, getRpcUrl as e, getUsdcAddress as f, getEstimatedLedgerCloseTimeSeconds as g, isFacilitatorStellarSigner as h, isClientStellarSigner as i, isStellarNetwork as j, validateStellarDestinationAddress as k, validateStellarAssetAddress as v };
