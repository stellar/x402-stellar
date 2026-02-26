// src/shared.ts
import { Address, xdr } from "@stellar/stellar-sdk";
import { Api, assembleTransaction } from "@stellar/stellar-sdk/rpc";
function handleSimulationResult(simulation) {
  if (!simulation) {
    throw new Error("Simulation result is undefined");
  }
  if (Api.isSimulationRestore(simulation)) {
    throw new Error(
      `Stellar simulation result has type "RESTORE" with restorePreamble: ${simulation.restorePreamble}`
    );
  }
  if (Api.isSimulationError(simulation)) {
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
    const assembledTxBuilder = assembleTransaction(transaction, simulationResponse);
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
    if (credentialsType === xdr.SorobanCredentialsType.sorobanCredentialsSourceAccount()) {
      continue;
    }
    if (credentialsType === xdr.SorobanCredentialsType.sorobanCredentialsAddress()) {
      const addressCredentials = entry.credentials().address();
      const address = Address.fromScAddress(addressCredentials.address()).toString();
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

export {
  handleSimulationResult,
  gatherAuthEntrySignatureStatus
};
//# sourceMappingURL=chunk-4HPDVFME.mjs.map