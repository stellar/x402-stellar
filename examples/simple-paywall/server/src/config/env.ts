const VALID_LOG_LEVELS = ["fatal", "error", "warn", "info", "debug", "trace"] as const;
type LogLevel = (typeof VALID_LOG_LEVELS)[number];

export const STELLAR_PUBNET_CAIP2 = "stellar:pubnet";
export const STELLAR_TESTNET_CAIP2 = "stellar:testnet";
export type StellarNetwork = typeof STELLAR_PUBNET_CAIP2 | typeof STELLAR_TESTNET_CAIP2;

export const NETWORK_META: Record<
  StellarNetwork,
  { routeSuffix: string; displayName: string; envPrefix: string; defaultRpcUrl: string }
> = {
  [STELLAR_TESTNET_CAIP2]: {
    routeSuffix: "testnet",
    displayName: "Testnet",
    envPrefix: "TESTNET_",
    defaultRpcUrl: "https://soroban-testnet.stellar.org",
  },
  [STELLAR_PUBNET_CAIP2]: {
    routeSuffix: "mainnet",
    displayName: "Mainnet",
    envPrefix: "MAINNET_",
    defaultRpcUrl: "https://mainnet.sorobanrpc.com",
  },
};

export const ALL_STELLAR_NETWORKS: readonly StellarNetwork[] = [
  STELLAR_TESTNET_CAIP2,
  STELLAR_PUBNET_CAIP2,
] as const;

export interface NetworkConfig {
  network: StellarNetwork;
  serverStellarAddress: string;
  stellarRpcUrl: string;
  facilitatorUrl: string;
  facilitatorApiKey: string | undefined;
}

export const STELLAR_DESTINATION_ADDRESS_REGEX = /^(?:[GC][ABCD][A-Z2-7]{54}|M[ABCD][A-Z2-7]{67})$/;

export function validateStellarDestinationAddress(address: string): boolean {
  return STELLAR_DESTINATION_ADDRESS_REGEX.test(address);
}

function readPrefixed(prefix: string, name: string): string | undefined {
  const val = process.env[`${prefix}${name}`]?.trim();
  return val || undefined;
}

function readNetworkConfig(network: StellarNetwork): NetworkConfig | undefined {
  const meta = NETWORK_META[network];
  const addr = readPrefixed(meta.envPrefix, "SERVER_STELLAR_ADDRESS");
  if (!addr) return undefined;

  const errors: string[] = [];

  if (!validateStellarDestinationAddress(addr)) {
    errors.push(
      `${meta.envPrefix}SERVER_STELLAR_ADDRESS: "${addr}" is not a valid ` +
        "Stellar public key (G...), contract (C...), or muxed account (M...)",
    );
  }

  const facilitatorUrl = readPrefixed(meta.envPrefix, "FACILITATOR_URL");
  if (!facilitatorUrl) {
    errors.push(`${meta.envPrefix}FACILITATOR_URL is required`);
  }

  const isMainnet = network === STELLAR_PUBNET_CAIP2;
  const rpcUrl = readPrefixed(meta.envPrefix, "STELLAR_RPC_URL");
  if (isMainnet && !rpcUrl) {
    errors.push(`${meta.envPrefix}STELLAR_RPC_URL is required for mainnet`);
  }

  if (errors.length > 0) {
    throw new Error(
      `${meta.displayName} configuration errors:\n${errors.map((e) => `  - ${e}`).join("\n")}`,
    );
  }

  return {
    network,
    serverStellarAddress: addr,
    stellarRpcUrl: rpcUrl ?? meta.defaultRpcUrl,
    facilitatorUrl: facilitatorUrl!,
    facilitatorApiKey: readPrefixed(meta.envPrefix, "FACILITATOR_API_KEY"),
  };
}

