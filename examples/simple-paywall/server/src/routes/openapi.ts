import { Router, type Router as RouterType } from "express";
import { Env, NETWORK_META, type StellarNetwork } from "../config/env.js";

const router: RouterType = Router();

const ASSET_ID: Record<StellarNetwork, string> = {
  "stellar:testnet": "stellar:testnet/CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",
  "stellar:pubnet": "stellar:pubnet/CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75",
};

/**
 * Build an OpenAPI 3.1.0 spec dynamically based on configured networks.
 *
 * Per x402scan discovery spec (https://www.x402scan.com/discovery), each paid
 * operation MUST include:
 *   - `x-payment-info` with `protocols`, `pricingMode`, and `price`
 *   - A `402` response entry
 */
function buildSpec(): Record<string, unknown> {
  const paths: Record<string, unknown> = {};

  if (!Env.paywallDisabled) {
    for (const netConfig of Env.networksConfig) {
      const { routeSuffix, displayName } = NETWORK_META[netConfig.network];
      const path = `/weather/${routeSuffix}`;

      paths[path] = {
        get: {
          summary: `Get current weather (${displayName})`,
          description:
            `Returns current weather data for a city. Requires x402 payment on Stellar ${displayName}. ` +
            `The city name must be provided as a query parameter.`,
          operationId: `getWeather${displayName}`,
          parameters: [
            {
              name: "city",
              in: "query",
              required: true,
              description: 'City name to look up (e.g. "San Francisco", "London")',
              schema: { type: "string" },
            },
          ],
          "x-payment-info": {
            protocols: ["x402"],
            pricingMode: "fixed",
            price: Env.paymentPrice,
            network: netConfig.network,
            asset: ASSET_ID[netConfig.network],
          },
          responses: {
            "200": {
              description: "Current weather data",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      city: { type: "string", example: "San Francisco" },
                      region: { type: ["string", "null"], example: "California" },
                      country: { type: "string", example: "United States" },
                      coordinates: {
                        type: "object",
                        properties: {
                          latitude: { type: "number", example: 37.7749 },
                          longitude: { type: "number", example: -122.4194 },
                        },
                      },
                      current: {
                        type: "object",
                        properties: {
                          weather: { type: "string", example: "partly cloudy" },
                          weather_code: { type: "integer", example: 2 },
                          temperature_f: { type: "number", example: 62.3 },
                          humidity_pct: { type: "number", example: 72 },
                          wind_speed_mph: { type: "number", example: 8.5 },
                        },
                      },
                      timestamp: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
            "400": { description: "Missing required query parameter: city" },
            "402": {
              description: "Payment Required — x402 payment needed to access this resource",
            },
            "404": { description: "City not found or network not configured" },
            "502": { description: "Upstream weather service unavailable" },
          },
        },
      };
    }
  }

  return {
    openapi: "3.1.0",
    info: {
      title: "x402 Stellar Weather API",
      version: "1.0.0",
      description:
        "Pay-per-request weather API demonstrating the x402 protocol on Stellar. " +
        "Each endpoint requires a micro-payment in USDC on the corresponding Stellar network.",
    },
    paths,
  };
}

router.get("/openapi.json", (_req, res) => {
  res.json(buildSpec());
});

export { router as openapiRouter };
