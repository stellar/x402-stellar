// src/index.ts
import {
  x402HTTPResourceServer,
  x402ResourceServer
} from "@x402/core/server";

// src/adapter.ts
var ExpressAdapter = class {
  /**
   * Creates a new ExpressAdapter instance.
   *
   * @param req - The Express request object
   */
  constructor(req) {
    this.req = req;
  }
  /**
   * Gets a header value from the request.
   *
   * @param name - The header name
   * @returns The header value or undefined
   */
  getHeader(name) {
    const value = this.req.header(name);
    return Array.isArray(value) ? value[0] : value;
  }
  /**
   * Gets the HTTP method of the request.
   *
   * @returns The HTTP method
   */
  getMethod() {
    return this.req.method;
  }
  /**
   * Gets the path of the request.
   *
   * @returns The request path
   */
  getPath() {
    return this.req.path;
  }
  /**
   * Gets the full URL of the request.
   *
   * @returns The full request URL
   */
  getUrl() {
    return `${this.req.protocol}://${this.req.headers.host}${this.req.originalUrl}`;
  }
  /**
   * Gets the Accept header from the request.
   *
   * @returns The Accept header value or empty string
   */
  getAcceptHeader() {
    return this.req.header("Accept") || "";
  }
  /**
   * Gets the User-Agent header from the request.
   *
   * @returns The User-Agent header value or empty string
   */
  getUserAgent() {
    return this.req.header("User-Agent") || "";
  }
  /**
   * Gets all query parameters from the request URL.
   *
   * @returns Record of query parameter key-value pairs
   */
  getQueryParams() {
    return this.req.query;
  }
  /**
   * Gets a specific query parameter by name.
   *
   * @param name - The query parameter name
   * @returns The query parameter value(s) or undefined
   */
  getQueryParam(name) {
    const value = this.req.query[name];
    return value;
  }
  /**
   * Gets the parsed request body.
   * Requires express.json() or express.urlencoded() middleware.
   *
   * @returns The parsed request body
   */
  getBody() {
    return this.req.body;
  }
};

