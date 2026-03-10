import { useCallback, useState } from "react";
import { ExactStellarScheme } from "@x402/stellar/exact/client";
import { x402Client } from "@x402/core/client";
import { encodePaymentSignatureHeader } from "@x402/core/http";
import type { ClientStellarSigner } from "@x402/stellar";
import type { PaymentRequired } from "@x402/core/types";
import { statusError, statusInfo, statusSuccess, type Status } from "./status";
import { resolvePaymentTargetUrl } from "./paymentTargetUrl";
import { formatPaymentError } from "./formatPaymentError";

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
  const runtimeRpcUrl = x402?.config?.rpcUrl;

  const submitPayment = useCallback(async () => {
    if (!x402 || !walletSigner || !paymentRequired) {
      setStatus(statusError("Unable to submit Stellar payment; wallet or config missing."));
      return;
    }

    setIsPaying(true);
    try {
      setStatus(statusInfo("Waiting for user signature..."));

      const client = new x402Client();
      client.register("stellar:*", new ExactStellarScheme(walletSigner, { url: runtimeRpcUrl }));

      const paymentPayload = await client.createPaymentPayload(paymentRequired);

      const paymentHeader = encodePaymentSignatureHeader(paymentPayload);

      setStatus(statusInfo("Settling payment..."));
      const targetUrl = resolvePaymentTargetUrl(window.location.href, x402.currentUrl);
      const response = await fetch(targetUrl, {
        headers: {
          "PAYMENT-SIGNATURE": paymentHeader,
        },
      });

      if (response.ok) {
        setStatus(statusSuccess("Payment successful! Loading content..."));
        await onSuccessfulResponse(response);
        return;
      }

      const responseBody = await response.text().catch(() => "");
      let parsedBody: Record<string, unknown> | null = null;
      try {
        parsedBody = JSON.parse(responseBody) as Record<string, unknown>;
      } catch (_notJson) {}

      if (response.status === 402) {
        if (parsedBody && typeof parsedBody.x402Version === "number") {
          setStatus(statusInfo("Retrying payment..."));

          const retryPayload = await client.createPaymentPayload(paymentRequired);
          const retryHeader = encodePaymentSignatureHeader(retryPayload);

          const retryResponse = await fetch(targetUrl, {
            headers: {
              "PAYMENT-SIGNATURE": retryHeader,
            },
          });

          if (retryResponse.ok) {
            setStatus(statusSuccess("Payment successful! Loading content..."));
            await onSuccessfulResponse(retryResponse);
            return;
          }

          const retryBody = await retryResponse.text().catch(() => "");
          throw new Error(
            formatPaymentError("Payment retry failed", retryResponse.status, retryBody),
          );
        }

        throw new Error(
          formatPaymentError(
            "Payment required but settlement failed",
            response.status,
            responseBody,
          ),
        );
      }

      throw new Error(
        formatPaymentError("Payment request rejected", response.status, responseBody),
      );
    } catch (error) {
      setStatus(statusError(error instanceof Error ? error.message : "Payment failed."));
    } finally {
      setIsPaying(false);
    }
  }, [walletSigner, x402, paymentRequired, onSuccessfulResponse, setStatus, runtimeRpcUrl]);

  return { isPaying, submitPayment };
}
