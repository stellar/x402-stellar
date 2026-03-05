import { describe, it, expect, vi, beforeEach } from "vitest";
import { Env } from "../../src/config/env.js";

describe("Env", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    Env.resetCache();
    delete process.env.CORS_ORIGINS;
    delete process.env.PORT;
    delete process.env.LOG_LEVEL;
    delete process.env.PAYMENT_PRICE;
    delete process.env.PAYMENT_DESCRIPTION;
    delete process.env.PAYWALL_DISABLED;
    delete process.env.TRUST_PROXY;
    delete process.env.TESTNET_SERVER_STELLAR_ADDRESS;
    delete process.env.TESTNET_STELLAR_RPC_URL;
    delete process.env.TESTNET_FACILITATOR_URL;
    delete process.env.TESTNET_FACILITATOR_API_KEY;
    delete process.env.MAINNET_SERVER_STELLAR_ADDRESS;
    delete process.env.MAINNET_STELLAR_RPC_URL;
    delete process.env.MAINNET_FACILITATOR_URL;
    delete process.env.MAINNET_FACILITATOR_API_KEY;
    vi.stubEnv("NODE_ENV", "test");
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

  it("returns defaults for optional fields", () => {
    expect(Env.nodeEnv).toBe("test");
    expect(Env.corsOrigins).toBe("*");
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

  describe("network config", () => {
    const VALID_G_ADDR = "GAFIXNT2BFRPI6LLKQHEV7WBMGJ3V6F7HWUE5SYHYC4Q5NMFVSVDOVJT";
    const VALID_G_ADDR_2 = "GBYNMFZCCHST7S7EYBQI5Z3I5DHIQVKN5MOEGEV6QI4GY7JAWCCMG76D";

    it("returns undefined for testnet when TESTNET_SERVER_STELLAR_ADDRESS is unset", () => {
      expect(Env.testnetConfig).toBeUndefined();
    });

    it("returns testnet config with defaults when only address is set", () => {
      vi.stubEnv("TESTNET_SERVER_STELLAR_ADDRESS", VALID_G_ADDR);
      const net = Env.testnetConfig!;
      expect(net.network).toBe("stellar:testnet");
      expect(net.serverStellarAddress).toBe(VALID_G_ADDR);
      expect(net.stellarRpcUrl).toBe("https://soroban-testnet.stellar.org");
      expect(net.facilitatorUrl).toBe("http://localhost:4022");
      expect(net.facilitatorApiKey).toBeUndefined();
    });

    it("reads testnet config overrides from env", () => {
      vi.stubEnv("TESTNET_SERVER_STELLAR_ADDRESS", VALID_G_ADDR);
      vi.stubEnv("TESTNET_STELLAR_RPC_URL", "https://custom-rpc.example.com");
      vi.stubEnv("TESTNET_FACILITATOR_URL", "https://custom-facilitator.example.com");
      vi.stubEnv("TESTNET_FACILITATOR_API_KEY", "my-key");
      const net = Env.testnetConfig!;
      expect(net.stellarRpcUrl).toBe("https://custom-rpc.example.com");
      expect(net.facilitatorUrl).toBe("https://custom-facilitator.example.com");
      expect(net.facilitatorApiKey).toBe("my-key");
    });

    it("returns mainnet config with defaults when only address is set", () => {
      vi.stubEnv("MAINNET_SERVER_STELLAR_ADDRESS", VALID_G_ADDR_2);
      const net = Env.mainnetConfig!;
      expect(net.network).toBe("stellar:pubnet");
      expect(net.serverStellarAddress).toBe(VALID_G_ADDR_2);
      expect(net.stellarRpcUrl).toBe("https://mainnet.sorobanrpc.com");
    });

    it("returns both networks when both addresses are set", () => {
      vi.stubEnv("TESTNET_SERVER_STELLAR_ADDRESS", VALID_G_ADDR);
      vi.stubEnv("MAINNET_SERVER_STELLAR_ADDRESS", VALID_G_ADDR_2);
      const nets = Env.networksConfig;
      expect(nets).toHaveLength(2);
      expect(nets[0].network).toBe("stellar:testnet");
      expect(nets[1].network).toBe("stellar:pubnet");
    });

    it("returns only testnet when only testnet address is set", () => {
      vi.stubEnv("TESTNET_SERVER_STELLAR_ADDRESS", VALID_G_ADDR);
      const nets = Env.networksConfig;
      expect(nets).toHaveLength(1);
      expect(nets[0].network).toBe("stellar:testnet");
    });

    it("throws when no networks are configured and paywall is enabled", () => {
      expect(() => Env.networksConfig).toThrow("At least one network must be configured");
    });

    it("returns empty networks array when paywall is disabled and no networks configured", () => {
      vi.stubEnv("PAYWALL_DISABLED", "true");
      expect(Env.networksConfig).toEqual([]);
    });

    it("returns all RPC URLs from configured networks", () => {
      vi.stubEnv("TESTNET_SERVER_STELLAR_ADDRESS", VALID_G_ADDR);
      vi.stubEnv("MAINNET_SERVER_STELLAR_ADDRESS", VALID_G_ADDR_2);
      expect(Env.allStellarRpcUrls).toEqual([
        "https://soroban-testnet.stellar.org",
        "https://mainnet.sorobanrpc.com",
      ]);
    });

    it("trims whitespace from TESTNET_FACILITATOR_API_KEY", () => {
      vi.stubEnv("TESTNET_SERVER_STELLAR_ADDRESS", VALID_G_ADDR);
      vi.stubEnv("TESTNET_FACILITATOR_API_KEY", "  my-secret-key  ");
      expect(Env.testnetConfig!.facilitatorApiKey).toBe("my-secret-key");
    });

    it("returns undefined for empty TESTNET_FACILITATOR_API_KEY", () => {
      vi.stubEnv("TESTNET_SERVER_STELLAR_ADDRESS", VALID_G_ADDR);
      vi.stubEnv("TESTNET_FACILITATOR_API_KEY", "");
      expect(Env.testnetConfig!.facilitatorApiKey).toBeUndefined();
    });

    it("returns undefined for whitespace-only TESTNET_FACILITATOR_API_KEY", () => {
      vi.stubEnv("TESTNET_SERVER_STELLAR_ADDRESS", VALID_G_ADDR);
      vi.stubEnv("TESTNET_FACILITATOR_API_KEY", "   ");
      expect(Env.testnetConfig!.facilitatorApiKey).toBeUndefined();
    });

    it("throws on invalid TESTNET_SERVER_STELLAR_ADDRESS", () => {
      vi.stubEnv("TESTNET_SERVER_STELLAR_ADDRESS", "INVALID");
      expect(() => Env.testnetConfig).toThrow("Invalid TESTNET_SERVER_STELLAR_ADDRESS");
    });

    it("throws on invalid MAINNET_SERVER_STELLAR_ADDRESS", () => {
      vi.stubEnv("MAINNET_SERVER_STELLAR_ADDRESS", "NOT_A_REAL_KEY");
      expect(() => Env.mainnetConfig).toThrow("Invalid MAINNET_SERVER_STELLAR_ADDRESS");
    });

    it("accepts a valid C-account (contract) address", () => {
      const contractAddr = "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
      vi.stubEnv("TESTNET_SERVER_STELLAR_ADDRESS", contractAddr);
      expect(Env.testnetConfig!.serverStellarAddress).toBe(contractAddr);
    });

    it("accepts a valid M-account (muxed) address", () => {
      const muxedAddr = "MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
      vi.stubEnv("TESTNET_SERVER_STELLAR_ADDRESS", muxedAddr);
      expect(Env.testnetConfig!.serverStellarAddress).toBe(muxedAddr);
    });
  });
});
