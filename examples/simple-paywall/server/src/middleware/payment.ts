import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { ExactStellarScheme } from "@x402/stellar/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { createPaywall } from "@x402-stellar/paywall";
import { stellarPaywall } from "@x402-stellar/paywall/stellar";
import { Env } from "../config/env.js";

export function createPaymentMiddleware() {
  const facilitatorClient = new HTTPFacilitatorClient({
    url: Env.facilitatorUrl,
    createAuthHeaders: Env.facilitatorApiKey
      ? async () => {
          const headers = { Authorization: `Bearer ${Env.facilitatorApiKey}` };
          return { verify: headers, settle: headers, supported: headers };
        }
      : undefined,
  });
  const paywall = createPaywall()
    .withNetwork(stellarPaywall)
    .withConfig({ appName: "Simple Paywall Demo" })
    .build();

  const server = new x402ResourceServer(facilitatorClient).register(
    Env.stellarNetwork,
    new ExactStellarScheme(),
  );

  return paymentMiddleware(
    {
      "GET /protected": {
        accepts: [
          {
            scheme: "exact",
            price: Env.paymentPrice,
            network: Env.stellarNetwork,
            payTo: Env.serverStellarAddress,
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
}
