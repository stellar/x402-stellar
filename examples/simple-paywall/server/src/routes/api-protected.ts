import { Router, type Router as RouterType } from "express";
import { Env, NETWORK_META } from "../config/env.js";

const router: RouterType = Router();

const validSuffixes = Env.networksConfig.map((n) => NETWORK_META[n.network].routeSuffix);

/**
 * API-style protected endpoint — returns JSON on success.
 * Payment is enforced by the x402 middleware registered in app.ts;
 * this handler only runs after a valid PAYMENT-SIGNATURE is verified.
 */
router.get("/api/protected/:network", (req, res) => {
  if (!Env.paywallDisabled && !validSuffixes.includes(req.params.network)) {
    res.status(404).json({ error: "Network not found" });
    return;
  }

  res.json({
    message: "Access granted",
    network: req.params.network,
    timestamp: new Date().toISOString(),
  });
});

export { router as apiProtectedRouter };
