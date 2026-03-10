import { describe, it, expect, vi, beforeAll, beforeEach, type Mock } from "vitest";
import request from "supertest";
import type { Express } from "express";

vi.mock("../../src/middleware/payment.js", () => ({
  createPaymentMiddlewares: () => [],
  createApiPaymentMiddlewares: () => {
    const makeMock = (network: string, routeSuffix: string) => ({
      network,
      routePath: `/weather/${routeSuffix}`,
      handler: (
        req: { path: string; method: string },
        res: {
          status: (code: number) => { json: (b: unknown) => void };
        },
        next: () => void,
      ) => {
        if (req.path === `/weather/${routeSuffix}` && req.method === "GET") {
          res.status(402).json({
            x402Version: 2,
            error: "Payment required",
            accepts: [],
          });
          return;
        }
        next();
      },
    });
    return [makeMock("stellar:testnet", "testnet"), makeMock("stellar:pubnet", "mainnet")];
  },
}));

vi.mock("../../src/utils/logger.js", () => {
  const noop = () => {};
  const noopLogger = {
    info: noop,
    error: noop,
    warn: noop,
    debug: noop,
    trace: noop,
    fatal: noop,
    flush: noop,
    child: () => noopLogger,
  };
  return {
    logger: noopLogger,
    httpLogger: (_req: unknown, _res: unknown, next: () => void) => next(),
  };
});

const GEOCODE_SF = {
  results: [
    {
      name: "San Francisco",
      latitude: 37.77493,
      longitude: -122.41942,
      country: "United States",
      admin1: "California",
    },
  ],
};

const FORECAST_SF = {
  current: {
    temperature_2m: 62.3,
    relative_humidity_2m: 55,
    weather_code: 2,
    wind_speed_10m: 11.5,
  },
};

let app: Express;
let fetchSpy: Mock;

beforeAll(async () => {
  vi.stubEnv(
    "TESTNET_SERVER_STELLAR_ADDRESS",
    "GAJUGVETJ4NQIG64OQNLNL6KHXYQ46MFWBCXFIUMACK4MTOOTRYJN2KV",
  );
  vi.stubEnv("TESTNET_FACILITATOR_URL", "http://localhost:4022");
  vi.stubEnv(
    "MAINNET_SERVER_STELLAR_ADDRESS",
    "GBZOAILBLWURMYNMVFITJJBKXSKHV4MLLZ4I57K5RY3VP3JAF7FTCGF6",
  );
  vi.stubEnv("MAINNET_FACILITATOR_URL", "http://localhost:4022");
  vi.stubEnv("MAINNET_STELLAR_RPC_URL", "https://mainnet.sorobanrpc.com");
  const { createApp } = await import("../../src/app.js");
  app = createApp();
});

beforeEach(() => {
  fetchSpy = vi.fn();
  vi.stubGlobal("fetch", fetchSpy);
});

function mockFetchResponses(geocodeBody: unknown, forecastBody: unknown) {
  fetchSpy.mockImplementation((url: string) => {
    if (url.includes("geocoding-api.open-meteo.com")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(geocodeBody) });
    }
    if (url.includes("api.open-meteo.com")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(forecastBody) });
    }
    return Promise.resolve({ ok: false });
  });
}

describe("GET /weather/:network", () => {
  it("returns 402 for testnet when paywall is active", async () => {
    const res = await request(app).get("/weather/testnet?city=London");

    expect(res.status).toBe(402);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 402 for mainnet when paywall is active", async () => {
    const res = await request(app).get("/weather/mainnet?city=London");

    expect(res.status).toBe(402);
    expect(res.body).toHaveProperty("error");
  });

  it("returns JSON (not HTML) for 402 responses", async () => {
    const res = await request(app)
      .get("/weather/testnet?city=London")
      .set("Accept", "text/html,application/json");

    expect(res.status).toBe(402);
    expect(res.type).toMatch(/json/);
  });

  it("returns 404 for invalid network suffix", async () => {
    const res = await request(app).get("/weather/fakenet?city=London");

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });
});

describe("GET /weather/:network (paywall disabled)", () => {
  let disabledApp: Express;

  beforeAll(async () => {
    vi.stubEnv("PAYWALL_DISABLED", "true");
    const { Env } = await import("../../src/config/env.js");
    Env.resetCache();
    const { createApp } = await import("../../src/app.js");
    disabledApp = createApp();
  });

  it("returns 200 with weather data from Open-Meteo", async () => {
    mockFetchResponses(GEOCODE_SF, FORECAST_SF);

    const res = await request(disabledApp).get("/weather/testnet?city=San+Francisco");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("city", "San Francisco");
    expect(res.body).toHaveProperty("region", "California");
    expect(res.body).toHaveProperty("country", "United States");
    expect(res.body).toHaveProperty("coordinates");
    expect(res.body.current).toMatchObject({
      weather: "partly cloudy",
      weather_code: 2,
      temperature_f: 62.3,
      humidity_pct: 55,
      wind_speed_mph: 11.5,
    });
    expect(res.body).toHaveProperty("timestamp");
  });

  it("returns 400 when city parameter is missing", async () => {
    const res = await request(disabledApp).get("/weather/testnet");

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/city/i);
  });

  it("returns 404 when city is not found by geocoder", async () => {
    mockFetchResponses({ results: [] }, null);

    const res = await request(disabledApp).get("/weather/testnet?city=Atlantis");

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  it("returns 502 when forecast API fails", async () => {
    fetchSpy.mockImplementation((url: string) => {
      if (url.includes("geocoding-api.open-meteo.com")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(GEOCODE_SF) });
      }
      return Promise.resolve({ ok: false });
    });

    const res = await request(disabledApp).get("/weather/testnet?city=San+Francisco");

    expect(res.status).toBe(502);
    expect(res.body.error).toMatch(/upstream/i);
  });

  it("returns 502 when geocoding API fails", async () => {
    fetchSpy.mockImplementation(() => Promise.resolve({ ok: false }));

    const res = await request(disabledApp).get("/weather/testnet?city=San+Francisco");

    expect(res.status).toBe(404);
  });

  it("handles unknown WMO weather codes gracefully", async () => {
    const unknownCodeForecast = {
      current: { ...FORECAST_SF.current, weather_code: 999 },
    };
    mockFetchResponses(GEOCODE_SF, unknownCodeForecast);

    const res = await request(disabledApp).get("/weather/testnet?city=San+Francisco");

    expect(res.status).toBe(200);
    expect(res.body.current.weather).toMatch(/unknown/i);
  });
});
