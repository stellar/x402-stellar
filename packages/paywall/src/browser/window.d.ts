import type { PaymentRequired } from "@x402/core/types";

declare global {
  interface Window {
    x402: {
      amount?: number;
      testnet?: boolean;
      paymentRequired: PaymentRequired;
      currentUrl?: string;
      appName?: string;
      appLogo?: string;
      config: {
        rpcUrl?: string;
        /**
         * How long the payment receipt stays up before the paid content is
         * loaded. `0` skips the receipt and hands off immediately.
         */
        receiptDelayMs?: number;
        chainConfig: Record<
          string,
          {
            usdcAddress: string;
            usdcName: string;
          }
        >;
      };
    };
  }
}
