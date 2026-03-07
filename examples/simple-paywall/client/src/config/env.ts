declare global {
  interface Window {
    __CONFIG__?: {
      SERVER_URL?: string;
      APP_NAME?: string;
      PAYMENT_PRICE?: string;
    };
  }
}

export class Env {
  static get serverUrl(): string {
    // Check runtime config first, then Vite env, then default.
    // Use nullish checks (not falsy) so an explicit empty string "" is respected —
    // this allows the SPA to make same-origin requests when behind a reverse proxy.
    const runtime = window.__CONFIG__?.SERVER_URL;
    if (runtime != null) return runtime;
    const vite = import.meta.env.VITE_SERVER_URL;
    if (vite != null) return vite;
    return "http://localhost:3001";
  }

  static get appName(): string {
    return window.__CONFIG__?.APP_NAME || import.meta.env.VITE_APP_NAME || "x402 on Stellar";
  }

  static get paymentPrice(): string {
    return window.__CONFIG__?.PAYMENT_PRICE || import.meta.env.VITE_PAYMENT_PRICE || "0.01";
  }
}
