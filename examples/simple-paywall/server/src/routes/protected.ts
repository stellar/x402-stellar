import { Router, type Router as RouterType } from "express";
import { protectedPageHtml } from "../views/protected.js";
import { Env, NETWORK_META } from "../config/env.js";

const router: RouterType = Router();

const validSuffixes = Env.networksConfig.map((n) => NETWORK_META[n.network].routeSuffix);

router.get("/protected/:network", (req, res) => {
  if (!validSuffixes.includes(req.params.network)) {
    res.status(404).json({ error: "Network not found" });
    return;
  }

  let html = protectedPageHtml(Env.clientHomeUrl);
  if (Env.paywallDisabled) {
    html = html.replace("{{TX_LINK}}", "");
  }
  res.type("html").send(html);
});

export { router as protectedRouter };
