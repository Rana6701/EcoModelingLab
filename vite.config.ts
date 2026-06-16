import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vitest config is merged here via the `test` field.
export default defineConfig({
  plugins: [react()],
  base: "/",
  test: {
    globals: true,
    environment: "node",
    include: ["src/tests/**/*.test.ts"],
  },
});
