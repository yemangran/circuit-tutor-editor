import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { build } from "esbuild";

const outfile = resolve(
  "tests",
  ".tmp",
  "exportCircuit.bundle.mjs",
);

await mkdir(dirname(outfile), { recursive: true });

await build({
  entryPoints: [resolve("src", "features", "circuit-editor", "exportCircuit.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile,
  sourcemap: false,
  target: ["node18"],
});
