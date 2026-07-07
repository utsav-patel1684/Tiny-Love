import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import dotenv from "dotenv"
dotenv.config()

const rawPort = 8080;
const port = Number(rawPort);

const basePath = "/";

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),

    ...(process.env.NODE_ENV !== "production" &&
      process.env.REPL_ID !== undefined
      ? []
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
  server: {
    port,
    host: "0.0.0.0",
    strictPort: true,
    allowedHosts: true,
  },

  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});