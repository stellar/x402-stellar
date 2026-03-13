import type { RequestHandler } from "express";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { ExactStellarScheme } from "@x402/stellar/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { createPaywall } from "@x402-stellar/paywall";
import { stellarPaywall } from "@x402-stellar/paywall/stellar";
import { type NetworkConfig, NETWORK_META, Env, parseFacilitatorApiKeys } from "../config/env.js";
import { logger } from "../utils/logger.js";

export interface NetworkMiddleware {
  network: string;
  routePath: string;
  handler: RequestHandler;
}

interface ServerComponents {
  facilitatorClient: HTTPFacilitatorClient;
  x402Server: x402ResourceServer;
}

/**
 * Returns a selector that cycles through the configured facilitator API keys.
 *
 * @param commaSeparatedKeys - Raw FACILITATOR_API_KEY env value, allowing multiple comma-separated keys.
 * @returns A function that returns the next key on each call.
 * @throws Error when the input does not contain at least one non-empty key.
 */
export function createRoundRobinKeySelector(commaSeparatedKeys: string): () => string {
  const keys = parseFacilitatorApiKeys(commaSeparatedKeys);
  if (keys.length === 0) {
    throw new Error("FACILITATOR_API_KEY must contain at least one non-empty key");
  }

  let index = 0;
  return () => {
    const pos = index;
    index = (index + 1) % keys.length;
    logger.debug({ keyIndex: pos }, "Selecting API key");
    return keys[pos];
  };
}

function buildServerComponents(netConfig: NetworkConfig): ServerComponents {
  const getNextKey = netConfig.facilitatorApiKey
    ? createRoundRobinKeySelector(netConfig.facilitatorApiKey)
    : undefined;

  const facilitatorClient = new HTTPFacilitatorClient({
    url: netConfig.facilitatorUrl,
    createAuthHeaders: getNextKey
      ? async () => {
          const headers = { Authorization: `Bearer ${getNextKey()}` };
          return { verify: headers, settle: headers, supported: headers };
        }
      : undefined,
  });

  const x402Server = new x402ResourceServer(facilitatorClient).register(
    netConfig.network,
    new ExactStellarScheme(),
  );

  return { facilitatorClient, x402Server };
}

function buildMiddleware(netConfig: NetworkConfig): NetworkMiddleware {
  const { x402Server } = buildServerComponents(netConfig);

  const paywall = createPaywall()
    .withNetwork(stellarPaywall)
    .withConfig({
      appName: "Simple Paywall Demo",
      stellarRpcUrl: netConfig.stellarRpcUrl,
    })
    .build();

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
    x402Server,
    undefined,
    paywall,
    true,
  );

  return { network: netConfig.network, routePath, handler };
}

function buildApiMiddleware(netConfig: NetworkConfig): NetworkMiddleware {
  const { x402Server } = buildServerComponents(netConfig);

  const { routeSuffix } = NETWORK_META[netConfig.network];
  const routePath = `/weather/${routeSuffix}`;

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
        description: "Weather forecast API",
      },
    },
    x402Server,
    undefined,
    undefined,
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
