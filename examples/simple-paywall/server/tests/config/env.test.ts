import { describe, it, expect, vi, beforeEach } from "vitest";
import { Env, maskFacilitatorApiKey, parseFacilitatorApiKeys } from "../../src/config/env.js";

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
    delete process.env.SERVER_BASE_ROUTE;
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
    expect(Env.corsOrigins).toEqual(["http://localhost:5173"]);
    expect(Env.paymentPrice).toBe("0.01");
    expect(Env.paymentDescription).toBe("Access to protected content");
  });

  // PAYMENT_PRICE must be a valid positive number
  it("throws on non-numeric PAYMENT_PRICE", () => {
    vi.stubEnv("PAYMENT_PRICE", "abc");
    expect(() => Env.paymentPrice).toThrow("Invalid PAYMENT_PRICE");
  });

  it("throws on zero PAYMENT_PRICE", () => {
    vi.stubEnv("PAYMENT_PRICE", "0");
    expect(() => Env.paymentPrice).toThrow("Invalid PAYMENT_PRICE");
  });

  it("throws on negative PAYMENT_PRICE", () => {
    vi.stubEnv("PAYMENT_PRICE", "-5");
    expect(() => Env.paymentPrice).toThrow("Invalid PAYMENT_PRICE");
  });

  it("throws on Infinity PAYMENT_PRICE (e.g. 1e999)", () => {
    vi.stubEnv("PAYMENT_PRICE", "1e999");
    expect(() => Env.paymentPrice).toThrow("Invalid PAYMENT_PRICE");
  });

  it("accepts valid PAYMENT_PRICE", () => {
    vi.stubEnv("PAYMENT_PRICE", "1.5");
    expect(Env.paymentPrice).toBe("1.5");
  });

  it("returns '*' when CORS_ORIGINS is set to '*'", () => {
    vi.stubEnv("CORS_ORIGINS", "*");
    expect(Env.corsOrigins).toBe("*");
  });

  it("trims whitespace from CORS_ORIGINS entries", () => {
    vi.stubEnv("CORS_ORIGINS", " https://a.com , https://b.com ");
    expect(Env.corsOrigins).toEqual(["https://a.com", "https://b.com"]);
  });

  it("filters empty entries from CORS_ORIGINS", () => {
    vi.stubEnv("CORS_ORIGINS", "https://a.com,,https://b.com");
    expect(Env.corsOrigins).toEqual(["https://a.com", "https://b.com"]);
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

  describe("serverBaseRoute", () => {
    it("defaults to empty string when SERVER_BASE_ROUTE is unset", () => {
      expect(Env.serverBaseRoute).toBe("");
    });

    it("returns empty string for '/'", () => {
      vi.stubEnv("SERVER_BASE_ROUTE", "/");
      expect(Env.serverBaseRoute).toBe("");
    });

    it("returns normalised path with leading slash", () => {
      vi.stubEnv("SERVER_BASE_ROUTE", "x402-demo/api");
      expect(Env.serverBaseRoute).toBe("/x402-demo/api");
    });

    it("strips trailing slash", () => {
      vi.stubEnv("SERVER_BASE_ROUTE", "/x402-demo/api/");
      expect(Env.serverBaseRoute).toBe("/x402-demo/api");
    });

    it("collapses multiple slashes", () => {
      vi.stubEnv("SERVER_BASE_ROUTE", "//x402-demo///api//");
      expect(Env.serverBaseRoute).toBe("/x402-demo/api");
    });

    it("strips unsafe characters", () => {
      vi.stubEnv("SERVER_BASE_ROUTE", "/x402-demo/<script>/api");
      expect(Env.serverBaseRoute).toBe("/x402-demo/script/api");
    });

    it("trims whitespace", () => {
      vi.stubEnv("SERVER_BASE_ROUTE", "  /x402-demo/api  ");
      expect(Env.serverBaseRoute).toBe("/x402-demo/api");
    });

    it("returns empty string for empty value", () => {
      vi.stubEnv("SERVER_BASE_ROUTE", "");
      expect(Env.serverBaseRoute).toBe("");
    });

    it("returns empty string for whitespace-only value", () => {
      vi.stubEnv("SERVER_BASE_ROUTE", "   ");
      expect(Env.serverBaseRoute).toBe("");
    });
  });

  describe("network config", () => {
    const VALID_G_ADDR = "GAFIXNT2BFRPI6LLKQHEV7WBMGJ3V6F7HWUE5SYHYC4Q5NMFVSVDOVJT";
    const VALID_G_ADDR_2 = "GBYNMFZCCHST7S7EYBQI5Z3I5DHIQVKN5MOEGEV6QI4GY7JAWCCMG76D";
    const FACILITATOR_URL = "http://localhost:4022";
    const MAINNET_RPC_URL = "https://mainnet.sorobanrpc.com";

    it("returns undefined for testnet when TESTNET_SERVER_STELLAR_ADDRESS is unset", () => {
      expect(Env.testnetConfig).toBeUndefined();
    });

    it("returns testnet config with defaults when required vars are set", () => {
      vi.stubEnv("TESTNET_SERVER_STELLAR_ADDRESS", VALID_G_ADDR);
      vi.stubEnv("TESTNET_FACILITATOR_URL", FACILITATOR_URL);
      const net = Env.testnetConfig!;
      expect(net.network).toBe("stellar:testnet");
      expect(net.serverStellarAddress).toBe(VALID_G_ADDR);
      expect(net.stellarRpcUrl).toBe("https://soroban-testnet.stellar.org");
      expect(net.facilitatorUrl).toBe(FACILITATOR_URL);
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

    it("returns mainnet config when all required vars are set", () => {
      vi.stubEnv("MAINNET_SERVER_STELLAR_ADDRESS", VALID_G_ADDR_2);
      vi.stubEnv("MAINNET_FACILITATOR_URL", FACILITATOR_URL);
      vi.stubEnv("MAINNET_STELLAR_RPC_URL", MAINNET_RPC_URL);
      const net = Env.mainnetConfig!;
      expect(net.network).toBe("stellar:pubnet");
      expect(net.serverStellarAddress).toBe(VALID_G_ADDR_2);
      expect(net.stellarRpcUrl).toBe(MAINNET_RPC_URL);
    });

    it("returns both networks when both are fully configured", () => {
      vi.stubEnv("TESTNET_SERVER_STELLAR_ADDRESS", VALID_G_ADDR);
      vi.stubEnv("TESTNET_FACILITATOR_URL", FACILITATOR_URL);
      vi.stubEnv("MAINNET_SERVER_STELLAR_ADDRESS", VALID_G_ADDR_2);
      vi.stubEnv("MAINNET_FACILITATOR_URL", FACILITATOR_URL);
      vi.stubEnv("MAINNET_STELLAR_RPC_URL", MAINNET_RPC_URL);
      const nets = Env.networksConfig;
      expect(nets).toHaveLength(2);
      expect(nets[0].network).toBe("stellar:testnet");
      expect(nets[1].network).toBe("stellar:pubnet");
    });

    it("returns only testnet when only testnet is configured", () => {
      vi.stubEnv("TESTNET_SERVER_STELLAR_ADDRESS", VALID_G_ADDR);
      vi.stubEnv("TESTNET_FACILITATOR_URL", FACILITATOR_URL);
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
      vi.stubEnv("TESTNET_FACILITATOR_URL", FACILITATOR_URL);
      vi.stubEnv("MAINNET_SERVER_STELLAR_ADDRESS", VALID_G_ADDR_2);
      vi.stubEnv("MAINNET_FACILITATOR_URL", FACILITATOR_URL);
      vi.stubEnv("MAINNET_STELLAR_RPC_URL", MAINNET_RPC_URL);
      expect(Env.allStellarRpcUrls).toEqual([
        "https://soroban-testnet.stellar.org",
        MAINNET_RPC_URL,
      ]);
    });

    it("trims whitespace from TESTNET_FACILITATOR_API_KEY", () => {
      vi.stubEnv("TESTNET_SERVER_STELLAR_ADDRESS", VALID_G_ADDR);
      vi.stubEnv("TESTNET_FACILITATOR_URL", FACILITATOR_URL);
      vi.stubEnv("TESTNET_FACILITATOR_API_KEY", "  my-secret-key  ");
      expect(Env.testnetConfig!.facilitatorApiKey).toBe("my-secret-key");
    });

    it("returns undefined for empty TESTNET_FACILITATOR_API_KEY", () => {
      vi.stubEnv("TESTNET_SERVER_STELLAR_ADDRESS", VALID_G_ADDR);
      vi.stubEnv("TESTNET_FACILITATOR_URL", FACILITATOR_URL);
      vi.stubEnv("TESTNET_FACILITATOR_API_KEY", "");
      expect(Env.testnetConfig!.facilitatorApiKey).toBeUndefined();
    });

    it("returns undefined for whitespace-only TESTNET_FACILITATOR_API_KEY", () => {
      vi.stubEnv("TESTNET_SERVER_STELLAR_ADDRESS", VALID_G_ADDR);
      vi.stubEnv("TESTNET_FACILITATOR_URL", FACILITATOR_URL);
      vi.stubEnv("TESTNET_FACILITATOR_API_KEY", "   ");
      expect(Env.testnetConfig!.facilitatorApiKey).toBeUndefined();
    });

    it("throws when TESTNET_FACILITATOR_API_KEY contains only empty entries", () => {
      vi.stubEnv("TESTNET_SERVER_STELLAR_ADDRESS", VALID_G_ADDR);
      vi.stubEnv("TESTNET_FACILITATOR_URL", FACILITATOR_URL);
      vi.stubEnv("TESTNET_FACILITATOR_API_KEY", " , , ");
      expect(() => Env.testnetConfig).toThrow(
        "TESTNET_FACILITATOR_API_KEY must contain at least one non-empty key",
      );
    });

    it("throws on invalid TESTNET_SERVER_STELLAR_ADDRESS", () => {
      vi.stubEnv("TESTNET_SERVER_STELLAR_ADDRESS", "INVALID");
      vi.stubEnv("TESTNET_FACILITATOR_URL", FACILITATOR_URL);
      expect(() => Env.testnetConfig).toThrow("SERVER_STELLAR_ADDRESS");
    });

    it("throws on invalid MAINNET_SERVER_STELLAR_ADDRESS", () => {
      vi.stubEnv("MAINNET_SERVER_STELLAR_ADDRESS", "NOT_A_REAL_KEY");
      vi.stubEnv("MAINNET_FACILITATOR_URL", FACILITATOR_URL);
      vi.stubEnv("MAINNET_STELLAR_RPC_URL", MAINNET_RPC_URL);
      expect(() => Env.mainnetConfig).toThrow("SERVER_STELLAR_ADDRESS");
    });

    it("accepts a valid C-account (contract) address", () => {
      const contractAddr = "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
      vi.stubEnv("TESTNET_SERVER_STELLAR_ADDRESS", contractAddr);
      vi.stubEnv("TESTNET_FACILITATOR_URL", FACILITATOR_URL);
      expect(Env.testnetConfig!.serverStellarAddress).toBe(contractAddr);
    });

    it("accepts a valid M-account (muxed) address", () => {
      const muxedAddr = "MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
      vi.stubEnv("TESTNET_SERVER_STELLAR_ADDRESS", muxedAddr);
      vi.stubEnv("TESTNET_FACILITATOR_URL", FACILITATOR_URL);
      expect(Env.testnetConfig!.serverStellarAddress).toBe(muxedAddr);
    });

    it("throws when TESTNET_FACILITATOR_URL is missing", () => {
      vi.stubEnv("TESTNET_SERVER_STELLAR_ADDRESS", VALID_G_ADDR);
      expect(() => Env.testnetConfig).toThrow("TESTNET_FACILITATOR_URL is required");
    });

    it("throws when MAINNET_STELLAR_RPC_URL is missing", () => {
      vi.stubEnv("MAINNET_SERVER_STELLAR_ADDRESS", VALID_G_ADDR_2);
      vi.stubEnv("MAINNET_FACILITATOR_URL", FACILITATOR_URL);
      expect(() => Env.mainnetConfig).toThrow("MAINNET_STELLAR_RPC_URL is required for mainnet");
    });

    it("testnet does not require STELLAR_RPC_URL (has built-in default)", () => {
      vi.stubEnv("TESTNET_SERVER_STELLAR_ADDRESS", VALID_G_ADDR);
      vi.stubEnv("TESTNET_FACILITATOR_URL", FACILITATOR_URL);
      expect(Env.testnetConfig!.stellarRpcUrl).toBe("https://soroban-testnet.stellar.org");
    });

    it("aggregates multiple errors for one network", () => {
      vi.stubEnv("MAINNET_SERVER_STELLAR_ADDRESS", "INVALID");
      expect(() => Env.mainnetConfig).toThrow(
        /MAINNET_SERVER_STELLAR_ADDRESS.*MAINNET_FACILITATOR_URL.*MAINNET_STELLAR_RPC_URL/s,
      );
    });
  });

  describe("validateFacilitators", () => {
    const VALID_G_ADDR = "GAFIXNT2BFRPI6LLKQHEV7WBMGJ3V6F7HWUE5SYHYC4Q5NMFVSVDOVJT";
    const VALID_G_ADDR_2 = "GBYNMFZCCHST7S7EYBQI5Z3I5DHIQVKN5MOEGEV6QI4GY7JAWCCMG76D";
    const FACILITATOR_URL = "http://localhost:4022";
    const MAINNET_RPC_URL = "https://mainnet.sorobanrpc.com";

    beforeEach(() => {
      vi.unstubAllEnvs();
      Env.resetCache();
      vi.stubEnv("NODE_ENV", "test");
    });

    it("succeeds when all facilitators return 200", async () => {
      vi.stubEnv("TESTNET_SERVER_STELLAR_ADDRESS", VALID_G_ADDR);
      vi.stubEnv("TESTNET_FACILITATOR_URL", FACILITATOR_URL);

      const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
      vi.stubGlobal("fetch", mockFetch);

      await expect(Env.validateFacilitators()).resolves.toBeUndefined();
      expect(mockFetch).toHaveBeenCalledWith(`${FACILITATOR_URL}/supported`, expect.any(Object));
    });

    it("sends Authorization header when API key is configured", async () => {
      vi.stubEnv("TESTNET_SERVER_STELLAR_ADDRESS", VALID_G_ADDR);
      vi.stubEnv("TESTNET_FACILITATOR_URL", FACILITATOR_URL);
      vi.stubEnv("TESTNET_FACILITATOR_API_KEY", "my-secret");

      const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
      vi.stubGlobal("fetch", mockFetch);

      await Env.validateFacilitators();
      expect(mockFetch).toHaveBeenCalledWith(
        `${FACILITATOR_URL}/supported`,
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: "Bearer my-secret" }),
        }),
      );
    });

    it("validates every configured facilitator API key", async () => {
      vi.stubEnv("TESTNET_SERVER_STELLAR_ADDRESS", VALID_G_ADDR);
      vi.stubEnv("TESTNET_FACILITATOR_URL", FACILITATOR_URL);
      vi.stubEnv("TESTNET_FACILITATOR_API_KEY", "key-1,key-2");

      const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
      vi.stubGlobal("fetch", mockFetch);

      await expect(Env.validateFacilitators()).resolves.toBeUndefined();
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        `${FACILITATOR_URL}/supported`,
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: "Bearer key-1" }),
        }),
      );
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        `${FACILITATOR_URL}/supported`,
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: "Bearer key-2" }),
        }),
      );
    });

    it("does not send Authorization header when no API key is set", async () => {
      vi.stubEnv("TESTNET_SERVER_STELLAR_ADDRESS", VALID_G_ADDR);
      vi.stubEnv("TESTNET_FACILITATOR_URL", FACILITATOR_URL);

      const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
      vi.stubGlobal("fetch", mockFetch);

      await Env.validateFacilitators();
      const callHeaders = mockFetch.mock.calls[0][1].headers;
      expect(callHeaders).not.toHaveProperty("Authorization");
    });

    it("throws when facilitator returns non-200 status", async () => {
      vi.stubEnv("TESTNET_SERVER_STELLAR_ADDRESS", VALID_G_ADDR);
      vi.stubEnv("TESTNET_FACILITATOR_URL", FACILITATOR_URL);

      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 }));

      await expect(Env.validateFacilitators()).rejects.toThrow(/Testnet facilitator.*HTTP 503/);
    });

    it("throws when facilitator is unreachable", async () => {
      vi.stubEnv("TESTNET_SERVER_STELLAR_ADDRESS", VALID_G_ADDR);
      vi.stubEnv("TESTNET_FACILITATOR_URL", FACILITATOR_URL);

      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));

      await expect(Env.validateFacilitators()).rejects.toThrow(/Testnet facilitator.*ECONNREFUSED/);
    });

    it("throws when any configured facilitator API key fails and masks the key", async () => {
      vi.stubEnv("TESTNET_SERVER_STELLAR_ADDRESS", VALID_G_ADDR);
      vi.stubEnv("TESTNET_FACILITATOR_URL", FACILITATOR_URL);
      vi.stubEnv("TESTNET_FACILITATOR_API_KEY", "123456ab,abcdef12");

      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce({ ok: true, status: 200 })
        .mockResolvedValueOnce({ ok: false, status: 401 });
      vi.stubGlobal("fetch", mockFetch);

      await expect(Env.validateFacilitators()).rejects.toThrow(
        /Testnet facilitator.*one or more API keys failed: ab\.\.\.12 returned HTTP 401/s,
      );
    });

    it("aggregates errors across multiple networks", async () => {
      vi.stubEnv("TESTNET_SERVER_STELLAR_ADDRESS", VALID_G_ADDR);
      vi.stubEnv("TESTNET_FACILITATOR_URL", "http://testnet-facilitator:4022");
      vi.stubEnv("MAINNET_SERVER_STELLAR_ADDRESS", VALID_G_ADDR_2);
      vi.stubEnv("MAINNET_FACILITATOR_URL", "http://mainnet-facilitator:4022");
      vi.stubEnv("MAINNET_STELLAR_RPC_URL", MAINNET_RPC_URL);

      const mockFetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes("testnet")) return Promise.reject(new Error("ECONNREFUSED"));
        return Promise.resolve({ ok: false, status: 500 });
      });
      vi.stubGlobal("fetch", mockFetch);

      await expect(Env.validateFacilitators()).rejects.toThrow(
        /Facilitator validation failed:\n.*Testnet.*ECONNREFUSED.*\n.*Mainnet.*HTTP 500/s,
      );
    });

    it("skips validation when no networks are configured (paywall disabled)", async () => {
      vi.stubEnv("PAYWALL_DISABLED", "true");

      const mockFetch = vi.fn();
      vi.stubGlobal("fetch", mockFetch);

      await expect(Env.validateFacilitators()).resolves.toBeUndefined();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});

