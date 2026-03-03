import dotenv from "dotenv";

dotenv.config();

import { Env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { createApp } from "./app.js";

const app = createApp();

const server = app.listen(Env.port, () => {
  logger.info({ port: Env.port }, "Stellar Facilitator listening");
});

function shutdown(signal: string) {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  const forceExit = setTimeout(() => {
    logger.warn("Graceful shutdown timed out, forcing exit");
    process.exit(1);
  }, 5000);
  forceExit.unref();
  server.close(() => {
    clearTimeout(forceExit);
    logger.info("Server closed");
    logger.flush();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
