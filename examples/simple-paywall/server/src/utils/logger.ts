import pino from "pino";
import { pinoHttp, type Options } from "pino-http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { Env } from "../config/env.js";

const LOG_PREFIX = "[server]";

function addLogPrefix(args: unknown[]): unknown[] {
  const prefixedArgs = [...args];
  const messageIndex = prefixedArgs.findIndex((arg) => typeof arg === "string");

  if (messageIndex >= 0) {
    prefixedArgs[messageIndex] = `${LOG_PREFIX} ${String(prefixedArgs[messageIndex])}`;
    return prefixedArgs;
  }

  prefixedArgs.unshift(LOG_PREFIX);
  return prefixedArgs;
}

function createTransport() {
  if (Env.nodeEnv !== "production") {
    try {
      return pino.transport({
        target: "pino-pretty",
        options: { colorize: true },
      });
    } catch {
      // pino-pretty not available, use default
    }
  }
  return undefined;
}

export const logger = pino(
  {
    level: Env.logLevel,
    hooks: {
      logMethod(args, method) {
        method.apply(this, addLogPrefix(args) as Parameters<typeof method>);
      },
    },
    formatters: {
      level(label) {
        return { level: label };
      },
    },
  },
  createTransport(),
);

export const httpLogger = pinoHttp({
  logger,
  customLogLevel(_req: IncomingMessage, res: ServerResponse, err: Error | undefined) {
    if (err || (res.statusCode && res.statusCode >= 500)) return "error";
    if (res.statusCode && res.statusCode >= 400) return "warn";
    return "info";
  },
  serializers: {
    req(req: IncomingMessage) {
      return { method: req.method, url: req.url };
    },
    res(res: ServerResponse) {
      return { statusCode: res.statusCode };
    },
  },
} satisfies Options);
