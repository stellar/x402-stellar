import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const port = Number(env.VITE_PORT) || 5173;

  return {
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          // Use hex hashes (lowercase-only) so filenames survive Cloudflare's
          // lowercase redirect without a second 404.
          hashCharacters: "hex",
        },
      },
    },
    server: {
      port,
      proxy: {
        "/api": {
          target: "http://localhost:3001",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  };
});
