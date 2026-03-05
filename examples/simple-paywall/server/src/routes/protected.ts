import { Router, type Router as RouterType } from "express";
import { protectedPageHtml } from "../views/protected.js";
import { Env } from "../config/env.js";

const router: RouterType = Router();

router.get("/protected", (_req, res) => {
  let html = protectedPageHtml(Env.clientHomeUrl);
  // When the paywall is disabled, the txHashInjector middleware is not
  // registered so the {{TX_LINK}} placeholder would pass through raw.
  // Strip it here to avoid showing the template variable to the user.
  if (Env.paywallDisabled) {
    html = html.replace("{{TX_LINK}}", "");
  }
  res.type("html").send(html);
});

export { router as protectedRouter };