export class Env {
  static get port(): number {
    const raw = process.env.PORT ?? "3001";
    const port = Number(raw);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error(`Invalid PORT: ${raw}. Must be an integer between 1 and 65535.`);
    }
    return port;
  }

  static get nodeEnv(): string {
    return process.env.NODE_ENV ?? "development";
  }

  static get logLevel(): LogLevel {
    const raw = (process.env.LOG_LEVEL ?? "info") as LogLevel;
    if (!VALID_LOG_LEVELS.includes(raw)) {
      throw new Error(`Invalid LOG_LEVEL: ${raw}. Must be one of: ${VALID_LOG_LEVELS.join(", ")}`);
    }
    return raw;
  }

  static get corsOrigins(): string | string[] {
    const raw = process.env.CORS_ORIGINS ?? "http://localhost:5173";
    return raw === "*" ? "*" : raw.split(",");
  }

  static get paymentPrice(): string {
    return process.env.PAYMENT_PRICE ?? "0.01";
  }

  static get paymentDescription(): string {
    return process.env.PAYMENT_DESCRIPTION ?? "Access to protected content";
  }

  static get trustProxy(): string[] {
    const raw = process.env.TRUST_PROXY;
    const defaultValue = "loopback,linklocal,uniquelocal";
    return (raw ?? defaultValue)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  static get paywallDisabled(): boolean {
    return process.env.PAYWALL_DISABLED?.toLowerCase() === "true";
  }

  /** Optional URL for the client home page. Used in the nav brand link on server-rendered pages. */
  static get clientHomeUrl(): string | undefined {
    const url = process.env.CLIENT_HOME_URL?.trim();
    return url || undefined;
  }

  static get testnetConfig(): NetworkConfig | undefined {
    return readNetworkConfig(STELLAR_TESTNET_CAIP2);
  }

  static get mainnetConfig(): NetworkConfig | undefined {
    return readNetworkConfig(STELLAR_PUBNET_CAIP2);
  }

  private static _networksConfigCache: NetworkConfig[] | undefined;

  static get networksConfig(): NetworkConfig[] {
    if (Env._networksConfigCache !== undefined) return Env._networksConfigCache;

    const nets: NetworkConfig[] = [];
    const t = Env.testnetConfig;
    if (t) nets.push(t);
    const m = Env.mainnetConfig;
    if (m) nets.push(m);
    if (nets.length === 0 && !Env.paywallDisabled) {
      throw new Error(
        "At least one network must be configured. " +
          "Set TESTNET_SERVER_STELLAR_ADDRESS and/or MAINNET_SERVER_STELLAR_ADDRESS.",
      );
    }
    Env._networksConfigCache = nets;
    return nets;
  }

  /** Reset cached config. Used by tests that stub env vars between runs. */
  static resetCache(): void {
    Env._networksConfigCache = undefined;
  }

  /**
   * Validate that every configured facilitator is reachable by calling GET /supported.
   * Sends the optional API key as a Bearer token when configured.
   * Aggregates all errors and throws once with full diagnostics.
   * Call this at startup before creating the Express app.
   */
  static async validateFacilitators(): Promise<void> {
    const configs = Env.networksConfig;
    if (configs.length === 0) return;

    const errors: string[] = [];

    await Promise.all(
      configs.map(async (cfg) => {
        const { displayName } = NETWORK_META[cfg.network];
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (cfg.facilitatorApiKey) {
          headers["Authorization"] = `Bearer ${cfg.facilitatorApiKey}`;
        }

        try {
          const res = await fetch(`${cfg.facilitatorUrl}/supported`, { method: "GET", headers });
          if (!res.ok) {
            errors.push(
              `${displayName} facilitator at ${cfg.facilitatorUrl} returned HTTP ${res.status}`,
            );
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          errors.push(
            `${displayName} facilitator at ${cfg.facilitatorUrl} is unreachable: ${message}`,
          );
        }
      }),
    );

    if (errors.length > 0) {
      throw new Error(
        `Facilitator validation failed:\n${errors.map((e) => `  - ${e}`).join("\n")}`,
      );
    }
  }

  static get allStellarRpcUrls(): string[] {
    return Env.networksConfig.map((n) => n.stellarRpcUrl);
  }
}
