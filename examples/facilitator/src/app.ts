import { x402Facilitator } from "@x402/core/facilitator";
import type {
  PaymentPayload,
  PaymentRequirements,
  SettleResponse,
  VerifyResponse,
} from "@x402/core/types";
import { createEd25519Signer } from "@x402/stellar";
import { ExactStellarScheme } from "@x402/stellar/exact/facilitator";
import cors from "cors";
import express, { type Express, type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import proxyAddr from "proxy-addr";

import { Env } from "./config/env.js";
import { logger, httpLogger } from "./utils/logger.js";

export function createApp(): Express {
  const feeBumpSecret = Env.feeBumpSecret;
  const channelSecrets = Env.channelSecrets;
  const useChannelAccounts = feeBumpSecret && channelSecrets && channelSecrets.length > 0;
  const rpcConfig = { url: Env.stellarRpcUrl };
  const maxTransactionFeeStroops = Env.maxTransactionFeeStroops;

  let scheme: ExactStellarScheme;

  if (useChannelAccounts) {
    // High-throughput mode: channel accounts as inner-tx signers + separate fee-bump signer
    const channelSigners = channelSecrets.map((secret) => createEd25519Signer(secret));
    const feeBumpSigner = createEd25519Signer(feeBumpSecret);

    logger.info(
      {
        feeBumpAddress: feeBumpSigner.address,
        channelCount: channelSigners.length,
        channelAddresses: channelSigners.map((s) => s.address),
      },
      "High-throughput mode: fee-bump signer + channel accounts",
    );

    scheme = new ExactStellarScheme(channelSigners, {
      feeBumpSigner,
      rpcConfig,
      maxTransactionFeeStroops,
    });
  } else {
    // Single-signer mode (default)
    const stellarSigner = createEd25519Signer(Env.stellarPrivateKey);
    logger.info(`Stellar Facilitator account: ${stellarSigner.address}`);
    scheme = new ExactStellarScheme([stellarSigner], {
      rpcConfig,
      maxTransactionFeeStroops,
    });
  }

  const facilitator = new x402Facilitator()
    .onBeforeVerify(async (context) => {
      logger.debug({ context }, "Before verify");
    })
    .onAfterVerify(async (context) => {
      logger.debug({ context }, "After verify");
    })
    .onVerifyFailure(async (context) => {
      const verifyError =
        context.error instanceof Error
          ? context.error.message
          : String(context.error ?? "unknown_verify_failure");

      logger.warn({ context, verifyError }, "Verify failure");
    })
    .onBeforeSettle(async (context) => {
      logger.debug({ context }, "Before settle");
    })
    .onAfterSettle(async (context) => {
      logger.debug({ context }, "After settle");
    })
    .onSettleFailure(async (context) => {
      logger.warn({ context }, "Settle failure");
    });

  facilitator.register(Env.stellarNetwork, scheme);

  const app: Express = express();

  app.set("trust proxy", proxyAddr.compile(Env.trustProxy));
  app.use(helmet());
  app.use(cors({ origin: Env.corsOrigins }));
  app.use(httpLogger);
  app.use(express.json());

  app.post("/verify", async (req, res): Promise<void> => {
    try {
      const { paymentPayload, paymentRequirements } = req.body as {
        paymentPayload: PaymentPayload;
        paymentRequirements: PaymentRequirements;
      };

      if (
        !paymentPayload ||
        typeof paymentPayload !== "object" ||
        Array.isArray(paymentPayload) ||
        !paymentRequirements ||
        typeof paymentRequirements !== "object" ||
        Array.isArray(paymentRequirements)
      ) {
        res.status(400).json({
          error: "Missing paymentPayload or paymentRequirements",
        });
        return;
      }

      const response: VerifyResponse = await facilitator.verify(
        paymentPayload,
        paymentRequirements,
      );

      logger.info(
        {
          isValid: response.isValid,
          invalidReason: response.isValid ? undefined : response.invalidReason,
        },
        "Verify response",
      );

      res.json(response);
    } catch (error) {
      logger.error({ err: error }, "Verify error");
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/settle", async (req, res): Promise<void> => {
    try {
      const { paymentPayload, paymentRequirements } = req.body;

      if (
        !paymentPayload ||
        typeof paymentPayload !== "object" ||
        Array.isArray(paymentPayload) ||
        !paymentRequirements ||
        typeof paymentRequirements !== "object" ||
        Array.isArray(paymentRequirements)
      ) {
        res.status(400).json({
          error: "Missing paymentPayload or paymentRequirements",
        });
        return;
      }

      const response: SettleResponse = await facilitator.settle(
        paymentPayload as PaymentPayload,
        paymentRequirements as PaymentRequirements,
      );

      res.json(response);
    } catch (error) {
      logger.error({ err: error }, "Settle error");

      if (error instanceof Error && error.message.includes("Settlement aborted:")) {
        res.json({
          success: false,
          transaction: "",
          errorReason: "Settlement aborted",
          network: req.body?.paymentPayload?.network || "unknown",
        } satisfies SettleResponse);
        return;
      }

      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.get("/supported", async (_req, res) => {
    try {
      const response = facilitator.getSupported();
      res.json(response);
    } catch (error) {
      logger.error({ err: error }, "Supported error");
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

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
