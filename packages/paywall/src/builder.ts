import type {
  PaywallConfig,
  PaywallProvider,
  PaywallNetworkHandler,
  PaymentRequired,
} from "./types.js";

export class PaywallBuilder {
  private config: PaywallConfig = {};
  private handlers: PaywallNetworkHandler[] = [];

  withNetwork(handler: PaywallNetworkHandler): this {
    this.handlers.push(handler);
    return this;
  }

  withConfig(config: PaywallConfig): this {
    this.config = { ...this.config, ...config };
    return this;
  }

  build(): PaywallProvider {
    const builderConfig = this.config;
    const handlers = [...this.handlers];

    return {
      generateHtml: (paymentRequired: PaymentRequired, runtimeConfig?: PaywallConfig): string => {
        const finalConfig = { ...builderConfig, ...runtimeConfig };

        if (handlers.length === 0) {
          throw new Error(
            "No paywall handlers registered. Use .withNetwork(stellarPaywall) to register a handler.",
          );
        }

        for (const requirement of paymentRequired.accepts) {
          const handler = handlers.find((h) => h.supports(requirement));
          if (handler) {
            return handler.generateHtml(requirement, paymentRequired, finalConfig);
          }
        }

        const networks = paymentRequired.accepts.map((r) => r.network).join(", ");
        throw new Error(
          `No paywall handler supports networks: ${networks}. Register appropriate handlers with .withNetwork()`,
        );
      },
    };
  }
}

export function createPaywall(): PaywallBuilder {
  return new PaywallBuilder();
}
