// tools/render-pokemon-sprites.ts
import { spawnSync } from "node:child_process";
import { existsSync as existsSync2, readdirSync as readdirSync2 } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path2 from "node:path";
import puppeteer from "puppeteer-core";

// tools/lib/animated-sprites.ts
var SHEET_FPS = 16;
var SHEET_MAX_FRAMES = 96;
var SHEET_COLS = 10;
var SHEET_FRAME_SIZE = 192;
var SHEET_LOOPS = [1, 2, 3, 4, 6, 8];
function sheetFrames(loop) {
  return Math.min(SHEET_MAX_FRAMES, Math.round(loop * SHEET_FPS));
}
var SUMMARY_FRAME = { cx: 0, cy: -(33 + 10) / 40, halfH: 33 / 40 };

// tools/lib/utils.ts
import { existsSync, mkdirSync, readdirSync } from "node:fs";

// bp/src/config/retiredFeatures.ts
var TERA_FEATURE = true;
var MEGA_SHOWDOWN_COMPONENT_IDS = [
  // Bloques.
  "cooblemon:rotom_appliance",
  "cooblemon:pedestal",
  "cooblemon:reassembly_unit",
  "cooblemon:max_mushroom_crop",
  // Ítems.
  "cooblemon:max_mushroom",
  "cooblemon:max_soup",
  "cooblemon:dynamax_candy",
  // El de los fragmentos solo sigue aquí si la Teracristalización está
  // apagada: es suyo, no de Mega Showdown, y con la mecánica encendida tiene
  // que registrarse o usar un fragmento no haría nada.
  ...TERA_FEATURE ? [] : ["cooblemon:tera_shard"],
  // La bolsa sí se queda fuera: su modelo venía de Mega Showdown y no se
  // genera ningún objeto que la use.
  "cooblemon:tera_pouch",
  "cooblemon:likos_pendant",
  "cooblemon:form_key"
];

// tools/lib/utils.ts
import path from "node:path";
import { fileURLToPath } from "node:url";
var ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
function resolveFromRoot(relativePath) {
  if (path.isAbsolute(relativePath)) return relativePath;
  return path.join(ROOT, relativePath);
}
var COBBLEMON_JAVA_LEGACY_PREFIX = "recursos/cobblemon-fabric-1.7.3+1.21.1";
var COBBLEMON_JAVA_CANDIDATES = [
  /**
   * **El repositorio del mod va primero**, y por eso lleva la ruta de dentro.
   *
   * Un clon de Cobblemon no guarda los recursos donde los guarda su JAR: están
   * en `common/src/main/resources`, así que la carpeta `recursos/cobblemon`
   * tal cual **no encajaba con el marcador** y se caía de esta lista sin que
   * nadie lo notara. El resultado era el mismo fallo que la nota de abajo
   * cuenta de la 1.7.3, pero peor de ver: se podía actualizar el repositorio a
   * una versión nueva y seguir generando el pack entero desde el JAR viejo,
   * porque la única pista de qué versión se estaba portando era el nombre de
   * una carpeta.
   *
   * Comprobado contra el JAR de la 1.8.2: el árbol del repositorio tiene todo
   * lo que piden los generadores —especies, pools, posers, animaciones,
   * texturas, modelos, sonidos, worldgen, recetas— y en igual o mayor número.
   * Los otros módulos (`fabric/`, `neoforge/`) no traen recursos del juego.
   */
  "recursos/cobblemon/common/src/main/resources",
  // La versión que se porta va primero, con o sin número en el nombre de la
  // carpeta. Antes encabezaba la lista la ruta 1.7.3, así que bastaba con
  // tenerla extraída para que todo el pack se generase desde la versión vieja
  // sin avisar.
  "recursos/coblemon",
  "recursos/coblemon_1.8",
  COBBLEMON_JAVA_LEGACY_PREFIX,
  "recursos/cobblemon"
];
function cobblemonSpeciesMarker(root) {
  return path.join(root, "data", "cobblemon", "species");
}
function resolveCobblemonJavaRoot() {
  const envRoot = process.env.COOBLEMON_JAVA_ROOT?.trim();
  if (envRoot) {
    const full = path.isAbsolute(envRoot) ? envRoot : resolveFromRoot(envRoot);
    if (existsSync(cobblemonSpeciesMarker(full))) return full;
  }
  for (const candidate of COBBLEMON_JAVA_CANDIDATES) {
    const full = resolveFromRoot(candidate);
    if (existsSync(cobblemonSpeciesMarker(full))) return full;
  }
  const searched = COBBLEMON_JAVA_CANDIDATES.map((c) => `  - ${c}`).join("\n");
  throw new Error(
    [
      "No se encontro el mod Java extraido. Se busco en:",
      searched,
      "Extrae el JAR de Cobblemon en recursos/coblemon/ o define COOBLEMON_JAVA_ROOT."
    ].join("\n")
  );
}
function cobblemonJava(relativePath) {
  return path.join(resolveCobblemonJavaRoot(), ...relativePath.replace(/\\/g, "/").split("/"));
}
function resolveAllTheMonsRoot() {
  return null;
}
function allTheMonsJava(relativePath) {
  const root = resolveAllTheMonsRoot();
  if (!root) return null;
  return path.join(root, ...relativePath.replace(/\\/g, "/").split("/"));
}
function logStep(message) {
  console.log(`[cooblemon] ${message}`);
}
function logWarn(message) {
  console.warn(`[cooblemon] ${message}`);
}

