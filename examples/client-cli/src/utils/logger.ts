import pino from "pino";

const LOG_PREFIX = "[cli]";

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
  if (process.env.NODE_ENV !== "production") {
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
    level: process.env.LOG_LEVEL ?? "info",
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
