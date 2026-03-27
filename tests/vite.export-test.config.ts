import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: resolve("src", "features", "circuit-editor", "exportCircuit.ts"),
      formats: ["es"],
      fileName: () => "exportCircuit.bundle.mjs",
    },
    outDir: resolve("tests", ".tmp"),
  },
});
