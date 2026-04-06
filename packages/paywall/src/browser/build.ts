import { htmlPlugin } from "@craftamap/esbuild-plugin-html";
import esbuild from "esbuild";
import fs from "fs";
import path from "path";
import { getBaseTemplate } from "./baseTemplate";

const DIST_DIR = "src/browser/dist";
const OUTPUT_HTML = path.join(DIST_DIR, "stellar-paywall.html");
const OUTPUT_TS = path.join("src", "gen", "template.ts");

const options: esbuild.BuildOptions = {
  entryPoints: ["src/browser/entry.tsx", "src/browser/styles.css"],
  bundle: true,
  metafile: true,
  outdir: DIST_DIR,
  treeShaking: true,
  minify: true,
  format: "iife",
  sourcemap: false,
  platform: "browser",
  target: "es2020",
  jsx: "automatic",
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? "production"),
    global: "globalThis",
    Buffer: "globalThis.Buffer",
  },
  mainFields: ["browser", "module", "main"],
  conditions: ["browser"],
  plugins: [
    htmlPlugin({
      files: [
        {
          entryPoints: ["src/browser/entry.tsx", "src/browser/styles.css"],
          filename: "stellar-paywall.html",
          title: "Payment Required",
          scriptLoading: "module",
          inline: {
            css: true,
            js: true,
          },
          htmlTemplate: getBaseTemplate(),
        },
      ],
    }),
  ],
  inject: ["./src/browser/buffer-polyfill.ts"],
  external: ["crypto"],
};

/**
 * Builds the Stellar paywall HTML template with bundled JS and CSS.
 * Generates src/gen/template.ts which is imported by the server-side handler.
 */
async function build() {
  try {
    if (!fs.existsSync(DIST_DIR)) {
      fs.mkdirSync(DIST_DIR, { recursive: true });
    }

    const genDir = path.dirname(OUTPUT_TS);
    if (!fs.existsSync(genDir)) {
      fs.mkdirSync(genDir, { recursive: true });
    }

    await esbuild.build(options);
    console.log("[Stellar] Build completed successfully!");

    if (fs.existsSync(OUTPUT_HTML)) {
      const html = fs.readFileSync(OUTPUT_HTML, "utf8");

      const tsContent = `// THIS FILE IS AUTO-GENERATED - DO NOT EDIT
/**
 * The pre-built Stellar paywall template with inlined CSS and JS
 */
export const STELLAR_PAYWALL_TEMPLATE = ${JSON.stringify(html)};
`;

      fs.writeFileSync(OUTPUT_TS, tsContent);
      console.log(`[Stellar] Generated template.ts (${(html.length / 1024 / 1024).toFixed(2)} MB)`);
    } else {
      throw new Error(`Stellar bundled HTML not found at ${OUTPUT_HTML}`);
    }
  } catch (error) {
    console.error("[Stellar] Build failed:", error);
    process.exit(1);
  }
}

build();
