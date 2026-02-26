import {
  gatherAuthEntrySignatureStatus
} from "../../chunk-4HPDVFME.mjs";
import {
  STELLAR_WILDCARD_CAIP2,
  getEstimatedLedgerCloseTimeSeconds,
  getNetworkPassphrase,
  getRpcClient,
  isStellarNetwork
} from "../../chunk-YFZMLK7W.mjs";

// src/exact/facilitator/scheme.ts
import {
  scValToNative,
  Transaction,
  Address,
  Operation,
  xdr,
  TransactionBuilder
} from "@stellar/stellar-sdk";
import { Api } from "@stellar/stellar-sdk/rpc";
var DEFAULT_TIMEOUT_SECONDS = 60;
var SUPPORTED_X402_VERSION = 2;
var DEFAULT_MAX_TRANSACTION_FEE_STROOPS = 5e4;
var SIGNATURE_EXPIRATION_LEDGER_TOLERANCE = 2;
var roundRobinSelectSigner = () => {
  let index = 0;
  return (addrs) => addrs[index++ % addrs.length];
};
function invalidVerifyResponse(reason, payer) {
  return { isValid: false, invalidReason: reason, payer };
}
function validVerifyResponse(payer) {
  return { isValid: true, payer };
}
var ExactStellarScheme = class {
  /**
   * Creates a new ExactStellarScheme instance.
   *
   * @param signers - One or more Stellar signers managed by the facilitator for settlement
   * @param options - Configuration options
   * @param options.rpcConfig - Optional RPC configuration with custom RPC URL
   * @param options.areFeesSponsored - Indicates if fees are sponsored (default: true)
   * @param options.maxTransactionFeeStroops - Maximum fee in stroops the facilitator will pay (default: 50_000)
   * @param options.selectSigner - Callback to select which signer to use (default: round-robin)
   * @param options.feeBumpSigner - Optional signer used as fee source in a fee bump transaction wrapper.
   *   When provided, settle() wraps the inner transaction (signed by the selected signer) in a
   *   FeeBumpTransaction where the feeBumpSigner pays the fees, decoupling fee payment from sequence number management.
   * @returns ExactStellarScheme instance
   */
  constructor(signers, {
    rpcConfig,
    areFeesSponsored = true,
    maxTransactionFeeStroops = DEFAULT_MAX_TRANSACTION_FEE_STROOPS,
    selectSigner = roundRobinSelectSigner(),
    feeBumpSigner
  } = {}) {
    this.scheme = "exact";
    this.caipFamily = STELLAR_WILDCARD_CAIP2;
    if (!signers || signers.length === 0) {
      throw new Error("At least one signer is required");
    }
    this.signerMap = new Map(signers.map((s) => [s.address, s]));
    this.signingAddresses = new Set(this.signerMap.keys());
    this.rpcConfig = rpcConfig;
    this.areFeesSponsored = areFeesSponsored ?? true;
    this.maxTransactionFeeStroops = maxTransactionFeeStroops ?? DEFAULT_MAX_TRANSACTION_FEE_STROOPS;
    this.selectSigner = selectSigner ?? roundRobinSelectSigner();
    this.feeBumpSigner = feeBumpSigner;
  }
  /**
   * Get mechanism-specific extra data for the supported kinds endpoint.
   * For Stellar, returns `areFeesSponsored` indicating to clients if they can expect fees to be sponsored.
   * As of now, the spec only supports `areFeesSponsored: true`.
   *
   * @param _ - The network identifier (unused, offset is network-agnostic)
   * @returns Extra data with the `areFeesSponsored` flag
   */
  getExtra(_) {
    return {
      areFeesSponsored: this.areFeesSponsored
    };
  }
  /**
   * Get signer addresses used by this facilitator.
   * For Stellar, returns all facilitator addresses.
   *
   * @param _ - The network identifier (unused for Stellar)
   * @returns Array containing all facilitator addresses
   */
  getSigners(_) {
    return [...this.signingAddresses];
  }
  /**
   * Verifies a payment payload.
   *
   * @param payload - The payment payload to verify
   * @param requirements - The payment requirements
   * @returns Promise resolving to verification response
   */
  async verify(payload, requirements) {
    let fromAddress;
    try {
      if (payload.x402Version !== SUPPORTED_X402_VERSION) {
        return invalidVerifyResponse("invalid_x402_version");
      }
      if (payload.accepted.scheme !== "exact" || requirements.scheme !== "exact") {
        return invalidVerifyResponse("unsupported_scheme");
      }
      if (requirements.network !== payload.accepted.network) {
        return invalidVerifyResponse("network_mismatch");
      }
      if (!isStellarNetwork(requirements.network)) {
        return invalidVerifyResponse("invalid_network");
      }
      const networkPassphrase = getNetworkPassphrase(requirements.network);
      const server = getRpcClient(requirements.network, this.rpcConfig);
      const stellarPayload = payload.payload;
      if (!stellarPayload || typeof stellarPayload.transaction !== "string") {
        return invalidVerifyResponse("invalid_exact_stellar_payload_malformed");
      }
      let transaction;
      try {
        transaction = new Transaction(stellarPayload.transaction, networkPassphrase);
      } catch (error) {
        console.error("Error parsing transaction:", error);
        return invalidVerifyResponse("invalid_exact_stellar_payload_malformed");
      }
      if (transaction.operations.length !== 1) {
        return invalidVerifyResponse("invalid_exact_stellar_payload_wrong_operation");
      }
      const operation = transaction.operations[0];
      if (operation.type !== "invokeHostFunction") {
        return invalidVerifyResponse("invalid_exact_stellar_payload_wrong_operation");
      }
      if (this.signingAddresses.has(operation.source ?? "") || this.signingAddresses.has(transaction.source)) {
        return invalidVerifyResponse("invalid_exact_stellar_payload_unsafe_tx_or_op_source");
      }
      const invokeOp = operation;
      const func = invokeOp.func;
      if (!func || func.switch().name !== "hostFunctionTypeInvokeContract") {
        return invalidVerifyResponse("invalid_exact_stellar_payload_wrong_operation");
      }
      const invokeContractArgs = func.invokeContract();
      const contractAddress = Address.fromScAddress(
        invokeContractArgs.contractAddress()
      ).toString();
      const functionName = invokeContractArgs.functionName().toString();
      const args = invokeContractArgs.args();
      if (contractAddress !== requirements.asset) {
        return invalidVerifyResponse("invalid_exact_stellar_payload_wrong_asset");
      }
      if (functionName !== "transfer" || args.length !== 3) {
        return invalidVerifyResponse("invalid_exact_stellar_payload_wrong_function_name");
      }
      fromAddress = scValToNative(args[0]);
      const toAddress = scValToNative(args[1]);
      const amount = scValToNative(args[2]);
      if (this.signingAddresses.has(fromAddress)) {
        return invalidVerifyResponse("invalid_exact_stellar_payload_facilitator_is_payer");
      }
      if (toAddress !== requirements.payTo) {
        return invalidVerifyResponse("invalid_exact_stellar_payload_wrong_recipient", fromAddress);
      }
      const expectedAmount = BigInt(requirements.amount);
      if (amount !== expectedAmount) {
        return invalidVerifyResponse("invalid_exact_stellar_payload_wrong_amount", fromAddress);
      }
      const simResponse = await server.simulateTransaction(transaction);
      if (!Api.isSimulationSuccess(simResponse)) {
        const errorMsg = simResponse.error ? `: ${simResponse.error}` : "";
        console.error("Simulation error:", errorMsg);
        return invalidVerifyResponse(
          "invalid_exact_stellar_payload_simulation_failed",
          fromAddress
        );
      }
      const clientFeeStroops = parseInt(transaction.fee, 10);
      const minResourceFee = parseInt(simResponse.minResourceFee, 10);
      if (clientFeeStroops < minResourceFee) {
        return invalidVerifyResponse(
          "invalid_exact_stellar_payload_fee_below_minimum",
          fromAddress
        );
      }
      if (clientFeeStroops > this.maxTransactionFeeStroops) {
        return invalidVerifyResponse("invalid_exact_stellar_payload_fee_exceeds_maximum");
      }
      const eventValidation = this.validateSimulationEvents(
        simResponse.events,
        fromAddress,
        requirements.payTo,
        expectedAmount,
        requirements.asset
      );
      if (eventValidation) {
        return eventValidation;
      }
      const latestLedger = await server.getLatestLedger();
      const currentLedger = latestLedger.sequence;
      const maxTimeoutSeconds = requirements.maxTimeoutSeconds ?? DEFAULT_TIMEOUT_SECONDS;
      const estimatedLedgerSeconds = await getEstimatedLedgerCloseTimeSeconds(server);
      const maxLedgerOffset = Math.ceil(maxTimeoutSeconds / estimatedLedgerSeconds);
      const maxLedger = currentLedger + maxLedgerOffset;
      const authValidation = this.validateAuthEntries(
        invokeOp,
        this.signingAddresses,
        fromAddress,
        maxLedger,
        transaction,
        simResponse
      );
      if (authValidation) {
        return authValidation;
      }
      return validVerifyResponse(fromAddress);
    } catch (error) {
      console.error("Unexpected verification error:", error);
      return invalidVerifyResponse("unexpected_verify_error", fromAddress);
    }
  }
  /**
   * Settles a payment by submitting the transaction on-chain.
   *
   * @param payload - The payment payload to settle
   * @param requirements - The payment requirements
   * @returns Promise resolving to settlement response
   */
  async settle(payload, requirements) {
    const server = getRpcClient(requirements.network, this.rpcConfig);
    const networkPassphrase = getNetworkPassphrase(requirements.network);
    let payer;
    let txHash;
    try {
      const verifyResult = await this.verify(payload, requirements);
      if (!verifyResult.isValid) {
        return {
          success: false,
          network: payload.accepted.network,
          transaction: "",
          errorReason: verifyResult.invalidReason ?? "verification_failed",
          payer: verifyResult.payer
        };
      }
      payer = verifyResult.payer;
      const stellarPayload = payload.payload;
      const txEnvelope = xdr.TransactionEnvelope.fromXDR(stellarPayload.transaction, "base64");
      const transaction = new Transaction(stellarPayload.transaction, networkPassphrase);
      const sorobanData = txEnvelope.v1()?.tx()?.ext()?.sorobanData() || void 0;
      if (!sorobanData) {
        return {
          success: false,
          network: payload.accepted.network,
          transaction: "",
          errorReason: "invalid_exact_stellar_payload_malformed",
          payer
        };
      }
      const invokeOp = transaction.operations[0];
      const signer = this.signerMap.get(this.selectSigner([...this.signingAddresses]));
      if (!signer) {
        return {
          success: false,
          network: payload.accepted.network,
          transaction: "",
          errorReason: "settle_exact_stellar_signer_selection_failed",
          payer
        };
      }
      const facilitatorAccount = await server.getAccount(signer.address);
      const clientFeeStroops = parseInt(transaction.fee, 10);
      const maxFeeStroops = Math.min(clientFeeStroops, this.maxTransactionFeeStroops);
      const rebuiltTx = new TransactionBuilder(facilitatorAccount, {
        fee: maxFeeStroops.toString(),
        networkPassphrase,
        ledgerbounds: transaction.ledgerBounds,
        memo: transaction.memo,
        minAccountSequence: transaction.minAccountSequence,
        minAccountSequenceAge: transaction.minAccountSequenceAge,
        minAccountSequenceLedgerGap: transaction.minAccountSequenceLedgerGap,
        extraSigners: transaction.extraSigners,
        sorobanData
      }).setTimeout(requirements.maxTimeoutSeconds ?? DEFAULT_TIMEOUT_SECONDS).addOperation(Operation.invokeHostFunction(invokeOp)).build();
      const { signedTxXdr, error: signError } = await signer.signTransaction(rebuiltTx.toXDR(), {
        networkPassphrase
      });
      if (signError) {
        return {
          success: false,
          network: payload.accepted.network,
          transaction: "",
          errorReason: "settle_exact_stellar_transaction_signing_failed",
          payer
        };
      }
      let txToSubmit;
      if (this.feeBumpSigner) {
        const signedInnerTx = TransactionBuilder.fromXDR(
          signedTxXdr,
          networkPassphrase
        );
        const feeBumpTx = TransactionBuilder.buildFeeBumpTransaction(
          this.feeBumpSigner.address,
          maxFeeStroops.toString(),
          // Same as the inner transaction fee
          signedInnerTx,
          networkPassphrase
        );
        const { signedTxXdr: signedFeeBumpXdr, error: feeBumpSignError } = await this.feeBumpSigner.signTransaction(feeBumpTx.toXDR(), { networkPassphrase });
        if (feeBumpSignError) {
          return {
            success: false,
            network: payload.accepted.network,
            transaction: "",
            errorReason: "settle_exact_stellar_fee_bump_signing_failed",
            payer
          };
        }
        txToSubmit = TransactionBuilder.fromXDR(
          signedFeeBumpXdr,
          networkPassphrase
        );
      } else {
        txToSubmit = TransactionBuilder.fromXDR(signedTxXdr, networkPassphrase);
      }
      const sendResult = await server.sendTransaction(txToSubmit);
      if (sendResult.status !== "PENDING") {
        return {
          success: false,
          network: payload.accepted.network,
          transaction: "",
          errorReason: "settle_exact_stellar_transaction_submission_failed",
          payer
        };
      }
      txHash = sendResult.hash;
      const maxPollAttempts = requirements.maxTimeoutSeconds ?? DEFAULT_TIMEOUT_SECONDS;
      const confirmResult = await this.pollForTransaction(server, txHash, maxPollAttempts);
      if (!confirmResult.success) {
        return {
          success: false,
          network: payload.accepted.network,
          transaction: txHash,
          errorReason: "settle_exact_stellar_transaction_failed",
          payer
        };
      }
      return {
        success: true,
        transaction: txHash,
        network: payload.accepted.network,
        payer
      };
    } catch (error) {
      console.error("Unexpected settlement error:", error);
      return {
        success: false,
        network: payload.accepted.network,
        transaction: txHash || "",
        errorReason: "unexpected_settle_error",
        payer
      };
    }
  }
  /**
   * Polls for transaction confirmation on Soroban.
   *
   * @param server - Soroban RPC server
   * @param txHash - Transaction hash to poll for
   * @param maxPollAttempts - Maximum number of polling attempts (default: 15)
   * @param delayMs - Delay between attempts in milliseconds (default: 1000)
   * @returns Result with success status
   */
  async pollForTransaction(server, txHash, maxPollAttempts = 15, delayMs = 1e3) {
    for (let i = 0; i < maxPollAttempts; i++) {
      try {
        const txResult = await server.getTransaction(txHash);
        if (txResult.status === "SUCCESS") {
          return { success: true };
        } else if (txResult.status === "FAILED") {
          return { success: false };
        }
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } catch (error) {
        if (error instanceof Error && !error.message.includes("NOT_FOUND")) {
          console.warn(`Poll attempt ${i} failed:`, error);
        }
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
    return { success: false };
  }
  /**
   * Validates simulation events for transfer correctness.
   * Ensures there is exactly one token transfer event, the transfer matches the
   * expected sender, recipient, amount, and asset (contract address), and the
   * facilitator address is not involved in the transfer.
   *
   * @param events - The array of DiagnosticEvent objects from the simulation
   * @param fromAddress - The payer's address
   * @param toAddress - The recipient's address
   * @param expectedAmount - The expected transfer amount
   * @param expectedAsset - The expected token contract address
   * @returns undefined if the validation succeeds, otherwise an invalid VerifyResponse
   */
  validateSimulationEvents(events, fromAddress, toAddress, expectedAmount, expectedAsset) {
    const transferEvents = [];
    for (const diagnosticEvent of events) {
      try {
        const event = diagnosticEvent.event();
        if (event.type().name !== "contract") {
          continue;
        }
        const body = event.body().v0();
        const topics = body.topics();
        if (topics.length < 3) {
          return invalidVerifyResponse(
            "invalid_exact_stellar_payload_event_not_transfer",
            fromAddress
          );
        }
        const topicType = topics[0].switch().name;
        if (topicType !== "scvSymbol") {
          return invalidVerifyResponse(
            "invalid_exact_stellar_payload_event_not_transfer",
            fromAddress
          );
        }
        const symbol = topics[0].sym().toString();
        if (symbol !== "transfer") {
          return invalidVerifyResponse(
            "invalid_exact_stellar_payload_event_not_transfer",
            fromAddress
          );
        }
        const contractIdHash = event.contractId();
        if (!contractIdHash)
          return invalidVerifyResponse(
            "invalid_exact_stellar_payload_event_missing_contract_id",
            fromAddress
          );
        const eventContractAddress = Address.fromScAddress(
          xdr.ScAddress.scAddressTypeContract(contractIdHash)
        ).toString();
        if (eventContractAddress !== expectedAsset) {
          return invalidVerifyResponse(
            "invalid_exact_stellar_payload_event_wrong_asset",
            fromAddress
          );
        }
        const from = scValToNative(topics[1]);
        const to = scValToNative(topics[2]);
        const amount = scValToNative(body.data());
        transferEvents.push({ from, to, amount });
      } catch (error) {
        if (error instanceof Error) {
          console.error("Error parsing diagnostic event:", error.message);
        } else {
          console.error("Error parsing diagnostic event:", String(error));
        }
        return invalidVerifyResponse("unexpected_verify_error", fromAddress);
      }
    }
    if (transferEvents.length === 0) {
      return invalidVerifyResponse("invalid_exact_stellar_payload_no_transfer_events", fromAddress);
    }
    if (transferEvents.length > 1) {
      return invalidVerifyResponse("invalid_exact_stellar_payload_multiple_transfers", fromAddress);
    }
    const transferEvent = transferEvents[0];
    if (transferEvent.from !== fromAddress) {
      return invalidVerifyResponse("invalid_exact_stellar_payload_event_wrong_from", fromAddress);
    }
    if (transferEvent.to !== toAddress) {
      return invalidVerifyResponse("invalid_exact_stellar_payload_event_wrong_to", fromAddress);
    }
    if (transferEvent.amount !== expectedAmount) {
      return invalidVerifyResponse("invalid_exact_stellar_payload_event_wrong_amount", fromAddress);
    }
    return void 0;
  }
  /**
   * Validates authorization entries: structure, credential type, expiration,
   * facilitator safety, no sub-invocations, and that the payer has signed and
   * no other signatures are pending (per simulation).
   *
   * @param invokeOp - The invoke host function operation
   * @param facilitatorAddresses - Set of all facilitator addresses
   * @param fromAddress - The payer's address (for error reporting)
   * @param maxLedger - The maximum allowed expiration ledger
   * @param transaction - The full transaction (for signature status)
   * @param simResponse - The simulation result (used to interpret auth entry signatures)
   * @returns Invalid VerifyResponse when validation fails
   */
  validateAuthEntries(invokeOp, facilitatorAddresses, fromAddress, maxLedger, transaction, simResponse) {
    if (!invokeOp.auth || invokeOp.auth.length === 0) {
      return invalidVerifyResponse("invalid_exact_stellar_payload_no_auth_entries", fromAddress);
    }
    for (const auth of invokeOp.auth) {
      const credentialsType = auth.credentials().switch();
      if (credentialsType !== xdr.SorobanCredentialsType.sorobanCredentialsAddress()) {
        return invalidVerifyResponse(
          "invalid_exact_stellar_payload_unsupported_credential_type",
          fromAddress
        );
      }
      const addressCredentials = auth.credentials().address();
      const authAddress = Address.fromScAddress(addressCredentials.address()).toString();
      if (facilitatorAddresses.has(authAddress)) {
        return invalidVerifyResponse(
          "invalid_exact_stellar_payload_facilitator_in_auth",
          fromAddress
        );
      }
      const expirationLedger = addressCredentials.signatureExpirationLedger();
      if (expirationLedger > maxLedger + SIGNATURE_EXPIRATION_LEDGER_TOLERANCE) {
        return invalidVerifyResponse(
          "invalid_exact_stellar_signature_expiration_too_far",
          fromAddress
        );
      }
      const rootInvocation = auth.rootInvocation();
      if (rootInvocation.subInvocations().length > 0) {
        return invalidVerifyResponse(
          "invalid_exact_stellar_payload_has_subinvocations",
          fromAddress
        );
      }
    }
    const authStatus = gatherAuthEntrySignatureStatus({
      transaction,
      simulationResponse: simResponse
    });
    if (!authStatus.alreadySigned.includes(fromAddress)) {
      return invalidVerifyResponse(
        "invalid_exact_stellar_payload_missing_payer_signature",
        fromAddress
      );
    }
    if (authStatus.pendingSignature.length > 0) {
      return invalidVerifyResponse(
        "invalid_exact_stellar_payload_unexpected_pending_signatures",
        fromAddress
      );
    }
    return void 0;
  }
};
export {
  ExactStellarScheme
};
//# sourceMappingURL=index.mjs.map