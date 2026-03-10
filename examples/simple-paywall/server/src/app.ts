import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import proxyAddr from "proxy-addr";
import { Env, NETWORK_META } from "./config/env.js";
import { logger, httpLogger } from "./utils/logger.js";
import { createPaymentMiddlewares, createApiPaymentMiddlewares } from "./middleware/payment.js";
import { paymentLogger } from "./middleware/paymentLogger.js";
import { txHashInjector } from "./middleware/txHashInjector.js";
import { healthRouter } from "./routes/health.js";
import { protectedRouter } from "./routes/protected.js";
import { apiRouter } from "./routes/api.js";
import { openapiRouter } from "./routes/openapi.js";

export function createApp(): Express {
  const app = express();

  // Trust reverse proxies (Heroku router, nginx) so req.protocol reflects
  // the client's actual scheme (https) via X-Forwarded-Proto.
  // Configurable via TRUST_PROXY env var; defaults to loopback, link-local
  // and unique-local addresses (matching laboratory-backend).
  app.set("trust proxy", proxyAddr.compile(Env.trustProxy));

  // CORS must be registered before Helmet so that preflight OPTIONS requests
  // receive Access-Control-Allow-Origin headers before Helmet can interfere.
  app.use(cors({ origin: Env.corsOrigins }));
  // Helmet with default CSP for non-HTML API routes (health, etc.)
  app.use(helmet());
  app.use(httpLogger);

  // When served behind a path-rewriting ingress (e.g. /x402-demo/api/* → /*)
  // prepend SERVER_BASE_ROUTE to req.originalUrl so that @x402/express
  // ExpressAdapter.getUrl() returns the full external URL.
  // req.path is untouched — Express route matching is unaffected.
  const baseRoute = Env.serverBaseRoute;
  if (baseRoute) {
    app.use((req, _res, next) => {
      if (!req.originalUrl.startsWith(baseRoute)) {
        req.originalUrl = baseRoute + req.originalUrl;
      }
      next();
    });
  }

  app.use(healthRouter);
  app.use(openapiRouter);

  // Discovery endpoint: returns which networks are configured so the
  // client can dynamically render one or two "Access Protected Content" buttons.
  app.get("/networks", (_req, res) => {
    const networks = Env.paywallDisabled ? [] : Env.networksConfig.map((n) => n.network);
    res.json({ networks });
  });

  // x402 discovery — https://www.x402scan.com/discovery
  app.get("/.well-known/x402", (_req, res) => {
    const prefix = Env.serverBaseRoute;

    const description =
      "Weather forecast API — pay-per-request with x402 on Stellar. " +
      `Each ${prefix}/weather/<network> endpoint accepts payment on the corresponding Stellar network ` +
      `(e.g. ${prefix}/weather/testnet for Stellar testnet, ${prefix}/weather/mainnet for Stellar mainnet). ` +
      `Pass the city name as a required query parameter: GET ${prefix}/weather/<network>?city=<name>.`;

    if (Env.paywallDisabled) {
      res.json({ version: 1, resources: [], description });
      return;
    }

    const resources: string[] = [];

    for (const netConfig of Env.networksConfig) {
      const { routeSuffix } = NETWORK_META[netConfig.network];
      resources.push(`GET ${prefix}/weather/${routeSuffix}`);
    }

    res.json({ version: 1, resources, description });
  });

  // Relax CSP for /protected:
  const connectSrc = ["'self'", "https://*.stellar.org", "https://*.stellar.expert"];
  if (!Env.paywallDisabled) {
    for (const rpcUrl of Env.allStellarRpcUrls) {
      try {
        const rpcOrigin = new URL(rpcUrl).origin;
        if (!connectSrc.includes(rpcOrigin)) {
          connectSrc.push(rpcOrigin);
        }
      } catch {
        logger.warn({ stellarRpcUrl: rpcUrl }, "Invalid STELLAR_RPC_URL for CSP");
      }
    }
  }
  app.use(
    "/protected",
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://w.soundcloud.com"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          frameSrc: ["https://w.soundcloud.com"],
          connectSrc,
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
    app.use(paymentLogger());

    // FE middlewares
    const middlewares = createPaymentMiddlewares();
    for (const mw of middlewares) {
      app.use(mw.handler);
      logger.info(
        { route: `GET ${mw.routePath}`, network: mw.network },
        "Registered payment route",
      );
    }

    // API middlewares
    const apiMiddlewares = createApiPaymentMiddlewares();
    for (const mw of apiMiddlewares) {
      app.use(mw.handler);
      logger.info(
        { route: `GET ${mw.routePath}`, network: mw.network },
        "Registered API payment route",
      );
    }
  }

  app.use(protectedRouter);
  app.use(apiRouter);

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