// src/index.ts
import { x402ResourceServer as x402ResourceServer2, x402HTTPResourceServer as x402HTTPResourceServer2 } from "@x402/core/server";
import { RouteConfigurationError } from "@x402/core/server";
function checkIfBazaarNeeded(routes) {
  if ("accepts" in routes) {
    return !!(routes.extensions && "bazaar" in routes.extensions);
  }
  return Object.values(routes).some((routeConfig) => {
    return !!(routeConfig.extensions && "bazaar" in routeConfig.extensions);
  });
}
function paymentMiddlewareFromHTTPServer(httpServer, paywallConfig, paywall, syncFacilitatorOnStart = true) {
  if (paywall) {
    httpServer.registerPaywallProvider(paywall);
  }
  let initPromise = syncFacilitatorOnStart ? httpServer.initialize() : null;
  let bazaarPromise = null;
  if (checkIfBazaarNeeded(httpServer.routes) && !httpServer.server.hasExtension("bazaar")) {
    bazaarPromise = import("@x402/extensions/bazaar").then(({ bazaarResourceServerExtension }) => {
      httpServer.server.registerExtension(bazaarResourceServerExtension);
    }).catch((err) => {
      console.error("Failed to load bazaar extension:", err);
    });
  }
  return async (req, res, next) => {
    const adapter = new ExpressAdapter(req);
    const context = {
      adapter,
      path: req.path,
      method: req.method,
      paymentHeader: adapter.getHeader("payment-signature") || adapter.getHeader("x-payment")
    };
    if (!httpServer.requiresPayment(context)) {
      return next();
    }
    if (initPromise) {
      await initPromise;
      initPromise = null;
    }
    if (bazaarPromise) {
      await bazaarPromise;
      bazaarPromise = null;
    }
    const result = await httpServer.processHTTPRequest(context, paywallConfig);
    switch (result.type) {
      case "no-payment-required":
        return next();
      case "payment-error":
        const { response } = result;
        res.status(response.status);
        Object.entries(response.headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
        if (response.isHtml) {
          res.send(response.body);
        } else {
          res.json(response.body || {});
        }
        return;
      case "payment-verified":
        const { paymentPayload, paymentRequirements, declaredExtensions } = result;
        const originalWriteHead = res.writeHead.bind(res);
        const originalWrite = res.write.bind(res);
        const originalEnd = res.end.bind(res);
        const originalFlushHeaders = res.flushHeaders.bind(res);
        let bufferedCalls = [];
        let settled = false;
        let endCalled;
        const endPromise = new Promise((resolve) => {
          endCalled = resolve;
        });
        res.writeHead = function(...args) {
          if (!settled) {
            bufferedCalls.push(["writeHead", args]);
            return res;
          }
          return originalWriteHead(...args);
        };
        res.write = function(...args) {
          if (!settled) {
            bufferedCalls.push(["write", args]);
            return true;
          }
          return originalWrite(...args);
        };
        res.end = function(...args) {
          if (!settled) {
            bufferedCalls.push(["end", args]);
            endCalled();
            return res;
          }
          return originalEnd(...args);
        };
        res.flushHeaders = function() {
          if (!settled) {
            bufferedCalls.push(["flushHeaders", []]);
            return;
          }
          return originalFlushHeaders();
        };
        next();
        await endPromise;
        if (res.statusCode >= 400) {
          settled = true;
          res.writeHead = originalWriteHead;
          res.write = originalWrite;
          res.end = originalEnd;
          res.flushHeaders = originalFlushHeaders;
          for (const [method, args] of bufferedCalls) {
            if (method === "writeHead")
              originalWriteHead(...args);
            else if (method === "write")
              originalWrite(...args);
            else if (method === "end") originalEnd(...args);
            else if (method === "flushHeaders") originalFlushHeaders();
          }
          bufferedCalls = [];
          return;
        }
        try {
          const responseBody = Buffer.concat(
            bufferedCalls.flatMap(
              ([m, args]) => (m === "write" || m === "end") && args[0] ? [Buffer.from(args[0])] : []
            )
          );
          const settleResult = await httpServer.processSettlement(
            paymentPayload,
            paymentRequirements,
            declaredExtensions,
            { request: context, responseBody }
          );
          if (!settleResult.success) {
            bufferedCalls = [];
            res.status(402).json({
              error: "Settlement failed",
              details: settleResult.errorReason
            });
            return;
          }
          Object.entries(settleResult.headers).forEach(([key, value]) => {
            res.setHeader(key, value);
          });
        } catch (error) {
          console.error(error);
          bufferedCalls = [];
          res.status(402).json({
            error: "Settlement failed",
            details: error instanceof Error ? error.message : "Unknown error"
          });
          return;
        } finally {
          settled = true;
          res.writeHead = originalWriteHead;
          res.write = originalWrite;
          res.end = originalEnd;
          res.flushHeaders = originalFlushHeaders;
          for (const [method, args] of bufferedCalls) {
            if (method === "writeHead")
              originalWriteHead(...args);
            else if (method === "write")
              originalWrite(...args);
            else if (method === "end") originalEnd(...args);
            else if (method === "flushHeaders") originalFlushHeaders();
          }
          bufferedCalls = [];
        }
        return;
    }
  };
}
function paymentMiddleware(routes, server, paywallConfig, paywall, syncFacilitatorOnStart = true) {
  const httpServer = new x402HTTPResourceServer(server, routes);
  return paymentMiddlewareFromHTTPServer(
    httpServer,
    paywallConfig,
    paywall,
    syncFacilitatorOnStart
  );
}
function paymentMiddlewareFromConfig(routes, facilitatorClients, schemes, paywallConfig, paywall, syncFacilitatorOnStart = true) {
  const ResourceServer = new x402ResourceServer(facilitatorClients);
  if (schemes) {
    schemes.forEach(({ network, server: schemeServer }) => {
      ResourceServer.register(network, schemeServer);
    });
  }
  return paymentMiddleware(routes, ResourceServer, paywallConfig, paywall, syncFacilitatorOnStart);
}
export {
  ExpressAdapter,
  RouteConfigurationError,
  paymentMiddleware,
  paymentMiddlewareFromConfig,
  paymentMiddlewareFromHTTPServer,
  x402HTTPResourceServer2 as x402HTTPResourceServer,
  x402ResourceServer2 as x402ResourceServer
};
//# sourceMappingURL=index.mjs.map