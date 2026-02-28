import { useCallback, useState } from "react";
import { ExactStellarScheme } from "@x402/stellar/exact/client";
import { x402Client } from "@x402/core/client";
import type { ClientStellarSigner } from "@x402/stellar";
import type { PaymentRequired } from "@x402/core/types";
import { statusError, statusInfo, statusSuccess, type Status } from "./status";

export type UseStellarPaymentParams = {
  paymentRequired: PaymentRequired;
  walletSigner: ClientStellarSigner | null;
  setStatus: (status: Status | null) => void;
  onSuccessfulResponse: (response: Response) => Promise<void>;
};

export type UseStellarPaymentResult = {
  isPaying: boolean;
  submitPayment: () => Promise<void>;
};

/**
 * Handles Stellar payment submission.
 *
 * @param params - Hook parameters.
 * @param params.paymentRequired - Payment required response with accepts array.
 * @param params.walletSigner - The signer responsible for Stellar signatures.
 * @param params.onSuccessfulResponse - Callback invoked once paywall returns success.
 * @param params.setStatus - UI status setter used for toast-like messages.
 * @returns Handlers to trigger payments and the current loading state.
 */
export function useStellarPayment(params: UseStellarPaymentParams): UseStellarPaymentResult {
  const { walletSigner, paymentRequired, onSuccessfulResponse, setStatus } = params;
  const [isPaying, setIsPaying] = useState(false);

  const x402 = window.x402;

  const submitPayment = useCallback(async () => {
    if (!x402 || !walletSigner || !paymentRequired) {
      setStatus(statusError("Unable to submit Stellar payment; wallet or config missing."));
      return;
    }

    setIsPaying(true);
    try {
      setStatus(statusInfo("Waiting for user signature..."));

      const client = new x402Client();
      client.register("stellar:*", new ExactStellarScheme(walletSigner));

      const paymentPayload = await client.createPaymentPayload(paymentRequired);

      const paymentHeader = btoa(JSON.stringify(paymentPayload));

      setStatus(statusInfo("Settling payment..."));
      const response = await fetch(x402.currentUrl, {
        headers: {
          "PAYMENT-SIGNATURE": paymentHeader,
          "Access-Control-Expose-Headers": "PAYMENT-RESPONSE",
        },
      });

      if (response.ok) {
        setStatus(statusSuccess("Payment successful! Loading content..."));
        await onSuccessfulResponse(response);
        return;
      }

      if (response.status === 402) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData && typeof errorData.x402Version === "number") {
          setStatus(statusInfo("Retrying payment..."));

          const retryPayload = await client.createPaymentPayload(paymentRequired);
          const retryHeader = btoa(JSON.stringify(retryPayload));

          const retryResponse = await fetch(x402.currentUrl, {
            headers: {
              "PAYMENT-SIGNATURE": retryHeader,
              "Access-Control-Expose-Headers": "PAYMENT-RESPONSE",
            },
          });

          if (retryResponse.ok) {
            setStatus(statusSuccess("Payment successful! Loading content..."));
            await onSuccessfulResponse(retryResponse);
            return;
          }

          throw new Error(
            `Payment retry failed: ${retryResponse.status} ${retryResponse.statusText}`,
          );
        }

        throw new Error(`Payment failed: ${response.statusText}`);
      }

      throw new Error(`Payment failed: ${response.status} ${response.statusText}`);
    } catch (error) {
      setStatus(statusError(error instanceof Error ? error.message : "Payment failed."));
    } finally {
      setIsPaying(false);
    }
  }, [walletSigner, x402, paymentRequired, onSuccessfulResponse, setStatus]);

  return { isPaying, submitPayment };
}
