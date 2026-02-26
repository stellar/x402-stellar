import { Router, type Router as RouterType } from "express";
import { protectedPageHtml } from "../views/protected.js";

const router: RouterType = Router();

router.get("/protected", (_req, res) => {
  res.type("html").send(protectedPageHtml());
});

export { router as protectedRouter };
