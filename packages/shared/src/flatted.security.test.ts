/**
 * Security regression test for CVE-2026-32141 / GHSA-25h7-pfq9-p65f
 *
 * flatted < 3.4.0 is vulnerable to unbounded recursion DoS in parse().
 * A crafted payload with deeply nested indices causes a stack overflow,
 * crashing the Node.js process.
 *
 * Fix: flatted >= 3.4.0 (iterative revive loop, not recursive).
 * Dependency path: eslint > file-entry-cache > flat-cache > flatted
 */
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = join(__dirname, "..", "..", "..");

function findFlattedPackageJson(): string {
  const result = execFileSync(
    "find",
    [
      join(WORKSPACE_ROOT, "node_modules", ".pnpm"),
      "-maxdepth",
      "4",
      "-name",
      "package.json",
      "-path",
      "*/flatted/package.json",
    ],
    { encoding: "utf-8" },
  )
    .trim()
    .split("\n")[0];

  assert.ok(result, "flatted package not found in node_modules/.pnpm");
  return result;
}

test("flatted installed version is >= 3.4.0 (CVE-2026-32141 fix)", () => {
  const pkgPath = findFlattedPackageJson();
  const { version } = JSON.parse(readFileSync(pkgPath, "utf-8")) as {
    version: string;
  };

  const [major, minor] = version.split(".").map(Number);
  const isPatched = major > 3 || (major === 3 && minor >= 4);

  assert.ok(
    isPatched,
    `flatted@${version} is vulnerable to CVE-2026-32141 (GHSA-25h7-pfq9-p65f) — upgrade to >= 3.4.0`,
  );
});

test("flatted parse() does not stack-overflow on crafted deep-recursion payload (CVE-2026-32141 PoC)", () => {
  // Run the PoC from the advisory as a child process so a crash doesn't take
  // down the test runner.  The script exits 0 on success, non-zero on crash.
  const poc = `
    const flatted = require('flatted');
    const depth = 20000;
    const arr = new Array(depth + 1);
    arr[0] = '{"a":"1"}';
    for (let i = 1; i <= depth; i++) {
      arr[i] = JSON.stringify({ a: String(i + 1) });
    }
    arr[depth] = '{"a":"leaf"}';
    flatted.parse(JSON.stringify(arr));
    process.stdout.write('ok');
  `;

  let output: string;
  try {
    output = execFileSync("node", ["-e", poc], {
      cwd: WORKSPACE_ROOT,
      timeout: 10_000,
      encoding: "utf-8",
    });
  } catch {
    assert.fail(
      "flatted.parse() crashed (stack overflow) — CVE-2026-32141 is not patched",
    );
  }

  assert.equal(output.trim(), "ok");
});
