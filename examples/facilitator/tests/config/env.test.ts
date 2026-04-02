import { describe, it, expect, vi, beforeEach } from "vitest";
import { Keypair } from "@stellar/stellar-sdk";
import { Env } from "../../src/config/env.js";

describe("Env", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    delete process.env.PORT;
    delete process.env.LOG_LEVEL;
    delete process.env.CORS_ORIGINS;
    delete process.env.STELLAR_NETWORK;
    delete process.env.STELLAR_RPC_URL;
    delete process.env.TRUST_PROXY;
    delete process.env.FACILITATOR_STELLAR_FEE_BUMP_SECRET;
    delete process.env.FACILITATOR_STELLAR_CHANNEL_SECRETS;
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("FACILITATOR_STELLAR_PRIVATE_KEY", Keypair.random().secret());
  });

  it("returns default port 4022", () => {
    expect(Env.port).toBe(4022);
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

  it("throws when FACILITATOR_STELLAR_PRIVATE_KEY is missing", () => {
    vi.stubEnv("FACILITATOR_STELLAR_PRIVATE_KEY", "");
    expect(() => Env.stellarPrivateKey).toThrow("FACILITATOR_STELLAR_PRIVATE_KEY is required");
  });

  it("returns defaults for optional fields", () => {
    expect(Env.nodeEnv).toBe("test");
    expect(Env.corsOrigins).toBe("*");
    expect(Env.stellarNetwork).toBe("stellar:testnet");
  });

  describe("trustProxy", () => {
    it("defaults to loopback, linklocal, uniquelocal", () => {
      expect(Env.trustProxy).toEqual(["loopback", "linklocal", "uniquelocal"]);
    });

    it("reads TRUST_PROXY from env", () => {
      vi.stubEnv("TRUST_PROXY", "127.0.0.1,10.0.0.0/8");
      expect(Env.trustProxy).toEqual(["127.0.0.1", "10.0.0.0/8"]);
    });

    it("trims whitespace from entries", () => {
      vi.stubEnv("TRUST_PROXY", " loopback , linklocal ");
      expect(Env.trustProxy).toEqual(["loopback", "linklocal"]);
    });
  });

  describe("corsOrigins", () => {
    it("defaults to wildcard", () => {
      expect(Env.corsOrigins).toBe("*");
    });

    it("splits comma-separated origins", () => {
      vi.stubEnv("CORS_ORIGINS", "http://localhost:3001,http://localhost:5173");
      expect(Env.corsOrigins).toEqual(["http://localhost:3001", "http://localhost:5173"]);
    });

    // BUG-005: whitespace in CORS_ORIGINS must be trimmed
    it("trims whitespace from CORS_ORIGINS entries", () => {
      vi.stubEnv("CORS_ORIGINS", "http://app.example.com, http://admin.example.com");
      expect(Env.corsOrigins).toEqual(["http://app.example.com", "http://admin.example.com"]);
    });

    it("filters empty entries from CORS_ORIGINS", () => {
      vi.stubEnv("CORS_ORIGINS", "http://app.example.com,,http://admin.example.com,");
      expect(Env.corsOrigins).toEqual(["http://app.example.com", "http://admin.example.com"]);
    });
  });

  describe("feeBumpSecret", () => {
    it("returns undefined when not set", () => {
      expect(Env.feeBumpSecret).toBeUndefined();
    });

    it("returns undefined for empty string", () => {
      vi.stubEnv("FACILITATOR_STELLAR_FEE_BUMP_SECRET", "");
      expect(Env.feeBumpSecret).toBeUndefined();
    });

    it("returns the secret when set", () => {
      vi.stubEnv("FACILITATOR_STELLAR_FEE_BUMP_SECRET", "SABC123");
      expect(Env.feeBumpSecret).toBe("SABC123");
    });
  });

  describe("channelSecrets", () => {
    it("returns undefined when not set", () => {
      expect(Env.channelSecrets).toBeUndefined();
    });

    it("returns undefined for empty string", () => {
      vi.stubEnv("FACILITATOR_STELLAR_CHANNEL_SECRETS", "");
      expect(Env.channelSecrets).toBeUndefined();
    });

    it("splits comma-separated secrets", () => {
      vi.stubEnv("FACILITATOR_STELLAR_CHANNEL_SECRETS", "SABC,SDEF,SGHI");
      expect(Env.channelSecrets).toEqual(["SABC", "SDEF", "SGHI"]);
    });

    it("trims whitespace from secrets", () => {
      vi.stubEnv("FACILITATOR_STELLAR_CHANNEL_SECRETS", " SABC , SDEF ");
      expect(Env.channelSecrets).toEqual(["SABC", "SDEF"]);
    });

    it("filters out empty entries", () => {
      vi.stubEnv("FACILITATOR_STELLAR_CHANNEL_SECRETS", "SABC,,SDEF,");
      expect(Env.channelSecrets).toEqual(["SABC", "SDEF"]);
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
