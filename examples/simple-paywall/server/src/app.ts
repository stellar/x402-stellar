import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import proxyAddr from "proxy-addr";
import { Env } from "./config/env.js";
import { logger, httpLogger } from "./utils/logger.js";
import { createPaymentMiddleware } from "./middleware/payment.js";
import { txHashInjector } from "./middleware/txHashInjector.js";
import { healthRouter } from "./routes/health.js";
import { protectedRouter } from "./routes/protected.js";

export function createApp(): Express {
  const app = express();

  // Trust reverse proxies (Heroku router, nginx) so req.protocol reflects
  // the client's actual scheme (https) via X-Forwarded-Proto.
  // Configurable via TRUST_PROXY env var; defaults to loopback, link-local
  // and unique-local addresses (matching laboratory-backend).
  app.set("trust proxy", proxyAddr.compile(Env.trustProxy));

  // Helmet with default CSP for non-HTML API routes (health, etc.)
  app.use(helmet());
  app.use(cors({ origin: Env.corsOrigins }));
  app.use(httpLogger);

  app.use(healthRouter);

  // Relax CSP for /protected — both the 402 paywall response (which loads
  // wallet icons and connects to Stellar RPC endpoints) and the paid content
  // page (which embeds a SoundCloud iframe) need a permissive policy.
  app.use(
    "/protected",
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://w.soundcloud.com"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          frameSrc: ["https://w.soundcloud.com"],
          connectSrc: ["'self'", "https://*.stellar.org", "https://*.stellar.expert"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }),
  );

  if (Env.paywallDisabled) {
    logger.warn("Paywall is disabled via PAYWALL_DISABLED=true");
  } else {
    // txHashInjector must be registered before x402 middleware to wrap res.end/res.write at the outermost layer.
    // After payment settlement, it intercepts the response body and replaces {{TX_LINK}} with a Stellar Expert link.
    app.use(txHashInjector());
    app.use(createPaymentMiddleware());
  }

  app.use(protectedRouter);

  // Global error handler (Express requires all 4 parameters for error middleware)
  app.use(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (err: Error, _req: Request, res: Response, _next: NextFunction) => {
      logger.error({ err }, "Unhandled error");
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal Server Error" });
      }
    },
  );

  return app;
}
