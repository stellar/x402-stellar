const VALID_LOG_LEVELS = ["fatal", "error", "warn", "info", "debug", "trace"] as const;
type LogLevel = (typeof VALID_LOG_LEVELS)[number];

export class Env {
  static get port(): number {
    const raw = process.env.PORT ?? "4022";
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

  static get stellarPrivateKey(): string {
    const key = process.env.FACILITATOR_STELLAR_PRIVATE_KEY;
    if (!key) {
      throw new Error("FACILITATOR_STELLAR_PRIVATE_KEY is required.");
    }
    return key;
  }

  /**
   * Optional secret key for the fee-bump signer account.
   * When set (together with channelSecrets), the facilitator uses a separate
   * account to pay fees via fee-bump transactions, decoupling fee payment
   * from sequence-number management.
   */
  static get feeBumpSecret(): string | undefined {
    return process.env.FACILITATOR_STELLAR_FEE_BUMP_SECRET || undefined;
  }

  /**
   * Optional comma-separated list of secret keys for channel accounts.
   * Each channel account manages its own sequence number, enabling parallel
   * transaction submission for high throughput.
   */
  static get channelSecrets(): string[] | undefined {
    const raw = process.env.FACILITATOR_STELLAR_CHANNEL_SECRETS;
    if (!raw) return undefined;
    const secrets = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return secrets.length > 0 ? secrets : undefined;
  }

  static get stellarNetwork(): `${string}:${string}` {
    return (process.env.STELLAR_NETWORK ?? "stellar:testnet") as `${string}:${string}`;
  }

  /** Soroban RPC URL. Defaults to the public SDF testnet endpoint. */
  static get stellarRpcUrl(): string {
    return process.env.STELLAR_RPC_URL?.trim() || "https://soroban-testnet.stellar.org";
  }

  static get trustProxy(): string[] {
    const raw = process.env.TRUST_PROXY;
    const defaultValue = "loopback,linklocal,uniquelocal";
    return (raw ?? defaultValue)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
}
