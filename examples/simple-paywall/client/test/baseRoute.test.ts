import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { matchRoutes } from "react-router";
import { normalizeBaseRoute, resolveBaseRoute } from "../src/config/baseRoute.ts";

test("normalizeBaseRoute defaults to root", () => {
  assert.equal(normalizeBaseRoute(undefined), "/");
  assert.equal(normalizeBaseRoute(""), "/");
  assert.equal(normalizeBaseRoute("/"), "/");
});

test("normalizeBaseRoute adds a leading slash and removes a trailing slash", () => {
  assert.equal(normalizeBaseRoute("x402-demo"), "/x402-demo");
  assert.equal(normalizeBaseRoute("/x402-demo/"), "/x402-demo");
  assert.equal(normalizeBaseRoute("nested/path/"), "/nested/path");
});

test("normalizeBaseRoute strips unsupported characters and collapses duplicate slashes", () => {
  assert.equal(normalizeBaseRoute("/x402-demo<script>/"), "/x402-demoscript");
  assert.equal(normalizeBaseRoute("//x402-demo///demo//"), "/x402-demo/demo");
});

test("resolveBaseRoute prefers runtime config over build-time config", () => {
  assert.equal(resolveBaseRoute("/x402-demo/", "/ignored/"), "/x402-demo");
});

test("resolveBaseRoute falls back to build-time config when runtime config is absent", () => {
  assert.equal(resolveBaseRoute(undefined, "x402-demo"), "/x402-demo");
  assert.equal(resolveBaseRoute(undefined, undefined), "/");
});

test("react-router matches app routes under the ingress basename", () => {
  const routes = [
    {
      id: "layout",
      children: [
        { index: true, id: "home" },
        { path: "try", id: "try" },
      ],
    },
  ];

  assert.deepEqual(
    matchRoutes(routes, "/x402-demo", "/x402-demo")?.map((match) => match.route.id),
    ["layout", "home"],
  );
  assert.deepEqual(
    matchRoutes(routes, "/x402-demo/try", "/x402-demo")?.map((match) => match.route.id),
    ["layout", "try"],
  );
  assert.equal(matchRoutes(routes, "/x402-demo", "/"), null);
});

test("docker entrypoint rewrites assets and injects the router basename for subpath deploys", () => {
  const tempDir = mkdtempSync("/tmp/x402-demo-client-test.");
  const indexHtml = join(tempDir, "index.html");

  writeFileSync(
    indexHtml,
    `<!doctype html>
<html lang="en">
  <head>
    <script type="module" crossorigin src="/assets/index.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index.css">
  </head>
  <body>
    <div id="root"></div>
    <script src="/config.js"></script>
  </body>
</html>
`,
  );

  execFileSync("sh", ["docker-entrypoint.sh"], {
    cwd: new URL("..", import.meta.url),
    env: {
      ...process.env,
      CONFIG_DIR: tempDir,
      VITE_BASE_ROUTE: "/x402-demo",
      VITE_SERVER_URL: "",
      VITE_APP_NAME: "x402 on Stellar",
      VITE_PAYMENT_PRICE: "0.01",
    },
  });

  const rewrittenHtml = readFileSync(indexHtml, "utf8");
  const runtimeConfig = readFileSync(join(tempDir, "config.js"), "utf8");

  assert.match(rewrittenHtml, /src="\/x402-demo\/assets\/index\.js"/);
  assert.match(rewrittenHtml, /href="\/x402-demo\/assets\/index\.css"/);
  assert.match(rewrittenHtml, /src="\/x402-demo\/config\.js"/);
  assert.match(runtimeConfig, /BASE_ROUTE: "\/x402-demo\/"/);
});
