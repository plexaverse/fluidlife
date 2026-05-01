import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    globals: false,
    include: ["src/**/*.test.ts", "src/**/__tests__/**/*.test.ts"],
    setupFiles: ["src/__tests__/setup.ts"],
  },
});
