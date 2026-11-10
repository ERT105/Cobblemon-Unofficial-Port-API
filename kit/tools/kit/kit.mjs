#!/usr/bin/env node
// Entrada del kit de creador de Cobblemon Bedrock. Ver README.md.
import path from "node:path";

const argv = process.argv;
const i = argv.indexOf("--cobblemon");
if (i >= 0 && argv[i + 1]) process.env.COOBLEMON_JAVA_ROOT = path.resolve(argv[i + 1]);
if (!process.env.COOBLEMON_JAVA_ROOT) {
  console.error("Falta --cobblemon <carpeta>: el .jar de Cobblemon extraído (la que tiene assets/ y data/).");
  process.exit(1);
}
// Después de fijar la carpeta del mod: varias librerías la piden al cargarse.
await import("./kit-core.mjs");
