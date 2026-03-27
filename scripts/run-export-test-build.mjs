import { resolve } from "node:path";
import { build } from "vite";

await build({
  configFile: false,
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
