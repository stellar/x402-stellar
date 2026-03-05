import type { RequestHandler } from "express";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { ExactStellarScheme } from "@x402/stellar/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { createPaywall } from "@x402-stellar/paywall";
import { stellarPaywall } from "@x402-stellar/paywall/stellar";
import { type NetworkConfig, NETWORK_META, Env } from "../config/env.js";

export interface NetworkMiddleware {
  network: string;
  routePath: string;
  handler: RequestHandler;
}

function buildMiddleware(netConfig: NetworkConfig): NetworkMiddleware {
  const facilitatorClient = new HTTPFacilitatorClient({
    url: netConfig.facilitatorUrl,
    createAuthHeaders: netConfig.facilitatorApiKey
      ? async () => {
          const headers = { Authorization: `Bearer ${netConfig.facilitatorApiKey}` };
          return { verify: headers, settle: headers, supported: headers };
        }
      : undefined,
  });

  const paywall = createPaywall()
    .withNetwork(stellarPaywall)
    .withConfig({
      appName: "Simple Paywall Demo",
      stellarRpcUrl: netConfig.stellarRpcUrl,
    })
    .build();

  const server = new x402ResourceServer(facilitatorClient).register(
    netConfig.network,
    new ExactStellarScheme(),
  );

  const { routeSuffix } = NETWORK_META[netConfig.network];
  const routePath = `/protected/${routeSuffix}`;

  const handler = paymentMiddleware(
    {
      [`GET ${routePath}`]: {
        accepts: [
          {
            scheme: "exact",
            price: Env.paymentPrice,
            network: netConfig.network,
            payTo: netConfig.serverStellarAddress,
          },
        ],
        description: Env.paymentDescription,
      },
    },
    server,
    undefined,
    paywall,
    true,
  );

  return { network: netConfig.network, routePath, handler };
}

export function createPaymentMiddlewares(): NetworkMiddleware[] {
  return Env.networksConfig.map(buildMiddleware);
}
