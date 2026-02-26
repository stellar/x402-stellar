"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  ExpressAdapter: () => ExpressAdapter,
  RouteConfigurationError: () => import_server3.RouteConfigurationError,
  paymentMiddleware: () => paymentMiddleware,
  paymentMiddlewareFromConfig: () => paymentMiddlewareFromConfig,
  paymentMiddlewareFromHTTPServer: () => paymentMiddlewareFromHTTPServer,
  x402HTTPResourceServer: () => import_server2.x402HTTPResourceServer,
  x402ResourceServer: () => import_server2.x402ResourceServer
});
module.exports = __toCommonJS(src_exports);
var import_server = require("@x402/core/server");

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
var import_server2 = require("@x402/core/server");
var import_server3 = require("@x402/core/server");
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
  const httpServer = new import_server.x402HTTPResourceServer(server, routes);
  return paymentMiddlewareFromHTTPServer(
    httpServer,
    paywallConfig,
    paywall,
    syncFacilitatorOnStart
  );
}
function paymentMiddlewareFromConfig(routes, facilitatorClients, schemes, paywallConfig, paywall, syncFacilitatorOnStart = true) {
  const ResourceServer = new import_server.x402ResourceServer(facilitatorClients);
  if (schemes) {
    schemes.forEach(({ network, server: schemeServer }) => {
      ResourceServer.register(network, schemeServer);
    });
  }
  return paymentMiddleware(routes, ResourceServer, paywallConfig, paywall, syncFacilitatorOnStart);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ExpressAdapter,
  RouteConfigurationError,
  paymentMiddleware,
  paymentMiddlewareFromConfig,
  paymentMiddlewareFromHTTPServer,
  x402HTTPResourceServer,
  x402ResourceServer
});
//# sourceMappingURL=index.js.map