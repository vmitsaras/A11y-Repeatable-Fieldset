import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        url: "https://example.test/"
      }
    },
    include: [
      "test/**/*.test.ts"
    ],
    setupFiles: [
      "./test/setup.ts"
    ],
    globals: false,
    isolate: true,
    clearMocks: true,
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true
  }
});
