import { describe, it, expect, vi, beforeEach } from "vitest";
import { Env } from "../../src/config/env.js";

describe("Env", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    delete process.env.CORS_ORIGINS;
    delete process.env.PORT;
    delete process.env.LOG_LEVEL;
    delete process.env.FACILITATOR_URL;
    delete process.env.STELLAR_NETWORK;
    delete process.env.STELLAR_RPC_URL;
    delete process.env.PAYMENT_PRICE;
    delete process.env.PAYMENT_DESCRIPTION;
    delete process.env.PAYWALL_DISABLED;
    delete process.env.TRUST_PROXY;
    delete process.env.FACILITATOR_API_KEY;
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv(
      "SERVER_STELLAR_ADDRESS",
      "GTEST000000000000000000000000000000000000000000000000000",
    );
  });

  it("returns default port 3001", () => {
    expect(Env.port).toBe(3001);
  });

  it("reads PORT from env", () => {
    vi.stubEnv("PORT", "8080");
    expect(Env.port).toBe(8080);
  });

  it("throws on invalid PORT", () => {
    vi.stubEnv("PORT", "abc");
    expect(() => Env.port).toThrow("Invalid PORT");
  });

  it("throws on out-of-range PORT", () => {
    vi.stubEnv("PORT", "99999");
    expect(() => Env.port).toThrow("Invalid PORT");
  });

  it("returns default logLevel info", () => {
    expect(Env.logLevel).toBe("info");
  });

  it("throws on invalid logLevel", () => {
    vi.stubEnv("LOG_LEVEL", "verbose");
    expect(() => Env.logLevel).toThrow("Invalid LOG_LEVEL");
  });

  it("throws when SERVER_STELLAR_ADDRESS is missing", () => {
    vi.stubEnv("SERVER_STELLAR_ADDRESS", "");
    expect(() => Env.serverStellarAddress).toThrow("SERVER_STELLAR_ADDRESS is required");
  });

  it("returns defaults for optional fields", () => {
    expect(Env.nodeEnv).toBe("test");
    expect(Env.corsOrigins).toBe("*");
    expect(Env.facilitatorUrl).toBe("http://localhost:4022");
    expect(Env.stellarNetwork).toBe("stellar:testnet");
    expect(Env.paymentPrice).toBe("0.01");
    expect(Env.paymentDescription).toBe("Access to protected content");
  });

  it("paywallDisabled defaults to false when unset", () => {
    expect(Env.paywallDisabled).toBe(false);
  });

  it("paywallDisabled returns true when PAYWALL_DISABLED=true", () => {
    vi.stubEnv("PAYWALL_DISABLED", "true");
    expect(Env.paywallDisabled).toBe(true);
  });

  it("paywallDisabled is case-insensitive", () => {
    vi.stubEnv("PAYWALL_DISABLED", "TRUE");
    expect(Env.paywallDisabled).toBe(true);
  });

  describe("trustProxy", () => {
    it("defaults to loopback, linklocal, uniquelocal", () => {
      expect(Env.trustProxy).toEqual(["loopback", "linklocal", "uniquelocal"]);
    });

    it("reads TRUST_PROXY from env", () => {
      vi.stubEnv("TRUST_PROXY", "127.0.0.1,10.0.0.0/8");
      expect(Env.trustProxy).toEqual(["127.0.0.1", "10.0.0.0/8"]);
    });

    it("trims whitespace from TRUST_PROXY entries", () => {
      vi.stubEnv("TRUST_PROXY", " loopback , linklocal ");
      expect(Env.trustProxy).toEqual(["loopback", "linklocal"]);
    });

    it("filters empty entries from TRUST_PROXY", () => {
      vi.stubEnv("TRUST_PROXY", "loopback,,linklocal");
      expect(Env.trustProxy).toEqual(["loopback", "linklocal"]);
    });
  });

  describe("facilitatorApiKey", () => {
    it("returns undefined when FACILITATOR_API_KEY is not set", () => {
      expect(Env.facilitatorApiKey).toBeUndefined();
    });

    it("returns undefined when FACILITATOR_API_KEY is empty", () => {
      vi.stubEnv("FACILITATOR_API_KEY", "");
      expect(Env.facilitatorApiKey).toBeUndefined();
    });

    it("returns undefined when FACILITATOR_API_KEY is whitespace only", () => {
      vi.stubEnv("FACILITATOR_API_KEY", "   ");
      expect(Env.facilitatorApiKey).toBeUndefined();
    });

    it("returns trimmed value when FACILITATOR_API_KEY is set", () => {
      vi.stubEnv("FACILITATOR_API_KEY", "my-secret-key");
      expect(Env.facilitatorApiKey).toBe("my-secret-key");
    });

    it("trims whitespace from FACILITATOR_API_KEY", () => {
      vi.stubEnv("FACILITATOR_API_KEY", "  my-secret-key  ");
      expect(Env.facilitatorApiKey).toBe("my-secret-key");
    });
  });

  describe("stellarRpcUrl", () => {
    it("defaults to testnet RPC URL", () => {
      expect(Env.stellarRpcUrl).toBe("https://soroban-testnet.stellar.org");
    });

    it("falls back to default for empty string", () => {
      vi.stubEnv("STELLAR_RPC_URL", "");
      expect(Env.stellarRpcUrl).toBe("https://soroban-testnet.stellar.org");
    });

    it("falls back to default for whitespace only", () => {
      vi.stubEnv("STELLAR_RPC_URL", "   ");
      expect(Env.stellarRpcUrl).toBe("https://soroban-testnet.stellar.org");
    });

    it("returns trimmed value when set", () => {
      vi.stubEnv("STELLAR_RPC_URL", "  https://custom-rpc.example.com  ");
      expect(Env.stellarRpcUrl).toBe("https://custom-rpc.example.com");
    });
  });
});