describe("maskFacilitatorApiKey", () => {
  it("masks short keys (≤4 chars) completely", () => {
    expect(maskFacilitatorApiKey("a")).toBe("****");
    expect(maskFacilitatorApiKey("ab")).toBe("****");
    expect(maskFacilitatorApiKey("abc")).toBe("****");
    expect(maskFacilitatorApiKey("abcd")).toBe("****");
  });

  it("shows first 2 and last 2 chars for longer keys", () => {
    expect(maskFacilitatorApiKey("abcde")).toBe("ab...de");
    expect(maskFacilitatorApiKey("123456ab")).toBe("12...ab");
    expect(maskFacilitatorApiKey("my-very-long-api-key")).toBe("my...ey");
  });
});

describe("parseFacilitatorApiKeys", () => {
  it("returns empty array for undefined", () => {
    expect(parseFacilitatorApiKeys(undefined)).toEqual([]);
  });

  it("returns empty array for empty string", () => {
    expect(parseFacilitatorApiKeys("")).toEqual([]);
  });

  it("parses single key", () => {
    expect(parseFacilitatorApiKeys("my-key")).toEqual(["my-key"]);
  });

  it("parses comma-separated keys", () => {
    expect(parseFacilitatorApiKeys("key-1,key-2,key-3")).toEqual(["key-1", "key-2", "key-3"]);
  });

  it("trims whitespace from keys", () => {
    expect(parseFacilitatorApiKeys(" key-1 , key-2 ")).toEqual(["key-1", "key-2"]);
  });

  it("filters empty entries from comma-separated values", () => {
    expect(parseFacilitatorApiKeys("key-1,,key-2")).toEqual(["key-1", "key-2"]);
    expect(parseFacilitatorApiKeys(" , , ")).toEqual([]);
  });
});