// tools/render-pokemon-sprites.ts
var EDGE_PATH = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
var LOCAL_BROWSERS = resolveFromRoot("tmp/browsers");
function findLocalHeadlessShell(dir, depth = 0) {
  if (depth > 5 || !existsSync2(dir)) return null;
  for (const entry of readdirSync2(dir, { withFileTypes: true })) {
    const full = path2.join(dir, entry.name);
    if (entry.isFile() && entry.name === "chrome-headless-shell.exe") return full;
    if (entry.isDirectory()) {
      const found = findLocalHeadlessShell(full, depth + 1);
      if (found) return found;
    }
  }
  return null;
}
function resolveBrowserPath() {
  return process.env.SPRITE_BROWSER ?? findLocalHeadlessShell(LOCAL_BROWSERS) ?? EDGE_PATH;
}
var DEFAULT_SPECIES = [
  "bulbasaur",
  "charizard",
  "pikachu",
  "meowth",
  "gengar",
  "gyarados",
  "snorlax",
  "dragonite",
  "lugia",
  "lucario",
  "greninja",
  "dragapult"
];
var SPRITE_SCALE = 2;
var TARGETS = [
  { name: "dex", width: 139 * SPRITE_SCALE, height: 69 * SPRITE_SCALE, yaw: 145 },
  { name: "pc", width: 66 * SPRITE_SCALE, height: 66 * SPRITE_SCALE, yaw: 215 },
  // Vista previa del menú de inicial: solo los 27 iniciales, a más resolución.
  { name: "starter", width: 256, height: 256, yaw: 215 },
  { name: "preview", width: 256, height: 256, yaw: 145 },
  /**
   * Retrato de combate: el hueco de 28×26 del marco de PS.
   *
   * A diferencia del resto, no usa el marco común de `frame.json`: encuadra el
   * hueso de la cabeza de cada especie, porque a tamaño de icono el cuerpo
   * entero no se distingue.
   */
  { name: "face", width: 28 * 4, height: 26 * 4, yaw: 180, pitch: 0, face: true, faceMargin: 0.22 }
];
var speciesBaseScales = null;
async function baseScaleOf(speciesId) {
  if (!speciesBaseScales) {
    speciesBaseScales = /* @__PURE__ */ new Map();
    for (const root of ASSET_ROOTS) {
      const dir = path2.join(root, "..", "..", "data", path2.basename(root), "species");
      if (!existsSync2(dir)) continue;
      const walk = async (d) => {
        for (const entry of await readdir(d, { withFileTypes: true })) {
          const full = path2.join(d, entry.name);
          if (entry.isDirectory()) await walk(full);
          else if (entry.name.endsWith(".json")) {
            const data = await tryReadJson(full);
            if (data && typeof data.baseScale === "number") speciesBaseScales.set(entry.name.slice(0, -5), data.baseScale);
          }
        }
      };
      await walk(dir);
    }
  }
  return speciesBaseScales.get(speciesId) ?? 1;
}
var FRAME_FILE = resolveFromRoot("tools/sprite-render/frame.json");
function parseArgs() {
  const argv = process.argv.slice(2);
  const get = (flag) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : void 0;
  };
  return {
    species: (get("--species")?.split(",") ?? DEFAULT_SPECIES).map((s) => s.trim()).filter(Boolean),
    out: path2.resolve(get("--out") ?? resolveFromRoot("tmp/sprite-preview")),
    compare: argv.includes("--compare"),
    calibrate: argv.includes("--calibrate"),
    fit: argv.includes("--fit"),
    manifest: get("--manifest"),
    skipExisting: argv.includes("--skip-existing"),
    yaw: get("--yaw") !== void 0 ? Number(get("--yaw")) : void 0,
    pitch: get("--pitch") !== void 0 ? Number(get("--pitch")) : void 0,
    animSheet: get("--anim-sheet"),
    animJobs: get("--anim-jobs"),
    workers: Math.max(1, Number(get("--workers") ?? 1)),
    sheetSpec: get("--sheet-spec"),
    assetRoots: argv.flatMap((a, i) => a === "--asset-root" && argv[i + 1] ? [path2.resolve(argv[i + 1])] : [])
  };
}
async function expandSpecies(list) {
  if (!(list.length === 1 && list[0] === "all")) return list;
  const ids = /* @__PURE__ */ new Set();
  for (const root of ASSET_ROOTS) {
    const dir = path2.join(root, "bedrock/pokemon/resolvers");
    if (!existsSync2(dir)) continue;
    for (const entry of await readdir(dir)) {
      if (/^\d+_/.test(entry)) ids.add(entry.replace(/^\d+_/, ""));
    }
  }
  return [...ids].sort();
}
function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
}
function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] : 0;
}
function stdev(values) {
  const mean = values.reduce((a, b) => a + b, 0) / Math.max(values.length, 1);
  return Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(values.length, 1));
}
var ASSET_ROOTS = [cobblemonJava("assets/cobblemon"), allTheMonsJava("assets/cobblemon")].filter(
  (root) => typeof root === "string" && existsSync2(root)
);
async function speciesFolder(kind, speciesId) {
  for (const root of ASSET_ROOTS) {
    const dir = path2.join(root, "bedrock/pokemon", kind);
    if (!existsSync2(dir)) continue;
    for (const entry of await readdir(dir)) {
      if (entry.replace(/^\d+_/, "") === speciesId) return path2.join(dir, entry);
    }
  }
  return null;
}
async function readJson(file) {
  return JSON.parse((await readFile(file, "utf8")).replace(/^﻿/, ""));
}
async function jsonFiles(dir) {
  if (!existsSync2(dir)) return [];
  return (await readdir(dir)).filter((f) => f.endsWith(".json")).map((f) => path2.join(dir, f));
}
function textureRef(texture) {
  return typeof texture === "string" ? texture : texture?.frames?.[0];
}
function assetPath(ref) {
  const rel = ref.split(":").pop();
  return ASSET_ROOTS.map((root) => path2.join(root, rel)).find((p) => existsSync2(p));
}
async function tryReadJson(file) {
  try {
    return await readJson(file);
  } catch {
    return null;
  }
}
async function resolveBaseAssets(speciesId, aspects = []) {
  const resolverDir = await speciesFolder("resolvers", speciesId);
  if (!resolverDir) return null;
  const dex = path2.basename(resolverDir).split("_")[0];
  const resolvers = (await Promise.all(
    (await jsonFiles(resolverDir)).map((f) => tryReadJson(f))
  )).filter((r) => r !== null);
  resolvers.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const wanted = new Set(aspects);
  let model;
  let texture;
  let poser;
  let rawLayers;
  for (const resolver of resolvers) {
    for (const variation of resolver.variations ?? []) {
      if (!(variation.aspects ?? []).every((aspect) => wanted.has(aspect))) continue;
      if (variation.model) model = variation.model;
      const ref = textureRef(variation.texture);
      if (ref) texture = ref;
      if (variation.poser) poser = variation.poser;
      if (variation.layers) rawLayers = variation.layers;
    }
  }
  const layers = [];
  for (const layer of rawLayers ?? []) {
    const ref = typeof layer.texture === "string" ? layer.texture : layer.texture?.frames?.[0];
    const file = ref ? assetPath(ref) : void 0;
    if (file) layers.push({ texture: file, emissive: Boolean(layer.emissive), translucent: Boolean(layer.translucent) });
  }
  if (!model || !texture) return null;
  const modelFile = `${model.split(":").pop()}.json`;
  let geo = null;
  const modelDir = await speciesFolder("models", speciesId);
  if (modelDir && existsSync2(path2.join(modelDir, modelFile))) geo = path2.join(modelDir, modelFile);
  if (!geo) {
    for (const root of ASSET_ROOTS) {
      const modelsRoot = path2.join(root, "bedrock/pokemon/models");
      if (!existsSync2(modelsRoot)) continue;
      for (const folder of await readdir(modelsRoot)) {
        const candidate = path2.join(modelsRoot, folder, modelFile);
        if (existsSync2(candidate)) {
          geo = candidate;
          break;
        }
      }
      if (geo) break;
    }
  }
  const textureRel = texture.split(":").pop();
  const texturePath = ASSET_ROOTS.map((root) => path2.join(root, textureRel)).find((p) => existsSync2(p));
  if (!geo || !texturePath) return null;
  let poserPath = null;
  const ownName = poser?.split(":").pop() ?? null;
  const kotlinKey = ownName ? ownName.replace(/_/g, "") : null;
  const ownKotlin = ownName && ownName !== speciesId && kotlinKey ? await kotlinPoser(kotlinKey) : null;
  const poserDir = await speciesFolder("posers", speciesId);
  if (poserDir) {
    const poserName = `${ownName ?? speciesId}.json`;
    const exact = path2.join(poserDir, poserName);
    const candidates = existsSync2(exact) || !ownKotlin ? [exact, ...await jsonFiles(poserDir)] : [];
    for (const candidate of candidates) {
      if (!existsSync2(candidate)) continue;
      const data = await tryReadJson(candidate);
      if (data?.poses) {
        poserPath = candidate;
        break;
      }
    }
  }
  return {
    dex,
    geo,
    texture: texturePath,
    poser: poserPath,
    kotlinPoser: !poserPath && ownKotlin ? kotlinKey : null,
    layers
  };
}
var kotlinPosers = null;
async function kotlinPoser(speciesId) {
  if (kotlinPosers === null) {
    const file = resolveFromRoot("data/kotlin-posers.generated.json");
    kotlinPosers = existsSync2(file) ? await readJson(file) : {};
  }
  return kotlinPosers[speciesId] ?? null;
}
async function readPortraitPose(poserPath, speciesId) {
  const empty = { animation: null, hidden: [], moved: {}, profile: null };
  if (!poserPath) {
    const kotlin = await kotlinPoser(speciesId);
    if (!kotlin) return empty;
    const profile2 = kotlin.profileScale !== void 0 ? { scale: kotlin.profileScale, translation: kotlin.profileTranslation ?? [0, 0, 0] } : null;
    return { animation: kotlin.animation, hidden: kotlin.hidden, moved: {}, profile: profile2 };
  }
  const poser = await readJson(poserPath);
  const profile = typeof poser.profileScale === "number" ? { scale: poser.profileScale, translation: poser.profileTranslation ?? [0, 0, 0] } : null;
  const poses = Object.values(poser.poses ?? {});
  let chosen;
  for (const wanted of ["PROFILE", "PORTRAIT", "STAND", "NONE"]) {
    chosen = poses.find((pose) => (pose.poseTypes ?? []).includes(wanted) && !pose.isBattle);
    if (chosen) break;
  }
  if (!chosen) return { ...empty, profile };
  let animation = null;
  for (const expr of chosen.animations ?? []) {
    const match = /bedrock\(\s*'([^']+)'\s*,\s*'([^']+)'/.exec(String(expr));
    if (match) {
      animation = { species: match[1], name: match[2] };
      break;
    }
  }
  const hidden = [];
  const moved = {};
  for (const part of chosen.transformedParts ?? []) {
    if (!part.part) continue;
    if (part.isVisible === false || part.visible === false) hidden.push(part.part);
    else if (part.position || part.rotation) moved[part.part] = { position: part.position, rotation: part.rotation };
  }
  return { animation, hidden, moved, profile };
}
async function loadPoseBones(speciesId, wanted) {
  const folders = [
    wanted ? await speciesFolder("animations", wanted.species) : null,
    await speciesFolder("animations", speciesId)
  ].filter((f) => Boolean(f));
  const preferred = wanted ? [`animation.${wanted.species}.${wanted.name}`] : [];
  const fallbackSuffixes = [
    ".profile",
    ".portrait",
    ".ground_idle",
    ".battle_idle",
    ".air_idle",
    ".water_idle",
    ".render"
  ];
  for (const folder of folders) {
    for (const file of (await readdir(folder)).filter((f) => f.endsWith(".animation.json"))) {
      const full = path2.join(folder, file);
      const data = await readJson(full);
      const animations = data.animations ?? {};
      for (const name of preferred) {
        if (animations[name]) {
          const a = animations[name];
          return { bones: a.bones ?? {}, file: full, name, length: a.animation_length ?? null };
        }
      }
    }
  }
  for (const folder of folders) {
    for (const file of (await readdir(folder)).filter((f) => f.endsWith(".animation.json"))) {
      const full = path2.join(folder, file);
      const data = await readJson(full);
      const animations = data.animations ?? {};
      for (const suffix of fallbackSuffixes) {
        const name = Object.keys(animations).find((k) => k.endsWith(suffix));
        if (name) {
          const a = animations[name];
          return { bones: a.bones ?? {}, file: full, name, length: a.animation_length ?? null };
        }
      }
    }
  }
  return { bones: {}, file: null, name: null, length: null };
}
async function calibrateFrame(species, buildInput, callRenderer) {
  const combos = [
    { ySign: 1, baseSign: 1 },
    { ySign: 1, baseSign: -1 },
    { ySign: -1, baseSign: 1 },
    { ySign: -1, baseSign: -1 }
  ];
  const samples = combos.map(() => []);
  for (const id of species) {
    const built = await buildInput(id);
    if (!built?.pose.profile) continue;
    for (const [i, combo] of combos.entries()) {
      const bounds = await callRenderer({
        ...built.input,
        measure: true,
        profile: { ...built.pose.profile, ...combo }
      });
      if (Number.isFinite(bounds.minX)) samples[i].push(bounds);
    }
  }
  const scored = combos.map((combo, i) => {
    const list = samples[i];
    const cxs = list.map((b) => (b.minX + b.maxX) / 2);
    const cys = list.map((b) => (b.minY + b.maxY) / 2);
    return { combo, list, score: stdev(cxs) + stdev(cys), cx: median(cxs), cy: median(cys) };
  });
  for (const s of scored) {
    logStep(
      `  ySign ${s.combo.ySign}, baseSign ${s.combo.baseSign}: dispersi\xF3n ${s.score.toFixed(3)} (${s.list.length} especies, centro ${s.cx.toFixed(2)}, ${s.cy.toFixed(2)})`
    );
  }
  const best = scored.sort((a, b) => a.score - b.score)[0];
  const frames = {};
  for (const target of TARGETS) {
    const aspect = target.width / target.height;
    const needed = best.list.map(
      (b) => Math.max(
        Math.abs(b.maxY - best.cy),
        Math.abs(b.minY - best.cy),
        Math.max(Math.abs(b.maxX - best.cx), Math.abs(b.minX - best.cx)) / aspect
      )
    );
    frames[target.name] = { cx: best.cx, cy: best.cy, halfH: percentile(needed, 0.9) * 1.06 };
  }
  const config = { ...best.combo, frames };
  await writeFile(FRAME_FILE, `${JSON.stringify(config, null, 2)}
`, "utf8");
  logStep(`Marco calibrado con ${best.list.length} especies \u2192 ${FRAME_FILE}`);
}
function loopLength(length, bones) {
  const fit = (seconds) => SHEET_LOOPS.find((l) => l >= seconds - 1e-3) ?? SHEET_LOOPS[SHEET_LOOPS.length - 1];
  if (length && length > 0) return fit(length);
  const text = JSON.stringify(bones).toLowerCase();
  const speeds = [];
  for (const m of text.matchAll(/anim_time\s*(?:[+-]\s*[\d.]+\s*)?\)*\s*((?:[*/]\s*[\d.]+\s*)+)/g)) {
    let speed = 1;
    for (const [, op, value] of m[1].matchAll(/([*/])\s*([\d.]+)/g)) {
      const n = Number(value);
      if (!Number.isFinite(n) || n === 0) continue;
      speed = op === "*" ? speed * n : speed / n;
    }
    if (speed >= 1) speeds.push(speed);
  }
  if (speeds.length === 0) return SHEET_LOOPS[0];
  const miss = (l) => speeds.reduce((sum, deg) => sum + Math.abs(deg * l / 360 - Math.round(deg * l / 360)), 0);
  const exact = SHEET_LOOPS.find((l) => miss(l) < 1e-3);
  if (exact) return exact;
  return [...SHEET_LOOPS].sort((x, y) => miss(x) / x - miss(y) / y || y - x)[0];
}
async function renderAnimSheets(args, species, buildInput, frameConfig, newRenderer) {
  const outDir = path2.resolve(args.animSheet);
  await mkdir(outDir, { recursive: true });
  const metaFile = path2.join(outDir, "sheets.json");
  const meta = existsSync2(metaFile) ? await readJson(metaFile) : {};
  const pc = TARGETS.find((t) => t.name === "pc");
  const spec = args.sheetSpec ? await readJson(path2.resolve(args.sheetSpec)) : null;
  const target = spec ? { name: "pc", width: spec.width, height: spec.height, yaw: spec.yaw, pitch: spec.pitch } : { ...pc, width: SHEET_FRAME_SIZE, height: SHEET_FRAME_SIZE };
  const sheetFrame = spec?.frame ?? SUMMARY_FRAME;
  const cols = spec?.cols ?? SHEET_COLS;
  let jobs;
  if (args.animJobs) {
    jobs = await readJson(path2.resolve(args.animJobs));
  } else {
    jobs = [];
    for (const id of species) {
      const built = await buildInput(id);
      if (built) jobs.push({ name: `${built.assets.dex}_${id}`, species: id });
    }
  }
  const pending = jobs.filter((job) => !meta[job.name]);
  logStep(`Hojas animadas: ${jobs.length - pending.length} hechas, ${pending.length} por hacer, ${args.workers} pesta\xF1as`);
  let saving = Promise.resolve();
  const saveMeta = () => {
    saving = saving.then(() => writeFile(metaFile, `${JSON.stringify(meta, null, 1)}
`, "utf8"));
    return saving;
  };
  let done = 0;
  const started = Date.now();
  const queue = [...pending];
  const worker = async () => {
    const render = await newRenderer();
    for (let job = queue.shift(); job; job = queue.shift()) {
      try {
        const built = await buildInput(job.species, job.aspects ?? []);
        if (!built) {
          logWarn(`Sin modelo/textura para ${job.name}`);
          continue;
        }
        const loop = spec?.still ? 0 : loopLength(built.anim.length, built.anim.bones);
        const count = spec?.still ? 1 : sheetFrames(loop);
        const times = Array.from({ length: count }, (_, k) => k * loop / count);
        const framed = frameConfig && built.pose.profile;
        const result = await render({
          ...built.input,
          sheet: { target, times, cols, silhouette: spec?.silhouette },
          ...spec?.none ? { none: { baseScale: await baseScaleOf(job.species) }, frames: { pc: sheetFrame } } : framed ? {
            profile: { ...built.pose.profile, ySign: frameConfig.ySign, baseSign: frameConfig.baseSign },
            frames: { pc: sheetFrame }
          } : {}
        });
        if (result.distinct > 1 || spec?.still) {
          await writeFile(path2.join(outDir, `${job.name}.png`), Buffer.from(result.sheet.split(",")[1], "base64"));
        }
        meta[job.name] = { loop, distinct: result.distinct, animation: built.anim.name };
        await saveMeta();
      } catch (error) {
        logWarn(`Fallo al renderizar ${job.name}: ${String(error)}`);
      }
      done++;
      if (done % 25 === 0 || queue.length === 0) {
        const perJob = (Date.now() - started) / done;
        logStep(`  ${done}/${pending.length} (quedan ~${Math.round(perJob * queue.length / 6e4)} min)`);
      }
    }
  };
  await Promise.all(Array.from({ length: args.workers }, () => worker()));
  await saving;
}
function serveRendererAssets() {
  const appDir = resolveFromRoot("tools/sprite-render");
  const threeDir = resolveFromRoot("node_modules/three/build");
  const server = http.createServer(async (req, res) => {
    const url = decodeURIComponent((req.url ?? "/").split("?")[0]);
    let file = null;
    if (url.startsWith("/app/")) file = path2.join(appDir, url.slice(5));
    else if (url.startsWith("/three/")) file = path2.join(threeDir, url.slice(7));
    if (!file || !existsSync2(file)) {
      res.writeHead(404).end();
      return;
    }
    const type = file.endsWith(".html") ? "text/html" : "text/javascript";
    res.writeHead(200, { "content-type": `${type}; charset=utf-8` });
    res.end(await readFile(file));
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}
async function main() {
  const args = parseArgs();
  ASSET_ROOTS.unshift(...args.assetRoots.filter((root) => existsSync2(root)));
  await mkdir(args.out, { recursive: true });
  const server = await serveRendererAssets();
  const port = server.address().port;
  const browserPath = resolveBrowserPath();
  logStep(`Navegador: ${browserPath}`);
  const browser = await puppeteer.launch({
    executablePath: browserPath,
    headless: true,
    // Perfil propio por ejecución: con Edge ya abierto, una instancia que
    // comparte perfil se entrega a la existente y sale con código 0 sin
    // renderizar nada.
    userDataDir: path2.join(os.tmpdir(), `cooblemon-sprite-render-${process.pid}`),
    args: [
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
      "--no-sandbox",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-extensions"
    ]
  });
  try {
    const page = await browser.newPage();
    page.on("console", (msg) => {
      if (msg.type() === "error") logWarn(`[navegador] ${msg.text()}`);
    });
    page.on("pageerror", (err) => logWarn(`[navegador] ${String(err)}`));
    await page.goto(`http://127.0.0.1:${port}/app/render.html`);
    await page.waitForFunction(() => globalThis.rendererReady === true, {
      timeout: 3e4
    });
    const species = await expandSpecies(args.species);
    const frameConfig = !args.fit && !args.calibrate && existsSync2(FRAME_FILE) ? await readJson(FRAME_FILE) : null;
    const buildInput = async (speciesId, aspects = []) => {
      const assets = await resolveBaseAssets(speciesId, aspects);
      if (!assets) return null;
      const pose = await readPortraitPose(assets.poser, assets.kotlinPoser ?? speciesId);
      const anim = await loadPoseBones(speciesId, pose.animation);
      const poseBones = { ...anim.bones };
      for (const [part, transform] of Object.entries(pose.moved)) {
        poseBones[part] = { ...poseBones[part] ?? {}, ...transform };
      }
      const toDataUrl = async (file) => `data:image/png;base64,${(await readFile(file)).toString("base64")}`;
      const layers = await Promise.all(
        assets.layers.map(async (layer) => ({ ...layer, texture: await toDataUrl(layer.texture) }))
      );
      return {
        assets,
        pose,
        anim,
        input: {
          geo: await readJson(assets.geo),
          texture: await toDataUrl(assets.texture),
          layers,
          poseBones,
          hidden: pose.hidden,
          targets: TARGETS,
          yaw: args.yaw,
          pitch: args.pitch
        }
      };
    };
    const callRenderer = (payload) => page.evaluate(
      (p) => globalThis.renderSprite(p),
      payload
    );
    if (args.calibrate) {
      await calibrateFrame(species, buildInput, callRenderer);
      return;
    }
    if (args.animSheet) {
      await renderAnimSheets(args, species, buildInput, frameConfig, async () => {
        const extra = await browser.newPage();
        await extra.goto(`http://127.0.0.1:${port}/app/render.html`);
        await extra.waitForFunction(() => globalThis.rendererReady === true, {
          timeout: 3e4
        });
        return (payload) => extra.evaluate(
          (p) => globalThis.renderSprite(p),
          payload
        );
      });
      return;
    }
    const jobs = args.manifest ? await readJson(path2.resolve(args.manifest)) : species.map((id) => ({ species: id }));
    let ok = 0;
    const openRenderer = async () => {
      const extra = await browser.newPage();
      await extra.goto(`http://127.0.0.1:${port}/app/render.html`);
      await extra.waitForFunction(() => globalThis.rendererReady === true, {
        timeout: 3e4
      });
      return (payload) => extra.evaluate(
        (p) => globalThis.renderSprite(p),
        payload
      );
    };
    const queue = [...jobs];
    const renderOne = async (job, callRenderer2) => {
      const speciesId = job.species;
      if (args.skipExisting && job.files && Object.values(job.files).every((file) => existsSync2(file))) {
        ok++;
        return;
      }
      let built;
      try {
        built = await buildInput(speciesId, job.aspects ?? []);
      } catch (error) {
        logWarn(`Assets ilegibles para ${speciesId}: ${String(error)}`);
        return;
      }
      if (!built) {
        logWarn(`Sin modelo/textura para ${speciesId}`);
        return;
      }
      const { assets, pose, anim } = built;
      const targets = job.files ? TARGETS.filter((t) => job.files[t.name]) : TARGETS;
      const framed = frameConfig && pose.profile;
      const input = {
        ...built.input,
        targets,
        ...framed ? {
          profile: { ...pose.profile, ySign: frameConfig.ySign, baseSign: frameConfig.baseSign },
          frames: frameConfig.frames
        } : {}
      };
      let result;
      try {
        result = await callRenderer2(input);
      } catch (error) {
        logWarn(`Fallo al renderizar ${speciesId}: ${String(error)}`);
        return;
      }
      const base = `${assets.dex}_${speciesId}`;
      for (const target of targets) {
        const data = result[target.name]?.replace(/^data:image\/png;base64,/, "");
        if (!data) continue;
        const file = job.files?.[target.name] ?? path2.join(args.out, `${base}_${target.name}.png`);
        await mkdir(path2.dirname(file), { recursive: true });
        await writeFile(file, Buffer.from(data, "base64"));
      }
      if (args.compare && !args.manifest) {
        const legacy = spawnSync(
          "python",
          [
            resolveFromRoot("tools/lib/bake-pokemon-sprite.py"),
            assets.geo,
            assets.texture,
            path2.join(args.out, `${base}_old.png`),
            "139",
            "69",
            anim.file ?? "",
            anim.name ?? "",
            speciesId,
            assets.poser ?? ""
          ],
          { encoding: "utf8" }
        );
        if (legacy.status !== 0) logWarn(`Bake antiguo fall\xF3 en ${speciesId}: ${legacy.stderr}`);
      }
      logStep(
        `  ${base}: pose ${anim.name ?? "(sin animaci\xF3n)"}, ocultas ${pose.hidden.length}, encuadre ${framed ? "mod" : "ajustado"}`
      );
      ok++;
    };
    await Promise.all(
      Array.from({ length: args.workers }, async (_, w) => {
        const render = w === 0 ? callRenderer : await openRenderer();
        for (let job = queue.shift(); job; job = queue.shift()) await renderOne(job, render);
      })
    );
    logStep(`Retratos renderizados: ${ok}/${jobs.length}${args.manifest ? "" : ` \u2192 ${args.out}`}`);
  } finally {
    await browser.close();
    server.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
