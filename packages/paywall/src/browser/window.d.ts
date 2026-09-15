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
         * Wallet ids to offer, in order. Omit for every wallet the paywall
         * supports; see `SUPPORTED_WALLET_IDS` in `walletModules.ts`.
         */
        wallets?: string[];
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
