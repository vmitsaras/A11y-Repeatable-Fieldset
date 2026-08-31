import { defineConfig } from "tsdown";

const sharedConfig = {
  format: "esm" as const,
  dts: {
    sourcemap: true
  },
  sourcemap: true,
  target: "es2022",
  platform: "neutral" as const,
  outDir: "dist"
};

export default defineConfig([
  {
    ...sharedConfig,
    entry: {
      index: "./src/index.ts"
    },
    clean: true,
    copy: [
      {
        from: "src/styles.css",
        to: "dist"
      }
    ]
  },
  {
    ...sharedConfig,
    entry: {
      docs: "./src/docs.ts"
    },
    clean: false
  },
  {
    ...sharedConfig,
    entry: {
      "addons/validation-bridge":
        "./src/addons/validation-bridge.ts"
    },
    clean: false
  },
  {
    ...sharedConfig,
    entry: {
      "addons/legend-sync": "./src/addons/legend-sync.ts"
    },
    clean: false
  },
  {
    ...sharedConfig,
    entry: {
      "addons/remove-guard": "./src/addons/remove-guard.ts"
    },
    clean: false
  },
  {
    ...sharedConfig,
    entry: {
      "addons/accessible-reorder":
        "./src/addons/accessible-reorder.ts"
    },
    clean: false
  },
  {
    ...sharedConfig,
    entry: {
      "addons/duplicate-item":
        "./src/addons/duplicate-item.ts"
    },
    clean: false
  },
  {
    ...sharedConfig,
    entry: {
      "addons/undo-remove":
        "./src/addons/undo-remove.ts"
    },
    clean: false
  },
  {
    ...sharedConfig,
    entry: {
      "addons/form-memory-bridge":
        "./src/addons/form-memory-bridge.ts"
    },
    clean: false
  }
]);
