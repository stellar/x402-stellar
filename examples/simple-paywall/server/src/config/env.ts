const VALID_LOG_LEVELS = ["fatal", "error", "warn", "info", "debug", "trace"] as const;
type LogLevel = (typeof VALID_LOG_LEVELS)[number];

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
    const raw = process.env.CORS_ORIGINS ?? "*";
    return raw === "*" ? "*" : raw.split(",");
  }

  static get facilitatorUrl(): string {
    return process.env.FACILITATOR_URL ?? "http://localhost:4022";
  }

  static get facilitatorApiKey(): string | undefined {
    const key = process.env.FACILITATOR_API_KEY?.trim();
    return key || undefined;
  }

  static get serverStellarAddress(): string {
    const addr = process.env.SERVER_STELLAR_ADDRESS;
    if (!addr) {
      throw new Error("SERVER_STELLAR_ADDRESS is required.");
    }
    return addr;
  }

  static get stellarNetwork(): `${string}:${string}` {
    return (process.env.STELLAR_NETWORK ?? "stellar:testnet") as `${string}:${string}`;
  }

  /** Soroban RPC URL. Defaults to the public SDF testnet endpoint. */
  static get stellarRpcUrl(): string {
    return process.env.STELLAR_RPC_URL?.trim() || "https://soroban-testnet.stellar.org";
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
}
