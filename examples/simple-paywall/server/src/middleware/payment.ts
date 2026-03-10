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

function buildFacilitatorClient(netConfig: NetworkConfig) {
  return new HTTPFacilitatorClient({
    url: netConfig.facilitatorUrl,
    createAuthHeaders: netConfig.facilitatorApiKey
      ? async () => {
          const headers = { Authorization: `Bearer ${netConfig.facilitatorApiKey}` };
          return { verify: headers, settle: headers, supported: headers };
        }
      : undefined,
  });
}

/** HTML paywall route: /protected/:network — serves the browser wallet UI on 402. */
function buildMiddleware(netConfig: NetworkConfig): NetworkMiddleware {
  const facilitatorClient = buildFacilitatorClient(netConfig);

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

/** API route: /api/protected/:network — returns JSON 402 (no HTML paywall). */
function buildApiMiddleware(netConfig: NetworkConfig): NetworkMiddleware {
  const facilitatorClient = buildFacilitatorClient(netConfig);

  const server = new x402ResourceServer(facilitatorClient).register(
    netConfig.network,
    new ExactStellarScheme(),
  );

  const { routeSuffix } = NETWORK_META[netConfig.network];
  const routePath = `/api/protected/${routeSuffix}`;

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
    undefined, // no HTML paywall — JSON 402 responses
    true,
  );

  return { network: netConfig.network, routePath, handler };
}

export function createPaymentMiddlewares(): NetworkMiddleware[] {
  return Env.networksConfig.map(buildMiddleware);
}

export function createApiPaymentMiddlewares(): NetworkMiddleware[] {
  return Env.networksConfig.map(buildApiMiddleware);
}
