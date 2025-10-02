import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  base: "./", // ← これ超重要（相対パス）
  plugins: [
    react(),
    viteSingleFile({ removeViteModuleLoader: true }),
  ],
  build: {
    cssCodeSplit: false,
    assetsInlineLimit: 100000000, // だいたい全部インライン化
    target: "es2018",
    sourcemap: false,
  },
});

