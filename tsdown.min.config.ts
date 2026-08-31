import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    "index.min": "./src/index.ts"
  },
  format: "esm",
  dts: false,
  sourcemap: true,
  target: "es2022",
  platform: "neutral",
  outDir: "dist",
  clean: false,
  minify: true
});
