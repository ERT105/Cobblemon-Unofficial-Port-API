#!/usr/bin/env node
// Cobblemon Bedrock creator kit entry point. See README.md.
import path from "node:path";

const argv = process.argv;
const i = argv.indexOf("--cobblemon");
if (i >= 0 && argv[i + 1]) process.env.COOBLEMON_JAVA_ROOT = path.resolve(argv[i + 1]);
// `init` writes an empty add-on: it doesn't read the mod.
if (argv[2] === "init") {
  const { runInit } = await import("./kit-init.mjs");
  await runInit(argv.slice(3));
  process.exit(0);
}
if (!process.env.COOBLEMON_JAVA_ROOT) {
  console.error("Missing --cobblemon <folder>: the extracted Cobblemon .jar (the folder that contains assets/ and data/).");
  process.exit(1);
}
// After setting the mod folder: several modules read it when they load.
await import("./kit-core.mjs");
