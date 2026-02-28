/**
 * Paywall types — compatible with @x402/core's PaywallProvider and PaywallConfig.
 *
 * We re-declare them here so this package has zero coupling to @x402/core at the
 * type level. The structural typing in TypeScript means our PaywallProvider is
 * assignable to @x402/core's PaywallProvider without an explicit import.
 */

export interface PaywallConfig {
  appName?: string;
  appLogo?: string;
  currentUrl?: string;
  testnet?: boolean;
}

export interface PaymentRequirements {
  scheme: string;
  network: string;
  asset: string;
  payTo: string;
  maxTimeoutSeconds: number;
  extra?: Record<string, unknown>;
  maxAmountRequired?: string;
  description?: string;
  resource?: string;
  mimeType?: string;
  amount?: string;
}

export interface PaymentRequired {
  x402Version: number;
  error?: string;
  resource?: {
    url: string;
    description: string;
    mimeType: string;
  };
  accepts: PaymentRequirements[];
  extensions?: Record<string, unknown>;
}

export interface PaywallProvider {
  generateHtml(paymentRequired: PaymentRequired, config?: PaywallConfig): string;
}

export interface PaywallNetworkHandler {
  supports(requirement: PaymentRequirements): boolean;
  generateHtml(
    requirement: PaymentRequirements,
    paymentRequired: PaymentRequired,
    config: PaywallConfig,
  ): string;
}
