var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// bp/src/config/retiredFeatures.ts
var TERA_FEATURE, MEGA_SHOWDOWN_COMPONENT_IDS;
var init_retiredFeatures = __esm({
  "bp/src/config/retiredFeatures.ts"() {
    TERA_FEATURE = true;
    MEGA_SHOWDOWN_COMPONENT_IDS = [
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
  }
});

// tools/lib/utils.ts
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { copyFile, cp, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
function resolveFromRoot(relativePath) {
  if (path.isAbsolute(relativePath)) return relativePath;
  const full = path.join(ROOT, relativePath);
  if (existsSync(full)) return full;
  return relocatedSource(relativePath) ?? full;
}
function relocatedSource(relativePath) {
  const normalized = relativePath.replace(/\\/g, "/");
  for (const { from, to } of RELOCATED_SOURCES) {
    const lower = normalized.toLowerCase();
    if (lower !== from && !lower.startsWith(`${from}/`)) continue;
    const rest = normalized.slice(from.length);
    for (const base of to) {
      const candidate = path.join(ROOT, base + rest);
      if (existsSync(candidate)) return candidate;
    }
  }
  return void 0;
}
function cobblemonSpeciesMarker(root) {
  return path.join(root, "data", "cobblemon", "species");
}
function bedrockSamples(relative = "") {
  const dir = resolveFromRoot("recursos");
  let root = resolveFromRoot("recursos/bedrock-samples");
  if (!existsSync(root)) {
    try {
      const match = readdirSync(dir).find((name) => name.startsWith("bedrock-samples"));
      if (match) root = path.join(dir, match);
    } catch {
    }
  }
  return relative ? path.join(root, relative) : root;
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
async function walkFiles(dir) {
  const results = [];
  if (!existsSync(dir)) return results;
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...await walkFiles(fullPath));
    } else if (entry.isFile()) {
      results.push(fullPath);
    }
  }
  return results;
}
function logStep(message) {
  console.log(`[cooblemon] ${message}`);
}
function logWarn(message) {
  console.warn(`[cooblemon] ${message}`);
}
var ROOT, RELOCATED_SOURCES, COBBLEMON_JAVA_LEGACY_PREFIX, COBBLEMON_JAVA_CANDIDATES;
var init_utils = __esm({
  "tools/lib/utils.ts"() {
    init_retiredFeatures();
    ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
    RELOCATED_SOURCES = [
      { from: "recursos/cobbreeding", to: ["recursos/Cobbreeding/common/src/main/resources"] },
      {
        from: "recursos/raiddens",
        to: [
          "recursos/cobblemon-raiddens/common/src/main/resources",
          "recursos/cobblemon-raiddens/common/src/main/generated"
        ]
      }
    ];
    COBBLEMON_JAVA_LEGACY_PREFIX = "recursos/cobblemon-fabric-1.7.3+1.21.1";
    COBBLEMON_JAVA_CANDIDATES = [
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
  }
});

// tools/lib/species-id.ts
function toEntitySpeciesId(dataId) {
  return dataId.toLowerCase().normalize("NFKD").replace(/[\u2018\u2019']/g, "").replace(/\./g, "").replace(/-/g, "").replace(/\s+/g, "");
}
function normalizeEvolutionResult(result) {
  const trimmed = result.trim().toLowerCase();
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length > 1) {
    const base = toEntitySpeciesId(parts[0]);
    const rest = parts.slice(1).map((part) => {
      if (part.includes("=")) {
        const eq = part.indexOf("=");
        const key = part.slice(0, eq).replace(/[^a-z0-9_]/g, "");
        const value = part.slice(eq + 1).replace(/[^a-z0-9_]/g, "");
        return `${key}=${value}`;
      }
      if (part === "male" || part === "female") return part;
      return toEntitySpeciesId(part);
    });
    return [base, ...rest].join(" ");
  }
  const gluedGender = trimmed.match(/^(.+?)(male|female)$/);
  if (gluedGender && gluedGender[1].length > 0) {
    const base = toEntitySpeciesId(gluedGender[1]);
    if (base === "meowstic" || base === "oinkologne") {
      return `${base} ${gluedGender[2]}`;
    }
  }
  const gluedProps = expandGluedEvolutionProps(trimmed);
  if (gluedProps) return gluedProps;
  return toEntitySpeciesId(trimmed);
}
function expandGluedEvolutionProps(compact) {
  const keys = [...EVOLUTION_RESULT_PROP_KEYS].sort((a, b) => b.length - a.length);
  let firstIdx = -1;
  for (const key of keys) {
    const idx = compact.indexOf(`${key}=`);
    if (idx > 0 && (firstIdx < 0 || idx < firstIdx)) firstIdx = idx;
  }
  if (firstIdx <= 0) return null;
  const species = toEntitySpeciesId(compact.slice(0, firstIdx));
  if (!species) return null;
  let rest = compact.slice(firstIdx);
  const tokens = [species];
  while (rest.length > 0) {
    const key = keys.find((k) => rest.startsWith(`${k}=`));
    if (!key) return null;
    rest = rest.slice(key.length + 1);
    let end = rest.length;
    for (const nextKey of keys) {
      const idx = rest.indexOf(`${nextKey}=`);
      if (idx >= 0 && idx < end) end = idx;
    }
    const value = rest.slice(0, end);
    if (!value) return null;
    tokens.push(`${key}=${value}`);
    rest = rest.slice(end);
  }
  return tokens.length > 1 ? tokens.join(" ") : null;
}
var EVOLUTION_RESULT_PROP_KEYS;
var init_species_id = __esm({
  "tools/lib/species-id.ts"() {
    EVOLUTION_RESULT_PROP_KEYS = [
      "wolf_form",
      "decoration",
      "cream",
      "form",
      "tree",
      "sea"
    ];
  }
});

// tools/lib/poser-clips.ts
var init_poser_clips = __esm({
  "tools/lib/poser-clips.ts"() {
    init_utils();
  }
});

// tools/lib/air-animations.ts
var init_air_animations = __esm({
  "tools/lib/air-animations.ts"() {
    init_species_id();
    init_utils();
    init_poser_clips();
  }
});

// tools/lib/copy-pokemon-particles.ts
var PARTICLE_LOCATOR_ALLOWLIST, FURFROU_HAIR_COLORS, FURFROU_PARTICLES, IMPACT_TYPES, PARTICLE_TEXTURES, BATTLE_PARTICLES, FISHING_PARTICLES, AILMENT_PARTICLES;
var init_copy_pokemon_particles = __esm({
  "tools/lib/copy-pokemon-particles.ts"() {
    init_utils();
    PARTICLE_LOCATOR_ALLOWLIST = {
      gastly: /* @__PURE__ */ new Set(["gas"])
    };
    FURFROU_HAIR_COLORS = [
      "black",
      "blue",
      "brown",
      "cyan",
      "gray",
      "green",
      "light_blue",
      "light_gray",
      "lime",
      "magenta",
      "orange",
      "pink",
      "purple",
      "red",
      "white",
      "yellow"
    ];
    FURFROU_PARTICLES = [
      // La que encadenan todas las de color: sin ella, cada corte de pelo pedía un
      // efecto que no existe en el paquete.
      {
        sourceRel: "pokemon/furfrou/poodle_hair_particles.particle.json",
        destFile: "poodle_hair_particles.particle.json",
        identifier: "cooblemon:poodle_hair_particles"
      },
      ...FURFROU_HAIR_COLORS.map((color) => ({
        sourceRel: `pokemon/furfrou/poodle_hair_${color}.particle.json`,
        destFile: `poodle_hair_${color}.particle.json`,
        identifier: `cooblemon:poodle_hair_${color}`
      }))
    ];
    IMPACT_TYPES = [
      "bug",
      "dark",
      "dragon",
      "electric",
      "fairy",
      "fighting",
      "fire",
      "flying",
      "ghost",
      "grass",
      "ground",
      "ice",
      "normal",
      "poison",
      "psychic",
      "rock",
      "steel",
      "water"
    ];
    PARTICLE_TEXTURES = [
      "invisible.png",
      // Pesca: ondas del flotador y salpicaduras.
      "generic/water/water_ripple.png",
      "generic/water/ripple_white.png",
      "generic/water/splash.png",
      "generic/water/fishsplash.png",
      "generic/water/giantsplash.png",
      "generic/lightbeam.png",
      "generic/star.png",
      // El pelo que vuela al cambiarle el corte a Furfrou la usa de confeti.
      "generic/confetti.png",
      "generic/orb/glowing_dots_cyan.png",
      "generic/orb/orbshrink_white.png",
      "generic/orb/largefadeorb.png",
      "generic/smoke/glowingsmoke_cyan.png",
      "generic/smoke/smoke.png",
      "generic/sparkle/bigsparkle.png",
      "generic/sparkle/glowingsparkle_yellow.png",
      "generic/sparkle/glowingsparkle_pink.png",
      "generic/sparkle/shinesparkle_rainbow.png",
      "generic/orb/xsboost.png",
      "generic/orb/xsunboost.png",
      // Aura del Alfa. Sin ella sus cuatro partículas salían en rosa y negro.
      "generic/orb/xsalphaboost.png",
      "generic/hit.png",
      "generic/fire/flame.png",
      "generic/fire/ember.png",
      "generic/bubble/poisonbubble.png",
      // Los impactos por tipo del efecto genérico de movimiento (`generic_move`):
      // cada golpe revienta con el color de su tipo, como en el mod.
      ...IMPACT_TYPES.map((t) => `generic/impact/impact_${t}.png`),
      "generic/status/accessory_spark.png",
      "generic/status/confusion_bird.png",
      "generic/status/infatuation_heart.png",
      "generic/status/paralysis_spark.png",
      "generic/status/sleep_bubble.png",
      "generic/status/sleep_zzz.png",
      "moves/thunder_smallbolt.png",
      "vanilla/big_smoke.png"
    ];
    BATTLE_PARTICLES = [
      // El impacto de cada tipo y los de golpes múltiples: los pide el efecto
      // genérico de movimiento del mod y antes no llegaban al paquete.
      ...IMPACT_TYPES.map((t) => ({
        sourceRel: `generic/impact_${t}.particle.json`,
        destFile: `impact_${t}.particle.json`,
        identifier: `cooblemon:impact_${t}`
      })),
      ...["multi_hit", "multi_hit_grass"].map((n) => ({
        sourceRel: `generic/${n}.particle.json`,
        destFile: `${n}.particle.json`,
        identifier: `cooblemon:${n}`
      })),
      {
        sourceRel: "generic/statup_actor.particle.json",
        destFile: "statup_actor.particle.json",
        identifier: "cooblemon:statup_actor"
      },
      {
        sourceRel: "generic/statup_actoraura.particle.json",
        destFile: "statup_actoraura.particle.json",
        identifier: "cooblemon:statup_actoraura"
      },
      {
        sourceRel: "generic/statdown_actor.particle.json",
        destFile: "statdown_actor.particle.json",
        identifier: "cooblemon:statdown_actor"
      },
      {
        sourceRel: "generic/statdown_actoraura.particle.json",
        destFile: "statdown_actoraura.particle.json",
        identifier: "cooblemon:statdown_actoraura"
      },
      {
        sourceRel: "generic/hit.particle.json",
        destFile: "hit.particle.json",
        identifier: "cooblemon:hit"
      },
      {
        sourceRel: "generic/alphaboost_actor.particle.json",
        destFile: "alphaboost_actor.particle.json",
        identifier: "cooblemon:alphaboost_actor"
      },
      {
        sourceRel: "generic/alphaboost_actoraura.particle.json",
        destFile: "alphaboost_actoraura.particle.json",
        identifier: "cooblemon:alphaboost_actoraura"
      },
      {
        sourceRel: "generic/alphaboost_actorburst.particle.json",
        destFile: "alphaboost_actorburst.particle.json",
        identifier: "cooblemon:alphaboost_actorburst"
      },
      {
        sourceRel: "generic/alphaboost_actorsparks.particle.json",
        destFile: "alphaboost_actorsparks.particle.json",
        identifier: "cooblemon:alphaboost_actorsparks"
      },
      {
        sourceRel: "alpha_eyes.particle.json",
        destFile: "alpha_eyes.particle.json",
        identifier: "cooblemon:alpha_eyes"
      },
      {
        sourceRel: "alpha_eyes_outer.particle.json",
        destFile: "alpha_eyes_outer.particle.json",
        identifier: "cooblemon:alpha_eyes_outer"
      }
    ];
    FISHING_PARTICLES = [
      "fishing_bobber_ripple",
      "fishing_bobber_big_ripple",
      "fishing_surface_ripple",
      "fishing_surface_wake",
      "bob_splash",
      "small_fish_splash",
      "big_fish_splash"
    ].map((name) => ({
      sourceRel: `fishing/${name}.particle.json`,
      destFile: `${name}.particle.json`,
      identifier: `cooblemon:${name}`
    }));
    AILMENT_PARTICLES = [
      "burn_actor",
      "burn_actorresidual",
      "poison_actor",
      "poison_actorresidual",
      "poison_passive",
      "toxpoison_actor",
      "toxpoison_actorresidual",
      "toxpoison_passive",
      "paralysis_actor",
      "paralysis_actorresidual",
      "paralysis_passive",
      "sleep_actor",
      "sleep_actorresidual",
      "confused_actor",
      "confused_bird2",
      "confused_bird3",
      "confused_bird4",
      "confused_bird5",
      "confused_bird6",
      "infatuate_actor",
      "infatuate_actorresidual"
    ].map((name) => ({
      sourceRel: `generic/ailments/${name}.particle.json`,
      destFile: `${name}.particle.json`,
      identifier: `cooblemon:${name}`
    }));
  }
});

// tools/lib/sanitize-animations.ts
function looksLikeMolang(value) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return false;
  if (/^[a-zA-Z]$/.test(trimmed)) return true;
  if (/(\d)\.0\.(\d)/.test(trimmed)) return true;
  if (/(\d+\.\d)\d+\.\d+/.test(trimmed)) return true;
  if (/\+\+/.test(trimmed)) return true;
  if (/(?<![a-z_])--(?=\d)/.test(trimmed)) return true;
  return /[a-z_(]/i.test(trimmed);
}
function parenBalanced(value) {
  let depth = 0;
  for (const char of value) {
    if (char === "(") depth++;
    if (char === ")") depth--;
    if (depth < 0) return false;
  }
  return depth === 0;
}
function isValidMolang(value) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/[^\x00-\x7F]/.test(trimmed)) return false;
  if (/^[a-zA-Z]$/.test(trimmed)) return false;
  if (/[+\-*/]$/.test(trimmed)) return false;
  if (!parenBalanced(trimmed)) return false;
  if (/(\d)\.0\.(\d)/.test(trimmed)) return false;
  if (/(\d+\.\d)\d+\.\d+/.test(trimmed)) return false;
  if (/\+\+/.test(trimmed)) return false;
  if (/(?<![a-z_])--(?=\d)/.test(trimmed)) return false;
  if (/\*[+\-](?!\d|\()/i.test(trimmed)) return false;
  if (/\d(?:\.\d+)?(?:math\.|q\.)/i.test(trimmed)) return false;
  if (/\bsf2?\b/.test(trimmed)) return false;
  if (/[+\-*/][a-zA-Z]\b(?!\s*[\.(])/.test(trimmed)) return false;
  return true;
}
function fixDecimalCommas(expr) {
  let depth = 0;
  let out = "";
  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];
    if (ch === "(") depth++;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    if (ch === "," && depth === 0 && /\d/.test(expr[i - 1] ?? "") && /\d/.test(expr[i + 1] ?? "")) {
      out += ".";
      continue;
    }
    out += ch;
  }
  return out;
}
function sanitizeMolangString(value) {
  const trimmed = value.trim();
  if (/^[a-zA-Z]$/.test(trimmed)) return "1";
  if (!looksLikeMolang(value)) return value;
  let result = value.replace(/NaN/gi, "0").replace(/query\.anim_time/g, "q.anim_time").replace(/\bMath\./g, "math.").replace(
    /(?<![\w.])(?:m?ath|at|th)\.(?=(?:sin|cos|abs|clamp|lerp|min|max|mod|sqrt|pow|floor|ceil|round|trunc|exp|ln|atan2|asin|acos|hermite_blend|die_roll|random)\s*\()/g,
    "math."
  ).replace(/[^\x00-\x7F]+/g, "").replace(/(\d)\.0\.(\d)/g, "$1.$2").replace(/[\s\S]*/, fixDecimalCommas).replace(/(\d+\.\d)\d+\.\d+/g, "$1").replace(/(?<![a-z_])--+(?=\d)/g, "-").replace(/variable\.(?:idle|walk)speed\b/gi, "1").replace(
    /\b(?:variable|v)\.(\w+)\b/gi,
    (_m, nombre) => /speed$/i.test(nombre) ? "1" : "0"
  ).replace(/\bsf2\b/g, "1").replace(/\bsf\b/g, "1").replace(/\bspeed\b/g, "1").replace(/\+{2,}/g, "+").replace(/\+-/g, "-").replace(/-\+/g, "-").replace(/\*\+/g, "*").replace(/\(\+/g, "(").replace(/\*--+/g, "*-").replace(/(\d(?:\.\d+)?)(?=math\.)/gi, "$1*").replace(/(\d(?:\.\d+)?)(?=q\.)/gi, "$1*").replace(/\)(\d)/g, ")*$1").replace(/\)(\.\d+)/g, ")*$1").replace(/^\s*\+(?=\s*(?:math\.|q\.|\())/, "0+").replace(/^-(?=\s*(?:math\.|q\.|\())/, "0-").replace(/^\+(?=\s*(?:math\.|q\.|\d|\())/, "0+").replace(/([+\-*/])([a-zA-Z])\b(?!\s*[\.(])/g, (_m, op) => `${op}0`);
  if (UNSUPPORTED_IN_KEPT.some((pattern) => result.includes(pattern))) {
    return "0";
  }
  if (/math\.random\s*\(/i.test(result)) {
    return "0";
  }
  if (!isValidMolang(result)) {
    return "0";
  }
  return result;
}
function isInvalidAnimationKey(key) {
  if (key === "pose" || key === "demopose") return false;
  if (!key.startsWith("animation.")) return true;
  if (/\s/.test(key)) return true;
  if (/[()]/.test(key)) return true;
  if (!/^animation\.[A-Za-z0-9_.\-]+$/.test(key)) return true;
  if (/\.unused[\s._]/i.test(key)) return true;
  return false;
}
function isConstantKeyframeData(value) {
  if (typeof value === "number") return true;
  if (Array.isArray(value)) {
    return value.every((v) => typeof v === "number");
  }
  return false;
}
function foldSimpleArithmetic(value) {
  if (typeof value === "string") {
    const s = value.trim();
    if (!/^-?\d+(\.\d+)?([+-]\d+(\.\d+)?)*$/.test(s)) return value;
    try {
      const n = Function(`"use strict"; return (${s});`)();
      return typeof n === "number" && Number.isFinite(n) ? n : value;
    } catch {
      return value;
    }
  }
  if (Array.isArray(value)) return value.map(foldSimpleArithmetic);
  return value;
}
function isKeyframeTimeKey(key) {
  return /^\d+(\.\d+)?$/.test(key);
}
function sanitizeKeyframeChannel(channel2) {
  const timeKeys = Object.keys(channel2).filter(isKeyframeTimeKey);
  if (timeKeys.length === 0) {
    const out2 = {};
    for (const [key, nested] of Object.entries(channel2)) {
      out2[key] = deepSanitize(nested);
    }
    return out2;
  }
  let allConstant = true;
  let cubicFrameCount = 0;
  for (const t of timeKeys) {
    let frame2 = channel2[t];
    if (frame2 && typeof frame2 === "object" && !Array.isArray(frame2)) {
      const f = frame2;
      const folded = { ...f };
      if (folded.post !== void 0) folded.post = foldSimpleArithmetic(folded.post);
      if (folded.pre !== void 0) folded.pre = foldSimpleArithmetic(folded.pre);
      frame2 = folded;
      channel2[t] = folded;
    } else if (typeof frame2 === "string" || Array.isArray(frame2)) {
      frame2 = foldSimpleArithmetic(frame2);
      channel2[t] = frame2;
    }
    if (frame2 && typeof frame2 === "object" && !Array.isArray(frame2)) {
      const f = frame2;
      if (f.post !== void 0 && !isConstantKeyframeData(f.post)) allConstant = false;
      if (f.pre !== void 0 && !isConstantKeyframeData(f.pre)) allConstant = false;
      if (f.lerp_mode === "catmullrom" || f.lerp_mode === "cubic") {
        cubicFrameCount += 1;
      }
    } else if (frame2 !== void 0 && !isConstantKeyframeData(frame2)) {
      allConstant = false;
    }
  }
  const allowCubic = allConstant && cubicFrameCount > 0;
  const out = {};
  for (const [key, nested] of Object.entries(channel2)) {
    if (!timeKeys.includes(key)) {
      out[key] = deepSanitize(nested);
      continue;
    }
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      const frameIn = nested;
      const frameOut = {};
      for (const [fk, fv] of Object.entries(frameIn)) {
        if (fk === "lerp_mode" && (fv === "catmullrom" || fv === "cubic") && !allowCubic) {
          continue;
        }
        frameOut[fk] = deepSanitize(fv);
      }
      if (allowCubic && frameOut.lerp_mode === void 0 && frameOut.post !== void 0) {
        frameOut.lerp_mode = "catmullrom";
      }
      out[key] = frameOut;
    } else if (allowCubic && nested !== void 0) {
      out[key] = { lerp_mode: "catmullrom", post: deepSanitize(nested) };
    } else {
      out[key] = deepSanitize(nested);
    }
  }
  return out;
}
function deepSanitize(value) {
  if (typeof value === "string") return sanitizeMolangString(value);
  if (Array.isArray(value)) return value.map(deepSanitize);
  if (value && typeof value === "object") {
    const obj = value;
    if (Object.keys(obj).some(isKeyframeTimeKey)) {
      return sanitizeKeyframeChannel(obj);
    }
    const out = {};
    for (const [key, nested] of Object.entries(obj)) {
      out[key] = deepSanitize(nested);
    }
    return out;
  }
  return value;
}
function isAnimationMap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  if (keys.length === 0) return false;
  return keys.some((key) => key === "pose" || key === "demopose" || key.startsWith("animation."));
}
function stripUnsupportedAnimationFields(anim) {
  delete anim.timeline;
  delete anim.sound_effects;
  return anim;
}
function sanitizeAnimationTree(payload) {
  if (isAnimationMap(payload)) {
    const cleaned = {};
    for (const [key, value] of Object.entries(payload)) {
      if (isInvalidAnimationKey(key)) continue;
      const sanitized = deepSanitize(value);
      if (sanitized && typeof sanitized === "object" && !Array.isArray(sanitized)) {
        cleaned[key] = stripUnsupportedAnimationFields(sanitized);
      } else {
        cleaned[key] = sanitized;
      }
    }
    ensureBattleIdleAliases(cleaned);
    return cleaned;
  }
  return deepSanitize(payload);
}
function ensureBattleIdleAliases(animations) {
  const prefixes = /* @__PURE__ */ new Set();
  for (const key of Object.keys(animations)) {
    const match = /^animation\.([^.]+)\./.exec(key);
    if (match) prefixes.add(match[1]);
  }
  for (const id of prefixes) {
    const battleKey = `animation.${id}.battle_idle`;
    if (animations[battleKey]) continue;
    const fallbackKeys = [
      `animation.${id}.ground_idle`,
      `animation.${id}.water_idle`,
      `animation.${id}.air_idle`,
      `animation.${id}.pose`
    ];
    const sourceKey = fallbackKeys.find((key) => animations[key]);
    if (!sourceKey) continue;
    animations[battleKey] = JSON.parse(JSON.stringify(animations[sourceKey]));
  }
}
var GROUND_LIKE_SUFFIXES, AIR_LIKE_SUFFIXES, ALL_LOCOMOTION_SUFFIXES, UNSUPPORTED_IN_KEPT;
var init_sanitize_animations = __esm({
  "tools/lib/sanitize-animations.ts"() {
    init_air_animations();
    init_copy_pokemon_particles();
    init_poser_clips();
    init_utils();
    GROUND_LIKE_SUFFIXES = [
      ".ground_idle",
      ".ground_walk",
      ".water_idle",
      ".water_swim",
      ".surfacewater_idle",
      ".surface_water_idle",
      ".surfacewater_swim",
      ".surface_water_swim"
    ];
    AIR_LIKE_SUFFIXES = [".air_idle", ".air_fly"];
    ALL_LOCOMOTION_SUFFIXES = [
      ...GROUND_LIKE_SUFFIXES,
      ...AIR_LIKE_SUFFIXES,
      ".battle_idle",
      ".sleep"
    ];
    UNSUPPORTED_IN_KEPT = ["q.has_entity", "q.r.", "q.sound("];
  }
});

// tools/lib/sanitize-geometry.ts
function normalizeGeometryIdentifier(identifier, speciesId) {
  const fallback = speciesId ? `geometry.${speciesId}` : void 0;
  if (!identifier || identifier === "geometry.unknown") {
    return fallback ?? "geometry.unknown";
  }
  const withPrefix = identifier.startsWith("geometry.") ? identifier : `geometry.${identifier}`;
  const body = withPrefix.slice("geometry.".length);
  const cleanedBody = GEO_ID_BODY.test(body) ? body : body.replace(/[^A-Za-z0-9_.-]+/g, "").toLowerCase();
  if (!cleanedBody) {
    return fallback ?? "geometry.unknown";
  }
  const normalized = `geometry.${cleanedBody}`;
  if (speciesId) {
    const sid = speciesId.toLowerCase();
    const b = cleanedBody.toLowerCase();
    if (b === sid || b.startsWith(`${sid}.`)) {
      return normalized;
    }
    return `geometry.${speciesId}`;
  }
  return normalized;
}
function filterLocators(locators, speciesId) {
  if (!locators || !speciesId) return void 0;
  const allowed = PARTICLE_LOCATOR_ALLOWLIST[speciesId];
  const keepEyes = !speciesId.endsWith("_female");
  const kept = {};
  for (const [name, value] of Object.entries(locators)) {
    if (allowed?.has(name) || keepEyes && EYE_LOCATOR.test(name)) kept[name] = value;
  }
  return Object.keys(kept).length > 0 ? kept : void 0;
}
function ensureDefaultParticleLocators(data, speciesId) {
  if (!speciesId) return;
  const def = DEFAULT_PARTICLE_LOCATORS[speciesId];
  if (!def) return;
  for (const geometry of data["minecraft:geometry"] ?? []) {
    let hasAny = false;
    for (const bone2 of geometry.bones ?? []) {
      if (bone2.locators && Object.keys(bone2.locators).length > 0) {
        hasAny = true;
        break;
      }
    }
    if (hasAny) continue;
    const bone = (geometry.bones ?? []).find((b) => b.name === def.bone);
    if (bone) {
      bone.locators = { ...def.locators };
    }
  }
}
function cajaDe(cube) {
  const origin = cube.origin;
  const size = cube.size;
  if (!Array.isArray(origin) || !Array.isArray(size) || origin.length < 3 || size.length < 3) {
    return null;
  }
  const inflate = typeof cube.inflate === "number" ? cube.inflate : 0;
  const min = origin.map((v, i) => v - inflate);
  const max = origin.map((v, i) => v + (size[i] ?? 0) + inflate);
  return { min, max };
}
function estaTapada(cube, eje, todos) {
  const caja = cajaDe(cube);
  if (!caja) return true;
  const ejes = [0, 1, 2].filter((i) => i !== eje);
  const area = ejes.reduce((acc, i) => acc * Math.max(0, caja.max[i] - caja.min[i]), 1);
  if (area <= 0) return false;
  for (const otro of todos) {
    if (otro === cube) continue;
    if (Array.isArray(otro.size) && otro.size.some((x) => x === 0)) continue;
    const caja2 = cajaDe(otro);
    if (!caja2) continue;
    if (caja.min[eje] < caja2.min[eje] - STACK_DEPTH || caja.max[eje] > caja2.max[eje] + STACK_DEPTH) {
      continue;
    }
    const solape = ejes.reduce(
      (acc, i) => acc * Math.max(0, Math.min(caja.max[i], caja2.max[i]) - Math.max(caja.min[i], caja2.min[i])),
      1
    );
    if (solape >= area * STACK_COVERAGE) return true;
  }
  return false;
}
function tieneDelante(cube, eje, todos) {
  const caja = cajaDe(cube);
  if (!caja) return null;
  let masCerca = null;
  const actual = typeof cube.inflate === "number" ? cube.inflate : 0;
  const ejes = [0, 1, 2].filter((i) => i !== eje);
  const area = ejes.reduce((acc, i) => acc * Math.max(0, caja.max[i] - caja.min[i]), 1);
  if (area <= 0) return null;
  for (const otro of todos) {
    if (otro === cube) continue;
    if (!Array.isArray(otro.size) || !otro.size.some((x) => x === 0)) continue;
    const suyo = typeof otro.inflate === "number" ? otro.inflate : 0;
    if (suyo <= actual) continue;
    const caja2 = cajaDe(otro);
    if (!caja2) continue;
    if (Math.abs(caja.min[eje] - caja2.min[eje]) > STACK_DEPTH) continue;
    const solape = ejes.reduce(
      (acc, i) => acc * Math.max(0, Math.min(caja.max[i], caja2.max[i]) - Math.max(caja.min[i], caja2.min[i])),
      1
    );
    if (solape > 0) masCerca = masCerca === null ? suyo : Math.min(masCerca, suyo);
  }
  return masCerca;
}
function huecoConVecina(cube, eje, todos) {
  const caja = cajaDe({ ...cube, inflate: 0 });
  if (!caja) return null;
  const ejes = [0, 1, 2].filter((i) => i !== eje);
  let hueco = null;
  for (const otro of todos) {
    if (otro === cube || !Array.isArray(otro.size) || otro.size[eje] !== 0) continue;
    const caja2 = cajaDe({ ...otro, inflate: 0 });
    if (!caja2) continue;
    const distancia = Math.abs(caja.min[eje] - caja2.min[eje]);
    if (distancia < GROSOR_MINIMO || distancia >= 2 * FLAT_CUBE_INFLATE) continue;
    const solapa = ejes.every((i) => Math.min(caja.max[i], caja2.max[i]) > Math.max(caja.min[i], caja2.min[i]));
    if (solapa) hueco = hueco === null ? distancia : Math.min(hueco, distancia);
  }
  return hueco;
}
function inflateFlatCubes(bones) {
  const todos = [];
  for (const bone of bones) {
    for (const cube of bone.cubes ?? []) todos.push(cube);
  }
  let tocados = 0;
  for (const cube of todos) {
    const size = cube.size;
    if (!Array.isArray(size)) continue;
    const eje = size.findIndex((x) => x === 0);
    if (eje < 0) continue;
    const actual = typeof cube.inflate === "number" ? cube.inflate : 0;
    if (actual >= 2 * FLAT_CUBE_INFLATE) continue;
    if (estaTapada(cube, eje, todos)) continue;
    const delante = tieneDelante(cube, eje, todos);
    if (delante !== null) {
      if (Math.abs(actual) >= GROSOR_MINIMO) continue;
      const hueco = Math.min(FLAT_CUBE_INFLATE, delante / 2);
      if (hueco < GROSOR_MINIMO) continue;
      cube.inflate = Number(hueco.toFixed(4));
      tocados++;
      continue;
    }
    const original = actual % FLAT_CUBE_INFLATE;
    let grosor = FLAT_CUBE_INFLATE + original;
    const vecina = huecoConVecina(cube, eje, todos);
    if (vecina !== null) {
      if (vecina / 2 < GROSOR_MINIMO) continue;
      grosor = Math.min(grosor, vecina / 2);
    }
    cube.inflate = Number(grosor.toFixed(4));
    tocados++;
  }
  return tocados;
}
function quitarCarasDeDitto(geometry) {
  if ((geometry.description?.identifier ?? "") === "geometry.ditto") return;
  for (const bone of geometry.bones ?? []) {
    if (!bone.name?.toLowerCase().includes("ditto")) continue;
    if (bone.cubes?.length) delete bone.cubes;
  }
}
function sanitizeGeometry(data, speciesId) {
  for (const geometry of data["minecraft:geometry"] ?? []) {
    if (geometry.description?.identifier) {
      geometry.description.identifier = normalizeGeometryIdentifier(
        geometry.description.identifier,
        speciesId
      );
    } else if (speciesId) {
      geometry.description = { ...geometry.description ?? {}, identifier: `geometry.${speciesId}` };
    }
    const allBones = geometry.bones ?? [];
    geometry.bones = allBones.filter((bone) => {
      const name = bone.name ?? "";
      if ((name === "bb_main" || name === "bb_main2") && allBones.length > 1) return false;
      return !name.startsWith("locator_") && name !== "locator";
    });
    for (const bone of geometry.bones ?? []) {
      const kept = filterLocators(bone.locators, speciesId);
      if (kept) {
        bone.locators = kept;
      } else {
        delete bone.locators;
      }
    }
  }
  for (const geometry of data["minecraft:geometry"] ?? []) {
    quitarCarasDeDitto(geometry);
    inflateFlatCubes(geometry.bones ?? []);
  }
  ensureDefaultParticleLocators(data, speciesId);
  return data;
}
function sanitizeGeometryJson(raw, speciesId) {
  return JSON.stringify(sanitizeGeometry(JSON.parse(raw), speciesId));
}
var GEO_ID_BODY, EYE_LOCATOR, DEFAULT_PARTICLE_LOCATORS, FLAT_CUBE_INFLATE, GROSOR_MINIMO, STACK_DEPTH, STACK_COVERAGE;
var init_sanitize_geometry = __esm({
  "tools/lib/sanitize-geometry.ts"() {
    init_copy_pokemon_particles();
    GEO_ID_BODY = /^[A-Za-z0-9_.-]+$/;
    EYE_LOCATOR = /^eye/i;
    DEFAULT_PARTICLE_LOCATORS = {
      gastly: {
        bone: "body",
        locators: {
          gas: { offset: [0, 4, 4], rotation: [90, 0, 0] }
        }
      }
    };
    FLAT_CUBE_INFLATE = 0.05;
    GROSOR_MINIMO = 1e-3;
    STACK_DEPTH = 0.5;
    STACK_COVERAGE = 0.5;
  }
});

// tools/lib/merge-species-additions.ts
import { readdir as readdir2, readFile as readFile2, writeFile as writeFile2 } from "node:fs/promises";
import path2 from "node:path";
import { existsSync as existsSync2 } from "node:fs";
async function loadAtmSpeciesAdditions() {
  const map = /* @__PURE__ */ new Map();
  const root = allTheMonsJava("data/cobblemon/species_additions");
  if (!root || !existsSync2(root)) return map;
  async function walk5(dir) {
    let entries;
    try {
      entries = await readdir2(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path2.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk5(full);
        continue;
      }
      if (!entry.name.endsWith(".json")) continue;
      try {
        const raw = JSON.parse(await readFile2(full, "utf8"));
        const fromTarget = raw.target?.replace(/^cobblemon:/i, "");
        const id = toEntitySpeciesId(fromTarget ?? entry.name.replace(/\.json$/i, ""));
        map.set(id, raw);
      } catch {
      }
    }
  }
  await walk5(root);
  return map;
}
var ATM_SCALE_BLOCKLIST;
var init_merge_species_additions = __esm({
  "tools/lib/merge-species-additions.ts"() {
    init_utils();
    init_species_id();
    ATM_SCALE_BLOCKLIST = /* @__PURE__ */ new Set(["trubbish", "toedscool"]);
  }
});

// tools/lib/load-species.ts
import { readdir as readdir3, readFile as readFile3 } from "node:fs/promises";
import path3 from "node:path";
function normalizeSpeciesData(data, entityId) {
  const normalized = { ...data, id: entityId };
  if (normalized.preEvolution) {
    normalized.preEvolution = toEntitySpeciesId(normalized.preEvolution);
  }
  if (normalized.evolutions) {
    normalized.evolutions = normalized.evolutions.map((evo) => ({
      ...evo,
      result: normalizeEvolutionResult(String(evo.result ?? "")),
      requirements: Array.isArray(evo.requirements) ? evo.requirements : []
    }));
  }
  const forms = normalized.forms;
  if (Array.isArray(forms)) {
    normalized.forms = forms.map(
      (form) => Array.isArray(form.evolutions) ? {
        ...form,
        evolutions: form.evolutions.map((evo) => ({
          ...evo,
          requirements: Array.isArray(evo.requirements) ? evo.requirements : []
        }))
      } : form
    );
  }
  return normalized;
}
async function buildSpeciesFileCache() {
  if (speciesFileCache) return speciesFileCache;
  const map = /* @__PURE__ */ new Map();
  const srcRoot = resolveFromRoot("data/species");
  for (const folder of await readdir3(srcRoot)) {
    const folderPath = path3.join(srcRoot, folder);
    const files = await readdir3(folderPath).catch(() => []);
    for (const file of files.filter((f) => f.endsWith(".json"))) {
      const full = path3.join(folderPath, file);
      const raw = await readFile3(full, "utf8");
      const data = JSON.parse(raw);
      map.set(toEntitySpeciesId(data.id), full);
    }
  }
  speciesFileCache = map;
  return map;
}
async function getAtmAdditions() {
  if (!atmAdditionsCache) atmAdditionsCache = await loadAtmSpeciesAdditions();
  return atmAdditionsCache;
}
async function applyAtmScaleOverlay(data, entityId) {
  const addition = (await getAtmAdditions()).get(entityId);
  if (!addition) return data;
  const isStub = (data.baseScale === void 0 || data.baseScale === 1) && (!data.hitbox || data.hitbox.width === 1 && data.hitbox.height === 1);
  if (!isStub) return data;
  const next = { ...data };
  if (typeof addition.baseScale === "number" && !ATM_SCALE_BLOCKLIST.has(entityId)) {
    next.baseScale = addition.baseScale;
  }
  if (addition.hitbox) {
    next.hitbox = {
      width: addition.hitbox.width,
      height: addition.hitbox.height,
      ...addition.hitbox.fixed !== void 0 ? { fixed: addition.hitbox.fixed } : {}
    };
  }
  return next;
}
async function loadSpeciesByEntityId(entityId) {
  const cache = await buildSpeciesFileCache();
  const normalized = toEntitySpeciesId(entityId);
  const file = cache.get(normalized);
  if (!file) throw new Error(`Species not found for entity id: ${entityId}`);
  const data = JSON.parse(await readFile3(file, "utf8"));
  const withAtm = await applyAtmScaleOverlay(normalizeSpeciesData(data, normalized), normalized);
  return withAtm;
}
var speciesFileCache, atmAdditionsCache;
var init_load_species = __esm({
  "tools/lib/load-species.ts"() {
    init_utils();
    init_species_id();
    init_merge_species_additions();
    speciesFileCache = null;
    atmAdditionsCache = null;
  }
});

// tools/kit/entity-files.ts
function rolesFromNames(prefix, has) {
  const roles = /* @__PURE__ */ new Map();
  const CANDIDATES = {
    idle: ["ground_idle", "idle"],
    walk: ["ground_walk", "walk"],
    run: ["ground_run"],
    air_idle: ["air_idle", "flying_idle", "hover"],
    air_move: ["air_fly", "flying", "fly"],
    swim_idle: ["water_idle", "surface_idle"],
    swim: ["water_swim", "surface_swim", "swim"],
    battle_idle: ["battle_idle"],
    sleep: ["sleep"]
  };
  for (const [role, clips] of Object.entries(CANDIDATES)) {
    const clip = clips.map((c) => `${prefix}.${c}`).find(has);
    if (clip) roles.set(role, { clip, hidden: [] });
  }
  return roles;
}
function renameFamilies(node, from, to) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    node.forEach((n) => renameFamilies(n, from, to));
    return;
  }
  for (const [key, value] of Object.entries(node)) {
    if (key === "minecraft:type_family" && value && typeof value === "object") {
      const v = value;
      if (Array.isArray(v.family)) v.family = v.family.map((f) => f === from ? to : f);
    } else renameFamilies(value, from, to);
  }
}
function clientEntity(id, short, geometry, textures, roles, animId, battleClips, shoulderClip) {
  const animations = {};
  const animate = [];
  const clip = (role, ...fallback) => {
    for (const r of [role, ...fallback]) if (roles.get(r)?.clip) return { role: r, clip: roles.get(r).clip };
    return null;
  };
  const add = (name, role, condition, ...fallback) => {
    const c = clip(role, ...fallback);
    if (!c) return;
    animations[`${short}.${name}`] = animId(c.clip);
    animate.push({ [`${short}.${name}`]: condition });
  };
  add("locomotion_idle", "idle", `(${STATE.ground}) && !${STATE.moving} && ${STATE.free}`);
  const running = "query.property('cooblemon:running')";
  add("locomotion_walk", "walk", `(${STATE.ground}) && ${STATE.moving} && ${roles.has("run") ? `!${running} && ` : ""}${STATE.free}`, "idle");
  if (roles.has("run")) add("locomotion_walk_run", "run", `(${STATE.ground}) && ${running} && ${STATE.free}`);
  add("locomotion_air_idle", "air_idle", `(${STATE.air}) && !${STATE.moving} && ${STATE.free}`, "idle");
  add("locomotion_air_move", "air_move", `(${STATE.air}) && ${STATE.moving} && ${STATE.free}`, "air_idle", "walk", "idle");
  add("locomotion_swim_idle", "swim_idle", `(${STATE.water}) && !${STATE.moving} && ${STATE.free}`, "idle");
  add("locomotion_swim", "swim", `(${STATE.water}) && ${STATE.moving} && ${STATE.free}`, "swim_idle", "walk", "idle");
  add(
    "battle_idle",
    "battle_idle",
    "query.property('cooblemon:in_battle') && !query.property('cooblemon:attacking') && !query.property('cooblemon:sleeping')",
    "idle"
  );
  add("sleep_state", "sleep", "query.property('cooblemon:sleeping')", "idle");
  if (shoulderClip) {
    animations[`${short}.shoulder`] = shoulderClip;
    animate.push({ [`${short}.shoulder`]: "query.is_riding" });
  }
  for (const [name, [animId2]] of Object.entries(battleClips)) animations[`${short}.${name}`] = animId2;
  return {
    format_version: "1.10.0",
    "minecraft:client_entity": {
      description: {
        identifier: id,
        materials: { default: "entity_alphatest" },
        textures,
        geometry,
        render_controllers: [`controller.render.${id.replace(":", ".")}`],
        spawn_egg: { base_color: "#e0e0e0", overlay_color: "#c03030" },
        animations,
        scripts: { animate }
      }
    }
  };
}
function renderController(id, female) {
  const isFemale = "query.property('cooblemon:gender') == 'female'";
  const shiny = "query.property('cooblemon:shiny')";
  return {
    format_version: "1.10.0",
    render_controllers: {
      [`controller.render.${id.replace(":", ".")}`]: {
        geometry: female.geometry ? `${isFemale} ? Geometry.female : Geometry.default` : "Geometry.default",
        materials: [{ "*": "Material.default" }],
        textures: [
          female.texture ? `${isFemale} ? (${shiny} ? Texture.female_shiny : Texture.female) : (${shiny} ? Texture.shiny : Texture.default)` : `${shiny} ? Texture.shiny : Texture.default`
        ]
      }
    }
  };
}
var STATE;
var init_entity_files = __esm({
  "tools/kit/entity-files.ts"() {
    STATE = {
      ground: "!query.is_in_water && query.is_on_ground",
      air: "!query.is_in_water && !query.is_on_ground",
      water: "query.is_in_water",
      moving: "(query.ground_speed > 0.08 || math.abs(query.vertical_speed) > 0.08)",
      free: "!query.property('cooblemon:in_battle') && !query.property('cooblemon:sleeping') && !query.is_riding"
    };
  }
});

// bp/src/data/bundled/battle-anim.generated.ts
var BATTLE_CLIPS, MODEL_LOCATORS;
var init_battle_anim_generated = __esm({
  "bp/src/data/bundled/battle-anim.generated.ts"() {
    BATTLE_CLIPS = JSON.parse('{"ancient_poke_ball":{"throw":["animation.ancient_poke_ball.throw",4,1]},"poke_ball":{"throw":["animation.poke_ball.throw",4,1]},"bulbasaur":{"faint":["animation.bulbasaur.faint",3],"cry":["animation.bulbasaur.cry",1],"recoil":["animation.bulbasaur.recoil",1]},"ivysaur":{"faint":["animation.ivysaur.faint",3],"cry":["animation.ivysaur.cry",1],"recoil":["animation.ivysaur.recoil",1]},"venusaur":{"cry":["animation.venusaur.cry",1.5],"recoil":["animation.venusaur.recoil",1]},"charmander":{"cry":["animation.charmander.cry",1.5],"special":["animation.charmander.special",3]},"charmeleon":{"cry":["animation.charmeleon.cry",1.25]},"charizard":{"cry":["animation.charizard.battle_cry",3],"recoil":["animation.charizard.air_recoil",1.5],"physical":["animation.charizard.air_physical",3],"special":["animation.charizard.air_special",3],"air_physical":["animation.charizard.air_physical",3],"air_special":["animation.charizard.air_special",3],"status":["animation.charizard.air_status",3]},"squirtle":{"special":["animation.squirtle.special",3],"physical":["animation.squirtle.physical",3]},"wartortle":{"special":["animation.wartortle.special",3],"physical":["animation.wartortle.physical",3]},"blastoise":{"faint":["animation.blastoise.faint",3],"cry":["animation.blastoise.cry",3],"recoil":["animation.blastoise.recoil",1.5],"physical":["animation.blastoise.physical",3],"special":["animation.blastoise.special",3],"status":["animation.blastoise.status",3]},"caterpie":{"cry":["animation.caterpie.cry",1.08],"faint":["animation.caterpie.faint",3]},"weedle":{"cry":["animation.weedle.cry",1.33],"faint":["animation.weedle.faint",2.55]},"kakuna":{"faint":["animation.kakuna.faint",3],"cry":["animation.kakuna.cry",1],"physical":["animation.kakuna.physical",3]},"pidgey":{"cry":["animation.pidgey.cry",0.38],"recoil":["animation.pidgey.recoil",0.54]},"pidgeotto":{"cry":["animation.pidgeotto.cry",1.5],"recoil":["animation.pidgeotto.recoil",0.58]},"pidgeot":{"cry":["animation.pidgeot.battle_cry",3],"recoil":["animation.pidgeot.recoil",0.88],"status":["animation.pidgeot.status",3]},"rattata":{"faint":["animation.rattata.faint",3],"cry":["animation.rattata.cry",1]},"spearow":{"cry":["animation.spearow.cry",1.17]},"fearow":{"cry":["animation.fearow.cry",1.25]},"ekans":{"recoil":["animation.ekans.recoil",1],"cry":["animation.ekans.cry",1.5]},"arbok":{"faint":["animation.arbok.faint",3],"recoil":["animation.arbok.recoil",1.04],"cry":["animation.arbok.cry",1.25]},"pikachu":{"faint":["animation.pikachu.faint",3],"recoil":["animation.pikachu.recoil",2],"cry":["animation.pikachu.battle_cry",3],"volttackle":["animation.pikachu.volttackle",3],"physical":["animation.pikachu.physical",3],"special":["animation.pikachu.special",3],"status":["animation.pikachu.status",3]},"pikachu_cap":{"special":["animation.pikachu_cap.special",3],"physical":["animation.pikachu_cap.physical",3],"recoil":["animation.pikachu_cap.recoil",1.5]},"pikachu_captain":{"special":["animation.pikachu_captain.special",3],"physical":["animation.pikachu_captain.physical",3]},"raichu":{"faint":["animation.raichu.faint",3],"recoil":["animation.raichu.recoil",1.79],"cry":["animation.raichu.battle_cry",3],"physical":["animation.raichu.physical",3],"special":["animation.raichu.special",3],"thunder":["animation.raichu.special2",3],"risingvoltage":["animation.raichu.special2",3],"status":["animation.raichu.status",3]},"raichu_alolan":{"special":["animation.raichu_alolan.special",3],"physical":["animation.raichu_alolan.physical",3],"recoil":["animation.raichu_alolan.recoil",3]},"raichu_alolan_cap":{"special":["animation.raichu_alolan_cap.special",3],"physical":["animation.raichu_alolan_cap.physical",3],"recoil":["animation.raichu_alolan_cap.recoil",3]},"raichu_cap":{"special":["animation.raichu_cap.special",3],"physical":["animation.raichu_cap.physical",3],"recoil":["animation.raichu_cap.recoil",1.79]},"sandshrew":{"cry":["animation.sandshrew.cry",1.2],"physical":["animation.sandshrew.physical",3],"recoil":["animation.sandshrew.recoil",1]},"sandslash":{"cry":["animation.sandslash.cry",1.2]},"nidoranf":{"cry":["animation.nidoranf.cry",1.5],"recoil":["animation.nidoranf.recoil",0.75]},"nidorina":{"cry":["animation.nidorina.cry",1.5],"recoil":["animation.nidorina.recoil",0.75]},"nidoranm":{"cry":["animation.nidoranm.cry",1.5],"recoil":["animation.nidoranm.recoil",0.75]},"nidoking":{"cry":["animation.nidoking.battle_cry",3],"recoil":["animation.nidoking.recoil",1.5],"physical":["animation.nidoking.physical",3],"special":["animation.nidoking.special",3],"beam":["animation.nidoking.beam",3],"status":["animation.nidoking.status",3]},"clefairy":{"faint":["animation.clefairy.faint",3],"cry":["animation.clefairy.cry",0.75],"special":["animation.clefairy.special",3]},"clefable":{"faint":["animation.clefable.faint",3],"cry":["animation.clefable.cry",0.79],"physical":["animation.clefable.physical",2],"special":["animation.clefable.special",3]},"vulpix":{"cry":["animation.vulpix.cry",2.08],"recoil":["animation.vulpix.recoil",1.21]},"vulpix_alolan":{"recoil":["animation.vulpix_alolan.recoil",1.21]},"ninetales":{"cry":["animation.ninetales.cry",2]},"jigglypuff":{"cry":["animation.jigglypuff.cry",1],"faint":["animation.jigglypuff.faint",3]},"wigglytuff":{"cry":["animation.wigglytuff.cry",1.25],"faint":["animation.wigglytuff.faint",3]},"zubat":{"cry":["animation.zubat.cry",1],"physical":["animation.zubat.physical",3]},"golbat":{"cry":["animation.golbat.cry",1.5]},"oddish":{"cry":["animation.oddish.cry",1],"recoil":["animation.oddish.recoil",0.42]},"gloom":{"cry":["animation.gloom.cry",1],"recoil":["animation.gloom.recoil",0.42]},"vileplume":{"cry":["animation.vileplume.cry",1.75],"recoil":["animation.vileplume.recoil",0.46]},"parasect":{"cry":["animation.parasect.cry",1.25],"faint":["animation.parasect.faint",3]},"diglett":{"faint":["animation.diglett.faint",3],"cry":["animation.diglett.cry",2],"physical":["animation.diglett.physical",3]},"diglett_alolan":{"physical":["animation.diglett_alolan.physical",3]},"dugtrio":{"faint":["animation.dugtrio.faint",3],"cry":["animation.dugtrio.cry",2.25],"physical":["animation.dugtrio.physical",3]},"dugtrio_alolan":{"physical":["animation.dugtrio_alolan.physical",3]},"primeape":{"faint":["animation.primeape.faint",3],"cry":["animation.primeape.cry",2.25],"recoil":["animation.primeape.recoil",1.75],"physical":["animation.primeape.physical",3]},"growlithe":{"cry":["animation.growlithe.cry",0.71]},"arcanine":{"cry":["animation.arcanine.cry",2.5],"recoil":["animation.arcanine.recoil",1.25]},"poliwag":{"cry":["animation.poliwag.cry",1.25]},"poliwhirl":{"cry":["animation.poliwhirl.cry",1.25],"recoil":["animation.poliwhirl.recoil",1.5]},"poliwrath":{"cry":["animation.poliwrath.cry",1.25],"physical":["animation.poliwrath.physical",3],"recoil":["animation.poliwrath.recoil",1.5]},"abra":{"faint":["animation.abra.faint",3],"cry":["animation.abra.cry",1.5]},"bellsprout":{"cry":["animation.bellsprout.cry",1.5]},"weepinbell":{"cry":["animation.weepinbell.cry",1]},"victreebel":{"cry":["animation.victreebel.cry",1.5]},"geodude":{"cry":["animation.geodude.battle_cry",1.75],"recoil":["animation.geodude.recoil",1],"status":["animation.geodude.status",1.75]},"graveler":{"cry":["animation.graveler.battle_cry",2],"recoil":["animation.graveler.battle_recoil",1],"status":["animation.graveler.status",2],"physical":["animation.graveler.physical",3]},"graveler_alolan":{"physical":["animation.graveler_alolan.physical",3]},"golem":{"cry":["animation.golem.cry",1.5],"recoil":["animation.golem.recoil",1]},"slowpoke":{"cry":["animation.slowpoke.cry",1.75]},"slowbro":{"cry":["animation.slowbro.cry",2]},"magnemite":{"faint":["animation.magnemite.faint",3],"cry":["animation.magnemite.cry",1.2]},"magneton":{"faint":["animation.magneton.faint",2.59],"cry":["animation.magneton.cry",1.2]},"seel":{"cry":["animation.seel.cry",1.25]},"dewgong":{"cry":["animation.dewgong.cry",1.25]},"grimer":{"cry":["animation.grimer.cry",1],"recoil":["animation.grimer.recoil",1.5]},"grimer_alolan":{"recoil":["animation.grimer_alolan.recoil",1.5]},"muk":{"cry":["animation.muk.cry",1.25]},"shellder":{"cry":["animation.shellder.cry",2],"recoil":["animation.shellder.recoil",0.5],"protect":["animation.shellder.protect",3]},"cloyster":{"cry":["animation.cloyster.cry",2],"recoil":["animation.cloyster.recoil",0.5],"protect":["animation.cloyster.protect",3]},"gastly":{"cry":["animation.gastly.cry",1.2]},"gastly_shiny":{"cry":["animation.gastly_shiny.cry",1.2]},"haunter":{"cry":["animation.haunter.cry",1.2]},"onix":{"faint":["animation.onix.faint",3],"cry":["animation.onix.cry",2]},"drowzee":{"cry":["animation.drowzee.battle_cry",2.25],"recoil":["animation.drowzee.recoil",1.25]},"hypno":{"cry":["animation.hypno.cry",2.5],"recoil":["animation.hypno.battle_recoil",1.75]},"kingler":{"cry":["animation.kingler.cry",1.5],"recoil":["animation.kingler.recoil",1.5]},"exeggutor":{"cry":["animation.exeggutor.cry",1.5]},"marowak":{"cry":["animation.marowak.cry",0.83]},"koffing":{"faint":["animation.koffing.faint",3],"cry":["animation.koffing.battle_cry",3],"recoil":["animation.koffing.recoil",1.5],"physical":["animation.koffing.physical",3],"special":["animation.koffing.special",3],"status":["animation.koffing.status",3]},"weezing":{"cry":["animation.weezing.battle_cry",3],"recoil":["animation.weezing.recoil",1.5],"physical":["animation.weezing.physical",3],"special":["animation.weezing.special",3],"status":["animation.weezing.status",3]},"rhyhorn":{"cry":["animation.rhyhorn.battle_cry",3],"recoil":["animation.rhyhorn.recoil",1.5],"physical":["animation.rhyhorn.physical",3],"special":["animation.rhyhorn.special",3],"status":["animation.rhyhorn.status",3]},"rhydon":{"cry":["animation.rhydon.cry",2],"recoil":["animation.rhydon.recoil",2],"physical":["animation.rhydon.physical",3],"special":["animation.rhydon.special",3],"status":["animation.rhydon.status",3]},"chansey":{"faint":["animation.chansey.faint",3.5],"cry":["animation.chansey.battle_cry",3],"recoil":["animation.chansey.recoil",1.5],"physical":["animation.chansey.physical",3],"special":["animation.chansey.special",3],"status":["animation.chansey.status",3]},"kangaskhan":{"cry":["animation.kangaskhan.cry",1.17],"recoil":["animation.kangaskhan.recoil",0.75]},"horsea":{"cry":["animation.horsea.cry",1.25]},"seadra":{"cry":["animation.seadra.cry",1.2]},"goldeen":{"cry":["animation.goldeen.cry",1]},"seaking":{"cry":["animation.seaking.cry",1.25],"recoil":["animation.seaking.water_battle_recoil",1.5]},"staryu":{"cry":["animation.staryu.cry",1],"physical":["animation.staryu.physical",3,1]},"starmie":{"cry":["animation.starmie.cry",1.25],"faint":["animation.starmie.faint",3],"special":["animation.starmie.special",3],"recoil":["animation.starmie.recoil",1]},"scyther":{"cry":["animation.scyther.cry",0.75]},"magmar":{"cry":["animation.magmar.cry",1.2]},"pinsir":{"cry":["animation.pinsir.cry",3]},"tauros":{"cry":["animation.tauros.cry",2.13]},"magikarp":{"cry":["animation.magikarp.cry",1.5],"faint":["animation.magikarp.ground_faint",3]},"gyarados":{"cry":["animation.gyarados.battle_cry",1.5],"recoil":["animation.gyarados.recoil",1.75]},"lapras":{"cry":["animation.lapras.battle_cry",3],"recoil":["animation.lapras.recoil",1.5],"special":["animation.lapras.special",3],"status":["animation.lapras.status",3]},"ditto":{"faint":["animation.ditto.faint",3],"cry":["animation.ditto.cry",1.29]},"eevee":{"cry":["animation.eevee.cry",1.2]},"vaporeon":{"cry":["animation.vaporeon.cry",1.2]},"jolteon":{"cry":["animation.jolteon.cry",1.2]},"flareon":{"cry":["animation.flareon.cry",1.2]},"porygon":{"cry":["animation.porygon.battle_cry",3],"recoil":["animation.porygon.recoil",1],"physical":["animation.porygon.physical",3],"special":["animation.porygon.special",3],"status":["animation.porygon.status",3]},"omanyte":{"cry":["animation.omanyte.cry",2]},"omastar":{"cry":["animation.omastar.cry",2.5]},"aerodactyl":{"cry":["animation.aerodactyl.battle_cry",2.75],"recoil":["animation.aerodactyl.air_recoil",1.75]},"snorlax":{"cry":["animation.snorlax.cry",2.92],"recoil":["animation.snorlax.recoil",2.13]},"dratini":{"cry":["animation.dratini.cry",1.25]},"dragonair":{"cry":["animation.dragonair.cry",2.63]},"dragonite":{"cry":["animation.dragonite.cry",2.5]},"feraligatr":{"cry":["animation.feraligatr.cry",2]},"furret":{"cry":["animation.furret.cry",1.5]},"noctowl":{"cry":["animation.noctowl.battle_cry",1.42],"recoil":["animation.noctowl.recoil",1]},"ledyba":{"cry":["animation.ledyba.cry",0.46]},"ledian":{"cry":["animation.ledian.cry",0.5]},"spinarak":{"cry":["animation.spinarak.cry",1],"recoil":["animation.spinarak.recoil",1.5],"sleep":["animation.spinarak.battle_sleep",1,1]},"ariados":{"cry":["animation.ariados.cry",1],"recoil":["animation.ariados.recoil",1.5],"sleep":["animation.ariados.battle_sleep",1,1]},"crobat":{"cry":["animation.crobat.cry",2]},"chinchou":{"faint":["animation.chinchou.water_faint",3]},"lanturn":{"faint":["animation.lanturn.water_faint",3]},"pichu":{"faint":["animation.pichu.faint",3],"cry":["animation.pichu.cry",1.5],"recoil":["animation.pichu.recoil",0.88],"physical":["animation.pichu.physical",3],"special":["animation.pichu.special",3],"status":["animation.pichu.status",3,1]},"pichu_cap":{"special":["animation.pichu_cap.special",3],"physical":["animation.pichu_cap.physical",3],"recoil":["animation.pichu_cap.recoil",0.88]},"pichu_ukulele":{"special":["animation.pichu_ukulele.special",3],"physical":["animation.pichu_ukulele.physical",3],"recoil":["animation.pichu_ukulele.recoil",0.88]},"cleffa":{"cry":["animation.cleffa.cry",1]},"igglybuff":{"cry":["animation.igglybuff.cry",1]},"togepi":{"cry":["animation.togepi.cry",1]},"togetic":{"faint":["animation.togetic.faint",3],"cry":["animation.togetic.battle_cry",3],"recoil":["animation.togetic.recoil",1.13],"physical":["animation.togetic.physical",3],"special":["animation.togetic.special",3],"status":["animation.togetic.status",3]},"bellossom":{"cry":["animation.bellossom.cry",1],"recoil":["animation.bellossom.recoil",0.42]},"sudowoodo":{"cry":["animation.sudowoodo.cry",2],"recoil":["animation.sudowoodo.recoil",2]},"politoed":{"cry":["animation.politoed.cry",1.25]},"hoppip":{"cry":["animation.hoppip.cry",1]},"skiploom":{"cry":["animation.skiploom.cry",1]},"jumpluff":{"cry":["animation.jumpluff.cry",1]},"sunkern":{"cry":["animation.sunkern.cry",1.04]},"sunflora":{"cry":["animation.sunflora.cry",1]},"espeon":{"cry":["animation.espeon.cry",1.2]},"umbreon":{"cry":["animation.umbreon.cry",1.2]},"murkrow":{"cry":["animation.murkrow.cry",2]},"unown":{"cry":["animation.unown.cry",1.25]},"wobbuffet":{"faint":["animation.wobbuffet.faint",3],"cry":["animation.wobbuffet.battle_cry",3],"recoil":["animation.wobbuffet.recoil",1.5],"physical":["animation.wobbuffet.physical",3],"special":["animation.wobbuffet.special",3],"status":["animation.wobbuffet.status",3]},"girafarig":{"cry":["animation.girafarig.cry",1.5],"recoil":["animation.girafarig.recoil",2]},"forretress":{"faint":["animation.forretress.faint",2.55]},"dunsparce":{"cry":["animation.dunsparce.battle_cry",3],"recoil":["animation.dunsparce.recoil",1.5],"physical":["animation.dunsparce.physical",3],"special":["animation.dunsparce.special",3],"status":["animation.dunsparce.status",3]},"steelix":{"cry":["animation.steelix.cry",2.5]},"scizor":{"cry":["animation.scizor.cry",1.83]},"sneasel":{"cry":["animation.sneasel.cry",0.75],"recoil":["animation.sneasel.recoil",1.25]},"teddiursa":{"cry":["animation.teddiursa.cry",1.25],"recoil":["animation.teddiursa.recoil",0.75],"special":["animation.teddiursa.special",1,1],"physical":["animation.teddiursa.physical",3]},"ursaring":{"cry":["animation.ursaring.cry",1.5],"recoil":["animation.ursaring.recoil",1]},"swinub":{"faint":["animation.swinub.faint",3],"cry":["animation.swinub.battle_cry",3],"recoil":["animation.swinub.recoil",1.5],"physical":["animation.swinub.physical",3],"special":["animation.swinub.special",3],"status":["animation.swinub.status",3]},"piloswine":{"faint":["animation.piloswine.faint",3],"cry":["animation.piloswine.battle_cry",3],"recoil":["animation.piloswine.recoil",1.5],"physical":["animation.piloswine.physical",3],"special":["animation.piloswine.special",3],"status":["animation.piloswine.status",3]},"corsola":{"cry":["animation.corsola.cry",0.79],"physical":["animation.corsola.physical",3],"recoil":["animation.corsola.recoil",1]},"remoraid":{"cry":["animation.remoraid.cry",1.2]},"octillery":{"cry":["animation.octillery.cry",1.2]},"mantine":{"cry":["animation.mantine.cry",1.25]},"skarmory":{"faint":["animation.skarmory.faint",3],"cry":["animation.skarmory.battle_cry",3],"recoil":["animation.skarmory.recoil",1.5],"physical":["animation.skarmory.physical",3],"special":["animation.skarmory.special",3.08],"status":["animation.skarmory.status",3]},"houndour":{"cry":["animation.houndour.cry",1]},"houndoom":{"cry":["animation.houndoom.cry",1.5]},"kingdra":{"cry":["animation.kingdra.cry",1.2]},"porygon2":{"faint":["animation.porygon2.faint",3],"recoil":["animation.porygon2.recoil",1],"cry":["animation.porygon2.battle_cry",3],"physical":["animation.porygon2.physical",3.25],"special":["animation.porygon2.special",3],"status":["animation.porygon2.status",3]},"smeargle":{"faint":["animation.smeargle.faint",3],"cry":["animation.smeargle.battle_cry",3],"recoil":["animation.smeargle.recoil",1.13],"physical":["animation.smeargle.physical",3],"special":["animation.smeargle.special",3],"status":["animation.smeargle.status",3]},"tyrogue":{"faint":["animation.tyrogue.faint",2.01],"cry":["animation.tyrogue.cry",2],"physical":["animation.tyrogue.physical",3]},"magby":{"faint":["animation.magby.faint",3],"recoil":["animation.magby.recoil",1],"physical":["animation.magby.physical",3],"special":["animation.magby.special",3],"status":["animation.magby.status",3],"cry":["animation.magby.battle_cry",3]},"blissey":{"faint":["animation.blissey.faint",3],"cry":["animation.blissey.battle_cry",3],"recoil":["animation.blissey.recoil",1.5],"physical":["animation.blissey.physical",3],"special":["animation.blissey.special",3],"status":["animation.blissey.status",3]},"tyranitar":{"cry":["animation.tyranitar.cry",1.2]},"treecko":{"faint":["animation.treecko.faint",3],"cry":["animation.treecko.battle_cry",3],"recoil":["animation.treecko.recoil",1],"physical":["animation.treecko.physical",3],"special":["animation.treecko.special",3],"status":["animation.treecko.status",3]},"grovyle":{"cry":["animation.grovyle.cry",1.25]},"sceptile":{"cry":["animation.sceptile.cry",1.25]},"torchic":{"recoil":["animation.torchic.recoil",1.5],"cry":["animation.torchic.battle_cry",3],"physical":["animation.torchic.physical",3],"special":["animation.torchic.special",3],"status":["animation.torchic.status",3]},"combusken":{"cry":["animation.combusken.cry",1.5]},"blaziken":{"cry":["animation.blaziken.battle_cry",3],"recoil":["animation.blaziken.recoil",1.5],"physical":["animation.blaziken.physical",3],"special":["animation.blaziken.special",3],"status":["animation.blaziken.status",3]},"mudkip":{"cry":["animation.mudkip.cry",1.75]},"marshtomp":{"cry":["animation.marshtomp.cry",2]},"swampert":{"cry":["animation.swampert.cry",2.5]},"wurmple":{"cry":["animation.wurmple.cry",1.25]},"silcoon":{"cry":["animation.silcoon.cry",1.25]},"beautifly":{"cry":["animation.beautifly.cry",1.25]},"cascoon":{"cry":["animation.cascoon.cry",1.25]},"dustox":{"cry":["animation.dustox.cry",1]},"seedot":{"cry":["animation.seedot.cry",1.5]},"taillow":{"cry":["animation.taillow.cry",1.5]},"swellow":{"cry":["animation.swellow.cry",1.5]},"shroomish":{"faint":["animation.shroomish.faint",3]},"slakoth":{"cry":["animation.slakoth.battle_cry",3],"physical":["animation.slakoth.physical",3],"status":["animation.slakoth.status",3]},"vigoroth":{"cry":["animation.vigoroth.cry",1.25]},"slaking":{"cry":["animation.slaking.battle_cry",3],"recoil":["animation.slaking.recoil",2],"physical":["animation.slaking.physical",3],"special":["animation.slaking.special",3],"status":["animation.slaking.status",3],"truant":["animation.slaking.truant",3]},"nincada":{"faint":["animation.nincada.faint",3],"cry":["animation.nincada.battle_cry",3],"recoil":["animation.nincada.recoil",1.5],"physical":["animation.nincada.physical",3],"special":["animation.nincada.special",3],"status":["animation.nincada.status",3]},"ninjask":{"faint":["animation.ninjask.faint",3],"cry":["animation.ninjask.battle_cry",3],"recoil":["animation.ninjask.recoil",0.67],"physical":["animation.ninjask.physical",3],"special":["animation.ninjask.special",3],"status":["animation.ninjask.status",3]},"shedinja":{"faint":["animation.shedinja.faint",3],"cry":["animation.shedinja.battle_cry",3],"recoil":["animation.shedinja.recoil",1.08],"physical":["animation.shedinja.physical",3],"special":["animation.shedinja.special",3],"status":["animation.shedinja.status",3]},"nosepass":{"faint":["animation.nosepass.faint",3],"cry":["animation.nosepass.battle_cry",3],"recoil":["animation.nosepass.recoil",0.63],"physical":["animation.nosepass.physical",3],"special":["animation.nosepass.special",3],"status":["animation.nosepass.status",3]},"skitty":{"faint":["animation.skitty.faint",3],"cry":["animation.skitty.battle_cry",3],"recoil":["animation.skitty.recoil",1],"physical":["animation.skitty.physical",3],"special":["animation.skitty.special",3],"status":["animation.skitty.status",3]},"mawile":{"cry":["animation.mawile.cry",1.5]},"electrike":{"cry":["animation.electrike.cry",1.5]},"manectric":{"cry":["animation.manectric.cry",1.5]},"plusle":{"faint":["animation.plusle.faint",3],"cry":["animation.plusle.cry",2],"recoil":["animation.plusle.recoil",2],"special":["animation.plusle.special",3],"status":["animation.plusle.status",3]},"minun":{"faint":["animation.minun.faint",3],"cry":["animation.minun.cry",2],"recoil":["animation.minun.recoil",2],"special":["animation.minun.special",3],"status":["animation.minun.status",3]},"wailmer":{"faint":["animation.wailmer.faint",3],"cry":["animation.wailmer.cry",2.48]},"wailord":{"faint":["animation.wailord.faint",3],"cry":["animation.wailord.cry",2.83]},"camerupt":{"cry":["animation.camerupt.cry",1.5]},"torkoal":{"faint":["animation.torkoal.faint",3],"cry":["animation.torkoal.cry",1.5]},"spinda":{"faint":["animation.spinda.faint",3],"cry":["animation.spinda.battle_cry",3],"recoil":["animation.spinda.recoil",1.5],"physical":["animation.spinda.physical",3],"special":["animation.spinda.special",3],"status":["animation.spinda.status",3]},"flygon":{"cry":["animation.flygon.cry",3]},"cacnea":{"faint":["animation.cacnea.faint",3],"cry":["animation.cacnea.cry",2],"recoil":["animation.cacnea.recoil",1.25],"physical":["animation.cacnea.physical",3],"special":["animation.cacnea.special",3],"status":["animation.cacnea.status",3]},"cacturne":{"cry":["animation.cacturne.cry",2],"recoil":["animation.cacturne.recoil",1.25]},"swablu":{"cry":["animation.swablu.cry",1.5]},"altaria":{"cry":["animation.altaria.cry",2.25]},"zangoose":{"cry":["animation.zangoose.cry",1.5]},"seviper":{"cry":["animation.seviper.cry",1.5]},"lunatone":{"cry":["animation.lunatone.battle_cry",3],"recoil":["animation.lunatone.recoil",1.75],"physical":["animation.lunatone.physical",3],"special":["animation.lunatone.special",3],"status":["animation.lunatone.status",3]},"solrock":{"cry":["animation.solrock.battle_cry",3],"recoil":["animation.solrock.recoil",1.75],"physical":["animation.solrock.physical",3],"special":["animation.solrock.special",3],"status":["animation.solrock.status",3]},"corphish":{"cry":["animation.corphish.cry",1.2]},"crawdaunt":{"cry":["animation.crawdaunt.cry",1.2]},"baltoy":{"faint":["animation.baltoy.faint",3],"cry":["animation.baltoy.cry",1.25]},"claydol":{"faint":["animation.claydol.faint",3],"cry":["animation.claydol.cry",1.75]},"feebas":{"cry":["animation.feebas.cry",1]},"milotic":{"cry":["animation.milotic.cry",2.75]},"kecleon":{"cry":["animation.kecleon.cry",1]},"shuppet":{"cry":["animation.shuppet.cry",1.5]},"banette":{"cry":["animation.banette.cry",1.5]},"tropius":{"faint":["animation.tropius.faint",3],"cry":["animation.tropius.cry",2.58],"recoil":["animation.tropius.recoil",1.5]},"chimecho":{"faint":["animation.chimecho.faint",3],"cry":["animation.chimecho.cry",1.5]},"absol":{"cry":["animation.absol.cry",1]},"wynaut":{"cry":["animation.wynaut.cry",1.2]},"snorunt":{"cry":["animation.snorunt.cry",1]},"glalie":{"cry":["animation.glalie.cry",1]},"spheal":{"cry":["animation.spheal.cry",1.2]},"sealeo":{"cry":["animation.sealeo.cry",1.2]},"walrein":{"cry":["animation.walrein.cry",2.67]},"relicanth":{"cry":["animation.relicanth.cry",1.25]},"luvdisc":{"faint":["animation.luvdisc.ground_faint",2.55,1]},"bagon":{"cry":["animation.bagon.cry",1.25]},"shelgon":{"cry":["animation.shelgon.cry",1.5]},"salamence":{"cry":["animation.salamence.cry",2.5]},"beldum":{"cry":["animation.beldum.battle_cry",3],"recoil":["animation.beldum.recoil",1.75],"physical":["animation.beldum.physical",3],"special":["animation.beldum.special",3],"status":["animation.beldum.status",3]},"metang":{"cry":["animation.metang.battle_cry",3],"recoil":["animation.metang.recoil",2],"physical":["animation.metang.physical",3],"special":["animation.metang.special",3],"status":["animation.metang.status",3]},"metagross":{"cry":["animation.metagross.battle_cry",3],"recoil":["animation.metagross.recoil",3],"physical":["animation.metagross.air_physical",3],"special":["animation.metagross.air_special",3],"status":["animation.metagross.air_status",3.04],"air_physical":["animation.metagross.air_physical",3],"air_special":["animation.metagross.air_special",3],"air_status":["animation.metagross.air_status",3.04]},"prinplup":{"cry":["animation.prinplup.cry",1.5],"recoil":["animation.prinplup.recoil",1,1]},"empoleon":{"recoil":["animation.empoleon.recoil",1,1]},"starly":{"cry":["animation.starly.cry",1.5]},"staravia":{"cry":["animation.staravia.cry",1.5]},"staraptor":{"cry":["animation.staraptor.cry",4],"recoil":["animation.staraptor.recoil",3]},"bidoof":{"faint":["animation.bidoof.faint",3],"cry":["animation.bidoof.cry",1.25]},"cranidos":{"faint":["animation.cranidos.faint",3],"cry":["animation.cranidos.cry",2]},"rampardos":{"faint":["animation.rampardos.faint",3],"cry":["animation.rampardos.cry",2.75]},"bastiodon":{"faint":["animation.bastiodon.faint",3],"cry":["animation.bastiodon.cry",3]},"cherubi":{"cry":["animation.cherubi.cry",1.5]},"shellos":{"cry":["animation.shellos.cry",1.5],"faint":["animation.shellos.faint",3],"recoil":["animation.shellos.recoil",1.38]},"gastrodon_east":{"special":["animation.gastrodon_east.special",3],"physical":["animation.gastrodon_east.physical",3]},"gastrodon_west":{"special":["animation.gastrodon_west.special",3],"physical":["animation.gastrodon_west.physical",3]},"drifblim":{"faint":["animation.drifblim.faint",3],"cry":["animation.drifblim.cry",1.54]},"buneary":{"cry":["animation.buneary.cry",1.54]},"lopunny":{"cry":["animation.lopunny.cry",1.96]},"glameow":{"cry":["animation.glameow.cry",1.25]},"purugly":{"cry":["animation.purugly.cry",1.25]},"chingling":{"cry":["animation.chingling.cry",1.67]},"bronzor":{"cry":["animation.bronzor.cry",1]},"bronzong":{"faint":["animation.bronzong.faint",3],"cry":["animation.bronzong.battle_cry",4.5],"recoil":["animation.bronzong.recoil",2],"physical":["animation.bronzong.physical",4],"status":["animation.bronzong.status",4.5]},"happiny":{"faint":["animation.happiny.faint",3],"cry":["animation.happiny.battle_cry",3],"recoil":["animation.happiny.recoil",1.75],"physical":["animation.happiny.physical",3],"special":["animation.happiny.special",3],"status":["animation.happiny.status",3]},"gible":{"cry":["animation.gible.cry",1.5]},"gabite":{"cry":["animation.gabite.cry",1.5]},"garchomp":{"cry":["animation.garchomp.cry",2.5],"recoil":["animation.garchomp.recoil",1.5],"special":["animation.garchomp.special",3],"status":["animation.garchomp.status",3],"physical":["animation.garchomp.physical",3]},"munchlax":{"cry":["animation.munchlax.cry",2.38],"recoil":["animation.munchlax.recoil",2.71]},"riolu":{"cry":["animation.riolu.cry",1]},"lucario":{"cry":["animation.lucario.cry",1.5]},"skorupi":{"cry":["animation.skorupi.cry",1.25]},"drapion":{"cry":["animation.drapion.cry",1.25]},"croagunk":{"recoil":["animation.croagunk.recoil",0.58],"faint":["animation.croagunk.faint",3],"physical":["animation.croagunk.physical",3],"special":["animation.croagunk.special",3],"status":["animation.croagunk.status",3],"cry":["animation.croagunk.battle_cry",3]},"toxicroak":{"recoil":["animation.toxicroak.recoil",1],"faint":["animation.toxicroak.faint",3],"physical":["animation.toxicroak.physical",3],"special":["animation.toxicroak.special",3],"status":["animation.toxicroak.status",3],"cry":["animation.toxicroak.battle_cry",3]},"finneon":{"cry":["animation.finneon.cry",1.5],"faint":["animation.finneon.ground_faint",3]},"lumineon":{"cry":["animation.lumineon.cry",2.5]},"mantyke":{"cry":["animation.mantyke.cry",0.75]},"weavile":{"cry":["animation.weavile.cry",1],"recoil":["animation.weavile.recoil",1.25]},"magnezone":{"faint":["animation.magnezone.faint",2.38],"cry":["animation.magnezone.cry",1.2]},"lickilicky":{"cry":["animation.lickilicky.cry",1.5]},"rhyperior":{"cry":["animation.rhyperior.battle_cry",3],"recoil":["animation.rhyperior.recoil",2.5],"physical":["animation.rhyperior.physical",3],"special":["animation.rhyperior.special",3],"status":["animation.rhyperior.status",3]},"magmortar":{"cry":["animation.magmortar.cry",1.2]},"togekiss":{"faint":["animation.togekiss.faint",3],"cry":["animation.togekiss.battle_cry",3],"recoil":["animation.togekiss.air_recoil",1.75],"special":["animation.togekiss.special",4],"status":["animation.togekiss.status",3]},"leafeon":{"cry":["animation.leafeon.cry",1.2]},"glaceon":{"cry":["animation.glaceon.cry",1.2]},"mamoswine":{"faint":["animation.mamoswine.faint",3],"cry":["animation.mamoswine.battle_cry",3],"recoil":["animation.mamoswine.recoil",1.5],"physical":["animation.mamoswine.physical",3],"special":["animation.mamoswine.special",3],"status":["animation.mamoswine.status",3]},"probopass":{"faint":["animation.probopass.faint",3],"cry":["animation.probopass.battle_cry",3],"recoil":["animation.probopass.recoil",0.92],"physical":["animation.probopass.physical",3],"special":["animation.probopass.special",3],"status":["animation.probopass.status",3]},"dusknoir":{"faint":["animation.dusknoir.faint",3],"cry":["animation.dusknoir.battle_cry",3.5],"recoil":["animation.dusknoir.recoil",0.92],"physical":["animation.dusknoir.physical",3],"special":["animation.dusknoir.special",3],"status":["animation.dusknoir.status",3.5]},"froslass":{"cry":["animation.froslass.cry",1]},"snivy":{"cry":["animation.snivy.cry",1.2]},"servine":{"cry":["animation.servine.cry",1.2]},"serperior":{"cry":["animation.serperior.cry",2]},"tepig":{"cry":["animation.tepig.cry",2],"recoil":["animation.tepig.recoil",1.5]},"pignite":{"cry":["animation.pignite.cry",2.5],"recoil":["animation.pignite.recoil",1.5]},"emboar":{"cry":["animation.emboar.cry",2.5],"recoil":["animation.pignite.recoil",1.5]},"oshawott":{"cry":["animation.oshawott.cry",0.58]},"dewott":{"cry":["animation.dewott.cry",0.88]},"purrloin":{"faint":["animation.purrloin.faint",3],"recoil":["animation.purrloin.recoil",1.21],"cry":["animation.purrloin.battle_cry",3],"physical":["animation.purrloin.physical",3],"special":["animation.purrloin.special",3],"status":["animation.purrloin.status",3]},"liepard":{"faint":["animation.liepard.faint",3],"recoil":["animation.liepard.recoil",1.5],"cry":["animation.liepard.status",3],"physical":["animation.liepard.physical",3],"special":["animation.liepard.special",3],"status":["animation.liepard.status",3]},"pansage":{"cry":["animation.pansage.cry",1]},"simisage":{"cry":["animation.simisage.cry",1]},"pansear":{"cry":["animation.pansear.cry",1]},"simisear":{"cry":["animation.simisear.cry",1]},"panpour":{"cry":["animation.panpour.cry",1]},"simipour":{"cry":["animation.simipour.cry",1]},"munna":{"cry":["animation.munna.cry",1]},"musharna":{"cry":["animation.musharna.cry",1]},"pidove":{"cry":["animation.pidove.cry",1],"recoil":["animation.pidove.recoil",1.06]},"tranquill":{"cry":["animation.tranquill.cry",1.5],"recoil":["animation.tranquill.recoil",1.5]},"blitzle":{"cry":["animation.blitzle.cry",1.33],"recoil":["animation.blitzle.recoil",0.96]},"zebstrika":{"cry":["animation.zebstrika.battle_cry",3],"recoil":["animation.zebstrika.recoil",1.25],"physical":["animation.zebstrika.physical",3],"special":["animation.zebstrika.special",3],"status":["animation.zebstrika.status",3]},"drilbur":{"cry":["animation.drilbur.battle_cry",3],"recoil":["animation.drilbur.recoil",2],"physical":["animation.drilbur.physical",3],"special":["animation.drilbur.special",3],"status":["animation.drilbur.status",3]},"excadrill":{"cry":["animation.excadrill.battle_cry",3],"physical":["animation.excadrill.physical",3],"special":["animation.excadrill.special",3],"status":["animation.excadrill.status",3]},"audino":{"cry":["animation.audino.cry",1.5]},"throh":{"cry":["animation.throh.cry",1.25]},"sawk":{"cry":["animation.sawk.cry",1.25]},"sewaddle":{"cry":["animation.sewaddle.cry",1],"recoil":["animation.sewaddle.recoil",0.75]},"swadloon":{"cry":["animation.swadloon.cry",1],"recoil":["animation.swadloon.recoil",1]},"leavanny":{"recoil":["animation.leavanny.recoil",1],"cry":["animation.leavanny.cry",1.5]},"venipede":{"cry":["animation.venipede.cry",1]},"whirlipede":{"cry":["animation.whirlipede.cry",1.5]},"scolipede":{"cry":["animation.scolipede.cry_idle",2.75],"recoil":["animation.scolipede.recoil",1]},"cottonee":{"cry":["animation.cottonee.cry",1]},"whimsicott":{"faint":["animation.whimsicott.faint",3],"cry":["animation.whimsicott.battle_cry",3],"recoil":["animation.whimsicott.recoil",2.5],"special":["animation.whimsicott.special",3],"status":["animation.whimsicott.status",3]},"basculin":{"cry":["animation.basculin.cry",1.5]},"sandile":{"faint":["animation.sandile.faint",3],"cry":["animation.sandile.battle_cry",3],"recoil":["animation.sandile.sand_recoil",1.5],"physical":["animation.sandile.physical",3],"special":["animation.sandile.special",3],"status":["animation.sandile.status",3]},"krokorok":{"faint":["animation.krokorok.battle_faint",3.5],"cry":["animation.krokorok.battle_cry",3],"recoil":["animation.krokorok.sand_recoil",1.5],"physical":["animation.krokorok.physical",3],"special":["animation.krokorok.special",3],"status":["animation.krokorok.status",3]},"krookodile":{"faint":["animation.krookodile.faint",3],"cry":["animation.krookodile.battle_cry",3],"recoil":["animation.krookodile.sand_recoil",1.5],"physical":["animation.krookodile.physical",3],"special":["animation.krookodile.special",3],"status":["animation.krookodile.status",3]},"darmanitan":{"cry":["animation.darmanitan.cry",1.5]},"maractus":{"cry":["animation.maractus.cry",1.25]},"dwebble":{"faint":["animation.dwebble.faint",3],"cry":["animation.dwebble.battle_cry",3],"recoil":["animation.dwebble.recoil",1],"physical":["animation.dwebble.physical",3],"special":["animation.dwebble.special",3],"status":["animation.dwebble.status",3]},"crustle":{"faint":["animation.crustle.faint",3],"cry":["animation.crustle.battle_cry",3],"recoil":["animation.crustle.recoil",1.17],"physical":["animation.crustle.physical",3],"special":["animation.crustle.special",3],"status":["animation.crustle.status",3]},"sigilyph":{"faint":["animation.sigilyph.faint",3],"cry":["animation.sigilyph.cry",1.2]},"yamask":{"faint":["animation.yamask.faint",3],"cry":["animation.yamask.cry",1.29]},"cofagrigus":{"faint":["animation.cofagrigus.faint",3],"cry":["animation.cofagrigus.cry",1.25]},"carracosta":{"cry":["animation.carracosta.cry",1.75]},"archeops":{"cry":["animation.archeops.air_cry",2.5]},"trubbish":{"cry":["animation.trubbish.cry",1]},"garbodor":{"cry":["animation.garbodor.cry",1]},"ducklett":{"cry":["animation.ducklett.cry",1]},"swanna":{"cry":["animation.swanna.cry",1]},"jellicent":{"recoil":["animation.jellicent.recoil",0.75],"special":["animation.jellicent.special",3],"physical":["animation.jellicent.physical",3]},"joltik":{"cry":["animation.joltik.cry",0.83]},"galvantula":{"cry":["animation.galvantula.cry",1.75]},"ferroseed":{"cry":["animation.ferroseed.cry",1.5]},"ferrothorn":{"cry":["animation.ferrothorn.cry",1]},"klink":{"faint":["animation.klink.faint",3],"cry":["animation.klink.battle_cry",3],"physical":["animation.klink.physical",3],"special":["animation.klink.special",3],"status":["animation.klink.status",3],"recoil":["animation.klink.recoil",1.5]},"klang":{"faint":["animation.klang.faint",3],"cry":["animation.klang.battle_cry",3],"physical":["animation.klang.physical",3],"special":["animation.klang.special",3],"status":["animation.klang.status",3],"recoil":["animation.klang.recoil",1.5]},"klinklang":{"faint":["animation.klinklang.faint",3],"cry":["animation.klinklang.battle_cry",3],"recoil":["animation.klinklang.recoil",1.5],"physical":["animation.klinklang.physical",3],"special":["animation.klinklang.special",3],"status":["animation.klinklang.status",3]},"tynamo":{"cry":["animation.tynamo.cry",1.25]},"eelektrik":{"cry":["animation.eelektrik.cry",1.25]},"eelektross":{"cry":["animation.eelektross.cry",1.25]},"elgyem":{"cry":["animation.elgyem.cry",1.5],"recoil":["animation.elgyem.recoil",1.75]},"beheeyem":{"cry":["animation.beheeyem.cry",1.5]},"litwick":{"cry":["animation.litwick.cry",1.25]},"lampent":{"cry":["animation.lampent.cry",1.25]},"chandelure":{"cry":["animation.chandelure.cry",1.25]},"axew":{"cry":["animation.axew.cry",1],"recoil":["animation.axew.recoil",1.5],"physical":["animation.axew.physical",3],"special":["animation.axew.special",3],"status":["animation.axew.status",3]},"fraxure":{"cry":["animation.fraxure.cry",1.25]},"haxorus":{"cry":["animation.haxorus.cry",1.58]},"stunfisk":{"cry":["animation.stunfisk.cry",1.25]},"mienfoo":{"cry":["animation.mienfoo.cry",1.25]},"mienshao":{"cry":["animation.mienshao.cry",1]},"golett":{"faint":["animation.golett.faint",2.13]},"golurk":{"faint":["animation.golurk.faint",2.55],"highhorsepower":["animation.golurk.physical2",3],"stompingtantrum":["animation.golurk.physical2",3],"heavyslam":["animation.golurk.physical2",3],"earthquake":["animation.golurk.physical2",3],"bulldoze":["animation.golurk.physical2",3],"rocktomb":["animation.golurk.physical2",3],"bodyslam":["animation.golurk.physical2",3],"rockslide":["animation.golurk.physical2",3],"bodypress":["animation.golurk.physical2",3],"smackdown":["animation.golurk.physical2",3],"heatcrash":["animation.golurk.physical2",3],"hardpress":["animation.golurk.physical2",3],"physical":["animation.golurk.physical",3],"special":["animation.golurk.special",3],"status":["animation.golurk.status",3],"cry":["animation.golurk.battle_cry",3],"recoil":["animation.golurk.recoil",0.83]},"bouffalant":{"faint":["animation.bouffalant.faint",3],"cry":["animation.bouffalant.battle_cry",3],"physical":["animation.bouffalant.physical",3],"status":["animation.bouffalant.status",3]},"rufflet":{"cry":["animation.rufflet.cry",0.79],"recoil":["animation.rufflet.recoil",1]},"braviary":{"cry":["animation.braviary.cry",2],"recoil":["animation.braviary.recoil",1]},"deino":{"cry":["animation.deino.cry",1.25]},"zweilous":{"cry":["animation.zweilous.cry",1.25]},"hydreigon":{"cry":["animation.hydreigon.cry",2.75]},"larvesta":{"faint":["animation.larvesta.faint",3],"cry":["animation.larvesta.battle_cry",3],"recoil":["animation.larvesta.recoil",1.29],"physical":["animation.larvesta.physical",3],"special":["animation.larvesta.special",3],"status":["animation.larvesta.status",3]},"volcarona":{"faint":["animation.volcarona.faint",3],"cry":["animation.volcarona.battle_cry",3],"recoil":["animation.volcarona.recoil",1.25],"physical":["animation.volcarona.physical",3],"special":["animation.volcarona.special",3],"status":["animation.volcarona.status",3]},"chespin":{"cry":["animation.chespin.cry",1]},"quilladin":{"cry":["animation.quilladin.cry",1.5]},"chesnaught":{"cry":["animation.chesnaught.cry",2]},"fennekin":{"cry":["animation.fennekin.cry",0.75]},"braixen":{"cry":["animation.braixen.cry",1]},"delphox":{"cry":["animation.delphox.cry",1.75],"special":["animation.delphox.special",3]},"froakie":{"cry":["animation.froakie.cry",1.5],"faint":["animation.froakie.faint",3]},"frogadier":{"cry":["animation.frogadier.cry",1.42],"faint":["animation.frogadier.faint",3]},"greninja":{"cry":["animation.greninja.battle_cry",3],"faint":["animation.greninja.faint",3],"recoil":["animation.greninja.recoil",0.71],"physical":["animation.greninja.physical",3],"lick":["animation.greninja.physical_tongue",3],"gunkshot":["animation.greninja.physical_tongue",3],"bounce":["animation.greninja.physical_tongue",3],"thief":["animation.greninja.physical_tongue",3],"pound":["animation.greninja.physical_tongue",3],"punch":["animation.greninja.physical_tongue",3],"kick":["animation.greninja.physical_kick",3],"lowkick":["animation.greninja.physical_kick",3],"lowsweep":["animation.greninja.physical_kick",3],"acrobatics":["animation.greninja.physical_kick",3],"takedown":["animation.greninja.physical_kick",3],"gigaimpact":["animation.greninja.physical_kick",3],"liquidation":["animation.greninja.physical_kick",3],"cut":["animation.greninja.physical_katana",3],"aerialace":["animation.greninja.physical_katana",3],"nightslash":["animation.greninja.physical_katana",3],"falseswipe":["animation.greninja.physical_katana",3],"watershuriken_2hit":["animation.greninja.watershuriken_2hit",1.88],"watershuriken_3hit":["animation.greninja.watershuriken_3hit",2.5],"watershuriken_4hit":["animation.greninja.watershuriken_4hit",3.5],"watershuriken_5hit":["animation.greninja.watershuriken_5hit",4.67],"special":["animation.greninja.special",3],"status":["animation.greninja.status",3]},"diggersby":{"cry":["animation.diggersby.cry",2]},"fletchling":{"cry":["animation.fletchling.cry",1],"recoil":["animation.fletchling.recoil",0.71]},"fletchinder":{"cry":["animation.fletchinder.cry",1.5],"recoil":["animation.fletchling.recoil",0.71]},"talonflame":{"cry":["animation.talonflame.cry",1.75]},"litleo":{"cry":["animation.litleo.cry",1.5]},"skiddo":{"faint":["animation.skiddo.faint",3],"cry":["animation.skiddo.battle_cry",3],"recoil":["animation.skiddo.recoil",1.5],"physical":["animation.skiddo.physical",3],"special":["animation.skiddo.special",3],"status":["animation.skiddo.status",3]},"gogoat":{"cry":["animation.gogoat.cry",2]},"pancham":{"cry":["animation.pancham.cry",1.25]},"pangoro":{"cry":["animation.pangoro.cry",1.08]},"espurr":{"cry":["animation.espurr.cry",1.25]},"honedge":{"cry":["animation.honedge.cry",1,1]},"doublade":{"cry":["animation.doublade.cry",1,1]},"aegislash":{"cry":["animation.aegislash.cry",1,1]},"spritzee":{"cry":["animation.spritzee.cry",0.88]},"aromatisse":{"cry":["animation.aromatisse.cry",1.75]},"swirlix":{"cry":["animation.swirlix.cry",1.25]},"slurpuff":{"cry":["animation.slurpuff.cry",1.25]},"inkay":{"cry":["animation.inkay.cry",1]},"malamar":{"cry":["animation.malamar.cry",1]},"binacle":{"cry":["animation.binacle.cry",1]},"barbaracle":{"cry":["animation.barbaracle.cry",1]},"helioptile":{"cry":["animation.helioptile.cry",1.21]},"heliolisk":{"cry":["animation.heliolisk.cry",1.25]},"tyrantrum":{"cry":["animation.tyrantrum.battle_cry",3],"recoil":["animation.tyrantrum.recoil",2.54],"physical":["animation.tyrantrum.physical",3],"special":["animation.tyrantrum.special",3],"status":["animation.tyrantrum.status",3]},"amaura":{"faint":["animation.amaura.faint",3],"cry":["animation.amaura.cry",3]},"sylveon":{"cry":["animation.sylveon.cry",1.2]},"hawlucha":{"cry":["animation.hawlucha.cry",1]},"dedenne":{"cry":["animation.dedenne.cry",0.95]},"goomy":{"faint":["animation.goomy.faint",3],"cry":["animation.goomy.battle_cry",3],"recoil":["animation.goomy.recoil",1.5],"physical":["animation.goomy.physical",3],"special":["animation.goomy.special",3],"status":["animation.goomy.status",3]},"sliggoo":{"cry":["animation.sliggoo.battle_cry",2],"recoil":["animation.sliggoo.recoil",1.17]},"goodra":{"cry":["animation.goodra.cry",1.75],"recoil":["animation.goodra.recoil",1.25]},"trevenant":{"faint":["animation.trevenant.battle_faint",3,1],"cry":["animation.trevenant.battle_cry",4]},"avalugg":{"cry":["animation.avalugg.cry",1.5]},"noibat":{"cry":["animation.noibat.cry",1]},"noivern":{"cry":["animation.noivern.cry",1.71]},"litten":{"cry":["animation.litten.cry",2.5],"recoil":["animation.litten.recoil",1.5]},"torracat":{"cry":["animation.torracat.cry",2.67],"recoil":["animation.torracat.recoil",1.5]},"incineroar":{"cry":["animation.incineroar.battle_cry",3.5],"recoil":["animation.incineroar.recoil",1.5]},"brionne":{"faint":["animation.brionne.faint",3],"cry":["animation.brionne.cry",2]},"primarina":{"faint":["animation.primarina.faint",3],"cry":["animation.primarina.cry",2]},"pikipek":{"cry":["animation.pikipek.cry",1,1]},"trumbeak":{"cry":["animation.trumbeak.cry",0.5]},"yungoos":{"cry":["animation.yungoos.cry",2],"recoil":["animation.yungoos.recoil",0.75]},"gumshoos":{"cry":["animation.gumshoos.cry",2],"recoil":["animation.gumshoos.recoil",0.75]},"grubbin":{"cry":["animation.grubbin.cry",0.75],"physical":["animation.grubbin.physical",3]},"charjabug":{"cry":["animation.charjabug.cry",0.75]},"vikavolt":{"cry":["animation.vikavolt.battle_cry",3],"recoil":["animation.vikavolt.air_recoil",1.5],"physical":["animation.vikavolt.physical",3],"special":["animation.vikavolt.special",3],"status":["animation.vikavolt.status",3]},"cutiefly":{"faint":["animation.cutiefly.faint",2.68],"cry":["animation.cutiefly.cry",1.25]},"ribombee":{"faint":["animation.ribombee.faint",3],"cry":["animation.ribombee.cry",1.08]},"rockruff":{"cry":["animation.rockruff.cry",1.5]},"mareanie":{"cry":["animation.mareanie.cry",1.2]},"toxapex":{"cry":["animation.toxapex.cry",1.2]},"mudsdale":{"cry":["animation.mudsdale.cry",1.5]},"dewpider":{"cry":["animation.dewpider.cry",1]},"araquanid":{"cry":["animation.araquanid.cry",1]},"fomantis":{"cry":["animation.fomantis.cry",1]},"lurantis":{"cry":["animation.lurantis.cry",1.25]},"palossand":{"recoil":["animation.palossand.recoil",1,1]},"togedemaru":{"cry":["animation.togedemaru.cry",0.79]},"mimikyu":{"cry":["animation.mimikyu.cry",1],"recoil":["animation.mimikyu.recoil",2],"physical":["animation.mimikyu.physical",3]},"bruxish":{"recoil":["animation.bruxish.recoil",1,1],"cry":["animation.bruxish.cry",1.2]},"drampa":{"cry":["animation.drampa.cry",4],"recoil":["animation.drampa.recoil",1.5],"yawn":["animation.drampa.yawn_quirk",6]},"dhelmise":{"faint":["animation.dhelmise.faint",3]},"scorbunny":{"cry":["animation.scorbunny.cry",2]},"cinderace":{"cry":["animation.cinderace.battle_cry",3],"recoil":["animation.cinderace.recoil",0.38],"pyroball":["animation.cinderace.pyroball",3.75],"physical":["animation.cinderace.physical",3],"special":["animation.cinderace.special",3],"status":["animation.cinderace.status",3]},"sobble":{"cry":["animation.sobble.cry",1.75]},"drizzile":{"cry":["animation.drizzile.cry",1.75]},"inteleon":{"cry":["animation.inteleon.cry",2]},"greedent":{"recoil":["animation.greedent.recoil",1.5]},"rookidee":{"cry":["animation.rookidee.battle_cry",2.5],"recoil":["animation.rookidee.recoil",1.5],"physical":["animation.rookidee.physical",3],"special":["animation.rookidee.special",3],"status":["animation.rookidee.status",2.5]},"corvisquire":{"cry":["animation.corvisquire.cry",2.5],"recoil":["animation.corvisquire.recoil",1.5]},"corviknight":{"cry":["animation.corviknight.cry",2.17]},"nickit":{"cry":["animation.nickit.cry",1.08]},"thievul":{"cry":["animation.thievul.cry",1.5]},"gossifleur":{"cry":["animation.gossifleur.cry",1.5],"recoil":["animation.gossifleur.recoil",1.17]},"eldegoss":{"cry":["animation.eldegoss.cry",2],"recoil":["animation.eldegoss.recoil",1.17]},"chewtle":{"cry":["animation.chewtle.cry",1.25]},"drednaw":{"cry":["animation.drednaw.cry",1.25]},"applin":{"cry":["animation.applin.cry",1.2]},"flapple":{"cry":["animation.flapple.cry",1]},"appletun":{"cry":["animation.appletun.cry",3]},"silicobra":{"cry":["animation.silicobra.cry",1]},"sandaconda":{"cry":["animation.sandaconda.cry",1]},"hatenna":{"cry":["animation.hatenna.cry",1.2]},"hattrem":{"cry":["animation.hattrem.cry",1.2]},"hatterene":{"cry":["animation.hatterene.cry",1.2]},"cursola":{"faint":["animation.cursola.faint",3],"cry":["animation.cursola.cry",4],"recoil":["animation.cursola.recoil",1.25],"special":["animation.cursola.special",3]},"runerigus":{"cry":["animation.runerigus.cry",1.25]},"falinks":{"physical":["animation.falinks.physical",1.46],"faint":["animation.falinks.faint",2.22],"cry":["animation.falinks.cry",1]},"pincurchin":{"cry":["animation.pincurchin.cry",1.2]},"stonjourner":{"faint":["animation.stonjourner.faint",3],"cry":["animation.stonjourner.cry",2.13],"recoil":["animation.stonjourner.recoil",1.5]},"cufant":{"special":["animation.cufant.special",3],"physical":["animation.cufant.physical",3]},"copperajah":{"special":["animation.copperajah.special",3],"physical":["animation.copperajah.physical",3]},"duraludon":{"faint":["animation.duraludon.faint",3],"cry":["animation.duraludon.battle_cry",3],"recoil":["animation.duraludon.recoil",0.58],"physical":["animation.duraludon.physical",3],"special":["animation.duraludon.special",3],"status":["animation.duraludon.status",3]},"dreepy":{"faint":["animation.dreepy.faint",3.25],"cry":["animation.dreepy.cry",1.5]},"drakloak":{"cry":["animation.drakloak.cry",1.75]},"dragapult":{"cry":["animation.dragapult.cry",2],"recoil":["animation.dragapult.recoil",1],"physical":["animation.dragapult.physical",3.75],"special":["animation.dragapult.special",3],"dragondarts":["animation.dragapult.special",3]},"zarude":{"cry":["animation.zarude.cry",1.5]},"wyrdeer":{"cry":["animation.wyrdeer.cry",2.25]},"kleavor":{"recoil":["animation.kleavor.recoil",1.5],"physical":["animation.kleavor.physical",3],"special":["animation.kleavor.special",3],"status":["animation.kleavor.status",3]},"ursaluna":{"cry":["animation.ursaluna.cry",1.5],"recoil":["animation.ursaluna.recoil",1]},"basculegion":{"cry":["animation.basculegion.cry",1.5]},"sneasler":{"cry":["animation.sneasler.cry",1],"recoil":["animation.sneasler.recoil",1.25]},"sprigatito":{"cry":["animation.sprigatito.cry",1.5]},"floragato":{"cry":["animation.floragato.battle_cry_merged",2.67]},"meowscarada":{"cry":["animation.meowscarada.cry",2.04]},"quaxly":{"cry":["animation.quaxly.cry",1],"faint":["animation.quaxly.faint",3]},"lechonk":{"faint":["animation.lechonk.battle_faint",3],"cry":["animation.lechonk.cry",1.5],"recoil":["animation.lechonk.recoil",1.5]},"oinkologne_female":{"recoil":["animation.oinkologne_female.recoil",1.5]},"oinkologne_male":{"recoil":["animation.oinkologne_male.recoil",1.5]},"garganacl":{"cry":["animation.garganacl.cry",1.25]},"armarouge":{"faint":["animation.armarouge.faint",3],"cry":["animation.armarouge.battle_cry",3],"recoil":["animation.armarouge.recoil",1],"physical":["animation.armarouge.physical",3],"special":["animation.armarouge.special",3],"status":["animation.armarouge.status",3]},"ceruledge":{"faint":["animation.ceruledge.faint",3],"cry":["animation.ceruledge.battle_cry",3],"recoil":["animation.ceruledge.recoil",1.25],"physical":["animation.ceruledge.physical",3],"special":["animation.ceruledge.special",3],"status":["animation.ceruledge.status",3]},"tadbulb":{"faint":["animation.tadbulb.faint",3],"cry":["animation.tadbulb.battle_cry",3],"recoil":["animation.tadbulb.recoil",1],"physical":["animation.tadbulb.physical",3],"special":["animation.tadbulb.special",3],"status":["animation.tadbulb.status",3]},"bellibolt":{"faint":["animation.bellibolt.faint",3],"cry":["animation.bellibolt.battle_cry",3],"recoil":["animation.bellibolt.recoil",1],"physical":["animation.bellibolt.physical",3],"special":["animation.bellibolt.special",3],"status":["animation.bellibolt.status",3]},"kilowattrel":{"cry":["animation.kilowattrel.cry",1.83],"physical":["animation.kilowattrel.physical",3],"special":["animation.kilowattrel.special",3]},"shroodle":{"cry":["animation.shroodle.cry",1.13]},"grafaiai":{"cry":["animation.grafaiai.cry",2]},"bramblin":{"cry":["animation.bramblin.cry",1]},"brambleghast":{"cry":["animation.brambleghast.cry",1]},"klawf":{"cry":["animation.klawf.cry",1.75]},"capsakid":{"cry":["animation.capsakid.battle_cry",3],"recoil":["animation.capsakid.recoil",0.75],"status":["animation.capsakid.status",3]},"scovillain":{"cry":["animation.scovillain.cry",2.5],"recoil":["animation.scovillain.recoil",1]},"rellor":{"cry":["animation.rellor.battle_cry",3],"recoil":["animation.rellor.recoil",0.75],"physical":["animation.rellor.physical",3],"special":["animation.rellor.special",3],"status":["animation.rellor.status",3]},"rabsca":{"cry":["animation.rabsca.battle_cry",3],"physical":["animation.rabsca.physical",3],"special":["animation.rabsca.special",3],"status":["animation.rabsca.status",3]},"espathra":{"faint":["animation.espathra.faint",3],"cry":["animation.espathra.cry",2]},"tinkatink":{"faint":["animation.tinkatink.faint",3],"cry":["animation.tinkatink.cry",1.5]},"tinkatuff":{"faint":["animation.tinkatuff.faint",3],"cry":["animation.tinkatuff.cry",1.5]},"tinkaton":{"physical":["animation.tinkaton.physical",3],"special":["animation.tinkaton.special",3],"status":["animation.tinkaton.status",3],"gigatonhammer":["animation.tinkaton.signature",3.33],"recoil":["animation.tinkaton.recoil",0.29],"faint":["animation.tinkaton.faint",3],"cry":["animation.tinkaton.battle_cry",3]},"wiglett":{"recoil":["animation.wiglett.recoil",1]},"wugtrio":{"recoil":["animation.wugtrio.recoil",1]},"finizen":{"cry":["animation.finizen.cry",1.2]},"varoom":{"cry":["animation.varoom.cry",2]},"revavroom":{"cry":["animation.revavroom.cry",2.25]},"cyclizar":{"cry":["animation.cyclizar.cry",1.25]},"orthworm":{"faint":["animation.orthworm.faint",3],"cry":["animation.orthworm.cry",2.75],"recoil":["animation.orthworm.recoil",0.58],"physical":["animation.orthworm.physical",3],"special":["animation.orthworm.special",3],"status":["animation.orthworm.status",3]},"glimmet":{"faint":["animation.glimmet.faint",3],"cry":["animation.glimmet.cry",1.33]},"glimmora":{"cry":["animation.glimmora.cry",1.25]},"flamigo":{"cry":["animation.flamigo.cry",3],"recoil":["animation.flamigo.recoil",1.5]},"dondozo":{"cry":["animation.dondozo.cry",2.5],"sleep":["animation.dondozo.water_sleep",1,1]},"annihilape":{"faint":["animation.annihilape.faint",3],"ragefist":["animation.annihilape.signature",3],"physical":["animation.annihilape.physical",3],"special":["animation.annihilape.special",3],"status":["animation.annihilape.status",3.25],"cry":["animation.annihilape.battle_cry",3.25],"recoil":["animation.annihilape.recoil",0.38]},"farigiraf":{"cry":["animation.farigiraf.cry",2],"recoil":["animation.farigiraf.recoil",1]},"dudunsparce":{"recoil":["animation.dudunsparce.recoil",1.5],"cry":["animation.dudunsparce.cry",2.5]},"dudunsparce_three_segment":{"recoil":["animation.dudunsparce_three_segment.recoil",1.5]},"gimmighoul":{"faint":["animation.gimmighoul_roaming.faint",3],"cry":["animation.gimmighoul_roaming.cry",3],"recoil":["animation.gimmighoul_roaming.recoil",1.5]},"gimmighoul_roaming":{"recoil":["animation.gimmighoul_roaming.recoil",1.5],"cry":["animation.gimmighoul_roaming.cry",3],"faint":["animation.gimmighoul_roaming.faint",3]},"gholdengo":{"cry":["animation.gholdengo.cry",3]},"dipplin":{"cry":["animation.dipplin.cry",1.5]},"archaludon":{"faint":["animation.archaludon.faint",3],"cry":["animation.archaludon.battle_cry",3.63],"recoil":["animation.archaludon.recoil",0.88],"physical":["animation.archaludon.physical",3],"special":["animation.archaludon.special",3],"status":["animation.archaludon.status",3.63]},"hydrapple":{"cry":["animation.hydrapple.cry",2.17]}}');
    MODEL_LOCATORS = JSON.parse('{"bulbasaur":{"root":[[0,0,0]],"middle":[[0,7,0]],"top":[[0,14,-0.1]],"target":[[0,9,-10]],"special":[[-33.15,6.5,0]],"mouth":[[0,4.5,-8.75]],"physical":[[-33.15,6.5,0]],"eye":[[-3.5,6.75,-8.75],[3.5,6.75,-8.75]],"face":[[0,7,-9]]},"ivysaur":{"root":[[0,0,0]],"middle":[[0,8.25,0.75]],"top":[[0,20.75,0]],"target":[[0,8.25,-13.75]],"special":[[-31.65,11,2]],"mouth":[[0,6,-10.75]],"physical":[[0,6,-10.75]],"eye":[[-3.5,7.75,-10.75],[3.5,7.75,-10.75]],"face":[[0,7.75,-11]]},"venusaur":{"root":[[0,0,0]],"middle":[[0,13,6.25]],"top":[[0,38.75,3]],"target":[[0,13,-25.75]],"special":[[-53,21.5,-0.5]],"mouth":[[-2.39,12,-29.4]],"physical":[[-2.39,12,-29.4]],"eye":[[6.25,15.75,-16.75],[-6.25,15.7,-16.95]],"face":[[8.44,15.66,-19.44]]},"charmander":{"root":[[0,0,0]],"middle":[[0,9,0]],"top":[[0,21.1,0]],"target":[[0,10,-6.2]],"special":[[0,13.78,-3.22]],"mouth":[[0,13.78,-3.22]],"hand_primary":[[-8.5,11,0]],"physical":[[-8.5,11,0]],"eye":[[-3,17.5,-4.5],[3,17.5,-4.5]],"face":[[0,17,-4.5]],"hand_secondary":[[8.5,11,0]]},"charmeleon":{"root":[[0,0,0]],"middle":[[0,13,0]],"top":[[0,28.5,0]],"target":[[0,15.25,-6.25]],"special":[[0,21.78,-2.35]],"mouth":[[0,21.78,-2.35]],"hand_primary":[[-15,16.5,0]],"physical":[[-15,16.5,0]],"eye":[[-4,24,-3.75],[4,24,-3.75]],"face":[[0,23.5,-6.75]],"hand_secondary":[[15,16.5,0]]},"charizard":{"root":[[0,0,0]],"middle":[[0,20,-0.5]],"top":[[0,41,0]],"target":[[0,20,-10]],"special":[[0,45.75,-2]],"mouth":[[0,45.75,-2]],"hand_primary":[[-21.5,23,0]],"physical":[[-21.5,23,0]],"eye":[[-2.5,48.5,0.5],[2.5,48.5,0.5]],"face":[[0,53.75,-0.25]],"hand_secondary":[[21.5,23,0]]},"squirtle":{"root":[[0,0,0]],"middle":[[0,9.25,0]],"top":[[0,18.5,0]],"target":[[0,8.5,-5]],"special":[[0,12.5,-5.5]],"mouth":[[0,12.1,-5.5]],"hand_primary":[[-9,10,-1]],"physical":[[0,8,0]],"eye":[[-2.5,15.5,-5.5],[2.5,15.5,-5.5]],"face":[[0,15.5,-5.5]],"hand_secondary":[[9,10,-1]]},"wartortle":{"root":[[0,0,0]],"middle":[[0,12.25,2]],"top":[[0,24.75,0]],"target":[[0,12.25,-5]],"special":[[0,16.75,-5]],"mouth":[[0,16.5,-5.05]],"hand_primary":[[-12,13.5,0]],"physical":[[0,25,-4]],"eye":[[-2.75,20.25,-5],[2.75,20.25,-5]],"face":[[0,19.75,-5]],"hand_secondary":[[12,13.5,0]]},"blastoise":{"root":[[0,0,0]],"middle":[[0,25,0]],"top":[[0,47,0]],"target":[[0,25,-16]],"special":[[-15,41,-12],[15,41,-12]],"mouth":[[0,41,-12.75]],"hand_primary":[[-18.5,59,-8]],"physical":[[-18.5,59,-8]],"eye":[[4,46,-12.5],[-4,46,-12.5]],"face":[[0,45,-17.25]],"hand_secondary":[[18.5,59,-8]]},"caterpie":{"root":[[0,0,0]],"middle":[[0,5,-0.5]],"top":[[0,10,-1]],"special":[[0,6,16.75]],"mouth":[[0,2.75,-13.05]],"physical":[[0,2.75,-13.05]],"eye":[[-4,6,-9.5],[4,6,-9.5]]},"metapod":{"root":[[0,0,0]],"middle":[[0,6,-1.75]],"top":[[0,15.2,-1.75]],"target":[[0,6.25,-8.5]],"special":[[0,5.8,-7]],"mouth":[[0,5.8,-7]],"physical":[[0,5.8,-7]],"eye":[[-3.5,8.53,-4.75],[3.5,8.53,-4.75]],"face":[[0,8.38,-8.47]]},"butterfree":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,27.25,0]],"target":[[0,12,-4.5]],"special":[[0,13.5,-3]],"mouth":[[0,13.5,-3]],"physical":[[0,13.5,-3]],"eye":[[2.75,15.5,-3.25],[-2.75,15.5,-3.25]],"face":[[0,15.5,-3.75]]},"weedle":{"root":[[0,0,0]],"middle":[[0,3.25,0.5]],"top":[[0,13.5,-1.5]],"target":[[0,5.75,-13]],"special":[[0,9,-8.5]],"physical":[[0,9,-8.5]],"eye":[[-2.25,5.25,-11],[2.25,5.25,-11]],"face":[[0,4.25,-12]]},"kakuna":{"root":[[0,0,0]],"middle":[[0,8,-0.5]],"top":[[0,16.52,-0.25]],"target":[[0,9,-5.5]],"special":[[0,15.9,-1.75]],"physical":[[0,15.9,-1.75]],"eye":[[-2,12.9,-4.5],[2,12.9,-4.5]],"face":[[0,12.9,-4.5]]},"beedrill":{"root":[[0,0,0]],"middle":[[0,13.5,-0.5]],"top":[[0,26,-1.75]],"target":[[0,13.75,-4.5]],"special":[[-23,16,-1],[23,16,-1]],"physical":[[-23,16,-1],[23,16,-1]],"eye":[[-2.5,20,-2.15],[2.5,20,-2.15]],"face":[[0,19.25,-5]]},"pidgey":{"root":[[0,0,0]],"middle":[[0,5.25,0]],"top":[[0,11.75,-0.25]],"target":[[0,6,-5.5]],"special":[[0,8.65,-2.8]],"mouth":[[0,8.65,-2.8]],"physical":[[0,8.82,-4.62]],"eye":[[-1.75,9.68,-2.77],[1.75,9.68,-2.77]],"face":[[0,9.8,-3.45]]},"pidgeotto":{"root":[[0,0,0]],"middle":[[0,6.75,-0.75]],"top":[[0,18,-1]],"target":[[0,8.5,-8.25]],"special":[[0,9.2,-9]],"mouth":[[0,9.2,-9]],"physical":[[0,9.43,-11]],"eye":[[1.55,10.53,-9.02],[-1.55,10.53,-9.02]],"face":[[0,10.25,-9.02]]},"pidgeot":{"root":[[0,0,0]],"middle":[[0,16.75,0]],"top":[[0,18,-1]],"target":[[0,18,-14.5]],"special":[[0,14.03,-11.62]],"mouth":[[0,14.03,-11.62]],"physical":[[-22,13.93,-11.67]],"eye":[[2.3,16.73,-11.37],[-2.3,16.73,-11.37]],"face":[[0,15.73,-13.9]]},"rattata":{"root":[[0,0,0]],"middle":[[0,5.75,-0.25]],"top":[[0,10.05,-1.25]],"target":[[0,9,-10]],"special":[[0,5.95,-8.75]],"mouth":[[0,5.95,-8.75]],"physical":[[0,5.95,-8.75]],"eye":[[-2.5,7.75,-6.35],[2.5,7.75,-6.35]],"face":[[0,7.25,-10.7]]},"raticate":{"root":[[0,0,0]],"middle":[[0,8.5,-0.5]],"top":[[0,19.13,0.23]],"target":[[0,7.15,-10.42]],"special":[[0,11.5,-7.25]],"mouth":[[0,11.5,-7.25]],"hand_primary":[[-9.1,7.25,-4.3]],"physical":[[-9.1,7.25,-4.3]],"eye":[[-4.5,15.85,-5.45],[4.5,15.85,-5.45]],"face":[[0,15.9,-9.6]],"hand_secondary":[[9.1,7.25,-4.3]]},"spearow":{"root":[[0,0,0]],"middle":[[0,7,0]],"top":[[0,15,0]],"target":[[0,7,-6]],"special":[[-9.5,9.15,-1]],"mouth":[[0,11.15,-4.95]],"physical":[[0,11.6,-6.75]],"eye":[[-1.5,12.6,-5.25],[1.5,12.6,-5.25]],"face":[[0,11.85,-7.1]]},"fearow":{"root":[[0,0,0]],"middle":[[0,16,0]],"top":[[0,32,0]],"target":[[0,16,-18]],"special":[[-39,18.25,-13.75]],"mouth":[[0,31.75,-20]],"physical":[[0,32,-38]],"eye":[[-2,33.75,-22],[2,33.75,-22]],"face":[[0,31,-34]]},"ekans":{"root":[[0,0,0]],"middle":[[0,2.5,25]],"top":[[0,8,0]],"target":[[0,2.5,-26]],"special":[[0,1.2,-25]],"mouth":[[0,1.2,-25]],"physical":[[0,1.2,-25]],"eye":[[-3.7,4.3,-19.8],[3.7,4.3,-19.8]],"face":[[0,3.2,-22]]},"arbok":{"root":[[0,0,0]],"middle":[[0,5,-5.75]],"top":[[0,31,0]],"target":[[0,17.75,-16.5]],"special":[[0,1.25,-54.75]],"mouth":[[0,1.25,-54.75]],"physical":[[0,1.25,-54.75]],"eye":[[-4,4,-55],[4,4,-55]],"face":[[0,3.5,-58.25]]},"pikachu":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,22,0]],"target":[[0,10,-6]],"special":[[-4.5,13.5,-4.75],[4.5,13.5,-4.75]],"mouth":[[0,12.75,-4.75]],"hand_primary":[[-9.25,9.75,-2.25]],"physical":[[0,16,17]],"eye":[[-2.75,15.7,-4],[2.75,15.7,-4]],"face":[[0,14.4,-4.75]],"hand_secondary":[[9.25,9.75,-2.25]]},"raichu":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,23,0]],"target":[[0,12,-6]],"special":[[-5,15.3,-5.5],[5,15.3,-5.5]],"mouth":[[0,14.45,-5.55]],"hand_primary":[[-10.5,12.25,-2.5]],"physical":[[0,6.75,62.5]],"eye":[[-3,17.45,-4.75],[3,17.45,-4.75]],"face":[[0,16.15,-5.5]],"hand_secondary":[[10.5,12.25,-2.5]]},"sandshrew":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,17.5,0]],"target":[[0,8,-7]],"special":[[0,10.2,-4.15]],"mouth":[[0,10.2,-4.15]],"hand_primary":[[-9,9,-0.75]],"physical":[[-9,9,-0.75]],"eye":[[3.5,13.25,-2.3],[-3.5,13.25,-2.3]],"face":[[0,13,-5.82]],"hand_secondary":[[9,9,-0.75]]},"sandslash":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,24,0]],"target":[[0,10,-8]],"special":[[0,15.4,-5.5]],"mouth":[[0,15.4,-5.5]],"hand_primary":[[-11.85,13,-1.5]],"physical":[[-11.85,13,-1.5]],"eye":[[-2.5,17.5,-5.5],[2.5,17.5,-5.5]],"face":[[0,17,-7]],"hand_secondary":[[11.85,13,-1.5]]},"nidoranf":{"root":[[0,0,0]],"middle":[[0,5.25,-0.5]],"top":[[0,13,0]],"target":[[0,4,-9.25]],"special":[[0,13.5,-6.4]],"mouth":[[0,6.5,-8.25]],"physical":[[0,6.5,-8.25]],"eye":[[3,9.75,-6.65],[-3,9.75,-6.65]],"face":[[0,9.25,-9.5]]},"nidorina":{"root":[[0,0,0]],"middle":[[0,7,0.5]],"top":[[0,12,0]],"target":[[0,4,-13]],"special":[[0,6,-6.25]],"mouth":[[0,6,-6.25]],"hand_primary":[[-3.5,0,-1.5]],"physical":[[0,6,-6.25]],"eye":[[3,7.5,-9],[-3,7.5,-9]],"face":[[0,7,-11.5]],"jaw_lower":[[0,5.25,-8.4]],"hand_secondary":[[3.5,0,-1.5]]},"nidoqueen":{"root":[[0,0,0]],"middle":[[0,13,-1]],"top":[[0,27,0]],"target":[[0,15,-12]],"special":[[0,21.75,-3.75]],"mouth":[[0,21.75,-3.75]],"hand_primary":[[-18,17,0]],"physical":[[-18,17,0]],"eye":[[4.5,23.5,-6],[-4.5,23.5,-6]],"face":[[0,23.25,-9.5]],"jaw_lower":[[0,21.5,-7.15]],"hand_secondary":[[18,17,0]]},"nidoranm":{"root":[[0,0,0]],"middle":[[0,5.25,0.75]],"top":[[0,13,0]],"target":[[0,3.75,-11.5]],"special":[[0,10.75,-11.15]],"mouth":[[0,4,-9.5]],"physical":[[0,4,-9.5]],"eye":[[3,6.5,-8.05],[-3,6.5,-8.05]],"face":[[0,6.5,-10.5]]},"nidorino":{"root":[[0,0,0]],"middle":[[0,8,-0.5]],"top":[[0,12.5,0]],"target":[[0,7,-17]],"special":[[0,5.75,-9]],"mouth":[[0,5.75,-9]],"physical":[[0,5.75,-9]],"eye":[[3,7,-10.9],[-3,7,-10.9]],"face":[[0,7.25,-13.75]],"jaw_lower":[[0,5.25,-11.65]]},"nidoking":{"root":[[0,0,0]],"middle":[[0,15.25,-1]],"top":[[0,26.5,0]],"target":[[0,15.25,-8.5]],"special":[[0,29.5,0.25]],"mouth":[[0,29.5,0.25]],"hand_primary":[[-26,23.75,0]],"physical":[[-26,23.75,0]],"eye":[[2.45,32.5,-4.75],[-2.45,32.5,-4.75]],"face":[[0,31.75,-6.5]],"hand_secondary":[[25,23.75,0]]},"clefairy":{"root":[[0,0,0]],"middle":[[0,10.5,0]],"top":[[0,20,0]],"target":[[0,10.5,-8]],"special":[[0,10.25,-6.25]],"mouth":[[0,10.25,-6.25]],"hand_primary":[[-13,9.25,-4.25]],"physical":[[-13,9.25,-4.25]],"eye":[[2.25,12.75,-6.25],[-2.25,12.75,-6.25]],"face":[[0,12.75,-6.25]],"hand_secondary":[[13,9.25,-4.25]]},"clefable":{"root":[[0,0,0]],"middle":[[0,14,0]],"top":[[0,27,0]],"target":[[0,14,-8]],"special":[[0,15.75,-6.75]],"mouth":[[0,15.75,-6.75]],"hand_primary":[[-13.5,14.75,-4.25]],"physical":[[-13.5,14.75,-4.25]],"eye":[[2.25,18.25,-6.75],[-2.25,18.25,-6.75]],"face":[[0,18.25,-6.75]],"hand_secondary":[[13.5,14.75,-4.25]]},"vulpix":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,18,0]],"target":[[0,9,-12]],"special":[[0,9.4,-6.7]],"mouth":[[0,9.4,-6.7]],"physical":[[0,8,16.5]],"eye":[[2,12.5,-6.5],[-2,12.5,-6.5]],"face":[[0,12.5,-6.5]]},"ninetales":{"root":[[0,0,0]],"middle":[[0,16,0]],"top":[[0,32,0]],"target":[[0,16,-18]],"special":[[0,23.75,-10.5]],"mouth":[[0,23.75,-10.5]],"physical":[[0,17,63.25]],"eye":[[2,26.25,-10.25],[-2,26.25,-10.25]],"face":[[0,26,-10.25]]},"jigglypuff":{"root":[[0,0,0]],"middle":[[0,7.5,0]],"top":[[0,16.5,0]],"target":[[0,7.5,-6.5]],"special":[[0,5.25,-5.5]],"mouth":[[0,5.25,-5.5]],"hand_primary":[[-5.5,4,-7.5]],"physical":[[-5.5,4,-7.5]],"eye":[[3.25,8,-5.5],[-3.25,8,-5.5]],"face":[[0,7.5,-5.5]],"hand_secondary":[[5.5,4,-7.5]]},"wigglytuff":{"root":[[0,0,0]],"middle":[[0,14,0]],"top":[[0,32,0]],"target":[[0,11.5,-8.5]],"special":[[0,14.75,-7]],"mouth":[[0,14.75,-7]],"hand_primary":[[-11.5,11.75,-5.25]],"physical":[[-11.5,11.75,-5.25]],"eye":[[-4,17.65,-7],[4,17.65,-7]],"face":[[0,17.5,-7]],"hand_secondary":[[12.5,11.75,-5.25]]},"zubat":{"root":[[0,0,0]],"middle":[[0,13,0]],"top":[[0,25,0]],"target":[[0,12,-6]],"special":[[0,13,-2]],"mouth":[[0,13,-2]],"physical":[[0,13,-2]],"face":[[0,14.5,-2]]},"golbat":{"root":[[0,0,0]],"middle":[[0,13,0]],"top":[[0,28,0]],"target":[[0,11,-8]],"special":[[0,10,-2.7]],"mouth":[[0,10,-2.7]],"physical":[[0,10,-2.7]],"eye":[[2.75,16.7,-3],[-2.75,16.7,-3]],"face":[[0,16.5,-3]]},"oddish":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,18,0]],"target":[[0,5.5,-5]],"special":[[0,4,-4]],"mouth":[[0,4,-4]],"physical":[[0,7.5,-4]],"eye":[[2,6,-4],[-2,6,-4]],"face":[[0,5.5,-4]]},"gloom":{"root":[[0,0,0]],"middle":[[0,7.25,0]],"top":[[0,18,0]],"target":[[0,7.25,-6.5]],"special":[[0,16.25,-1]],"mouth":[[0,6.85,-5.5]],"hand_primary":[[-9.25,6.25,-1.25]],"physical":[[-9.25,6.25,-1.25]],"eye":[[2.75,9.25,-5.5],[-2.75,9.25,-5.5]],"face":[[0,9.75,-5.5]],"hand_secondary":[[9.25,6.25,-1.25]]},"vileplume":{"root":[[0,0,0]],"middle":[[0,10.75,0]],"top":[[0,23,0]],"target":[[0,9,-9]],"special":[[0,23,0]],"mouth":[[0,8.25,-6.5]],"hand_primary":[[-10.5,8.25,-1.75]],"physical":[[-10.5,8.25,-1.75]],"eye":[[2.75,10.5,-6.5],[-2.75,10.5,-6.5]],"face":[[0,10.5,-6.5]],"hand_secondary":[[10.5,8.25,-1.75]]},"paras":{"root":[[0,0,0]],"middle":[[0,6,0.5]],"top":[[0,11.5,0.5]],"target":[[0,5,-6.5]],"special":[[0,11,2]],"mouth":[[0,2.75,-5.75]],"hand_primary":[[-6.54,3.88,-6.21]],"physical":[[-6.54,3.88,-6.21]],"eye":[[-3,5.5,-5],[3,5.5,-5]],"face":[[0,3.75,-5.75]],"hand_secondary":[[6.54,3.88,-6.21]]},"parasect":{"root":[[0,0,0]],"middle":[[0,11.5,0]],"top":[[0,22.75,-1]],"target":[[0,11.5,-9]],"special":[[0,20.89,-0.88]],"mouth":[[0,6.75,-8.55]],"hand_primary":[[-12.75,7.25,-4]],"physical":[[-12.75,7.25,-4]],"eye":[[-1.75,9.25,-9.25],[1.75,9.25,-9.25]],"face":[[0,7.75,-8.55]],"hand_secondary":[[12.75,7.25,-4]]},"venonat":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,13.75,0]],"target":[[0,7,-7]],"special":[[0,15,-4.5]],"mouth":[[0,4.5,-5.5]],"hand_primary":[[-3.5,3.25,-6]],"physical":[[-3.5,3.25,-6]],"eye":[[3.75,8.5,-5.75],[-3.75,8.5,-5.75]],"face":[[0,8,-5.5]],"hand_secondary":[[3.5,3.25,-6]]},"venomoth":{"root":[[0,0,0]],"middle":[[0,1,0]],"top":[[0,24,0]],"target":[[0,-2.75,-6.5]],"special":[[0,4,-3]],"mouth":[[0,6,0]],"hand_primary":[[-1.75,5,-2.25]],"physical":[[0,6,0]],"eye":[[2.5,10.5,0.5],[-2.5,10.5,0.5]],"face":[[0,10,0.5]],"hand_secondary":[[1.75,5,-2.25]]},"diglett":{"root":[[0,0,0]],"middle":[[0,6.5,0]],"top":[[0,12.5,0]],"target":[[0,6.5,-5.5]],"special":[[0,12,0]],"physical":[[0,12,0]],"eye":[[1.5,9.5,-3.52],[-1.5,9.5,-3.52]],"face":[[0,9.5,-3.5]]},"dugtrio":{"root":[[0,0,0]],"middle":[[0,9,0]],"top":[[0,19,0]],"target":[[0,9,-9]],"special":[[0,9,-9]],"physical":[[0,9,-9]],"eye":[[-2.25,10.5,-7.02],[-5.25,10.5,-7.02],[5.25,7,-7.02],[2.25,7,-7.02],[1.5,15.5,0.48],[-1.5,15.5,0.48]],"face":[[-3.75,10.5,-7.02],[3.75,7,-7.02],[0,15.5,0.48]]},"meowth":{"root":[[0,0,0]],"middle":[[0,6.5,0]],"top":[[0,21.75,0]],"target":[[0,8.75,-5.25]],"special":[[-10.5,9.25,0]],"mouth":[[0,10.75,-3.5]],"hand_primary":[[-10.5,9.25,0]],"physical":[[-10.5,9.25,0]],"eye":[[-2.75,14,-3.55],[2.75,14,-3.55]],"face":[[0,13.5,-3.5]],"hand_secondary":[[10.5,9.25,0]]},"persian":{"root":[[0,0,0]],"middle":[[0,15,-0.75]],"top":[[0,24.75,0]],"target":[[0,18,-19.75]],"special":[[-2.75,0.5,-5.25]],"physical":[[-2.75,0.5,-5.25]],"eye":[[-2,23.4,-11.25],[2,23.4,-11.25]],"face":[[0,23.25,-12.25]],"jaw_lower":[[0,20.83,-12.6]]},"psyduck":{"root":[[0,0,0]],"middle":[[0,7.25,0]],"top":[[0,16.25,0]],"target":[[0,6.5,-7.25]],"special":[[0,11,-4.75]],"mouth":[[0,11,-4.75]],"hand_primary":[[-10.25,8.5,0]],"physical":[[-10.25,8.5,0]],"eye":[[-2.45,13.55,-4],[2.45,13.55,-4]],"hand_secondary":[[10.25,8.5,0]]},"golduck":{"root":[[0,0,0]],"middle":[[0,13,0]],"top":[[0,25,0]],"target":[[0,14,-6.25]],"special":[[0,20.15,-3.5]],"mouth":[[0,20.15,-3.5]],"hand_primary":[[-16.25,17,0]],"physical":[[-16.25,17,0]],"eye":[[-1.7,22.5,-3.27],[1.7,22.5,-3.27]],"face":[[0,21.5,-7.25]],"hand_secondary":[[16.25,17,0]]},"mankey":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,16,0]],"target":[[0,8,-6]],"special":[[-15.5,10.25,0]],"hand_primary":[[-15.5,10.25,0]],"physical":[[-15.5,10.25,0]],"eye":[[-1.9,9.75,-4],[1.9,9.75,-4]],"face":[[0,10,-4]],"hand_secondary":[[15.5,10.25,0]]},"primeape":{"root":[[0,0,0]],"middle":[[0,10.5,0]],"top":[[0,21.25,0]],"target":[[0,11.5,-7]],"special":[[-19.5,13.5,0]],"hand_primary":[[-16.5,13.5,0]],"physical":[[-16.5,13.5,0]],"eye":[[2.25,13.75,-5],[-2.25,13.75,-5]],"face":[[0,13.75,-5]],"hand_secondary":[[16.5,13.5,0]]},"growlithe":{"root":[[0,0,0]],"middle":[[0,9.5,-1.5]],"top":[[0,18.75,0]],"target":[[0,10.5,-14.5]],"special":[[0,13.25,-8.5]],"mouth":[[0,13.25,-8.5]],"physical":[[0,13.25,-8.5]],"eye":[[-2.5,16,-8.5],[2.5,16,-8.5]],"face":[[0,15.3,-10.4]],"jaw_lower":[[0,13.08,-9.45]]},"arcanine":{"root":[[0,0,0]],"middle":[[0,15,1]],"top":[[0,38.5,0]],"target":[[0,20,-23.75]],"special":[[0,27,-13.25]],"mouth":[[0,27,-13.25]],"physical":[[0,27,-13.25]],"eye":[[3,31.5,-13],[-3,31.5,-13]],"face":[[0,30.3,-16.65]]},"poliwag":{"root":[[0,0,0]],"middle":[[0,7,0]],"top":[[0,12.5,0]],"target":[[0,7,-6]],"special":[[0,8.25,-5.5]],"mouth":[[0,8.25,-5.5]],"physical":[[0,12,-2]],"eye":[[2.75,10,-4.52],[-2.75,10,-4.52]],"face":[[0,9.25,-4.5]]},"poliwhirl":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,20,0]],"target":[[0,10,-10.75]],"special":[[-17,13.5,0]],"hand_primary":[[-17,13.5,0]],"physical":[[-17,13.5,0]],"eye":[[4.35,17.95,-4.57],[-4.35,17.95,-4.57]],"face":[[0,17.5,-6.5]],"hand_secondary":[[17,13.5,0]]},"poliwrath":{"root":[[0,0,0]],"middle":[[0,17,0]],"top":[[0,28.75,0]],"target":[[0,16.75,-11.5]],"special":[[-29.75,20.25,0]],"hand_primary":[[-29.75,20.25,0]],"physical":[[-29.75,20.25,0]],"eye":[[4,25.75,-5],[-4,25.75,-5]],"face":[[0,25,-7.5]],"hand_secondary":[[29.75,20.25,0]]},"abra":{"root":[[0,0,0]],"middle":[[0,10.5,0]],"top":[[0,21,0]],"target":[[0,10.5,-3]],"special":[[0,19,-3]],"mouth":[[0,15,-3]],"hand_primary":[[-12,13.5,0]],"physical":[[-12,13.5,0]],"eye":[[-2,17.5,-3],[2,17.5,-3]],"face":[[0,17,-3]],"hand_secondary":[[12,13.5,0]]},"kadabra":{"root":[[0,0,0]],"middle":[[0,13.5,0]],"top":[[0,27,0]],"target":[[0,13.5,-6]],"special":[[-6.5,4,-5]],"mouth":[[0,19.75,-6.5]],"hand_primary":[[-6.5,5,-1]],"physical":[[-6.5,5,-1]],"face":[[0,21.25,-7.75]],"hand_secondary":[[6.5,5,-1]]},"alakazam":{"root":[[0,0,0]],"middle":[[0,16,0]],"top":[[0,32,0]],"target":[[0,20,-4]],"special":[[0,31.25,-7.75]],"mouth":[[0,25.75,-6.75]],"hand_primary":[[-6.5,6.25,0]],"physical":[[-6.5,6.25,0]],"eye":[[2.25,28,-7.25],[-2.25,28,-7.25]],"face":[[0,27.75,-8.25]],"hand_secondary":[[6.5,6.25,0]]},"machop":{"root":[[0,0,0]],"middle":[[0,11.75,0]],"top":[[0,21.5,0.75]],"target":[[0,11,-6.25]],"special":[[-15,13,0.25]],"hand_primary":[[-15,13,0.25]],"physical":[[-15,13,0.25]],"face":[[0,17.75,-3.5]],"hand_secondary":[[15,13,0.25]]},"machoke":{"root":[[0,0,0]],"middle":[[0,17,1.75]],"top":[[0,27.5,0]],"target":[[0,17,-6.25]],"special":[[-23.47,20,1.35]],"hand_primary":[[-23.47,20,1.35]],"physical":[[-23.47,20,1.35]],"eye":[[-3,24.75,-1.5],[3,24.75,-1.5]],"face":[[0,24.25,-5.25]],"hand_secondary":[[23.48,20,1.35]]},"machamp":{"root":[[0,0,0]],"middle":[[0,18,0]],"top":[[0,29.15,0]],"target":[[0,19,-9]],"special":[[-24.47,21.5,-1.25]],"hand_primary":[[-24.47,21.5,-1.25],[24.48,21.5,-1.25]],"physical":[[-24.47,21.5,-1.25]],"face":[[0,26.75,-6.25]],"hand_secondary":[[-23.5,23.5,4],[23.5,23.5,4]]},"bellsprout":{"root":[[0,0,0]],"middle":[[0,12.25,0]],"top":[[0,24.5,0]],"target":[[0,12.25,-3]],"special":[[0,21.75,-8.5]],"mouth":[[0,21.75,-8.5]],"hand_primary":[[-10.5,12.5,0]],"physical":[[-10.5,12.5,0]],"eye":[[2.5,24.5,-5],[-2.5,24.5,-5]],"face":[[0,23.25,-8.5]],"hand_secondary":[[10.5,12.5,0]]},"weepinbell":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,16,0]],"target":[[0,10,-6]],"special":[[0,0.5,0]],"mouth":[[0,0.5,0]],"hand_primary":[[-13.5,6,0]],"physical":[[-13.5,6,0]],"eye":[[-2.4,11,-5],[2.4,11,-5]],"face":[[0,11,-4]],"hand_secondary":[[13.5,6,0]]},"victreebel":{"root":[[0,0,0]],"middle":[[0,20,0]],"top":[[0,40,0]],"target":[[0,20,-11]],"special":[[0,32.5,-1.5]],"mouth":[[0,32.5,-1.5]],"hand_primary":[[34,4,0],[-34,4,0]],"physical":[[-34,4,0]],"eye":[[4,31,-7.5],[-4,31,-7.5]],"face":[[0,30.5,-7.5]]},"tentacool":{"root":[[0,0,0]],"middle":[[0,30,0]],"top":[[0,28.5,0]],"target":[[0,26,-9.5]],"special":[[-3.5,0,0]],"hand_primary":[[-3.5,0,0]],"physical":[[-3.5,0,0]],"eye":[[2.5,23.5,-4],[-2.5,23.5,-4]],"face":[[0,22,-6.5]],"hand_secondary":[[3.5,0,0]]},"tentacruel":{"root":[[0,0,0]],"middle":[[0,36,0]],"top":[[0,38,0]],"target":[[0,29,-18]],"hand_primary":[[2.5,4.25,-5.5],[-2.5,4.25,-5.5]],"eye":[[3.5,32.75,-7.65],[-3.5,32.75,-7.65]],"face":[[0,31.75,-14]],"hand_secondary":[[4.5,5.25,-2.75],[6,5.25,0],[4.5,5.25,2.75],[2,5.25,5.5],[-4.5,5.25,-2.75],[-6,5.25,0],[-4.5,5.25,2.75],[-2,5.25,5.5]]},"geodude":{"root":[[0,0,0]],"middle":[[0,4,0]],"top":[[0,8.75,0]],"target":[[0,4.5,-8.25]],"special":[[-17.75,4.25,0]],"hand_primary":[[-17.75,4.25,0]],"physical":[[-17.75,4.25,0]],"face":[[0,4,-4.5]],"hand_secondary":[[17.75,4.25,0]]},"graveler":{"root":[[0,0,0]],"middle":[[0,11,-0.25]],"top":[[0,18.75,0]],"target":[[0,10.5,-11.5]],"special":[[-21.25,12,0]],"hand_primary":[[-21.25,12,0],[21.25,12,0]],"physical":[[-21.25,12,0]],"face":[[0,10,-7.25]],"hand_secondary":[[-14.25,7.25,-5.5],[14.25,7.25,-5.5]]},"golem":{"root":[[0,0,0]],"middle":[[0,18,-0.5]],"top":[[0,28.75,0]],"target":[[0,12.5,-21.75]],"special":[[-24.5,17.25,-3.5]],"hand_primary":[[-24.5,17.25,-3.5]],"physical":[[-24.5,17.25,-3.5]],"eye":[[4,18.2,-15.17],[-4,18.2,-15.17]],"face":[[0,17.25,-18.25]],"hand_secondary":[[24.5,17.25,-3.5]]},"ponyta":{"root":[[0,0,0]],"middle":[[0,10.5,-0.75]],"top":[[0,24.5,0]],"target":[[0,11.75,-11.5]],"special":[[0,17,-8.5]],"mouth":[[0,17,-8.5]],"physical":[[0,21.5,-6.5]],"eye":[[-2.5,20,-7.5],[2.5,20,-7.5]],"face":[[0,19.1,-11.15]]},"rapidash":{"root":[[0,0,0]],"middle":[[0,14.5,0]],"top":[[0,32,0]],"target":[[0,17,-15]],"special":[[0,24.1,-9.5]],"mouth":[[0,24.1,-9.5]],"physical":[[0,34.5,-9.9]],"eye":[[-3,27.63,-8.15],[3,27.63,-8.15]],"face":[[0,27,-13]]},"slowpoke":{"root":[[0,0,0]],"middle":[[0,6.5,0]],"top":[[0,22,0]],"target":[[0,6,-19.25]],"eye":[[3.45,6.5,-13],[-3.45,6.5,-13]],"face":[[0,6,-15]],"jaw_lower":[[0,3.75,-14.25]]},"slowbro":{"root":[[0,0,0]],"middle":[[0,13,0]],"top":[[0,27.25,-1.5]],"target":[[0,13.25,-10.5]],"special":[[-11.75,15.25,-1.75]],"hand_primary":[[-11.75,15.25,-1.75]],"physical":[[-11.75,15.25,-1.75]],"eye":[[3.35,22.23,-4.5],[-3.35,22.23,-4.5],[2.45,12.53,13.25],[-2.45,12.53,13.25]],"face":[[0,21,-6.5]],"jaw_lower":[[0,19,-6]],"hand_secondary":[[11.75,15.25,-1.75]]},"magnemite":{"root":[[0,0,0]],"middle":[[0,5,0]],"top":[[0,13.5,0]],"target":[[0,5,-6]],"special":[[0,5,-4]],"physical":[[0,5,-4]],"eye":[[0,5,-4]],"face":[[0,5,-4]]},"magneton":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,25.5,0]],"target":[[0,11,-8]],"special":[[0,17,-4]],"physical":[[0,17,-4]],"eye":[[0,17,-4],[10,5,-4],[-10,5,-4]],"face":[[0,17,-4]]},"farfetchd":{"root":[[0,0,0]],"middle":[[0,7.5,-0.25]],"top":[[0,16.05,0.25]],"target":[[0,7.5,-9]],"special":[[10,7.75,-7]],"physical":[[10,7.75,-7]],"eye":[[-2,13.75,-2.5],[2,13.75,-2.5]],"face":[[0,13,-7.5]]},"doduo":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,25.25,0]],"target":[[0,15,-6.75]],"special":[[2.5,23,-10.5]],"physical":[[2.5,23,-10.5]],"eye":[[0.75,23.5,-4.5],[4.25,23.5,-4.5],[-4.25,23.5,-4.5],[-0.75,23.5,-4.5]],"face":[[2.5,23.5,-10.5]]},"dodrio":{"root":[[0,0,0]],"middle":[[0,14.75,0]],"top":[[0,31,0]],"target":[[0,16.5,-7]],"special":[[0,28,-10.5]],"physical":[[0,28,-10.5]],"eye":[[-4.5,28.75,-4.5],[-1.5,28.75,-4.5],[4.5,28.5,-4.5],[1.5,28.5,-4.5],[-1.5,28.75,-3.5],[1.5,28.75,-3.5]],"face":[[0,28.75,-10.5]]},"seel":{"root":[[0,0,0]],"middle":[[0,7,-2]],"top":[[0,15.75,0]],"target":[[0,3,-17.25]],"special":[[0,-1,-14]],"mouth":[[0,-1,-14]],"hand_primary":[[-14,4,-3],[14,4,-3]],"physical":[[-14,4,-3]],"eye":[[2.4,0.4,-17.95],[-2.4,0.4,-17.95]],"face":[[0,-1.25,-17]]},"dewgong":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,31,0]],"target":[[0,8,-18]],"special":[[0,1.75,-39.2]],"mouth":[[0,1.75,-39.2]],"hand_primary":[[-22.5,6,-14.25]],"physical":[[-22.5,6,-14.25]],"eye":[[3.4,7,-39.2],[-3.4,7,-39.2]],"face":[[0,4.7,-42.15]],"hand_secondary":[[22.5,6,-14.25]]},"grimer":{"root":[[0,0,0]],"top":[[0,21.5,0]],"eye":[[2.77,20,-9.02],[-2.77,20,-9.02]]},"muk":{"root":[[0,0,0]],"top":[[0,17.5,0]],"eye":[[5.28,15,-9.54],[-5.28,15,-9.54]]},"shellder":{"eye":[[-2.95,5.25,-5],[2.95,5.25,-5]]},"cloyster":{"eye":[[3,17.5,-12.5],[-3,17.5,-12.5]]},"gastly":{"root":[[0,0,0]],"middle":[[0,6.5,0.5]],"top":[[0,12,0.5]],"target":[[0,6,-6]],"special":[[0,3.25,-5]],"mouth":[[0,3.25,-5]],"physical":[[0,2.5,-23]],"eye":[[-3.25,6.75,-5.1],[3.25,6.75,-5.1]],"face":[[0,6.75,-5.2]]},"haunter":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,19,0]],"target":[[0,12,-10]],"special":[[0,8,-3]],"mouth":[[0,8,-3]],"hand_primary":[[-13,2,-10.5]],"physical":[[-13,2,-10.5]],"eye":[[-3.5,11.25,-8],[3.5,11.25,-8]],"face":[[0,11.25,-8]],"jaw_lower":[[0,8,-7.5]],"hand_secondary":[[13,2,-10.5]]},"gengar":{"root":[[0,0,0]],"middle":[[0,17,1]],"top":[[0,30.5,1]],"target":[[0,17,-11]],"special":[[0,14,-9]],"mouth":[[0,14,-9]],"hand_primary":[[-19,19.25,0]],"physical":[[-19,19.25,0]],"eye":[[-4.5,21.5,-9],[4.5,21.5,-9]],"face":[[0,20.5,-9]],"hand_secondary":[[19,19.25,0]]},"onix":{"root":[[0,0,0]],"middle":[[0,1,-5]],"top":[[0,84,0]],"target":[[0,-13,-13]],"special":[[0,6,-62.75]],"physical":[[0,6,-62.75]],"face":[[0,12,-73]]},"drowzee":{"root":[[0,0,0]],"middle":[[0,12.5,-1]],"top":[[0,23.5,-1]],"target":[[0,12,-9.5]],"special":[[0,20.5,-12.25]],"mouth":[[0,17.9,-3.75]],"hand_primary":[[-11.5,14.5,1]],"physical":[[-11.5,14.5,1]],"eye":[[4.02,20,-4.77],[-4.02,20,-4.77]],"face":[[0,19,-9.5]],"hand_secondary":[[11.5,14.5,1]]},"hypno":{"root":[[0,0,0]],"middle":[[0,17,0]],"top":[[0,32,0]],"target":[[0,17,-6.5]],"special":[[21,12.25,-1]],"mouth":[[0,23.5,-4.75]],"hand_primary":[[-20.5,21.5,0]],"physical":[[-20.5,21.5,0]],"eye":[[2.52,27.25,-4.77],[-2.52,27.25,-4.77]],"face":[[0,26.25,-5.5]],"hand_secondary":[[20.5,21.5,0]]},"krabby":{"eye":[[-1.85,7.65,-4.25],[1.85,7.65,-4.25]]},"kingler":{"eye":[[5,13.5,-10.3],[-5,13.5,-10.3]]},"voltorb":{"root":[[0,0,0]],"middle":[[0,5.5,0]],"top":[[0,11.25,0]],"target":[[0,5,-8]],"special":[[0,11,-2.5]],"physical":[[0,11,-2.5]],"eye":[[-2.25,6.75,-5.25],[2.25,6.75,-5.25]],"face":[[0,6.25,-6]]},"electrode":{"root":[[0,0,0]],"middle":[[0,9,0]],"top":[[0,18.25,0]],"target":[[0,8,-13]],"eye":[[-3,11,-9.3],[3,11,-9.3]],"face":[[0,10,-9]]},"exeggcute":{"root":[[0,0,0]],"middle":[[0,4,0]],"top":[[0,7.25,0]],"target":[[0,4,-12]],"special":[[0,7,-1]],"mouth":[[0,2.25,-3]],"physical":[[0,7,-1]],"face":[[0,3.5,-3],[-7,3.5,-9],[7,3.5,-9],[8,3.5,-1],[-8,3.5,-1],[0,3.5,5]]},"exeggutor":{"root":[[0,0,0]],"middle":[[0,25,0]],"top":[[0,63,0]],"target":[[0,23,-20]],"special":[[0,35.5,-22.5]],"mouth":[[0,35.5,-22.5],[6,37.5,-19],[-6,37.5,-18]],"physical":[[0,35.5,-22.5]],"eye":[[-2.5,41,-22.5],[2.5,41,-22.5],[3.5,42.5,-19],[8.5,42.5,-19],[-2.35,42.75,-18],[-9.65,42.75,-18]],"face":[[0,39.91,-22.37],[6,40.41,-18.87],[-6,40.41,-17.97]]},"cubone":{"root":[[0,0,0]],"middle":[[0,6,0]],"top":[[0,15.7,0]],"target":[[0,5,-5]],"special":[[-6.75,11.5,-1]],"hand_primary":[[-6.25,7,0]],"physical":[[-6.75,11.5,-1]],"eye":[[3,10.75,-1.75],[-3,10.75,-1.75]],"face":[[0,10.5,-6.5]],"jaw_lower":[[0,8.6,-5]],"hand_secondary":[[6.25,7,0]]},"marowak":{"root":[[0,0,0]],"middle":[[0,9,0]],"top":[[0,22,0]],"target":[[0,9.25,-5.75]],"special":[[-12,11,-6]],"hand_primary":[[-12.5,11.5,0]],"physical":[[-12,11,-6]],"eye":[[4,17,-3.5],[-4,17,-3.5]],"face":[[0,16.75,-9]],"jaw_lower":[[0,13.35,-7]],"hand_secondary":[[12.5,11.5,0]]},"hitmonlee":{"root":[[0,0,0]],"middle":[[0,16.25,0]],"top":[[0,25.5,0]],"target":[[0,18,-5.5]],"special":[[-17,20.5,0]],"hand_primary":[[-17,20.5,0]],"physical":[[-17,20.5,0]],"face":[[0,20,-3.5]],"hand_secondary":[[17,20.5,0]]},"hitmonchan":{"root":[[0,0,0]],"middle":[[0,19,0]],"top":[[0,31,0]],"target":[[0,20,-6]],"special":[[-17,21,0]],"hand_primary":[[-17,21,0]],"physical":[[-17,21,0]],"face":[[0,24.25,-4.5]],"hand_secondary":[[17,21,0]]},"lickitung":{"root":[[0,0,0]],"middle":[[0,12,0.25]],"top":[[0,25.7,0]],"target":[[0,12,-10.25]],"special":[[0,20,-15.5]],"mouth":[[0,20.25,-4]],"hand_primary":[[-12,16.5,0]],"physical":[[0,20,-15.5]],"eye":[[4.1,23,-4],[-4.1,23,-4]],"face":[[0,22.75,-6.5]],"hand_secondary":[[12,16.5,0]]},"koffing":{"root":[[0,0,0]],"middle":[[0,9,0]],"top":[[0,21,0]],"target":[[0,8.5,-11.25]],"eye":[[2.75,13.75,-7],[-2.75,13.75,-7]],"face":[[0,12.75,-7]]},"weezing":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,22.5,0]],"target":[[1.5,11,-11.25]],"eye":[[-0.75,15.5,-7.5],[-7.25,15.5,-7.5],[9.5,15.25,-2],[5.5,15.25,-2]],"face":[[-4,15,-7.5]]},"rhyhorn":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,25.5,0]],"target":[[0,6.75,-31]],"special":[[0,17.5,-25.5]],"mouth":[[0,7,-17]],"physical":[[0,17.5,-25.5]],"eye":[[5,10.5,-22.25],[-5,10.5,-22.25]],"face":[[0,10.5,-27.25]],"jaw_lower":[[0,7,-22.25]]},"rhydon":{"root":[[0,0,0]],"middle":[[0,17,-2]],"top":[[0,38,0]],"target":[[0,17,-16]],"special":[[0,33.67,-21]],"mouth":[[0,27.5,-5.75]],"hand_primary":[[-23.75,22,0]],"physical":[[0,33.67,-21]],"face":[[0,31,-13.5]],"hand_secondary":[[23.75,22,0]]},"chansey":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,22,0]],"target":[[0,11,-14]],"special":[[0,16.5,-7.5]],"mouth":[[0,16.5,-7.5]],"hand_primary":[[-5,12.5,-11]],"physical":[[0,11,-14]],"eye":[[2.25,18.5,-7.5],[-2.25,18.5,-7.5]],"face":[[0,19,-7.5]],"hand_secondary":[[5,12.5,-11]]},"tangela":{"eye":[[-2,5.2,-3.1],[2,5.2,-3.1]]},"kangaskhan":{"root":[[0,0,0]],"middle":[[0,26,0]],"top":[[0,54,0]],"target":[[0,32,-18]],"special":[[0,42.5,-5]],"mouth":[[0,42.5,-5]],"hand_primary":[[-36,37,1.75]],"physical":[[-36,37,1.75]],"eye":[[6.5,47.43,-9.25],[-6.5,47.43,-9.25],[2,26.8,-32.55],[-2,26.8,-32.55]],"face":[[0,46,-14.25]],"hand_secondary":[[36,37,1.75]]},"horsea":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,21,0]],"target":[[0,9,-6]],"special":[[0,14.5,-8]],"mouth":[[0,14.5,-8]],"physical":[[0,-3.5,-0.5]],"eye":[[-2.9,17,-5],[2.9,17,-5]],"face":[[0,17,-8.5]]},"seadra":{"root":[[0,0,0]],"middle":[[0,13.5,1.5]],"top":[[0,25,0]],"target":[[0,12.25,-6]],"mouth":[[0,19.5,-12]],"eye":[[-2.5,21.25,-4.5],[2.5,21.25,-4.5]],"face":[[0,21.25,-10.25]]},"goldeen":{"root":[[0,0,0]],"middle":[[0,5,-2.5]],"top":[[0,11,-2]],"target":[[0,5,-14]],"special":[[0,5,-11.25]],"mouth":[[0,5,-11.25]],"hand_primary":[[-13,6.9,-4]],"physical":[[0,13,-9.4]],"eye":[[-4.5,5.9,-9.3],[4.5,5.9,-9.3]],"face":[[0,5.25,-11.75]],"hand_secondary":[[13,6.9,-4]]},"seaking":{"root":[[0,0,0]],"middle":[[0,11,-1.5]],"top":[[0,22,0]],"target":[[0,10,-19.75]],"special":[[0,11,-16.5]],"mouth":[[0,11,-16.5]],"hand_primary":[[-15.5,3.75,-3.25]],"physical":[[0,17.25,-23]],"eye":[[-8.5,14.25,-10],[8.5,14.25,-10]],"face":[[0,14,-17]],"hand_secondary":[[15.5,3.75,-3.25]]},"staryu":{"eye":[[0,8.2,-4.25]]},"starmie":{"special":[[0,12.5,-8.4]],"eye":[[0,12.5,-8.4]]},"mrmime":{"eye":[[1.5,29.5,-3.5],[-1.5,29.5,-3.5]]},"scyther":{"root":[[0,0,0]],"middle":[[0,25,0]],"top":[[0,39,0]],"target":[[0,25,-4.5]],"special":[[0,33.25,-3.5]],"mouth":[[0,33.25,-3.5]],"physical":[[-28.32,28.75,-1.05]],"eye":[[2,35.7,-4.5],[-2,35.7,-4.5]],"face":[[0,35.2,-7.25]]},"jynx":{"root":[[0,0,0]],"middle":[[0,16,0]],"top":[[0,32,0]],"target":[[0,16,-8]],"special":[[0,21,-8]],"mouth":[[0,21,-8]],"hand_primary":[[-22,15.5,-1]],"physical":[[-22,15.5,-1]],"eye":[[3,24.7,-6.7],[-3,24.7,-6.7]],"face":[[0,23,-7]],"hand_secondary":[[22,15.5,-1]]},"electabuzz":{"root":[[0,0,0]],"middle":[[0,14,0]],"top":[[0,29,0]],"target":[[0,16,-7]],"special":[[3,28.5,0],[-3,28.5,0]],"mouth":[[0,19.75,-3.25]],"hand_primary":[[-20,18,0]],"physical":[[-22,17.75,0.5]],"eye":[[2,22.25,-4.5],[-2,22.25,-4.5]],"face":[[0,21.75,-5]],"hand_secondary":[[20,18,0]]},"magmar":{"root":[[0,0,0]],"middle":[[0,14,0]],"top":[[0,28,0]],"target":[[0,15,-6.5]],"special":[[0,21,-5.5]],"mouth":[[0,21,-5.5]],"hand_primary":[[-15,17,0]],"physical":[[-15,17,0]],"eye":[[-1.75,22.5,-4.5],[1.75,22.5,-4.5]],"face":[[0,22.5,-7.5]],"hand_secondary":[[15,17,0]]},"pinsir":{"root":[[0,0,0]],"middle":[[0,15,0]],"top":[[0,34.5,0]],"target":[[0,16,-9]],"special":[[0,15.75,-6.5]],"mouth":[[0,15.75,-6.5]],"hand_primary":[[-26,15,0]],"physical":[[4.75,34,0],[-4.75,34,0]],"eye":[[2.85,21,-6.5],[-2.85,21,-6.5]],"face":[[0,20,-6.75]],"hand_secondary":[[26,15,0]]},"tauros":{"eye":[[-2.75,19.75,-19],[2.75,19.75,-19]]},"magikarp":{"eye":[[-2.55,11.25,-4.5],[2.55,11.25,-4.5]]},"gyarados":{"root":[[0,0,0]],"middle":[[0,0,0]],"top":[[0,55,0]],"target":[[0,0,-7]],"special":[[0,46.75,-23]],"mouth":[[0,46.75,-23]],"physical":[[0,-81,0.25]],"eye":[[-3.75,49,-20],[3.75,49,-20]],"face":[[0,47.5,-25]]},"lapras":{"root":[[0,0,0]],"middle":[[0,14,0]],"top":[[0,45.2,-6]],"target":[[0,16,-25]],"special":[[0,30.5,-17]],"mouth":[[0,30.5,-17]],"physical":[[0,42.5,-18.75]],"eye":[[-5.5,36,-16.7],[5.5,36,-16.7]],"face":[[0,36,-24.1]],"jaw_lower":[[0,32.15,-21.5]]},"ditto":{"root":[[0,0,0]],"middle":[[0,5.5,0]],"top":[[0,10.5,0]],"target":[[0,5.5,-4]],"special":[[0,6.4,-2]],"mouth":[[0,6.4,-2]],"hand_primary":[[-6,6.2,-0.5]],"physical":[[-6,6.2,-0.5]],"face":[[0,7.7,-2]],"hand_secondary":[[6,6.2,-0.5]]},"eevee":{"root":[[0,0,0]],"middle":[[0,9,0]],"top":[[0,18,0]],"target":[[0,7.5,-11]],"special":[[0,9.65,-7.1]],"mouth":[[0,9.65,-7.1]],"physical":[[0,9.65,-7.1]],"eye":[[2.4,12.45,-6.7],[-2.4,12.45,-6.7]],"face":[[0,12.45,-6.75]]},"vaporeon":{"root":[[0,0,0]],"middle":[[0,12.4,0]],"top":[[0,22.4,0]],"target":[[0,9.4,-15]],"special":[[0,14.1,-11.6]],"mouth":[[0,14.1,-11.6]],"physical":[[0,14.1,-11.6]],"eye":[[-2,17.15,-11],[2,17.15,-11]],"face":[[0,16.9,-11]]},"jolteon":{"root":[[0,0,0]],"middle":[[0,13.1,0]],"top":[[0,22.1,0]],"target":[[0,9.1,-15]],"special":[[0,13.8,-11.6]],"mouth":[[0,15.1,-11]],"physical":[[0,13.8,-11.6]],"eye":[[-2,18.35,-11],[2,18.35,-11]],"face":[[0,18.1,-11]]},"flareon":{"root":[[0,0,0]],"middle":[[0,12.9,0]],"top":[[0,21.9,0]],"target":[[0,8.9,-16]],"special":[[0,13.45,-12.29]],"mouth":[[0,13.45,-12.29]],"physical":[[0,13.45,-12.29]],"eye":[[-2,16.65,-12],[2,16.65,-12]],"face":[[0,16.4,-12]]},"porygon":{"root":[[0,0,0]],"middle":[[0,6.4,0]],"top":[[0,23.7,0]],"target":[[0,7,-7]],"special":[[0,13.05,-10.65]],"physical":[[0,13.05,-10.65]],"eye":[[3.5,14.5,-1.72],[-3.5,14.5,-1.72]],"face":[[0,14,-10.75]]},"omanyte":{"root":[[0,0,0]],"middle":[[0,4.75,2]],"top":[[0,11.5,0]],"target":[[0,4,-4.5]],"face":[[0,2.25,-2.5]]},"omastar":{"root":[[0,0,0]],"middle":[[0,6,2.5]],"top":[[0,17.75,1]],"target":[[0,6,-4]],"mouth":[[0,1.75,-2]],"face":[[0,4,-2.5]]},"kabuto":{"root":[[0,0,0]],"middle":[[0,2.25,0]],"top":[[0,5.5,0]],"target":[[0,2,-6]],"eye":[[1.5,1,-3],[-1.5,1,-3]],"face":[[0,1,-3]]},"kabutops":{"root":[[0,0,0]],"middle":[[0,18,1]],"top":[[0,29.25,0]],"target":[[0,17.75,-4.75]],"eye":[[3.5,28,-3.4],[-3.5,28,-3.4]]},"aerodactyl":{"root":[[0,0,0]],"middle":[[0,17,-2]],"top":[[0,26,0]],"target":[[0,17,-43]],"special":[[0,16.35,-34.5]],"mouth":[[0,17.85,-26.5]],"hand_primary":[[-55.5,19.9,-14],[-55.5,19.9,-14]],"physical":[[0,16.85,-43.5]],"eye":[[5,21.8,-33.5],[-5,21.8,-33.5]],"face":[[0,20.35,-44]],"jaw_lower":[[0,17.85,-39.5]],"hand_secondary":[[55.5,19.9,-14],[55.5,19.9,-14]]},"snorlax":{"root":[[0,0,0]],"middle":[[0,25,0]],"top":[[0,57,0]],"target":[[0,28,-18.25]],"mouth":[[0,44,-8]],"hand_primary":[[-34,31,0]],"eye":[[-5,47.5,-8],[5,47.5,-8]],"face":[[0,47,-8]],"hand_secondary":[[34,31,0]]},"articuno":{"root":[[0,0,0]],"middle":[[0,34,0]],"top":[[0,60,0]],"target":[[0,14,-25]],"special":[[0,24,-41]],"mouth":[[0,24,-41]],"physical":[[0,25,-45]],"eye":[[3.4,27.75,-41],[-3.4,27.75,-41]],"face":[[0,27.4,-43]]},"zapdos":{"root":[[0,0,0]],"middle":[[0,25,0]],"top":[[0,44,0]],"target":[[0,5,-28]],"special":[[0,20.7,-28.5]],"mouth":[[0,20.7,-28.5]],"physical":[[0,21.25,-51.5]],"eye":[[2.25,22.75,-28.5],[-2.25,22.75,-28.5]],"face":[[0,22.3,-31.5]]},"moltres":{"root":[[0,0,0]],"middle":[[0,34,0]],"top":[[0,84,0]],"target":[[0,5,-23]],"special":[[0,22.7,-42]],"mouth":[[0,22.7,-42]],"physical":[[0,23.25,-56.5]],"eye":[[-3.35,24.8,-42],[3.35,24.8,-42]],"face":[[0,25.2,-47.5]]},"dratini":{"root":[[0,0,0]],"middle":[[0,6,2]],"top":[[0,22,0]],"target":[[0,10,-9]],"special":[[0,14.09,-5.25]],"mouth":[[0,14.09,-5.25]],"physical":[[0,22,-3.5]],"face":[[0,19,-4.5]]},"dragonair":{"root":[[0,0,0]],"middle":[[0,14,0]],"top":[[0,38,0]],"target":[[0,14,-7.25]],"special":[[0,40.5,-5]],"mouth":[[0,32.09,-4.5]],"physical":[[0,-68,-0.5]],"eye":[[3,35.5,-4.5],[-3,35.5,-4.5]],"face":[[0,35,-7.5]]},"dragonite":{"root":[[0,0,0]],"middle":[[0,25,0]],"top":[[0,56,0]],"target":[[0,25,-9]],"special":[[0,42,-13.25]],"mouth":[[0,41.5,-7.75]],"hand_primary":[[-21.5,34,0]],"physical":[[-21.5,34,0]],"face":[[0,48,-11.25]],"hand_secondary":[[21.5,34,0]]},"mewtwo":{"root":[[0,0,0]],"middle":[[0,26,0]],"top":[[0,38,0]],"target":[[0,24,-5]],"special":[[-21.3,31.75,1.15]],"mouth":[[0,36.65,-3.95]],"hand_primary":[[-21.3,31.75,1.15]],"physical":[[0,17.45,71.7]],"eye":[[-2.5,39.65,-3.95],[2.5,39.65,-3.95]],"face":[[0,39.65,-4]],"hand_secondary":[[21.3,31.75,1.15]]},"mew":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,25,0]],"target":[[0,9,-5]],"special":[[0,13,-10]],"mouth":[[0,14.5,-4]],"hand_primary":[[-5.3,13.25,-0.5]],"physical":[[0,3.75,57.5]],"eye":[[-3,17.7,-4],[3,17.7,-4]],"face":[[0,18,-4]],"hand_secondary":[[5.3,13.25,-0.5]]},"chikorita":{"root":[[0,0,0]],"middle":[[0,8,-0.75]],"top":[[0,18,0]],"target":[[0,9,-9]],"special":[[0,30.75,-4]],"mouth":[[0,11.5,-6]],"physical":[[-32.65,9.75,-1]],"eye":[[2.35,14.35,-6],[-2.35,14.35,-6]],"face":[[0,13.5,-6]]},"bayleef":{"root":[[0,0,0]],"middle":[[0,9.75,-1]],"top":[[0,27.25,0]],"target":[[0,14,-12.25]],"special":[[0,26.5,-32]],"mouth":[[0,20.75,-8.5]],"physical":[[-31.9,13.75,-4]],"eye":[[-3.5,23.5,-9.5],[3.5,23.5,-9.5]],"face":[[0,23.5,-12]]},"meganium":{"root":[[0,0,0]],"middle":[[0,17,0]],"top":[[0,51.75,-0.5]],"target":[[0,31,-21]],"special":[[0,45.75,-14.25]],"mouth":[[0,45.75,-14.25]],"physical":[[0,45.75,-14.25]],"face":[[0,48.5,-19.75]]},"cyndaquil":{"root":[[0,0,0]],"middle":[[0,9.75,1.5]],"top":[[0,22.25,0]],"target":[[0,7,-9]],"hand_primary":[[-3.5,1,-4.5]],"eye":[[-4.5,5,-12],[4.5,5,-12]],"face":[[0,-2.25,-11.25]],"hand_secondary":[[3.5,1,-4.5]]},"quilava":{"root":[[0,0,0]],"middle":[[0,8,0.25]],"top":[[0,13,0]],"target":[[0,8,-21]],"special":[[0,13.68,-10.35]],"hand_primary":[[-2.75,-2.75,-1.5]],"physical":[[0,12,-14]],"eye":[[-4,7.75,-13.75],[4,7.75,-13.75]],"face":[[0,8,-17.5]],"hand_secondary":[[2.75,-2.75,-1.5]]},"typhlosion":{"root":[[0,0,0]],"middle":[[0,27.5,2.25]],"top":[[0,43,0]],"target":[[0,23.75,-14]],"special":[[0,7.5,-40]],"mouth":[[0,7.5,-40]],"hand_primary":[[-5.75,-4.75,-17.75]],"physical":[[-5.75,-4.75,-17.75]],"eye":[[-5,10.75,-44.75],[5,10.75,-44.75]],"face":[[0,11,-48]],"hand_secondary":[[5.75,-4.75,-17.75]]},"totodile":{"root":[[0,0,0]],"middle":[[0,9,0]],"top":[[0,23,0]],"target":[[0,9.5,-8]],"special":[[0,15.75,-4.75]],"mouth":[[0,15.75,-4.75]],"hand_primary":[[-9.25,11.5,0]],"physical":[[-9.25,11.5,0]],"eye":[[-4.5,18.5,-2.5],[4.5,18.5,-2.5]],"face":[[0,18.5,-11.5]],"hand_secondary":[[9.25,11.5,0]]},"croconaw":{"root":[[0,0,0]],"middle":[[0,13,0]],"top":[[0,30.75,0]],"target":[[0,13,-11.5]],"special":[[0,22.5,-7.25]],"mouth":[[0,22.5,-7.25]],"hand_primary":[[-12,16.25,-1.75]],"physical":[[-12,16.25,-1.75]],"eye":[[-5.5,27.25,-5.25],[5.5,27.25,-5.25]],"face":[[0,26.75,-11.5]],"hand_secondary":[[12,16.25,-1.75]]},"feraligatr":{"root":[[0,0,0]],"middle":[[0,18.75,1.25]],"top":[[0,33.75,0]],"target":[[0,18,-11]],"special":[[0,43,1.25]],"mouth":[[0,43,1.25]],"hand_primary":[[-26.45,29.5,1.75],[26.45,29.5,1.75]],"physical":[[0,43,1.25]],"face":[[0,52,5]]},"sentret":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,22,0]],"target":[[0,8,-6.5]],"special":[[0,3.5,13.25]],"hand_primary":[[-10,8,0]],"physical":[[0,3.5,13.25]],"eye":[[-1.5,12.5,-4.5],[1.5,12.5,-4.5]],"face":[[0,12.5,-4.5]],"hand_secondary":[[10,8,0]]},"furret":{"root":[[0,0,0]],"middle":[[0,12,-2.5]],"top":[[0,22.75,0]],"target":[[0,12,-11]],"special":[[0,5,13]],"mouth":[[0,3.75,-21]],"hand_primary":[[-2,-0.5,-9]],"physical":[[0,5,13]],"eye":[[2.5,6,-21],[-2.5,6,-21]],"face":[[0,5.5,-21]],"hand_secondary":[[2,-0.5,-9]]},"hoothoot":{"root":[[0,0,0]],"middle":[[0,9,0]],"top":[[0,15,0]],"target":[[0,8,-7.5]],"special":[[0,10.25,-7]],"physical":[[0,10.25,-7]],"face":[[0,12,-7]]},"noctowl":{"root":[[0,0,0]],"middle":[[0,16,0]],"top":[[0,32,0]],"target":[[0,17,-9]],"special":[[0,23.5,-6.9]],"mouth":[[0,23.5,-6.9]],"physical":[[0,24.5,-8]],"eye":[[2.65,25.8,-6.4],[-2.65,25.8,-6.4]],"face":[[0,26,-8]]},"ledyba":{"root":[[0,0,0]],"middle":[[0,7.5,0]],"top":[[0,15,0]],"target":[[0,7,-14]],"special":[[0,11,-4]],"mouth":[[0,5.25,-8.5]],"hand_primary":[[-11.5,5.5,-4],[-11.5,5.5,-0.5]],"physical":[[-11.5,5.5,-4]],"face":[[0,7,-12.5]],"jaw_lower":[[0,5.25,-11]],"hand_secondary":[[11.5,5.5,-4],[11.5,5.5,-0.5]]},"ledian":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,29,0]],"target":[[0,11,-4]],"special":[[0,11,-4]],"mouth":[[0,16,-4.5]],"hand_primary":[[-9.5,12.5,0],[-9.5,9.5,0]],"physical":[[-9.5,12.5,0]],"face":[[0,19,-4.5]],"hand_secondary":[[9.5,12.5,0],[9.5,9.5,0]]},"spinarak":{"root":[[0,0,0]],"middle":[[0,4.25,0]],"top":[[0,9,0]],"target":[[0,5,-11]],"special":[[0,3.5,-8]],"mouth":[[0,3.5,-8]],"physical":[[0,3.5,-8]],"eye":[[2.5,5,-6.5],[-2.5,5,-6.5]],"face":[[0,5,-8]]},"ariados":{"root":[[0,0,0]],"middle":[[0,7.75,1]],"top":[[0,22,0]],"target":[[0,8,-13.75]],"special":[[0,6,-11]],"mouth":[[0,6,-11]],"physical":[[0,6,-11]],"eye":[[2.5,7.75,-8.5],[-2.5,7.75,-8.5]],"face":[[0,7.75,-11]]},"crobat":{"root":[[0,0,0]],"middle":[[0,15.5,0]],"top":[[0,42,0]],"target":[[0,15,-8.5]],"special":[[0,15,-5.5]],"mouth":[[0,15,-5.5]],"physical":[[0,15,-5.5]],"eye":[[3.25,19,-5.5],[-3.25,19,-5.5]],"face":[[0,18,-5.5]]},"chinchou":{"root":[[0,0,0]],"middle":[[0,5,0]],"top":[[0,10,0]],"target":[[0,6,-10]],"special":[[0.5,5.5,50.5],[-0.5,5.5,50.5]],"physical":[[0,10,-2]],"eye":[[4.25,6.5,-7],[-4.25,6.5,-7]],"face":[[0,6,-7]]},"lanturn":{"root":[[0,0,0]],"middle":[[0,8,-2.75]],"top":[[0,20.75,0]],"target":[[0,10,-23]],"special":[[0,40,-10.75],[0,30,-10.5]],"mouth":[[0,5,-19.5]],"physical":[[0,13,-17]],"eye":[[5,8,-17],[-5,8,-17]],"face":[[0,8,-19.5]]},"pichu":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,20,0]],"target":[[0,8,-4.75]],"special":[[-4.5,7.5,-3.75],[4.5,7.5,-3.75]],"mouth":[[0,7.5,-3.76]],"hand_primary":[[-5.5,5.5,0]],"physical":[[-5.5,5.5,0]],"eye":[[2.45,10.05,-3.75],[-2.45,10.05,-3.75]],"face":[[0,8.5,-3.77]],"hand_secondary":[[5.5,5.5,0]]},"cleffa":{"root":[[0,0,0]],"middle":[[0,7,0]],"top":[[0,15.5,0]],"target":[[0,7,-6]],"special":[[0,7,-4.4]],"mouth":[[0,7,-4.4]],"hand_primary":[[-4.25,5,-6.75]],"physical":[[-4.25,5,-6.75]],"face":[[0,8.85,-4.4]],"hand_secondary":[[4.25,5,-6.75]]},"igglybuff":{"root":[[0,0,0]],"middle":[[0,7.5,0]],"top":[[0,15,0]],"target":[[0,6,-5.5]],"special":[[0,4.5,-4.5]],"mouth":[[0,4.5,-4.5]],"hand_primary":[[-5,3,-5.9]],"physical":[[-5,3,-5.9]],"face":[[0,6.5,-4.5]],"hand_secondary":[[5,3,-5.9]]},"togepi":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,16.65,0]],"target":[[0,8,-7]],"special":[[0,11.7,-5.5]],"mouth":[[0,11.7,-5.5]],"physical":[[0,13.5,-4.1]],"eye":[[1.75,12.95,-5.5],[-1.75,12.95,-5.5]],"face":[[0,11.85,-5.5]]},"togetic":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,25.6,0.8]],"target":[[0,11,-5]],"special":[[0,16.25,-5.5]],"mouth":[[0,16.25,-5.5]],"hand_primary":[[-7,9.25,-2.25]],"physical":[[-7,9.25,-2.25]],"eye":[[1.8,18.45,-5.5],[-1.8,18.45,-5.5]],"face":[[0,18,-5.5]],"hand_secondary":[[7,9.25,-2.25]]},"natu":{"root":[[0,0,0]],"middle":[[0,5.5,0]],"top":[[0,9.5,0]],"target":[[0,5,-9]],"special":[[0,5.25,-7]],"physical":[[0,5.25,-7]],"eye":[[3,6.25,-4],[-3,6.25,-4]],"face":[[0,5,-7]]},"xatu":{"root":[[0,0,0]],"middle":[[0,15,0]],"top":[[0,29.5,0]],"target":[[0,17,-9]],"special":[[0,25.25,-9.3]],"physical":[[0,25.25,-9.3]],"eye":[[3,26,-3.75],[-3,26,-3.75]],"face":[[0,26,-9.25]]},"mareep":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,14.25,0]],"target":[[0,7,-12]],"special":[[0,8.5,19.25]],"physical":[[0,12,-9]],"eye":[[2,10.75,-10.75],[-2,10.75,-10.75]],"face":[[0,11.94,-12.3]]},"flaaffy":{"root":[[0,0,0]],"middle":[[0,11.75,0]],"top":[[0,24,0]],"target":[[0,13,-9.5]],"special":[[0,4.5,18.5]],"mouth":[[0,17.25,-9.75]],"hand_primary":[[-8.25,12,-3]],"physical":[[-8.25,12,-3]],"eye":[[2.5,19.75,-7.25],[-2.5,19.75,-7.25]],"face":[[0,20.75,-9.75]],"hand_secondary":[[8.25,12,-3]]},"ampharos":{"root":[[0,0,0]],"middle":[[0,16,0]],"top":[[0,40.75,0]],"target":[[0,20,-9]],"special":[[0,8.5,33]],"hand_primary":[[-14,22.5,1]],"physical":[[-14,22.5,1]],"eye":[[3.51,37.5,-1],[-3.51,37.5,-1]],"face":[[0,37.75,-5.5]],"hand_secondary":[[14,22.5,1]]},"bellossom":{"root":[[0,0,0]],"middle":[[0,9.25,0]],"top":[[0,18.25,0]],"target":[[0,9.25,-6.5]],"special":[[0,12.5,-4]],"mouth":[[0,12.5,-3.5]],"hand_primary":[[-6.75,10.75,-1.5]],"physical":[[-6.75,10.75,-1.5]],"eye":[[1.85,14.15,-3.5],[-1.85,14.15,-3.5]],"face":[[0,14.25,-3.5]],"hand_secondary":[[6.75,10.75,-1.5]]},"marill":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,17.35,0]],"target":[[0,8,-8]],"special":[[0,10.25,-6.5]],"mouth":[[0,10.25,-6.5]],"hand_primary":[[-6.2,8,-8]],"physical":[[0,2.5,29]],"eye":[[3,12.25,-6.45],[-3,12.25,-6.45]],"face":[[0,12.25,-6.5]],"hand_secondary":[[6.2,8,-8]]},"azumarill":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,21.35,0]],"target":[[0,10,-8]],"special":[[0,13.25,-6]],"mouth":[[0,13.25,-6]],"hand_primary":[[-12,9,0]],"physical":[[0,4,27.5]],"eye":[[3,15.5,-5.95],[-3,15.5,-5.95]],"face":[[0,15.5,-6]],"hand_secondary":[[12,9,0]]},"sudowoodo":{"root":[[0,0.5,0]],"middle":[[0,20,0]],"top":[[0,37,0]],"target":[[0,20.5,-6]],"special":[[0,24.5,-3.5]],"mouth":[[0,24.5,-3.5]],"hand_primary":[[-14.5,20.5,0]],"physical":[[-14.5,20.5,0]],"eye":[[1.5,27.5,-3.5],[-1.5,27.5,-3.5]],"face":[[0,26.75,-3.5]],"hand_secondary":[[14.5,20.5,0]]},"politoed":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,26,0]],"target":[[0,11,-6.5]],"special":[[0,14.75,-4]],"mouth":[[0,14.75,-4]],"hand_primary":[[-13,12.25,0]],"physical":[[0,15,-20.5]],"eye":[[4.5,18,-4.5],[-4.5,18,-4.5]],"face":[[0,17.5,-6.5]],"hand_secondary":[[13,12.25,0]]},"hoppip":{"root":[[0,0,0]],"middle":[[0,4.5,0]],"top":[[0,15,0]],"target":[[0,4.5,-6]],"special":[[0,3.5,-4.5]],"mouth":[[0,3.5,-4.5]],"hand_primary":[[-3.5,2,-5.3]],"physical":[[0,7.5,-4.5]],"eye":[[-2.5,5.25,-4.5],[2.5,5.25,-4.5]],"face":[[0,4.5,-6]],"hand_secondary":[[3.5,2,-5.3]]},"skiploom":{"root":[[0,0,0]],"middle":[[0,6,0]],"top":[[0,15,0]],"target":[[0,6,-6.5]],"special":[[0,5.3,-5.5]],"mouth":[[0,5.3,-5.5]],"hand_primary":[[-4.75,2.75,-6.7]],"physical":[[0,9.5,-5.5]],"eye":[[3.5,7.5,-5.5],[-3.5,7.5,-5.5]],"face":[[0,6.5,-5.5]],"hand_secondary":[[4.75,2.75,-6.7]]},"jumpluff":{"root":[[0,0,0]],"middle":[[0,6,0]],"top":[[0,19,0]],"target":[[0,6,-6]],"special":[[0,5,-4]],"mouth":[[0,5,-4]],"hand_primary":[[8,4.5,0],[-8,4.5,0]],"physical":[[0,14,-3.5]],"eye":[[2,6.5,-4],[-2,6.5,-4]],"face":[[0,6.5,-4]]},"aipom":{"root":[[0,0,0]],"middle":[[0,10.5,0]],"top":[[0,24,0]],"target":[[0,10,-5]],"special":[[0,7,34]],"mouth":[[0,14.25,-4]],"hand_primary":[[0,7,34]],"physical":[[0,7,34]],"eye":[[3,17.5,-4],[-3,17.5,-4]],"face":[[0,16,-4]],"hand_secondary":[[9,11.5,0],[-9,11.5,0]]},"sunkern":{"root":[[0,0,0]],"middle":[[0,3,0]],"top":[[0,9,0]],"target":[[0,3,-4]],"special":[[0,2,-2]],"mouth":[[0,2,-2]],"physical":[[0,2,-2]],"eye":[[-2,4,-2],[2,4,-2]],"face":[[0,4,-2]]},"sunflora":{"root":[[0,0,0]],"middle":[[0,7,0]],"top":[[0,22,0]],"target":[[0,10,-6]],"special":[[-10.5,9,0]],"hand_primary":[[-10.5,9,0]],"physical":[[-10.5,9,0]],"eye":[[-2,25,1.75],[2,25,1.75]],"face":[[0,25,0.5]],"hand_secondary":[[10.5,9,0]]},"yanma":{"root":[[0,0,0]],"middle":[[0,5,-3]],"top":[[0,9,0]],"target":[[0,6,-15]],"special":[[0,1.75,-12]],"mouth":[[0,1.75,-12]],"physical":[[0,1.75,-12]],"eye":[[3.5,5.25,-10.25],[-3.5,5.25,-10.25]],"face":[[0,4.5,-13]]},"wooper":{"root":[[0,0,0]],"middle":[[0,5.25,0]],"top":[[0,15,0]],"target":[[0,6,-7]],"special":[[0,15,-2]],"mouth":[[0,9.5,-5]],"physical":[[0,15,-2]],"eye":[[3,12,-5],[-3,12,-5]],"face":[[0,11,-5]]},"quagsire":{"root":[[0,0,0]],"middle":[[0,11,-0.5]],"top":[[0,23,0]],"target":[[0,11,-7.75]],"special":[[-13,13.25,-2]],"mouth":[[0,16.5,-6.25]],"hand_primary":[[-13,13.25,-2]],"physical":[[-13,13.25,-2]],"eye":[[3.5,20.5,-6.25],[-3.5,20.5,-6.25]],"face":[[0,19.5,-6.25]],"hand_secondary":[[13,13.25,-2]]},"espeon":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,24,0]],"target":[[0,11,-13]],"special":[[0,20.2,-10.4]],"mouth":[[0,15.85,-10.4]],"physical":[[0,15.85,-10.4]],"eye":[[-2,18.85,-10.15],[2,18.85,-10.15]],"face":[[0,19,-10.15]]},"umbreon":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,23,0]],"target":[[0,11,-13]],"special":[[0,15.45,-11.3]],"mouth":[[0,15.45,-11.3]],"physical":[[0,15.45,-11.3]],"eye":[[2.25,18.2,-10.45],[-2.25,18.2,-10.45]],"face":[[0,18.2,-10.45]]},"murkrow":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,20,0]],"target":[[0,8,-6]],"special":[[0,11.2,-4]],"mouth":[[0,11.2,-4]],"physical":[[0,11.35,-8.35]],"eye":[[-1.4,13.4,-4],[1.4,13.4,-4]],"face":[[0,12.1,-7.7]]},"slowking":{"root":[[0,0,0]],"middle":[[0,14,0]],"top":[[0,33.5,0]],"target":[[0,14.5,-9]],"special":[[-12.5,15,0]],"mouth":[[0,19,-4.5]],"hand_primary":[[-12.5,15,0]],"physical":[[-12.5,15,0]],"eye":[[2.25,22.3,-4.5],[-2.25,22.3,-4.5]],"face":[[0,22,-6.5]],"hand_secondary":[[12.5,15,0]]},"misdreavus":{"root":[[0,0,0]],"middle":[[0,7,0]],"top":[[0,19,0]],"target":[[0,7,-7]],"special":[[0,11,-6]],"mouth":[[0,11,-6]],"physical":[[0,18,-3]],"eye":[[-2.5,13,-6],[2.5,13,-6]],"face":[[0,12.75,-6]]},"unown":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,12,0]],"target":[[0,8,-4]],"special":[[0,8,-4]],"physical":[[0,8,-4]],"eye":[[0,8,-0.6]],"face":[[0,8,-0.6]]},"wobbuffet":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,24.5,0]],"target":[[0,12,-8]],"special":[[0,17.5,-5.5]],"mouth":[[0,17.5,-5.5]],"hand_primary":[[-15,15.25,-3]],"physical":[[0,24.5,-3]],"eye":[[-1.5,2.5,15.4],[1.5,2.5,15.4]],"face":[[0,20.75,-5.75]],"hand_secondary":[[15,15.25,-3]]},"girafarig":{"root":[[0,0,0]],"middle":[[0,15,0]],"top":[[0,32,0]],"target":[[0,17.5,-12.75]],"special":[[0,31,-7.5]],"mouth":[[0,26,-9.75]],"physical":[[0,31,-7.5]],"eye":[[2,28.75,-9.5],[-2,28.75,-9.5]],"face":[[0,28.5,-13.02]]},"pineco":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,18,0]],"target":[[0,8,-8]],"special":[[0,12,-2.75]],"physical":[[0,12,-2.75]],"eye":[[1,11,-4],[-1,11,-4]],"face":[[0,11,-6.5]]},"forretress":{"root":[[0,0,0]],"middle":[[0,10.5,0]],"top":[[0,23,0]],"target":[[0,11,-11.75]],"special":[[6.75,10.5,-13.6],[-6.75,10.5,-13.6]],"physical":[[0,21.5,-7.75]],"eye":[[4.5,10.5,-8],[-4.5,10.5,-8]],"face":[[0,10.25,-9]]},"dunsparce":{"root":[[0,0,0]],"middle":[[0,3.75,0]],"top":[[0,9,0]],"target":[[0,4,-15]],"special":[[0,2,-12.5]],"mouth":[[0,2,-12.5]],"physical":[[0,8,-11]],"eye":[[-5,4.5,-9],[5,4.5,-9]],"face":[[0,4.5,-12.5]]},"gligar":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,17,0]],"target":[[0,8.75,-4]],"special":[[0,6,13]],"mouth":[[0,11.5,-1.25]],"hand_primary":[[-12,10.25,0]],"physical":[[-12,10.25,0]],"eye":[[2.35,13.25,-3.75],[-2.35,13.25,-3.75]],"face":[[0,13.25,-4]],"hand_secondary":[[12,10.25,0]]},"steelix":{"root":[[0,0,1]],"middle":[[0,-23,47]],"top":[[0,119,-1]],"target":[[0,-23,24]],"special":[[0,18,62.75]],"mouth":[[0,18,62.75]],"physical":[[0,13.5,186]],"eye":[[-9,24,76.5],[9,24,76.5]],"face":[[0,22,86.75]]},"snubbull":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,18.5,0]],"target":[[0,8,-6]],"special":[[0,11.75,-5]],"mouth":[[0,11.75,-5]],"hand_primary":[[-6.5,7.5,0]],"eye":[[3.15,14.15,-5.02],[-3.15,14.15,-5.02]],"face":[[0,13.25,-5.25]],"hand_secondary":[[6.5,7.5,0]]},"granbull":{"root":[[0,0,0]],"middle":[[0,15,0]],"top":[[0,33.5,0]],"target":[[0,15,-7]],"special":[[0,25.5,-3.5]],"mouth":[[0,25.5,-3.5]],"hand_primary":[[-19.75,16.5,0]],"eye":[[3,28.5,-4.52],[-3,28.5,-4.52]],"face":[[0,28,-6]],"hand_secondary":[[19.75,16.5,0]]},"qwilfish":{"root":[[0,0,0]],"middle":[[0,6,0]],"top":[[0,13,0]],"target":[[0,6,-7]],"special":[[0,5.5,-5]],"mouth":[[0,5.5,-5]],"physical":[[0,10.5,-3]],"eye":[[2.37,7.5,-4.52],[-2.37,7.5,-4.52]],"face":[[0,7,-5]]},"scizor":{"root":[[0,0,0]],"middle":[[0,28,0]],"top":[[0,46,0]],"target":[[0,26.5,-3.5]],"special":[[0,34,-4.2],[-22,30,0.3]],"mouth":[[0,34,-4.2]],"hand_primary":[[-25,33,0.3]],"physical":[[-25,33,0.3]],"eye":[[-0.29,36.3,-3.6],[0.29,36.3,-3.6]],"face":[[0,35.8,-5.5]],"hand_secondary":[[25,33,0.3]]},"shuckle":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,23.25,0]],"target":[[0,10,-14.75]],"special":[[0,23.25,-10]],"hand_primary":[[-6.6,2.3,-15],[6.6,2.3,-15]],"physical":[[0,23.25,-10]],"eye":[[-1.5,21,-12],[1.5,21,-12]],"face":[[0,21,-12]],"hand_secondary":[[6.6,2.3,15],[-6.6,2.3,15]]},"heracross":{"eye":[[3.25,19.25,-2.5],[-3.25,19.25,-2.5]]},"sneasel":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,22,0]],"target":[[0,11,-7]],"special":[[-12,12.8,0]],"mouth":[[0,14.5,-4]],"hand_primary":[[-12,12.8,0]],"physical":[[-12,12.8,0]],"eye":[[-2,17.1,-4],[2,17.1,-4]],"face":[[0,17.1,-4]],"hand_secondary":[[12,12.8,0]]},"teddiursa":{"root":[[0,0,0]],"middle":[[0,6.5,0]],"top":[[0,19.25,0]],"target":[[0,7.25,-6.25]],"special":[[-7.5,7,0]],"mouth":[[0,9.25,-4.5]],"hand_primary":[[-7.5,7,0]],"physical":[[-7.5,7,0]],"eye":[[2.25,11.5,-4.5],[-2.25,11.5,-4.5]],"face":[[0,11,-4.5]],"hand_secondary":[[7.5,7,0]]},"ursaring":{"root":[[0,0,0]],"middle":[[0,26,0]],"top":[[0,43,0]],"target":[[0,28,-11]],"special":[[-27.5,32,-0.45]],"mouth":[[0,39,-5.25]],"hand_primary":[[-27.5,32,-0.45]],"physical":[[-27.5,32,-0.45]],"eye":[[-2,41.5,-5.5],[2,41.5,-5.5]],"face":[[0,41.25,-8]],"hand_secondary":[[27.5,32,-0.45]]},"slugma":{"root":[[0,0,0]],"middle":[[0,6.5,-3.25]],"top":[[0,18,0]],"target":[[0,7.5,-11.25]],"special":[[0,15.5,-1]],"physical":[[0,15.5,-1]],"eye":[[3.35,16.6,-7.75],[-3.35,16.6,-7.75]],"face":[[0,17,-7.75]]},"magcargo":{"root":[[0,0,0]],"middle":[[0,11,1]],"top":[[0,23.5,0]],"target":[[0,10,-15]],"special":[[0,13.75,-10]],"mouth":[[0,13.75,-10]],"physical":[[0,20.65,-10.5]],"eye":[[-3,20.5,-11.4],[3,20.5,-11.4]],"face":[[0,18.25,-15.5]]},"swinub":{"root":[[0,0,0]],"top":[[0,6.35,0]],"special":[[0,0.43,-5.03]],"mouth":[[0,0.43,-5.03]],"physical":[[0,6,-5]],"eye":[[1.73,3.01,-5.15],[-1.73,3.01,-5.15]],"face":[[0,4,-5]]},"piloswine":{"root":[[0,0,0]],"middle":[[0,9,0],[0,9.5,0]],"top":[[0,22.35,0]],"target":[[0,10.5,-13]],"special":[[0,2.03,-11.03]],"mouth":[[0,2.03,-11.03]],"physical":[[3.5,2.5,-16.5],[-3.5,2.5,-16.5]],"eye":[[-3,7.28,-11],[3,7.28,-11]],"face":[[0,6.5,-11]]},"corsola":{"root":[[0,0,0]],"middle":[[0,6,0.25]],"top":[[0,18,0.25]],"target":[[0,6,-6.25]],"special":[[0,5.6,-5.25]],"mouth":[[0,5.6,-5.25]],"hand_primary":[[-4,3,-5]],"physical":[[3.5,13.95,4.45],[-3.5,13.95,4.45]],"eye":[[-2,6.95,-5.25],[2,6.95,-5.25]],"face":[[0,6.9,-5.25]],"hand_secondary":[[4,3,-5]]},"remoraid":{"root":[[0,0,0]],"middle":[[0,3.5,0]],"top":[[0,9.5,0]],"target":[[0,4,-9]],"special":[[0,3.5,-7.5]],"mouth":[[0,3.5,-7.5]],"physical":[[0,6.5,-5]],"eye":[[-2,4,-4.5],[2,4,-4.5]],"face":[[0,3.5,-7.5]]},"octillery":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,21.5,0]],"target":[[0,8.5,-11.5]],"special":[[0,12.75,-11.5]],"mouth":[[0,12.75,-11.5]],"hand_primary":[[-4,3,-19.5]],"physical":[[-4,3,-19.5]],"eye":[[-5.5,15,-6],[5.5,15,-6]],"face":[[0,14.25,-11.5]],"hand_secondary":[[4,3,-19.5]]},"delibird":{"root":[[0,0,0]],"middle":[[0,13,0]],"top":[[0,26,0]],"target":[[0,14,-9]],"special":[[0,19.5,-8.75]],"hand_primary":[[-14,14.6,0]],"physical":[[-14,14.6,0]],"eye":[[1.4,21.1,-4.6],[-1.4,21.1,-4.6]],"face":[[0,21,-8.75]],"hand_secondary":[[14,14.6,0]]},"mantine":{"root":[[0,0,0]],"middle":[[0,6,0]],"top":[[0,17,0]],"target":[[0,4.5,-16.25]],"special":[[0,2.5,-11]],"mouth":[[0,2.5,-11]],"physical":[[0,11,-8]],"eye":[[-7,5.5,-11],[7,5.5,-11]],"face":[[0,5,-11]]},"skarmory":{"root":[[0,0,0]],"middle":[[0,20,0]],"top":[[0,36.5,0]],"target":[[0,18,-17]],"special":[[0,31.25,-11.5]],"mouth":[[0,31.25,-11.5]],"physical":[[0,35.08,-20.3]],"eye":[[2.55,33.5,-12.5],[-2.55,33.5,-12.5]],"face":[[0,32.5,-16.75]]},"houndour":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,21,0]],"target":[[0,10,-10]],"special":[[0,14.75,-7.25]],"mouth":[[0,14.75,-7.25]],"physical":[[0,14.75,-7.25]],"eye":[[-1.85,17.3,-7.25],[1.85,17.3,-7.25]],"face":[[0,16.75,-9.25]]},"houndoom":{"root":[[0,0,0]],"middle":[[0,19,0]],"top":[[0,35,0]],"target":[[0,19,-15]],"special":[[0,27.7,-13.3]],"mouth":[[0,27.7,-13.3]],"physical":[[0,27.7,-13.3]],"eye":[[-2,30.5,-13.25],[2,30.5,-13.25]],"face":[[0,30,-17.15]]},"kingdra":{"root":[[0,0,0]],"middle":[[0,21,0]],"top":[[0,46,0]],"target":[[0,24,-17]],"special":[[0,39.25,-21.75]],"mouth":[[0,39.25,-21.75]],"physical":[[-3,54.75,2],[3,54.75,2]],"eye":[[-2.65,41.25,-6.75],[2.65,41.25,-6.75]],"face":[[0,41,-21]]},"phanpy":{"root":[[0,0,0]],"middle":[[0,6.5,-0.25]],"top":[[0,17,0]],"target":[[0,0,0]],"special":[[0,-1.75,-7.5]],"mouth":[[0,3.25,-5.25]],"physical":[[0,9.25,-10]],"eye":[[3.5,6.5,-8.25],[-3.5,6.5,-8.25]],"face":[[0,2.65,-11.53]]},"donphan":{"root":[[0,0,0]],"middle":[[0,13,0]],"top":[[0,27,0]],"target":[[0,13,-30]],"special":[[0,23,-44]],"physical":[[0,23,-44]],"face":[[0,14,-20.75]],"jaw_lower":[[0,12,-19.75]]},"porygon2":{"root":[[0,0,0]],"middle":[[0,4.4,0]],"top":[[0,21.7,0]],"target":[[0,4.5,-6.5]],"special":[[0,11.8,-12]],"physical":[[0,11.8,-12]],"eye":[[3,12.5,-5.47],[-3,12.5,-5.47]],"face":[[0,12.75,-11]]},"hitmontop":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,24,0]],"target":[[0,11,-4.5]],"special":[[0,23.5,0]],"physical":[[-11.5,11.5,0]],"face":[[0,16,-4.5]]},"smoochum":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,19,0]],"target":[[0,10,-7]],"special":[[0,10.5,-6]],"mouth":[[0,10.5,-6]],"hand_primary":[[-8,6.2,0]],"physical":[[-8,6.2,0]],"face":[[0,12,-5]],"hand_secondary":[[8,6.2,0]]},"elekid":{"root":[[0,0,0]],"middle":[[0,7,0]],"top":[[0,19,0]],"target":[[0,7,-5.25]],"special":[[-11.75,7.5,0]],"mouth":[[0,7.95,-3.5]],"hand_primary":[[-11.75,7.5,0]],"physical":[[-11.75,7.5,0]],"eye":[[1.25,9.65,-3.5],[-1.25,9.65,-3.5]],"face":[[0,9.25,-3.5]],"hand_secondary":[[11.75,7.5,0]]},"magby":{"root":[[0,0,0]],"middle":[[0,8.6,0]],"top":[[0,20,0]],"target":[[0,8.25,-3.75]],"special":[[0,13.05,-5.35]],"mouth":[[0,13.05,-5.35]],"hand_primary":[[-6.5,9.4,0]],"physical":[[-6.5,9.4,0]],"eye":[[1.5,14.75,-3],[-1.5,14.75,-3]],"face":[[0,14.75,-5.25]],"hand_secondary":[[6.5,9.4,0]]},"miltank":{"root":[[0,0,0]],"middle":[[0,14,0]],"top":[[0,33.1,2]],"target":[[0,16,-12]],"special":[[-17.5,18,1.5]],"hand_primary":[[-17.5,18,1.5]],"physical":[[-17.5,18,1.5]],"eye":[[3,26,-4],[-3,26,-4]],"face":[[0,25,-8]],"jaw_lower":[[0,22,-6.25]],"hand_secondary":[[17.5,18,1.5]]},"blissey":{"root":[[0,0,0]],"middle":[[0,17,0]],"top":[[0,31.8,0]],"target":[[0,17,-15]],"special":[[0,22,-9.5]],"mouth":[[0,22,-9.5]],"hand_primary":[[-7.5,15.5,-13.5]],"physical":[[0,17,-15]],"eye":[[2.25,24,-9.5],[-2.25,24,-9.5]],"face":[[0,24.5,-9.5]],"hand_secondary":[[7.5,15.5,-13.5]]},"larvitar":{"root":[[0,0,0]],"middle":[[0,7,0.5]],"top":[[0,20.75,0]],"target":[[0,7,-5]],"special":[[0,19.5,3.75]],"hand_primary":[[-5,7.75,1.25]],"physical":[[0,19.5,3.75]],"eye":[[-3,11.75,-2.25],[3,11.75,-2.25]],"face":[[0,12,-5]],"hand_secondary":[[5,7.75,1.25]]},"pupitar":{"root":[[0,0,0]],"middle":[[0,15,0]],"top":[[0,32.25,0]],"target":[[0,12.75,-10.75]],"special":[[0,26,-6]],"physical":[[0,26,-6]],"eye":[[3.5,17,-6],[-3.5,17,-6]],"face":[[0,16.25,-9.25]]},"tyranitar":{"root":[[0,0,0]],"middle":[[0,27,0]],"top":[[0,54,0]],"target":[[0,27,-11]],"special":[[0,45,-3]],"mouth":[[0,45,-3]],"hand_primary":[[-23.5,27.5,2.75]],"eye":[[3,46.6,-5.4],[-3,46.6,-5.4]],"face":[[0,46.05,-8.8]],"hand_secondary":[[23.5,27.5,2.75]]},"lugia":{"root":[[0,0,0]],"middle":[[0,42,0]],"top":[[0,75,0]],"target":[[0,40,-33.5]],"special":[[0,86.5,3.1]],"mouth":[[0,86.5,3.1]],"hand_primary":[[-66.9,42.8,5]],"physical":[[-66.9,42.8,5]],"eye":[[3.55,91,6.45],[-3.55,91,6.45]],"face":[[0,96.4,7]],"hand_secondary":[[66.9,42.8,5]]},"hooh":{"root":[[0,0,0]],"middle":[[0,28,0]],"top":[[0,61.5,0]],"target":[[0,28,-32]],"special":[[0,29.7,-43.1]],"mouth":[[0,29.7,-43.1]],"physical":[[-6.5,1,4.45]],"eye":[[-3.25,32.1,-43],[3.25,32.1,-43]],"face":[[0,31,-56.2]]},"treecko":{"root":[[0,0,0]],"middle":[[0,13,0]],"top":[[0,25,0]],"target":[[0,11,-5.5]],"special":[[0,15,-0.4]],"mouth":[[0,15,-0.4]],"hand_primary":[[-9.5,12.25,-0.4]],"physical":[[-9.5,12.25,-0.4]],"eye":[[-3.5,18,-1.9],[3.5,18,-1.9]],"face":[[0,17.9,-5.8]],"hand_secondary":[[9.5,12.25,-0.4]]},"grovyle":{"root":[[0,0,0]],"middle":[[0,18,0]],"top":[[0,34,0]],"target":[[0,18,-7.5]],"special":[[0,27,-1.5]],"mouth":[[0,27,-1.5]],"hand_primary":[[-16.5,16.5,0]],"physical":[[-16.5,16.5,0]],"eye":[[3,28.6,-4],[-3,28.6,-4]],"face":[[0,29,-8.8]],"hand_secondary":[[16.5,16.5,0]]},"sceptile":{"root":[[0,0,0]],"middle":[[0,21,0]],"top":[[0,39,0]],"target":[[0,21,-10]],"special":[[0,32.9,-3.8]],"mouth":[[0,32.9,-3.8]],"hand_primary":[[-18.5,21,0.5]],"physical":[[-18.5,21,0.5]],"eye":[[-3,34.9,-5.4],[3,34.9,-5.4]],"face":[[0,35.1,-9.75]],"hand_secondary":[[18.5,21,0.5]]},"torchic":{"eye":[[-3.5,12.5,-5.25],[3.5,12.5,-5.25]]},"combusken":{"eye":[[-2.4,21.5,-3.5],[2.4,21.5,-3.5]]},"blaziken":{"eye":[[1.5,52.7,-2.35],[-1.5,52.7,-2.35]]},"mudkip":{"eye":[[2.35,9.2,-8.25],[-2.35,9.2,-8.25]]},"marshtomp":{"eye":[[2.9,19,-5.25],[-2.9,19,-5.25]]},"swampert":{"eye":[[3.5,3.5,-18],[-3.5,3.5,-18]]},"poochyena":{"eye":[[2.5,14,-9.5],[-2.5,14,-9.5]]},"mightyena":{"eye":[[-2.5,25,-14.5],[2.5,25,-14.5]]},"zigzagoon":{"eye":[[2,4.5,-10],[-2,4.5,-10]]},"linoone":{"eye":[[2,5.75,-10.75],[-2,5.75,-10.75]]},"wurmple":{"root":[[0,0,0]],"middle":[[0,5,0]],"top":[[0,12,0]],"target":[[0,5,-9]],"special":[[0,-2,-12]],"mouth":[[0,-2,-12]],"hand_primary":[[-2,-0.9,-7]],"physical":[[0,3.25,-19.4]],"eye":[[2.5,1.15,-12.25],[-2.5,1.15,-12.25]],"face":[[0,-2,-12.5]],"hand_secondary":[[2,-0.9,-7]]},"silcoon":{"root":[[0,0,0]],"middle":[[0,4,0]],"top":[[0,16,0]],"target":[[0,3.5,-7.5]],"special":[[0,16,-4.5]],"physical":[[0,16,-4.5]],"eye":[[6,4,-4.5],[-6,4,-4.5]],"face":[[0,3.5,-6.5]]},"beautifly":{"root":[[0,0,0]],"middle":[[0,7,0]],"top":[[0,24,0]],"target":[[0,7.5,-8]],"special":[[0,4.5,-16]],"mouth":[[0,7.5,-28]],"hand_primary":[[-2.5,5.25,-3.6]],"physical":[[0,4.5,-16]],"eye":[[4,9.5,-4.55],[-4,9.5,-4.55]],"face":[[0,9.5,-4.5]],"hand_secondary":[[2.5,5.25,-3.6]]},"cascoon":{"root":[[0,0,0]],"middle":[[0,5,0]],"top":[[0,18,0]],"target":[[0,3.5,-8]],"special":[[0,18,-5]],"physical":[[0,18,-5]],"eye":[[5,4,-7],[-5,4,-7]],"face":[[0,4,-7]]},"dustox":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,24,0]],"target":[[0,9.5,-7]],"special":[[0,9,-4]],"mouth":[[0,9,-4]],"hand_primary":[[9,5.25,-2],[-9,5.25,-2]],"physical":[[0,18,-3]],"eye":[[3.5,10.7,-4.3],[-3.5,10.7,-4.3]],"face":[[0,10.5,-4]],"hand_secondary":[[9,3,-2],[-9,3,-2]]},"lotad":{"eye":[[3,5.25,-4.5],[-3,5.25,-4.5]]},"lombre":{"eye":[[3,14.5,-4.5],[-3,14.5,-4.5]]},"ludicolo":{"eye":[[2,17.5,-6.5],[-2,17.5,-6.5]]},"seedot":{"root":[[0,0,0]],"middle":[[0,4.5,0]],"top":[[0,13,0]],"target":[[0,4.5,-4.75]],"special":[[0,3.5,-3.5]],"physical":[[0,4.5,-4.75]],"eye":[[-2,6,-3.5],[2,6,-3.5]],"face":[[0,5,-3.5]]},"nuzleaf":{"root":[[0,0,0]],"middle":[[0,9.5,0]],"top":[[0,24.5,0]],"target":[[0,9.5,-3]],"special":[[0,15.35,-8.2]],"mouth":[[0,13.5,-4]],"hand_primary":[[-11.75,11.25,0]],"physical":[[-11.75,11.25,0]],"eye":[[-2,16,-4],[2,16,-4]],"face":[[0,15.35,-4]],"hand_secondary":[[11.75,11.25,0]]},"shiftry":{"eye":[[-2.4,20,-7],[2.4,20,-7]]},"taillow":{"eye":[[1.65,9,-4.35],[-1.65,9,-4.35]]},"swellow":{"eye":[[1.7,14.4,-7.7],[-1.7,14.4,-7.7]]},"wingull":{"eye":[[1.75,3.85,-3.5],[-1.75,3.85,-3.5]]},"pelipper":{"eye":[[-3,15.5,-2.75],[3,15.5,-2.75]]},"ralts":{"eye":[[1.75,11.5,-3.5],[-1.75,11.5,-3.5]]},"kirlia":{"eye":[[2.25,17.5,-1.15],[-2.25,17.5,-1.15]]},"gardevoir":{"eye":[[2.05,30.5,-1.35],[-2.05,30.5,-1.35]]},"surskit":{"eye":[[-2.5,11,-4],[2.5,11,-4]]},"masquerain":{"eye":[[-2.5,9,-8],[2.5,9,-8]]},"shroomish":{"eye":[[-1.5,7.5,-6],[1.5,7.5,-6]]},"breloom":{"eye":[[-2,18.35,-1.5],[2,18.35,-1.5]]},"slakoth":{"root":[[0,0,0]],"middle":[[0,4,0]],"top":[[0,10,0]],"target":[[0,4,-11]],"special":[[0,1,-9.5]],"mouth":[[0,1,-9.5]],"hand_primary":[[-20,2,-1.5]],"physical":[[-20,2,-1.5]],"eye":[[2.4,4,-9.53],[-2.4,4,-9.5]],"face":[[0,4,-10.5]],"hand_secondary":[[20,2,-1.5]]},"vigoroth":{"eye":[[2.25,26.7,-5.45],[-2.25,26.7,-5.45]]},"slaking":{"root":[[0,0,0]],"middle":[[0,21,0]],"top":[[0,42.5,0]],"target":[[0,20,-13]],"special":[[0,35.5,-6]],"mouth":[[0,35.5,-6]],"hand_primary":[[-42.5,28.75,0]],"physical":[[-42.5,28.75,0]],"eye":[[3,39.75,-7.05],[-3,39.75,-7.05]],"face":[[0,39.5,-8]],"hand_secondary":[[42.5,28.75,0]]},"nincada":{"eye":[[3.5,8.5,-7],[-3.5,8.5,-7]]},"ninjask":{"eye":[[4,7.5,-8.25],[-4,7.5,-8.25]]},"shedinja":{"eye":[[4.75,13.5,-7],[-4.75,13.5,-7]]},"whismur":{"eye":[[-2.25,6.75,-4],[2.25,6.75,-4]]},"loudred":{"eye":[[2.75,17.25,-6],[-2.75,17.25,-6]]},"exploud":{"eye":[[-4,26.5,-5],[4,26.5,-5]]},"makuhita":{"eye":[[1.75,14.5,-4],[-1.75,14.5,-4]]},"hariyama":{"eye":[[-3.5,27,-6],[3.5,27,-6]]},"azurill":{"root":[[0,0,0]],"middle":[[0,5,0]],"top":[[0,11.35,0]],"target":[[0,4.75,-6]],"special":[[0,3.75,-4]],"mouth":[[0,3.75,-4]],"physical":[[0,8.5,-2.5]],"eye":[[2,5.5,-3.95],[-2,5.5,-3.95]],"face":[[0,5.5,-4]]},"nosepass":{"eye":[[-4.15,13.5,-5.1],[4.15,13.5,-5.1]]},"skitty":{"root":[[0,0,0]],"middle":[[0,6.5,0]],"top":[[0,15,0]],"target":[[0,6,-8]],"special":[[0,6.5,-6.4]],"mouth":[[0,6.5,-6.4]],"physical":[[0,13,-6.4]],"eye":[[-2.75,8.7,-6.4],[2.75,8.7,-6.4]],"face":[[0,8,-6.4]]},"delcatty":{"root":[[0,0,0]],"middle":[[0,14,0]],"top":[[0,28,0]],"target":[[0,14,-14]],"special":[[0,18.4,-11.25]],"mouth":[[0,18.4,-11.25]],"physical":[[-2.5,0.5,-5]],"eye":[[2.25,21.2,-11],[-2.25,21.2,-11]],"face":[[0,21,-11]]},"sableye":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,21.5,0]],"target":[[0,12,-6]],"special":[[0,15.2,-5.8]],"mouth":[[0,15.2,-5.8]],"hand_primary":[[-11.6,12.5,0.5]],"physical":[[-12.7,13,0.5]],"eye":[[0.35,18.3,-5.2],[-0.35,18.3,-5.2]],"face":[[0,18,-5.65]],"hand_secondary":[[11.6,12.5,0.5]]},"mawile":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,18.5,0]],"target":[[0,9,-8]],"special":[[0,46,1.25]],"mouth":[[0,46,1.25]],"hand_primary":[[-7.8,9,0.2]],"physical":[[0,46,1.25]],"eye":[[3.15,13.5,-0.25],[-3.15,13.5,-0.25]],"face":[[0,13.5,-4.4]],"hand_secondary":[[7.8,9,0.2]]},"aron":{"eye":[[4.5,6.5,-7.55],[-4.5,6.5,-7.55]]},"lairon":{"eye":[[4.5,9.6,-14.1],[-4.5,9.6,-14.1]]},"aggron":{"eye":[[-4.5,43.6,-10],[4.5,43.6,-10]]},"meditite":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,25,0]],"target":[[0,12,-5]],"special":[[-9.5,13,0]],"mouth":[[0,14.8,-4.5]],"hand_primary":[[-9.5,13,0]],"physical":[[-9.5,13,0]],"eye":[[2.75,17,-4.5],[-2.75,17,-4.5]],"face":[[0,17.1,-4.5]],"hand_secondary":[[-9.5,13,0]]},"medicham":{"root":[[0,0,0]],"middle":[[0,20,0]],"top":[[0,36,0]],"target":[[0,20,-7]],"special":[[-16.7,21.6,0]],"mouth":[[0,25.3,-5.3]],"hand_primary":[[-16.7,21.6,0]],"physical":[[-16.7,21.6,0]],"eye":[[-2.25,28.4,-4.5],[2.25,28.4,-4.5]],"face":[[0,27.7,-4.5]],"hand_secondary":[[16.7,21.6,0]]},"electrike":{"root":[[0,0,0]],"middle":[[0,8.5,0]],"top":[[0,17,0]],"target":[[0,8,-16]],"special":[[0,6.9,-12.1]],"mouth":[[0,6.9,-12.1]],"physical":[[0,13,-13.3]],"eye":[[2.5,9.4,-12],[-2.5,9.4,-12]],"face":[[0,9,-15.8]]},"manectric":{"root":[[0,0,0]],"middle":[[0,17,0]],"top":[[0,38,0]],"target":[[0,15,-17]],"special":[[0,23.45,-11.52]],"mouth":[[0,23.45,-11.52]],"physical":[[0,22.65,-15.22]],"eye":[[3.4,26.6,-11.32],[-3.4,26.6,-11.32]],"face":[[0,25.55,-16.52]]},"plusle":{"root":[[0,0,0]],"middle":[[0,8,-0.75]],"top":[[0,25.4,-0.75]],"target":[[0,8,-5.75]],"special":[[0,0,0]],"mouth":[[0,8.75,-5.25]],"hand_primary":[[-6.25,7,-1]],"physical":[[0,8,-5.75]],"eye":[[-2.75,11.5,-5.25],[2.75,11.5,-5.25]],"face":[[0,11.25,-5.25]],"hand_secondary":[[6.25,7,-1]]},"minun":{"root":[[0,0,0]],"middle":[[0,8,-0.75]],"top":[[0,25.4,-0.75]],"target":[[0,8,-5.75]],"special":[[0,0,0]],"mouth":[[0,8.75,-5.25]],"hand_primary":[[-6.25,7,-1]],"physical":[[0,8,-5.75]],"eye":[[-2.75,11.5,-5.25],[2.75,11.5,-5.25]],"face":[[0,11.25,-5.25]],"hand_secondary":[[6.25,7,-1]]},"volbeat":{"eye":[[2.5,15,-4],[-2.5,15,-4]]},"illumise":{"eye":[[2.5,15,-3.5],[-2.5,15,-3.5]]},"roselia":{"eye":[[2.5,16.25,-4],[-2.5,16.25,-4]]},"carvanha":{"eye":[[-4.5,7.5,-5.5],[4.5,7.5,-5.5]]},"sharpedo":{"root":[[0,0,0]],"middle":[[0,8,1]],"top":[[0,33,1]],"target":[[0,8,-17]],"special":[[0,3.5,-2.5]],"mouth":[[0,3.5,-2.5]],"physical":[[0,3.5,-2.5]],"eye":[[-6.5,7,-6],[6.5,7,-6]],"face":[[0,7.85,-15.75]],"jaw_lower":[[0,2.5,-9.25]]},"wailmer":{"root":[[0,0,0]],"middle":[[0,6,0]],"top":[[0,15,0]],"target":[[0,6,-10.5]],"special":[[0,6.9,-1.4]],"mouth":[[0,6.9,-1.4]],"physical":[[0,14,-5]],"eye":[[4.5,10,-8.5],[-4.5,10,-8.5]],"face":[[0,9,-8.5]]},"wailord":{"root":[[0,0,0]],"middle":[[0,19,8]],"top":[[0,38,8]],"target":[[0,19,-42.5]],"special":[[0,19,-9]],"mouth":[[0,19,-9]],"eye":[[-21.5,20.25,-25.5],[21.5,20.25,-25.5]],"face":[[0,20,-41]]},"numel":{"eye":[[2.5,8,-18.5],[-2.5,8,-18.5]]},"camerupt":{"eye":[[-6.5,18,-27.25],[6.5,18,-27.25]]},"torkoal":{"eye":[[3.5,8.75,-23.5],[-3.5,8.75,-23.5]]},"spoink":{"eye":[[2,14.9,-4],[-2,14.9,-4]]},"grumpig":{"eye":[[3.5,22.5,-4.5],[-3.5,22.5,-4.5]]},"spinda":{"eye":[[3.5,18.25,-5],[-3.5,18.25,-5]]},"trapinch":{"eye":[[5.5,9.3,-9.6],[-5.5,9.3,-9.6]]},"vibrava":{"eye":[[4,7.5,-10.5],[-4,7.5,-10.5]]},"flygon":{"eye":[[4.5,43.5,-3.75],[-4.5,43.5,-3.75]]},"cacnea":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,17,0]],"target":[[0,8,-6]],"special":[[0,7.5,-5]],"mouth":[[0,7.5,-5]],"hand_primary":[[-11.5,7.5,0]],"physical":[[-11.5,7.5,0]],"eye":[[2.35,9.85,-5],[-2.35,9.85,-5]],"face":[[0,9,-5]],"hand_secondary":[[11.5,7.5,0]]},"cacturne":{"root":[[0,0,0]],"middle":[[0,14.5,0]],"top":[[0,34.25,0]],"target":[[0,14.5,-3.5]],"special":[[0,22.15,-5]],"mouth":[[0,22.15,-5]],"hand_primary":[[-13.5,17.75,0]],"physical":[[-13.5,17.75,0]],"eye":[[-0.3,24.45,-3.55],[-3.05,24.45,-0.55]],"face":[[0,23.45,-5]],"hand_secondary":[[13.5,17.75,0]]},"swablu":{"root":[[0,0,0]],"middle":[[0,6,0]],"top":[[0,12.25,0]],"target":[[0,5,-8]],"special":[[0,6.5,-5]],"mouth":[[0,6.5,-5]],"physical":[[0,7.5,-7]],"eye":[[2.5,7.75,-5],[-2.5,7.75,-5]],"face":[[0,7.5,-7]]},"altaria":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,34.25,0]],"target":[[0,12,-12]],"special":[[0,23,-10]],"mouth":[[0,23,-10]],"physical":[[0,25,-12]],"eye":[[-2,26,-10],[2,26,-10]],"face":[[0,25,-12]]},"zangoose":{"root":[[0,0,0]],"middle":[[0,16,0]],"top":[[0,28,0]],"target":[[0,16,-5.5]],"special":[[0,22.4,-4.3]],"mouth":[[0,22.4,-4.3]],"hand_primary":[[-15.45,18.8,0]],"physical":[[-18,18.8,0]],"eye":[[-2,25.1,-3.6],[2,25.1,-3.6]],"face":[[0,25.1,-3.6]],"hand_secondary":[[15.45,18.8,0]]},"seviper":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,26,0]],"target":[[0,12,-16]],"special":[[0,17.3,-4]],"mouth":[[0,17.3,-4]],"physical":[[2.75,13.4,-8.35],[-2.75,13.4,-8.35]],"eye":[[4,19.7,-6],[-4,19.7,-6]],"face":[[0,19.3,-10.5]]},"lunatone":{"eye":[[4.4,11.5,6],[-4.4,11.5,6]]},"solrock":{"eye":[[3.5,12.5,-5.5],[-3.5,12.5,-5.5]]},"barboach":{"eye":[[3,3.5,-11.5],[-3,3.5,-11.5]]},"whiscash":{"eye":[[-10,10,-20],[10,10,-20]]},"corphish":{"eye":[[-3.5,4.35,-10.6],[3.5,4.35,-10.6]]},"crawdaunt":{"eye":[[1.45,24.95,-2.85],[-1.45,24.95,-2.85]]},"baltoy":{"eye":[[0,14.2,-5.25],[0,14.2,-5.25]]},"claydol":{"eye":[[0,22.5,-15],[0,22.5,15],[15,22.5,0],[-15,22.5,0],[15,22.5,0],[-15,22.5,0],[15,22.5,0],[-15,22.5,0]]},"lileep":{"eye":[[1.75,13.75,0.25],[-1.75,13.75,0.25]]},"cradily":{"eye":[[-5,38,-10.5],[5,38,-10.5]]},"anorith":{"eye":[[-5.5,1.75,-5.25],[5.5,1.75,-5.25]]},"armaldo":{"eye":[[5,31,-1.5],[-5,31,-1.5]]},"feebas":{"eye":[[3.5,7.25,-4.5],[-3.5,7.25,-4.5]]},"milotic":{"eye":[[3,38,-2.75],[-3,38,-2.75]]},"kecleon":{"eye":[[4,19.75,-1],[-4,19.75,-1]]},"shuppet":{"root":[[0,0,0]],"middle":[[0,9,0]],"top":[[0,22,0]],"target":[[0,8,-8]],"special":[[0,8,-6]],"mouth":[[0,8,-6]],"physical":[[0,21.5,0]],"eye":[[4,11,-6],[-4,11,-6]],"face":[[0,10.3,-6]]},"banette":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,25,0]],"target":[[0,9,-7]],"special":[[0,12.9,-5]],"mouth":[[0,12.9,-5]],"hand_primary":[[-12.7,9.5,0]],"physical":[[-12.7,9.5,0]],"eye":[[3.4,15.7,-5],[-3.4,15.7,-5]],"face":[[0,15.25,-5]],"hand_secondary":[[12.7,9.5,0]]},"duskull":{"eye":[[0,9.5,-5.25]]},"dusclops":{"eye":[[0,26.5,-6]]},"tropius":{"root":[[0,0,0]],"middle":[[0,41,0]],"top":[[0,82,0]],"target":[[0,41,-27]],"special":[[0,98.2,-14.5]],"mouth":[[0,91.3,-14.7]],"physical":[[0,98.2,-14.5]],"eye":[[4.7,91.9,-11.7],[-4.5,91.9,-11.7]],"face":[[0,98.3,-12.8]]},"chimecho":{"root":[[0,0,0]],"middle":[[0,20,0]],"top":[[0,28,0]],"target":[[0,20,-6.5]],"special":[[0,19.7,-3.5]],"mouth":[[0,19.7,-3.5]],"hand_primary":[[-2.7,19,-4.5]],"physical":[[0,0,0]],"eye":[[2,21,-3.5],[-2,21,-3.5]],"face":[[0,20.5,-3.5]],"hand_secondary":[[2.7,19,-4.5]]},"absol":{"root":[[0,0,0]],"middle":[[0,20,0]],"top":[[0,38,0]],"target":[[0,24,-17.5]],"special":[[0,28.35,-17.5]],"mouth":[[0,28.35,-17.5]],"physical":[[-3.75,-1.4,-10.4]],"eye":[[2.5,31,-16],[-2.5,31,-16]],"face":[[0,29.35,-17.4]]},"wynaut":{"eye":[[0,3,10]]},"snorunt":{"eye":[[2.25,7.5,-5],[-2.25,7.5,-5]]},"glalie":{"eye":[[5.5,13.5,-10],[-5.5,13.5,-10]]},"spheal":{"root":[[0,0,0]],"middle":[[0,7,0]],"top":[[0,14,0]],"target":[[0,7,-9]],"special":[[0,7.5,-7]],"mouth":[[0,7.5,-7]],"hand_primary":[[-9,2,-5.5]],"physical":[[0,7,-9]],"eye":[[3.25,10.75,-7],[-3.25,10.75,-7]],"face":[[0,9.75,-7.75]],"hand_secondary":[[9,2,-5.5]]},"sealeo":{"eye":[[2.35,16.75,-5.05],[-2.35,16.75,-5.05]]},"walrein":{"eye":[[2.85,26.25,-16.45],[-2.85,26.25,-16.45]]},"clamperl":{"eye":[[-1,5.85,-2],[1,5.85,-2]]},"huntail":{"eye":[[3,5.5,-16.5],[-3,5.5,-16.5]]},"gorebyss":{"eye":[[1.5,3.5,-15],[-1.5,3.5,-15]]},"relicanth":{"eye":[[4.5,11,-12],[-4.5,11,-12]]},"luvdisc":{"eye":[[-0.5,4.25,-1.75],[0.5,4.25,-1.75]]},"bagon":{"eye":[[1.5,14.15,-3],[-1.5,14.15,-3]]},"shelgon":{"eye":[[2.75,14.5,-11],[-2.75,14.5,-11]]},"salamence":{"root":[[0,0,0]],"middle":[[0,13.5,-2]],"top":[[0,39,0]],"target":[[0,12.5,-35]],"special":[[0,17.25,-45.5]],"mouth":[[0,17.25,-45.5]],"physical":[[0,12,99.5]],"eye":[[5.5,20,-49.35],[-5.5,20,-49.3]],"face":[[0,18,-55.25]]},"beldum":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,13,0]],"target":[[0,7.5,-8.5]],"special":[[0,8.5,7]],"physical":[[0,8.5,7]],"eye":[[0,7.75,-7]],"face":[[0,7.75,-7]]},"metang":{"root":[[0,0,0]],"middle":[[0,9.5,0]],"top":[[0,17,0]],"target":[[0,10.5,-12]],"special":[[0,11.75,-10.8]],"hand_primary":[[-13.25,0,-2.55]],"physical":[[-13.25,0,-2.55]],"eye":[[3.25,12,-4],[-3.25,12,-4]],"face":[[0,11.75,-10.8]],"hand_secondary":[[13.25,0,-2.55]]},"metagross":{"root":[[0,0,0]],"middle":[[0,25.5,0]],"top":[[0,35.5,0]],"target":[[0,25.5,-19]],"special":[[0,19.5,-10.5]],"mouth":[[0,19.5,-10.5]],"hand_primary":[[-25.75,4.7,-6.75],[-25.75,4.7,6.75]],"physical":[[-25.75,4.7,-6.75]],"eye":[[5.5,27.4,-13],[-5.5,27.4,-13]],"face":[[0,26.5,-16.5]],"hand_secondary":[[25.75,4.7,-6.75],[25.75,4.7,6.75]]},"regirock":{"eye":[[0,40,-4.5],[3,40,-4.5],[3,43,-4.5],[3,37,-4.5],[-3,40,-4.5],[-3,43,-4.5],[-3,37,-4.5]]},"regice":{"eye":[[2,33,-6],[5,33,-6],[1,33,-6],[1,36,-6],[1,30,-6],[-2,33,-6],[-5,33,-6]]},"registeel":{"eye":[[0,31.75,-11],[4,31.75,-11],[2,35.25,-11],[2,28.25,-11],[-4,31.75,-11],[-2,35.25,-11],[-2,28.25,-11]]},"latias":{"eye":[[4.5,17.5,-30.5],[-4.5,17.5,-30.5]]},"latios":{"eye":[[4,16.75,-33.5],[-4,16.75,-33.5]]},"rayquaza":{"root":[[0,0,0]],"middle":[[0,50,0]],"top":[[0,92,0]],"target":[[0,-1,-64]],"special":[[0,6.95,-113]],"mouth":[[0,6.95,-113]],"hand_primary":[[-30.9,6.8,-72]],"physical":[[0,6.95,-113]],"eye":[[6.6,10.5,-118.4],[-6.6,10.5,-118.4]],"face":[[0,12,-127.15]],"hand_secondary":[[30.9,6.8,-72]]},"turtwig":{"root":[[0,0,0]],"middle":[[0,6,0]],"top":[[0,20,0]],"target":[[0,7,-11]],"special":[[0,6.75,-7]],"mouth":[[0,6.75,-4.5]],"physical":[[0,6.75,-7]],"eye":[[3.5,9.75,-8],[-3.5,9.75,-8]],"face":[[0,9.75,-9]]},"grotle":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,26.5,0]],"target":[[0,10,-20]],"special":[[0,8.25,-13.75]],"mouth":[[0,8.25,-12.5]],"physical":[[0,8.25,-13.75]],"eye":[[3.5,11.25,-14],[-3.5,11.25,-14]],"face":[[0,11.25,-16.75]]},"torterra":{"root":[[0,0,0]],"middle":[[0,14,0]],"top":[[0,53.5,0]],"target":[[0,10,-34]],"special":[[0,10,-25]],"mouth":[[0,10,-23]],"physical":[[0,10,-25]],"eye":[[4.5,13,-25],[-4.5,13,-25]],"face":[[0,13,-30.5]]},"chimchar":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,27,0]],"target":[[0,12,-8]],"special":[[0,13.25,-3.25]],"mouth":[[0,13.25,-3.25]],"hand_primary":[[-12,11.75,0]],"physical":[[-12,11.75,0]],"eye":[[-2.5,16.25,-3.8],[2.5,16.25,-3.8]],"face":[[0,16.75,-4.75]],"hand_secondary":[[12,11.75,0]]},"monferno":{"root":[[0,0,0]],"middle":[[0,13.5,0]],"top":[[0,29.25,0]],"target":[[0,16,-6]],"special":[[0,19.75,-4.25]],"mouth":[[0,19.75,-4.25]],"hand_primary":[[-15,17,0]],"physical":[[-15,17,0]],"eye":[[2.15,22.7,-4.25],[-2.15,22.7,-4.25]],"face":[[0,22.5,-6]],"hand_secondary":[[15,17,0]]},"infernape":{"root":[[0,0,0]],"middle":[[0,30,0]],"top":[[0,50.25,0]],"target":[[0,32,-10]],"special":[[0,39,-5]],"mouth":[[0,39,-5]],"hand_primary":[[-27.25,34.5,0]],"physical":[[-27.25,34.5,0]],"eye":[[-2.75,43.05,-5],[2.75,43.05,-5]],"face":[[0,41.75,-8.5]],"hand_secondary":[[27.25,34.5,0]]},"piplup":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,17,0]],"target":[[0,7.75,-6.75]],"special":[[0,0,0]],"mouth":[[0,11,-4.5]],"physical":[[0,11.75,-6]],"eye":[[3,12.75,-4.5],[-3,12.75,-4.5]],"face":[[0,13,-6]]},"prinplup":{"root":[[0,0,0]],"middle":[[0,13,0]],"top":[[0,27.75,0]],"target":[[0,14,-7]],"special":[[0,19.25,-4]],"mouth":[[0,19.25,-4]],"physical":[[0,20.25,-5.95]],"eye":[[2.5,21,-4],[-2.5,21,-4]],"face":[[0,21,-5.95]]},"empoleon":{"root":[[0,0,0]],"middle":[[0,24,0]],"top":[[0,52,0]],"target":[[0,27,-10]],"special":[[0,37,-2.5]],"mouth":[[0,37,-2.5]],"hand_primary":[[-28.25,28.5,0]],"physical":[[-28.25,28.5,0]],"eye":[[-0.5,39.5,-4],[0.5,39.5,-4]],"face":[[0,39,-5.97]],"hand_secondary":[[28.25,28.5,0]]},"starly":{"root":[[0,0,0]],"middle":[[0,6,0]],"top":[[0,12,0]],"target":[[0,6,-8]],"special":[[0,7.2,-5.1]],"mouth":[[0,7.2,-5.1]],"physical":[[0,7.75,-8]],"eye":[[2,8,-5.1],[-2,8,-5.1]],"face":[[0,8.2,-5.1]]},"staravia":{"root":[[0,0,0]],"middle":[[0,9,0]],"top":[[0,16,0]],"target":[[0,9,-9]],"special":[[0,10.9,-6.6]],"mouth":[[0,10.9,-6.6]],"physical":[[0,11.5,-9]],"eye":[[-1.75,12,-6.6],[1.75,12,-6.6]],"face":[[0,12,-6.6]]},"staraptor":{"root":[[0,0,0]],"middle":[[0,19,0]],"top":[[0,32,0]],"target":[[0,19,-16]],"special":[[0,17.3,-11.9]],"mouth":[[0,17.3,-11.9]],"physical":[[0,17.8,-15.5]],"eye":[[-1.5,18.8,-9.6],[1.5,18.8,-9.6]],"face":[[0,18.8,-12.6]]},"bidoof":{"root":[[0,0,0]],"middle":[[0,6.75,0]],"top":[[0,13.5,0]],"target":[[0,6.75,-9.5]],"special":[[0,4.25,-9.5]],"mouth":[[0,4.25,-9.5]],"physical":[[0,2.25,-9.5]],"eye":[[-2.75,7.5,-8.52],[2.75,7.5,-8.52]],"face":[[0,6.75,-9.5]]},"bibarel":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,20,0]],"target":[[0,10,-18]],"special":[[0,8.5,-16.5]],"mouth":[[0,8.5,-16.5]],"physical":[[0,8.5,-16.5]],"eye":[[-2.05,13.5,-14.5],[2.05,13.5,-14.5]],"face":[[0,13,-14.5]]},"kricketot":{"eye":[[2.25,9,-3],[-2.25,9,-3]]},"kricketune":{"eye":[[3.5,20.5,-3],[-3.5,20.5,-3]]},"shinx":{"root":[[0,0,0]],"middle":[[0,9,0]],"top":[[0,20,0]],"target":[[0,9,-10]],"special":[[0,9.75,-8.25]],"mouth":[[0,9.75,-8.25]],"physical":[[0,16.75,-8.25]],"eye":[[-2.7,12.25,-8.25],[2.7,12.25,-8.25]],"face":[[0,12.25,-8.25]]},"luxio":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,25,0]],"target":[[0,11,-14]],"special":[[0,13.75,-11.75]],"mouth":[[0,13.75,-11.75]],"physical":[[-3.1,0.5,-6.1]],"eye":[[-2.5,16.6,-11.75],[2.5,16.6,-11.75]],"face":[[0,16.25,-11.75]]},"luxray":{"root":[[0,0,0]],"middle":[[0,18,0]],"top":[[0,35,0]],"target":[[0,18,-20]],"special":[[0,21.3,-16]],"mouth":[[0,21.3,-16]],"physical":[[-3.8,0.5,-8.5]],"eye":[[2.45,24.3,-15.5],[-2.45,24.3,-15.5]],"face":[[0,24.5,-15.5]]},"budew":{"root":[[0,0,0]],"middle":[[0,7,0]],"top":[[0,18.5,0]],"target":[[0,6.75,-5.75]],"special":[[0,13,0]],"mouth":[[0,4.25,-4]],"physical":[[0,9.5,-1.5]],"eye":[[2,5.75,-4.02],[-2,5.75,-4.02]],"face":[[0,4.75,-4]]},"roserade":{"root":[[0,0,0]],"middle":[[0,15,0]],"top":[[0,30,0]],"target":[[0,15,-4]],"special":[[16,15,0]],"mouth":[[0,19.25,-4]],"hand_primary":[[-16,15,0]],"physical":[[-16,15,0]],"eye":[[2,21.5,-4.02],[-2,21.5,-4.02]],"face":[[0,20.5,-4]],"hand_secondary":[[16,15,0]]},"cranidos":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,24.5,0]],"target":[[0,11,-8.5]],"special":[[0,11.25,-9.75]],"mouth":[[0,11.25,-9.75]],"hand_primary":[[-2.5,4.25,-4.25]],"physical":[[0,20,-7.5]],"eye":[[-4.55,14.5,-8.75],[4.55,14.5,-8.75]],"face":[[0,15.75,-12.3]],"hand_secondary":[[2.5,4.25,-4.25]]},"rampardos":{"eye":[[-4,42.8,-4.9],[4,42.8,-4.9]]},"shieldon":{"eye":[[2.5,14,-10.5],[-2.5,14,-10.5]]},"bastiodon":{"root":[[0,0,0]],"middle":[[0,12.5,0]],"top":[[0,26.6,0]],"target":[[0,12.5,-21.5]],"special":[[0,7.75,-13.25]],"mouth":[[0,7.75,-13.25]],"physical":[[0,19.75,-17.25]],"eye":[[4.75,11.25,-17],[-4.75,11.25,-17]],"face":[[0,9,-20]],"jaw_lower":[[0,8.53,-18.77]]},"burmy":{"root":[[0,0,0]],"middle":[[0,8.5,0]],"top":[[0,24,0]],"target":[[0,8.5,-6]],"special":[[0,10.5,-4.5]],"mouth":[[0,10.25,-3.75]],"physical":[[0,3.75,0]],"eye":[[1.65,11.75,-3.4],[-1.65,11.75,-3.4]],"face":[[0,11.75,-3.4]]},"wormadam":{"root":[[0,0,0]],"middle":[[0,8.5,0]],"top":[[0,27.5,0]],"target":[[0,8.5,-8]],"special":[[0,11.5,-6.25]],"physical":[[0,3.65,0]],"eye":[[1.55,12.75,-2.75],[-1.55,12.75,-2.75]],"face":[[0,13,-2.75]]},"mothim":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,21,0]],"target":[[0,9,-5.5]],"special":[[0,11.5,-5.25]],"mouth":[[0,12,-3.5]],"hand_primary":[[-4.1,10.25,-0.75]],"physical":[[0,17.5,-0.5]],"eye":[[1.75,14.5,-3.5],[-1.75,14.5,-3.5]],"face":[[0,14.5,-4]],"hand_secondary":[[4.1,10.25,-0.75]]},"combee":{"eye":[[-1.5,8.25,-2.4],[-4.5,8.25,-2.4],[-1.5,2.25,-2.4],[1.5,2.25,-2.4],[4.5,8.25,-2.4],[1.5,8.25,-2.4]]},"vespiquen":{"eye":[[-1.6,22.6,-5.55],[1.6,22.6,-5.55]]},"pachirisu":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,24,0]],"target":[[0,9,-10]],"special":[[0,7.5,23]],"mouth":[[0,9,-7.75]],"hand_primary":[[-3,6.9,-6.6]],"physical":[[0,-9.5,23]],"eye":[[-3.15,12.5,-7.8],[3.15,12.5,-7.8]],"face":[[0,12,-7.75]],"hand_secondary":[[3,6.9,-6.6]]},"buizel":{"eye":[[3,20,-2.5],[-3,20,-2.5]]},"floatzel":{"eye":[[3,24,-3],[-3,24,-3]]},"cherubi":{"root":[[0,0,0]],"middle":[[0,6,0]],"top":[[0,16,0]],"target":[[0,5,-6]],"special":[[0,3,-4]],"mouth":[[0,3,-4]],"physical":[[2,9.5,1]],"eye":[[3,5,-4],[-3,5,-4],[2,7.6,2.25],[2,7.6,-0.25]],"face":[[0,5,-4]]},"cherrim":{"root":[[0,0,0]],"middle":[[0,9,0]],"top":[[0,20,0]],"target":[[0,7,-6]],"special":[[0,2.5,-3]],"physical":[[0,25.5,0]],"eye":[[2.5,2.5,-3],[-2.5,2.5,-3]],"face":[[0,2.5,-3]]},"shellos":{"eye":[[3,14.5,-8],[-3,14.5,-8]]},"gastrodon":{"eye":[[3.5,25.75,-14.25],[-3.5,25.75,-14.25]]},"ambipom":{"root":[[0,0,0]],"middle":[[0,17,0]],"top":[[0,36,0]],"target":[[0,17,-5]],"special":[[0.75,11,41.5]],"mouth":[[0,23.25,-4.5]],"hand_primary":[[0.75,11,41.5],[-0.75,11,41.5]],"physical":[[-0.75,11,41.5]],"eye":[[3.75,27,-4.5],[-3.75,27,-4.5]],"face":[[0,25,-4.5]],"hand_secondary":[[16,19,0],[-16,19,0]]},"drifloon":{"eye":[[3.25,19,-5.05],[-3.25,19,-5.05]]},"drifblim":{"eye":[[10,27.5,-12],[-10,27.5,-12]]},"buneary":{"root":[[0,0,0]],"middle":[[0,10.5,0]],"top":[[0,33,0]],"target":[[0,10,-6]],"special":[[0,12.75,-4.75]],"mouth":[[0,12.75,-4.75]],"hand_primary":[[-7,10.5,-0.25]],"physical":[[0,19.75,-2]],"eye":[[3.25,15.75,-4.75],[-3.25,15.75,-4.75]],"face":[[0,14.75,-4.75]],"hand_secondary":[[7,10.5,-0.25]]},"lopunny":{"root":[[0,0,0]],"middle":[[0,24.5,-2.5]],"top":[[0,51.5,0]],"target":[[0,24,-7]],"special":[[0,31.75,-5.5]],"mouth":[[0,31.75,-5.5]],"hand_primary":[[-15.5,27,0.25]],"physical":[[-15.5,27,0.25]],"eye":[[4,34.75,-3.25],[-4,34.75,-3.25]],"face":[[0,33.75,-5.5]],"hand_secondary":[[15.5,27,0.25]]},"mismagius":{"root":[[0,0,0]],"middle":[[0,20,0]],"top":[[0,40,0]],"target":[[0,19,-6]],"special":[[0,19,-6]],"mouth":[[0,23.5,-4]],"hand_primary":[[-2.7,14,-17]],"physical":[[-2.7,14,-17]],"eye":[[-2.8,25.75,-4],[2.8,25.75,-4]],"face":[[0,25,-4]],"hand_secondary":[[2.7,14,-17]]},"honchkrow":{"root":[[0,0,0]],"middle":[[0,16,0]],"top":[[0,29,0]],"target":[[0,14,-14]],"special":[[0,22.1,-2.5]],"mouth":[[0,22.1,-2.5]],"physical":[[0,23.1,-7.6]],"eye":[[-2.4,23,-2.5],[2.4,23,-2.5]],"face":[[0,22.1,-7.4]]},"glameow":{"eye":[[2.5,13.1,-7.5],[-2.5,13.1,-7.5]]},"purugly":{"eye":[[3,16.7,-10.5],[-3,16.7,-10.5]]},"chingling":{"root":[[0,0,0]],"middle":[[0,6.5,0]],"top":[[0,14,0]],"target":[[0,5,-6.5]],"special":[[0,3.45,-4]],"mouth":[[0,3.45,-4]],"hand_primary":[[-6.1,4,1]],"physical":[[0,9.05,-4]],"eye":[[2.25,5,-4],[-2.25,5,-4]],"face":[[0,5,-4]],"hand_secondary":[[6.1,4,1]]},"stunky":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,22,0]],"target":[[0,7,-12.5]],"special":[[0,8.5,6]],"mouth":[[0,3.8,-8.2]],"physical":[[-2.5,0.5,-6.5]],"eye":[[1.4,7.8,-10.8],[-1.4,7.8,-10.8]],"face":[[0,7.55,-10.8]]},"skuntank":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,28,0]],"target":[[0,8,-20]],"special":[[0,15.25,-21]],"mouth":[[0,5.25,-12.5]],"physical":[[0,5.25,-13.75]],"eye":[[1.75,9.1,-13.25],[-1.75,9.1,-13.25]],"face":[[0,8.75,-14.5]]},"bronzor":{"eye":[[3.25,9,-1],[-3.25,9,-1]]},"bronzong":{"root":[[0,0,0]],"middle":[[0,12.5,0]],"top":[[0,39.5,0]],"target":[[0,11,-13]],"special":[[0,0,-7]],"hand_primary":[[-32,24,0]],"physical":[[0,0,-7]],"eye":[[6,7.5,-10.5],[-6,7.5,-10.5]],"face":[[0,7.5,-10]],"hand_secondary":[[32,24,0]]},"bonsly":{"eye":[[2.25,9.8,-4],[-2.25,9.8,-4]]},"mimejr":{"eye":[[2.75,10.75,-4],[-2.75,10.75,-4]]},"happiny":{"root":[[0,0,0]],"middle":[[0,7,0]],"top":[[0,20.75,0]],"target":[[0,7,-7]],"special":[[0,9,-3.5]],"mouth":[[0,9,-3.5]],"hand_primary":[[-3.5,7.5,-4.75]],"physical":[[0,7,-6]],"eye":[[1.75,10,-3.5],[-1.75,10,-3.5]],"face":[[0,10,-3.5]],"hand_secondary":[[3.5,7.5,-4.75]]},"chatot":{"eye":[[3,10.75,-3.4],[-3,10.75,-3.4]]},"spiritomb":{"eye":[[-2.5,15,-9],[2.5,15.5,-9]]},"gible":{"root":[[0,0,1]],"middle":[[0,10,0]],"top":[[0,21,0]],"target":[[0,8,-13]],"special":[[0,8.8,-4.5]],"mouth":[[0,8.8,-4.5]],"hand_primary":[[-9.5,7.65,-1.75]],"physical":[[0,8.8,-4.5]],"eye":[[3.4,10.65,-8.6],[-3.4,10.65,-8.6]],"face":[[0,11.5,-11.95]],"hand_secondary":[[9.5,7.65,-1.75]]},"gabite":{"root":[[0,0,1]],"middle":[[0,15,0]],"top":[[0,29,0]],"target":[[0,14,-8]],"special":[[0,24.6,-1.5]],"mouth":[[0,24.6,-1.5]],"hand_primary":[[-15.5,17.6,0.75]],"physical":[[-15.5,17.6,0.75]],"eye":[[2.5,26.3,-3.6],[-2.5,26.3,-3.6]],"face":[[0,26.45,-8.25]],"hand_secondary":[[15.5,17.6,0.75]]},"garchomp":{"root":[[0,0,1]],"middle":[[0,25,0]],"top":[[0,43,0]],"target":[[0,25,-9]],"special":[[0,40.1,-2.8]],"mouth":[[0,40.1,-2.8]],"hand_primary":[[-28.2,30.5,0]],"physical":[[-28.2,30.5,0]],"eye":[[2.2,41.1,-5.9],[-2.2,41.1,-5.9]],"face":[[0,40.95,-8.65]],"hand_secondary":[[28.2,30.5,0]]},"munchlax":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,22,0]],"target":[[0,9,-6]],"special":[[0,11.5,-3.5]],"mouth":[[0,11.5,-3.5]],"hand_primary":[[-9.5,8.1,-0.25]],"physical":[[-9.5,8.1,-0.25]],"eye":[[-1.5,14,-4],[1.5,14,-4]],"face":[[0,14,-4]],"hand_secondary":[[9.5,8.1,-0.25]]},"riolu":{"root":[[0,0,0]],"middle":[[0,14,0]],"top":[[0,26,0]],"target":[[0,14,-5.5]],"special":[[-9,15.8,-0.3]],"mouth":[[0,17.25,-4.3]],"hand_primary":[[-9,15.8,-0.3]],"physical":[[-9,15.8,-0.3]],"eye":[[2,20.78,-3.8],[-2,20.78,-3.8]],"face":[[0,20.65,-4.3]],"hand_secondary":[[9,15.8,-0.3]]},"lucario":{"root":[[0,0,0]],"middle":[[0,28.5,0]],"top":[[0,46.5,0]],"target":[[0,28,-7]],"special":[[-17.85,29.45,-0.9]],"mouth":[[0,36.2,-5]],"hand_primary":[[-17.85,30.95,-0.9]],"physical":[[-17.85,30.95,-0.9]],"eye":[[2.5,39.7,-5],[-2.5,39.7,-5]],"face":[[0,39.2,-5]],"hand_secondary":[[17.85,30.95,-0.9]]},"hippopotas":{"eye":[[1,17.6,-6.25],[-1,17.6,-6.25]]},"hippowdon":{"eye":[[14,25.5,-26.5],[-14,25.5,-26.5]]},"skorupi":{"eye":[[2.6,8.25,-11.1],[-2.6,8.25,-11.1]]},"drapion":{"eye":[[4.3,12.5,-39.4],[-4.3,12.5,-39.4]]},"croagunk":{"eye":[[3.75,21.25,-3.5],[-3.75,21.25,-3.5]]},"toxicroak":{"eye":[[4.95,34.5,-3.7],[-4.95,34.5,-3.7]]},"carnivine":{"eye":[[5.5,33,-9],[-5.5,33,-9]]},"finneon":{"eye":[[-1.5,3,-2.65],[1.5,3,-2.65]]},"lumineon":{"eye":[[-4,6,-8],[4,6,-8]]},"mantyke":{"eye":[[-3.5,3.5,-7],[3.5,3.5,-7]]},"snover":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,23,0]],"target":[[0,10,-8]],"special":[[0,10.5,-7]],"hand_primary":[[-16.5,11.5,0]],"physical":[[-16.5,11.5,0]],"eye":[[-2.4,12.7,-5.5],[2.4,12.7,-5.5]],"face":[[0,12,-5.5]],"hand_secondary":[[16.5,11.5,0]]},"abomasnow":{"root":[[0,0,0]],"middle":[[0,24,0]],"top":[[0,40,0]],"target":[[0,24,-14]],"special":[[0,31,-8.5]],"mouth":[[0,31,-8.5]],"hand_primary":[[-33.5,26.5,0.5]],"physical":[[-33.5,26.5,0.5]],"eye":[[-3.15,36.25,-8.5],[3.15,36.25,-8.5]],"face":[[0,36,-8.5]],"hand_secondary":[[33.5,26.5,0.5]]},"weavile":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,28,0]],"target":[[0,11,-6]],"special":[[-10.9,13.8,0]],"mouth":[[0,15.7,-4]],"hand_primary":[[-10.9,13.8,0]],"physical":[[-10.9,13.8,0]],"eye":[[-2,18.3,-4],[2,18.3,-4]],"face":[[0,18.3,-4]],"hand_secondary":[[10.9,13.8,0]]},"magnezone":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,27.5,0]],"target":[[0,10,-18]],"special":[[0,13.5,-11.5],[13.5,8,-19],[-13.5,8,-19]],"physical":[[0,10,-15]],"eye":[[0,13.5,-11.5],[15.5,12.1,-4.5],[-15.5,12.1,-4.5]],"face":[[0,10,-15]]},"lickilicky":{"root":[[0,0,0]],"middle":[[0,21,0]],"top":[[0,47,0]],"target":[[0,21,-13.5]],"special":[[0,30.5,-6]],"mouth":[[0,30.5,-6]],"hand_primary":[[-22.5,23.5,-1]],"physical":[[-22.5,23.5,-1]],"eye":[[4.5,34,-6],[-4.5,34,-6]],"face":[[0,34,-6]],"hand_secondary":[[22.5,23.5,-1]]},"rhyperior":{"eye":[[8,40.7,-10.5],[-8,40.7,-10.5]]},"tangrowth":{"eye":[[1,12.5,-4.5],[-1,12.5,-4.5]]},"electivire":{"eye":[[3.4,32.9,-8.25],[-3.4,32.9,-8.25]]},"magmortar":{"root":[[0,0,0]],"middle":[[0,25,0]],"top":[[0,46,0]],"target":[[0,25,-10]],"special":[[-33.5,30.5,-1]],"mouth":[[0,30,-7]],"hand_primary":[[-33.5,30.5,-1]],"physical":[[-33.5,30.5,-1]],"eye":[[-2.7,33.2,-8.5],[2.7,33.2,-8.5]],"face":[[0,33,-8.5]],"hand_secondary":[[33.5,30.5,-1]]},"togekiss":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,28,0]],"target":[[0,12,-17]],"special":[[-34,13.5,1.5],[0,10.5,-16]],"mouth":[[0,10.5,-16]],"hand_primary":[[-34,13.5,1.5]],"physical":[[0,11.75,-16]],"eye":[[3,13.45,-16],[-3,13.45,-16]],"face":[[0,11.75,-16]],"hand_secondary":[[34,13.5,1.5]]},"yanmega":{"root":[[0,0,0]],"middle":[[0,11,-0.75]],"top":[[0,14.8,0]],"target":[[0,8,-18.5]],"mouth":[[0,8.25,-16]],"face":[[0,10.5,-17.5]]},"leafeon":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,23,0]],"target":[[0,11,-13]],"special":[[0,14.75,-11]],"mouth":[[0,14.75,-11]],"physical":[[0,14.75,-11]],"eye":[[-2.15,17.95,-10.9],[2.15,17.95,-10.9]],"face":[[0,17.6,-10.9]]},"glaceon":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,22.5,0]],"target":[[0,11,-13]],"special":[[0,14.75,-11.2]],"mouth":[[0,14.75,-11.2]],"physical":[[0,14.75,-11.2]],"eye":[[-2.15,17.6,-11],[2.15,17.6,-11]],"face":[[0,17.6,-11]]},"gliscor":{"eye":[[2.25,21,-6.25],[-2.25,21,-6.25]]},"mamoswine":{"root":[[0,0,0]],"middle":[[0,33.5,0]],"top":[[0,56.75,0]],"target":[[0,24.5,-37]],"special":[[0,25.08,-31.13]],"mouth":[[0,25.08,-31.13]],"physical":[[-13.5,18.79,-78.01],[13.5,18.79,-78.01]],"eye":[[9.5,44.25,-29.15],[-9.5,44.25,-29.15]],"face":[[0,43.5,-28.75]]},"porygonz":{"root":[[0,0,0]],"middle":[[0,15.4,0]],"top":[[0,36.7,0]],"target":[[0,15.5,-5]],"special":[[0,24.55,-9.5]],"hand_primary":[[-13.6,17.95,-0.5]],"physical":[[0,24.55,-9.5]],"eye":[[4,25.5,-1.47],[-4,25.5,-1.47]],"face":[[0,25.5,-8.5]],"hand_secondary":[[13.6,17.95,-0.5]]},"gallade":{"eye":[[2,31.5,-1.7],[-2,31.5,-1.7]]},"probopass":{"eye":[[-3.5,21.4,-4.9],[3.5,21.4,-4.9]]},"dusknoir":{"root":[[0,0,0]],"middle":[[0,20,0]],"top":[[0,48,0]],"target":[[0,22,-13]],"special":[[-45.5,28,0]],"mouth":[[0,19,-2]],"hand_primary":[[-45.5,28,0]],"physical":[[-45.5,28,0]],"eye":[[0,34.5,-9.5]],"face":[[0,34.5,-9.5]],"hand_secondary":[[45.5,28,0]]},"froslass":{"eye":[[2.5,22.5,-4],[-2.5,22.5,-4]]},"rotom":{"eye":[[2,11.5,-3.5],[-2,11.5,-3.5]]},"regigigas":{"eye":[[0,87.5,-22],[0,101.5,-22],[5,94.5,-22],[-4.5,94.5,-22],[0,78.25,-22],[0,68.5,-22],[0,58.5,-22]]},"snivy":{"root":[[0,0,0]],"middle":[[0,11,-0.25]],"top":[[0,22.5,0]],"target":[[0,10,-8]],"special":[[-30.5,7.75,-13]],"mouth":[[0,1.1,-15.6]],"physical":[[-30.5,7.75,-13]],"eye":[[3.5,4.25,-18],[-3.5,4.25,-18]],"face":[[0,-4.5,-18.25]]},"servine":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,30,0]],"target":[[0,14,-10]],"special":[[-31,9.75,-15.75]],"physical":[[-31,9.75,-15.75]],"eye":[[3,3.5,-19],[-3,3.5,-19]],"face":[[0,-2,-19]]},"serperior":{"eye":[[3,35.6,-3.75],[-3,35.6,-3.75]]},"tepig":{"root":[[0,0,0]],"middle":[[0,5.75,0]],"top":[[0,19.25,0]],"target":[[0,4,-14]],"special":[[0,4,-9.75]],"mouth":[[0,4,-9.75]],"physical":[[0,12,-9]],"eye":[[2.7,7.4,-10.75],[-2.7,7.4,-10.75]],"face":[[0,7.6,-12.7]]},"pignite":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,24,0]],"target":[[0,14,-8]],"special":[[0,18,-4.5]],"mouth":[[0,18,-4.5]],"hand_primary":[[-15,15,0.75]],"physical":[[-15,15,0.75]],"eye":[[2.9,20.7,-4.6],[-2.9,20.7,-4.6]],"face":[[0,21,-5.6]],"hand_secondary":[[15,15,0.75]]},"emboar":{"root":[[0,0,0]],"middle":[[0,19,0]],"top":[[0,40,0]],"target":[[0,22,-11]],"special":[[0,30.75,-4.75]],"mouth":[[0,30.75,-4.75]],"hand_primary":[[-33,27.75,0]],"physical":[[-33,27.75,0]],"eye":[[2.35,33.5,-4.5],[-2.35,33.5,-4.5]],"face":[[0,33.25,-5.5]],"hand_secondary":[[33,27.75,0]]},"oshawott":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,22.5,0]],"target":[[0,9.25,-8]],"special":[[-12,8.75,-0.45]],"hand_primary":[[-7.5,8.5,-0.5]],"physical":[[-12,8.75,-0.45]],"eye":[[-3.75,15.5,-5.5],[3.75,15.5,-5.5]],"face":[[0,14.75,-6.5]],"hand_secondary":[[7.5,8.5,-0.5]]},"dewott":{"root":[[0,0,0]],"middle":[[0,15,0]],"top":[[0,30.5,0]],"target":[[0,16,-6]],"special":[[-16,16.75,-0.25],[16,16.75,-0.25]],"mouth":[[0,20.5,-4.75]],"hand_primary":[[-10.5,16.75,0]],"physical":[[-16,16.75,-0.25],[16,16.75,-0.25]],"eye":[[-3,24,-4.75],[3,24,-4.75]],"face":[[0,23.75,-5.5]],"hand_secondary":[[10.5,16.75,0]]},"samurott":{"eye":[[-2.3,35.1,-13.7],[2.3,35.1,-13.7]]},"patrat":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,22.5,0]],"target":[[0,10,-5.5]],"special":[[0,18,-4]],"mouth":[[0,14,-4.5]],"hand_primary":[[-12,12.25,0]],"physical":[[0,14,-6]],"eye":[[2.5,17.75,-4.02],[-2.5,17.75,-4.02]],"face":[[0,17,-5.35]],"hand_secondary":[[12,12.25,0]]},"watchog":{"root":[[0,0,0]],"middle":[[0,20,0]],"top":[[0,40.5,0]],"target":[[0,20,-6.5]],"special":[[0,19.25,-4.5]],"mouth":[[0,31.25,-4.75]],"hand_primary":[[-18,23.25,0]],"physical":[[-18,23.25,0]],"eye":[[2,35.25,-4.5],[-2,35.25,-4.5]],"face":[[0,34.35,-5.75]],"hand_secondary":[[18,23.25,0]]},"lillipup":{"root":[[0,0,0]],"middle":[[0,9,0]],"top":[[0,20,0]],"target":[[0,8,-10]],"special":[[0,8.1,-7.7]],"mouth":[[0,8.1,-7.7]],"physical":[[0,8.1,-7.7]],"eye":[[-2.5,12.25,-7.3],[2.5,12.25,-7.3]],"face":[[0,11.3,-7.3]]},"herdier":{"root":[[0,0,0]],"middle":[[0,14,0]],"top":[[0,30,0]],"target":[[0,14,-13]],"special":[[0,15.7,-12.3]],"mouth":[[0,15.7,-12.3]],"physical":[[0,15.7,-12.3]],"eye":[[-2.2,19.85,-9.3],[2.2,19.85,-9.3]],"face":[[0,19.5,-12.3]]},"stoutland":{"root":[[0,0,0]],"middle":[[0,17,0]],"top":[[0,34,0]],"target":[[0,16,-19]],"special":[[0,19.7,-18]],"mouth":[[0,19.7,-18]],"physical":[[0,19.7,-18]],"eye":[[3,24.35,-16.2],[-3,24.35,-16.2]],"face":[[0,24.3,-17.7]]},"purrloin":{"eye":[[-2.4,21,-4],[2.4,21,-4]]},"liepard":{"eye":[[-2.9,32.7,-17.4],[2.9,32.7,-17.4]]},"pansage":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,26,0]],"target":[[0,11,-7]],"special":[[0,12.6,-4]],"mouth":[[0,12.6,-4]],"hand_primary":[[-11,10.75,0]],"physical":[[-11,10.75,0]],"eye":[[2.5,15.75,-4],[-2.5,15.75,-4]],"face":[[0,14.7,-4]],"hand_secondary":[[11,10.75,0]]},"simisage":{"root":[[0,0,0]],"middle":[[0,17,0]],"top":[[0,44,0]],"target":[[0,17,-7]],"special":[[0,20.6,-4]],"mouth":[[0,20.6,-4]],"hand_primary":[[-15.5,18.5,0]],"physical":[[-15.5,18.5,0]],"eye":[[2.8,24,-4],[-2.8,24,-4]],"face":[[0,23.5,-4]],"hand_secondary":[[-15.5,18.5,0]]},"pansear":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,24,0]],"target":[[0,11,-7]],"special":[[0,12.2,-4]],"mouth":[[0,12.2,-4]],"hand_primary":[[-11,10.35,0]],"physical":[[-11,10.35,0]],"eye":[[2.5,15.35,-4],[-2.5,15.35,-4]],"face":[[0,14.3,-4]],"hand_secondary":[[11,10.35,0]]},"simisear":{"root":[[0,0,0]],"middle":[[0,17,0]],"top":[[0,34,0]],"target":[[0,17,-7]],"special":[[0,21.1,-4]],"mouth":[[0,21.1,-4]],"hand_primary":[[-16,18.5,0]],"physical":[[-16,18.5,0]],"eye":[[2.75,24.25,-4],[-2.75,24.25,-4]],"face":[[0,24,-4]],"hand_secondary":[[-16,18.5,0]]},"panpour":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,25,0]],"target":[[0,11,-7]],"special":[[0,12.6,-4]],"mouth":[[0,12.6,-4]],"hand_primary":[[-11,10.75,0]],"physical":[[-11,10.75,0]],"eye":[[2.75,15.75,-4],[-2.75,15.75,-4]],"face":[[0,14.7,-4]],"hand_secondary":[[11,10.75,0]]},"simipour":{"root":[[0,0,0]],"middle":[[0,17,0]],"top":[[0,32,0]],"target":[[0,17,-7]],"special":[[0,20.1,-4]],"mouth":[[0,20.1,-4]],"hand_primary":[[-14.5,18.5,0]],"physical":[[-14.5,18.5,0]],"eye":[[3,24.25,-4],[-3,24.25,-4]],"face":[[0,23.5,-4]],"hand_secondary":[[14.5,18.5,0]]},"munna":{"root":[[0,0,0]],"middle":[[0,9,0]],"top":[[0,18,0]],"target":[[0,9,-8]],"special":[[0,3.4,-4]],"mouth":[[0,3.4,-4]],"physical":[[0,11,-7]],"eye":[[4.5,7.3,-4],[-4.5,7.3,-4]],"face":[[0,7,-7]]},"musharna":{"root":[[0,0,0]],"middle":[[0,12,-1]],"top":[[0,30,0]],"target":[[0,11,-19]],"special":[[0,21.9,-8]],"mouth":[[0,21.9,-8]],"hand_primary":[[-6.5,12.2,-12.5]],"physical":[[0,27.5,-10]],"eye":[[5.5,23.5,-3],[-5.5,23.5,-3]],"face":[[0,24.5,-14]],"hand_secondary":[[6.5,12.2,-12.5]]},"pidove":{"root":[[0,0,0]],"middle":[[0,7,0]],"top":[[0,16.5,0]],"target":[[0,7,-6.5]],"special":[[0,11,-5.25]],"mouth":[[0,11,-5.25]],"physical":[[0,11.5,-8]],"eye":[[3,11.7,-5.27],[-3,11.7,-5.27]],"face":[[0,12.4,-6]]},"tranquill":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,23,0]],"target":[[0,11,-7.5]],"special":[[0,15.5,-7]],"mouth":[[0,15.5,-7]],"physical":[[0,15.8,-8.8]],"eye":[[2.5,16.2,-6.7],[-2.5,16.2,-6.7]],"face":[[0,17,-7]]},"unfezant":{"root":[[0,0,2]],"middle":[[0,17,0]],"top":[[0,35,0]],"target":[[0,17,-10.5]],"special":[[0,24.1,-6.75]],"mouth":[[0,24.1,-6.75]],"physical":[[-2.5,0.9,0.3]],"eye":[[3,25,-5.3],[-3,25,-5.3]],"face":[[0,26,-6.75]]},"blitzle":{"root":[[0,0,0]],"middle":[[0,13,0]],"top":[[0,25,0]],"target":[[0,11,-12]],"special":[[0,17.95,-8.7]],"mouth":[[0,17.95,-8.7]],"physical":[[0,17.95,-8.7]],"eye":[[3.05,21.8,-7],[-3.05,21.8,-7]],"face":[[0,21,-10.7]]},"zebstrika":{"root":[[0,0,0]],"middle":[[0,19,0]],"top":[[0,34,0]],"target":[[0,16,-19]],"special":[[0,28.15,-12.1]],"mouth":[[0,28.15,-12.1]],"physical":[[0,28.15,-12.1]],"eye":[[3.05,31.2,-10.7],[-3.05,31.2,-10.7]],"face":[[0,31.2,-16.3]]},"roggenrola":{"root":[[0,0,0]],"middle":[[0,7,0]],"top":[[0,17,0]],"target":[[0,6,-6]],"special":[[0,6,-4]],"physical":[[0,6,-4]],"eye":[[0,6,-4]],"face":[[0,6,-4]]},"boldore":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,21,0]],"target":[[0,10,-10]],"special":[[0,8,-9]],"physical":[[-7,4.25,-11.75]],"eye":[[2,9.75,-5.5],[-2,9.75,-5.5]],"face":[[0,10,-7]]},"gigalith":{"root":[[0,0,0]],"middle":[[0,18,0]],"top":[[0,33,0]],"target":[[0,17,-18]],"special":[[0,23,-8]],"physical":[[-3,0.5,-13]],"eye":[[-2,27,-5],[2,27,-5]],"face":[[0,27,-9]]},"woobat":{"root":[[0,0,0]],"middle":[[0,5,0]],"top":[[0,16,0]],"target":[[0,6,-8]],"special":[[0,2,-5]],"mouth":[[0,2,-5]],"physical":[[0,10,-4]],"eye":[[4.1,5.4,-5],[-4.1,5.4,-5]],"face":[[0,5,-6]]},"swoobat":{"root":[[0,0,0]],"middle":[[0,14,0]],"top":[[0,32,0]],"target":[[0,16,-10]],"special":[[0,14.5,-5]],"mouth":[[0,14.5,-5]],"physical":[[-3,-6.5,-1]],"eye":[[4.1,18.15,-5],[-4.1,18.15,-5]],"face":[[0,18,-6]]},"drilbur":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,18,0]],"target":[[0,8,-6.5]],"special":[[-18.35,9.5,0]],"mouth":[[0,10.7,-4.6]],"hand_primary":[[-13,10,0]],"physical":[[-18.35,9.5,0]],"eye":[[-3.5,14.2,-3],[3.5,14.2,-3]],"face":[[0,15,-11.4]],"hand_secondary":[[13,10,0]]},"excadrill":{"root":[[0,0,0]],"middle":[[0,13,0]],"top":[[0,26,0]],"target":[[0,12,-9.5]],"special":[[-19.35,14.5,-1]],"mouth":[[0,18,-7.6]],"hand_primary":[[-14,15,-1]],"physical":[[-19.35,14.5,-1]],"eye":[[-3,21.1,-10.2],[3,21.1,-10.2]],"face":[[0,20.2,-15.6]],"hand_secondary":[[14,15,-1]]},"audino":{"root":[[0,0,0]],"middle":[[0,15,0]],"top":[[0,30,0]],"target":[[0,16,-8]],"special":[[0,20.8,-5]],"mouth":[[0,20.8,-5]],"hand_primary":[[-12.9,16,0]],"physical":[[-12.9,16,0]],"eye":[[-2.95,23.5,-5],[2.95,23.5,-5]],"face":[[0,23.2,-5]],"hand_secondary":[[12.9,16,0]]},"timburr":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,24,0]],"target":[[0,10,-6]],"special":[[0,13.7,-4.2]],"mouth":[[0,13.7,-4.2]],"hand_primary":[[13.8,11,0]],"physical":[[15.3,7,-13.7]],"eye":[[2.75,17,-4.2],[-2.75,17,-4.2]],"face":[[0,17,-4.2]],"hand_secondary":[[-13.8,11,0]]},"gurdurr":{"root":[[0,0,0]],"middle":[[0,16,0]],"top":[[0,34,0]],"target":[[0,16,-7]],"special":[[0,21.5,-5.2]],"mouth":[[0,21.5,-5.2]],"hand_primary":[[-25.5,16.5,0]],"physical":[[-27,12.5,-27.5]],"eye":[[2.45,25.5,-5.3],[-2.45,25.5,-5.3]],"face":[[0,26,-5.2]],"hand_secondary":[[25.5,16.5,0]]},"conkeldurr":{"root":[[0,0,0]],"middle":[[0,20,0]],"top":[[0,35,0]],"target":[[0,16,-20]],"special":[[0,26.2,-16.5]],"mouth":[[0,26.2,-16.5]],"hand_primary":[[-38.5,24,-1.5]],"physical":[[-45,-6,-1.6]],"eye":[[2.5,29.5,-16.5],[-2.5,29.5,-16.5]],"face":[[0,29.3,-16.5]],"hand_secondary":[[38.5,24,-1.5]]},"tympole":{"root":[[0,0,0]],"middle":[[0,4,0]],"top":[[0,9,0]],"target":[[0,4,-5]],"special":[[0,1,-4]],"mouth":[[0,1,-4]],"physical":[[0,4,16]],"eye":[[2.4,3.9,-4],[-2.4,3.9,-4]],"face":[[0,2.5,-4]]},"palpitoad":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,25,0]],"target":[[0,10,-7.5]],"special":[[0,11,-5.5]],"mouth":[[0,11,-5.5]],"physical":[[0,10.75,-52.25]],"eye":[[3,14.25,-5.5],[-3,14.25,-5.5]],"face":[[0,13.5,-6.25]]},"seismitoad":{"root":[[0,0,0]],"middle":[[0,18,0]],"top":[[0,32,0]],"target":[[0,18,-10]],"special":[[0,36.5,3]],"mouth":[[0,36.5,3]],"hand_primary":[[-26.5,30.25,2.25]],"physical":[[0,37.5,-27]],"eye":[[3.25,39.35,0],[-3.25,39.35,0]],"face":[[0,36,0]],"hand_secondary":[[26.5,30.25,2.25]]},"throh":{"root":[[0,0,0]],"middle":[[0,20,0]],"top":[[0,33,0]],"target":[[0,20,-13]],"special":[[-32,23.5,0]],"mouth":[[0,23,-9]],"hand_primary":[[-32,23.5,0]],"physical":[[-32,23.5,0]],"eye":[[2.5,26.1,-11],[-2.5,26.1,-11]],"face":[[0,26,-11]],"hand_secondary":[[32,23.5,0]]},"sawk":{"root":[[0,0,0]],"middle":[[0,26,0]],"top":[[0,42,0]],"target":[[0,26,-8]],"special":[[-28,32.2,1.2]],"mouth":[[0,34,-4.5]],"hand_primary":[[-28,32.2,1.2]],"physical":[[-28,32.2,1.2]],"eye":[[2.25,37,-7.5],[-2.25,37,-7.5]],"face":[[0,36.5,-7.5]],"hand_secondary":[[28,32.2,1.2]]},"sewaddle":{"root":[[0,0,0]],"middle":[[0,7,0]],"top":[[0,14,0]],"target":[[0,5,-12]],"special":[[0,3.9,-9.4]],"mouth":[[0,3.9,-9.4]],"physical":[[0,9.9,-8.4]],"eye":[[2.75,6.65,-9.4],[-2.75,6.65,-9.4]],"face":[[0,6.4,-9.4]]},"swadloon":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,19.5,0]],"target":[[0,8,-8.75]],"special":[[0,7.1,-6.25]],"mouth":[[0,7.1,-6.25]],"physical":[[0,15,-5.5]],"eye":[[3.5,8.95,-6.25],[-3.5,8.95,-6.25]],"face":[[0,8.6,-6.25]]},"leavanny":{"root":[[0,0,0]],"middle":[[0,25,0]],"top":[[0,44,0]],"target":[[0,25,-6.5]],"special":[[0,31.5,-5.4]],"mouth":[[0,31.5,-5.4]],"hand_primary":[[-17.65,29.5,-0.25]],"physical":[[-17.65,29.5,-0.25]],"eye":[[3,33.75,-5.4],[-3,33.75,-5.4]],"face":[[0,33.8,-5.4]],"hand_secondary":[[17.65,29.5,-0.25]]},"venipede":{"root":[[0,0,0]],"middle":[[0,9,0]],"top":[[0,18,0]],"target":[[0,7,-15]],"special":[[0,13.3,-10.5]],"mouth":[[0,2.3,-12]],"physical":[[0,13.3,-10.5]],"eye":[[4.2,4.7,-10.2],[-4.2,4.7,-10.2]],"face":[[0,8.35,-13.6]]},"whirlipede":{"root":[[0,0,0]],"middle":[[0,13.5,0]],"top":[[0,28,0]],"target":[[0,13,-15]],"special":[[0,20,-11]],"physical":[[0,20,-11]],"eye":[[4.3,12.6,-0.2],[-4.3,12.6,-0.2]],"face":[[0,18.9,-10]]},"scolipede":{"root":[[0,0,0]],"middle":[[0,26,0]],"top":[[0,69.5,0]],"target":[[0,26,-35]],"special":[[0,14.85,-96.5]],"mouth":[[0,14.85,-96.5]],"physical":[[2,42.75,-96],[-2,42.75,-96]],"eye":[[3.5,15.35,-89.3],[-3.5,15.35,-89.3]],"face":[[0,11.25,-91.75]]},"cottonee":{"root":[[0,0,0]],"middle":[[0,6,0]],"top":[[0,14,0]],"target":[[0,5,-7]],"special":[[0,4.8,-6.5]],"hand_primary":[[-12,6.8,-0.5]],"physical":[[0,11.5,-5.2]],"eye":[[2.5,6,-4.5],[-2.5,6,-4.5]],"face":[[0,5.5,-4.5]],"hand_secondary":[[12,6.8,-0.5]]},"whimsicott":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,25,0]],"target":[[0,8,-6]],"special":[[0,8.5,-3]],"mouth":[[0,8.5,-3]],"hand_primary":[[-4.25,5.8,0]],"physical":[[0,16.95,-4.2]],"eye":[[-2,10.6,-3],[2,10.6,-3]],"face":[[0,9.85,-3]],"hand_secondary":[[4.25,5.8,0]]},"petilil":{"root":[[0,0,0]],"middle":[[0,7,0]],"top":[[0,18,0]],"target":[[0,7,-7]],"special":[[0,7,-7]],"hand_primary":[[-5.7,4.5,0]],"physical":[[0,13.8,-5]],"eye":[[2.25,8,-5],[-2.25,8,-5]],"face":[[0,8,-5]],"hand_secondary":[[5.7,4.5,0]]},"lilligant":{"root":[[0,0,0]],"middle":[[0,21,0]],"top":[[0,38,0]],"target":[[0,22,-9]],"special":[[2,41.5,0]],"hand_primary":[[-15.4,23,0]],"physical":[[-15.4,23,0]],"eye":[[2.5,26.5,-4],[-2.5,26.5,-4]],"face":[[0,26,-4]],"hand_secondary":[[15.4,23,0]]},"basculin":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,18,0]],"target":[[0,7.5,-14]],"special":[[0,6,-8.75]],"mouth":[[0,6,-8.75]],"physical":[[0,6,-8.75]],"eye":[[-3.5,9.5,-9.5],[3.5,9.5,-9.5]],"face":[[0,9,-12.3]]},"sandile":{"root":[[0,0,0]],"middle":[[0,6,0]],"top":[[0,12,0]],"target":[[0,7,-12]],"mouth":[[0,5.75,-7.5]],"eye":[[-2.5,8.6,-7],[2.5,8.6,-7]],"face":[[0,8.1,-11]]},"krokorok":{"root":[[0,0,0]],"middle":[[0,13,0]],"top":[[0,30,0]],"target":[[0,17,-10]],"special":[[0,22,-5]],"mouth":[[0,22,-5]],"hand_primary":[[-13.9,17,-0.75]],"physical":[[-13.9,17,-0.75]],"eye":[[-2.5,25.7,-4],[2.5,25.7,-4]],"face":[[0,25.8,-4]],"hand_secondary":[[13.9,17,-0.75]]},"krookodile":{"root":[[0,0,0]],"middle":[[0,24,0]],"top":[[0,44,0]],"target":[[0,25,-11]],"special":[[0,35.2,-9]],"mouth":[[0,35.2,-9]],"hand_primary":[[-22.5,28.75,-0.25]],"physical":[[-22.5,28.75,-0.25]],"eye":[[3.5,40.05,-2.4],[-3.5,40.05,-2.4]],"face":[[0,40,-6]],"hand_secondary":[[22.5,28.75,-0.25]]},"darumaka":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,15.5,0]],"target":[[0,8,-6.5]],"special":[[0,8,-5]],"mouth":[[0,8,-5]],"hand_primary":[[-7.5,8,0]],"physical":[[-7.5,8,0]],"eye":[[2.85,9.75,-5],[-2.85,9.75,-5]],"face":[[0,9.85,-5]],"hand_secondary":[[7.5,8,0]]},"darmanitan":{"root":[[0,0,0]],"middle":[[0,17,0]],"top":[[0,31,0]],"target":[[0,19,-13.5]],"special":[[0,11,-12]],"mouth":[[0,11,-12]],"hand_primary":[[-36,17.5,-5]],"physical":[[-36,17.5,-5]],"eye":[[5,21,-12],[-5,21,-12]],"face":[[0,20,-12]],"hand_secondary":[[36,17.5,-5]]},"maractus":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,25,0]],"target":[[0,10,-6]],"special":[[0,12.2,-4]],"mouth":[[0,12.2,-4]],"hand_primary":[[-10,9.6,0]],"physical":[[-10,9.6,0]],"eye":[[-2.5,14.75,-4],[2.5,14.75,-4]],"face":[[0,14.5,-4]],"hand_secondary":[[10,9.6,0]]},"dwebble":{"root":[[0,0,0]],"middle":[[0,6,0]],"top":[[0,18,0]],"target":[[0,6,-10]],"special":[[0,4.5,-7.2]],"mouth":[[0,4.5,-7.2]],"hand_primary":[[-11.5,1.8,-2]],"physical":[[-11.5,1.8,-2]],"eye":[[1.5,6.5,-8.2],[-1.5,6.5,-8.2]],"face":[[0,6.5,-7.2]],"hand_secondary":[[11.5,1.8,-2]]},"crustle":{"root":[[0,0,0]],"middle":[[0,15,0]],"top":[[0,28,0]],"target":[[0,17,-15]],"special":[[0,3.7,-14]],"mouth":[[0,3.7,-14]],"physical":[[0,20.5,-12.5]],"eye":[[1.5,6,-15.5],[-1.5,6,-15.5]],"face":[[0,6.2,-14]]},"scraggy":{"root":[[0,0,0]],"middle":[[0,9,0]],"top":[[0,20,0]],"target":[[0,9,-6]],"special":[[0,12,-5]],"mouth":[[0,12,-5]],"hand_primary":[[-8.2,9,0]],"physical":[[0,18.5,-5]],"eye":[[-4.5,14.1,-3.4],[4.5,14.1,-3.4]],"face":[[0,14.5,-5]],"hand_secondary":[[8.2,9,0]]},"scrafty":{"root":[[0,0,0]],"middle":[[0,13,0]],"top":[[0,28,0]],"target":[[0,14,-6]],"special":[[0,18.5,-5.5]],"mouth":[[0,18.5,-5.5]],"hand_primary":[[-11,14,0]],"physical":[[0,23.5,-5.5]],"eye":[[5,21,-4.35],[-5,21,-4.35]],"face":[[0,20.5,-5.5]],"hand_secondary":[[11,14,0]]},"sigilyph":{"root":[[0,0,0]],"middle":[[0,20,0]],"top":[[0,36,0]],"target":[[0,21,-7]],"special":[[0,29.8,-2]],"hand_primary":[[7.95,20.5,0],[-7.95,20.5,0]],"physical":[[0,36.2,0]],"eye":[[0,29.8,-2]],"face":[[0,29.7,-2]]},"yamask":{"root":[[0,0,0]],"middle":[[0,9.5,0]],"top":[[0,21,0]],"target":[[0,9.5,-8]],"special":[[0,10.5,-3]],"mouth":[[0,10.5,-3]],"hand_primary":[[-10.85,11.15,0]],"physical":[[-10.85,11.15,0]],"eye":[[-1.5,13,-0.25],[1.5,13,-0.25]],"face":[[0,13.5,-5]],"jaw_lower":[[0,9.5,-3]],"hand_secondary":[[10.85,11.15,0]]},"cofagrigus":{"root":[[0,0,0]],"middle":[[0,28,0]],"top":[[0,54,0]],"target":[[0,30,-12]],"special":[[-61.9,32.5,0]],"mouth":[[0,35.5,-4]],"hand_primary":[[-61.9,32.5,0]],"physical":[[-61.9,32.5,0]],"eye":[[-3,39.4,-4.1],[3,39.4,-4.1]],"face":[[0,39.3,-5]],"jaw_lower":[[0,33.9,-4]],"hand_secondary":[[-61.9,13.5,0],[61.9,32.5,0],[61.9,13.5,0]]},"tirtouga":{"root":[[0,0,0]],"middle":[[0,5,0]],"top":[[0,10,0]],"target":[[0,4,-21]],"special":[[0,2,-16.5]],"mouth":[[0,2,-16.5]],"hand_primary":[[-18,3,-6]],"physical":[[0,2,-16.5]],"eye":[[3,5,-16],[-3,5,-16]],"face":[[0,4.5,-20]],"hand_secondary":[[18,3,-6]]},"carracosta":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,29,0]],"target":[[0,14,-11]],"special":[[0,26,-1]],"mouth":[[0,26,-1]],"hand_primary":[[-25.5,21,0.5]],"physical":[[-25.5,21,0.5]],"eye":[[3,28.5,-2.75],[-3,28.5,-2.75]],"face":[[0,27.5,-6]],"hand_secondary":[[25.5,21,0.5]]},"archen":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,19,0]],"target":[[0,9,-8]],"eye":[[3,15.9,-3.5],[-3,15.9,-3.5]],"face":[[0,15.9,-11.5]]},"archeops":{"root":[[0,0,0]],"middle":[[0,17.5,0]],"top":[[0,34.25,0]],"target":[[0,18,-18]],"special":[[0,19.3,-30.65]],"mouth":[[0,19.5,-26.5]],"hand_primary":[[-34.5,20.75,-9]],"physical":[[0,19.3,-30.65]],"eye":[[4,22,-27.5],[-4,22,-27.5]],"face":[[0,22,-33]],"hand_secondary":[[34.5,20.75,-9]]},"trubbish":{"root":[[0,0,0]],"middle":[[0,7,0]],"top":[[0,20,0]],"target":[[0,7,-9]],"special":[[0,6,-7.5]],"mouth":[[0,6,-7.5]],"hand_primary":[[-19.5,3,0.2]],"physical":[[-19.5,3,0.2]],"eye":[[5,7,-7.5],[-5,7,-7.5]],"face":[[0,6.5,-7.5]],"hand_secondary":[[19.5,3,0.2]]},"garbodor":{"root":[[0,0,0]],"middle":[[0,21,0]],"top":[[0,42,0]],"target":[[0,24,-15]],"special":[[-44,-0.8,0.5]],"mouth":[[0,33,-8]],"hand_primary":[[-47.5,4.2,0.5]],"physical":[[-47.5,4.2,0.5]],"eye":[[6,33.55,-8],[-6,33.55,-8]],"face":[[0,34,-8]],"hand_secondary":[[50.5,24,0.5]]},"zorua":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,18,0]],"target":[[0,8,-11]],"special":[[0,7,-7.3]],"mouth":[[0,7,-7.3]],"physical":[[0,7,-7.3]],"eye":[[-1.75,9.45,-7],[1.75,9.45,-7]],"face":[[0,9.7,-7]]},"zoroark":{"root":[[0,0,0]],"middle":[[0,32,0]],"top":[[0,53,0]],"target":[[0,32,-18]],"special":[[-24.2,36.5,0]],"mouth":[[0,43,-2.5]],"hand_primary":[[-24.2,36.5,0]],"physical":[[-24.2,36.5,0]],"eye":[[-3,45.4,-4.1],[3,45.4,-4.1]],"face":[[0,46.1,-11.2]],"hand_secondary":[[24.2,36.5,0]]},"minccino":{"root":[[0,0,0]],"middle":[[0,7,0]],"top":[[0,20,0]],"target":[[0,6,-6]],"special":[[0,7.7,-4]],"mouth":[[0,7.7,-4]],"hand_primary":[[-5,5.5,0]],"physical":[[-5,5.5,0]],"eye":[[2.55,9.7,-4],[-2.55,9.7,-4]],"face":[[0,8.9,-4]],"hand_secondary":[[5,5.5,0]]},"cinccino":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,22,0]],"target":[[0,7,-6]],"special":[[0,9.5,-4.5]],"mouth":[[0,9.5,-4.5]],"hand_primary":[[-6,7,0]],"physical":[[-6,7,0]],"eye":[[2.85,12,-4.5],[-2.85,12,-4.5]],"face":[[0,11.9,-4.5]],"hand_secondary":[[6,7,0]]},"gothita":{"root":[[0,0,0]],"middle":[[0,6,0]],"top":[[0,14,0]],"target":[[0,6,-4.5]],"special":[[0,9,-5]],"mouth":[[0,5.7,-3]],"hand_primary":[[-3.2,4.25,0]],"physical":[[0,11,-2]],"eye":[[2,8,-3],[-2,8,-3]],"face":[[0,8,-3]],"hand_secondary":[[3.2,4.25,0]]},"gothorita":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,23,0]],"target":[[0,11,-5]],"special":[[0,15,-7]],"mouth":[[0,14.2,-4]],"hand_primary":[[-7.2,12.25,0]],"physical":[[-7.2,12.25,0]],"eye":[[-2.5,16.75,-4],[2.5,16.75,-4]],"face":[[0,16,-4]],"hand_secondary":[[7.2,12.25,0]]},"gothitelle":{"root":[[0,0,0]],"middle":[[0,22,0]],"top":[[0,38,0]],"target":[[0,21,-7]],"special":[[0,27,-9]],"mouth":[[0,27.5,-4.75]],"hand_primary":[[-14.2,25.25,-1]],"physical":[[-14.2,25.25,-1]],"eye":[[-2.5,29.75,-4.75],[2.5,29.75,-4.75]],"face":[[0,30,-4.75]],"hand_secondary":[[14.2,25.25,-1]]},"solosis":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,15,0]],"target":[[0,8,-8]],"special":[[0,8,-7]],"mouth":[[0,7.5,-5]],"physical":[[0,8,-7]],"eye":[[3.45,7.65,-5],[-3.45,7.65,-5]],"face":[[0,8,-7]]},"duosion":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,24.5,0]],"target":[[0,12,-9.5]],"special":[[0,12,-9.5]],"mouth":[[0,14.4,-5]],"hand_primary":[[-2.25,9,-3.5]],"physical":[[0,12,-9.5]],"eye":[[3.25,14.5,-5],[-3.25,14.5,-5]],"face":[[0,14.4,-8.5]],"hand_secondary":[[2.25,9,-3.5]]},"reuniclus":{"root":[[0,0,0]],"middle":[[0,14,0]],"top":[[0,28.25,0]],"target":[[0,14,-10]],"special":[[27,11,-3]],"mouth":[[0,12.5,-6.5]],"hand_primary":[[-27,11,-3]],"physical":[[-27,11,-3]],"eye":[[4.5,14.5,-6.5],[-4.5,14.5,-6.5]],"hand_secondary":[[27,11,-3]]},"ducklett":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,18,0]],"target":[[0,9,-9]],"special":[[0,12.25,-6.5]],"mouth":[[0,12.25,-6.5]],"physical":[[0,13,-8.5]],"eye":[[2.25,14,-5.5],[-2.25,14,-5.5]],"face":[[0,14,-5.5]]},"swanna":{"root":[[0,0,0]],"middle":[[0,17,0]],"top":[[0,40,0]],"target":[[0,16,-10]],"special":[[0,32.25,-13.5]],"mouth":[[0,32.25,-13.5]],"physical":[[0,33.1,-20]],"eye":[[2,33.4,-12],[-2,33.4,-12]],"face":[[0,34,-12]]},"vanillite":{"root":[[0,0,0]],"middle":[[0,6,0]],"top":[[0,16,0]],"target":[[0,5,-6]],"special":[[0,4.55,-4.5]],"mouth":[[0,4.55,-4.5]],"hand_primary":[[-3.25,1.9,0]],"physical":[[0,10.25,-3.5]],"eye":[[1.95,6.75,-4.5],[-1.95,6.75,-4.5]],"face":[[0,6.55,-4.5]],"hand_secondary":[[3.25,1.9,0]]},"vanillish":{"root":[[0,0,0]],"middle":[[0,17,0]],"top":[[0,32,0]],"target":[[0,17,-11]],"special":[[0,19.95,-5]],"mouth":[[0,19.95,-5]],"hand_primary":[[-5,16.5,-9.7]],"physical":[[0,0,0]],"eye":[[1.3,22.5,-5],[-1.3,22.5,-5]],"face":[[0,21.75,-5]],"hand_secondary":[[5,16.5,-9.7]]},"vanilluxe":{"root":[[0,0,0]],"middle":[[0,18,0]],"top":[[0,34,0]],"target":[[0,18,-10]],"special":[[9,36.5,-3.5]],"mouth":[[-5.5,20.8,-5],[5.5,20.8,-5]],"hand_primary":[[-11,17.5,-9.7]],"physical":[[0,0,0]],"eye":[[-4.05,23.75,-5],[-6.95,23.75,-5],[4.05,23.75,-5],[6.95,23.75,-5]],"face":[[-5.5,23.4,-5],[5.5,23.4,-5]],"hand_secondary":[[11,17.5,-9.7]]},"deerling":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,22,0]],"target":[[0,11,-10]],"special":[[0,14,-8.5]],"mouth":[[0,14,-8.5]],"physical":[[0,21,-8.5]],"eye":[[-3,17,-8.5],[3,17,-8.5]],"face":[[0,16.5,-8.5]]},"sawsbuck":{"root":[[0,0,0]],"middle":[[0,22,0]],"top":[[0,40,0]],"target":[[0,22,-22]],"special":[[0,16,-19]],"mouth":[[0,16,-19]],"physical":[[0,22,-32]],"eye":[[2.5,18.75,-21],[-2.5,18.75,-21]],"face":[[0,14.5,-21.75]]},"emolga":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,22,0]],"target":[[0,8,-7]],"special":[[0,8.5,-5]],"mouth":[[0,8.5,-5]],"hand_primary":[[-8.5,6.5,0]],"physical":[[-8.5,6.5,0]],"eye":[[-2.9,11.5,-5],[2.9,11.5,-5]],"face":[[0,11,-5]],"hand_secondary":[[8.5,6.5,0]]},"karrablast":{"root":[[0,0,0]],"middle":[[0,9,0]],"top":[[0,24,0]],"target":[[0,9,-7]],"special":[[0,10.1,-4.5]],"mouth":[[0,10.1,-4.5]],"hand_primary":[[-7.5,10.5,-2]],"physical":[[0,25,0]],"eye":[[2.5,13,-4.5],[-2.5,13,-4.5]],"face":[[0,12.3,-4.5]],"hand_secondary":[[7.5,10.5,-2]]},"escavalier":{"root":[[0,0,0]],"middle":[[0,14,-10]],"top":[[0,40,0]],"target":[[0,2,-23]],"special":[[-13,22.5,-33]],"mouth":[[0,23.5,-9.5]],"physical":[[-13,22.5,-33]],"eye":[[3.5,25.1,-11],[-3.5,25.1,-11]],"face":[[0,24.5,-15]]},"foongus":{"root":[[0,0,0]],"middle":[[0,5,0]],"top":[[0,14,0]],"target":[[0,4,-6]],"special":[[0,3.25,-4]],"mouth":[[0,3.25,-4]],"hand_primary":[[-5,2.5,0]],"physical":[[0,12.5,-6]],"eye":[[1.75,4.25,-3],[-1.75,4.25,-3]],"face":[[0,4.25,-3]],"hand_secondary":[[5,2.5,0]]},"amoonguss":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,22,0]],"target":[[0,9,-7]],"special":[[0,11,-5]],"mouth":[[0,11,-5]],"hand_primary":[[-13,8.2,0.5]],"physical":[[-13,8.2,0.5]],"eye":[[2,13.4,-3.5],[-2,13.4,-3.5]],"face":[[0,12.5,-3.5]],"hand_secondary":[[13,8.2,0.5]]},"frillish":{"root":[[0,0,0]],"middle":[[0,15,0]],"top":[[0,28,0]],"target":[[0,15,-6]],"special":[[0,19.5,-4]],"mouth":[[0,19.5,-4]],"hand_primary":[[-11.75,15,0]],"physical":[[-11.75,15,0]],"eye":[[-2.25,21.5,-4],[2.25,21.5,-4]],"face":[[0,21,-4]],"hand_secondary":[[11.75,15,0]]},"jellicent":{"root":[[0,0,0]],"middle":[[0,33,0]],"top":[[0,40,0]],"target":[[0,25,-20]],"special":[[-18,21,0]],"mouth":[[0,33,-12]],"hand_primary":[[-18,21,0]],"physical":[[-18,21,0]],"eye":[[-3.25,36.75,-12],[3.25,36.75,-12]],"face":[[0,36,-12]],"hand_secondary":[[18,21,0]]},"alomomola":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,28,0]],"target":[[0,12,-10]],"special":[[0,10,-9]],"mouth":[[0,10,-9]],"physical":[[0,13.5,-9]],"eye":[[2.5,13.25,-4],[-2.5,13.25,-4]],"face":[[0,13.5,-9]]},"galvantula":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,15,0]],"target":[[0,7,-14]],"special":[[0,5.5,-16]],"mouth":[[0,5,-8]],"hand_primary":[[-2.5,4.5,-18]],"physical":[[-2.5,4.5,-18]],"eye":[[-1,8.5,-8],[1,8.5,-8],[-1,10.5,-8],[1,10.5,-8],[-4.55,7.55,-7],[4.55,7.55,-7]],"face":[[0,7.5,-8]],"hand_secondary":[[2.5,4.5,-18]]},"ferroseed":{"root":[[0,0,0]],"middle":[[0,7,0]],"top":[[0,16,0]],"target":[[0,6,-8]],"special":[[0,6,-8.5]],"physical":[[0,13,-3.5]],"eye":[[2.5,6,-5.5],[-2.5,6,-5.5]],"face":[[0,6,-5.5]]},"ferrothorn":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,30,0]],"target":[[0,7,-18]],"special":[[0,8,-18]],"physical":[[0,14,-12]],"eye":[[4.5,12.5,-12],[-4.5,12.5,-12]],"face":[[0,12,-12]]},"klink":{"root":[[0,0,0]],"middle":[[0,13,0]],"top":[[0,24,0]],"target":[[0,12.5,-3.5]],"special":[[0,13,0]],"physical":[[0,13,0]],"eye":[[1.4,8.25,-1.1],[-5.6,15.75,-1.1]],"face":[[2.5,10.5,-1]]},"klang":{"root":[[0,0,0]],"middle":[[0,14,0]],"top":[[0,28,0]],"target":[[0,13.5,-4.5]],"special":[[0,13,-3]],"physical":[[0,13,-3]],"eye":[[-9.9,20.85,-1.1]],"face":[[0,14.1,-2.6]]},"klinklang":{"root":[[0,0,0]],"middle":[[0,14,0]],"top":[[0,28,0]],"target":[[0,16.5,-10.5]],"special":[[0,13,-7]],"physical":[[0,13,-7]],"eye":[[-9.9,20.85,-1.1]],"face":[[0,14.1,-2.6]]},"tynamo":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,13,0]],"target":[[0,8,-10]],"special":[[0,8,-8.5]],"mouth":[[0,8,-8.5]],"physical":[[0,10.5,-8.5]],"eye":[[2,8,-6.75],[-2,8,-6.75]],"face":[[0,8,-8.5]]},"eelektrik":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,26,0]],"target":[[0,13,-12]],"special":[[0,8,-23.1]],"mouth":[[0,8,-23.1]],"physical":[[0,11.6,-23]],"eye":[[3.1,8,-18.35],[-3.1,8,-18.35]],"face":[[0,8,-23.1]]},"eelektross":{"root":[[0,0,0]],"middle":[[0,20,0]],"top":[[0,36,0]],"target":[[0,16,-20]],"special":[[0,7.5,-40]],"mouth":[[0,7.5,-40]],"hand_primary":[[-30.55,7,-9]],"physical":[[-30.55,7,-9]],"eye":[[4.5,8.55,-34.55],[-4.5,8.55,-34.55]],"face":[[0,8,-41]],"hand_secondary":[[30.55,7,-9]]},"elgyem":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,24,0]],"target":[[0,9,-6]],"special":[[-7.5,7.25,0]],"hand_primary":[[-7.5,7.25,0]],"physical":[[-7.5,7.25,0]],"eye":[[-1.5,10.75,-3.25],[1.5,10.75,-3.25]],"face":[[0,11.25,-3.25]],"hand_secondary":[[7.5,7.25,0]]},"beheeyem":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,31,0]],"target":[[0,10,-8]],"special":[[-11,11.5,0]],"hand_primary":[[-11,11.5,0]],"physical":[[-11,11.5,0]],"eye":[[2,14.85,-6],[-2,14.85,-6]],"face":[[0,14.85,-6]],"hand_secondary":[[11,11.5,0]]},"litwick":{"root":[[0,0,0]],"middle":[[0,5,0]],"top":[[0,15.5,0]],"target":[[0,4.5,-6]],"special":[[0,13,0]],"hand_primary":[[-5.8,2.5,0]],"physical":[[0,9.5,-4.5]],"eye":[[2.45,4,-3.9],[-2.45,4,-3.9]],"face":[[0,4,-3.9]],"hand_secondary":[[5.8,2.5,0]]},"lampent":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,28,0]],"target":[[0,12,-10]],"special":[[0,7.5,-10]],"hand_primary":[[-23.1,3.5,0]],"physical":[[-23.1,3.5,0]],"eye":[[3.2,7.75,-5],[-3.2,7.75,-5]],"face":[[0,7.75,-5]],"hand_secondary":[[23.1,3.5,0]]},"chandelure":{"root":[[0,0,0]],"middle":[[0,13,0]],"top":[[0,40,0]],"target":[[0,13,-12]],"special":[[0,36,0]],"hand_primary":[[-49,4.25,0]],"physical":[[-49,4.25,0]],"eye":[[6,13,-8.5],[-6,13,-8.5]],"face":[[0,13,-8.5]],"hand_secondary":[[49,4.25,0]]},"axew":{"root":[[0,0,0]],"middle":[[0,5.9,1]],"top":[[0,17,0]],"target":[[0,5.9,1]],"special":[[0,9.65,-1.05]],"mouth":[[0,9.65,-1.05]],"hand_primary":[[-5.5,7.2,-0.25]],"physical":[[4.5,9.65,-2.55],[-4.5,9.65,-2.55]],"eye":[[3,11.75,-3.65],[-3,11.75,-3.65]],"face":[[0,11.65,-5.9]],"hand_secondary":[[5.5,7.2,-0.25]]},"fraxure":{"root":[[0,0,0]],"middle":[[0,17,0]],"top":[[0,32,0]],"target":[[0,17,-9]],"special":[[0,27,-2]],"mouth":[[0,27,-2]],"hand_primary":[[-14.5,22.5,0]],"physical":[[-11.5,26.99,-4.3]],"eye":[[4.5,29,-5.4],[-4.5,29,-5.4]],"face":[[0,29.2,-8.5]],"hand_secondary":[[14.5,22.5,0]]},"haxorus":{"root":[[0,0,0]],"middle":[[0,27,0]],"top":[[0,46,0]],"target":[[0,27.26,-7.51]],"special":[[0,52.56,-1.81]],"mouth":[[0,52.56,-1.81]],"hand_primary":[[-22.85,31.31,1.79]],"physical":[[6.5,53.06,0.69],[-6.5,53.06,0.69]],"eye":[[2.5,54.36,-1.51],[-2.5,54.36,-1.51]],"face":[[0,55.06,-5.21]],"hand_secondary":[[22.85,31.31,1.79]]},"cubchoo":{"eye":[[3.3,12.2,-4],[-3.3,12.2,-4]]},"beartic":{"eye":[[-2.3,32.7,-1.4],[2.3,32.7,-1.4]]},"cryogonal":{"eye":[[6.3,20.7,-0.4],[-6.3,20.7,-0.4]]},"shelmet":{"root":[[0,0,0]],"middle":[[0,7,0]],"top":[[0,17,0]],"target":[[0,6,-12]],"special":[[0,5.9,-10.4]],"mouth":[[0,5.9,-10.4]],"physical":[[0,10.8,-11.8]],"eye":[[3,6,-3.75],[-3,6,-3.75]],"face":[[0,7.2,-5.5]]},"accelgor":{"root":[[0,0,0]],"middle":[[0,14,0]],"top":[[0,28,0]],"target":[[0,14,-8]],"special":[[0,20.4,-7.1]],"mouth":[[0,20.4,-7.1]],"hand_primary":[[-13.5,14.5,-3.5]],"physical":[[-13.5,14.5,-3.5]],"eye":[[2.5,20.5,-7.1],[-2.5,20.5,-7.1]],"face":[[0,22.2,-7.1]],"hand_secondary":[[13.5,14.5,-3.5]]},"stunfisk":{"root":[[0,0,0]],"middle":[[0,2,0]],"top":[[0,6,0]],"target":[[0,3,-6]],"special":[[0,1,10.25]],"mouth":[[0,1,-1]],"hand_primary":[[-11.4,0.5,0]],"physical":[[0,1,10.25]],"eye":[[-3,1,-0.5],[3,1,-0.5]],"face":[[0,1,1]],"hand_secondary":[[11.4,0.5,0]]},"mienfoo":{"root":[[0,0,0]],"middle":[[0,13,0]],"top":[[0,26,0]],"target":[[0,13,-8]],"special":[[-15.3,15.2,0]],"mouth":[[0,17.8,-5]],"hand_primary":[[-15.3,15.2,0]],"physical":[[-15.3,15.2,0]],"eye":[[-2,20,-4],[2,20,-4]],"face":[[0,20,-4]],"hand_secondary":[[15.3,15.2,0]]},"mienshao":{"root":[[0,0,0]],"middle":[[0,22,0]],"top":[[0,36,0]],"target":[[0,21,-10]],"special":[[-17,20.2,0]],"mouth":[[0,29.4,-5.2]],"hand_primary":[[-17,20.2,0]],"physical":[[-17,20.2,0]],"eye":[[-3,32.4,-4.2],[3,32.4,-4.2]],"face":[[0,32.9,-4.2]],"hand_secondary":[[17,20.2,0]]},"druddigon":{"root":[[0,0,0]],"middle":[[0,15,0]],"top":[[0,35,0]],"target":[[0,15,-8]],"special":[[0,33,1]],"mouth":[[0,33,1]],"hand_primary":[[-24,23.2,0.3]],"physical":[[-24,23.2,1.3]],"eye":[[4,34.2,-2],[-4,34.2,-2]],"face":[[0,34.4,-7]],"hand_secondary":[[24,23.2,1.3]]},"golett":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,24,0]],"target":[[0,12,-8]],"special":[[0,12,-8]],"hand_primary":[[-8,8.5,0]],"physical":[[-8,8.5,0]],"eye":[[-1.5,17.75,-3.5],[1.5,17.75,-3.5]],"face":[[0,17.75,-3.5]],"hand_secondary":[[8,8.5,0]]},"golurk":{"root":[[0,0,0]],"middle":[[0,50,0]],"top":[[0,88,0]],"target":[[0,60,-24.5]],"special":[[0,35,0]],"hand_primary":[[-23.5,27.88,0]],"physical":[[-23.5,27.88,0]],"eye":[[2,80,-5],[-2,80,-5]],"face":[[0,80,-5]],"hand_secondary":[[23.5,27.88,0]]},"pawniard":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,21,0]],"target":[[0,10,-7]],"special":[[0,12,-8]],"hand_primary":[[-13,10.75,0]],"physical":[[0,19.5,-8.5]],"eye":[[-2.5,15,-3.5],[2.5,15,-3.5]],"face":[[0,14.5,-3.5]],"hand_secondary":[[13,10.75,0]]},"bisharp":{"root":[[0,0,0]],"middle":[[0,24,0]],"top":[[0,40,0]],"target":[[0,25,-7]],"special":[[0,27,-9]],"mouth":[[0,30.95,-4.05]],"hand_primary":[[-16.5,27.5,0]],"physical":[[-11.5,31.5,0]],"eye":[[2.4,32.8,-4.1],[-2.4,32.8,-4.1]],"face":[[0,32.25,-4.05]],"hand_secondary":[[16.5,27.5,0]]},"bouffalant":{"root":[[0,0,0]],"middle":[[0,19,0]],"top":[[0,39,0]],"target":[[0,19,-30]],"special":[[0,12.5,-23.5]],"mouth":[[0,12.5,-23.5]],"physical":[[20,18.6,-17.5],[-20,18.6,-17.5]],"eye":[[4.02,16.5,-22.8],[-4.02,16.5,-22.8]],"face":[[0,17,-23.6]]},"rufflet":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,22,0]],"target":[[0,7,-9]],"special":[[0,9.5,-6.5]],"mouth":[[0,9.5,-6.5]],"physical":[[0,10,-8.3]],"eye":[[1.9,12.5,-6],[-1.9,12.5,-6]],"face":[[0,13,-6]]},"braviary":{"root":[[0,0,0]],"middle":[[0,22,0]],"top":[[0,42,0]],"target":[[0,22,-14]],"special":[[0,21.8,-22.8]],"mouth":[[0,21.8,-22.8]],"physical":[[-5,0.2,5.3]],"eye":[[1.9,24,-20.75],[-1.9,24,-20.75]],"face":[[0,24.7,-21.25]]},"heatmor":{"root":[[0,0,0]],"middle":[[0,16,0]],"top":[[0,28,0]],"target":[[0,15,-13.5]],"special":[[0,53.5,1.5]],"mouth":[[0,44.5,1.5]],"hand_primary":[[-17,17.5,0]],"physical":[[-17,17.5,0]],"eye":[[2.5,36,1],[-2.5,36,1]],"face":[[0,40.95,3.4]],"hand_secondary":[[17,17.5,0]]},"durant":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,16,0]],"target":[[0,8,-12]],"special":[[0,7.75,-10.5]],"mouth":[[0,7.75,-8.5]],"physical":[[0,7.75,-10.5]],"eye":[[3.25,9.75,-6.5],[-3.25,9.75,-6.5]],"face":[[0,9.75,-8.5]]},"deino":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,25,0]],"target":[[0,12,-13]],"special":[[0,18.3,-7.3]],"mouth":[[0,18.3,-7.3]],"physical":[[0,18.3,-7.3]],"face":[[0,19.9,-11.3]]},"zweilous":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,30,0]],"target":[[0,12,-16]],"special":[[3,20.3,-10.6],[-3,20.3,-10.6]],"mouth":[[3,20.3,-10.6],[-3,20.3,-10.6]],"physical":[[3,20.3,-10.6],[-3,20.3,-10.6]],"face":[[3,21.85,-15.35],[-3,21.85,-15.35]]},"hydreigon":{"eye":[[4.5,48.5,-8.5],[-4.5,48.5,-8.5]]},"larvesta":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,16,0]],"target":[[0,7,-15]],"special":[[0,5.75,-16.45]],"hand_primary":[[-3,2.5,-12]],"physical":[[0,11.25,-16.45]],"eye":[[2.5,7.1,-11.5],[-2.5,7.1,-11.5]],"face":[[0,6.25,-14.45]],"hand_secondary":[[3,2.5,-12]]},"volcarona":{"root":[[0,0,0]],"middle":[[0,22.6,0]],"top":[[0,36.6,0]],"target":[[0,22.6,-8.5]],"special":[[0,29.4,-9]],"hand_primary":[[-4,24.7,-7.1],[-4,21.6,-7.1]],"physical":[[-4.4,43.2,-7]],"eye":[[2.5,32.5,-9.3],[-2.5,32.5,-9.4]],"face":[[0,31,-9.5]],"hand_secondary":[[4.2,24.7,-7.1],[4.2,21.5,-7.1]]},"chespin":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,24,0]],"target":[[0,10,-8]],"special":[[0,10.75,-5.5]],"mouth":[[0,10.75,-5.5]],"hand_primary":[[-8,8,0]],"physical":[[0,19.5,-3.5]],"eye":[[2.85,13.9,-5.5],[-2.85,13.9,-5.5]],"face":[[0,13.5,-5.5]],"hand_secondary":[[8,8,0]]},"quilladin":{"root":[[0,0,0]],"middle":[[0,14,0]],"top":[[0,27,0]],"target":[[0,14,-10]],"special":[[0,15.25,-8]],"mouth":[[0,15.25,-8]],"hand_primary":[[-16,13,-1.5]],"physical":[[-16,13,-1.5]],"eye":[[3.35,19.3,-8],[-3.35,19.3,-8]],"face":[[0,18,-11.5]],"hand_secondary":[[16,13,-1.5]]},"chesnaught":{"root":[[0,0,0]],"middle":[[0,32,0]],"top":[[0,48,0]],"target":[[0,30,-22]],"special":[[0,41.2,-7.6]],"mouth":[[0,41.2,-7.6]],"hand_primary":[[-29,36.5,-1.5]],"physical":[[-29,36.5,-1.5]],"eye":[[2.5,44,-6.5],[-2.5,44,-6.5]],"face":[[0,43,-8]],"hand_secondary":[[29,36.5,-1.5]]},"fennekin":{"root":[[0,0,0]],"middle":[[0,13,0]],"top":[[0,28,0]],"target":[[0,9,-18]],"special":[[0,10.2,-13.5]],"mouth":[[0,10.2,-13.5]],"physical":[[0,20.8,-12.55]],"eye":[[3.3,14.55,-12.55],[-3.3,14.55,-12.55]],"face":[[0,14.5,-12.55]]},"braixen":{"root":[[0,0,0]],"middle":[[0,20,0]],"top":[[0,36,0]],"target":[[0,22,-8]],"special":[[-20,39,0.5]],"mouth":[[0,25.7,-4]],"hand_primary":[[-14,22.25,0]],"physical":[[-20,35,0.5]],"eye":[[2.5,28,-4],[-2.5,28,-4]],"face":[[0,28,-4]],"hand_secondary":[[14,22.25,0]]},"delphox":{"root":[[0,0,0]],"middle":[[0,36,-0.25]],"top":[[0,60,0]],"target":[[0,36,-8]],"special":[[-26,59.25,-1]],"mouth":[[0,46.25,-5.25]],"hand_primary":[[-25.5,38.75,0]],"physical":[[-26,57.75,0]],"eye":[[2.5,49,-5.27],[-2.5,49,-5.27]],"face":[[0,49,-5.25]],"hand_secondary":[[25.5,38.75,0]]},"froakie":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,20,0]],"target":[[0,10,-8]],"special":[[0,15.25,-4.75]],"mouth":[[0,15.25,-4.75]],"hand_primary":[[-10.5,12.5,1.25]],"physical":[[-10.5,12.5,1.25]],"eye":[[3.5,20,-1],[-3.5,20,-1]],"face":[[0,20,-0.6]],"hand_secondary":[[10.5,12.5,1.25]]},"frogadier":{"root":[[0,0,0]],"middle":[[0,20,0]],"top":[[0,34,0]],"target":[[0,20,-7]],"special":[[0,27,-2]],"mouth":[[0,27,-2]],"hand_primary":[[-18,22.75,1]],"physical":[[-18,22.75,1]],"eye":[[4.54,31,-2.46],[-4.54,31,-2.46]],"face":[[0,30.5,-7.5]],"hand_secondary":[[18,22.75,1]]},"greninja":{"root":[[0,0,0]],"middle":[[0,27,0]],"top":[[0,50,0]],"target":[[0,27,-10]],"special":[[-27.5,36,-0.5]],"mouth":[[0,41.5,-4.25]],"hand_primary":[[-27.5,36,-0.5]],"physical":[[-27.5,36,-0.5]],"eye":[[1.4,43.95,-8.15],[-1.4,43.95,-8.15]],"face":[[0,41.9,-9.75]],"hand_secondary":[[27.5,36,-0.5]]},"bunnelby":{"eye":[[1.75,15,-4],[-1.75,15,-4]]},"diggersby":{"eye":[[2.5,29.5,-4.5],[-2.5,29.5,-4.5]]},"fletchling":{"root":[[0,0,0]],"middle":[[0,7,0]],"top":[[0,13,0]],"target":[[0,7,-8]],"special":[[0,7,-3]],"mouth":[[0,7,-3]],"physical":[[0,7.8,-5.5]],"eye":[[1.75,8.25,-2.5],[-1.75,8.25,-2.5]],"face":[[0,8.25,-2.5]]},"fletchinder":{"root":[[0,0,0]],"middle":[[0,13,0]],"top":[[0,22,0]],"target":[[0,13,-15]],"special":[[0,16.5,-11.3]],"mouth":[[0,16.5,-11.3]],"physical":[[0,17.25,-15.45]],"eye":[[-2,17.25,-11],[2,17.25,-11]],"face":[[0,17.8,-10.95]]},"talonflame":{"root":[[0,0,0]],"middle":[[0,17,0]],"top":[[0,28,0]],"target":[[0,17,-14]],"special":[[0,11.7,-14]],"mouth":[[0,11.7,-14]],"physical":[[-3,0.5,1.1]],"eye":[[-2,12.05,-15.5],[2,12.05,-15.5]],"face":[[0,12.1,-15.3]]},"scatterbug":{"eye":[[2.5,-1.5,-6],[-2.5,-1.5,-6]]},"spewpa":{"eye":[[2.5,8,-3],[-2.5,8,-3]]},"vivillon":{"eye":[[-2.5,9.2,-3],[2.5,9.2,-3]]},"litleo":{"eye":[[2.75,15.25,-10],[-2.75,15.25,-10]]},"pyroar":{"eye":[[2.5,37.5,-14],[-2.5,37.5,-14]]},"flabebe":{"eye":[[1,25.25,-2],[-1,25.25,-2]]},"floette":{"eye":[[1.5,45.45,-3],[-1.5,45.45,-3]]},"florges":{"eye":[[1.75,34.2,-2.25],[-1.75,34.2,-2.25]]},"skiddo":{"root":[[0,0,0]],"middle":[[0,13,0]],"top":[[0,22,0]],"target":[[0,12,-15]],"special":[[0,11.6,-11.6]],"mouth":[[0,11.6,-11.6]],"physical":[[0,21.6,-8]],"eye":[[2.6,14.6,-12.5],[-2.6,14.6,-12.5]],"face":[[0,15,-12.5]]},"gogoat":{"root":[[0,0,0]],"middle":[[0,18,0]],"top":[[0,38,0]],"target":[[0,18,-26]],"special":[[0,24,-23.1]],"mouth":[[0,24,-23.1]],"physical":[[0,35.5,-13.5]],"eye":[[3.5,29,-22.5],[-3.5,29,-22.5]],"face":[[0,29,-25.5]]},"pancham":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,22,0]],"target":[[0,8,-6.5]],"special":[[0,9.75,-5]],"mouth":[[0,9.75,-5]],"hand_primary":[[-8,7.5,0]],"physical":[[-8,7.5,0]],"eye":[[2.75,13.3,-5],[-2.75,13.3,-5]],"face":[[0,12.75,-5]],"hand_secondary":[[8,7.5,0]]},"pangoro":{"root":[[0,0,0]],"middle":[[0,24,0]],"top":[[0,40,0]],"target":[[0,26,-10]],"special":[[0,32.5,-6]],"mouth":[[0,32.5,-6]],"hand_primary":[[-26.8,27.3,1]],"physical":[[-26.8,27.3,1]],"eye":[[2.25,34.8,-5.5],[-2.25,34.8,-5.5]],"face":[[0,35,-5.5]],"hand_secondary":[[26.8,27.3,1]]},"furfrou":{"root":[[0,0,0]],"middle":[[0,13,0]],"top":[[0,28,0]],"target":[[0,13,-14]],"special":[[0,16.75,-8.7]],"mouth":[[0,16.75,-8.7]],"physical":[[-2.5,0.2,-6.5]],"eye":[[-2,18.8,-8.5],[2,18.8,-8.5]],"face":[[0,18.7,-10]]},"espurr":{"eye":[[2.5,10,-3.8],[-2.5,10,-3.8]]},"meowstic":{"eye":[[2.6,15.3,-3.55],[-2.6,15.3,-3.55]]},"honedge":{"eye":[[0,21.5,-1.85]]},"doublade":{"eye":[[-25.5,-15,-1.85],[25.5,-15,1.15]]},"aegislash":{"eye":[[0,27.25,-2.5]]},"spritzee":{"eye":[[2.25,5.5,-3.5],[-2.25,5.5,-3.5]]},"aromatisse":{"eye":[[-2.75,16.75,-5],[2.75,16.75,-5]]},"swirlix":{"eye":[[-2.75,10,-5.5],[2.75,10,-5.5]]},"slurpuff":{"eye":[[-3.25,14,-7],[3.25,14,-7]]},"inkay":{"eye":[[-2.15,7.2,-5],[2.15,7.2,-5]]},"malamar":{"eye":[[2.15,31,-4],[-2.15,31,-4]]},"binacle":{"root":[[0,0,0]],"top":[[0,25,0]],"special":[[0,18,-6]],"physical":[[-4.5,27.2,-4.25]],"eye":[[5.75,19.7,-3.75],[3.25,19.7,-3.75],[-5.75,19.7,-3.75],[-3.25,19.7,-3.75]]},"barbaracle":{"root":[[0,0,0]],"top":[[0,48,0]],"special":[[0,30,-13]],"physical":[[-35.5,29,-2]],"eye":[[28.5,28.75,-2],[-28.5,28.75,-2],[11.4,47,-2],[-11.4,47,-2],[1.7,40.1,-2.95],[-1.7,40.1,-2.95]]},"skrelp":{"eye":[[2,17.5,-1.5],[-2,17.5,-1.5]]},"dragalge":{"eye":[[2,29.15,-7.55],[-2,29.15,-7.55]]},"clauncher":{"eye":[[0.35,4.65,-7.5],[3.75,4.65,-4.1]]},"clawitzer":{"eye":[[0.55,4.4,-12.55],[3.8,4.4,-9.3]]},"helioptile":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,22,0]],"target":[[0,7,-11]],"special":[[0,16.5,-6.5]],"mouth":[[0,13.5,-5]],"hand_primary":[[-6.1,9.5,-0.6]],"physical":[[-6.1,9.5,-0.6]],"eye":[[-3,16.5,-5],[3,16.5,-5]],"face":[[0,16.5,-5]],"hand_secondary":[[6.1,9.5,-0.6]]},"heliolisk":{"root":[[0,0,0]],"middle":[[0,17,0]],"top":[[0,32,0]],"target":[[0,17,-7]],"special":[[0,27,-8]],"mouth":[[0,26,-3]],"hand_primary":[[-11.25,16.75,-1.5]],"physical":[[-3.5,0,4]],"eye":[[-3.15,27.5,-3.4],[3.18,27.5,-3.4]],"face":[[0,27,-6.55]],"hand_secondary":[[11.25,16.75,-1.5]]},"tyrunt":{"eye":[[-5.5,15.5,-21.5],[5.5,15.5,-21.5]]},"tyrantrum":{"root":[[0,0,0]],"eye":[[-5.5,40,-74.02],[5.5,40,-74.02]]},"amaura":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,41.75,0]],"target":[[0,15.5,-10]],"special":[[0,31.25,-10.75]],"mouth":[[0,26,-13.25]],"physical":[[0,31.25,-10.75]],"eye":[[-2.5,28.75,-13.25],[2.5,28.75,-13.25]],"face":[[0,28.75,-13.25]]},"aurorus":{"eye":[[-4.5,68.75,-20.52],[4.5,68.75,-20.52]]},"sylveon":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,24,0]],"target":[[0,11,-12]],"special":[[0,15.15,-9.2]],"mouth":[[0,15.15,-9.2]],"physical":[[-27.8,14.15,-6.8]],"eye":[[-2.1,18.58,-9.05],[2.1,18.58,-9.05]],"face":[[0,18,-9.05]]},"hawlucha":{"root":[[0,0,0]],"middle":[[0,17.5,0]],"top":[[0,34.5,0]],"target":[[0,17.5,-9.5]],"special":[[0,22.34,-3.98]],"mouth":[[0,22.34,-3.98]],"hand_primary":[[-19.95,17.89,1.61]],"physical":[[-19.95,17.89,1.61]],"eye":[[4,26.49,-3.18],[-4,26.49,-3.18]],"face":[[0,30.53,-9.94]],"hand_secondary":[[19.95,17.89,1.61]]},"dedenne":{"eye":[[-2.75,11.2,-6],[2.75,11.2,-6]]},"carbink":{"eye":[[2,15.5,-3.5],[-2,15.5,-3.5]]},"goomy":{"eye":[[2,6.5,-5.5],[-2,6.5,-5.5]]},"sliggoo":{"eye":[[2.5,23,-10.5],[-2.5,23,-10.5]]},"goodra":{"eye":[[4,48,-8],[-4,48,-8]]},"klefki":{"eye":[[2.25,20.7,-3.5],[-2.25,20.7,-3.5]]},"phantump":{"eye":[[-1.55,10.15,-4.05],[1.55,10.15,-4.05]]},"trevenant":{"eye":[[0,34.25,-3.5]]},"pumpkaboo":{"eye":[[-1.5,10.25,-2.05],[1.5,10.25,-2.05]]},"gourgeist":{"eye":[[-1,23,-2.05],[1,23,-2.05]]},"bergmite":{"eye":[[3.25,5.75,-7.4],[-3.25,5.75,-7.4]]},"avalugg":{"eye":[[8.1,39.4,-44.61],[-8.1,39.4,-44.61]]},"noibat":{"root":[[0,0,0]],"middle":[[0,7,0]],"top":[[0,21,0]],"target":[[0,7,-4]],"special":[[0,9.15,0.6]],"mouth":[[0,9.15,0.6]],"hand_primary":[[-8,12.25,0.25]],"physical":[[0,9.15,0.6]],"eye":[[-3.5,11.25,-2.75],[3.5,11.25,-2.75]],"face":[[0,11.25,-3.3]],"hand_secondary":[[8,12.25,0.25]]},"noivern":{"root":[[0,0,0]],"middle":[[0,33,0]],"top":[[0,62,0]],"target":[[0,36,-9]],"special":[[0,47.15,-3.1]],"mouth":[[0,47.15,-3.1]],"hand_primary":[[-31,49.75,0.5]],"physical":[[-31,49.75,0.5]],"eye":[[4,50,-6.9],[-4,50,-6.9]],"face":[[0,46.8,-8]],"hand_secondary":[[31,49.75,0.5]]},"xerneas":{"eye":[[3,50,-17.25],[-3,50,-17.25]]},"rowlet":{"eye":[[2.95,12,-6],[-2.95,12,-6]]},"dartrix":{"eye":[[3.7,26.65,-7],[-3.7,26.65,-7]]},"decidueye":{"eye":[[2.6,40,-5.5],[-2.6,40,-5.5]]},"litten":{"eye":[[-2.15,13.45,-8.25],[2.15,13.45,-8.25]]},"torracat":{"eye":[[-2.75,22.25,-13.5],[2.75,22.25,-13.5]]},"incineroar":{"eye":[[-2,43.75,-3.75],[2,43.75,-3.75]]},"popplio":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,14,0]],"target":[[0,10,-5]],"special":[[0,10.5,-4.75]],"mouth":[[0,10.5,-4.75]],"hand_primary":[[-9.5,9,0]],"physical":[[-9.5,9,0]],"eye":[[2.75,13,-4],[-2.75,13,-4]],"face":[[0,13.5,-8.5]],"hand_secondary":[[9.5,9,0]]},"brionne":{"root":[[0,0,0]],"middle":[[0,14,0]],"top":[[0,20,0]],"target":[[0,16,-6]],"special":[[0,19.5,-5.5]],"mouth":[[0,19.5,-5.5]],"hand_primary":[[-17,17.5,0]],"physical":[[-17,17.5,0]],"eye":[[2.85,22.75,-4],[-2.85,22.75,-4]],"face":[[0,23.5,-10.6]],"hand_secondary":[[17,17.5,0]]},"primarina":{"root":[[0,0,0]],"middle":[[0,43,0]],"top":[[0,36,0]],"target":[[0,46,-6]],"special":[[0,54,-4]],"mouth":[[0,54,-4]],"hand_primary":[[-28,49.5,0]],"physical":[[0,-0.75,0.25]],"eye":[[3,56.25,-3.75],[-3,56.25,-3.75]],"face":[[0,55.7,-10.5]],"hand_secondary":[[28,49.5,0]]},"pikipek":{"eye":[[-1.5,6.6,-2.5],[1.5,6.6,-2.5]]},"trumbeak":{"eye":[[2,12.85,-4.75],[-2,12.85,-4.75]]},"toucannon":{"eye":[[3.5,27.45,-6],[-3.5,27.45,-6]]},"yungoos":{"root":[[0,0,0]],"middle":[[0,7.5,0]],"top":[[0,17,0]],"target":[[0,7.5,-22.5]],"special":[[0,2.8,-20.25]],"mouth":[[0,2.8,-20.25]],"physical":[[-8.4,5,-6.7]],"eye":[[2.25,5.25,-20.25],[-2.25,5.25,-20.25]],"face":[[0,5.6,-20.25]]},"gumshoos":{"root":[[0,0,0]],"middle":[[0,15,0]],"top":[[0,32,0]],"target":[[0,13.5,-14]],"special":[[0,4,-26.2]],"mouth":[[0,4,-26.2]],"hand_primary":[[-4.9,-2.7,-9.5]],"physical":[[-4.9,-2.7,-9.5]],"eye":[[2.95,6.9,-26.2],[-2.95,6.9,-26.2]],"face":[[0,6.5,-27.2]],"hand_secondary":[[4.9,-2.7,-9.5]]},"grubbin":{"root":[[0,0,0]],"middle":[[0,3,0]],"top":[[0,6.5,0]],"target":[[0,3,-10]],"special":[[0,2.5,-9.75]],"mouth":[[0,2.5,-4.25]],"hand_primary":[[-2.25,1,-1]],"physical":[[1,2.5,-8.25],[-1,2.5,-8.25]],"eye":[[-3.53,3.25,-2.75],[3.53,3.25,-2.75]],"face":[[0,2.5,-9.75]],"hand_secondary":[[2.25,1,-1]]},"charjabug":{"root":[[0,0,0]],"middle":[[0,4,0]],"top":[[0,8,0]],"target":[[0,4,-6]],"special":[[0,1.25,-7.25]],"mouth":[[0,2.75,-5.45]],"physical":[[2.99,1.5,-6.5],[-2.99,1.5,-6.5]],"eye":[[3,3.75,-5.5],[-3,3.75,-5.5]],"face":[[0,4,-5.5]]},"vikavolt":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,14,0]],"target":[[0,8,-11]],"special":[[0,6,-17.25]],"mouth":[[0,6.5,-8.75]],"hand_primary":[[-2.75,-1.26,-9.05]],"physical":[[2,6,-23.25],[-2,6,-23.25]],"eye":[[-2.5,8.25,-8.75],[2.5,8.25,-8.75]],"face":[[0,8,-8.75]],"hand_secondary":[[2.75,-1.26,-9.05]]},"crabrawler":{"eye":[[1,16.45,-4.5],[-1,16.45,-4.5]]},"crabominable":{"eye":[[3.5,39.45,-13],[-3.5,39.45,-13]]},"cutiefly":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,20,0]],"target":[[0,11,-10]],"special":[[0,11,-10]],"hand_primary":[[-2,0.8,1]],"physical":[[0,11,-10]],"eye":[[2.5,11,-5],[-2.5,11,-5]],"face":[[0,11.3,-5]],"hand_secondary":[[2,0.8,1]]},"ribombee":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,21,0]],"target":[[0,11,-6]],"special":[[0,13.2,-4]],"mouth":[[0,13.2,-4]],"hand_primary":[[-1.5,10.1,5.25]],"physical":[[-1.5,10.1,5.25]],"eye":[[2.5,14.8,-4],[-2.5,14.8,-4]],"face":[[0,15.3,-4]],"hand_secondary":[[-1.5,10.1,5.25]]},"rockruff":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,20,0]],"target":[[0,8,-9.25]],"special":[[0,10.5,-7.75]],"mouth":[[0,10.5,-7.75]],"physical":[[-2.25,0.5,-3.5]],"eye":[[2.35,13,-5.75],[-2.35,13,-5.75]],"face":[[0,12.75,-7.75]]},"lycanroc":{"root":[[0,0,0]],"middle":[[0,14,0]],"top":[[0,28,0]],"target":[[0,12,-20]],"special":[[0,14.5,-18]],"mouth":[[0,14.5,-18]],"physical":[[-3.25,0.5,-7.5]],"eye":[[-2.3,17.3,-18],[2.3,17.3,-18]],"face":[[0,17.2,-21.2]]},"wishiwashi":{"eye":[[-18.15,30.25,-32.35],[18.15,30.05,-31.05]]},"mareanie":{"eye":[[2.5,10.7,-3.5],[-2.5,10.7,-3.5]]},"toxapex":{"eye":[[1,12.25,-2.5],[-1,12.25,-2.5]]},"mudbray":{"eye":[[3,16.2,-7],[-3,16.2,-7]]},"mudsdale":{"root":[[0,0,0]],"middle":[[0,24.5,0]],"top":[[0,41,0]],"target":[[0,20,-23.75]],"special":[[0,36,-10.25],[-4,2,10.77]],"mouth":[[0,36,-10.25]],"physical":[[4,2,10.77],[-4,2,10.77]],"eye":[[3.5,41.25,-14.25],[-3.5,41.25,-14.25]],"face":[[0,39,-17]]},"dewpider":{"eye":[[-2.75,9.65,-4],[2.75,9.65,-4]]},"araquanid":{"eye":[[8.75,26.35,-29],[-8.75,26.35,-29]]},"fomantis":{"eye":[[2,7.75,-3.5],[-2,7.75,-3.5]]},"lurantis":{"eye":[[2.25,20.45,-3.5],[-2.25,20.45,-3.5]]},"morelull":{"eye":[[1,4.5,-2],[-1,4.5,-2]]},"shiinotic":{"eye":[[1.25,12.75,-2],[-1.25,12.75,-2]]},"salandit":{"eye":[[2.5,4,-13.25],[-2.5,4,-13.25]]},"salazzle":{"eye":[[2.5,33.5,-3],[-2.5,33.5,-3]]},"stufful":{"eye":[[-2.2,10.5,-9.5],[2.2,10.5,-9.5]]},"bewear":{"eye":[[-3.15,40,-8],[3.15,40,-8]]},"bounsweet":{"eye":[[-1.75,5.75,-3.5],[1.75,5.75,-3.5]]},"steenee":{"eye":[[-2.1,17.5,-3],[2.1,17.5,-3]]},"tsareena":{"eye":[[-1.75,32.75,-4.5],[1.75,32.75,-4.5]]},"comfey":{"eye":[[1.5,4.5,-4],[-1.5,4.5,-4]]},"wimpod":{"eye":[[3,3.7,-9.55],[-3,3.7,-9.55]]},"golisopod":{"eye":[[3.75,46.95,-27],[-3.75,46.95,-27]]},"sandygast":{"eye":[[1.5,9.8,-6],[-1.5,9.8,-6]]},"palossand":{"eye":[[3,21.7,-5.5],[-3,21.7,-5.5]]},"pyukumuku":{"eye":[[-3.25,3,-6.5],[3.25,3,-6.5]]},"minior":{"root":[[0,0,0]],"middle":[[0,9,0]],"top":[[0,18,0]],"target":[[0,9,-6.5]],"special":[[0,6.25,-5]],"mouth":[[0,6.25,-5]],"physical":[[0,17.25,0]],"face":[[0,8.5,-5]]},"komala":{"eye":[[3.5,12.5,-4.5],[-3.5,12.5,-4.5]]},"turtonator":{"root":[[0,0,0]],"eye":[[-3.75,10,-38.5],[3.75,10,-38.5]]},"mimikyu":{"eye":[[-1.25,2.7,-3],[1.25,2.7,-3]]},"bruxish":{"eye":[[3,9.7,-3.5],[-3,9.7,-3.5]]},"drampa":{"eye":[[3.5,83.7,-17.7],[-3.5,83.7,-17.7]]},"dhelmise":{"eye":[[14,51,-2.2]]},"jangmoo":{"eye":[[4.5,14,-5.5],[-4.5,14,-5.5]]},"hakamoo":{"eye":[[3,29.75,-2],[-3,29.75,-2]]},"kommoo":{"eye":[[-3,53.5,-3.25],[3,53.5,-3.25]]},"poipole":{"eye":[[-2.5,14.25,-3.75],[2.5,14.25,-3.75]]},"naganadel":{"eye":[[-3,60.75,2],[3,60.75,2]]},"grookey":{"eye":[[2.5,12,-4.5],[-2.5,12,-4.5]]},"thwackey":{"eye":[[2.5,21,-4.5],[-2.5,21,-4.5]]},"rillaboom":{"eye":[[2.5,38.5,-6.25],[-2.5,38.5,-6.25]]},"scorbunny":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,28,0]],"target":[[0,9,-7]],"special":[[0,10,-9]],"mouth":[[0,11.1,-5]],"hand_primary":[[-7.9,8,0]],"physical":[[-1.5,0.5,-2.5]],"eye":[[-3.25,13.5,-5],[3.25,13.5,-5]],"face":[[0,13.3,-5]],"hand_secondary":[[7.9,8,0]]},"raboot":{"root":[[0,0,0]],"middle":[[0,14,0]],"top":[[0,30,0]],"target":[[0,14,-7]],"special":[[0,14,-7]],"mouth":[[0,18.7,-3.5]],"hand_primary":[[-12.5,14.3,0]],"physical":[[-2,0.5,-1.5]],"eye":[[-3,21,-3.5],[3,21,-3.5]],"face":[[0,20.3,-3.5]],"hand_secondary":[[12.5,14.3,0]]},"cinderace":{"root":[[0,0,0]],"middle":[[0,32,0]],"top":[[0,56,0]],"target":[[0,32,-11]],"special":[[0,32,-14]],"mouth":[[0,39.7,-6]],"hand_primary":[[-19,34.8,-1]],"physical":[[-3.5,0.5,-4.5]],"eye":[[-2.15,42.3,-6.1],[2.15,42.3,-6.1]],"face":[[0,41.3,-6]],"hand_secondary":[[19,34.8,-1]]},"sobble":{"eye":[[3.5,12.25,-5.5],[-3.5,12.25,-5.5]]},"drizzile":{"eye":[[4,20.5,-7.25],[-4,20.5,-7.25]]},"inteleon":{"eye":[[2.5,42.3,-5.5],[-2.5,42.3,-5.5]]},"skwovet":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,22.5,0]],"target":[[0,11.5,-6.5]],"special":[[0,11.3,-4.3]],"mouth":[[0,11.3,-4.3]],"hand_primary":[[-7.9,8.5,0]],"physical":[[0,1,26]],"eye":[[2.4,14.25,-3.5],[-2.4,14.25,-3.5]],"face":[[0,14.3,-3.5]],"hand_secondary":[[7.9,8.5,0]]},"greedent":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,25.5,0]],"target":[[0,11.5,-6.5]],"special":[[0,14,-4.5]],"mouth":[[0,14,-4.5]],"hand_primary":[[-11.9,10.5,-1.5]],"physical":[[0,-8,32]],"eye":[[-1.75,17.75,-3.5],[1.75,17.75,-3.5]],"face":[[0,17.3,-3.5]],"hand_secondary":[[11.9,10.5,-1.5]]},"rookidee":{"root":[[0,0,0]],"middle":[[0,6,0]],"top":[[0,9.3,0]],"target":[[0,6,-6]],"special":[[0,5.73,-6.75]],"physical":[[-2,0.25,-2]],"eye":[[-2.25,7,-4.75],[2.25,7,-4.75]],"face":[[0,6.75,-5]]},"corvisquire":{"eye":[[2.5,14.4,-6],[-2.5,14.4,-6]]},"corviknight":{"root":[[0,0,0]],"middle":[[0,32,-9]],"top":[[0,67,0]],"target":[[0,33.5,-30.75]],"special":[[0,45.25,-47.25]],"eye":[[4.9,48.15,-35],[-4.9,48.15,-35]],"face":[[0,48.5,-47.25]]},"nickit":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,23,0]],"target":[[0,8,-11.5]],"special":[[0,8.5,25.7]],"mouth":[[0,11.6,-8]],"physical":[[0,11.8,-9.5]],"eye":[[-3,15,-8],[3,15,-8]],"face":[[0,15,-8]]},"thievul":{"root":[[0,0,0]],"middle":[[0,17,0]],"top":[[0,34,0]],"target":[[0,16,-16.5]],"special":[[0,19.7,53.7]],"mouth":[[0,26,-11.8]],"physical":[[0,26.1,-14.5]],"eye":[[-2.5,28.9,-11.8],[2.5,28.9,-11.8]],"face":[[0,28.9,-11.8]]},"gossifleur":{"eye":[[1.75,12.75,-2.5],[-1.75,12.75,-2.5]]},"eldegoss":{"eye":[[2,9.5,-2.5],[-2,9.5,-2.5]]},"wooloo":{"eye":[[-2.5,9.75,-9],[2.5,9.75,-9]]},"dubwool":{"eye":[[2.5,19.25,-7.5],[-2.5,19.25,-7.5]]},"chewtle":{"root":[[0,0,0]],"middle":[[0,9,0]],"top":[[0,20,0]],"target":[[0,9,-13]],"special":[[0,1.2,-8.5]],"mouth":[[0,1.2,-8.5]],"physical":[[0,1.2,-8.5]],"eye":[[-2,-0.75,-11.8],[2,-0.75,-11.8]],"face":[[0,-0.75,-11]]},"drednaw":{"root":[[0,0,0]],"middle":[[0,15,0]],"top":[[0,30,0]],"target":[[0,12,-30]],"special":[[0,8.7,-35]],"mouth":[[0,8.7,-35]],"physical":[[0,8.7,-35]],"eye":[[4,12,-34.5],[-4,12,-34.5]],"face":[[0,11.3,-40.65]]},"yamper":{"eye":[[-2.35,11.05,-7],[2.35,11.05,-7]]},"boltund":{"eye":[[-2.75,23,-9.5],[2.75,23,-9.5]]},"rolycoly":{"root":[[0,0,0]],"middle":[[0,7,0]],"top":[[0,13,0]],"target":[[0,7,-9]],"special":[[0,7,-7]],"physical":[[0,9,-7]],"eye":[[0,7,-7]],"face":[[0,6.8,-7]]},"carkol":{"root":[[0,0,0]],"middle":[[0,13,0]],"top":[[0,26,0]],"target":[[0,11,-12]],"special":[[0,12.8,-7.5]],"mouth":[[0,12.8,-7.5]],"physical":[[0,14.9,-9.5]],"eye":[[-1.4,14.9,-9.6],[1.4,14.9,-9.6]],"face":[[0,14.9,-9.5]]},"coalossal":{"root":[[0,0,0]],"middle":[[0,18,0]],"top":[[0,42,0]],"target":[[0,18,-12]],"special":[[0,21.5,-9]],"mouth":[[0,21.5,-9]],"hand_primary":[[-24,21.5,0]],"physical":[[-24,21.5,0]],"eye":[[1,25.2,-7.9],[-1,25.2,-7.9]],"face":[[0,25.3,-11.4]],"hand_secondary":[[24,21.5,0]]},"applin":{"eye":[[1.25,10.75,0],[-1.25,10.75,0]]},"flapple":{"eye":[[2.5,26,-2.75],[-2.5,26,-2.75]]},"appletun":{"eye":[[5,4.5,-13.75],[-5,4.5,-13.75]]},"silicobra":{"eye":[[3.5,33.3,-8.15],[-3.5,33.3,-8.15]]},"sandaconda":{"eye":[[4,12.9,-6.55],[-4,12.9,-6.55]]},"cramorant":{"eye":[[-2.5,25.5,-1.55],[2.5,25.5,-1.55]]},"arrokuda":{"eye":[[2,2.75,-8.5],[-2,2.75,-8.5]]},"barraskewda":{"eye":[[3,3.75,-9.25],[-3,3.75,-9.25]]},"toxel":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,14.5,0]],"target":[[0,8,-3.5]],"special":[[0,11,-2.5]],"mouth":[[0,11,-2.5]],"hand_primary":[[-7.5,9.1,-0.5]],"physical":[[-7.5,9.1,-0.5]],"eye":[[1.65,12.5,-4.5],[-1.65,12.5,-4.5]],"face":[[0,12.5,-4.7]],"hand_secondary":[[7.5,9.1,-0.5]]},"toxtricity":{"root":[[0,0,0]],"middle":[[0,26,0]],"top":[[0,47.5,0]],"target":[[0,26,-4.5]],"special":[[0,37.6,-2.3]],"mouth":[[0,37.6,-2.3]],"hand_primary":[[-25.2,28.7,0.3]],"physical":[[-25.2,28.7,0.3]],"eye":[[2.4,38.71,-4.94],[-2.4,38.71,-4.94]],"face":[[0,38.45,-7.45]],"hand_secondary":[[25.2,28.7,0.3]]},"sizzlipede":{"eye":[[-1.75,2,-20],[1.75,2,-20]]},"centiskorch":{"eye":[[-3.25,3.75,-48],[3.25,3.75,-48]]},"clobbopus":{"eye":[[-3.5,9.45,-4.5],[3.5,9.45,-4.5]]},"grapploct":{"eye":[[2.75,30,-5],[-2.75,30,-5]]},"sinistea":{"root":[[0,0,0]],"middle":[[0,4,0]],"top":[[0,11,0]],"target":[[0,4,-6]],"special":[[0,12.25,-2.5]],"mouth":[[0,3,-4.5]],"hand_primary":[[-12,5.25,0]],"physical":[[0,16.75,0]],"eye":[[2.45,4.5,-4.5],[-2.45,4.5,-4.5]],"face":[[0,4.3,-4.5]]},"polteageist":{"root":[[0,0,0]],"middle":[[0,6,0]],"top":[[0,26,0]],"target":[[0,10,-9]],"special":[[0,5,-22]],"mouth":[[0,14.3,-2.5]],"hand_primary":[[-5.5,13.5,-4]],"physical":[[0,21.75,-4]],"eye":[[1.25,16,-2.5],[-1.25,16,-2.5],[1.25,6.7,-22],[-1.25,6.7,-22]],"face":[[0,15.3,-2.5]],"hand_secondary":[[5.5,13.5,-4]]},"hattrem":{"eye":[[2.25,10.5,-3.5],[-2.25,10.5,-3.5]]},"hatterene":{"eye":[[-2.4,47.5,-6.5],[2.4,47.5,-6.5]]},"impidimp":{"eye":[[3,16.5,-4],[-3,16.5,-4]]},"morgrem":{"eye":[[3,23.8,-4.5],[-3,23.8,-4.5]]},"grimmsnarl":{"eye":[[0.2,40.4,-6.3],[-0.2,40.4,-6.3]]},"obstagoon":{"eye":[[-2.45,38.6,-29.4],[2.45,38.6,-29.4]]},"perrserker":{"eye":[[2.75,18.5,-4.5],[-2.75,18.5,-4.5]]},"cursola":{"root":[[0,0,0]],"middle":[[0,17,0]],"top":[[0,32,0]],"target":[[0,18,-8]],"special":[[0,22,-10]],"mouth":[[0,20.7,-4.2]],"physical":[[-17.2,21.9,0.3]],"eye":[[1.6,22.4,-4.2],[-1.6,22.4,-4.2]],"face":[[0,22.3,-4.2]]},"sirfetchd":{"eye":[[2.25,14,-2.75],[-2.25,14,-2.75]]},"mrrime":{"eye":[[-2.5,31.25,-6],[2.5,31.25,-6]]},"runerigus":{"root":[[0,0,0]],"middle":[[0,25,0]],"top":[[0,50,0]],"target":[[0,26,-22]],"special":[[0,31,-32]],"hand_primary":[[-39.5,17.5,0]],"physical":[[-39.5,17.5,0]],"eye":[[-1.5,33,-27]],"face":[[0,31,-27]],"hand_secondary":[[40.5,18.5,0]]},"milcery":{"eye":[[-2,2.25,-4],[2,2.25,-4]]},"alcremie":{"eye":[[-2.25,14.65,-3.25],[2.25,14.65,-3.25]]},"falinks":{"root":[[0,0,0]],"middle":[[0,7,0]],"top":[[0,16.5,0]],"target":[[0,6.5,-42]],"special":[[0,7,-42]],"physical":[[0,18.1,-36.3]],"eye":[[2.75,7,-38.5],[-2.75,7,-38.5],[2.5,6,-23.5],[-2.5,6,-23.5],[2.5,6,-10.5],[-2.5,6,-10.5],[2.5,6,2.5],[-2.5,6,2.5],[2.5,6,15.5],[-2.5,6,15.5],[2.5,6,28.5],[-2.5,6,28.5]],"face":[[0,6.8,-38.5]]},"pincurchin":{"eye":[[3.7,3.25,-5],[-3.7,3.25,-5]]},"snom":{"root":[[0,0,0]],"middle":[[0,3.5,0]],"top":[[0,9,0]],"target":[[0,3,-8]],"special":[[0,1.5,-7.25]],"mouth":[[0,1.5,-7.25]],"physical":[[0,5.5,-6.25]],"eye":[[3,1.5,-3.75],[-3,1.5,-3.75]],"face":[[0,3,-6.25]]},"frosmoth":{"root":[[0,0,0]],"middle":[[0,6,0]],"top":[[0,26,0]],"target":[[0,7,-9.5]],"special":[[0,9.5,-8]],"physical":[[0,13.5,-4]],"eye":[[2.25,12.25,-3.5],[-2.25,12.25,-3.5]],"face":[[0,12.5,-4.75]]},"stonjourner":{"eye":[[-3.5,44.3,-6],[2.5,43.8,-6]]},"eiscue":{"eye":[[4,20.1,-7.54],[-4,20.1,-7.54]]},"indeedee":{"root":[[0,0,0]],"middle":[[0,15,0]],"top":[[0,30,0]],"target":[[0,16,-6]],"special":[[0,20.1,-5]],"mouth":[[0,20.1,-5]],"hand_primary":[[-10.5,17.5,0]],"physical":[[-10.5,17.5,0]],"eye":[[-2.7,22,-5],[2.7,22,-5]],"face":[[0,22,-5]],"hand_secondary":[[10.5,17.5,0]]},"morpeko":{"eye":[[3,11.7,-5.5],[-3,11.7,-5.5]]},"cufant":{"eye":[[5,16,-8.5],[-5,16,-8.5]]},"copperajah":{"eye":[[11.5,48.5,-27],[-11.5,48.5,-27]]},"dracozolt":{"eye":[[2.5,47,-5],[-2.5,47,-5]]},"arctozolt":{"eye":[[2.5,60,-4],[-2.5,60,-4]]},"dracovish":{"eye":[[13.5,26.2,92.75],[-13.5,26.2,92.75]]},"arctovish":{"eye":[[13.5,50.25,-5.75],[-13.5,50.25,-5.75]]},"duraludon":{"root":[[0,0,0]],"middle":[[0,20,0]],"top":[[0,37,0]],"target":[[0,22,-8]],"special":[[0,32.49,2.77]],"mouth":[[0,32.49,2.77]],"hand_primary":[[-18.5,20.35,0.75]],"physical":[[-18.5,20.35,0.75]],"eye":[[2.5,34.2,-0.75],[-2.5,34.2,-0.75]],"face":[[0,34,-1.9]],"hand_secondary":[[18.5,20.35,0.75]]},"dreepy":{"eye":[[1.2,8.8,-5.75],[-1.2,8.8,-5.75]]},"drakloak":{"eye":[[2.45,22.2,-8],[-2.45,22.2,-8],[1.2,32.8,0.2],[-1.2,32.8,0.2]]},"dragapult":{"eye":[[17.7,38.3,-11.3],[15.3,38.3,-11.3],[4.6,33.5,-10.5],[-17.7,38.3,-11.3],[-15.3,38.3,-11.3],[-4.6,33.5,-10.5]]},"eternatus":{"root":[[0,0,0]],"top":[[0,92.5,0]],"special":[[0,33.95,-110.9]],"physical":[[17,73.5,-38.5]],"eye":[[-5,42.75,-109.5],[5,42.75,-109.5]]},"zarude":{"eye":[[-2.8,45.3,-11],[2.8,45.3,-11]]},"regieleki":{"eye":[[0,20.5,-8.5],[2.5,20.5,-8.5],[5,22,-8.5],[5,19,-8.5],[-2.5,20.5,-8.5],[-5,22,-8.5],[-5,19,-8.5]]},"regidrago":{"eye":[[0,24,-12],[0,20,-12],[0,16,-12],[4,26,-12],[3,22,-12],[-4,26,-12],[-3,22,-12]]},"wyrdeer":{"eye":[[-2.51,24.74,-8.76],[2.51,24.74,-8.76]]},"kleavor":{"eye":[[2.2,38.4,-7.8],[-2.2,38.4,-7.8]]},"ursaluna":{"root":[[0,0,0]],"middle":[[0,19,0]],"top":[[0,41.5,-3.5]],"target":[[0,19,-38]],"special":[[0,12.4,-35.35]],"mouth":[[0,12.4,-35.35]],"hand_primary":[[-38,19.5,-7]],"physical":[[-38,19.5,-7]],"eye":[[2.6,18.4,-34],[-2.6,18.4,-34]],"face":[[0,16.85,-38]],"hand_secondary":[[38,19.5,-7]]},"basculegion":{"root":[[0,0,0]],"middle":[[0,11,-4]],"top":[[0,36.5,0]],"target":[[0,11,-33]],"special":[[-0.25,8,-26.75]],"mouth":[[-0.25,8,-26.75]],"physical":[[-0.25,8,-26.75]],"eye":[[-4.5,15.5,-28],[4.5,15.5,-28]]},"sneasler":{"root":[[0,0,-0.5]],"middle":[[0,27,-0.5]],"top":[[0,43,-0.5]],"target":[[0,27,-6]],"special":[[-19.8,28.8,0]],"mouth":[[0,33.8,-4.9]],"hand_primary":[[-19.8,28.8,0]],"physical":[[-19.8,28.8,0]],"eye":[[-2.3,36.5,-4.9],[2.3,36.5,-4.9]],"face":[[0,36.5,-4.9]],"hand_secondary":[[19.8,28.8,0]]},"overqwil":{"eye":[[2,22.8,-7],[-2,22.8,-7]]},"sprigatito":{"eye":[[-2,12.5,-6.5],[2,12.5,-6.5]]},"floragato":{"eye":[[-2.1,23.95,-3.75],[2.1,23.95,-3.75]]},"meowscarada":{"eye":[[-1.9,40.25,-5.2],[1.9,40.25,-5.2]]},"fuecoco":{"eye":[[-2.25,14,-3.5],[2.25,14,-3.5]]},"crocalor":{"eye":[[-2.55,31.5,8.1],[2.55,31.5,8.1]]},"skeledirge":{"eye":[[4.45,24.25,-38.05],[-4.45,24.25,-38.05],[-1.45,15.35,-54.3],[1.45,15.35,-54.3]]},"quaxly":{"eye":[[-1.95,14.25,-4.55],[1.95,14.25,-4.55]]},"quaxwell":{"eye":[[-2.45,27.45,-4.35],[2.45,27.45,-4.35]]},"quaquaval":{"eye":[[-1.85,47.75,-6.75],[1.85,47.75,-6.75]]},"lechonk":{"eye":[[-3.05,5.75,-4.5],[3.05,5.75,-4.5]]},"oinkologne":{"eye":[[2.75,16.25,-9],[-2.75,16.25,-9]]},"tarountula":{"eye":[[1.6,15.75,-9],[-1.6,15.75,-9]]},"spidops":{"eye":[[1.6,32.25,-5],[-1.6,32.25,-5]]},"nymble":{"root":[[0,0,0]],"middle":[[0,4.5,0]],"top":[[0,9,0]],"target":[[0,4,-6]],"special":[[0,0.75,-3.7]],"physical":[[0,1.85,-5]],"eye":[[-2,3.85,-3.5],[2,3.85,-3.5]],"face":[[0,0.75,-3.7]]},"lokix":{"root":[[0,0,0]],"middle":[[0,17,0]],"top":[[0,28,0]],"target":[[0,19,-6]],"special":[[0,22.5,-3.3]],"hand_primary":[[-12.1,20,0]],"physical":[[-12.1,20,0]],"eye":[[-1.75,24.5,-2.8],[1.75,24.5,-2.8]],"face":[[0,24.5,-2.8]],"hand_secondary":[[12.1,20,0]]},"tandemaus":{"eye":[[-10.5,6.5,-3],[-5.5,6.5,-3],[10.5,6.5,-3],[5.5,6.5,-3]]},"maushold":{"eye":[[10.5,6.5,-3],[5.5,6.5,-3],[-10.5,6.5,-3],[-5.5,6.5,-3],[2.25,2.75,4.5],[3.75,2.75,4.5],[-2.25,2.75,4.5],[-3.75,2.75,4.5]]},"fidough":{"eye":[[3,14.5,-12.4],[-3,14.5,-12.4]]},"dachsbun":{"eye":[[3,17.7,-18.95],[-3,17.7,-18.95]]},"smoliv":{"root":[[0,0,0]],"middle":[[0,6,0]],"top":[[0,18,0]],"target":[[0,5,-6.5]],"special":[[0,3,-4.5]],"mouth":[[0,3,-4.5]],"physical":[[0,16.6,-2.5]],"eye":[[3.35,4.35,-4.5],[-3.35,4.35,-4.5]],"face":[[0,4.75,-4.5]]},"dolliv":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,28.5,0]],"target":[[0,12,-6.5]],"special":[[-8.5,13,0]],"mouth":[[0,15.5,-4.5]],"hand_primary":[[-8.5,13,0]],"physical":[[-8.5,13,0]],"eye":[[3,17,-4.5],[-3,17,-4.5]],"face":[[0,17.25,-4.5]],"hand_secondary":[[8.5,13,0]]},"arboliva":{"root":[[0,0,0]],"middle":[[0,22,0]],"top":[[0,42,0]],"target":[[0,22,-8]],"special":[[0,29,-5]],"hand_primary":[[-40,25.25,0]],"physical":[[-40,25.25,0]],"eye":[[-1.5,31.5,-2.5],[1.5,31.5,-2.5]],"face":[[0,31.5,-2.5]],"hand_secondary":[[40,25.25,0]]},"squawkabilly":{"eye":[[2.65,12.5,-7.5],[-2.65,12.5,-7.5]]},"nacli":{"root":[[0,0,0]],"middle":[[0,4,0]],"top":[[0,12,0]],"target":[[0,3,-6]],"special":[[0,3,-6]],"physical":[[0,7.2,-4.1]],"eye":[[-1,1.8,-2.5],[1,1.8,-2.5]],"face":[[0,1.5,-2.5]]},"naclstack":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,14,0]],"target":[[0,8,-10]],"special":[[0,8,-10]],"physical":[[0,12.2,-8.85]],"eye":[[-1.1,10.1,-8.85],[1.1,10.1,-8.85]],"face":[[0,9.6,-8.85]]},"garganacl":{"root":[[0,0,0]],"middle":[[0,32,0]],"top":[[0,54,0]],"target":[[0,26,-14]],"special":[[-13.5,5.8,-0.3]],"hand_primary":[[-13.5,5.8,-0.3]],"physical":[[-13.5,5.8,-0.3]],"eye":[[-1,37.55,-2.5],[1,37.55,-2.5]],"face":[[0,37.3,-2.5]],"hand_secondary":[[13.5,5.8,-0.3]]},"charcadet":{"eye":[[3,15.7,-5.45],[-3,15.7,-5.45]]},"armarouge":{"eye":[[2.25,38.85,-3.15],[-2.25,38.85,-3.15]]},"ceruledge":{"eye":[[2.3,39.35,-3.65],[-2.3,39.35,-3.65]]},"tadbulb":{"root":[[0,0,0]],"middle":[[0,14,0]],"top":[[0,21.5,0]],"target":[[0,13,-6.5]],"special":[[0,13.7,-4.5]],"mouth":[[0,13.7,-4.5]],"physical":[[0,21,-3.5]],"eye":[[2.25,15.5,-4.5],[-2.25,15.5,-4.5]],"face":[[0,16.3,-4.5]]},"bellibolt":{"root":[[0,0,0]],"middle":[[0,14,0]],"top":[[0,26,0]],"target":[[0,14,-12]],"special":[[0,9.5,-9.5]],"mouth":[[0,19.2,-6.5]],"hand_primary":[[-7.75,13,-10]],"physical":[[-7.75,13,-10]],"eye":[[2.5,21,-6.5],[-2.5,21,-6.5]],"face":[[0,21,-6.5]],"hand_secondary":[[7.75,13,-10]]},"wattrel":{"eye":[[-2.5,13.4,-4],[2.5,13.4,-4]]},"kilowattrel":{"eye":[[2.5,21,-9.75],[-2.5,21,-9.75]]},"maschiff":{"eye":[[2.25,11.5,-13],[-2.25,11.5,-13]]},"mabosstiff":{"eye":[[-3,27,-26],[3,27,-26]]},"shroodle":{"root":[[0,0,0]],"middle":[[0,4,0]],"top":[[0,10.5,0]],"target":[[0,4.5,-9]],"special":[[0,1,-6.5]],"mouth":[[0,1,-6.5]],"physical":[[0,4,-8]],"eye":[[-2.25,2.75,-4.05],[2.25,2.75,-4.05]],"face":[[0,4,-8]]},"grafaiai":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,22.5,0]],"target":[[0,9.5,-11]],"special":[[-14.9,8.5,0]],"mouth":[[0,11,-5.5]],"hand_primary":[[-14.9,8.5,0]],"physical":[[-14.9,8.5,0]],"eye":[[-4.25,14.5,-5.5],[4.25,14.5,-5.5]],"face":[[0,15.3,-5.5]],"hand_secondary":[[14.9,8.5,0]]},"bramblin":{"eye":[[3,11,-2.5],[-3,11,-2.5]]},"brambleghast":{"eye":[[5,12.5,-3.5],[-5,12.5,-3.5]]},"toedscool":{"root":[[0,0,0]],"middle":[[0,20,0]],"top":[[0,32,0]],"target":[[0,18,-8]],"mouth":[[0,15.7,-4]],"eye":[[-3.5,19.5,-6],[3.5,19.5,-6]],"face":[[0,18.9,-6]]},"toedscruel":{"root":[[0,0,0]],"middle":[[0,30,0]],"top":[[0,50,0]],"target":[[0,20,-16]],"special":[[0,33.7,-17]],"mouth":[[0,33.7,-17]],"hand_primary":[[2.5,1.45,-5.5],[-2.5,1.45,-5.5]],"eye":[[3.5,35.9,-7.5],[-3.5,35.9,-7.5]],"face":[[0,34,-12]]},"klawf":{"eye":[[-10,21.25,-21.75],[10,21.25,-21.75]]},"capsakid":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,18,0]],"target":[[0,7,-8]],"special":[[0,8.6,-4]],"mouth":[[0,8.6,-4]],"hand_primary":[[-6.5,8,0]],"physical":[[0,16,-2.5]],"eye":[[-3,11.25,-4],[3,11.25,-4]],"face":[[0,11.5,-4]],"hand_secondary":[[6.5,8,0]]},"scovillain":{"root":[[0,0,0]],"middle":[[0,22,0]],"top":[[0,36,0]],"target":[[0,23,-13]],"special":[[-1.5,39.7,-2.5]],"mouth":[[-1.5,39.7,-2.5],[1.5,39.7,-2.5]],"hand_primary":[[-14.5,24.25,-0.5]],"physical":[[1.5,39.7,-2.5]],"eye":[[-5.5,47.5,0.5],[2.5,47.5,0.5],[5.5,47.5,0.5],[-2.5,47.5,0.5]],"face":[[-1.5,47.5,2],[1.5,47.5,2]],"hand_secondary":[[14.5,24.25,-0.5]]},"rellor":{"eye":[[1.5,5,-2.5],[-1.5,5,-2.5]]},"rabsca":{"eye":[[-2.1,9.42,-2.52],[2.1,9.42,-2.52],[-1.4,41.69,-2.61],[1.4,41.69,-2.61]]},"flittle":{"eye":[[2.3,8.2,-4],[-2.3,8.2,-4]]},"espathra":{"eye":[[2,21.2,-34.75],[-2,21.2,-34.75]]},"tinkatink":{"root":[[0,0,0]],"middle":[[0,6,0]],"top":[[0,14,0]],"target":[[0,6,-6]],"special":[[0,6,-7]],"mouth":[[0,5.7,-3.75]],"hand_primary":[[-6,3.25,0]],"physical":[[7.5,11.75,-0.5]],"eye":[[2.5,7.7,-3.75],[-2.5,7.7,-3.75]],"face":[[0,7.25,-3.75]],"hand_secondary":[[6,3.25,0]]},"tinkatuff":{"root":[[0,0,0]],"middle":[[0,9,0]],"top":[[0,22,0]],"target":[[0,8,-6]],"special":[[0,8,-8]],"mouth":[[0,9.75,-4]],"hand_primary":[[-8.5,7.45,0]],"physical":[[-16,7,-19]],"eye":[[2.5,12,-4],[-2.5,12,-4]],"face":[[0,11.75,-4]],"hand_secondary":[[8.5,7.45,0]]},"tinkaton":{"root":[[0,0,0]],"middle":[[0,7,0]],"top":[[0,23,0]],"target":[[0,7,-6]],"special":[[0,7,-8],[-10.5,29.5,-34]],"mouth":[[0,10.25,-4.41]],"hand_primary":[[-9.25,8.25,-0.25]],"physical":[[-10.5,29.5,-34]],"eye":[[2.5,12.75,-4.5],[-2.5,12.75,-4.5]],"face":[[0,11.75,-3.5]],"hand_secondary":[[9.25,8.25,-0.25]]},"wiglett":{"eye":[[1.5,38.6,1.25],[-1.5,38.6,1.25]]},"wugtrio":{"eye":[[-4.5,31.5,-10.1],[-7.5,31.5,-10.1],[8.5,23,-10.1],[5.5,23,-10.1],[5,39.5,1.9],[2,39.5,1.9]]},"finizen":{"eye":[[5.5,5.5,-14],[-5.5,5.5,-14]]},"palafin":{"eye":[[4.75,38.2,-5.75],[-4.75,38.2,-5.75]]},"varoom":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,17,0]],"target":[[0,8,-9.5]],"special":[[0,7.75,-8.25]],"mouth":[[0,7.75,-8.25]],"physical":[[0,7.5,-5.5]],"eye":[[3.75,6,1.5],[-3.75,6,1.5]],"face":[[0,7.5,-5.5]]},"revavroom":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,25,0]],"target":[[0,13,-20.5]],"special":[[0,21,-17]],"mouth":[[0,21,-17]],"physical":[[0,17,-19.5]],"eye":[[0,14.5,-19.54]],"face":[[0,12.5,-19.5]]},"cyclizar":{"eye":[[-3.4,21.9,-16],[3.4,21.9,-16]]},"orthworm":{"root":[[0,0,0]],"middle":[[0,4.5,0]],"top":[[0,11,0]],"target":[[0,4.5,-36]],"special":[[0,4,-28.5]],"mouth":[[0,4,-28.5]],"hand_primary":[[10,4,-19.75],[-10,4,-19.75]],"physical":[[10,4,-19.75]],"face":[[0,5,-32.5]],"hand_secondary":[[10,4,-16],[10,4,-13],[-10,4,-16],[-10,4,-13]]},"glimmet":{"root":[[0,0,0]],"middle":[[0,2,0]],"top":[[0,19.5,0]],"target":[[0,11,-12]],"special":[[0,10.95,-8.65]],"physical":[[0,6,19.5]],"eye":[[1,11,-2.45],[-1,11,-2.45]],"face":[[0,11,-8.5]]},"glimmora":{"root":[[0,0,0]],"middle":[[0,15,0]],"top":[[0,46.5,0]],"target":[[0,15,-13]],"special":[[0,14.95,-11.65]],"physical":[[0,-11,-0.5]],"eye":[[1.25,15,-3.45],[-1.25,15,-3.45]],"face":[[0,15,-11.5]]},"greavard":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,18,0]],"target":[[0,7,-13]],"special":[[0,7,-7]],"mouth":[[0,7,-7]],"physical":[[0,7,-7]],"face":[[0,9.5,-11]]},"houndstone":{"root":[[0,0,0]],"middle":[[0,18,0]],"top":[[0,34,0]],"target":[[0,18,-33]],"special":[[0,18,-21]],"mouth":[[0,18,-21]],"physical":[[0,18,-21]],"face":[[0,22.5,-26.75]]},"flamigo":{"eye":[[1.1,18.75,-26.5],[-1.1,18.75,-26.5]]},"cetoddle":{"eye":[[3.2,10.95,-6.5],[-3.2,10.95,-6.5]]},"cetitan":{"eye":[[-16.5,32.95,-23],[16.5,32.95,-23]]},"veluza":{"eye":[[-2.5,7.95,-18],[2.5,7.95,-18]]},"dondozo":{"eye":[[-20,25,-30],[20,25,-30]]},"tatsugiri":{"eye":[[1.3,4.8,-8],[-1.3,4.8,-8]]},"annihilape":{"root":[[0,0,0]],"middle":[[0,15.5,0]],"top":[[0,31,0]],"target":[[0,14.5,-7]],"special":[[-22,15.5,-0.5]],"hand_primary":[[-22,14.5,-0.5]],"physical":[[-22,14.5,-0.5]],"face":[[0,15,-6]],"hand_secondary":[[22,14.5,-0.5]]},"clodsire":{"eye":[[7.5,8.5,-20.5],[-7.5,8.5,-20.5]]},"farigiraf":{"root":[[0,0,0]],"middle":[[0,40,-4]],"top":[[0,91.75,0]],"target":[[0,40,-24]],"special":[[7.5,80.38,-10.68],[-7.5,80.38,-10.68]],"mouth":[[0,73.88,-15.43]],"physical":[[0,85.38,-14.18]],"eye":[[3.5,77.88,-15.43],[-3.5,77.88,-15.43],[7.5,80.38,-10.68],[-7.5,80.38,-10.68]],"face":[[0,75.88,-20.93]]},"dudunsparce":{"root":[[0,0,0]],"middle":[[0,5,0]],"top":[[0,13.5,0]],"target":[[0,5,-41]],"special":[[0,2.5,-40]],"mouth":[[0,2.5,-40]],"physical":[[0,5,50]],"eye":[[8.5,7.5,-34.5],[-8.5,7.5,-34.5]],"face":[[0,6.5,-40]]},"kingambit":{"root":[[0,0,0]],"middle":[[0,22,0]],"top":[[0,52,0]],"target":[[0,24,-10]],"special":[[0,30,-12]],"mouth":[[0,34.2,-5]],"hand_primary":[[-26.2,28.5,0.1]],"physical":[[0,57.4,-7.75]],"eye":[[2.1,37.6,-5],[-2.1,37.6,-5]],"face":[[0,36.5,-5]],"hand_secondary":[[26.2,28.5,0.1]]},"gimmighoul":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,17,0]],"target":[[0,8,-9]],"special":[[0,9,-5]],"hand_primary":[[-6,7.7,0]],"physical":[[0,13,-6]],"eye":[[1.7,11.45,-1.55],[-1.7,11.45,-1.55]],"face":[[0,11.5,-1.5]],"hand_secondary":[[6,7.7,0]]},"gholdengo":{"root":[[0,0,0]],"middle":[[0,19.5,0]],"top":[[0,40,0]],"target":[[0,21,-8]],"special":[[-15.5,21.2,0.2]],"mouth":[[0.6,26.95,-3.05]],"hand_primary":[[-15.5,21.2,0.2]],"physical":[[-15.5,21.2,0.2]],"eye":[[1.6,30.1,-3],[-1.6,30.1,-3]],"face":[[0,29.5,-3]],"hand_secondary":[[15.5,21.2,0.2]]},"walkingwake":{"eye":[[2.5,31.5,-49],[-2.5,31.5,-49]]},"ironleaves":{"eye":[[2.5,32.5,-10.25],[-2.5,32.5,-10.25]]},"dipplin":{"eye":[[1,11.7,-0.5],[-1,11.7,-0.5]]},"poltchageist":{"root":[[0,0,0]],"middle":[[0,4,0]],"top":[[0,19,0]],"target":[[0,4,-6]],"special":[[0,16.5,-2.5]],"mouth":[[0,3.7,-4]],"hand_primary":[[-14,4.5,0]],"physical":[[16,-0.5,-12.5]],"eye":[[2.5,5,-4],[-2.5,5,-4]],"face":[[0,4.8,-4]],"hand_secondary":[[14,4.5,0]]},"sinistcha":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,28,0]],"target":[[0,11,-11]],"special":[[0,1,-8.25]],"mouth":[[0,14.3,-3]],"hand_primary":[[-6,12.75,-6]],"physical":[[0,23.5,-1.9]],"eye":[[1.25,16,-3],[-1.25,16,-3],[1.25,2.75,-8.25],[-1.25,2.75,-8.25]],"face":[[0,15,-3]],"hand_secondary":[[6,12.75,-6]]},"archaludon":{"root":[[0,0,0]],"middle":[[0,18,0]],"top":[[0,42,0]],"target":[[0,22,-14]],"special":[[0,38.24,2.02]],"mouth":[[0,38.24,2.02]],"hand_primary":[[-12.25,19.5,2.6]],"physical":[[-12.25,19.5,2.6]],"eye":[[2.5,42,-2.15],[-2.5,42,-2.15]],"face":[[0,42,-2.7]],"hand_secondary":[[12.25,19.5,2.6]]},"hydrapple":{"eye":[[2,56.75,-0.8],[-2,56.75,-0.8],[4,54.75,-6.8],[8,54.75,-6.8],[-4,54.75,-6.8],[-8,54.75,-6.8],[-4,54.75,5.2],[-8,54.75,5.2],[4,54.75,5.2],[8,54.75,5.2]]}}');
  }
});

// tools/kit/init.ts
var init_exports = {};
__export(init_exports, {
  runInit: () => runInit
});
import archiver from "archiver";
import { randomUUID } from "node:crypto";
import { createWriteStream, existsSync as existsSync9 } from "node:fs";
import { copyFile as copyFile2, mkdir as mkdir5, readdir as readdir8, readFile as readFile11, rm as rm3, writeFile as writeFile7 } from "node:fs/promises";
import path10 from "node:path";
function parseInitArgs(argv) {
  const get = (flag) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : void 0;
  };
  const ns = get("--ns");
  if (!ns || !/^[a-z0-9_]+$/.test(ns) || ["cooblemon", "cobblemon", "minecraft"].includes(ns)) {
    throw new Error("Missing or invalid --ns <namespace> (lowercase letters, digits and _; not cobblemon or minecraft)");
  }
  const name = (get("--name") ?? "example").toLowerCase();
  if (!/^[a-z0-9_]+$/.test(name)) throw new Error("--name must be lowercase letters, digits and _");
  return {
    ns,
    name,
    out: path10.resolve(get("--out") ?? `${ns}-addon`),
    force: argv.includes("--force")
  };
}
async function writeJson4(file, data) {
  await mkdir5(path10.dirname(file), { recursive: true });
  await writeFile7(file, `${JSON.stringify(data, null, 2)}
`, "utf8");
}
function mainScript(ns, name) {
  const id = `${ns}:${name}`;
  const display = titleCase(name);
  return `/**
 * ${display}: an add-on for Cobblemon Bedrock, created with \`kit init\`.
 *
 * It registers one species, ${id}, that spawns in plains. It uses Pikachu's
 * model, animations and battle clips (Cobblemon Bedrock's resource pack has
 * them) until you give it your own: see README.md.
 *
 * Registration is done by the \`cobblemon-bedrock-api\` library, in
 * \`cobblemon-bedrock-api.js\`: this file only holds your data.
 */

import { world } from "@minecraft/server";
import { onCobblemonEvent, registerAddon } from "./cobblemon-bedrock-api.js";
import { BATTLE_CLIPS, LOCATORS } from "./battleData.js";

/** Your namespace: the one of your entities and species. */
const ADDON = ${JSON.stringify(ns)};
/** Bump it together with both manifests on every release. */
const VERSION = "1.0.0";

const SPECIES = [
  {
    // The same id as its entity (BP/entities/${name}.json).
    id: ${JSON.stringify(id)},
    name: ${JSON.stringify(display)},
    // Outside the official numbering: the Pok\xE9dex puts it at the end.
    nationalPokedexNumber: 2000,
    primaryType: "normal",
    secondaryType: null,
    baseStats: { hp: 50, attack: 50, defence: 50, specialAttack: 50, specialDefence: 50, speed: 50 },
    evYield: { hp: 1, attack: 0, defence: 0, specialAttack: 0, specialDefence: 0, speed: 0 },
    catchRate: 190,
    baseExperienceYield: 60,
    experienceGroup: "medium_fast",
    abilities: ["intimidate"],
    hiddenAbility: null,
    maleRatio: 0.5,
    eggGroups: ["field"],
    // Only moves Cobblemon Bedrock's battle engine knows; others are skipped
    // with a warning in the content log.
    moves: {
      levelUp: [
        { level: 1, move: "tackle" },
        { level: 1, move: "growl" },
        { level: 6, move: "quickattack" },
        { level: 12, move: "bite" },
      ],
      egg: [],
      tm: [],
      tutor: [],
    },
    evolutions: [],
    forms: [],
    baseScale: 1,
    hitbox: { width: 0.6, height: 0.8 },
    // Battle animations and model points: Pikachu's, like the model.
    battleClips: BATTLE_CLIPS,
    locators: LOCATORS,
  },
];

const SPAWN = {
  entries: [
    {
      species: ${JSON.stringify(id)},
      // A biome tag, as in Cobblemon's spawn files (\`plains\`, \`forest\`, \`beach\`\u2026).
      biome: "plains",
      habitat: "land",
      light: "surface",
      bucket: "common",
      entryWeight: 10,
    },
  ],
  levels: { ${JSON.stringify(id)}: { min: 3, max: 15 } },
};

registerAddon({ addon: ADDON, version: VERSION, species: SPECIES, spawn: SPAWN });

// An event, to see that it works: Cobblemon Bedrock tells every add-on.
onCobblemonEvent("captured", (e) => {
  if (e.pokemon.species === ${JSON.stringify(id)}) world.sendMessage(\`\${e.player.name} caught a ${display}!\`);
});
`;
}
function readme(ns, name, baseVersion) {
  const id = `${ns}:${name}`;
  return `# ${titleCase(name)} (Cobblemon Bedrock add-on)

Created with \`kit init\`. It works as it is: install \`${ns}.mcaddon\` on a
world with Cobblemon Bedrock ${baseVersion} and \`${id}\` spawns in plains,
looking like Pikachu.

## Files

| File | What it is |
| --- | --- |
| \`BP/manifest.json\` | Depends on Cobblemon Bedrock and on your RP. |
| \`RP/manifest.json\` | Depends on Cobblemon Bedrock's RP and on your BP: enabling either pack enables both. Declares \`pbr\`, or Vibrant Visuals turn off. |
| \`BP/entities/${name}.json\` | The server entity: a full Cobblemon Bedrock Pok\xE9mon. Leave its components alone; change the size with \`minecraft:scale\` and \`minecraft:collision_box\`. |
| \`BP/scripts/main.js\` | Your species, its spawns, and an example event. |
| \`BP/scripts/battleData.js\` | Battle clips and model points (Pikachu's for now). |
| \`BP/scripts/cobblemon-bedrock-api.js\` | The library. Don't edit it; replace it with a newer one. |
| \`RP/entity/${name}.entity.json\` | The client entity: model, textures and animations. |
| \`RP/render_controllers/\` | Normal or shiny texture. |
| \`RP/texts/\` | The name and Pok\xE9dex entry. |

## Making it yours

1. **Model**: put your \`.geo.json\` in \`RP/models/entity/\` and change
   \`geometry.default\` in the client entity to its id. Use your own id
   (\`geometry.${ns}.${name}\`), never one of Cobblemon Bedrock's.
2. **Textures**: put them in \`RP/textures/${ns}/\` and change \`textures\` in
   the client entity (\`default\` and \`shiny\`).
3. **Animations**: put your \`.animation.json\` in \`RP/animations/\` with your
   own ids (\`animation.${ns}_${name}.ground_idle\`\u2026) and point the client
   entity's \`animations\` to them. Update \`battleData.js\` the same way.
4. **Data**: types, stats, moves, abilities, evolutions and forms in
   \`main.js\`. The full list of fields is in the API reference.
5. **Sprites**: without them the UI shows a Pok\xE9 Ball. The kit can render
   them from a Cobblemon Java model (\`npm run kit -- --in \u2026\`).
6. **Name**: in \`RP/texts/*.lang\`.

If you port a Cobblemon Java addon, the kit does all of this for you:
\`npm run kit -- --in <addon> --cobblemon <extracted jar>\`.

## Checklist

- [ ] Same \`ADDON\` in \`main.js\` as the namespace of your entities.
- [ ] Bump the version in **both manifests** and \`VERSION\` on every release:
      the game keeps the old copy if the version doesn't change.
- [ ] \`/scriptevent cooblemon:debug.registry\` lists \`${ns}\` with 0 errors.
- [ ] The content log (Settings \u2192 Creator) shows no errors from your packs.
- [ ] It spawns, can be caught, battles, and shows in the Pok\xE9dex and PC.
- [ ] Without your add-on, the world still loads (its Pok\xE9mon stay saved).
`;
}
async function runInit(argv) {
  const args = parseInitArgs(argv);
  const { ns, name, out } = args;
  if (existsSync9(out) && (await readdir8(out)).length > 0) {
    if (!args.force) throw new Error(`${out} already exists and is not empty (use --force to overwrite it)`);
    await rm3(out, { recursive: true, force: true });
  }
  const id = `${ns}:${name}`;
  const bp = path10.join(out, "BP");
  const rp = path10.join(out, "RP");
  const baseBp = JSON.parse(await readFile11(resolveFromRoot("bp/manifest.json"), "utf8"));
  const baseRp = JSON.parse(await readFile11(resolveFromRoot("rp/manifest.json"), "utf8"));
  const version = [1, 0, 0];
  const engine = [1, 26, 50];
  const bpUuid = randomUUID();
  const rpUuid = randomUUID();
  await writeJson4(path10.join(bp, "manifest.json"), {
    format_version: 2,
    header: { name: titleCase(name), description: "A Cobblemon Bedrock add-on.", uuid: bpUuid, version, min_engine_version: engine },
    modules: [
      { type: "data", uuid: randomUUID(), version },
      { type: "script", language: "javascript", uuid: randomUUID(), version, entry: "scripts/main.js" }
    ],
    dependencies: [
      { uuid: baseBp.header.uuid, version: baseBp.header.version },
      { uuid: rpUuid, version },
      { module_name: "@minecraft/server", version: "2.10.0" }
    ]
  });
  await writeJson4(path10.join(rp, "manifest.json"), {
    format_version: 2,
    capabilities: ["pbr"],
    header: { name: `${titleCase(name)} (resources)`, description: "Models, textures and texts.", uuid: rpUuid, version, min_engine_version: engine },
    modules: [{ type: "resources", uuid: randomUUID(), version }],
    dependencies: [
      { uuid: baseRp.header.uuid, version: baseRp.header.version },
      { uuid: bpUuid, version }
    ]
  });
  const entity = JSON.parse(await readFile11(resolveFromRoot(`bp/entities/${TEMPLATE}.json`), "utf8"));
  const e = entity["minecraft:entity"];
  e.description.identifier = id;
  e.description.is_spawnable = true;
  e.description.is_summonable = true;
  renameFamilies(e, TEMPLATE, `${ns}_${name}`);
  await writeJson4(path10.join(bp, "entities", `${name}.json`), entity);
  const known = new Set(TEMPLATE_CLIPS.map((c) => `${TEMPLATE}.${c}`));
  const roles = rolesFromNames(TEMPLATE, (ref) => known.has(ref));
  const battleClips = BATTLE_CLIPS[TEMPLATE] ?? {};
  await writeJson4(
    path10.join(rp, "entity", `${name}.entity.json`),
    clientEntity(
      id,
      name,
      { default: TEMPLATE_GEOMETRY },
      { default: TEMPLATE_TEXTURE, shiny: `${TEMPLATE_TEXTURE}_shiny` },
      roles,
      (ref) => `animation.${ref}`,
      battleClips,
      null
    )
  );
  await writeJson4(
    path10.join(rp, "render_controllers", `${ns}.${name}.render_controllers.json`),
    renderController(id, { geometry: false, texture: false })
  );
  const display = titleCase(name);
  await mkdir5(path10.join(rp, "texts"), { recursive: true });
  await writeFile7(
    path10.join(rp, "texts", "en_US.lang"),
    [
      `entity.${id}.name=${display}`,
      `item.spawn_egg.entity.${id}.name=${display}`,
      `cooblemon.species.${id}.desc=A Pok\xE9mon made with the Cobblemon Bedrock kit. Change this text in RP/texts.`,
      ""
    ].join("\n"),
    "utf8"
  );
  await writeJson4(path10.join(rp, "texts", "languages.json"), ["en_US"]);
  const apiLib = resolveFromRoot("packages/api/dist/cobblemon-bedrock-api.js");
  if (!existsSync9(apiLib)) throw new Error("Missing packages/api/dist/cobblemon-bedrock-api.js: run npm run api:build first");
  await mkdir5(path10.join(bp, "scripts"), { recursive: true });
  await copyFile2(apiLib, path10.join(bp, "scripts", "cobblemon-bedrock-api.js"));
  await writeFile7(path10.join(bp, "scripts", "main.js"), mainScript(ns, name), "utf8");
  await writeFile7(
    path10.join(bp, "scripts", "battleData.js"),
    [
      "// Battle animations (name \u2192 [animation id, seconds, 1 if it loops]) and model",
      "// points (name \u2192 [x, y, z] in model pixels). Pikachu's, like the model: change",
      "// them when you change the model and its animations.",
      `export const BATTLE_CLIPS = ${JSON.stringify(battleClips, null, 2)};`,
      `export const LOCATORS = ${JSON.stringify(MODEL_LOCATORS[TEMPLATE] ?? {}, null, 2)};`,
      ""
    ].join("\n"),
    "utf8"
  );
  await writeFile7(path10.join(out, "README.md"), readme(ns, name, baseBp.header.version.join(".")), "utf8");
  const pack = path10.join(out, `${ns}.mcaddon`);
  await new Promise((resolve, reject) => {
    const output = createWriteStream(pack);
    const archive = archiver("zip", { zlib: { level: 9 } });
    output.on("close", () => resolve());
    output.on("error", reject);
    archive.on("error", reject);
    archive.pipe(output);
    archive.directory(bp, `${ns}_bp`);
    archive.directory(rp, `${ns}_rp`);
    archive.finalize();
  });
  logStep(`Init: ${id} \u2192 ${out} (install ${pack}; read README.md to make it yours)`);
}
var TEMPLATE, TEMPLATE_CLIPS, TEMPLATE_TEXTURE, TEMPLATE_GEOMETRY, titleCase;
var init_init = __esm({
  "tools/kit/init.ts"() {
    init_battle_anim_generated();
    init_utils();
    init_entity_files();
    TEMPLATE = "pikachu";
    TEMPLATE_CLIPS = ["ground_idle", "ground_walk", "water_idle", "water_swim", "battle_idle", "sleep"];
    TEMPLATE_TEXTURE = "textures/pokemon/0025_pikachu/pikachu";
    TEMPLATE_GEOMETRY = "geometry.pikachu";
    titleCase = (s) => s.replace(/(^|_)([a-z])/g, (_, sep, c) => `${sep ? " " : ""}${c.toUpperCase()}`);
    if (process.argv[1] && /init\.(ts|mjs)$/.test(process.argv[1])) {
      runInit(process.argv.slice(process.argv[2] === "init" ? 3 : 2)).catch((err) => {
        console.error(err);
        process.exitCode = 1;
      });
    }
  }
});

// tools/kit/kit.ts
import archiver2 from "archiver";
import { createHash } from "node:crypto";
import { createWriteStream as createWriteStream2, existsSync as existsSync10 } from "node:fs";
import { copyFile as copyFile3, mkdir as mkdir6, readdir as readdir9, readFile as readFile12, rm as rm4, writeFile as writeFile8 } from "node:fs/promises";
import path11 from "node:path";

// tools/lib/java-species.ts
function toCamelStats(stats) {
  return {
    hp: stats.hp ?? 0,
    attack: stats.attack ?? 0,
    defence: stats.defence ?? stats.defense ?? 0,
    specialAttack: stats.special_attack ?? stats.specialAttack ?? 0,
    specialDefence: stats.special_defence ?? stats.specialDefence ?? 0,
    speed: stats.speed ?? 0
  };
}
function parseMoves(moves = []) {
  const levelUp = [];
  const egg = [];
  const tm = [];
  const tutor = [];
  for (const entry of moves) {
    const [prefix, move] = entry.split(":");
    if (!move) continue;
    if (/^\d+$/.test(prefix)) {
      levelUp.push({ level: Number.parseInt(prefix, 10), move });
    } else if (prefix === "egg") {
      egg.push(move);
    } else if (prefix === "tm" || prefix === "legacy") {
      tm.push(move);
    } else if (prefix === "tutor" || prefix === "special") {
      tutor.push(move);
    }
  }
  return { levelUp, egg, tm, tutor };
}
function parseAbilities(abilities = []) {
  const normal = [];
  let hidden = null;
  for (const ability of abilities) {
    if (ability.startsWith("h:")) {
      hidden = ability.slice(2);
    } else {
      normal.push(ability);
    }
  }
  return { normal, hidden };
}

// tools/lib/model-locators.ts
init_utils();
function locatorsOf(geo) {
  const out = /* @__PURE__ */ new Map();
  const geos = geo?.["minecraft:geometry"];
  for (const g of geos ?? []) {
    for (const bone of g.bones ?? []) {
      for (const [name, value] of Object.entries(bone.locators ?? {})) {
        const v = Array.isArray(value) ? value : value?.offset;
        if (!Array.isArray(v) || v.length < 3) continue;
        const vec2 = v.map(Number);
        if (vec2.some((n) => !Number.isFinite(n))) continue;
        out.set(name, vec2.map((n) => Math.round(n * 100) / 100));
      }
    }
  }
  return out;
}

// tools/kit/kit.ts
init_sanitize_animations();
init_sanitize_geometry();

// tools/lib/coastal-spawn-filter.ts
function isAquaticHabitat(habitat) {
  return habitat === "water" || habitat === "beach_water" || habitat === "seafloor";
}
function filterCoastalLandRules(rules) {
  const beachLandRules = rules.filter((r) => r.biome === "beach" && r.habitat === "land");
  if (beachLandRules.length === 0) return rules;
  const maxBeachLandWeight = Math.max(...beachLandRules.map((r) => r.entryWeight));
  return rules.filter((rule) => {
    if (!isAquaticHabitat(rule.habitat)) return true;
    if (rule.biome === "beach") return false;
    if (rule.biome === "ocean") return rule.entryWeight * 2 >= maxBeachLandWeight;
    return true;
  });
}

// tools/lib/spawn-pool-converter.ts
import { existsSync as existsSync4 } from "node:fs";
import { readFile as readFile5 } from "node:fs/promises";
import path5 from "node:path";

// tools/lib/biome-map.ts
var COBBLEMON_TAG_SELECTORS = {
  // --- Bosques ---
  // El tag `forest` de Bedrock incluye las taigas; el de Java no.
  is_forest: [{ any: ["forest", "cherry_grove"], not: ["taiga"] }],
  is_jungle: [{ any: ["jungle"] }],
  is_bamboo: [{ any: ["bamboo"] }],
  is_taiga: [{ any: ["taiga"] }],
  is_snowy_forest: [{ all: ["taiga", "cold"] }],
  is_snowy_taiga: [{ all: ["taiga", "cold"] }],
  is_cherry_blossom: [{ any: ["cherry_grove"] }],
  // is_spooky / is_magical = minecraft:dark_forest.
  is_spooky: [{ any: ["roofed"] }],
  is_magical: [{ any: ["roofed"] }],
  // --- Llanuras y praderas ---
  is_plains: [{ any: ["plains"] }],
  is_grassland: [{ any: ["plains"] }],
  is_floral: [{ any: ["cherry_grove", "flower_forest", "meadow"] }],
  is_temperate: [{ any: ["plains", "forest"], not: ["taiga", "frozen"] }],
  is_highlands: [{ any: ["meadow"] }],
  // --- Humedales ---
  is_swamp: [{ any: ["swamp", "mangrove_swamp"] }],
  is_river: [{ any: ["river"] }],
  is_freshwater: [{ any: ["river"] }],
  // --- Áridos ---
  is_desert: [{ any: ["desert"] }],
  is_arid: [{ any: ["desert", "mesa"] }],
  is_sandy: [{ any: ["desert", "beach"] }],
  is_badlands: [{ any: ["mesa"] }],
  is_mesa: [{ any: ["mesa"] }],
  is_savanna: [{ any: ["savanna"] }],
  // Sin bioma vanilla en Java; aproximación conservadora.
  is_volcanic: [{ any: ["mesa"] }],
  // --- Costa e islas ---
  is_beach: [{ any: ["beach"] }],
  // La playa pedregosa de Bedrock (`stone_beach`) lleva los dos tags a la vez,
  // y es la única: por eso se piden juntos en vez de con un tag propio.
  is_stony_beach: [{ all: ["beach", "stone"] }],
  is_coast: [{ any: ["beach", "shore"] }],
  is_mushroom: [{ any: ["mooshroom_island", "roofed"] }],
  is_island: [{ any: ["mooshroom_island"] }],
  is_tropical_island: [{ any: ["jungle", "beach"] }],
  // --- Océanos (all_of para cruzar temperatura con océano) ---
  is_ocean: [{ any: ["ocean"] }],
  is_deep_ocean: [{ all: ["ocean", "deep"] }],
  is_warm_ocean: [{ all: ["ocean", "warm"] }],
  is_lukewarm_ocean: [{ all: ["ocean", "lukewarm"] }],
  is_cold_ocean: [{ all: ["ocean", "cold"] }],
  is_frozen_ocean: [{ all: ["ocean", "frozen"] }],
  is_temperate_ocean: [{ any: ["ocean"], not: ["warm", "lukewarm", "cold", "frozen"] }],
  // Los usan los hábitats marinos. En el mod son la unión de un océano con
  // temperatura concreta y el océano templado (`ocean` / `deep_ocean` pelados).
  is_lukewarm_and_temperate_ocean: [
    { all: ["ocean", "lukewarm"] },
    { any: ["ocean"], not: ["warm", "lukewarm", "cold", "frozen"] }
  ],
  is_cold_and_temperate_ocean: [
    { all: ["ocean", "cold"] },
    { any: ["ocean"], not: ["warm", "lukewarm", "cold", "frozen"] }
  ],
  // --- Montaña ---
  is_mountain: [{ any: ["mountains", "extreme_hills"] }],
  // `#minecraft:is_hill` son colinas windswept, no cumbres.
  is_hills: [{ any: ["extreme_hills"] }],
  // `mountains` incluye cherry_grove/grove/meadow, que no son cumbres.
  is_peak: [{ any: ["mountains"], not: ["cherry_grove", "grove", "meadow"] }],
  // --- Frío ---
  // `frozen` incluye océanos helados: se excluyen para no vaciar spawns terrestres.
  is_freezing: [{ any: ["frozen", "ice_plains"], not: ["ocean"] }, { all: ["beach", "cold"] }],
  is_snowy: [{ any: ["frozen", "ice_plains"], not: ["ocean"] }, { all: ["beach", "cold"] }],
  is_tundra: [{ any: ["ice_plains"] }],
  // `minecraft:snowy_plains` en Java = `minecraft:ice_plains` en Bedrock.
  is_snowy_flat: [{ any: ["ice_plains"] }],
  // La pide la cicatriz de incendio de abeto. Sin ella caía al respaldo
  // `overworld` y salía en cualquier bioma, también en mitad del océano, con
  // su lista de Pokémon de tierra (Cyndaquil, Axew, Kleavor…).
  is_snowy_plains: [{ any: ["ice_plains"] }],
  is_glacial: [{ any: ["frozen_peaks", "ice_plains"] }],
  is_cold: [{ any: ["cold"], not: ["ocean"] }],
  // --- Cuevas (biomas de cueva reales, no "subterráneo" genérico) ---
  is_cave: [{ any: ["dripstone_caves", "lush_caves"] }],
  is_dripstone: [{ any: ["dripstone_caves"] }],
  is_lush: [{ any: ["lush_caves"] }],
  is_deep_dark: [{ any: ["deep_dark"] }],
  // --- Marcadores especiales (los resuelve el conversor, no son tags reales) ---
  is_sky: [{ any: ["sky"] }],
  is_overworld: [],
  is_end: [{ any: ["the_end"] }],
  // --- Nether ---
  // El páramo del Nether se llama `hell` en Bedrock, pero lleva el tag
  // `nether_wastes`, que es con lo que se le distingue de los bosques y los
  // deltas. Sin esto, lo que el mod ata al páramo salía en todo el Nether.
  is_wasteland: [{ any: ["nether_wastes"] }],
  is_soul_sand: [{ any: ["soulsand_valley"] }]
};
var COBBLEMON_TAG_TO_BEDROCK = Object.fromEntries(
  Object.entries(COBBLEMON_TAG_SELECTORS).map(([tag, selectors]) => [
    tag,
    [...new Set(selectors.flatMap((sel) => [...sel.any ?? [], ...sel.all ?? []]))]
  ])
);
var NETHER_TAG_TO_BEDROCK = {
  "nether/is_basalt": ["basalt_deltas"],
  "nether/is_crimson": ["crimson_forest"],
  "nether/is_wasteland": ["nether_wastes"],
  "nether/is_warped": ["warped_forest"],
  "nether/is_soul_sand": ["soulsand_valley"],
  "nether/is_soul_fire": ["soulsand_valley"],
  "nether/is_desert": ["soulsand_valley"],
  "nether/is_fungus": ["crimson_forest", "warped_forest"],
  /** Sin bioma vanilla en Java; aproximación a bosques del Nether. */
  "nether/is_forest": ["crimson_forest", "warped_forest"],
  "nether/is_overgrowth": ["crimson_forest"],
  "nether/is_mountain": ["basalt_deltas"],
  "nether/is_quartz": ["nether_wastes"],
  "nether/is_frozen": ["soulsand_valley"],
  "nether/is_toxic": ["nether_wastes"]
};
function resolveSpawnDimension(biomes) {
  if (biomes.includes("#cobblemon:is_end")) return "end";
  if (biomes.some(
    (b) => b.startsWith("#cobblemon:nether/") || b === "#minecraft:is_nether" || b === "minecraft:is_nether"
  )) {
    return "nether";
  }
  return "overworld";
}
var CAVE_ONLY_TAGS = /* @__PURE__ */ new Set([
  "is_overworld",
  "is_deep_dark",
  "is_dripstone",
  "is_cave"
]);
var OVERWORLD_ONLY_TAGS = /* @__PURE__ */ new Set(["is_overworld"]);
var SKY_ONLY_TAGS = /* @__PURE__ */ new Set(["is_sky"]);
function mapCobblemonBiomes(biomes, options) {
  const result = /* @__PURE__ */ new Set();
  for (const raw of biomes) {
    if (raw === "#minecraft:is_nether" || raw === "minecraft:is_nether") {
      result.add("nether_wastes");
      continue;
    }
    if (raw.startsWith("#cobblemon:nether/")) {
      const tag2 = raw.slice("#cobblemon:".length);
      const mapped2 = NETHER_TAG_TO_BEDROCK[tag2];
      if (!mapped2) continue;
      for (const biome of mapped2) result.add(biome);
      continue;
    }
    if (!raw.startsWith("#cobblemon:")) continue;
    const tag = raw.slice("#cobblemon:".length);
    if (tag === "is_spooky" && options?.spookyAsForest) {
      result.add("forest");
      continue;
    }
    const mapped = COBBLEMON_TAG_TO_BEDROCK[tag];
    if (!mapped) continue;
    for (const biome of mapped) result.add(biome);
  }
  if (result.size === 0 && options?.allowCaveGeneric) {
    const hasCaveTag = biomes.some((raw) => {
      if (!raw.startsWith("#cobblemon:")) return false;
      const tag = raw.slice("#cobblemon:".length);
      return CAVE_ONLY_TAGS.has(tag);
    });
    if (hasCaveTag) result.add("cave");
  }
  if (result.size === 0 && options?.allowOverworldGeneric) {
    const cobbleTags = biomes.filter((raw) => raw.startsWith("#cobblemon:")).map((raw) => raw.slice("#cobblemon:".length));
    if (cobbleTags.length > 0 && cobbleTags.every((tag) => OVERWORLD_ONLY_TAGS.has(tag) || CAVE_ONLY_TAGS.has(tag))) {
      result.add("overworld");
    }
    if (cobbleTags.length > 0 && cobbleTags.every((tag) => SKY_ONLY_TAGS.has(tag) || OVERWORLD_ONLY_TAGS.has(tag))) {
      result.add("sky");
    }
  }
  return [...result];
}
var CONVENTIONAL_TAG_ALIASES = {
  is_snowy_plains: "is_snowy_flat"
};
function mapCobblemonSelectors(biomes) {
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  const push = (selector, tag) => {
    const key = JSON.stringify(selector);
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ selector, tag });
  };
  for (const raw of biomes) {
    if (raw === "#minecraft:is_nether" || raw === "minecraft:is_nether") {
      push({ any: ["nether_wastes"] }, "is_nether");
      continue;
    }
    if (raw.startsWith("#cobblemon:nether/")) {
      const tag2 = raw.slice("#cobblemon:".length);
      const mapped = NETHER_TAG_TO_BEDROCK[tag2];
      if (mapped) push({ any: [...mapped] }, tag2);
      continue;
    }
    if (raw.startsWith("#c:")) {
      const tag2 = CONVENTIONAL_TAG_ALIASES[raw.slice("#c:".length)];
      if (tag2) for (const selector of COBBLEMON_TAG_SELECTORS[tag2] ?? []) push(selector, tag2);
      continue;
    }
    if (!raw.startsWith("#cobblemon:")) continue;
    const tag = raw.slice("#cobblemon:".length);
    for (const selector of COBBLEMON_TAG_SELECTORS[tag] ?? []) {
      push(selector, tag);
    }
  }
  return out;
}
function selectorPrimaryTag(selector) {
  return selector.any?.[0] ?? selector.all?.[0] ?? null;
}

// tools/lib/spawn-pool-converter.ts
init_load_species();

// tools/lib/nearby-blocks.ts
init_utils();
import { readFile as readFile4 } from "node:fs/promises";
import { existsSync as existsSync3 } from "node:fs";
import path4 from "node:path";
var MOD_DATA = cobblemonJava("data");
var BEDROCK_BLOCKS = bedrockSamples("metadata/vanilladata_modules/mojang-blocks.json");
var VANILLA_TAGS = {
  "minecraft:iron_ores": ["minecraft:iron_ore", "minecraft:deepslate_iron_ore"],
  "minecraft:coal_ores": ["minecraft:coal_ore", "minecraft:deepslate_coal_ore"],
  "minecraft:redstone_ores": ["minecraft:redstone_ore", "minecraft:deepslate_redstone_ore"],
  "c:redstone_ores": ["minecraft:redstone_ore", "minecraft:deepslate_redstone_ore"],
  "minecraft:diamond_ores": ["minecraft:diamond_ore", "minecraft:deepslate_diamond_ore"],
  "minecraft:corals": [
    "minecraft:tube_coral",
    "minecraft:brain_coral",
    "minecraft:bubble_coral",
    "minecraft:fire_coral",
    "minecraft:horn_coral"
  ],
  "minecraft:coral_blocks": [
    "minecraft:tube_coral_block",
    "minecraft:brain_coral_block",
    "minecraft:bubble_coral_block",
    "minecraft:fire_coral_block",
    "minecraft:horn_coral_block"
  ],
  // Las flores pequeñas de siempre; el mod mete las suyas por su propia etiqueta.
  "minecraft:flowers": [
    "minecraft:dandelion",
    "minecraft:poppy",
    "minecraft:blue_orchid",
    "minecraft:allium",
    "minecraft:azure_bluet",
    "minecraft:red_tulip",
    "minecraft:orange_tulip",
    "minecraft:white_tulip",
    "minecraft:pink_tulip",
    "minecraft:oxeye_daisy",
    "minecraft:cornflower",
    "minecraft:lily_of_the_valley",
    "minecraft:sunflower",
    "minecraft:lilac",
    "minecraft:rose_bush",
    "minecraft:peony"
  ],
  "minecraft:small_flowers": [
    "minecraft:dandelion",
    "minecraft:poppy",
    "minecraft:blue_orchid",
    "minecraft:allium",
    "minecraft:azure_bluet",
    "minecraft:red_tulip",
    "minecraft:orange_tulip",
    "minecraft:white_tulip",
    "minecraft:pink_tulip",
    "minecraft:oxeye_daisy",
    "minecraft:cornflower",
    "minecraft:lily_of_the_valley"
  ]
};
var BEDROCK_ALIASES = {
  "minecraft:lily_pad": "minecraft:waterlily",
  "minecraft:kelp_plant": "minecraft:kelp",
  "minecraft:magma_block": "minecraft:magma",
  "minecraft:sugar_cane": "minecraft:reeds",
  "minecraft:cobweb": "minecraft:web"
};
var MAX_TAG_DEPTH = 8;
var vanillaBlockIds = /* @__PURE__ */ new Set();
var portBlockIds = /* @__PURE__ */ new Set();
var tagCache = /* @__PURE__ */ new Map();
var loaded = false;
async function preloadNearbyBlockData() {
  if (loaded) return;
  const { readdir: readdir10 } = await import("node:fs/promises");
  const bedrock = BEDROCK_BLOCKS;
  if (!existsSync3(bedrock)) {
    throw new Error(`[cooblemon] falta ${bedrock}: sin la lista de bloques vanilla se pierden las apariciones por bloque cercano`);
  }
  {
    const json = JSON.parse(await readFile4(bedrock, "utf8"));
    for (const entry of json.data_items ?? []) if (entry.name) vanillaBlockIds.add(entry.name);
  }
  const blocksDir = resolveFromRoot("bp/blocks");
  if (existsSync3(blocksDir)) {
    for (const name of await readdir10(blocksDir)) {
      if (name.endsWith(".json")) portBlockIds.add(`cooblemon:${name.replace(/\.json$/, "")}`);
    }
  }
  for (const [tag, values] of Object.entries(VANILLA_TAGS)) tagCache.set(tag, values);
  for (const ns of ["cobblemon", "minecraft", "c"]) {
    const dir = resolveFromRoot(path4.join(MOD_DATA, ns, "tags/block"));
    if (!existsSync3(dir)) continue;
    for (const name of await readdir10(dir)) {
      if (!name.endsWith(".json")) continue;
      const tag = `${ns}:${name.replace(/\.json$/, "")}`;
      if (tagCache.has(tag)) continue;
      try {
        const json = JSON.parse(await readFile4(path4.join(dir, name), "utf8"));
        tagCache.set(
          tag,
          (json.values ?? []).filter((v) => typeof v === "string")
        );
      } catch {
        tagCache.set(tag, null);
      }
    }
  }
  loaded = true;
}
function portedBlock(id) {
  const name = id.slice(id.indexOf(":") + 1);
  for (const candidate of [`cooblemon:${name}`, `cooblemon:${name}_crop`]) {
    if (portBlockIds.has(candidate)) return candidate;
  }
  return null;
}
function resolveNearbyBlocks(needed) {
  if (!needed || needed.length === 0) return null;
  const out = /* @__PURE__ */ new Set();
  const expand = (entry, depth) => {
    if (depth > MAX_TAG_DEPTH) return false;
    if (entry.startsWith("#")) {
      const values = tagCache.get(entry.slice(1));
      if (!values) return false;
      let any = false;
      for (const value of values) {
        if (expand(value, depth + 1)) any = true;
      }
      return any;
    }
    if (entry.startsWith("minecraft:")) {
      const id = BEDROCK_ALIASES[entry] ?? entry;
      if (!vanillaBlockIds.has(id)) return false;
      out.add(id);
      return true;
    }
    if (entry.startsWith("cobblemon:")) {
      const ported = portedBlock(entry);
      if (!ported) return false;
      out.add(ported);
      return true;
    }
    return false;
  };
  for (const entry of needed) {
    if (!expand(entry, 0)) return null;
  }
  return out.size > 0 ? [...out].sort() : null;
}

// tools/lib/spawn-bucket-weights.ts
var SPAWN_BUCKET_WEIGHTS = {
  common: 94.3,
  uncommon: 5,
  rare: 0.5,
  "ultra-rare": 0.2,
  // Manadas alfa (`worldBuckets.boss` en best-spawner-config.json de 1.8).
  boss: 0.3
};
function bucketSpawnWeight(bucket) {
  return SPAWN_BUCKET_WEIGHTS[bucket] ?? SPAWN_BUCKET_WEIGHTS.common;
}

// tools/lib/spawn-pool-converter.ts
init_species_id();
init_utils();
function expandHerdLeader(entry) {
  if (entry.type !== "pokemon-herd") return entry;
  const leader = (entry.herdablePokemon ?? []).find(
    (member) => member.isLeader && /alpha=true/i.test(member.pokemon ?? "")
  );
  if (!leader?.pokemon) return entry;
  return {
    ...entry,
    type: "pokemon",
    pokemon: leader.pokemon,
    // El peso de la **manada**, que es lo que sortea el mod (`PokemonHerdSpawnDetail`
    // compite con su `weight`). El del líder solo decide quién encabeza dentro de
    // ella, y como el líder alfa sale siempre, aquí no pinta nada. Con el del
    // líder (30 frente a 10) los alfas salían el triple de lo que tocaba.
    weight: entry.weight ?? leader.weight,
    levelRange: entry.levelRange ?? leader.levelRange
  };
}
function heldItemFromProperties(properties) {
  const match = /(?:^|\s)held_item=([a-z0-9_.:-]+)/i.exec(properties);
  if (!match) return void 0;
  const id = match[1].toLowerCase();
  if (id.startsWith("cobblemon:")) return `cooblemon:${id.slice("cobblemon:".length)}`;
  return id.includes(":") ? id : `cooblemon:${id}`;
}
var SKIP_SPECIES = /* @__PURE__ */ new Set([
  "articuno",
  "zapdos",
  "moltres",
  "mewtwo",
  "mew",
  "lugia",
  "hooh",
  "regirock",
  "regice",
  "registeel",
  "latias",
  "latios",
  "rayquaza",
  "regigigas"
]);
function parseLevelRange(raw) {
  if (!raw) return null;
  const range = raw.match(/^(\d+)\s*-\s*(\d+)$/);
  if (range) {
    const min = Number(range[1]);
    const max = Number(range[2]);
    if (!Number.isFinite(min) || !Number.isFinite(max) || min > max) return null;
    return { min, max };
  }
  const single = raw.match(/^(\d+)$/);
  if (!single) return null;
  const level = Number(single[1]);
  if (!Number.isFinite(level)) return null;
  return { min: level, max: level };
}
function baseSpeciesId(pokemon) {
  return toEntitySpeciesId(pokemon.split(/\s+/)[0] ?? pokemon);
}
function parsePokemonForm(pokemon) {
  const parts = pokemon.trim().split(/\s+/).slice(1);
  for (const raw of parts) {
    const formWord = raw.toLowerCase();
    if (formWord === "alolan" || formWord === "alola") return "alolan";
    if (formWord === "galarian" || formWord === "galar") return "galarian";
    if (formWord === "hisuian" || formWord === "hisui") return "hisuian";
    if (formWord === "roaming") return "roaming";
    if (formWord.startsWith("sea=")) {
      const sea = formWord.slice("sea=".length);
      if (sea === "east" || sea === "west") return sea;
    }
    if (formWord === "east" || formWord === "west") return formWord;
    if (formWord.startsWith("region_bias=")) {
      const region = formWord.slice("region_bias=".length);
      if (region === "alola" || region === "galar" || region === "hisui") return `${region}_bias`;
    }
  }
  return void 0;
}
var SPECIAL_PRESETS = /* @__PURE__ */ new Set([
  "urban",
  "village",
  "mansion",
  "illager_structures",
  "redstone",
  "derelict"
]);
var BLOCK_GATED_STRUCTURE_PRESETS = /* @__PURE__ */ new Set(["desert_pyramid", "jungle_pyramid", "stronghold"]);
var PORTED_STRUCTURE_PREFIXES = [
  "cobblemon:fishing_boat/",
  "cobblemon:fossils/",
  "cobblemon:ruins/",
  "cobblemon:shipwreck_coves/",
  "cobblemon:pokecenter/"
];
function isPortedCobblemonStructure(ref) {
  const id = ref.replace(/^#/, "").replace(/^cooblemon:/, "cobblemon:");
  return PORTED_STRUCTURE_PREFIXES.some((prefix) => id === prefix.slice(0, -1) || id.startsWith(prefix));
}
function allStructuresPorted(refs) {
  return refs.length > 0 && refs.every(isPortedCobblemonStructure);
}
var presetStructures = /* @__PURE__ */ new Map();
async function loadSpawnPresetStructures() {
  presetStructures.clear();
  const root = cobblemonJava("data/cobblemon/spawn_detail_presets");
  if (!existsSync4(root)) return;
  for (const file of await walkFiles(root)) {
    if (!file.endsWith(".json")) continue;
    try {
      const data = JSON.parse(await readFile5(file, "utf8"));
      const structures = data.condition?.structures ?? [];
      if (structures.length === 0) continue;
      presetStructures.set(path5.basename(file, ".json"), structures);
    } catch {
    }
  }
}
function conservativeOmitReason(entry) {
  const presets = entry.presets ?? [];
  if (presets.length > 0 && presets.every((preset) => preset.includes("structure"))) {
    const portedPreset = presets.every(
      (p) => p.includes("ruin") || p.includes("fossil") || p.includes("shipwreck") || p.includes("fishing")
    );
    if (!portedPreset) return "structure_only_preset";
  }
  if (presets.length > 0 && presets.every((preset) => SPECIAL_PRESETS.has(preset)) && !presets.includes("natural") && !presets.includes("water")) {
    return "special_preset";
  }
  if (presets.some((preset) => BLOCK_GATED_STRUCTURE_PRESETS.has(preset))) {
    return "structure";
  }
  const cond = entry.condition ?? {};
  if (cond.moonPhase !== void 0 && cond.moonPhase !== null && String(cond.moonPhase).length > 0) {
    return "moon";
  }
  if ((cond.neededNearbyBlocks?.length ?? 0) > 0 && !resolveNearbyBlocks(cond.neededNearbyBlocks)) {
    return "nearby_block";
  }
  if ((cond.neededBaseBlocks?.length ?? 0) > 0 && !resolveBaseBlocks(cond.neededBaseBlocks)) {
    return "nearby_block";
  }
  const structures = [
    ...cond.structures ?? [],
    ...entry.structures ?? [],
    ...presets.flatMap((preset) => presetStructures.get(preset) ?? [])
  ];
  if (structures.length > 0) {
    if (allStructuresPorted(structures)) return null;
    return "structure";
  }
  return null;
}
function resolveHabitat(entry) {
  const position = entry.spawnablePositionType ?? "grounded";
  const presets = entry.presets ?? [];
  if (position === "fishing") return "water";
  if (position === "seafloor") return "seafloor";
  if (position === "submerged") return "water";
  if (position === "surface") return "beach_water";
  if (presets.includes("water")) {
    return position === "grounded" ? "riverbank" : "water";
  }
  if (presets.includes("treetop") || presets.includes("foliage")) return "land";
  return "land";
}
var ULTRA_RARE_OVERWORLD_BIOMES = [
  "plains",
  "forest",
  "mountain",
  "taiga",
  "savanna",
  "desert"
];
function resolvePopulation(habitat) {
  return habitat === "water" || habitat === "seafloor" ? "water_animal" : "animal";
}
var BASE_BLOCK_MAP = {
  "minecraft:quartz_block": ["minecraft:quartz_block"],
  "#minecraft:sand": ["minecraft:sand", "minecraft:red_sand"],
  "#c:sand": ["minecraft:sand", "minecraft:red_sand"],
  "#cobblemon:concrete_blocks": [
    "minecraft:white_concrete",
    "minecraft:orange_concrete",
    "minecraft:magenta_concrete",
    "minecraft:light_blue_concrete",
    "minecraft:yellow_concrete",
    "minecraft:lime_concrete",
    "minecraft:pink_concrete",
    "minecraft:gray_concrete",
    "minecraft:light_gray_concrete",
    "minecraft:cyan_concrete",
    "minecraft:purple_concrete",
    "minecraft:blue_concrete",
    "minecraft:brown_concrete",
    "minecraft:green_concrete",
    "minecraft:red_concrete",
    "minecraft:black_concrete"
  ]
};
function resolveBaseBlocks(needed) {
  if (!needed || needed.length === 0) return null;
  const out = /* @__PURE__ */ new Set();
  for (const id of needed) {
    const mapped = BASE_BLOCK_MAP[id];
    if (!mapped) return null;
    for (const block of mapped) out.add(block);
  }
  return [...out].sort();
}
function pendingRuleKey(rule) {
  return ruleKey(
    rule.species,
    rule.form,
    rule.biome,
    rule.habitat,
    rule.light,
    rule.weather,
    rule.dimension,
    rule.heightMin,
    rule.heightMax,
    rule.baseBlocks,
    rule.nearbyBlocks
  );
}
function pendingScoreEstimate(rule) {
  return bucketSpawnWeight(rule.bucket) * rule.entryWeight;
}
function shouldSkipGenericBiomeRule(biome, light, dimension, bucket, hasBlockRequirement) {
  if (dimension !== "overworld") return false;
  if (hasBlockRequirement && biome === "overworld") return false;
  if (bucket === "ultra-rare" && biome === "overworld") return false;
  if (light === "cave") return biome === "overworld" || biome === "sky";
  return biome === "overworld" || biome === "sky" || biome === "cave";
}
function resolveSpawnLight(entry) {
  const cond = entry.condition ?? {};
  const minSkyLight = cond.minSkyLight ?? 0;
  const maxSkyLight = cond.maxSkyLight ?? 15;
  const maxBlockLight = cond.maxLight;
  const position = entry.spawnablePositionType ?? "grounded";
  const presets = entry.presets ?? [];
  const isAquatic = position === "submerged" || position === "seafloor" || position === "surface" || presets.includes("water");
  if (cond.timeRange === "night") return "night";
  if (cond.timeRange === "day") return "day";
  if (maxBlockLight === 0 && minSkyLight >= 8) return "night";
  if (cond.canSeeSky === false) {
    if (isAquatic && maxSkyLight >= 8) return "surface";
    if (maxSkyLight <= 7) return "cave";
    return isAquatic ? "surface" : "cave";
  }
  if (maxSkyLight <= 7) return "cave";
  if (minSkyLight >= 8) return "surface";
  return "surface";
}
function resolveSpawnWeather(entry) {
  const cond = entry.condition ?? {};
  if (cond.isRaining === true) return "rain";
  if (cond.isRaining === false) return "clear";
  return "any";
}
function resolveBiomesForEntry(entry, light) {
  const rawBiomes = entry.condition?.biomes ?? [];
  const include = mapCobblemonSelectors(rawBiomes);
  if (include.length === 0) {
    const fallback = mapCobblemonBiomes(rawBiomes, {
      allowCaveGeneric: light === "cave",
      allowOverworldGeneric: light === "surface" || light === "night" || light === "day"
    });
    return {
      include: fallback.map((biome) => ({ selector: { any: [biome] }, tag: biome })),
      exclude: mapCobblemonSelectors(entry.anticondition?.biomes ?? [])
    };
  }
  return { include, exclude: mapCobblemonSelectors(entry.anticondition?.biomes ?? []) };
}
var BEDROCK_Y_MIN = -64;
var BEDROCK_Y_MAX = 320;
var PEAK_IMPLICIT_MIN_Y = 96;
var SKY_IMPLICIT_MIN_Y = 80;
function clampY(value) {
  return Math.max(BEDROCK_Y_MIN, Math.min(BEDROCK_Y_MAX, value));
}
function cobblemonTags(biomes) {
  return biomes.filter((raw) => raw.startsWith("#cobblemon:")).map((raw) => raw.slice("#cobblemon:".length));
}
function resolveHeightRange(entry) {
  const cond = entry.condition ?? {};
  const tags = cobblemonTags(cond.biomes ?? []);
  let min = cond.minY;
  let max = cond.maxY;
  const hasPeak = tags.includes("is_peak");
  const hasSky = tags.includes("is_sky");
  const onlyBroadTags = tags.every(
    (tag) => tag === "is_sky" || tag === "is_overworld" || tag === "is_peak"
  );
  if (min === void 0 && hasPeak) min = PEAK_IMPLICIT_MIN_Y;
  if (min === void 0 && hasSky && onlyBroadTags) min = SKY_IMPLICIT_MIN_Y;
  const result = {};
  if (min !== void 0) result.heightMin = clampY(min);
  if (max !== void 0) result.heightMax = clampY(max);
  if (result.heightMin !== void 0 && result.heightMax !== void 0 && result.heightMin > result.heightMax) {
    return {};
  }
  return result;
}
function ruleKey(species, form, biome, habitat, light, weather, dimension, heightMin, heightMax, baseBlocks, nearbyBlocks) {
  return `${species}|${form ?? ""}|${biome}|${habitat}|${light}|${weather}|${dimension}|${heightMin ?? ""}|${heightMax ?? ""}|${(baseBlocks ?? []).join(",")}|${(nearbyBlocks ?? []).join(",")}`;
}
async function convertJavaSpawnPools(options) {
  const allowGeneric = options?.allowGeneric === true;
  if (options?.ignorePresetStructures) presetStructures.clear();
  else await loadSpawnPresetStructures();
  await preloadNearbyBlockData();
  const result = {};
  const pendingDedup = /* @__PURE__ */ new Map();
  const omitLog = options?.omitLog;
  let filesRead = 0;
  let entriesSkipped = 0;
  let caveRules = 0;
  let nightRules = 0;
  let dayRules = 0;
  let netherRules = 0;
  let endRules = 0;
  function omit(entry, reason, file) {
    entriesSkipped++;
    omitLog?.push({ entryId: entry.id, pokemon: entry.pokemon, reason, file });
  }
  const poolFiles = options?.files ? [...options.files] : [];
  const cobblemonSpawnRoot = cobblemonJava("data/cobblemon/spawn_pool_world");
  if (!options?.files && existsSync4(cobblemonSpawnRoot)) {
    for (const file of await walkFiles(cobblemonSpawnRoot)) {
      if (file.endsWith(".json")) poolFiles.push(file);
    }
  }
  const atmSpawnRoots = [
    allTheMonsJava("data/cobblemon/spawn_pool_world"),
    allTheMonsJava("data/special_spawns/spawn_pool_world")
  ].filter((p) => !!p && existsSync4(p));
  const atmFiles = [];
  for (const root of options?.files ? [] : atmSpawnRoots) {
    for (const file of await walkFiles(root)) {
      if (file.endsWith(".json")) atmFiles.push(file);
    }
  }
  async function ingestFile(filePath, onlyIfMissingSpecies) {
    const raw = await readFile5(filePath, "utf8");
    const pool = JSON.parse(raw);
    if (pool.enabled === false || pool.enabled === "false") return;
    filesRead++;
    const fileName = path5.basename(filePath);
    for (const rawEntry of pool.spawns ?? []) {
      const entry = expandHerdLeader(rawEntry);
      if (entry.type !== "pokemon" || !entry.pokemon) {
        omit(rawEntry, "not_pokemon", fileName);
        continue;
      }
      if (entry.spawnablePositionType === "fishing") {
        const bucket2 = entry.bucket ?? "common";
        if (bucket2 !== "rare" && bucket2 !== "ultra-rare") {
          omit(entry, "fishing_common", fileName);
          continue;
        }
      }
      const species = baseSpeciesId(entry.pokemon);
      const form = parsePokemonForm(entry.pokemon);
      if (SKIP_SPECIES.has(species)) {
        omit(entry, "skip_species", fileName);
        continue;
      }
      if (options?.speciesFilter && !options.speciesFilter.has(species)) continue;
      const gate = conservativeOmitReason(entry);
      if (gate) {
        omit(entry, gate, fileName);
        continue;
      }
      if (onlyIfMissingSpecies && result[species]?.rules.length) {
        if (!form) continue;
        if (result[species].rules.some((rule) => rule.form === form)) continue;
      }
      const level = parseLevelRange(entry.level ?? entry.levelRange);
      if (!level) {
        omit(entry, "no_level", fileName);
        continue;
      }
      let light = resolveSpawnLight(entry);
      const weather = resolveSpawnWeather(entry);
      const rawBiomes = entry.condition?.biomes ?? [];
      const dimension = resolveSpawnDimension(rawBiomes);
      let biomes = resolveBiomesForEntry(entry, light);
      const onlyCaveMarker = (sels) => sels.length > 0 && sels.every((s) => selectorPrimaryTag(s.selector) === "cave");
      if (onlyCaveMarker(biomes.include) && light === "surface") {
        light = "cave";
        biomes = resolveBiomesForEntry(entry, light);
      }
      if (biomes.include.length === 0) {
        omit(entry, "unmapped_biome", fileName);
        continue;
      }
      let generation = options?.generationOf?.(species) ?? 1;
      if (!options?.generationOf) {
        try {
          const data = await loadSpeciesByEntityId(species);
          generation = data.generation ?? 1;
        } catch {
          omit(entry, "species_load", fileName);
          continue;
        }
      }
      if (!result[species]) {
        result[species] = {
          generation,
          levelMin: level.min,
          levelMax: level.max,
          rules: []
        };
      } else {
        result[species].levelMin = Math.min(result[species].levelMin, level.min);
        result[species].levelMax = Math.max(result[species].levelMax, level.max);
      }
      const habitat = resolveHabitat(entry);
      const population = resolvePopulation(habitat);
      const { heightMin, heightMax } = resolveHeightRange(entry);
      const baseBlocks = resolveBaseBlocks(entry.condition?.neededBaseBlocks) ?? void 0;
      const nearbyBlocks = resolveNearbyBlocks(entry.condition?.neededNearbyBlocks) ?? void 0;
      const bucket = entry.bucket ?? "common";
      const entryWeight = entry.weight ?? 9;
      const nightMult = entry.weightMultiplier?.condition?.timeRange === "night" ? Number(entry.weightMultiplier.multiplier) : void 0;
      const nightOnlyAlolanMeowth = species === "meowth" && form === "alolan";
      const lightVariants = nightOnlyAlolanMeowth && light === "surface" ? [{ light: "night", weight: Math.min(entryWeight, 9) }] : nightMult && Number.isFinite(nightMult) && nightMult > 0 && light === "surface" ? [
        { light: "day", weight: entryWeight },
        { light: "night", weight: entryWeight * nightMult }
      ] : [{ light, weight: entryWeight }];
      let emitted = 0;
      for (const { selector, tag: biomeTag } of biomes.include) {
        const biome = selectorPrimaryTag(selector);
        if (!biome) continue;
        if (!allowGeneric && shouldSkipGenericBiomeRule(biome, light, dimension, bucket, !!baseBlocks || !!nearbyBlocks)) {
          continue;
        }
        const expandedBiomes = biome === "overworld" && bucket === "ultra-rare" && !allowGeneric ? [...ULTRA_RARE_OVERWORLD_BIOMES] : [biome];
        for (const resolvedBiome of expandedBiomes) {
          const ruleSelector = resolvedBiome === biome ? selector : { any: [resolvedBiome] };
          for (const variant of lightVariants) {
            if (!allowGeneric && shouldSkipGenericBiomeRule(
              resolvedBiome,
              variant.light,
              dimension,
              bucket,
              !!baseBlocks || !!nearbyBlocks
            )) {
              continue;
            }
            const pending = {
              species,
              form,
              biome: resolvedBiome,
              biomeSelector: ruleSelector,
              biomeTag,
              biomeExclude: biomes.exclude.length > 0 ? biomes.exclude.map((e) => e.selector) : void 0,
              habitat,
              light: variant.light,
              weather,
              dimension,
              heightMin,
              heightMax,
              ...baseBlocks ? { baseBlocks } : {},
              ...nearbyBlocks ? { nearbyBlocks } : {},
              population,
              bucket,
              entryWeight: variant.weight,
              alpha: /alpha=true/i.test(entry.pokemon ?? "") || void 0,
              heldItem: /alpha=true/i.test(entry.pokemon ?? "") ? heldItemFromProperties(entry.pokemon ?? "") : void 0
            };
            const key = pendingRuleKey(pending);
            const existing = pendingDedup.get(key);
            if (!existing || pendingScoreEstimate(pending) > pendingScoreEstimate(existing)) {
              pendingDedup.set(key, pending);
              emitted++;
              if (variant.light === "cave") caveRules++;
              else if (variant.light === "night") nightRules++;
              else if (variant.light === "day") dayRules++;
              if (dimension === "nether") netherRules++;
              else if (dimension === "end") endRules++;
            }
          }
        }
      }
      if (emitted === 0) {
        omit(entry, "generic_overworld", fileName);
      }
    }
  }
  for (const file of poolFiles) {
    await ingestFile(file, false);
  }
  for (const rule of pendingDedup.values()) {
    const speciesData = result[rule.species];
    if (!speciesData) continue;
    speciesData.rules.push({
      ...rule.form ? { form: rule.form } : {},
      biome: rule.biome,
      ...rule.biomeSelector ? { biomeSelector: rule.biomeSelector } : {},
      ...rule.biomeTag ? { biomeTag: rule.biomeTag } : {},
      ...rule.biomeExclude ? { biomeExclude: rule.biomeExclude } : {},
      entryWeight: rule.entryWeight,
      bucket: rule.bucket,
      ...rule.alpha ? { alpha: true } : {},
      ...rule.heldItem ? { heldItem: rule.heldItem } : {},
      habitat: rule.habitat,
      population: rule.population,
      light: rule.light,
      weather: rule.weather,
      heightMin: rule.heightMin,
      heightMax: rule.heightMax,
      ...rule.baseBlocks ? { baseBlocks: rule.baseBlocks } : {},
      ...rule.nearbyBlocks ? { nearbyBlocks: rule.nearbyBlocks } : {},
      dimension: rule.dimension
    });
  }
  pendingDedup.clear();
  let atmSpeciesAdded = 0;
  const beforeAtm = new Set(Object.keys(result).filter((id) => result[id].rules.length > 0));
  for (const file of atmFiles) {
    await ingestFile(file, true);
  }
  for (const rule of pendingDedup.values()) {
    const speciesData = result[rule.species];
    if (!speciesData) continue;
    speciesData.rules.push({
      ...rule.form ? { form: rule.form } : {},
      biome: rule.biome,
      ...rule.biomeSelector ? { biomeSelector: rule.biomeSelector } : {},
      ...rule.biomeTag ? { biomeTag: rule.biomeTag } : {},
      ...rule.biomeExclude ? { biomeExclude: rule.biomeExclude } : {},
      entryWeight: rule.entryWeight,
      bucket: rule.bucket,
      habitat: rule.habitat,
      population: rule.population,
      light: rule.light,
      weather: rule.weather,
      heightMin: rule.heightMin,
      heightMax: rule.heightMax,
      ...rule.baseBlocks ? { baseBlocks: rule.baseBlocks } : {},
      ...rule.nearbyBlocks ? { nearbyBlocks: rule.nearbyBlocks } : {},
      dimension: rule.dimension
    });
  }
  for (const species of Object.keys(result)) {
    if (result[species].rules.length === 0) delete result[species];
    else if (!beforeAtm.has(species)) atmSpeciesAdded++;
  }
  const pendingRules = [...pendingDedup.values()];
  const heightRules = pendingRules.filter(
    (r) => r.heightMin !== void 0 || r.heightMax !== void 0
  ).length;
  const ultraRareRules = Object.values(result).flatMap((s) => s.rules).filter((r) => r.bucket === "ultra-rare").length;
  if (!options?.quiet) logStep(
    `  Spawn pools: ${Object.keys(result).length} especies, ${Object.values(result).reduce((n, s) => n + s.rules.length, 0)} reglas (${caveRules} cueva, ${nightRules} noche, ${dayRules} d\xEDa, ${heightRules} altura, ${netherRules} nether, ${endRules} end, ${ultraRareRules} ultra-rare, ${filesRead} archivos, ${atmSpeciesAdded} desde AllTheMons, ${entriesSkipped} omitidas)`
  );
  return result;
}

// tools/lib/spawn-pool-bundle.ts
var DEDICATED_SPAWN_FORMS = /* @__PURE__ */ new Set(["alolan", "galarian", "hisuian", "roaming", "east", "west"]);
function isDedicatedSpawnForm(form) {
  return !!form && DEDICATED_SPAWN_FORMS.has(form);
}
var ASPECT_SPAWN_FORMS = /* @__PURE__ */ new Set(["alola_bias", "galar_bias", "hisui_bias"]);
function isBundledSpawnForm(form) {
  return isDedicatedSpawnForm(form) || !!form && ASPECT_SPAWN_FORMS.has(form);
}
function bundleSpawnRules(id, spawn, options) {
  const out = [];
  for (const rule of filterCoastalLandRules(spawn.rules)) {
    if (!options?.allowGeneric && shouldSkipGenericBiomeRule(
      rule.biome,
      rule.light,
      rule.dimension,
      void 0,
      !!rule.baseBlocks || !!rule.nearbyBlocks
    )) {
      continue;
    }
    const bundled = {
      species: id,
      biome: rule.biome,
      habitat: rule.habitat,
      light: rule.light,
      dimension: rule.dimension,
      bucket: rule.bucket,
      entryWeight: rule.entryWeight
    };
    if (rule.alpha) bundled.alpha = true;
    if (rule.heldItem) bundled.heldItem = rule.heldItem;
    if (rule.biomeTag && rule.biomeTag !== rule.biome) bundled.biomeTag = rule.biomeTag;
    const selector = rule.biomeSelector;
    if (selector?.any && selector.any.length > 1) bundled.biomeAny = [...selector.any];
    if (selector?.all && selector.all.length > 0) bundled.biomeAll = [...selector.all];
    if (selector?.not && selector.not.length > 0) bundled.biomeNot = [...selector.not];
    if (isBundledSpawnForm(rule.form)) bundled.form = rule.form;
    if (rule.weather && rule.weather !== "any") bundled.weather = rule.weather;
    if (rule.baseBlocks && rule.baseBlocks.length > 0) bundled.baseBlocks = [...rule.baseBlocks];
    if (rule.nearbyBlocks && rule.nearbyBlocks.length > 0) bundled.nearbyBlocks = [...rule.nearbyBlocks];
    if (rule.heightMin !== void 0) bundled.heightMin = rule.heightMin;
    if (rule.heightMax !== void 0) bundled.heightMax = rule.heightMax;
    out.push(bundled);
  }
  return out;
}

// tools/kit/kit.ts
init_utils();

// bp/src/data/regional-forms.generated.ts
var REGIONAL_FORMS = [
  { species: "venusaur", formId: "mega", wildRate: 0, biomeKeywords: [] },
  { species: "charizard", formId: "mega_x", wildRate: 0, biomeKeywords: [] },
  { species: "charizard", formId: "mega_y", wildRate: 0, biomeKeywords: [] },
  { species: "blastoise", formId: "mega", wildRate: 0, biomeKeywords: [] },
  { species: "rattata", formId: "alolan", wildRate: 0.04, biomeKeywords: ["snow", "ice", "frozen", "cold", "plains"] },
  { species: "raticate", formId: "alolan", wildRate: 0.04, biomeKeywords: ["snow", "ice", "frozen", "cold", "plains"] },
  { species: "raichu", formId: "alolan", wildRate: 0.04, biomeKeywords: ["beach", "ocean", "warm"] },
  { species: "vulpix", formId: "alolan", wildRate: 0.04, biomeKeywords: ["snow", "ice", "frozen", "cold"] },
  { species: "ninetales", formId: "alolan", wildRate: 0.04, biomeKeywords: ["snow", "ice", "frozen", "cold"] },
  { species: "diglett", formId: "alolan", wildRate: 0.04, biomeKeywords: ["beach", "desert", "sandy"] },
  { species: "dugtrio", formId: "alolan", wildRate: 0.04, biomeKeywords: ["beach", "desert", "sandy"] },
  { species: "sandshrew", formId: "alolan", wildRate: 0.04, biomeKeywords: ["snow", "ice", "frozen", "cold", "beach"] },
  { species: "sandslash", formId: "alolan", wildRate: 0.04, biomeKeywords: ["snow", "ice", "frozen", "cold", "beach"] },
  { species: "meowth", formId: "alolan", wildRate: 0.04, biomeKeywords: ["beach", "ocean", "warm"] },
  { species: "meowth", formId: "galarian", wildRate: 0.04, biomeKeywords: ["snow", "ice", "frozen", "cold", "taiga"] },
  { species: "persian", formId: "alolan", wildRate: 0.04, biomeKeywords: ["beach", "ocean", "warm"] },
  { species: "ponyta", formId: "galarian", wildRate: 0.04, biomeKeywords: ["plains", "grove", "meadow"] },
  { species: "rapidash", formId: "galarian", wildRate: 0.04, biomeKeywords: ["plains", "grove", "meadow"] },
  { species: "slowpoke", formId: "galarian", wildRate: 0.04, biomeKeywords: ["beach", "ocean", "river"] },
  { species: "slowbro", formId: "galarian", wildRate: 0.04, biomeKeywords: ["beach", "ocean", "river"] },
  { species: "farfetchd", formId: "galarian", wildRate: 0.04, biomeKeywords: ["forest", "plains", "grove"] },
  { species: "geodude", formId: "alolan", wildRate: 0.04, biomeKeywords: ["mountain", "peak", "rock"] },
  { species: "graveler", formId: "alolan", wildRate: 0.04, biomeKeywords: ["mountain", "peak", "rock"] },
  { species: "golem", formId: "alolan", wildRate: 0.04, biomeKeywords: ["mountain", "peak", "rock"] },
  { species: "grimer", formId: "alolan", wildRate: 0.04, biomeKeywords: ["swamp", "marsh", "mangrove"] },
  { species: "muk", formId: "alolan", wildRate: 0.04, biomeKeywords: ["swamp", "marsh", "mangrove"] },
  { species: "weezing", formId: "galarian", wildRate: 0.04, biomeKeywords: ["plains", "grove", "meadow"] },
  { species: "mrmime", formId: "galarian", wildRate: 0.04, biomeKeywords: ["snow", "ice", "frozen", "cold"] },
  { species: "exeggutor", formId: "alolan", wildRate: 0.04, biomeKeywords: ["beach", "jungle", "warm"] },
  { species: "marowak", formId: "alolan", wildRate: 0.04, biomeKeywords: ["desert", "savanna", "volcano"] },
  { species: "tauros", formId: "paldean_combat", wildRate: 0.04, biomeKeywords: ["plains", "savanna", "meadow", "grove"] },
  { species: "tauros", formId: "paldean_blaze", wildRate: 0.04, biomeKeywords: ["desert", "savanna", "badlands", "mesa"] },
  { species: "tauros", formId: "paldean_aqua", wildRate: 0.04, biomeKeywords: ["beach", "ocean", "river", "swamp", "mangrove"] },
  { species: "wooper", formId: "paldean", wildRate: 0.04, biomeKeywords: ["swamp", "marsh", "mangrove", "river"] },
  { species: "slowking", formId: "galarian", wildRate: 0.04, biomeKeywords: ["beach", "ocean", "river", "swamp"] },
  { species: "corsola", formId: "galarian", wildRate: 0.04, biomeKeywords: ["beach", "ocean", "cold", "frozen"] },
  { species: "zigzagoon", formId: "galarian", wildRate: 0.04, biomeKeywords: ["plains", "forest", "grove", "meadow", "taiga"] },
  { species: "linoone", formId: "galarian", wildRate: 0.04, biomeKeywords: ["plains", "forest", "grove", "meadow", "taiga"] },
  { species: "voltorb", formId: "hisuian", wildRate: 0.04, biomeKeywords: ["forest", "taiga", "grove"] },
  { species: "electrode", formId: "hisuian", wildRate: 0.04, biomeKeywords: ["forest", "taiga", "grove"] },
  { species: "typhlosion", formId: "hisuian", wildRate: 0.04, biomeKeywords: ["forest", "taiga", "grove", "mountain"] },
  { species: "qwilfish", formId: "hisuian", wildRate: 0.04, biomeKeywords: ["ocean", "beach", "river", "cold"] },
  { species: "sneasel", formId: "hisuian", wildRate: 0.04, biomeKeywords: ["mountain", "peak", "hills", "taiga"] },
  { species: "samurott", formId: "hisuian", wildRate: 0.04, biomeKeywords: ["beach", "ocean", "river", "swamp"] },
  { species: "lilligant", formId: "hisuian", wildRate: 0.04, biomeKeywords: ["plains", "meadow", "forest", "grove"] },
  { species: "zorua", formId: "hisuian", wildRate: 0.04, biomeKeywords: ["snow", "ice", "frozen", "cold", "taiga"] },
  { species: "zoroark", formId: "hisuian", wildRate: 0.04, biomeKeywords: ["snow", "ice", "frozen", "cold", "taiga"] },
  { species: "braviary", formId: "hisuian", wildRate: 0.04, biomeKeywords: ["mountain", "peak", "hills", "extreme_hills"] },
  { species: "sliggoo", formId: "hisuian", wildRate: 0.04, biomeKeywords: ["swamp", "marsh", "mangrove", "river"] },
  { species: "goodra", formId: "hisuian", wildRate: 0.04, biomeKeywords: ["swamp", "marsh", "mangrove", "river"] },
  { species: "avalugg", formId: "hisuian", wildRate: 0.04, biomeKeywords: ["snow", "ice", "frozen", "cold", "taiga"] },
  { species: "decidueye", formId: "hisuian", wildRate: 0.04, biomeKeywords: ["forest", "taiga", "grove", "jungle"] },
  { species: "darmanitan", formId: "zen", wildRate: 0, biomeKeywords: ["desert", "savanna", "badlands", "mesa"] },
  { species: "yamask", formId: "galarian", wildRate: 0.04, biomeKeywords: ["ruins", "desert", "savanna", "badlands"] },
  { species: "basculin", formId: "bluestripe", wildRate: 0.04, biomeKeywords: ["ocean", "river", "beach"] },
  { species: "basculin", formId: "whitestripe", wildRate: 0.04, biomeKeywords: ["ocean", "river", "cold", "frozen"] },
  { species: "gimmighoul", formId: "roaming", wildRate: 0.02, biomeKeywords: ["ruins", "desert", "savanna", "badlands"] },
  { species: "burmy", formId: "sandy", wildRate: 0.04, biomeKeywords: ["desert", "beach", "badlands", "savanna"] },
  { species: "burmy", formId: "trash", wildRate: 0.04, biomeKeywords: ["plains", "village", "urban", "dark"] },
  { species: "wormadam", formId: "sandy", wildRate: 0.04, biomeKeywords: ["desert", "beach", "badlands", "savanna"] },
  { species: "wormadam", formId: "trash", wildRate: 0.04, biomeKeywords: ["plains", "village", "urban", "dark"] },
  { species: "cherrim", formId: "sunshine", wildRate: 0, biomeKeywords: ["plains", "meadow", "forest", "grove", "flower"] },
  { species: "shellos", formId: "east", wildRate: 0.04, biomeKeywords: ["cold_ocean", "frozen_ocean", "frozen", "ice", "snow"] },
  { species: "shellos", formId: "west", wildRate: 0.04, biomeKeywords: ["warm_ocean", "lukewarm", "warm", "beach"] },
  { species: "gastrodon", formId: "east", wildRate: 0.04, biomeKeywords: ["cold_ocean", "frozen_ocean", "frozen", "ice", "snow"] },
  { species: "gastrodon", formId: "west", wildRate: 0.04, biomeKeywords: ["warm_ocean", "lukewarm", "warm", "beach"] },
  { species: "rotom", formId: "heat", wildRate: 0.04, biomeKeywords: ["desert", "savanna", "nether", "volcano"] },
  { species: "rotom", formId: "wash", wildRate: 0.04, biomeKeywords: ["ocean", "beach", "river", "swamp"] },
  { species: "rotom", formId: "frost", wildRate: 0.04, biomeKeywords: ["snow", "ice", "frozen", "cold"] },
  { species: "rotom", formId: "fan", wildRate: 0.04, biomeKeywords: ["plains", "meadow", "mountain", "windswept"] },
  { species: "rotom", formId: "mow", wildRate: 0.04, biomeKeywords: ["plains", "meadow", "forest", "grove"] },
  { species: "deerling", formId: "summer", wildRate: 0.35, biomeKeywords: ["savanna", "desert", "jungle", "warm", "beach"] },
  { species: "deerling", formId: "autumn", wildRate: 0.35, biomeKeywords: ["forest", "taiga", "grove", "dark"] },
  { species: "deerling", formId: "winter", wildRate: 0.35, biomeKeywords: ["snow", "ice", "frozen", "cold", "taiga"] },
  { species: "sawsbuck", formId: "summer", wildRate: 0.35, biomeKeywords: ["savanna", "desert", "jungle", "warm", "beach"] },
  { species: "sawsbuck", formId: "autumn", wildRate: 0.35, biomeKeywords: ["forest", "taiga", "grove", "dark"] },
  { species: "sawsbuck", formId: "winter", wildRate: 0.35, biomeKeywords: ["snow", "ice", "frozen", "cold", "taiga"] },
  { species: "stunfisk", formId: "galarian", wildRate: 0.04, biomeKeywords: ["swamp", "marsh", "mangrove", "beach", "ocean"] },
  { species: "vivillon", formId: "icy_snow", wildRate: 0.3, biomeKeywords: ["snow", "ice", "frozen", "cold"] },
  { species: "vivillon", formId: "polar", wildRate: 0.3, biomeKeywords: ["snow", "ice", "frozen", "cold", "taiga"] },
  { species: "vivillon", formId: "tundra", wildRate: 0.3, biomeKeywords: ["taiga", "cold", "grove"] },
  { species: "vivillon", formId: "continental", wildRate: 0.3, biomeKeywords: ["plains", "forest", "grove"] },
  { species: "vivillon", formId: "garden", wildRate: 0.3, biomeKeywords: ["flower", "meadow", "plains"] },
  { species: "vivillon", formId: "elegant", wildRate: 0.25, biomeKeywords: ["cherry", "flower", "forest"] },
  { species: "vivillon", formId: "modern", wildRate: 0.3, biomeKeywords: ["plains", "village", "forest"] },
  { species: "vivillon", formId: "marine", wildRate: 0.3, biomeKeywords: ["beach", "ocean", "coast"] },
  { species: "vivillon", formId: "archipelago", wildRate: 0.3, biomeKeywords: ["beach", "jungle", "warm"] },
  { species: "vivillon", formId: "high_plains", wildRate: 0.3, biomeKeywords: ["savanna", "plains", "mesa"] },
  { species: "vivillon", formId: "sandstorm", wildRate: 0.3, biomeKeywords: ["desert", "badlands", "mesa", "nether"] },
  { species: "vivillon", formId: "river", wildRate: 0.3, biomeKeywords: ["river", "swamp", "mangrove"] },
  { species: "vivillon", formId: "monsoon", wildRate: 0.3, biomeKeywords: ["jungle", "swamp", "mangrove"] },
  { species: "vivillon", formId: "savanna", wildRate: 0.3, biomeKeywords: ["savanna", "desert"] },
  { species: "vivillon", formId: "sun", wildRate: 0.3, biomeKeywords: ["desert", "savanna", "badlands", "nether"] },
  { species: "vivillon", formId: "ocean", wildRate: 0.3, biomeKeywords: ["ocean", "beach", "warm"] },
  { species: "vivillon", formId: "jungle", wildRate: 0.3, biomeKeywords: ["jungle", "bamboo"] },
  { species: "vivillon", formId: "fancy", wildRate: 0.2, biomeKeywords: ["flower", "meadow", "cherry", "the_end", "end"] },
  { species: "vivillon", formId: "poke_ball", wildRate: 0.15, biomeKeywords: ["plains", "village"] },
  { species: "flabebe", formId: "blue", wildRate: 0.3, biomeKeywords: ["ocean", "river", "cold"] },
  { species: "flabebe", formId: "orange", wildRate: 0.3, biomeKeywords: ["savanna", "desert", "mesa"] },
  { species: "flabebe", formId: "yellow", wildRate: 0.3, biomeKeywords: ["plains", "meadow", "flower"] },
  { species: "flabebe", formId: "white", wildRate: 0.3, biomeKeywords: ["snow", "ice", "frozen", "cold"] },
  { species: "flabebe", formId: "pink", wildRate: 0.3, biomeKeywords: ["cherry", "flower", "meadow"] },
  { species: "floette", formId: "blue", wildRate: 0.3, biomeKeywords: ["ocean", "river", "cold"] },
  { species: "floette", formId: "orange", wildRate: 0.3, biomeKeywords: ["savanna", "desert", "mesa"] },
  { species: "floette", formId: "yellow", wildRate: 0.3, biomeKeywords: ["plains", "meadow", "flower"] },
  { species: "floette", formId: "white", wildRate: 0.3, biomeKeywords: ["snow", "ice", "frozen", "cold"] },
  { species: "floette", formId: "pink", wildRate: 0.3, biomeKeywords: ["cherry", "flower", "meadow"] },
  { species: "florges", formId: "blue", wildRate: 0.3, biomeKeywords: ["ocean", "river", "cold"] },
  { species: "florges", formId: "orange", wildRate: 0.3, biomeKeywords: ["savanna", "desert", "mesa"] },
  { species: "florges", formId: "yellow", wildRate: 0.3, biomeKeywords: ["plains", "meadow", "flower"] },
  { species: "florges", formId: "white", wildRate: 0.3, biomeKeywords: ["snow", "ice", "frozen", "cold"] },
  { species: "florges", formId: "pink", wildRate: 0.3, biomeKeywords: ["cherry", "flower", "meadow"] },
  { species: "furfrou", formId: "heart", wildRate: 0.2, biomeKeywords: ["plains", "meadow", "village"] },
  { species: "furfrou", formId: "star", wildRate: 0.2, biomeKeywords: ["plains", "meadow"] },
  { species: "furfrou", formId: "diamond", wildRate: 0.2, biomeKeywords: ["plains", "village"] },
  { species: "furfrou", formId: "debutante", wildRate: 0.2, biomeKeywords: ["meadow", "village"] },
  { species: "furfrou", formId: "matron", wildRate: 0.2, biomeKeywords: ["plains", "village"] },
  { species: "furfrou", formId: "dandy", wildRate: 0.2, biomeKeywords: ["meadow", "plains"] },
  { species: "furfrou", formId: "lareine", wildRate: 0.2, biomeKeywords: ["meadow", "village"] },
  { species: "furfrou", formId: "kabuki", wildRate: 0.2, biomeKeywords: ["village", "plains"] },
  { species: "furfrou", formId: "pharaoh", wildRate: 0.2, biomeKeywords: ["plains", "desert", "village"] },
  { species: "furfrou", formId: "matcha", wildRate: 0.2, biomeKeywords: ["meadow", "plains"] },
  { species: "furfrou", formId: "lavender", wildRate: 0.2, biomeKeywords: ["meadow", "flower", "village"] },
  { species: "furfrou", formId: "cinnamon", wildRate: 0.2, biomeKeywords: ["plains", "meadow"] },
  { species: "furfrou", formId: "crusader", wildRate: 0.2, biomeKeywords: ["plains", "village"] },
  { species: "furfrou", formId: "rocker", wildRate: 0.2, biomeKeywords: ["village", "meadow"] },
  { species: "furfrou", formId: "mourner", wildRate: 0.2, biomeKeywords: ["plains", "dark", "village"] },
  { species: "pumpkaboo", formId: "small", wildRate: 0.25, biomeKeywords: ["forest", "dark"] },
  { species: "pumpkaboo", formId: "large", wildRate: 0.25, biomeKeywords: ["forest", "dark"] },
  { species: "pumpkaboo", formId: "super", wildRate: 0.15, biomeKeywords: ["forest", "dark"] },
  { species: "gourgeist", formId: "small", wildRate: 0.25, biomeKeywords: ["forest", "dark"] },
  { species: "gourgeist", formId: "large", wildRate: 0.25, biomeKeywords: ["forest", "dark"] },
  { species: "gourgeist", formId: "super", wildRate: 0.15, biomeKeywords: ["forest", "dark"] },
  { species: "lycanroc", formId: "midnight", wildRate: 0.35, biomeKeywords: ["desert", "savanna", "badlands", "mesa"] },
  { species: "lycanroc", formId: "dusk", wildRate: 0.2, biomeKeywords: ["desert", "savanna", "beach"] },
  { species: "wishiwashi", formId: "school", wildRate: 0, biomeKeywords: ["ocean", "beach", "river"] },
  { species: "minior", formId: "meteor", wildRate: 1, biomeKeywords: ["mountain", "peak", "sky"] },
  { species: "minior", formId: "orange", wildRate: 0, biomeKeywords: ["mountain", "peak"] },
  { species: "minior", formId: "yellow", wildRate: 0, biomeKeywords: ["mountain", "peak"] },
  { species: "minior", formId: "green", wildRate: 0, biomeKeywords: ["mountain", "peak"] },
  { species: "minior", formId: "blue", wildRate: 0, biomeKeywords: ["mountain", "peak"] },
  { species: "minior", formId: "indigo", wildRate: 0, biomeKeywords: ["mountain", "peak"] },
  { species: "minior", formId: "violet", wildRate: 0, biomeKeywords: ["mountain", "peak"] },
  { species: "toxtricity", formId: "lowkey", wildRate: 0.45, biomeKeywords: ["swamp", "dark", "forest", "plains"] },
  { species: "sinistea", formId: "antique", wildRate: 0.01, biomeKeywords: ["plains", "village", "dark", "forest"] },
  { species: "polteageist", formId: "antique", wildRate: 0.01, biomeKeywords: ["plains", "village", "dark", "forest"] },
  { species: "indeedee", formId: "female", wildRate: 0.5, biomeKeywords: ["plains", "meadow", "village", "forest"] },
  { species: "morpeko", formId: "hangry", wildRate: 0, biomeKeywords: ["plains", "savanna", "dark"] },
  { species: "eiscue", formId: "noice", wildRate: 0, biomeKeywords: ["beach", "ocean", "plains"] },
  { species: "alcremie", formId: "ruby", wildRate: 0.2, biomeKeywords: ["nether", "cherry", "flower"] },
  { species: "alcremie", formId: "matcha", wildRate: 0.2, biomeKeywords: ["forest", "jungle", "taiga"] },
  { species: "alcremie", formId: "mint", wildRate: 0.2, biomeKeywords: ["ocean", "river", "cold"] },
  { species: "alcremie", formId: "lemon", wildRate: 0.2, biomeKeywords: ["plains", "meadow", "savanna"] },
  { species: "alcremie", formId: "salted", wildRate: 0.2, biomeKeywords: ["beach", "snow", "ice"] },
  { species: "alcremie", formId: "caramel", wildRate: 0.2, biomeKeywords: ["savanna", "desert", "mesa"] },
  { species: "alcremie", formId: "rubyswirl", wildRate: 0.15, biomeKeywords: ["nether", "cherry"] },
  { species: "alcremie", formId: "rainbowswirl", wildRate: 0.12, biomeKeywords: ["flower", "meadow", "end"] },
  { species: "alcremie", formId: "berry", wildRate: 0.18, biomeKeywords: ["forest", "taiga", "grove"] },
  { species: "alcremie", formId: "clover", wildRate: 0.18, biomeKeywords: ["plains", "meadow", "forest"] },
  { species: "alcremie", formId: "flower", wildRate: 0.18, biomeKeywords: ["flower", "meadow", "cherry"] },
  { species: "alcremie", formId: "love", wildRate: 0.18, biomeKeywords: ["cherry", "flower", "meadow"] },
  { species: "alcremie", formId: "ribbon", wildRate: 0.18, biomeKeywords: ["village", "plains", "meadow"] },
  { species: "alcremie", formId: "star", wildRate: 0.18, biomeKeywords: ["end", "mountain", "sky"] },
  { species: "alcremie", formId: "ruby_berry", wildRate: 0.12, biomeKeywords: ["nether", "cherry", "flower", "forest"] },
  { species: "alcremie", formId: "matcha_berry", wildRate: 0.12, biomeKeywords: ["forest", "jungle", "taiga", "grove"] },
  { species: "alcremie", formId: "mint_berry", wildRate: 0.12, biomeKeywords: ["ocean", "river", "cold", "forest"] },
  { species: "alcremie", formId: "lemon_berry", wildRate: 0.12, biomeKeywords: ["plains", "meadow", "savanna", "forest"] },
  { species: "alcremie", formId: "salted_berry", wildRate: 0.12, biomeKeywords: ["beach", "snow", "ice", "forest"] },
  { species: "alcremie", formId: "caramel_berry", wildRate: 0.12, biomeKeywords: ["savanna", "desert", "mesa", "forest"] },
  { species: "alcremie", formId: "rubyswirl_berry", wildRate: 0.1, biomeKeywords: ["nether", "cherry", "forest"] },
  { species: "alcremie", formId: "rainbowswirl_berry", wildRate: 0.08, biomeKeywords: ["flower", "meadow", "end", "forest"] },
  { species: "alcremie", formId: "ruby_clover", wildRate: 0.12, biomeKeywords: ["nether", "cherry", "flower", "plains"] },
  { species: "alcremie", formId: "matcha_clover", wildRate: 0.12, biomeKeywords: ["forest", "jungle", "taiga", "meadow"] },
  { species: "alcremie", formId: "mint_clover", wildRate: 0.12, biomeKeywords: ["ocean", "river", "cold", "plains"] },
  { species: "alcremie", formId: "lemon_clover", wildRate: 0.12, biomeKeywords: ["plains", "meadow", "savanna"] },
  { species: "alcremie", formId: "salted_clover", wildRate: 0.12, biomeKeywords: ["beach", "snow", "ice", "plains"] },
  { species: "alcremie", formId: "caramel_clover", wildRate: 0.12, biomeKeywords: ["savanna", "desert", "mesa", "meadow"] },
  { species: "alcremie", formId: "rubyswirl_clover", wildRate: 0.1, biomeKeywords: ["nether", "cherry", "plains"] },
  { species: "alcremie", formId: "rainbowswirl_clover", wildRate: 0.08, biomeKeywords: ["flower", "meadow", "end", "plains"] },
  { species: "alcremie", formId: "ruby_flower", wildRate: 0.12, biomeKeywords: ["nether", "cherry", "flower", "meadow"] },
  { species: "alcremie", formId: "matcha_flower", wildRate: 0.12, biomeKeywords: ["forest", "jungle", "taiga", "flower"] },
  { species: "alcremie", formId: "mint_flower", wildRate: 0.12, biomeKeywords: ["ocean", "river", "cold", "flower"] },
  { species: "alcremie", formId: "lemon_flower", wildRate: 0.12, biomeKeywords: ["plains", "meadow", "savanna", "flower"] },
  { species: "alcremie", formId: "salted_flower", wildRate: 0.12, biomeKeywords: ["beach", "snow", "ice", "flower"] },
  { species: "alcremie", formId: "caramel_flower", wildRate: 0.12, biomeKeywords: ["savanna", "desert", "mesa", "flower"] },
  { species: "alcremie", formId: "rubyswirl_flower", wildRate: 0.1, biomeKeywords: ["nether", "cherry", "flower"] },
  { species: "alcremie", formId: "rainbowswirl_flower", wildRate: 0.08, biomeKeywords: ["flower", "meadow", "end", "cherry"] },
  { species: "alcremie", formId: "ruby_love", wildRate: 0.12, biomeKeywords: ["nether", "cherry", "flower", "meadow"] },
  { species: "alcremie", formId: "matcha_love", wildRate: 0.12, biomeKeywords: ["forest", "jungle", "taiga", "cherry"] },
  { species: "alcremie", formId: "mint_love", wildRate: 0.12, biomeKeywords: ["ocean", "river", "cold", "cherry"] },
  { species: "alcremie", formId: "lemon_love", wildRate: 0.12, biomeKeywords: ["plains", "meadow", "savanna", "cherry"] },
  { species: "alcremie", formId: "salted_love", wildRate: 0.12, biomeKeywords: ["beach", "snow", "ice", "cherry"] },
  { species: "alcremie", formId: "caramel_love", wildRate: 0.12, biomeKeywords: ["savanna", "desert", "mesa", "cherry"] },
  { species: "alcremie", formId: "rubyswirl_love", wildRate: 0.1, biomeKeywords: ["nether", "cherry", "flower"] },
  { species: "alcremie", formId: "rainbowswirl_love", wildRate: 0.08, biomeKeywords: ["flower", "meadow", "end", "cherry"] },
  { species: "alcremie", formId: "ruby_ribbon", wildRate: 0.12, biomeKeywords: ["nether", "cherry", "flower", "village"] },
  { species: "alcremie", formId: "matcha_ribbon", wildRate: 0.12, biomeKeywords: ["forest", "jungle", "taiga", "village"] },
  { species: "alcremie", formId: "mint_ribbon", wildRate: 0.12, biomeKeywords: ["ocean", "river", "cold", "village"] },
  { species: "alcremie", formId: "lemon_ribbon", wildRate: 0.12, biomeKeywords: ["plains", "meadow", "savanna", "village"] },
  { species: "alcremie", formId: "salted_ribbon", wildRate: 0.12, biomeKeywords: ["beach", "snow", "ice", "village"] },
  { species: "alcremie", formId: "caramel_ribbon", wildRate: 0.12, biomeKeywords: ["savanna", "desert", "mesa", "village"] },
  { species: "alcremie", formId: "rubyswirl_ribbon", wildRate: 0.1, biomeKeywords: ["nether", "cherry", "village"] },
  { species: "alcremie", formId: "rainbowswirl_ribbon", wildRate: 0.08, biomeKeywords: ["flower", "meadow", "end", "village"] },
  { species: "alcremie", formId: "ruby_star", wildRate: 0.12, biomeKeywords: ["nether", "cherry", "flower", "end"] },
  { species: "alcremie", formId: "matcha_star", wildRate: 0.12, biomeKeywords: ["forest", "jungle", "taiga", "mountain"] },
  { species: "alcremie", formId: "mint_star", wildRate: 0.12, biomeKeywords: ["ocean", "river", "cold", "sky"] },
  { species: "alcremie", formId: "lemon_star", wildRate: 0.12, biomeKeywords: ["plains", "meadow", "savanna", "mountain"] },
  { species: "alcremie", formId: "salted_star", wildRate: 0.12, biomeKeywords: ["beach", "snow", "ice", "sky"] },
  { species: "alcremie", formId: "caramel_star", wildRate: 0.12, biomeKeywords: ["savanna", "desert", "mesa", "mountain"] },
  { species: "alcremie", formId: "rubyswirl_star", wildRate: 0.1, biomeKeywords: ["nether", "cherry", "end"] },
  { species: "alcremie", formId: "rainbowswirl_star", wildRate: 0.08, biomeKeywords: ["flower", "meadow", "end", "sky"] },
  { species: "maushold", formId: "three", wildRate: 0.35, biomeKeywords: ["plains", "village", "forest"] },
  { species: "squawkabilly", formId: "blue", wildRate: 0.25, biomeKeywords: ["beach", "ocean", "jungle"] },
  { species: "squawkabilly", formId: "yellow", wildRate: 0.25, biomeKeywords: ["savanna", "desert", "plains"] },
  { species: "squawkabilly", formId: "white", wildRate: 0.25, biomeKeywords: ["mountain", "snow", "village"] },
  { species: "palafin", formId: "hero", wildRate: 0, biomeKeywords: ["ocean", "beach", "river"] },
  { species: "tatsugiri", formId: "droopy", wildRate: 0.33, biomeKeywords: ["ocean", "river", "beach"] },
  { species: "tatsugiri", formId: "stretchy", wildRate: 0.33, biomeKeywords: ["ocean", "warm", "jungle"] },
  { species: "dudunsparce", formId: "three_segment", wildRate: 0.2, biomeKeywords: ["plains", "forest", "cave"] },
  { species: "poltchageist", formId: "artisan", wildRate: 0.25, biomeKeywords: ["forest", "mountain", "cherry", "village"] },
  { species: "sinistcha", formId: "masterpiece", wildRate: 0.2, biomeKeywords: ["forest", "mountain", "cherry", "village"] }
];
var ASPECT_FORMS = [{ "formId": "alola_bias", "aspect": "region-bias-alola", "labelEs": "Tendencia a Alola", "species": ["cubone", "exeggcute", "pichu", "pikachu"] }, { "formId": "galar_bias", "aspect": "region-bias-galar", "labelEs": "Tendencia a Galar", "species": ["koffing", "mimejr"] }, { "formId": "hisui_bias", "aspect": "region-bias-hisui", "labelEs": "Tendencia a Hisui", "species": ["bergmite", "cyndaquil", "dartrix", "dewott", "goomy", "oshawott", "petilil", "quilava", "rowlet", "rufflet"] }];
var ASPECT_FORM_BY_ID = {};
for (const form of ASPECT_FORMS) ASPECT_FORM_BY_ID[form.formId] = form;
var REGIONAL_FORMS_BY_SPECIES = {};
for (const form of REGIONAL_FORMS) {
  (REGIONAL_FORMS_BY_SPECIES[form.species] ??= []).push(form);
}

// tools/kit/kit.ts
import { spawnSync } from "node:child_process";

// tools/lib/png.ts
import { deflateSync, inflateSync } from "node:zlib";
var SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}
function decodePng(buffer) {
  if (!buffer.subarray(0, 8).equals(SIGNATURE)) throw new Error("no es un PNG");
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  let palette = null;
  let alphaTable = null;
  const idat = [];
  for (let pos = 8; pos < buffer.length; ) {
    const length = buffer.readUInt32BE(pos);
    const type = buffer.toString("ascii", pos + 4, pos + 8);
    const data = buffer.subarray(pos + 8, pos + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === "PLTE") palette = data;
    else if (type === "tRNS") alphaTable = data;
    else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    pos += 12 + length;
  }
  if (interlace !== 0) {
    throw new Error(`PNG no soportado (entrelazado ${interlace})`);
  }
  if (![1, 2, 4, 8].includes(bitDepth)) {
    throw new Error(`PNG no soportado (profundidad ${bitDepth})`);
  }
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType];
  if (!channels) throw new Error(`PNG no soportado (tipo de color ${colorType})`);
  const raw = inflateSync(Buffer.concat(idat));
  const stride = bitDepth === 8 ? width * channels : Math.ceil(width * channels * bitDepth / 8);
  const pixels = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const src = y * (stride + 1) + 1;
    const dst = y * stride;
    const paso = bitDepth === 8 ? channels : 1;
    for (let x = 0; x < stride; x++) {
      const value = raw[src + x];
      const left = x >= paso ? pixels[dst + x - paso] : 0;
      const up = y > 0 ? pixels[dst - stride + x] : 0;
      const upLeft = y > 0 && x >= paso ? pixels[dst - stride + x - paso] : 0;
      let out = value;
      if (filter === 1) out = value + left;
      else if (filter === 2) out = value + up;
      else if (filter === 3) out = value + (left + up >> 1);
      else if (filter === 4) out = value + paeth(left, up, upLeft);
      pixels[dst + x] = out & 255;
    }
  }
  const muestras = bitDepth === 8 ? pixels : (() => {
    const out = Buffer.alloc(width * height * channels);
    const porByte = 8 / bitDepth;
    const mascara = (1 << bitDepth) - 1;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width * channels; x++) {
        const byte = pixels[y * stride + Math.floor(x / porByte)];
        const desplazamiento = 8 - bitDepth * (x % porByte + 1);
        out[y * width * channels + x] = byte >> desplazamiento & mascara;
      }
    }
    return out;
  })();
  const rgba = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const o = i * 4;
    if (colorType === 6) {
      rgba.set(muestras.subarray(i * 4, i * 4 + 4), o);
    } else if (colorType === 2) {
      rgba.set(muestras.subarray(i * 3, i * 3 + 3), o);
      rgba[o + 3] = 255;
    } else if (colorType === 3) {
      const index = muestras[i];
      rgba[o] = palette?.[index * 3] ?? 0;
      rgba[o + 1] = palette?.[index * 3 + 1] ?? 0;
      rgba[o + 2] = palette?.[index * 3 + 2] ?? 0;
      rgba[o + 3] = alphaTable && index < alphaTable.length ? alphaTable[index] : 255;
    } else {
      const crudo = muestras[i * channels];
      const gray = bitDepth === 8 ? crudo : Math.round(crudo * 255 / ((1 << bitDepth) - 1));
      rgba[o] = rgba[o + 1] = rgba[o + 2] = gray;
      rgba[o + 3] = colorType === 4 ? muestras[i * 2 + 1] : 255;
    }
  }
  return { width, height, data: rgba };
}
function crc32(buf) {
  let crc = 4294967295;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) crc = crc >>> 1 ^ (crc & 1 ? 3988292384 : 0);
  }
  return (crc ^ 4294967295) >>> 0;
}
function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc32(body), 8 + data.length);
  return out;
}
function encodePng(image) {
  const { width, height, data } = image;
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    Buffer.from(data.buffer, data.byteOffset + y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    SIGNATURE,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

// tools/lib/glyph-page.ts
function glyphPage(faces) {
  const CELL = 16;
  const side = CELL * 16;
  const page = { width: side, height: side, data: Buffer.alloc(side * side * 4) };
  faces.forEach((face, index) => {
    let x0 = face.width, y0 = face.height, x1 = -1, y1 = -1;
    for (let y = 0; y < face.height; y++) {
      for (let x = 0; x < face.width; x++) {
        if (face.data[(y * face.width + x) * 4 + 3] === 0) continue;
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x);
        y1 = Math.max(y1, y);
      }
    }
    if (x1 < 0) return;
    const w = x1 - x0 + 1;
    const h = y1 - y0 + 1;
    const scale = Math.min(CELL / w, CELL / h);
    const ow = Math.max(1, Math.round(w * scale));
    const oh = Math.max(1, Math.round(h * scale));
    const cx = index % 16 * CELL + Math.floor((CELL - ow) / 2);
    const cy = Math.floor(index / 16) * CELL + Math.floor((CELL - oh) / 2);
    for (let y = 0; y < oh; y++) {
      for (let x = 0; x < ow; x++) {
        const sx = x0 + Math.min(w - 1, Math.floor(x / scale));
        const sy = y0 + Math.min(h - 1, Math.floor(y / scale));
        const s = (sy * face.width + sx) * 4;
        if (face.data[s + 3] === 0) continue;
        const d = ((cy + y) * side + cx + x) * 4;
        page.data[d] = face.data[s];
        page.data[d + 1] = face.data[s + 1];
        page.data[d + 2] = face.data[s + 2];
        page.data[d + 3] = face.data[s + 3];
      }
    }
  });
  return page;
}

// tools/lib/dex-sprite-passes.ts
function frame(pxPerBlock, w, h, originX, originY) {
  return { cx: (w / 2 - originX) / pxPerBlock, cy: (originY - h / 2) / pxPerBlock, halfH: h / 2 / pxPerBlock };
}
var DEX_PASSES = {
  // Casilla: recorte (x+1, y+1)–(x+24, y+23); origen en (x+12,5, y+1).
  icon: { width: 92, height: 88, yaw: 145, still: true, frame: frame(11.25, 23, 22, 11.5, 0) },
  // Recuadro (pX+1, pY+25) de 137×68; origen en (pX+69,5, pY+13).
  portrait: { width: 274, height: 136, yaw: 150, still: true, frame: frame(40, 137, 68, 68.5, -12) },
  // Recuadro (pX+1, pY) de 137×42; pies en (pX+50, pY+39,5).
  size: {
    width: 274,
    height: 84,
    yaw: 180,
    pitch: 0,
    still: true,
    none: true,
    silhouette: true,
    frame: frame(7.5, 137, 42, 49, 39.5)
  }
};

// tools/lib/anim-sample.ts
function evalMolang(expr, t) {
  const src = expr.toLowerCase().replace(/\s+/g, "");
  let i = 0;
  const peek = () => src[i] ?? "";
  const number = () => {
    const m = /^\d*\.?\d+(?:e[+-]?\d+)?/.exec(src.slice(i));
    if (!m) throw new Error(`n\xFAmero en ${i}`);
    i += m[0].length;
    return Number(m[0]);
  };
  const ident = () => {
    const m = /^[a-z_][a-z0-9_.]*/.exec(src.slice(i));
    if (!m) throw new Error(`nombre en ${i}`);
    i += m[0].length;
    return m[0];
  };
  const args = () => {
    const out = [];
    i++;
    if (peek() === ")") {
      i++;
      return out;
    }
    for (; ; ) {
      out.push(expr0());
      if (peek() === ",") i++;
      else break;
    }
    i++;
    return out;
  };
  const RAD = Math.PI / 180;
  const call = (name, a) => {
    switch (name.replace(/^math\./, "")) {
      case "sin":
        return Math.sin((a[0] ?? 0) * RAD);
      case "cos":
        return Math.cos((a[0] ?? 0) * RAD);
      case "abs":
        return Math.abs(a[0] ?? 0);
      case "min":
        return Math.min(a[0] ?? 0, a[1] ?? 0);
      case "max":
        return Math.max(a[0] ?? 0, a[1] ?? 0);
      case "clamp":
        return Math.min(Math.max(a[0] ?? 0, a[1] ?? 0), a[2] ?? 0);
      case "pow":
        return Math.pow(a[0] ?? 0, a[1] ?? 0);
      case "sqrt":
        return Math.sqrt(a[0] ?? 0);
      case "lerp":
        return (a[0] ?? 0) + ((a[1] ?? 0) - (a[0] ?? 0)) * (a[2] ?? 0);
      case "mod":
        return (a[0] ?? 0) % (a[1] || 1);
      case "floor":
        return Math.floor(a[0] ?? 0);
      case "round":
        return Math.round(a[0] ?? 0);
      default:
        return 0;
    }
  };
  const atom = () => {
    const c = peek();
    if (c === "(") {
      i++;
      const v = expr0();
      i++;
      return v;
    }
    if (c === "-") {
      i++;
      return -atom();
    }
    if (c === "+") {
      i++;
      return atom();
    }
    if (/[\d.]/.test(c)) return number();
    const name = ident();
    if (peek() === "(") return call(name, args());
    if (name === "q.anim_time" || name === "query.anim_time") return t;
    if (name === "this") return 0;
    return 0;
  };
  const term = () => {
    let v = atom();
    for (; ; ) {
      const c = peek();
      if (c === "*") {
        i++;
        v *= atom();
      } else if (c === "/") {
        i++;
        const d = atom();
        v = d === 0 ? 0 : v / d;
      } else return v;
    }
  };
  const expr0 = () => {
    let v = term();
    for (; ; ) {
      const c = peek();
      if (c === "+") {
        i++;
        v += term();
      } else if (c === "-") {
        i++;
        v -= term();
      } else return v;
    }
  };
  try {
    const v = expr0();
    return Number.isFinite(v) ? v : 0;
  } catch {
    return 0;
  }
}
function scalar(value, t) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return evalMolang(value, t);
  return 0;
}
function vec(value, t) {
  if (Array.isArray(value)) return [scalar(value[0], t), scalar(value[1], t), scalar(value[2], t)];
  const s = scalar(value, t);
  return [s, s, s];
}
function channel(raw, t) {
  if (raw === void 0 || raw === null) return [0, 0, 0];
  if (typeof raw !== "object" || Array.isArray(raw)) return vec(raw, t);
  const frames = Object.entries(raw).map(([k, v]) => {
    const val = v && typeof v === "object" && !Array.isArray(v) ? v.post ?? v.pre : v;
    return [Number(k), val];
  }).filter(([k]) => Number.isFinite(k)).sort((a, b) => a[0] - b[0]);
  if (frames.length === 0) return [0, 0, 0];
  if (t <= frames[0][0]) return vec(frames[0][1], t);
  for (let k = 1; k < frames.length; k++) {
    const [t1, v1] = frames[k];
    if (t <= t1) {
      const [t0, v0] = frames[k - 1];
      const a = vec(v0, t);
      const b = vec(v1, t);
      const f = t1 === t0 ? 1 : (t - t0) / (t1 - t0);
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
    }
  }
  return vec(frames[frames.length - 1][1], t);
}
function rotateAround(p, pivot, r) {
  const RAD = Math.PI / 180;
  let [x, y, z] = [p[0] - pivot[0], p[1] - pivot[1], p[2] - pivot[2]];
  const [rx, ry, rz] = [r[0] * RAD, r[1] * RAD, r[2] * RAD];
  [y, z] = [y * Math.cos(rx) + z * Math.sin(rx), -y * Math.sin(rx) + z * Math.cos(rx)];
  [x, z] = [x * Math.cos(ry) + z * Math.sin(ry), -x * Math.sin(ry) + z * Math.cos(ry)];
  [x, y] = [x * Math.cos(rz) - y * Math.sin(rz), x * Math.sin(rz) + y * Math.cos(rz)];
  return [x + pivot[0], y + pivot[1], z + pivot[2]];
}
function locatorHeights(geo, locator, animation) {
  const bones = geo?.["minecraft:geometry"]?.[0]?.bones ?? [];
  const byName = new Map(bones.map((b) => [b.name, b]));
  const owner = bones.find((b) => b.locators && locator in b.locators);
  if (!owner || !animation?.bones) return [];
  const raw = owner.locators[locator];
  const base = Array.isArray(raw) ? raw : raw?.offset;
  if (!base) return [];
  const chain = [];
  for (let b = owner; b; b = b.parent ? byName.get(b.parent) : void 0) chain.push(b);
  const length = Math.max(0.05, Math.min(10, animation.animation_length ?? 4));
  const out = [];
  for (let t = 0; t <= length + 1e-6; t += 0.05) {
    let p = [base[0], base[1], base[2]];
    for (const bone of chain) {
      const anim = animation.bones[bone.name];
      if (!anim) continue;
      const pivot = bone.pivot ?? [0, 0, 0];
      p = rotateAround(p, pivot, channel(anim["rotation"], t));
      const move = channel(anim["position"], t);
      p = [p[0] + move[0], p[1] + move[1], p[2] + move[2]];
    }
    out.push(p[1] - base[1]);
  }
  return out;
}

// bp/src/pokemon/rideSpeed.ts
var SPEED_SCALES = {
  // `q.get_ride_stats('SPEED', 'LAND', 1.2, 0.1)`: ya por tick.
  "land/horse": [0.1, 1.2],
  "land/vehicle": [0.3, 1],
  // Los aéreos y acuáticos dan bloques por segundo: entre 20.
  "air/bird": [4 / 20, 20 / 20],
  "air/hover": [1 / 20, 20 / 20],
  "air/jet": [4 / 20, 24 / 20],
  "air/rocket": [0.1, 0.5],
  "liquid/dolphin": [2 / 20, 24 / 20],
  "liquid/submarine": [2 / 20, 12 / 20],
  "liquid/boat": [0.08, 0.75]
};
var DEFAULT_KIND = {
  LAND: "land/horse",
  AIR: "air/bird",
  LIQUID: "liquid/dolphin"
};
var BEDROCK_BLOCKS_PER_TICK = 2.16;
function modTopSpeed(style, kind, speedStat) {
  const key = (kind ?? "").replace(/^cobblemon:/, "");
  const [min, max] = SPEED_SCALES[key] ?? SPEED_SCALES[DEFAULT_KIND[style]];
  const s = Math.max(0, Math.min(100, speedStat));
  return min + (max - min) * s / 100;
}
function bedrockRideSpeed(style, kind, speedStat) {
  return Number((modTopSpeed(style, kind, speedStat) / BEDROCK_BLOCKS_PER_TICK).toFixed(4));
}

// tools/kit/items.ts
import { existsSync as existsSync5 } from "node:fs";
import { mkdir, readdir as readdir5, readFile as readFile6, writeFile as writeFile3 } from "node:fs/promises";
import path6 from "node:path";

// tools/lib/java-recipes.ts
var MAX_VARIANTS = 8;
var TAG_ITEM = {
  "c:ingots/iron": "minecraft:iron_ingot",
  "c:ingots/copper": "minecraft:copper_ingot",
  "c:ingots/gold": "minecraft:gold_ingot",
  "c:ingots/netherite": "minecraft:netherite_ingot",
  "c:nuggets/iron": "minecraft:iron_nugget",
  "c:nuggets/gold": "minecraft:gold_nugget",
  "c:gems/diamond": "minecraft:diamond",
  "c:gems/amethyst": "minecraft:amethyst_shard",
  "c:gems/quartz": "minecraft:quartz",
  "c:gems/lapis": "minecraft:lapis_lazuli",
  "c:gems/emerald": "minecraft:emerald",
  "c:dusts/redstone": "minecraft:redstone",
  "c:dusts/glowstone": "minecraft:glowstone_dust",
  "c:strings": "minecraft:string",
  "c:leathers": "minecraft:leather",
  "c:slime_balls": "minecraft:slime_ball",
  "c:rods/wooden": "minecraft:stick",
  "c:rods/blaze": "minecraft:blaze_rod",
  "c:storage_blocks/iron": "minecraft:iron_block",
  "c:raw_materials/gold": "minecraft:raw_gold",
  "c:tools/shield": "minecraft:shield",
  "c:feathers": "minecraft:feather",
  "c:bones": "minecraft:bone",
  "minecraft:enchantable/fishing": "minecraft:fishing_rod",
  "minecraft:coals": "minecraft:coal",
  "c:seeds": "minecraft:wheat_seeds",
  "c:bricks/normal": "minecraft:brick",
  "c:dyes/red": "minecraft:red_dye",
  "c:gems/prismarine": "minecraft:prismarine_shard",
  "c:buckets/empty": "minecraft:bucket",
  "c:fertilizers": "minecraft:bone_meal",
  "c:chests/wooden": "minecraft:chest",
  // Materiales de ball por nivel: la etiqueta apunta a otra etiqueta.
  "cobblemon:tier_1_poke_ball_materials": "minecraft:copper_ingot",
  "cobblemon:tier_2_poke_ball_materials": "minecraft:iron_ingot",
  "cobblemon:tier_3_poke_ball_materials": "minecraft:gold_ingot",
  "cobblemon:tier_4_poke_ball_materials": "minecraft:diamond"
};
var TAG_FAMILY = {
  "minecraft:wool": [
    "minecraft:white_wool",
    "minecraft:light_gray_wool",
    "minecraft:gray_wool",
    "minecraft:black_wool",
    "minecraft:red_wool",
    "minecraft:blue_wool",
    "minecraft:green_wool",
    "minecraft:yellow_wool"
  ],
  "c:concretes": [
    "minecraft:white_concrete",
    "minecraft:light_gray_concrete",
    "minecraft:gray_concrete",
    "minecraft:black_concrete",
    "minecraft:red_concrete",
    "minecraft:blue_concrete",
    "minecraft:green_concrete",
    "minecraft:yellow_concrete"
  ],
  "minecraft:buttons": [
    "minecraft:wooden_button",
    "minecraft:spruce_button",
    "minecraft:birch_button",
    "minecraft:stone_button"
  ],
  "cobblemon:apricorns": [
    "cooblemon:black_apricorn",
    "cooblemon:blue_apricorn",
    "cooblemon:green_apricorn",
    "cooblemon:pink_apricorn",
    "cooblemon:red_apricorn",
    "cooblemon:white_apricorn",
    "cooblemon:yellow_apricorn"
  ],
  "cobblemon:apples": ["cooblemon:tart_apple", "cooblemon:sweet_apple", "cooblemon:syrupy_apple"],
  "c:chains": ["minecraft:chain"],
  "minecraft:wooden_slabs": [
    "minecraft:oak_slab",
    "minecraft:spruce_slab",
    "minecraft:birch_slab",
    "minecraft:jungle_slab"
  ],
  // El zumo sale de cualquier baya; se dejan las cinco de siempre para no
  // llenar el recetario con setenta entradas iguales.
  "cobblemon:berries": [
    "cooblemon:oran_berry",
    "cooblemon:cheri_berry",
    "cooblemon:chesto_berry",
    "cooblemon:pecha_berry",
    "cooblemon:rawst_berry"
  ]
};
var BEDROCK_NAME = {
  "minecraft:oak_button": "minecraft:wooden_button",
  "minecraft:note_block": "minecraft:noteblock",
  "minecraft:magma_block": "minecraft:magma",
  "minecraft:melon": "minecraft:melon_block",
  // El marco luminoso: Java lo llama `glow_item_frame` y Bedrock `glow_frame`.
  // Con el nombre de Java la receta se rechazaba dos veces —ingrediente
  // inválido y resultado malformado— y el polvo brillo no servía para nada.
  "minecraft:glow_item_frame": "minecraft:glow_frame",
  // Y el marco normal es `frame` a secas, pese a que su receta vanilla se llame
  // `item_frame.json`: el nombre del fichero no es el del objeto.
  "minecraft:item_frame": "minecraft:frame"
};
function portId(id) {
  const ported = id.startsWith("cobblemon:") ? `cooblemon:${id.slice("cobblemon:".length)}` : id;
  return BEDROCK_NAME[ported] ?? ported;
}
function resolveIngredient(ingredient, ctx) {
  const first = Array.isArray(ingredient) ? ingredient[0] : ingredient;
  if (!first) return null;
  if (first.item) {
    const id = portId(first.item);
    if (!ctx.isKnown(id)) return null;
    return [id];
  }
  const tag = first.tag?.replace(/^#/, "");
  if (!tag) return null;
  const single = TAG_ITEM[tag];
  if (single) return [portId(single)];
  const family = TAG_FAMILY[tag] ?? ctx.extraFamilies?.[tag];
  if (family) {
    const usable = family.map((id) => portId(id)).filter((id) => ctx.isKnown(id));
    return usable.length > 0 ? usable.slice(0, MAX_VARIANTS) : null;
  }
  return null;
}
var STATION = {
  "minecraft:crafting_shaped": ["crafting_table"],
  "minecraft:crafting_shapeless": ["crafting_table"],
  "minecraft:smelting": ["furnace"],
  "minecraft:blasting": ["blast_furnace"],
  "minecraft:smoking": ["smoker"],
  "minecraft:campfire_cooking": ["campfire", "soul_campfire"],
  "minecraft:stonecutting": ["stonecutter"],
  "minecraft:smithing_transform": ["smithing_table"],
  // El soporte de pociones de Bedrock no admite estos objetos; va a la olla.
  "cobblemon:brewing_stand": ["cooblemon:campfire_pot"]
};
function convertRecipe(recipe, stem, resultId, count, ctx, idPrefix) {
  const type = recipe.type ?? "";
  const tags = STATION[type];
  if (!tags) return null;
  const identifier = (suffix) => `${idPrefix}${stem}${suffix}`;
  const result = { item: resultId, count };
  if (type === "minecraft:crafting_shaped") {
    const pattern = recipe.pattern ?? [];
    const keys = Object.entries(recipe.key ?? {});
    const resolved = [];
    for (const [letter, ingredient] of keys) {
      const items = resolveIngredient(ingredient, ctx);
      if (!items) return null;
      resolved.push([letter, items]);
    }
    const variantIndex = resolved.findIndex(([, items]) => items.length > 1);
    const variants = variantIndex >= 0 ? resolved[variantIndex][1] : [""];
    return variants.map((variant, i) => {
      const key = {};
      for (const [letter, items] of resolved) {
        key[letter] = { item: variant && letter === resolved[variantIndex][0] ? variant : items[0] };
      }
      return {
        name: `${stem}${i > 0 ? `_${i}` : ""}`,
        json: {
          format_version: "1.20.10",
          "minecraft:recipe_shaped": {
            description: { identifier: identifier(i > 0 ? `_${i}` : "") },
            tags,
            pattern,
            key,
            unlock: { context: "AlwaysUnlocked" },
            result
          }
        }
      };
    });
  }
  if (type === "minecraft:crafting_shapeless") {
    const ingredients = [];
    for (const ingredient of recipe.ingredients ?? []) {
      const items = resolveIngredient(ingredient, ctx);
      if (!items) return null;
      ingredients.push({ item: items[0] });
    }
    if (ingredients.length === 0) return null;
    return [
      {
        name: stem,
        json: {
          format_version: "1.20.10",
          "minecraft:recipe_shapeless": {
            description: { identifier: identifier("") },
            tags,
            ingredients,
            unlock: { context: "AlwaysUnlocked" },
            result
          }
        }
      }
    ];
  }
  if (type === "minecraft:smithing_transform") {
    const base = resolveIngredient(recipe.base ?? {}, ctx);
    const addition = resolveIngredient(recipe.addition ?? {}, ctx);
    const template = recipe.template ? resolveIngredient(recipe.template, ctx) : null;
    if (!base || !addition) return null;
    return [
      {
        name: stem,
        json: {
          format_version: "1.20.10",
          "minecraft:recipe_smithing_transform": {
            description: { identifier: identifier("") },
            tags,
            ...template ? { template: template[0] } : {},
            base: base[0],
            addition: addition[0],
            unlock: { context: "AlwaysUnlocked" },
            result: resultId
          }
        }
      }
    ];
  }
  if (type === "cobblemon:brewing_stand") {
    const abajo = resolveIngredient(recipe.bottle ?? {}, ctx);
    const arriba = resolveIngredient(recipe.input ?? {}, ctx);
    if (!abajo || !arriba) return null;
    return [
      {
        name: stem,
        json: {
          format_version: "1.20.10",
          "minecraft:recipe_shapeless": {
            description: { identifier: identifier("") },
            tags,
            ingredients: [{ item: abajo[0] }, { item: arriba[0] }],
            unlock: { context: "AlwaysUnlocked" },
            result: { item: resultId, count: 1 }
          }
        }
      }
    ];
  }
  if (type === "minecraft:stonecutting") {
    const input2 = resolveIngredient(recipe.ingredients?.[0] ?? recipe.ingredient ?? {}, ctx);
    if (!input2) return null;
    return [
      {
        name: stem,
        json: {
          format_version: "1.20.10",
          "minecraft:recipe_shapeless": {
            description: { identifier: identifier("") },
            tags,
            ingredients: [{ item: input2[0] }],
            unlock: { context: "AlwaysUnlocked" },
            result
          }
        }
      }
    ];
  }
  const input = resolveIngredient(recipe.ingredient ?? recipe.ingredients?.[0] ?? {}, ctx);
  if (!input) return null;
  return [
    {
      name: stem,
      json: {
        format_version: "1.20.10",
        "minecraft:recipe_furnace": {
          description: { identifier: identifier("") },
          tags,
          input: input[0],
          unlock: { context: "AlwaysUnlocked" },
          output: resultId
        }
      }
    }
  ];
}

// tools/kit/items.ts
init_utils();
async function walk(dir) {
  if (!existsSync5(dir)) return [];
  const out = [];
  for (const entry of await readdir5(dir, { withFileTypes: true })) {
    const full = path6.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full));
    else out.push(full);
  }
  return out;
}
async function readJsonOrNull(file) {
  try {
    return JSON.parse(await readFile6(file, "utf8"));
  } catch {
    return null;
  }
}
async function writeJson(file, data) {
  await mkdir(path6.dirname(file), { recursive: true });
  await writeFile3(file, `${JSON.stringify(data, null, 2)}
`, "utf8");
}
function splitRef(ref, fallbackNs) {
  const i = ref.indexOf(":");
  return i < 0 ? { ns: fallbackNs, path: ref } : { ns: ref.slice(0, i), path: ref.slice(i + 1) };
}
async function resolveModel(assets, ns, name) {
  const textures = {};
  let ref = `${ns}:item/${name}`;
  for (let depth = 0; depth < 8; depth++) {
    const { ns: refNs, path: refPath } = splitRef(ref, "minecraft");
    if (refNs !== ns) {
      if (refPath === "builtin/entity") return { kind: "skip", why: "3D model (builtin/entity)" };
      if (refPath.startsWith("block/")) return { kind: "skip", why: `block item (${ref})` };
      if (refPath.startsWith("item/")) return { kind: "flat", handheld: refPath.includes("handheld"), textures };
      return { kind: "skip", why: `unknown parent model "${ref}"` };
    }
    if (refPath.startsWith("block/")) return { kind: "skip", why: `block item (${ref})` };
    const model = await readJsonOrNull(path6.join(assets, "models", `${refPath}.json`));
    if (!model) return { kind: "skip", why: `model "${ref}" not found` };
    if (Array.isArray(model.elements) && model.elements.length) return { kind: "skip", why: "3D model (elements)" };
    for (const [k, v] of Object.entries(model.textures ?? {})) if (!(k in textures)) textures[k] = v;
    if (!model.parent) return { kind: "skip", why: "model without parent" };
    ref = model.parent.includes(":") ? model.parent : `minecraft:${model.parent}`;
  }
  return { kind: "skip", why: "parent chain too deep" };
}
async function composeTexture(assets, ns, textures) {
  const layers = Object.keys(textures).filter((k) => /^layer\d+$/.test(k)).sort((a, b) => Number(a.slice(5)) - Number(b.slice(5)));
  if (layers.length === 0) return "no layer0 texture";
  let out = null;
  for (const layer of layers) {
    const { ns: texNs, path: texPath } = splitRef(textures[layer], "minecraft");
    if (texNs !== ns) return `texture "${textures[layer]}" is not in the addon`;
    const file = path6.join(assets, "textures", `${texPath}.png`);
    if (!existsSync5(file)) return `texture "${textures[layer]}" not found`;
    let img = decodePng(await readFile6(file));
    if (img.height > img.width && img.height % img.width === 0) {
      img = { width: img.width, height: img.width, data: Buffer.from(img.data.subarray(0, img.width * img.width * 4)) };
    }
    if (!out) {
      out = { width: img.width, height: img.height, data: Buffer.from(img.data) };
      continue;
    }
    if (img.width !== out.width || img.height !== out.height) continue;
    for (let i = 0; i < out.data.length; i += 4) {
      const a = img.data[i + 3] / 255;
      if (a === 0) continue;
      for (let c = 0; c < 3; c++) out.data[i + c] = Math.round(img.data[i + c] * a + out.data[i + c] * (1 - a));
      out.data[i + 3] = Math.max(out.data[i + 3], img.data[i + 3]);
    }
  }
  return out;
}
async function baseItemIds() {
  const listed = resolveFromRoot("data/base-item-ids.json");
  if (existsSync5(listed)) return new Set(JSON.parse(await readFile6(listed, "utf8")));
  const ids = /* @__PURE__ */ new Set();
  for (const [dir, root] of [
    ["bp/items", "minecraft:item"],
    ["bp/blocks", "minecraft:block"]
  ]) {
    for (const file of (await walk(resolveFromRoot(dir))).filter((f) => f.endsWith(".json"))) {
      const json = await readJsonOrNull(file);
      const id = json?.[root]?.description?.identifier;
      if (id) ids.add(id);
    }
  }
  return ids.size ? ids : null;
}
async function baseFurnaceInputs() {
  const listed = resolveFromRoot("data/base-furnace-inputs.json");
  if (existsSync5(listed)) return new Set(JSON.parse(await readFile6(listed, "utf8")));
  const keys = /* @__PURE__ */ new Set();
  for (const file of (await walk(resolveFromRoot("bp/recipes"))).filter((f) => f.endsWith(".json"))) {
    for (const key of furnaceKeys(await readJsonOrNull(file))) keys.add(key);
  }
  return keys;
}
function furnaceKeys(json) {
  const body = json?.["minecraft:recipe_furnace"];
  if (!body) return [];
  const input = typeof body.input === "string" ? body.input : body.input?.item;
  return input ? (body.tags ?? []).map((tag) => `${tag}|${input}`) : [];
}
async function addonTags(data, ns) {
  const tags = {};
  for (const folder of ["item", "items"]) {
    const root = path6.join(data, "tags", folder);
    for (const file of (await walk(root)).filter((f) => f.endsWith(".json"))) {
      const json = await readJsonOrNull(file);
      const name = path6.relative(root, file).replace(/\\/g, "/").replace(/\.json$/, "");
      const values = (json?.values ?? []).map((v) => typeof v === "string" ? v : v?.id ?? "").filter((v) => v && !v.startsWith("#"));
      if (values.length) tags[`${ns}:${name}`] = values;
    }
  }
  return tags;
}
function whySkipped(recipe, ctx) {
  if (!STATION[recipe.type ?? ""]) return `recipe type "${recipe.type ?? "?"}" isn't supported`;
  const extra = recipe;
  const all = [
    ...Object.values(recipe.key ?? {}),
    ...recipe.ingredients ?? [],
    extra.ingredient,
    recipe.base,
    recipe.addition,
    recipe.template,
    extra.bottle,
    extra.input
  ];
  for (const ingredient of all) {
    if (!ingredient || resolveIngredient(ingredient, ctx)) continue;
    const first = Array.isArray(ingredient) ? ingredient[0] : ingredient;
    if (first?.item) return `ingredient "${first.item}" doesn't exist in Bedrock`;
    if (first?.tag) return `tag "#${first.tag}" has no Bedrock equivalent (use an item, or define it in data/<ns>/tags/item)`;
    return "an ingredient is empty";
  }
  return "it can't be converted";
}
async function convertItems(opts) {
  const { ns, bp, rp } = opts;
  const assets = path6.join(opts.input, "assets", ns);
  const data = path6.join(opts.input, "data", ns);
  const result = { items: [], langLines: /* @__PURE__ */ new Map(), recipes: 0 };
  const modelDir = path6.join(assets, "models", "item");
  const names = existsSync5(modelDir) ? (await readdir5(modelDir, { withFileTypes: true })).filter((e) => e.isFile() && e.name.endsWith(".json")).map((e) => e.name.slice(0, -5)) : [];
  const textureData = {};
  for (const name of names.sort()) {
    const id = `${ns}:${name}`;
    const shape = await resolveModel(assets, ns, name);
    if (shape.kind === "skip") {
      logWarn(`Item ${id}: ${shape.why}; not converted yet`);
      continue;
    }
    const img = await composeTexture(assets, ns, shape.textures);
    if (typeof img === "string") {
      logWarn(`Item ${id}: ${img}; skipped`);
      continue;
    }
    const texPath = `textures/${ns}/items/${name}`;
    await mkdir(path6.join(rp, "textures", ns, "items"), { recursive: true });
    await writeFile3(path6.join(rp, `${texPath}.png`), encodePng(img));
    textureData[`${ns}_${name}`] = { textures: texPath };
    await writeJson(path6.join(bp, "items", `${name}.json`), {
      format_version: "1.21.60",
      "minecraft:item": {
        description: { identifier: id, menu_category: { category: "items" } },
        components: {
          "minecraft:icon": `${ns}_${name}`,
          // **El nombre, explícito**, como los objetos de la base. Sin esto el
          // juego no buscaba `item.<ns>:<nombre>.name` y enseñaba la clave a
          // pelo (primera prueba en el juego). La clave es la misma de Java.
          "minecraft:display_name": { value: `%item.${ns}.${name}` },
          // El tamaño de pila está en el código de Java: 64, como la mayoría.
          "minecraft:max_stack_size": 64,
          "minecraft:hand_equipped": shape.handheld
        }
      }
    });
    result.items.push(id);
  }
  if (result.items.length) {
    await writeJson(path6.join(rp, "textures", "item_texture.json"), {
      resource_pack_name: ns,
      texture_name: "atlas.items",
      texture_data: textureData
    });
  }
  for (const file of (await walk(path6.join(assets, "lang"))).filter((f) => f.endsWith(".json"))) {
    const src = await readJsonOrNull(file) ?? {};
    const lines = [];
    for (const id of result.items) {
      const name = id.split(":")[1];
      const display = src[`item.${ns}.${name}`];
      if (display) lines.push(`item.${ns}.${name}=${display}`);
    }
    if (lines.length) result.langLines.set(path6.basename(file, ".json"), lines);
  }
  const own = new Set(result.items);
  const base = await baseItemIds();
  const ctx = {
    isKnown: (id) => {
      if (id.startsWith(`${ns}:`)) return own.has(id);
      if (id.startsWith("cooblemon:")) return base ? base.has(id) : true;
      return id.startsWith("minecraft:");
    },
    extraFamilies: await addonTags(data, ns)
  };
  const furnaceUsed = await baseFurnaceInputs();
  for (const folder of ["recipe", "recipes"]) {
    const root = path6.join(data, folder);
    for (const file of (await walk(root)).filter((f) => f.endsWith(".json")).sort()) {
      const rel = path6.relative(root, file).replace(/\\/g, "/");
      const recipe = await readJsonOrNull(file);
      if (!recipe) continue;
      const rawResult = recipe.result;
      const rawId = typeof rawResult === "string" ? rawResult : rawResult?.id ?? rawResult?.item;
      if (!rawId) continue;
      const resultId = portId(rawId);
      if (!ctx.isKnown(resultId)) {
        logWarn(`Recipe ${rel}: result "${rawId}" doesn't exist in Bedrock; skipped`);
        continue;
      }
      const stem = rel.replace(/\.json$/, "").replace(/\//g, "_");
      const count = typeof rawResult === "string" ? 1 : rawResult?.count ?? 1;
      const built = convertRecipe(recipe, stem, resultId, count, ctx, `${ns}:`);
      if (!built) {
        logWarn(`Recipe ${rel}: ${whySkipped(recipe, ctx)}; skipped`);
        continue;
      }
      for (const { name, json } of built) {
        const clash = furnaceKeys(json).find((key) => furnaceUsed.has(key));
        if (clash) {
          const [station, input] = clash.split("|");
          logWarn(`Recipe ${rel}: "${input}" already has a ${station} recipe (Bedrock allows only one per ingredient); skipped`);
          continue;
        }
        for (const key of furnaceKeys(json)) furnaceUsed.add(key);
        await writeJson(path6.join(bp, "recipes", `${name}.json`), json);
        result.recipes++;
      }
    }
  }
  return result;
}

// tools/kit/zones.ts
import { existsSync as existsSync6 } from "node:fs";
import { mkdir as mkdir2, readdir as readdir6, readFile as readFile7, rm as rm2, writeFile as writeFile4 } from "node:fs/promises";
import path7 from "node:path";
init_utils();
var JAVA_DEFAULT_MAX_DISTANCE = 80;
var MIN_RADIUS = 16;
var MAX_RADIUS = 128;
async function walk2(dir) {
  if (!existsSync6(dir)) return [];
  const out = [];
  for (const entry of await readdir6(dir, { withFileTypes: true })) {
    const full = path7.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk2(full));
    else out.push(full);
  }
  return out;
}
async function readJson(file) {
  return JSON.parse((await readFile7(file, "utf8")).replace(/^﻿/, ""));
}
function relId(root, file, ext) {
  return path7.relative(root, file).replace(/\\/g, "/").slice(0, -ext.length);
}
var FILL = 0.6;
function radiusOf(structure) {
  const raw = structure.max_distance_from_center;
  const value = typeof raw === "number" ? raw : typeof raw?.horizontal === "number" ? Number(raw.horizontal) : JAVA_DEFAULT_MAX_DISTANCE;
  return Math.max(MIN_RADIUS, Math.min(MAX_RADIUS, Math.round(value * FILL)));
}
async function convertZoneSpawns(opts) {
  const { input, ns, own, tmp } = opts;
  const data = path7.join(input, "data", ns);
  const structureDir = path7.join(data, "worldgen", "structure");
  const structures = /* @__PURE__ */ new Map();
  for (const file of (await walk2(structureDir)).filter((f) => f.endsWith(".json"))) {
    structures.set(`${ns}:${relId(structureDir, file, ".json")}`, await readJson(file));
  }
  if (structures.size === 0) return null;
  const notes = [];
  const expand = async (ref, seen = /* @__PURE__ */ new Set()) => {
    if (!ref.startsWith("#")) return [ref];
    if (seen.has(ref)) return [];
    seen.add(ref);
    const m = new RegExp(`^#${ns}:(.+)$`).exec(ref);
    const file = m ? path7.join(data, "tags", "worldgen", "structure", `${m[1]}.json`) : "";
    if (!m || !existsSync6(file)) return [ref];
    const out = [];
    for (const value of (await readJson(file)).values ?? []) {
      const id = typeof value === "string" ? value : value?.id;
      if (typeof id === "string") out.push(...await expand(id, seen));
    }
    return out;
  };
  const groups = /* @__PURE__ */ new Map();
  const files = [
    ...await walk2(path7.join(data, "spawn_pool_world")),
    ...await walk2(path7.join(input, "data", "cobblemon", "spawn_pool_world"))
  ].filter((f) => f.endsWith(".json"));
  for (const file of files) {
    const pool = await readJson(file);
    if (pool.enabled === false) continue;
    for (const spawn of pool.spawns ?? []) {
      const condition = spawn.condition ?? {};
      const refs = [...condition.structures ?? [], ...spawn.structures ?? []];
      if (!refs.length) continue;
      const resolved = (await Promise.all(refs.map((r) => expand(String(r))))).flat();
      const zones2 = [...new Set(resolved.filter((r) => structures.has(r)))].sort();
      if (!zones2.length) continue;
      const others = resolved.filter((r) => !structures.has(r));
      if (others.length) notes.push(`${String(spawn.id ?? spawn.pokemon)}: only in ${ns} structures; ${others.join(", ")} can't be told apart in Bedrock`);
      const clone = JSON.parse(JSON.stringify(spawn));
      const cond = { ...condition };
      delete cond.structures;
      clone.condition = cond;
      delete clone.structures;
      if (Array.isArray(clone.presets)) clone.presets = clone.presets.map((p) => String(p).toLowerCase());
      const key = zones2.join("|");
      const group = groups.get(key) ?? { zones: zones2, spawns: [] };
      group.spawns.push(clone);
      groups.set(key, group);
    }
  }
  if (!groups.size) return null;
  const used = /* @__PURE__ */ new Set();
  const entries = [];
  await mkdir2(tmp, { recursive: true });
  try {
    let i = 0;
    for (const { zones: zones2, spawns } of groups.values()) {
      const file = path7.join(tmp, `zone-${i++}.json`);
      await writeFile4(file, JSON.stringify({ enabled: true, spawns }));
      const pools = await convertJavaSpawnPools({ files: [file], generationOf: () => 0, quiet: true, allowGeneric: true });
      for (const [n, spawn] of Object.entries(pools)) {
        const id = own.has(n) ? `${ns}:${n}` : n;
        const bundled = bundleSpawnRules(id, spawn, { allowGeneric: true });
        const general = new Set(bundled.filter((e) => e.biome === "overworld").map((e) => JSON.stringify({ ...e, biome: "" })));
        for (const entry of bundled) {
          if (entry.biome === "sky" && general.has(JSON.stringify({ ...entry, biome: "" }))) continue;
          entries.push({ ...entry, zone: zones2.length === 1 ? zones2[0] : zones2 });
        }
      }
      zones2.forEach((z) => used.add(z));
    }
  } finally {
    await rm2(tmp, { recursive: true, force: true });
  }
  const zones = {};
  for (const id of [...used].sort()) zones[id] = { radius: radiusOf(structures.get(id)) };
  logStep(`  zones: ${Object.keys(zones).length} structures with their own spawns, ${entries.length} entries`);
  return { zones, entries, notes };
}

// tools/kit/structures.ts
import { existsSync as existsSync8 } from "node:fs";
import { mkdir as mkdir4, readdir as readdir7, readFile as readFile10, writeFile as writeFile6 } from "node:fs/promises";
import path9 from "node:path";
import nbt2 from "prismarine-nbt";

// tools/lib/java-nbt-to-mcstructure.ts
import { mkdir as mkdir3, readFile as readFile8, writeFile as writeFile5 } from "node:fs/promises";
import { readFileSync as readFileSync2 } from "node:fs";
import path8 from "node:path";
import nbt from "prismarine-nbt";

// tools/data/item-block-ids.ts
init_utils();
import { readFileSync } from "node:fs";
var ITEM_BLOCK_ALIAS = {
  x_defence: "x_defense",
  x_special_attack: "x_sp_atk",
  x_special_defence: "x_sp_def"
};
var EXTRA = ["relic_coin_sack"];
function leerEtiqueta() {
  const file = cobblemonJava("data/cobblemon/tags/item/item_blocks.json");
  const tag = JSON.parse(readFileSync(file, "utf8"));
  return tag.values.map((value) => {
    const id = value.split(":").pop();
    return ITEM_BLOCK_ALIAS[id] ?? id;
  });
}
var ITEM_BLOCK_IDS = [...leerEtiqueta(), ...EXTRA];
var INDICE = new Set(ITEM_BLOCK_IDS);

// tools/lib/structure-block-map.ts
var BEDROCK_BLOCK_VERSION = 18168865;
var BLOCK_VERSION_OVERRIDES = {
  // 1.26.50.0, la misma que pide el manifiesto del paquete.
  "minecraft:stone": 18493952
};
function blockVersionFor(name) {
  return BLOCK_VERSION_OVERRIDES[name] ?? BEDROCK_BLOCK_VERSION;
}
var BLOCK_ALIASES = {
  "cobblemon:apricorn_door": "minecraft:wooden_door",
  // Placas de mostrador Pokécenter (Java face=floor) → alfombra; evita oak_wall_sign vacío (?)
  "cobblemon:red_plaque": "minecraft:red_carpet",
  "cobblemon:white_plaque": "minecraft:white_carpet",
  "cobblemon:black_plaque": "minecraft:black_carpet",
  "cobblemon:blue_plaque": "minecraft:blue_carpet",
  "cobblemon:yellow_plaque": "minecraft:yellow_carpet",
  "cobblemon:green_plaque": "minecraft:green_carpet",
  "cobblemon:pink_plaque": "minecraft:pink_carpet",
  "cobblemon:gilded_chest": "minecraft:chest",
  "cobblemon:gimmighoul_chest": "minecraft:chest",
  "cobblemon:display_case": "minecraft:glass",
  "cobblemon:pasteurizer": "minecraft:cauldron",
  "cobblemon:monitor": "minecraft:glass"
};
var JAVA_TO_BEDROCK_VANILLA = {
  // Los que trajo la torre de la Liga. Mismo caso: existen, con otro nombre.
  "minecraft:end_stone_bricks": "minecraft:end_bricks",
  "minecraft:end_stone_brick_stairs": "minecraft:end_brick_stairs",
  "minecraft:warped_sign": "minecraft:warped_standing_sign",
  "minecraft:oak_button": "minecraft:wooden_button",
  // **Los que trajeron los pueblos de CobbleTowns.** Nombres que Bedrock nunca
  // renombró, comprobados uno a uno contra su lista de bloques: la puerta de
  // roble es «de madera» a secas, el caldero es uno solo con nivel de llenado,
  // la cabeza de jugador no distingue suelo de pared, la maceta tampoco
  // distingue qué planta lleva —eso va en los datos del bloque— y el cartel de
  // roble oscuro se escribe junto.
  "minecraft:oak_door": "minecraft:wooden_door",
  // La puerta y la trampilla de apricorn del mod: el port no las tiene y se
  // sustituyen por las de roble, el tono más cercano del juego base. Van aquí y
  // no en una reescritura del conversor para que el camino normal les conserve
  // la orientación: una puerta sin su `cardinal_direction` no se coloca.
  "cobblemon:apricorn_door": "minecraft:wooden_door",
  "cobblemon:apricorn_trapdoor": "minecraft:trapdoor",
  "minecraft:oak_trapdoor": "minecraft:trapdoor",
  "minecraft:water_cauldron": "minecraft:cauldron",
  // **Las cabezas decorativas se quitan.** En el datapack son cabezas de
  // jugador con textura propia —una URL dentro de su `SkullOwner`—, que es como
  // se decoran fachadas en Java. Bedrock no sabe pintar esa textura y las
  // dibujaba todas como Steve: 186 caras asomando de las paredes de treinta
  // edificios. Quitarlas deja la pared lisa, que es lo que había detrás.
  "minecraft:player_wall_head": "minecraft:air",
  "minecraft:player_head": "minecraft:air",
  "minecraft:dark_oak_wall_sign": "minecraft:darkoak_wall_sign",
  "minecraft:stonecutter": "minecraft:stonecutter_block",
  "minecraft:potted_allium": "minecraft:flower_pot",
  "minecraft:potted_blue_orchid": "minecraft:flower_pot",
  "minecraft:potted_brown_mushroom": "minecraft:flower_pot",
  "minecraft:potted_red_mushroom": "minecraft:flower_pot",
  "minecraft:potted_dark_oak_sapling": "minecraft:flower_pot",
  "minecraft:potted_cherry_sapling": "minecraft:flower_pot",
  // Los tres que trajeron los gimnasios de Radical Gyms. Bedrock los tiene,
  // solo que con otro nombre: el bloque de luz va numerado por nivel, el
  // cartel de roble no lleva la madera delante y el cobre encerado se llama a
  // secas `waxed_copper`.
  "minecraft:light": "minecraft:light_block_15",
  "minecraft:oak_wall_sign": "minecraft:wall_sign",
  "minecraft:waxed_copper_block": "minecraft:waxed_copper",
  "minecraft:cobweb": "minecraft:web",
  "minecraft:magma_block": "minecraft:magma",
  "minecraft:snow_block": "minecraft:snow",
  "minecraft:terracotta": "minecraft:hardened_clay",
  "minecraft:cave_air": "minecraft:air",
  "minecraft:void_air": "minecraft:air",
  "minecraft:cobblestone_stairs": "minecraft:stone_stairs",
  "minecraft:rooted_dirt": "minecraft:dirt_with_roots",
  "minecraft:flowering_azalea_leaves": "minecraft:azalea_leaves_flowered",
  "minecraft:redstone_wall_torch": "minecraft:redstone_torch",
  "minecraft:wall_torch": "minecraft:torch",
  // `minecraft:grass` desapareció de Bedrock al renombrarse a `grass_block`, así
  // que este alias estaba generando bloques desconocidos: se deja tal cual.
  //
  // El resto son nombres que en Bedrock nunca coincidieron con los de Java.
  "minecraft:grass": "minecraft:short_grass",
  "minecraft:tall_grass": "minecraft:tall_grass",
  "minecraft:oak_trapdoor": "minecraft:trapdoor",
  "minecraft:oak_pressure_plate": "minecraft:wooden_pressure_plate",
  "minecraft:repeater": "minecraft:unpowered_repeater",
  "minecraft:tripwire": "minecraft:trip_wire",
  "minecraft:spawner": "minecraft:mob_spawner",
  "minecraft:stone_slab": "minecraft:normal_stone_slab",
  "minecraft:tall_seagrass": "minecraft:seagrass",
  "minecraft:kelp_plant": "minecraft:kelp",
  "minecraft:cave_vines_plant": "minecraft:cave_vines",
  "minecraft:big_dripleaf_stem": "minecraft:big_dripleaf",
  "minecraft:small_dripleaf": "minecraft:small_dripleaf_block",
  "minecraft:potted_jungle_sapling": "minecraft:flower_pot",
  "minecraft:white_banner": "minecraft:standing_banner",
  "minecraft:white_wall_banner": "minecraft:wall_banner",
  "minecraft:brown_wall_banner": "minecraft:wall_banner",
  "minecraft:orange_wall_banner": "minecraft:wall_banner",
  // Renombrado a `iron_chain` con la actualización de las cadenas de cobre.
  "minecraft:chain": "minecraft:iron_chain",
  "minecraft:dirt_path": "minecraft:grass_path",
  "minecraft:melon": "minecraft:melon_block",
  "minecraft:bricks": "minecraft:brick_block",
  "minecraft:nether_bricks": "minecraft:nether_brick",
  "minecraft:red_nether_bricks": "minecraft:red_nether_brick",
  "minecraft:slime_block": "minecraft:slime",
  // Puertas / camas Java → IDs Bedrock legacy-compatibles en estructuras
  "minecraft:oak_door": "minecraft:wooden_door",
  "minecraft:potted_cactus": "minecraft:flower_pot",
  "minecraft:potted_dead_bush": "minecraft:flower_pot",
  "minecraft:potted_fern": "minecraft:flower_pot",
  "minecraft:potted_oak_sapling": "minecraft:flower_pot",
  "minecraft:potted_poppy": "minecraft:flower_pot",
  "minecraft:potted_dandelion": "minecraft:flower_pot",
  "minecraft:potted_azure_bluet": "minecraft:flower_pot",
  "minecraft:potted_oxeye_daisy": "minecraft:flower_pot",
  "minecraft:potted_red_tulip": "minecraft:flower_pot",
  "minecraft:potted_orange_tulip": "minecraft:flower_pot",
  "minecraft:potted_white_tulip": "minecraft:flower_pot",
  "minecraft:potted_pink_tulip": "minecraft:flower_pot",
  "minecraft:potted_cornflower": "minecraft:flower_pot",
  "minecraft:potted_lily_of_the_valley": "minecraft:flower_pot",
  "minecraft:potted_wither_rose": "minecraft:flower_pot",
  "minecraft:potted_bamboo": "minecraft:flower_pot",
  // Nombres que Bedrock nunca renombró al de Java. Los detecta
  // `verify:structure-blocks` contra la lista oficial de bloques.
  "minecraft:dead_bush": "minecraft:deadbush",
  "minecraft:lily_pad": "minecraft:waterlily",
  "minecraft:sugar_cane": "minecraft:reeds",
  "minecraft:weeping_vines_plant": "minecraft:weeping_vines",
  "minecraft:twisting_vines_plant": "minecraft:twisting_vines",
  "minecraft:nether_quartz_ore": "minecraft:quartz_ore",
  "minecraft:cyan_wall_banner": "minecraft:wall_banner",
  "minecraft:potted_torchflower": "minecraft:flower_pot",
  "minecraft:prismarine_brick_stairs": "minecraft:prismarine_bricks_stairs",
  // Errata en los datos del mod: `minecraft:dirt_block` no existe en ninguna
  // edición. Aparece 7 veces como `final_state` de jigsaw en los hábitats.
  "minecraft:dirt_block": "minecraft:dirt",
  // Otra errata del mod: "strucutre" por "structure".
  "minecraft:strucutre_void": "minecraft:structure_void"
};
var ITEM_BLOCK_ALIASES = Object.fromEntries(
  ITEM_BLOCK_IDS.map((port) => {
    const java = Object.entries(ITEM_BLOCK_ALIAS).find(([, nuestro]) => nuestro === port)?.[0];
    return [`cobblemon:${java ?? port}`, `cooblemon:${port}_block`];
  })
);
var EXISTING_CUSTOM = /* @__PURE__ */ new Set([
  "cooblemon:healing_machine",
  "cooblemon:pc",
  "cooblemon:restoration_tank",
  "cooblemon:restoration_monitor",
  "cooblemon:tumblestone_block",
  "cooblemon:tumblestone_bricks",
  "cooblemon:smooth_tumblestone",
  "cooblemon:black_tumblestone_block",
  "cooblemon:sky_tumblestone_block",
  "cooblemon:apricorn_log",
  "cooblemon:apricorn_wood",
  "cooblemon:apricorn_planks",
  "cooblemon:apricorn_leaves",
  "cooblemon:saccharine_log",
  "cooblemon:saccharine_planks",
  "cooblemon:saccharine_leaves",
  // Hábitats: el bloque que los gobierna. Sin esto la red de seguridad lo
  // convertía en piedra y las 584 estructuras salían sin su spawner.
  "cooblemon:habitat_block",
  // Mega Showdown: los dos meteoritos (megaroid / mega_site).
  "cooblemon:mega_meteorid_block",
  "cooblemon:mega_meteorid_radiated_block",
  "cooblemon:keystone_ore",
  "cooblemon:mega_stone_crystal",
  "cooblemon:wishing_star_crystal",
  "cooblemon:mega_meteorid_fire_ore",
  "cooblemon:mega_meteorid_thunder_ore",
  "cooblemon:mega_meteorid_water_ore",
  "cooblemon:mega_meteorid_leaf_ore",
  "cooblemon:mega_meteorid_moon_ore",
  "cooblemon:mega_meteorid_sun_ore",
  "cooblemon:mega_meteorid_dawn_ore",
  "cooblemon:mega_meteorid_shiny_ore",
  "cooblemon:mega_meteorid_ice_ore",
  "cooblemon:mega_meteorid_dusk_ore"
]);
var PORTED_NAMESPACES = [
  ["cobblemon:", "cooblemon:"],
  ["mega_showdown:", "cooblemon:"],
  ["cobblefurnies:", "cooblemon:"],
  ["cobbletowns:", "cooblemon:towns/"]
];
var FURNITURE_FAMILIES = [
  // Cortinas y tapizados: lo que importa es el pano de color.
  { pattern: /^(\w+)_curtain$/, to: (c) => `minecraft:${c}_wool` },
  { pattern: /^(\w+)_poke_wool$/, to: (c) => `minecraft:${c}_wool` },
  { pattern: /^(\w+)_poke_wool_carpet$/, to: (c) => `minecraft:${c}_carpet` },
  { pattern: /^(\w+)_sofa$/, to: (c) => `minecraft:${c}_wool` },
  // Mobiliario: terracota del color, que es mate y no canta como el hormigon.
  { pattern: /^(\w+)_cabinetry$/, to: (c) => `minecraft:${c}_terracotta` },
  // Taburetes: media altura, para que se sigan leyendo como asiento.
  { pattern: /^(\w+_)?(dark_)?stool$/, to: () => "minecraft:spruce_slab" },
  // Lamparas: da igual el color, lo que hace falta es que alumbre.
  { pattern: /^(\w+)_lamp$/, to: () => "minecraft:lantern" }
];
var FURNITURE_SINGLES = {
  // El suelo de todos los gimnasios: un mosaico claro.
  vanilla_mosaic: "minecraft:quartz_bricks",
  // Moldura de pared de abeto.
  spruce_wall_support: "minecraft:stripped_spruce_wood",
  // Estatua de dos bloques de alto.
  statue_ancient: "minecraft:chiseled_stone_bricks",
  // Plantas de interior. Las de dos alturas se quedan en hojas arriba y abajo:
  // separar tiesto y copa pediria mirar el estado `half`, y a cambio se veria
  // casi igual.
  mini_topiary: "minecraft:oak_leaves",
  bonsai_plant: "minecraft:oak_leaves",
  potted_pothos: "minecraft:flower_pot"
};
var PORTED_FURNITURE = /* @__PURE__ */ new Set();
function registerPortedFurniture(names) {
  for (const name of names) PORTED_FURNITURE.add(name);
}
var TWO_BLOCK_FURNITURE = /* @__PURE__ */ new Set();
function registerTwoBlockFurniture(names) {
  for (const name of names) TWO_BLOCK_FURNITURE.add(name);
}
function remapFurniture(id) {
  if (!id.startsWith("cobblefurnies:")) return null;
  const name = id.slice("cobblefurnies:".length);
  if (PORTED_FURNITURE.has(name)) return null;
  const single = FURNITURE_SINGLES[name];
  if (single) return single;
  for (const { pattern, to } of FURNITURE_FAMILIES) {
    const match = pattern.exec(name);
    if (match) return to(match[1] ?? "");
  }
  return null;
}
function remapNamespaceId(id) {
  if (!id) return "minecraft:air";
  for (const [ns, target] of PORTED_NAMESPACES) {
    if (id.startsWith(ns)) return `${target}${id.slice(ns.length)}`;
  }
  return id;
}
var customBlockStates = /* @__PURE__ */ new Map();
var vanillaBlockStates = /* @__PURE__ */ new Map();
function registerVanillaBlockStates(states) {
  vanillaBlockStates.clear();
  for (const [id, keys] of states) vanillaBlockStates.set(id, keys);
}
function allowedStates(name) {
  return customBlockStates.get(name) ?? vanillaBlockStates.get(name);
}
var DOOR_CARDINAL = {
  east: "south",
  south: "west",
  west: "north",
  north: "east"
};
var OPPOSITE = {
  north: "south",
  south: "north",
  east: "west",
  west: "east"
};
var FACING_DIRECTION_INDEX = {
  down: 0,
  up: 1,
  north: 2,
  south: 3,
  west: 4,
  east: 5
};
function applyFacing(states, allowed, facing, isDoor, isDoorUpper, facingIsWallSide = false) {
  void isDoorUpper;
  if (!facing) return;
  if (allowed.has("minecraft:cardinal_direction") && HORIZONTAL.has(facing)) {
    states["minecraft:cardinal_direction"] = isDoor ? DOOR_CARDINAL[facing] ?? facing : facingIsWallSide ? OPPOSITE[facing] ?? facing : facing;
    return;
  }
  if (allowed.has("minecraft:block_face")) {
    states["minecraft:block_face"] = facing;
    return;
  }
  if (allowed.has("minecraft:facing_direction")) {
    states["minecraft:facing_direction"] = facing;
    return;
  }
  if (allowed.has("torch_facing_direction") && HORIZONTAL.has(facing)) {
    states["torch_facing_direction"] = OPPOSITE[facing] ?? facing;
    return;
  }
  if (allowed.has("facing_direction") && FACING_DIRECTION_INDEX[facing] !== void 0) {
    states["facing_direction"] = FACING_DIRECTION_INDEX[facing];
  }
}
function registerCustomBlockStates(states) {
  customBlockStates.clear();
  for (const [id, keys] of states) customBlockStates.set(id, keys);
}
function isExistingCustom(id) {
  if (customBlockStates.size > 0) return customBlockStates.has(id);
  return EXISTING_CUSTOM.has(id);
}
function remapBlockId(rawJavaName) {
  const javaName = rawJavaName.replace(/\[.*$/, "").trim();
  const bedMatch = /^minecraft:(\w+)_bed$/.exec(javaName);
  if (bedMatch) return "minecraft:bed";
  const aliased = BLOCK_ALIASES[javaName] ?? ITEM_BLOCK_ALIASES[javaName] ?? JAVA_TO_BEDROCK_VANILLA[javaName] ?? javaName;
  const remapped = remapNamespaceId(aliased);
  if (remapped === "cooblemon:restoration_tank_top" || remapped === "cooblemon:pasture_top") {
    return "minecraft:air";
  }
  if (remapped.includes("waystone")) return "minecraft:lodestone";
  const furniture = remapFurniture(javaName);
  if (furniture) return furniture;
  if (!remapped.startsWith("minecraft:") && !remapped.startsWith("cooblemon:")) {
    return "minecraft:stone";
  }
  if (remapped.startsWith("cooblemon:") && !isExistingCustom(remapped)) {
    if (remapped.includes("door")) return "minecraft:wooden_door";
    if (remapped.includes("chest")) return "minecraft:chest";
    if (remapped.includes("sign") || remapped.includes("plaque")) return "minecraft:red_carpet";
    if (remapped.includes("berry") || remapped.includes("crop") || remapped.includes("apricorn")) {
      return "minecraft:oak_leaves";
    }
    return "minecraft:stone";
  }
  return remapped;
}
var HORIZONTAL = /* @__PURE__ */ new Set(["north", "south", "east", "west"]);
var STAIRS_WEIRDO = { east: 0, west: 1, south: 2, north: 3 };
var FACING_DIRECTION = {
  down: 0,
  up: 1,
  east: 2,
  west: 3,
  south: 4,
  north: 5
};
function isStairsBlock(name) {
  return name.endsWith("_stairs") || name === "minecraft:stone_stairs";
}
var JAVA_UPPER_HALVES = {
  "cobblemon:pc": { prop: "part", value: "top" }
};
var FACING_IS_WALL_SIDE = /* @__PURE__ */ new Set(["cobblemon:pc", "cobblemon:healing_machine"]);
var BERRY_MAX_AGE = 5;
var TRAPDOOR_DIRECTION = {
  east: 0,
  west: 1,
  south: 2,
  north: 3
};
var JIGSAW_FACING = {
  down: 0,
  up: 1,
  north: 2,
  south: 3,
  west: 4,
  east: 5
};
var JIGSAW_ROTATION = {
  north: 0,
  east: 1,
  south: 2,
  west: 3
};
function jigsawStates(orientation) {
  if (!orientation) return null;
  const [front, top] = orientation.split("_");
  const facing = front ? JIGSAW_FACING[front] : void 0;
  if (facing === void 0) return null;
  const rotation = top && top !== "up" ? JIGSAW_ROTATION[top] ?? 0 : 0;
  return { facing_direction: facing, rotation };
}
function mapJavaBlockState(javaName, props) {
  const upper = JAVA_UPPER_HALVES[javaName];
  if (upper && props?.[upper.prop] === upper.value) {
    return { name: "minecraft:air", states: {}, waterlogged: false };
  }
  const name = remapBlockId(javaName);
  if (name === "minecraft:jigsaw") {
    const js = jigsawStates(props?.orientation);
    if (js) return { name, states: js, waterlogged: false };
  }
  const states = {};
  const p = props ?? {};
  const waterlogged = p.waterlogged === "true";
  const isDoor = name === "minecraft:wooden_door" || /_door$/.test(name);
  const isBed = name === "minecraft:bed";
  const isCarpet = name.endsWith("_carpet");
  const isStairs = isStairsBlock(name);
  const isBarrel = name === "minecraft:barrel";
  const isTrapdoor = /_trapdoor$/.test(name) || name === "minecraft:trapdoor";
  if (isTrapdoor) {
    if (p.facing && TRAPDOOR_DIRECTION[p.facing] !== void 0) {
      states["direction"] = TRAPDOOR_DIRECTION[p.facing];
    }
    states["upside_down_bit"] = p.half === "top";
    states["open_bit"] = p.open === "true";
  }
  if (!isDoor && !isBed && !isCarpet && !isTrapdoor) {
    if (isStairs) {
      if (p.facing && STAIRS_WEIRDO[p.facing] !== void 0) {
        states["weirdo_direction"] = STAIRS_WEIRDO[p.facing];
      }
    } else if (isBarrel) {
      if (p.facing && FACING_DIRECTION[p.facing] !== void 0) {
        states["facing_direction"] = FACING_DIRECTION[p.facing];
      }
    } else if (p.facing && HORIZONTAL.has(p.facing)) {
      states["minecraft:cardinal_direction"] = FACING_IS_WALL_SIDE.has(javaName) ? OPPOSITE[p.facing] ?? p.facing : p.facing;
    } else if (p.facing === "up" || p.facing === "down") {
      states["facing_direction"] = p.facing === "up" ? 1 : 0;
    }
  }
  if (p.axis === "x" || p.axis === "y" || p.axis === "z") {
    states["pillar_axis"] = p.axis;
  }
  if (javaName === "minecraft:pointed_dripstone") {
    states["hanging"] = p.vertical_direction === "down";
    const grosor = p.thickness === "tip_merge" ? "merge" : p.thickness;
    if (grosor) states["dripstone_thickness"] = grosor;
  }
  if (p.amount) {
    const puestas = Number(p.amount);
    if (Number.isFinite(puestas)) {
      states["cooblemon:amount"] = Math.min(4, Math.max(1, Math.round(puestas)));
    }
  }
  if (p.half === "top") states["upside_down_bit"] = 1;
  if (p.half === "bottom" && (isStairs || javaName.includes("trapdoor"))) {
    states["upside_down_bit"] = 0;
  }
  if (p.type === "top") states["minecraft:vertical_half"] = "top";
  if (p.type === "bottom") states["minecraft:vertical_half"] = "bottom";
  if (p.type === "double") states["minecraft:vertical_half"] = "bottom";
  if (!isDoor) {
    if (p.open === "true") states["open_bit"] = 1;
    if (p.open === "false") states["open_bit"] = 0;
  }
  if (p.powered === "true") states["powered_bit"] = 1;
  if (isBed) {
    const bedColor = /^minecraft:(\w+)_bed$/.exec(javaName);
    if (bedColor) states["color"] = bedColor[1];
    if (p.facing && HORIZONTAL.has(p.facing)) {
      const dirMap = { south: 0, west: 1, north: 2, east: 3 };
      states["direction"] = dirMap[p.facing] ?? 0;
    }
    if (p.part === "head") states["head_piece_bit"] = 1;
    if (p.part === "foot") states["head_piece_bit"] = 0;
  }
  if (isDoor) {
    states["upper_block_bit"] = p.half === "upper" ? 1 : 0;
    states["door_hinge_bit"] = p.hinge === "right" ? 1 : 0;
    states["open_bit"] = p.open === "true" ? 1 : 0;
  }
  if (/^cooblemon:[a-z]+_berry$/.test(name)) {
    const age = Number(p.age);
    if (Number.isFinite(age)) {
      states["cooblemon:age"] = Math.max(0, Math.min(BERRY_MAX_AGE, Math.floor(age)));
    }
  }
  if (name === "cooblemon:healing_machine") {
    const charge = Number(p.charge ?? "0");
    states["cooblemon:active"] = false;
    states["cooblemon:machine_state"] = Math.max(0, Math.min(5, Number.isFinite(charge) ? Math.floor(charge) : 0));
    if (p.facing && HORIZONTAL.has(p.facing)) {
      states["minecraft:cardinal_direction"] = p.facing;
    }
  }
  const allowed = allowedStates(name);
  if (allowed) {
    for (const key of Object.keys(states)) {
      if (!allowed.has(key)) delete states[key];
    }
    applyFacing(
      states,
      allowed,
      p.facing,
      isDoor,
      p.half === "upper",
      FACING_IS_WALL_SIDE.has(javaName)
    );
  }
  return { name, states, waterlogged };
}
function remapStructureRef(ref) {
  if (!ref || ref === "minecraft:empty") return ref;
  return remapNamespaceId(ref);
}
var knownJigsawPools = /* @__PURE__ */ new Set();
function registerKnownJigsawPools(pools) {
  knownJigsawPools.clear();
  for (const pool of pools) knownJigsawPools.add(pool);
}
function isMissingJigsawPool(pool) {
  if (knownJigsawPools.size === 0) return false;
  if (!pool || pool === "minecraft:empty") return false;
  return !knownJigsawPools.has(pool);
}
function isBlankStructureRef(ref) {
  const trimmed = ref.trim();
  return trimmed.length === 0 || trimmed.endsWith(":");
}
function isUnavailableJigsawPool(pool) {
  if (!pool || pool === "minecraft:empty") return false;
  for (const ns of addonJigsawNamespaces) if (pool.startsWith(`${ns}:`)) return false;
  return pool.startsWith("repurposed_structures:") || pool.includes("village/");
}
var addonJigsawNamespaces = /* @__PURE__ */ new Set();
function registerAddonJigsawNamespace(ns) {
  addonJigsawNamespaces.add(ns);
}
function clampStructureSetSpacing(spacing, separation) {
  const s = Math.max(1, Math.floor(spacing));
  let sep = Math.max(0, Math.floor(separation));
  const maxSep = Math.floor(s / 2) - 1;
  if (sep > maxSep) sep = Math.max(0, maxSep);
  return { spacing: s, separation: sep };
}

// tools/lib/structure-loot.ts
init_utils();
function remapLootTableRef(javaId) {
  const raw = String(javaId ?? "").trim();
  if (!raw) return "";
  let out;
  if (raw.startsWith("loot_tables/")) {
    out = raw;
  } else if (raw.startsWith("cobblemon:")) {
    out = `loot_tables/cooblemon/${raw.slice("cobblemon:".length)}`;
  } else if (raw.startsWith("cooblemon:")) {
    out = `loot_tables/cooblemon/${raw.slice("cooblemon:".length)}`;
  } else if (raw.startsWith("cobbletowns:")) {
    out = `loot_tables/cooblemon/towns/${raw.slice("cobbletowns:".length)}`;
  } else if (raw.startsWith("mega_showdown:")) {
    out = `loot_tables/mega_showdown/${raw.slice("mega_showdown:".length)}`;
  } else if (raw.startsWith("minecraft:")) {
    const rest = raw.slice("minecraft:".length);
    out = rest.startsWith("loot_tables/") ? rest : `loot_tables/${rest}`;
  } else if (/^[a-z0-9_.-]+:/.test(raw)) {
    out = `loot_tables/${raw.replace(":", "/")}`;
  } else {
    out = `loot_tables/${raw}`;
  }
  return out.endsWith(".json") ? out : `${out}.json`;
}
var JAVA_TO_BEDROCK_ITEM = {
  "minecraft:cobweb": "minecraft:web",
  "minecraft:map": "minecraft:empty_map"
};
function remapItemId(id) {
  if (id.startsWith("cobblemon:")) return `cooblemon:${id.slice("cobblemon:".length)}`;
  if (id.startsWith("mega_showdown:")) return `cooblemon:${id.slice("mega_showdown:".length)}`;
  return JAVA_TO_BEDROCK_ITEM[id] ?? id;
}
function convertRolls(rolls) {
  if (typeof rolls === "number") return rolls;
  if (rolls && typeof rolls === "object") {
    const r = rolls;
    if (typeof r.min === "number" && typeof r.max === "number") {
      return { min: Math.min(r.min, r.max), max: Math.max(r.min, r.max) };
    }
    if (r.type === "minecraft:uniform" || r.type === "uniform") {
      const min = Number(r.min ?? 0);
      const max = Number(r.max ?? 1);
      return { min: Math.min(min, max), max: Math.max(min, max) };
    }
    if (r.type === "minecraft:constant" || r.type === "constant") {
      return Number(r.value ?? r.min ?? 1);
    }
  }
  return 1;
}
function extractTmMoveFromFunctions(fns) {
  if (!Array.isArray(fns)) return null;
  for (const raw of fns) {
    if (!raw || typeof raw !== "object") continue;
    const f = raw;
    const name = String(f.function ?? "").replace(/^minecraft:/, "");
    if (name !== "set_components") continue;
    const components = f.components;
    if (!components || typeof components !== "object") continue;
    const tmMove = components["cobblemon:tm_move"];
    if (!tmMove || typeof tmMove !== "object") continue;
    const move = String(tmMove.move ?? "").toLowerCase().replace(/^cobblemon:/, "");
    if (move) return move;
  }
  return null;
}
function convertFunctions(fns) {
  if (!Array.isArray(fns)) return void 0;
  const out = [];
  for (const raw of fns) {
    if (!raw || typeof raw !== "object") continue;
    const f = raw;
    const name = String(f.function ?? "").replace(/^minecraft:/, "");
    if (name === "set_count") {
      const count = f.count;
      if (typeof count === "number") {
        out.push({ function: "set_count", count });
      } else if (count && typeof count === "object") {
        const c = count;
        out.push({
          function: "set_count",
          count: {
            min: Number(c.min ?? 1),
            max: Number(c.max ?? c.min ?? 1)
          }
        });
      }
    } else if (name === "enchant_randomly") {
      out.push({ function: "enchant_randomly" });
    } else if (name === "enchant_with_levels") {
      out.push({
        function: "enchant_with_levels",
        levels: typeof f.levels === "number" ? f.levels : 30,
        treasure: Boolean(f.treasure)
      });
    }
  }
  return out.length ? out : void 0;
}
function convertEntry(entry) {
  const type = String(entry.type ?? "").replace(/^minecraft:/, "");
  if (type === "empty") return { type: "empty", weight: Number(entry.weight ?? 1) };
  if (type === "item") {
    let name = remapItemId(String(entry.name ?? ""));
    if (!name) return null;
    const tmMove = extractTmMoveFromFunctions(entry.functions);
    if (tmMove && (name === "cooblemon:technical_machine" || name === "cobblemon:technical_machine")) {
      name = `cooblemon:tm_${tmMove}`;
    }
    const out = {
      type: "item",
      name,
      weight: Number(entry.weight ?? 1)
    };
    const functions = convertFunctions(entry.functions);
    if (functions) out.functions = functions;
    return out;
  }
  if (type === "loot_table") {
    const name = remapLootTableRef(String(entry.name ?? entry.value ?? ""));
    if (!name) return null;
    return {
      type: "loot_table",
      name,
      weight: Number(entry.weight ?? 1)
    };
  }
  return null;
}
function convertPool(pool) {
  const entriesIn = Array.isArray(pool.entries) ? pool.entries : [];
  const entries = [];
  for (const e of entriesIn) {
    const converted = convertEntry(e);
    if (converted) entries.push(converted);
  }
  if (!entries.length) return null;
  const out = {
    rolls: convertRolls(pool.rolls ?? 1),
    entries
  };
  if (typeof pool.bonus_rolls === "number") out.bonus_rolls = pool.bonus_rolls;
  return out;
}
function javaLootTableToBedrock(java) {
  const poolsIn = Array.isArray(java.pools) ? java.pools : [];
  const pools = [];
  for (const p of poolsIn) {
    const converted = convertPool(p);
    if (converted) pools.push(converted);
  }
  if (!pools.length) return null;
  return { pools };
}

// tools/lib/java-nbt-to-mcstructure.ts
init_utils();

// bp/src/data/habitat-mimics.generated.ts
var HABITAT_MIMICS = {
  "minecraft:grass_block": { group: 0, slot: 1 },
  "minecraft:sand": { group: 0, slot: 2 },
  "minecraft:mud": { group: 0, slot: 3 },
  "minecraft:snow_block": { group: 0, slot: 4 },
  "minecraft:basalt": { group: 0, slot: 5 },
  "minecraft:gravel": { group: 0, slot: 6 },
  "minecraft:oak_leaves": { group: 0, slot: 7 },
  "minecraft:sandstone": { group: 0, slot: 8 },
  "minecraft:red_sand": { group: 0, slot: 9 },
  "minecraft:copper_ore": { group: 0, slot: 10 },
  "minecraft:terracotta": { group: 0, slot: 11 },
  "minecraft:nether_quartz_ore": { group: 0, slot: 12 },
  "minecraft:cracked_nether_bricks": { group: 0, slot: 13 },
  "minecraft:coarse_dirt": { group: 0, slot: 14 },
  "minecraft:birch_log": { group: 0, slot: 15 },
  "minecraft:end_stone": { group: 1, slot: 0 },
  "minecraft:flowering_azalea_leaves": { group: 1, slot: 1 },
  "minecraft:acacia_log": { group: 1, slot: 2 },
  "minecraft:packed_ice": { group: 1, slot: 3 },
  "minecraft:smooth_basalt": { group: 1, slot: 4 },
  "minecraft:mycelium": { group: 1, slot: 5 },
  "minecraft:oak_log": { group: 1, slot: 6 },
  "minecraft:mossy_stone_bricks": { group: 1, slot: 7 },
  "minecraft:bone_block": { group: 1, slot: 8 },
  "minecraft:spruce_log": { group: 1, slot: 9 },
  "minecraft:mossy_cobblestone": { group: 1, slot: 10 },
  "minecraft:stone": { group: 1, slot: 11 },
  "minecraft:packed_mud": { group: 1, slot: 12 },
  "minecraft:tuff": { group: 1, slot: 13 },
  "minecraft:mangrove_roots": { group: 1, slot: 14 },
  "minecraft:warped_nylium": { group: 1, slot: 15 },
  "minecraft:cobbled_deepslate": { group: 2, slot: 0 },
  "minecraft:dripstone_block": { group: 2, slot: 1 },
  "minecraft:gold_block": { group: 2, slot: 2 },
  "minecraft:crimson_nylium": { group: 2, slot: 3 },
  "minecraft:dirt": { group: 2, slot: 4 }
};
var HABITAT_PRESETS = {
  "2:5": { pool: "abandoned_fortress", mimicId: "cracked_nether_bricks" },
  "2:6": { pool: "abandoned_village_house", mimicId: "grass_block" },
  "2:7": { pool: "abandoned_village_house", mimicId: "sand" },
  "2:8": { pool: "abandoned_village_house", mimicId: "snow_block" },
  "2:9": { pool: "badlands_shaded_rock", mimicId: "terracotta" },
  "2:10": { pool: "berry_patch", mimicId: "oak_leaves" },
  "2:11": { pool: "birch_wildfire_scar", mimicId: "birch_log" },
  "2:12": { pool: "bug_mound", mimicId: "packed_mud" },
  "2:13": { pool: "carved_ice_spikes", mimicId: "snow_block" },
  "2:14": { pool: "chorus_briar", mimicId: "end_stone" },
  "2:15": { pool: "crimson_fungal_dwelling", mimicId: "crimson_nylium" },
  "3:0": { pool: "custom__default_pool", mimicId: "stone" },
  "3:1": { pool: "deep_roots", mimicId: "coarse_dirt" },
  "3:2": { pool: "deep_roots", mimicId: "flowering_azalea_leaves" },
  "3:3": { pool: "deep_sea_spire", mimicId: "tuff" },
  "3:4": { pool: "desert_oasis", mimicId: "acacia_log" },
  "3:5": { pool: "desert_shaded_rock", mimicId: "sandstone" },
  "3:6": { pool: "drifting_icebergs", mimicId: "packed_ice" },
  "3:7": { pool: "earthen_hives", mimicId: "mud" },
  "3:8": { pool: "exposed_geode", mimicId: "smooth_basalt" },
  "3:9": { pool: "fae_mounds", mimicId: "mycelium" },
  "3:10": { pool: "flowerbed_clearing", mimicId: "grass_block" },
  "3:11": { pool: "freshwater_pond", mimicId: "gravel" },
  "3:12": { pool: "freshwater_pond", mimicId: "dirt" },
  "3:13": { pool: "fungal_dwelling", mimicId: "mud" },
  "3:14": { pool: "lost_cave_ruins", mimicId: "mossy_cobblestone" },
  "3:15": { pool: "lush_canopy", mimicId: "grass_block" },
  "4:0": { pool: "lush_cenote", mimicId: "stone" },
  "4:1": { pool: "lush_peat_bog", mimicId: "mud" },
  "4:2": { pool: "meteorite_impact", mimicId: "cobbled_deepslate" },
  "4:3": { pool: "natural_lightning_rod", mimicId: "copper_ore" },
  "4:4": { pool: "oak_wildfire_scar", mimicId: "oak_log" },
  "4:5": { pool: "parched_peat_bog", mimicId: "mud" },
  "4:6": { pool: "pinkflowerbed_clearing", mimicId: "grass_block" },
  "4:7": { pool: "quartz_spikes", mimicId: "nether_quartz_ore" },
  "4:8": { pool: "reclaimed_desert_monument", mimicId: "sandstone" },
  "4:9": { pool: "reclaimed_lush_monument", mimicId: "mossy_stone_bricks" },
  "4:10": { pool: "rocky_outcrop", mimicId: "dripstone_block" },
  "4:11": { pool: "rocky_tide_pool", mimicId: "gravel" },
  "4:12": { pool: "root_nursery", mimicId: "mangrove_roots" },
  "4:13": { pool: "sandpit_clearing", mimicId: "sand" },
  "4:14": { pool: "sandy_tide_pool", mimicId: "sand" },
  "4:15": { pool: "skeletal_fall", mimicId: "bone_block" },
  "5:0": { pool: "snowy_grotto", mimicId: "snow_block" },
  "5:1": { pool: "snowy_thermal_vents", mimicId: "basalt" },
  "5:2": { pool: "spruce_wildfire_scar", mimicId: "spruce_log" },
  "5:3": { pool: "strange_fungal_dwelling", mimicId: "warped_nylium" },
  "5:4": { pool: "sunflowerbed_clearing", mimicId: "grass_block" },
  "5:5": { pool: "sunscorched_clearing", mimicId: "red_sand" },
  "5:6": { pool: "thermal_crevices", mimicId: "basalt" },
  "5:7": { pool: "treasure_hoard", mimicId: "gold_block" },
  "5:8": { pool: "volcanic_plume", mimicId: "basalt" },
  "5:9": { pool: "warped_fungal_dwelling", mimicId: "warped_nylium" },
  "5:10": { pool: "zen_garden", mimicId: "sand" }
};
function habitatPresetSlot(pool, mimicId) {
  for (const [key, preset] of Object.entries(HABITAT_PRESETS)) {
    if (preset.pool !== pool || preset.mimicId !== mimicId) continue;
    const [group, slot] = key.split(":");
    return { group: Number(group), slot: Number(slot) };
  }
  return void 0;
}
var HABITAT_MIMIC_IDS = Object.keys(HABITAT_MIMICS);

// tools/lib/java-nbt-to-mcstructure.ts
function finalStateFor(valor) {
  return remapBlockId(String(valor ?? "minecraft:air"));
}
function makeRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = a + 1831565813 >>> 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function habitatPresetStates(javaNbt) {
  const pool = String(javaNbt?.PoolId ?? "").split(":").pop();
  const mimic = String(javaNbt?.MimicId ?? "").split(":").pop();
  if (!pool || !mimic) return void 0;
  const slot = habitatPresetSlot(pool, mimic);
  if (!slot) return void 0;
  return {
    "cooblemon:mimic_group": slot.group,
    "cooblemon:mimic_slot": slot.slot,
    // Los hábitats generados nacen spawneando; el estado es booleano.
    "cooblemon:active": true
  };
}
function paletteKey(name, states) {
  return `${name}|${JSON.stringify(states)}`;
}
var BOOL_STATES = (() => {
  try {
    const file = path8.resolve(
      process.cwd(),
      bedrockSamples("metadata/vanilladata_modules/mojang-blocks.json")
    );
    const data = JSON.parse(readFileSync2(file, "utf8"));
    return new Set(
      (data.block_properties ?? []).filter((p) => p.type === "bool" && p.name).map((p) => p.name)
    );
  } catch {
    return /* @__PURE__ */ new Set();
  }
})();
function isBoolState(key) {
  return BOOL_STATES.size > 0 ? BOOL_STATES.has(key) : key.endsWith("_bit");
}
function stateTagValue(key, v) {
  if (typeof v === "boolean") return nbt.byte(v ? 1 : 0);
  if (typeof v === "number") {
    return isBoolState(key) ? nbt.byte(v ? 1 : 0) : nbt.int(Math.trunc(v));
  }
  return nbt.string(v);
}
var BLOCK_ACTOR_ID = {
  "minecraft:chest": "Chest",
  "minecraft:trapped_chest": "Chest",
  "minecraft:barrel": "Barrel"
};
function convertBlockEntity(javaNbt, x, y, z) {
  if (!javaNbt) return null;
  const idRaw = String(javaNbt.id ?? "");
  const id = remapBlockId(idRaw);
  if (idRaw === "minecraft:jigsaw" || id === "minecraft:jigsaw") {
    let pool = remapStructureRef(String(javaNbt.pool ?? "minecraft:empty"));
    let target = remapStructureRef(String(javaNbt.target ?? "minecraft:empty"));
    let name = remapStructureRef(String(javaNbt.name ?? "minecraft:empty"));
    if (isUnavailableJigsawPool(pool) || isUnavailableJigsawPool(String(javaNbt.pool ?? ""))) {
      pool = "minecraft:empty";
      target = "minecraft:empty";
    }
    if (isBlankStructureRef(pool)) pool = "minecraft:empty";
    if (isBlankStructureRef(target)) target = "minecraft:empty";
    if (isBlankStructureRef(name)) name = "minecraft:empty";
    if (isMissingJigsawPool(pool)) {
      pool = "minecraft:empty";
      target = "minecraft:empty";
    }
    return {
      id: nbt.string("minecraft:jigsaw"),
      x: nbt.int(x),
      y: nbt.int(y),
      z: nbt.int(z),
      name: nbt.string(name),
      target: nbt.string(target),
      pool: nbt.string(pool),
      final_state: nbt.string(finalStateFor(javaNbt.final_state)),
      joint: nbt.string(String(javaNbt.joint ?? "rollable"))
    };
  }
  if (id.startsWith("cooblemon:") || id === "minecraft:chest" || id === "minecraft:barrel" || id === "minecraft:trapped_chest") {
    const be = {
      // Bedrock reconoce los contenedores por su id de block actor (`Chest`,
      // `Barrel`), igual que `Banner`; con el id del bloque ignora los datos y
      // el `LootTable` no llega a aplicarse.
      id: nbt.string(BLOCK_ACTOR_ID[id] ?? id),
      x: nbt.int(x),
      y: nbt.int(y),
      z: nbt.int(z)
    };
    const lootRaw = javaNbt.LootTable ?? javaNbt.loot_table;
    if (typeof lootRaw === "string" && lootRaw.length > 0) {
      const loot = remapLootTableRef(lootRaw);
      if (loot) be.LootTable = nbt.string(loot);
    }
    return be;
  }
  if (id === "minecraft:brushable_block" || id.includes("suspicious")) {
    const be = {
      id: nbt.string("BrushableBlock"),
      x: nbt.int(x),
      y: nbt.int(y),
      z: nbt.int(z)
    };
    const lootRaw = javaNbt.LootTable ?? javaNbt.loot_table;
    if (typeof lootRaw === "string" && lootRaw.length > 0) {
      const loot = remapLootTableRef(lootRaw);
      if (loot) be.LootTable = nbt.string(loot);
    }
    return be;
  }
  return null;
}
var BANNER_BASE_COLOR = {
  black: 0,
  red: 1,
  green: 2,
  brown: 3,
  blue: 4,
  purple: 5,
  cyan: 6,
  light_gray: 7,
  gray: 8,
  pink: 9,
  lime: 10,
  yellow: 11,
  light_blue: 12,
  magenta: 13,
  orange: 14,
  white: 15
};
function bannerBlockEntity(javaName, bedrockName, x, y, z) {
  if (bedrockName !== "minecraft:wall_banner" && bedrockName !== "minecraft:standing_banner") return null;
  const color = /^minecraft:(\w+?)_(?:wall_)?banner$/.exec(javaName)?.[1] ?? "white";
  return {
    id: nbt.string("Banner"),
    x: nbt.int(x),
    y: nbt.int(y),
    z: nbt.int(z),
    Base: nbt.int(BANNER_BASE_COLOR[color] ?? 15),
    Type: nbt.int(0)
  };
}
async function convertJavaNbtToMcstructure(javaNbtPath, outMcstructurePath, options) {
  const buf = await readFile8(javaNbtPath);
  const { parsed } = await nbt.parse(buf);
  const simp = nbt.simplify(parsed);
  const crop = options?.crop;
  const origin = crop ? crop.min : [0, 0, 0];
  const [sx, sy, sz] = crop ? [
    crop.max[0] - crop.min[0],
    crop.max[1] - crop.min[1],
    crop.max[2] - crop.min[2]
  ] : simp.size;
  const volume = sx * sy * sz;
  const primary = new Array(volume).fill(-1);
  const secondary = new Array(volume).fill(-1);
  const bedrockPalette = [];
  const paletteIndex = /* @__PURE__ */ new Map();
  const positionData = {};
  let healingPos = null;
  let hasPc = false;
  function ensurePalette(name, states) {
    const key = paletteKey(name, states);
    const existing = paletteIndex.get(key);
    if (existing !== void 0) return existing;
    const idx = bedrockPalette.length;
    bedrockPalette.push({ name, states });
    paletteIndex.set(key, idx);
    return idx;
  }
  const waterIdx = ensurePalette("minecraft:water", {});
  const rule = options?.ruleReplacement;
  const random = rule ? makeRandom(rule.seed) : null;
  const applyRule = (javaName) => {
    if (!rule || !random || javaName !== rule.from) return javaName;
    for (const { probability, to } of rule.rules) {
      if (random() < probability) return to;
    }
    return rule.fallback;
  };
  for (const block of simp.blocks ?? []) {
    const x = block.pos[0] - origin[0];
    const y = block.pos[1] - origin[1];
    const z = block.pos[2] - origin[2];
    if (x < 0 || y < 0 || z < 0 || x >= sx || y >= sy || z >= sz) continue;
    const linear = (x * sy + y) * sz + z;
    const javaPal = simp.palette[block.state];
    if (!javaPal) continue;
    const javaName = applyRule(javaPal.Name);
    const rewritten = options?.blockRewrite?.({
      javaName: javaPal.Name,
      // La posición **de la original**, no la del recorte: quien reescribe
      // bloques trabaja con las coordenadas del archivo que está leyendo.
      pos: block.pos,
      nbt: block.nbt
    });
    const mapped = rewritten ? { name: rewritten.name, states: rewritten.states ?? {}, waterlogged: false } : mapJavaBlockState(javaName, javaName === javaPal.Name ? javaPal.Properties : void 0);
    if (rewritten) {
      const idx2 = ensurePalette(mapped.name, mapped.states);
      primary[linear] = mapped.name === "minecraft:air" && !rewritten.placeAir ? -1 : idx2;
      if (rewritten.waterlogged) secondary[linear] = waterIdx;
      const loot = rewritten.lootTable ? remapLootTableRef(rewritten.lootTable) : "";
      if (loot) {
        positionData[String(linear)] = nbt.comp({
          block_entity_data: nbt.comp({
            id: nbt.string("BrushableBlock"),
            x: nbt.int(x),
            y: nbt.int(y),
            z: nbt.int(z),
            LootTable: nbt.string(loot),
            type: nbt.string(mapped.name)
          })
        });
      }
      continue;
    }
    if (mapped.name === "cooblemon:habitat_block") {
      const preset = habitatPresetStates(block.nbt);
      if (preset) Object.assign(mapped.states, preset);
    }
    if (mapped.name === "minecraft:structure_void" || javaPal.Name === "minecraft:structure_void") {
      primary[linear] = -1;
      continue;
    }
    const idx = ensurePalette(mapped.name, mapped.states);
    primary[linear] = idx;
    if (mapped.waterlogged) secondary[linear] = waterIdx;
    if (mapped.name === "cooblemon:healing_machine" && !healingPos) {
      healingPos = [x, y, z];
    }
    if (mapped.name === "cooblemon:pc") hasPc = true;
    const be = convertBlockEntity(block.nbt, x, y, z) ?? bannerBlockEntity(javaName, mapped.name, x, y, z);
    if (be) {
      positionData[String(linear)] = nbt.comp({
        block_entity_data: nbt.comp(be)
      });
    }
  }
  if (options?.ensurePcNearHealing && healingPos && !hasPc) {
    const [hx, hy, hz] = healingPos;
    const candidates = [
      [hx + 1, hy, hz],
      [hx - 1, hy, hz],
      [hx, hy, hz + 1],
      [hx, hy, hz - 1],
      [hx + 1, hy, hz + 1],
      [hx - 1, hy, hz + 1],
      [hx + 1, hy, hz - 1],
      [hx - 1, hy, hz - 1]
    ];
    const replaceable = /* @__PURE__ */ new Set([
      "minecraft:air",
      "minecraft:green_carpet",
      "minecraft:white_carpet",
      "minecraft:red_carpet",
      "minecraft:light_gray_carpet",
      "minecraft:oak_pressure_plate"
    ]);
    const pcIdx = ensurePalette("cooblemon:pc", {
      "minecraft:cardinal_direction": "south"
    });
    const tryPlace = (preferEmpty) => {
      for (const [x, y, z] of candidates) {
        if (x < 0 || y < 0 || z < 0 || x >= sx || y >= sy || z >= sz) continue;
        const linear = (x * sy + y) * sz + z;
        if (preferEmpty) {
          if (primary[linear] !== -1) continue;
        } else {
          if (primary[linear] < 0) continue;
          const name = bedrockPalette[primary[linear]]?.name;
          if (!name || !replaceable.has(name)) continue;
        }
        primary[linear] = pcIdx;
        secondary[linear] = -1;
        return true;
      }
      return false;
    };
    if (!tryPlace(true)) tryPlace(false);
  }
  if (bedrockPalette.length === 0) {
    ensurePalette("minecraft:air", {});
  }
  const blockPaletteList = {
    type: "list",
    value: {
      type: "compound",
      value: bedrockPalette.map(
        (entry) => nbt.comp({
          name: nbt.string(entry.name),
          states: nbt.comp(
            Object.fromEntries(
              Object.entries(entry.states).map(([k, v]) => [k, stateTagValue(k, v)])
            )
          ),
          version: nbt.int(blockVersionFor(entry.name))
        }).value
      )
    }
  };
  const root = {
    type: "compound",
    name: "",
    value: nbt.comp({
      format_version: nbt.int(1),
      size: { type: "list", value: { type: "int", value: [sx, sy, sz] } },
      structure_world_origin: { type: "list", value: { type: "int", value: [0, 0, 0] } },
      structure: nbt.comp({
        block_indices: {
          type: "list",
          value: {
            type: "list",
            value: [
              { type: "int", value: primary },
              { type: "int", value: secondary }
            ]
          }
        },
        entities: { type: "list", value: { type: "end", value: [] } },
        palette: nbt.comp({
          default: nbt.comp({
            block_palette: blockPaletteList,
            block_position_data: nbt.comp(positionData)
          })
        })
      })
    }).value
  };
  await mkdir3(path8.dirname(outMcstructurePath), { recursive: true });
  const outBuf = nbt.writeUncompressed(root, "little");
  await writeFile5(outMcstructurePath, outBuf);
  return { blocks: primary.filter((idx) => idx >= 0).length, size: [sx, sy, sz] };
}

// tools/lib/custom-block-states.ts
init_utils();
import { readFile as readFile9 } from "node:fs/promises";
import { existsSync as existsSync7 } from "node:fs";
async function loadCustomBlockStates() {
  const out = /* @__PURE__ */ new Map();
  let files;
  try {
    files = (await walkFiles(resolveFromRoot("bp/blocks"))).filter((f) => f.endsWith(".json"));
  } catch {
    return out;
  }
  for (const file of files) {
    let data;
    try {
      data = JSON.parse(await readFile9(file, "utf8"));
    } catch {
      continue;
    }
    const description = data["minecraft:block"]?.description;
    const id = description?.identifier;
    if (!id) continue;
    const keys = new Set(Object.keys(description?.states ?? {}));
    for (const trait of Object.values(description?.traits ?? {})) {
      for (const state of trait?.enabled_states ?? []) keys.add(state);
    }
    out.set(id, keys);
  }
  return out;
}
async function loadVanillaBlockStates() {
  const out = /* @__PURE__ */ new Map();
  try {
    const raw = await readFile9(
      bedrockSamples("metadata/vanilladata_modules/mojang-blocks.json"),
      "utf8"
    );
    const data = JSON.parse(raw.replace(/^﻿/, ""));
    for (const item of data.data_items ?? []) {
      if (!item.name) continue;
      out.set(
        item.name,
        new Set((item.properties ?? []).map((prop) => prop.name ?? "").filter(Boolean))
      );
    }
  } catch {
  }
  return out;
}
async function loadPortedFurniture() {
  const modDir = resolveFromRoot("recursos/CobbleFurnies/assets/cobblefurnies/blockstates");
  if (!existsSync7(modDir)) return [];
  const { readdir: readdir10 } = await import("node:fs/promises");
  const delMod = new Set(
    (await readdir10(modDir)).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5))
  );
  const nuestros = await readdir10(resolveFromRoot("bp/blocks")).catch(() => []);
  return nuestros.filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)).filter((name) => delMod.has(name));
}
async function loadTwoBlockFurniture() {
  const dir = resolveFromRoot("rp/models/blocks/furnies");
  if (!existsSync7(dir)) return [];
  const { readdir: readdir10 } = await import("node:fs/promises");
  const out = [];
  for (const file of await readdir10(dir)) {
    if (!file.endsWith(".geo.json")) continue;
    try {
      const geo = JSON.parse(await readFile9(resolveFromRoot(`rp/models/blocks/furnies/${file}`), "utf8"));
      const cubes = (geo["minecraft:geometry"]?.[0]?.bones ?? []).flatMap((b) => b.cubes ?? []);
      const alto = Math.max(0, ...cubes.map((c) => (c.origin?.[1] ?? 0) + (c.size?.[1] ?? 0)));
      if (alto > 16) out.push(file.replace(".geo.json", ""));
    } catch {
    }
  }
  return out;
}

// tools/lib/structure-worldgen.ts
var HEIGHTMAP = {
  WORLD_SURFACE_WG: "world_surface",
  WORLD_SURFACE: "world_surface",
  OCEAN_FLOOR_WG: "ocean_floor",
  OCEAN_FLOOR: "ocean_floor",
  MOTION_BLOCKING: "world_surface",
  MOTION_BLOCKING_NO_LEAVES: "world_surface"
};
var STEP_MAP = {
  raw_generation: "raw_generation",
  lakes: "lakes",
  local_modifications: "local_modifications",
  underground_structures: "underground_structures",
  surface_structures: "surface_structures",
  strongholds: "strongholds",
  underground_ores: "underground_ores",
  underground_decoration: "underground_decoration",
  fluid_springs: "fluid_springs",
  vegetal_decoration: "vegetal_decoration",
  top_layer_modification: "top_layer_modification"
};
var EXTRA_BIOME_FALLBACKS = {
  "has_block/oak_log": ["forest"],
  "has_block/birch_log": ["birch"],
  "has_block/spruce_log": ["taiga"],
  "has_block/acacia_log": ["savanna"],
  "has_block/jungle_log": ["jungle"],
  "has_block/dark_oak_log": ["roofed"],
  "has_block/mangrove_log": ["mangrove_swamp"],
  "has_block/cherry_log": ["cherry_grove"],
  // Sin estos dos, once estructuras caían al respaldo `forest` y aparecían en
  // bosques en vez de en desiertos y mesetas.
  // El tag del mod solo lista `minecraft:desert`; incluir `beach` metía los
  // oasis y las ruinas de arena en cualquier playa.
  "has_block/sand": ["desert"],
  "has_block/red_sand": ["mesa"]
};
var VANILLA_BIOME_SELECTORS = {
  "minecraft:ocean": { any: ["ocean"] },
  // Bedrock no tiene tag `deep_ocean`: los profundos llevan `deep` + `ocean`.
  "minecraft:deep_ocean": { all: ["ocean", "deep"] },
  "minecraft:dark_forest": { any: ["roofed"] },
  // `ice_plains` solo no basta: incluye las llanuras nevadas normales.
  "minecraft:ice_spikes": { all: ["ice_plains", "mutated"] },
  // **Los que piden los pueblos de CobbleTowns.** Las etiquetas salen de los
  // propios biomas del juego (`behavior_pack/biomes/*.biome.json`), no de
  // adivinar por el nombre: Bedrock llama `swampland` al pantano, `mesa` a las
  // tierras baldías y `roofed_forest` al bosque oscuro, y sus etiquetas no
  // siempre coinciden con el nombre. Donde dos biomas comparten etiqueta se
  // añade la que los separa —`mutated` para las variantes, `mega` para los
  // bosques viejos—, y donde eso no existe se acepta el de al lado: una
  // `sunflower_plains` es una llanura, y un pueblo de llanura cabe en ella.
  "minecraft:plains": { all: ["plains"] },
  "minecraft:sunflower_plains": { all: ["plains", "mutated"] },
  "minecraft:snowy_plains": { all: ["ice_plains"] },
  "minecraft:desert": { all: ["desert"] },
  "minecraft:swamp": { all: ["swamp"] },
  "minecraft:mangrove_swamp": { all: ["mangrove_swamp"] },
  // `forest` lo llevan también la taiga y el bosque oscuro; `oak_forest` es el
  // único que señala al bosque de robles.
  "minecraft:forest": { all: ["oak_forest"] },
  "minecraft:flower_forest": { all: ["flower_forest"] },
  "minecraft:birch_forest": { all: ["birch"] },
  "minecraft:old_growth_birch_forest": { all: ["birch", "mutated"] },
  "minecraft:old_growth_pine_taiga": { all: ["taiga", "mega"] },
  "minecraft:old_growth_spruce_taiga": { all: ["taiga", "mega", "mutated"] },
  "minecraft:taiga": { all: ["taiga"] },
  "minecraft:savanna": { all: ["savanna"] },
  "minecraft:savanna_plateau": { all: ["savanna", "plateau"] },
  "minecraft:windswept_savanna": { all: ["savanna", "mutated"] },
  "minecraft:windswept_hills": { all: ["extreme_hills"] },
  "minecraft:windswept_gravelly_hills": { all: ["extreme_hills", "mutated"] },
  "minecraft:windswept_forest": { all: ["extreme_hills", "forest"] },
  "minecraft:jungle": { all: ["jungle"] },
  "minecraft:sparse_jungle": { all: ["jungle", "edge"] },
  "minecraft:bamboo_jungle": { all: ["bamboo"] },
  "minecraft:badlands": { all: ["mesa"] },
  "minecraft:eroded_badlands": { all: ["mesa", "mutated"] },
  "minecraft:wooded_badlands": { all: ["mesa", "plateau"] },
  "minecraft:meadow": { all: ["meadow"] },
  "minecraft:grove": { all: ["grove"] },
  "minecraft:snowy_slopes": { all: ["snowy_slopes"] },
  "minecraft:beach": { all: ["beach"] },
  "minecraft:river": { all: ["river"] },
  "minecraft:warm_ocean": { all: ["ocean", "warm"] },
  "minecraft:lukewarm_ocean": { all: ["lukewarm"] },
  "minecraft:deep_lukewarm_ocean": { all: ["lukewarm", "deep"] }
};
function biomeTagFilters(biomesRaw) {
  if (!biomesRaw) return void 0;
  const list = Array.isArray(biomesRaw) ? biomesRaw : [biomesRaw];
  const expanded = [];
  for (const b of list) {
    if (b.startsWith("#cobblemon:has_block/")) {
      const key = b.slice("#cobblemon:".length);
      expanded.push(...(EXTRA_BIOME_FALLBACKS[key] ?? ["forest"]).map((t) => `#fake:${t}`));
      continue;
    }
    expanded.push(b);
  }
  const selectors = [];
  const real = expanded.filter((b) => !b.startsWith("#fake:"));
  selectors.push(...mapCobblemonSelectors(real).map((t) => t.selector));
  for (const f of expanded.filter((b) => b.startsWith("#fake:"))) {
    selectors.push({ any: [f.slice("#fake:".length)] });
  }
  for (const raw of real) {
    const direct = VANILLA_BIOME_SELECTORS[raw];
    if (direct) selectors.push(direct);
  }
  if (selectors.length === 0) {
    console.warn(`[cooblemon] Bioma sin traducir (${list.join(", ")}): la estructura sale en todo el mundo normal`);
    return [{ test: "has_biome_tag", operator: "==", value: "overworld" }];
  }
  const filters = [];
  for (const sel of selectors) {
    const parts = [];
    if (sel.any?.length) {
      parts.push({
        any_of: sel.any.map((t) => ({ test: "has_biome_tag", operator: "==", value: t }))
      });
    }
    if (sel.all?.length) {
      parts.push({
        all_of: sel.all.map((t) => ({ test: "has_biome_tag", operator: "==", value: t }))
      });
    }
    if (sel.not?.length) {
      parts.push({
        none_of: sel.not.map((t) => ({ test: "has_biome_tag", operator: "==", value: t }))
      });
    }
    if (parts.length === 1) filters.push(parts[0]);
    else if (parts.length > 1) filters.push({ all_of: parts });
  }
  return filters.length === 1 ? filters : [{ any_of: filters }];
}
function mapVerticalAnchor(raw) {
  if (!raw) return { absolute: 0 };
  if (typeof raw.absolute === "number") return { absolute: raw.absolute };
  if (typeof raw.above_bottom === "number") return { from_bottom: raw.above_bottom };
  if (typeof raw.below_top === "number") return { from_top: raw.below_top };
  if (typeof raw.from_bottom === "number") return { from_bottom: raw.from_bottom };
  if (typeof raw.from_top === "number") return { from_top: raw.from_top };
  if (typeof raw.from_sea === "number") return { from_sea: raw.from_sea };
  return { absolute: 0 };
}
function mapStartHeight(raw) {
  if (raw == null) {
    return { type: "constant", value: { absolute: 0 } };
  }
  if (typeof raw === "number") {
    return { type: "constant", value: { absolute: raw } };
  }
  const obj = raw;
  if (typeof obj.absolute === "number") {
    return { type: "constant", value: { absolute: obj.absolute } };
  }
  if (typeof obj.above_bottom === "number") {
    return { type: "constant", value: { from_bottom: obj.above_bottom } };
  }
  if (typeof obj.below_top === "number") {
    return { type: "constant", value: { from_top: obj.below_top } };
  }
  if (obj.type === "minecraft:uniform" || obj.min_inclusive || obj.max_inclusive) {
    const minRaw = obj.min_inclusive ?? obj.min ?? { absolute: 0 };
    const maxRaw = obj.max_inclusive ?? obj.max ?? { absolute: 0 };
    const min = mapVerticalAnchor(minRaw);
    const max = mapVerticalAnchor(maxRaw);
    if (JSON.stringify(min) === JSON.stringify(max)) {
      return { type: "constant", value: min };
    }
    return {
      type: "uniform",
      min,
      max
    };
  }
  return { type: "constant", value: { absolute: 0 } };
}
function javaStructureToBedrock(relativeId, java, namespace = "cobblemon") {
  const identifier = remapStructureRef(`${namespace}:${relativeId.replace(/\\/g, "/")}`);
  const rawPool = String(java.start_pool ?? "");
  const startPool = rawPool === "minecraft:empty" ? identifier : remapStructureRef(rawPool);
  const size = typeof java.size === "number" ? java.size : 7;
  const step = STEP_MAP[String(java.step ?? "surface_structures")] ?? "surface_structures";
  const heightmapRaw = String(java.project_start_to_heightmap ?? "");
  const heightmap = HEIGHTMAP[heightmapRaw];
  const terrain = String(java.terrain_adaptation ?? "none");
  const maxDist = java.max_distance_from_center;
  const biomeFilters = biomeTagFilters(java.biomes);
  const out = {
    format_version: "1.21.20",
    "minecraft:jigsaw": {
      description: { identifier },
      step,
      terrain_adaptation: ["none", "bury", "beard_thin", "beard_box", "encapsulate"].includes(terrain) ? terrain : "beard_thin",
      start_pool: startPool,
      max_depth: Math.min(20, Math.max(0, size)),
      start_height: mapStartHeight(java.start_height),
      ...heightmap ? { heightmap_projection: heightmap } : {},
      ...biomeFilters ? { biome_filters: biomeFilters } : {},
      ...typeof java.dimension_padding === "number" ? { dimension_padding: java.dimension_padding } : {},
      ...java.liquid_settings ? { liquid_settings: String(java.liquid_settings) } : {},
      ...typeof maxDist === "number" ? { max_distance_from_center: { horizontal: maxDist, vertical: maxDist } } : {}
    }
  };
  return out;
}
function javaTemplatePoolToBedrock(relativeId, java, namespace = "cobblemon") {
  const identifier = remapStructureRef(`${namespace}:${relativeId.replace(/\\/g, "/")}`);
  const elementsIn = Array.isArray(java.elements) ? java.elements : [];
  const elements = elementsIn.map((entry) => {
    const el = entry.element ?? entry;
    const type = String(el.element_type ?? "minecraft:single_pool_element");
    if (type === "minecraft:empty_pool_element") {
      return {
        weight: Number(entry.weight ?? 1),
        element: { element_type: "minecraft:empty_pool_element" }
      };
    }
    if (type === "minecraft:feature_pool_element") {
      return null;
    }
    const locationRaw = String(el.location ?? "");
    const location = locationRaw.includes(":") ? remapNamespaceId(locationRaw).replace(":", "/") : `cooblemon/${locationRaw}`;
    const processorsRaw = String(el.processors ?? "minecraft:empty");
    const processors = processorsRaw === "minecraft:empty" || processorsRaw === "" ? "" : remapStructureRef(processorsRaw);
    const projection = String(el.projection ?? "rigid");
    return {
      weight: Math.max(1, Math.min(200, Number(entry.weight ?? 1))),
      element: {
        element_type: "minecraft:single_pool_element",
        location,
        ...processors ? { processors } : {},
        projection: projection === "terrain_matching" ? "terrain_matching" : "rigid"
      }
    };
  }).filter(Boolean);
  return {
    format_version: "1.21.20",
    "minecraft:template_pool": {
      description: { identifier },
      fallback: remapStructureRef(String(java.fallback ?? "minecraft:empty")),
      elements
    }
  };
}
function javaStructureSetToBedrock(relativeId, java, namespace = "cobblemon") {
  const identifier = remapStructureRef(
    `${namespace}:${relativeId.replace(/\\/g, "/").replace(/\.json$/, "")}`
  );
  const placement = java.placement ?? {};
  const structures = Array.isArray(java.structures) ? java.structures : [];
  const { spacing, separation } = clampStructureSetSpacing(
    Number(placement.spacing ?? 24),
    Number(placement.separation ?? 8)
  );
  return {
    format_version: "1.21.20",
    "minecraft:structure_set": {
      description: { identifier },
      placement: {
        type: "minecraft:random_spread",
        salt: Number(placement.salt ?? 1),
        separation,
        spacing,
        spread_type: placement.spread_type === "triangular" ? "triangular" : "linear"
      },
      structures: structures.map((s) => ({
        structure: remapStructureRef(String(s.structure)),
        weight: Math.max(1, Math.min(200, Number(s.weight ?? 1)))
      }))
    }
  };
}
function mapOutputState(state) {
  if (!state) return null;
  const javaName = String(state.Name ?? "minecraft:air");
  const props = state.Properties ?? {};
  const mapped = mapJavaBlockState(javaName, props);
  const out = { name: mapped.name };
  if (Object.keys(mapped.states).length > 0) {
    out.states = mapped.states;
  }
  return out;
}
var GIMMIGHOUL_CHEST = "cobblemon:gimmighoul_chest";
var GIMMIGHOUL_CHEST_LOOT = "cobblemon:ruins/gilded_chests/ruins";
function javaProcessorListToBedrock(relativeId, java, namespace = "cobblemon") {
  const identifier = remapStructureRef(`${namespace}:${relativeId.replace(/\\/g, "/")}`);
  const processorsIn = Array.isArray(java.processors) ? java.processors : [];
  const processors = [];
  for (const proc of processorsIn) {
    const type = String(proc.processor_type ?? "");
    if (type === "minecraft:rule") {
      const rules = [];
      for (const rule of proc.rules ?? []) {
        const input = rule.input_predicate ?? {};
        const predType = String(input.predicate_type ?? "");
        let input_predicate = null;
        if (predType === "minecraft:random_block_match" || predType === "minecraft:block_match") {
          input_predicate = {
            predicate_type: predType === "minecraft:block_match" ? "minecraft:block_match" : "minecraft:random_block_match",
            block: remapBlockId(String(input.block ?? "minecraft:air")),
            ...typeof input.probability === "number" ? { probability: input.probability } : {}
          };
        } else if (predType === "minecraft:random_blockstate_match") {
          const bs = input.block_state ?? {};
          input_predicate = {
            predicate_type: "minecraft:random_block_match",
            block: remapBlockId(String(bs.Name ?? "minecraft:air")),
            probability: typeof input.probability === "number" ? input.probability : 1
          };
        }
        const output = mapOutputState(rule.output_state);
        if (!input_predicate || !output) continue;
        if (input_predicate.block === output.name && output.name === "minecraft:chest") {
          delete output.states;
        }
        const outRule = {
          input_predicate,
          output_state: output
        };
        const bem = rule.block_entity_modifier;
        let lootRef = bem && String(bem.type ?? "").includes("append_loot") ? String(bem.loot_table ?? "") : "";
        const outputName = String(rule.output_state?.Name ?? "");
        if (!lootRef && outputName === GIMMIGHOUL_CHEST) lootRef = GIMMIGHOUL_CHEST_LOOT;
        if (lootRef) {
          const loot = remapLootTableRef(lootRef);
          if (loot) {
            outRule.block_entity_modifier = {
              type: "minecraft:append_loot",
              loot_table: loot
            };
          }
        }
        const key = JSON.stringify(outRule);
        if (rules.some((r) => JSON.stringify(r) === key)) continue;
        rules.push(outRule);
      }
      if (rules.length) {
        processors.push({ processor_type: "minecraft:rule", rules });
      }
    } else if (type === "minecraft:capped") {
      const delegate = proc.delegate;
      if (delegate?.processor_type === "minecraft:rule") {
        const nested = javaProcessorListToBedrock("_tmp", { processors: [delegate] });
        const nestedProcs = nested?.["minecraft:processor_list"]?.processors ?? [];
        if (nestedProcs[0]) {
          processors.push({
            processor_type: "minecraft:capped",
            limit: Number(proc.limit ?? 1),
            delegate: nestedProcs[0]
          });
        }
      }
    }
  }
  if (processors.length === 0) return null;
  return {
    format_version: "1.21.20",
    "minecraft:processor_list": {
      description: { identifier },
      processors
    }
  };
}

// tools/kit/structures.ts
init_utils();
var BASE_NAMESPACES = /* @__PURE__ */ new Set(["minecraft", "cobblemon", "waystones", "cobblefurnies", "cobbletowns", "mega_showdown"]);
var VANILLA_STRUCTURE_TAGS = {
  "#minecraft:has_structure/village_plains": ["minecraft:plains", "minecraft:meadow"],
  "#minecraft:has_structure/village_desert": ["minecraft:desert"],
  "#minecraft:has_structure/village_savanna": ["minecraft:savanna"],
  "#minecraft:has_structure/village_snowy": ["minecraft:snowy_plains"],
  "#minecraft:has_structure/village_taiga": ["minecraft:taiga"],
  "#minecraft:has_structure/swamp_hut": ["minecraft:swamp"]
};
var MIN_SKILL = 0.55;
var BLOCK_STATES_FILE = "data/structure-block-states.json";
async function blockStateLists() {
  const toObj = (m) => Object.fromEntries([...m].map(([k, v]) => [k, [...v]]));
  return {
    custom: toObj(await loadCustomBlockStates()),
    vanilla: toObj(await loadVanillaBlockStates()),
    furniture: await loadPortedFurniture(),
    twoBlock: await loadTwoBlockFurniture()
  };
}
async function walk3(dir) {
  if (!existsSync8(dir)) return [];
  const out = [];
  for (const entry of await readdir7(dir, { withFileTypes: true })) {
    const full = path9.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk3(full));
    else out.push(full);
  }
  return out;
}
async function readJson2(file) {
  return JSON.parse((await readFile10(file, "utf8")).replace(/^﻿/, ""));
}
async function writeJson3(file, data) {
  await mkdir4(path9.dirname(file), { recursive: true });
  await writeFile6(file, `${JSON.stringify(data, null, 2)}
`, "utf8");
}
function relId2(root, file, ext) {
  return path9.relative(root, file).split(path9.sep).join("/").slice(0, -ext.length);
}
function slug(text) {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40) || "npc";
}
function plainName(raw, lang) {
  if (typeof raw !== "string" || !raw) return null;
  let value = raw;
  try {
    value = JSON.parse(raw);
  } catch {
  }
  if (typeof value === "string") return lang[value] ?? readableKey(value);
  if (value && typeof value === "object") {
    const v = value;
    if (typeof v.text === "string" && v.text) return v.text;
    if (typeof v.translate === "string") return lang[v.translate] ?? readableKey(v.translate);
  }
  return null;
}
function readableKey(text) {
  const m = /^(?:[a-z0-9_]+\.)+([a-z0-9_]+)\.name$/.exec(text);
  if (!m) return text;
  return m[1].split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
function dialogueLine(raw, npcName) {
  if (typeof raw === "string") return raw;
  const expr = raw?.expression;
  if (typeof expr !== "string") return null;
  let out = "";
  const re = /\s*(?:'((?:[^'\\]|\\.)*)'|(q\.player\.username)|(q\.npc\.name))\s*(\+|$)/gy;
  let consumed = 0;
  for (const m of expr.matchAll(re)) {
    if (m[1] !== void 0) out += m[1].replace(/\\(.)/g, "$1");
    else if (m[2]) out += "%s";
    else if (m[3]) out += npcName;
    consumed = (m.index ?? 0) + m[0].length;
    if (m[4] === "") break;
  }
  return consumed >= expr.trimEnd().length && out ? out : null;
}
function langText(text) {
  return text.replace(/\r?\n/g, " ").trim();
}
function partyMember(raw, warn) {
  const [head, ...rest] = raw.trim().split(/\s+/);
  if (!head) return null;
  const member = { species: head.replace(/^cobblemon:/, "") };
  for (const token of rest) {
    const [key, value] = token.split("=");
    if (!value) {
      if (key === "shiny") member.shiny = true;
      else warn(`"${key}" (aspects and forms are not supported in a team yet)`);
      continue;
    }
    if (key === "level" || key === "lvl") member.level = Number(value);
    else if (key === "held_item") member.heldItem = value;
    else if (key === "moves") member.moves = value.split(",").filter(Boolean);
    else if (key === "ability") member.ability = value;
    else if (key === "shiny") member.shiny = value === "true" || value === "yes";
  }
  return member;
}
function readDialogue(pages, npcName) {
  const byId = new Map(pages.map((p) => [p.id ?? "", p]));
  const linesOf = (page2) => (page2.lines ?? []).map((l) => dialogueLine(l, npcName)).filter((l) => !!l);
  const allActions = JSON.stringify(pages);
  const heals = /heal_player_pokemon|heal/i.test(allActions);
  const hurtPage = pages.find((p) => p.speaker === "npc" && /hurt/i.test(p.id ?? ""));
  const hurt = hurtPage ? linesOf(hurtPage).join(" ") || null : null;
  let page = pages.find((p) => p.speaker === "npc" && p !== hurtPage);
  const said = [];
  let options = [];
  for (let hops = 0; page && hops < 4; hops++) {
    said.push(...linesOf(page));
    const input = page.input;
    if (input && typeof input === "object" && Array.isArray(input.options)) {
      options = input.options;
      break;
    }
    const next = typeof input === "string" ? /set_page\('([^']+)'\)/.exec(input)?.[1] : void 0;
    const nextPage = next ? byId.get(next) : void 0;
    if (!nextPage || nextPage.speaker !== "npc") {
      const ahead = pages.find((p) => p.speaker === "npc" && typeof p.input === "object" && p.input.options);
      if (ahead && ahead !== page) options = ahead.input.options ?? [];
      break;
    }
    page = nextPage;
  }
  const mapped = /* @__PURE__ */ new Set();
  for (const option of options) {
    const text = `${option.value ?? ""} ${JSON.stringify(option.action ?? "")}`;
    if (/heal/i.test(text)) mapped.add("heal");
    else if (/battle|challenge/i.test(text)) mapped.add("battle");
    else if (/shop|trade|merchant/i.test(text)) mapped.add("shop");
    else if (/close|cancel|bye|no\b/i.test(text)) mapped.add("close");
  }
  if (mapped.size > 0 && !mapped.has("close")) mapped.add("close");
  return { greeting: said.join(" ") || null, hurt, options: [...mapped], heals };
}
function zoneSpot(size, cells, taken) {
  const [sx = 0, sy = 0, sz = 0] = size;
  const cx = Math.floor(sx / 2);
  const cz = Math.floor(sz / 2);
  const open = (name) => name === "minecraft:air" || name === "minecraft:cave_air";
  const ground = (name) => !!name && !open(name) && !/water|lava|structure_void|jigsaw|leaves|fence|wall|torch|carpet|door|pane|sign/.test(name);
  for (let r = 0; r <= Math.max(cx, cz); r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dz = -r; dz <= r; dz++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
        const x = cx + dx;
        const z = cz + dz;
        if (x < 0 || z < 0 || x >= sx || z >= sz) continue;
        for (let y = 1; y < sy; y++) {
          const key = `${x},${y},${z}`;
          if (open(cells.get(key)) && ground(cells.get(`${x},${y - 1},${z}`)) && !taken.has(key)) return key;
        }
      }
    }
  }
  return null;
}
async function convertStructures(opts) {
  const { input, ns, bp } = opts;
  const data = path9.join(input, "data", ns);
  const pieceRoot = [path9.join(data, "structure"), path9.join(data, "structures")].find((d) => existsSync8(d));
  if (!pieceRoot) return null;
  try {
    const shipped = resolveFromRoot(BLOCK_STATES_FILE);
    const lists = existsSync8(shipped) ? await readJson2(shipped) : await blockStateLists();
    const toMap = (o) => new Map(Object.entries(o).map(([k, v]) => [k, new Set(v)]));
    registerCustomBlockStates(toMap(lists.custom));
    registerVanillaBlockStates(toMap(lists.vanilla));
    registerPortedFurniture(lists.furniture);
    registerTwoBlockFurniture(lists.twoBlock);
  } catch (error) {
    logWarn(`Structures: the base block list could not be read (${String(error)}); block states are not filtered`);
  }
  const langDir = path9.join(input, "assets", ns, "lang");
  const langFiles = (await walk3(langDir)).filter((f) => f.endsWith(".json"));
  const english = {};
  for (const file of langFiles) {
    if (path9.basename(file, ".json") === "en_us") Object.assign(english, await readJson2(file));
  }
  const cobblemonLang = path9.join(input, "assets", "cobblemon", "lang", "en_us.json");
  if (existsSync8(cobblemonLang)) Object.assign(english, await readJson2(cobblemonLang), english);
  const classes = /* @__PURE__ */ new Map();
  for (const file of (await walk3(path9.join(input, "data", "cobblemon", "npcs"))).filter((f) => f.endsWith(".json"))) {
    const json = await readJson2(file);
    classes.set(json.resourceIdentifier ?? `cobblemon:${path9.basename(file, ".json")}`, json);
    classes.set(`cobblemon:${path9.basename(file, ".json")}`, json);
  }
  const dialogues = /* @__PURE__ */ new Map();
  for (const file of (await walk3(path9.join(input, "data", "cobblemon", "dialogues"))).filter((f) => f.endsWith(".json"))) {
    const json = await readJson2(file);
    dialogues.set(`cobblemon:${path9.basename(file, ".json")}`, json.pages ?? []);
  }
  registerAddonJigsawNamespace(ns);
  const worldgen = path9.join(data, "worldgen");
  const poolFiles = (await walk3(path9.join(worldgen, "template_pool"))).filter((f) => f.endsWith(".json"));
  registerKnownJigsawPools(poolFiles.map((f) => `${ns}:${relId2(path9.join(worldgen, "template_pool"), f, ".json")}`));
  const npcs = {};
  const npcIndex = /* @__PURE__ */ new Map();
  const npcSignature = /* @__PURE__ */ new Map();
  const pokemonIndex = /* @__PURE__ */ new Map();
  const pokemonMarker = {};
  const lang = /* @__PURE__ */ new Map();
  const entityReport = /* @__PURE__ */ new Map();
  const blockReport = /* @__PURE__ */ new Map();
  const notes = [];
  const count = (map, id, action) => {
    const now = map.get(id) ?? { count: 0, action };
    now.count++;
    map.set(id, now);
  };
  let skinTurn = 0;
  const defineNpc = (name, definition) => {
    const signature = JSON.stringify(definition);
    const known = npcSignature.get(signature);
    if (known) return known;
    let id = `${ns}:${slug(name)}`;
    for (let n = 2; npcs[id]; n++) id = `${ns}:${slug(name)}_${n}`;
    npcs[id] = definition;
    npcSignature.set(signature, id);
    npcIndex.set(id, npcIndex.size);
    return id;
  };
  const merchantFrom = (e) => {
    const name = plainName(e.CustomName, english) ?? "Merchant";
    const shop = [];
    for (const cat of e.CobbleMerchantShop ?? []) {
      const offers = [];
      for (const offer of cat.Offers ?? []) {
        const item = String(offer.Item?.id ?? "");
        const price = Number(offer.Price);
        const space = item.split(":")[0] ?? "";
        if (!item || !Number.isFinite(price)) continue;
        if (!["minecraft", "cobblemon", ns].includes(space)) {
          notes.push(`${name}: "${item}" is from another mod; left out of the shop`);
          continue;
        }
        offers.push({ item, price: Math.max(0, Math.round(price)) });
      }
      if (offers.length) shop.push({ name: cat.Category ?? "Shop", offers });
    }
    if (!shop.length) return null;
    const nurse = /nurse/i.test(name);
    const skin = nurse ? "nurse-joy" : skinTurn++ % 2 === 0 ? "shop_keeper" : "shop_keeper_2";
    return defineNpc(name, { name: name.slice(0, 32), role: "merchant", skin, shop });
  };
  const npcFrom = (e) => {
    const classId = String(e.NPCClass ?? "");
    const cls = classes.get(classId);
    const profession = String(e.VillagerData?.profession ?? "");
    const name = plainName(e.CustomName, english) ?? (cls?.names?.[0] ? english[cls.names[0]] ?? readableKey(cls.names[0]) : null) ?? classId.split(":")[1] ?? "NPC";
    if (!cls) notes.push(`${name}: NPC class "${classId}" is not in data/cobblemon/npcs; it only talks`);
    const config = new Map((cls?.config ?? []).map((c) => [c.variableName ?? "", c.defaultValue]));
    const pages = cls?.interaction?.dialogue ? dialogues.get(cls.interaction.dialogue) ?? [] : [];
    const dialogue = readDialogue(pages, name);
    const team = (cls?.party?.pokemon ?? []).map((p) => partyMember(p, (msg) => notes.push(`${name}: ${msg}`))).filter((m) => !!m).slice(0, 6);
    const trainer = team.length > 0 && cls?.battleConfiguration?.canChallenge !== false;
    const nurse = profession === "cobblemon:nurse" || dialogue.heals && !trainer;
    const role = trainer ? "trainer" : nurse ? "nurse" : "talker";
    const key = `${ns}.npc.${slug(name)}`;
    const def = { name: name.slice(0, 32), role };
    if (nurse) def.skin = "nurse-joy";
    if (trainer) {
      def.team = team;
      const ticks = Number(config.get("challenge_cooldown"));
      const battle = {};
      if (Number.isFinite(ticks)) battle.cooldown = Math.max(0, Math.ceil(ticks / 20));
      if (config.get("can_rechallenge") === false) battle.rematch = false;
      def.battle = battle;
      if (typeof cls?.skill === "number") def.skill = Math.max(MIN_SKILL, Math.min(1, cls.skill / 5));
    }
    const dlg = {};
    const line = (suffix, text) => {
      if (typeof text !== "string" || !text.trim()) return null;
      lang.set(`${key}.${suffix}`, langText(text));
      return [`${key}.${suffix}`];
    };
    const greeting = line("greeting", dialogue.greeting ?? (trainer ? config.get("intro_text") : null));
    if (greeting) dlg.greeting = greeting;
    if (dialogue.options.length) {
      const allowed = dialogue.options.filter((o) => o === "close" || o === "battle" && trainer || o === "heal" && nurse);
      if (allowed.some((o) => o !== "close") || greeting) dlg.options = allowed.length ? allowed : ["close"];
    }
    const hurt = line("hurt", dialogue.hurt);
    if (hurt) dlg.hurt = hurt;
    if (trainer) {
      const challenge = line("challenge", config.get("challenge_accepted_text"));
      const cooldown = line("cooldown", config.get("challenge_cooldown_text"));
      if (challenge) dlg.challenge = challenge;
      if (cooldown) dlg.cooldown = cooldown;
    }
    if (Object.keys(dlg).length) def.dialogue = dlg;
    return defineNpc(name, def);
  };
  const pokemonFrom = (e) => {
    const p = e.Pokemon;
    if (!p?.Species) return null;
    const request = { species: p.Species.replace(/^cobblemon:/, ""), level: Number(p.Level) || 5, tag: `${ns}:structure` };
    if (p.Shiny === 1 || p.Shiny === true) request.shiny = true;
    const signature = JSON.stringify(request);
    let index = pokemonIndex.get(signature);
    if (index === void 0) {
      index = pokemonIndex.size;
      pokemonIndex.set(signature, index);
      pokemonMarker[index] = request;
    }
    return index;
  };
  const zonesByPiece = /* @__PURE__ */ new Map();
  for (const zone of opts.zones ?? []) {
    const file = path9.join(data, "worldgen", "structure", `${zone.slice(ns.length + 1)}.json`);
    if (!existsSync8(file)) continue;
    const startPool = String((await readJson2(file)).start_pool ?? "");
    const poolFile = startPool.startsWith(`${ns}:`) ? path9.join(data, "worldgen", "template_pool", `${startPool.slice(ns.length + 1)}.json`) : "";
    if (!poolFile || !existsSync8(poolFile)) {
      notes.push(`Zone ${zone}: start pool "${startPool}" not found; the zone has no marker`);
      continue;
    }
    const locations = [];
    const collect = (element) => {
      if (!element) return;
      if (typeof element.location === "string") locations.push(element.location);
      for (const inner of element.elements ?? []) collect(inner);
    };
    for (const e of (await readJson2(poolFile)).elements ?? []) collect(e.element);
    for (const location of locations) {
      if (!location.startsWith(`${ns}:`)) continue;
      const rel = location.slice(ns.length + 1);
      const set = zonesByPiece.get(rel) ?? /* @__PURE__ */ new Set();
      set.add(zone);
      zonesByPiece.set(rel, set);
    }
  }
  const zoneIndex = /* @__PURE__ */ new Map();
  const zoneMarker = {};
  const pieceFiles = (await walk3(pieceRoot)).filter((f) => f.endsWith(".nbt"));
  const markers = /* @__PURE__ */ new Map();
  for (const file of pieceFiles) {
    const pieceZones = zonesByPiece.get(relId2(pieceRoot, file, ".nbt"));
    const { parsed } = await nbt2.parse(await readFile10(file));
    const piece = nbt2.simplify(parsed);
    if (!piece.entities?.length && !pieceZones) continue;
    const cells = /* @__PURE__ */ new Map();
    for (const b of piece.blocks ?? []) cells.set(b.pos.join(","), piece.palette?.[b.state]?.Name ?? "");
    const here = /* @__PURE__ */ new Map();
    for (const entity of piece.entities ?? []) {
      const e = entity.nbt ?? {};
      const id = String(e.id ?? "?");
      let marker = null;
      if (id === "cobbledollars:cobble_merchant") {
        const npc = merchantFrom(e);
        if (npc) marker = { kind: "npc", index: npcIndex.get(npc) };
      } else if (id === "cobblemon:npc") {
        const npc = npcFrom(e);
        if (npc) marker = { kind: "npc", index: npcIndex.get(npc) };
      } else if (id === "cobblemon:pokemon") {
        const index = pokemonFrom(e);
        if (index !== null) marker = { kind: "pokemon", index };
      }
      if (!marker) {
        count(entityReport, id, "left out: Bedrock structures can't carry entities");
        continue;
      }
      const [x, y, z] = entity.blockPos ?? [];
      let spot = null;
      let water = false;
      const tries = [
        [0, ["minecraft:air", "minecraft:water"]],
        [1, ["minecraft:air"]],
        [2, ["minecraft:air"]],
        [1, ["minecraft:water"]],
        [2, ["minecraft:water"]]
      ];
      for (const [dy, wanted] of tries) {
        if (x === void 0 || y === void 0 || z === void 0) break;
        const key = `${x},${y + dy},${z}`;
        const cell = cells.get(key) ?? "";
        if (wanted.includes(cell) && !here.has(key)) {
          spot = key;
          water = cell === "minecraft:water";
          break;
        }
      }
      if (!spot) {
        count(entityReport, id, "left out: no air cell for its marker");
        notes.push(`${relId2(pieceRoot, file, ".nbt")}: ${id} at ${entity.blockPos?.join(",")} has no air above it for its marker`);
        continue;
      }
      here.set(spot, { ...marker, water });
      count(entityReport, id, marker.kind === "npc" ? "NPC marker" : "Pok\xE9mon marker");
    }
    if (pieceZones) {
      const list = [...pieceZones].sort();
      const signature = list.join("|");
      let index = zoneIndex.get(signature);
      if (index === void 0) {
        index = zoneIndex.size;
        zoneIndex.set(signature, index);
        zoneMarker[index] = list;
      }
      const spot = zoneSpot(piece.size ?? [], cells, here);
      if (spot) here.set(spot, { kind: "zone", index, water: false });
      else notes.push(`${relId2(pieceRoot, file, ".nbt")}: no open ground for the marker of ${list.join(", ")}`);
    }
    if (here.size) markers.set(file, here);
  }
  const npcGroups = Math.max(1, Math.ceil(npcIndex.size / 16));
  const pokemonGroups = Math.max(1, Math.ceil(pokemonIndex.size / 16));
  const zoneGroups = Math.max(1, Math.ceil(zoneIndex.size / 16));
  const groupsOf = { npc: npcGroups, pokemon: pokemonGroups, zone: zoneGroups };
  const markerBlock = (kind, index, waterlogged) => {
    const states = { [`${ns}:${kind}`]: index % 16 };
    if (groupsOf[kind] > 1) states[`${ns}:${kind}_group`] = Math.floor(index / 16);
    return { name: `${ns}:${kind}_marker`, states, placeAir: true, waterlogged };
  };
  let converted = 0;
  for (const file of pieceFiles) {
    const rel = relId2(pieceRoot, file, ".nbt");
    const here = markers.get(file);
    const rewrite = ({ javaName, pos }) => {
      const marker = here?.get(pos.join(","));
      if (marker) return markerBlock(marker.kind, marker.index, marker.water);
      const space = javaName.split(":")[0] ?? "";
      if (BASE_NAMESPACES.has(space)) return void 0;
      const mapped = javaName in opts.blockMap ? opts.blockMap[javaName] : opts.blockMap[`${space}:*`];
      if (mapped !== void 0) {
        count(blockReport, javaName, mapped ? `\u2192 ${mapped}` : "removed (block map)");
        return { name: mapped ?? "minecraft:air", placeAir: true };
      }
      if (space === ns) {
        count(blockReport, javaName, "kept (your own block; states are not converted)");
        return { name: javaName };
      }
      count(blockReport, javaName, "removed: block from another mod");
      return { name: "minecraft:air", placeAir: true };
    };
    try {
      await convertJavaNbtToMcstructure(file, path9.join(bp, "structures", ns, `${rel}.mcstructure`), { blockRewrite: rewrite });
      converted++;
    } catch (error) {
      logWarn(`Structure ${rel}: ${String(error)}`);
    }
  }
  const resolveBiomes = async (raw) => {
    const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
    const out = [];
    const pending = list.map(String);
    for (let guard = 0; pending.length && guard < 200; guard++) {
      const ref = pending.shift();
      const vanilla = VANILLA_STRUCTURE_TAGS[ref];
      if (vanilla) {
        out.push(...vanilla);
        continue;
      }
      const tag = new RegExp(`^#${ns}:(.+)$`).exec(ref);
      if (!tag) {
        out.push(ref);
        continue;
      }
      const file = path9.join(data, "tags", "worldgen", "biome", `${tag[1]}.json`);
      if (!existsSync8(file)) {
        notes.push(`Biome tag ${ref} not found`);
        continue;
      }
      for (const value of (await readJson2(file)).values ?? []) {
        const id = typeof value === "string" ? value : value?.id;
        if (typeof id === "string" && (id.startsWith("minecraft:") || id.startsWith("#"))) pending.push(id);
      }
    }
    return out.length ? out : raw;
  };
  for (const file of poolFiles) {
    const id = relId2(path9.join(worldgen, "template_pool"), file, ".json");
    await writeJson3(path9.join(bp, "worldgen", "template_pools", ns, `${id}.json`), javaTemplatePoolToBedrock(id, await readJson2(file), ns));
  }
  const processorFiles = (await walk3(path9.join(worldgen, "processor_list"))).filter((f) => f.endsWith(".json"));
  for (const file of processorFiles) {
    const id = relId2(path9.join(worldgen, "processor_list"), file, ".json");
    const out = javaProcessorListToBedrock(id, await readJson2(file), ns);
    if (out) await writeJson3(path9.join(bp, "worldgen", "processors", ns, `${id}.json`), out);
  }
  const structureFiles = (await walk3(path9.join(worldgen, "structure"))).filter((f) => f.endsWith(".json"));
  const ownStructures = /* @__PURE__ */ new Set();
  for (const file of structureFiles) {
    const id = relId2(path9.join(worldgen, "structure"), file, ".json");
    const java = await readJson2(file);
    if (java.type !== void 0 && java.type !== "minecraft:jigsaw") {
      notes.push(`Structure ${ns}:${id} is "${String(java.type)}", not jigsaw: left out`);
      continue;
    }
    ownStructures.add(`${ns}:${id}`);
    await writeJson3(
      path9.join(bp, "worldgen", "structures", ns, `${id}.json`),
      javaStructureToBedrock(id, { ...java, biomes: await resolveBiomes(java.biomes) }, ns)
    );
  }
  const setDirs = [path9.join(worldgen, "structure_set"), path9.join(input, "data", "minecraft", "worldgen", "structure_set")];
  let sets = 0;
  for (const [i, dir] of setDirs.entries()) {
    for (const file of (await walk3(dir)).filter((f) => f.endsWith(".json"))) {
      const id = relId2(dir, file, ".json");
      const java = await readJson2(file);
      const structures = (java.structures ?? []).filter((s) => ownStructures.has(String(s.structure)));
      if (!structures.length) continue;
      if (i === 1) {
        notes.push(
          `minecraft:${id} is replaced by the mod in Java; in Bedrock it becomes ${ns}:${id} and its structures generate in addition to vanilla ones`
        );
      }
      await writeJson3(path9.join(bp, "worldgen", "structure_sets", ns, `${id}.json`), javaStructureSetToBedrock(id, { ...java, structures }, ns));
      sets++;
    }
  }
  let loot = 0;
  for (const dirName of ["loot_table", "loot_tables"]) {
    const dir = path9.join(data, dirName);
    for (const file of (await walk3(dir)).filter((f) => f.endsWith(".json"))) {
      const table = javaLootTableToBedrock(await readJson2(file));
      if (!table) continue;
      await writeJson3(path9.join(bp, "loot_tables", ns, `${relId2(dir, file, ".json")}.json`), table);
      loot++;
    }
  }
  const writeMarker = async (kind, groups) => {
    const states = { [`${ns}:${kind}`]: { values: { min: 0, max: 15 } } };
    if (groups > 1) states[`${ns}:${kind}_group`] = { values: { min: 0, max: groups - 1 } };
    await writeJson3(path9.join(bp, "blocks", `${kind}_marker.json`), {
      format_version: "1.21.60",
      "minecraft:block": {
        description: { identifier: `${ns}:${kind}_marker`, menu_category: { category: "none" }, states },
        components: {
          "minecraft:custom_components": [`${ns}:${kind}_marker`],
          "minecraft:tick": { interval_range: [10, 30] },
          "minecraft:geometry": "geometry.cooblemon_empty",
          "minecraft:material_instances": { "*": { texture: "cooblemon_empty", render_method: "blend" } },
          "minecraft:collision_box": false,
          "minecraft:selection_box": false,
          "minecraft:light_dampening": 0,
          // Para los marcadores dentro del agua: la librería pone agua al quitarlo.
          "minecraft:liquid_detection": {
            detection_rules: [{ liquid_type: "water", can_contain_liquid: true, on_liquid_touches: "no_reaction" }]
          },
          "minecraft:destructible_by_mining": { seconds_to_destroy: 0 },
          "minecraft:destructible_by_explosion": { explosion_resistance: 0 }
        }
      }
    });
  };
  if (npcIndex.size) await writeMarker("npc", npcGroups);
  if (pokemonIndex.size) await writeMarker("pokemon", pokemonGroups);
  if (zoneIndex.size) await writeMarker("zone", zoneGroups);
  const npcMarker = {};
  for (const [id, index] of npcIndex) npcMarker[index] = id;
  const langLines = /* @__PURE__ */ new Map();
  for (const locale of /* @__PURE__ */ new Set(["en_us", ...langFiles.map((f) => path9.basename(f, ".json"))])) {
    langLines.set(locale, [...lang].map(([k, v]) => `${k}=${v}`));
  }
  const report = {
    pieces: { total: pieceFiles.length, converted },
    worldgen: { pools: poolFiles.length, structures: ownStructures.size, sets, processors: processorFiles.length, lootTables: loot },
    npcs: Object.keys(npcs).length,
    pokemon: pokemonIndex.size,
    zoneMarkers: zoneMarker,
    entities: Object.fromEntries(entityReport),
    blocks: Object.fromEntries(blockReport),
    notes: [...new Set(notes)]
  };
  logStep(
    `  structures: ${converted}/${pieceFiles.length} pieces, ${ownStructures.size} structures, ${sets} sets, ${poolFiles.length} pools, ${loot} loot tables, ${Object.keys(npcs).length} NPCs, ${pokemonIndex.size} Pok\xE9mon markers`
  );
  return { npcs, npcMarker, npcGroups, pokemonMarker, pokemonGroups, zoneMarker, zoneGroups, langLines, report };
}

// tools/kit/kit.ts
init_entity_files();
function parseArgs() {
  const argv = process.argv.slice(2);
  const get = (flag) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : void 0;
  };
  const input = get("--in");
  if (!input) throw new Error("Missing --in <Cobblemon Java addon folder>");
  const v = (get("--version") ?? "1.0.0").split(".").map((n) => Number.parseInt(n, 10) || 0);
  const page = Number.parseInt(get("--glyph-page") ?? "F0", 16);
  if (!(page >= 240 && page <= 248)) throw new Error("--glyph-page must be F0 to F8 (the pages reserved for add-ons)");
  return {
    sprites: !argv.includes("--no-sprites"),
    glyphPage: page,
    input: path11.resolve(input),
    ns: get("--ns") ?? null,
    out: get("--out") ? path11.resolve(get("--out")) : null,
    version: [v[0] ?? 1, v[1] ?? 0, v[2] ?? 0],
    blockMap: get("--block-map") ? path11.resolve(get("--block-map")) : null
  };
}
async function walk4(dir) {
  if (!existsSync10(dir)) return [];
  const out = [];
  for (const entry of await readdir9(dir, { withFileTypes: true })) {
    const full = path11.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk4(full));
    else out.push(full);
  }
  return out;
}
async function readJson3(file) {
  return JSON.parse(await readFile12(file, "utf8"));
}
async function writeJson5(file, data) {
  await mkdir6(path11.dirname(file), { recursive: true });
  await writeFile8(file, `${JSON.stringify(data, null, 2)}
`, "utf8");
}
function stableUuid(seed) {
  const h = createHash("sha1").update(`cooblemon-kit:${seed}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${(Number.parseInt(h[16], 16) & 3 | 8).toString(16)}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
var speciesName = (raw) => raw.toLowerCase().replace(/[^a-z0-9]/g, "");
var bedrockLocale = (javaLocale) => {
  const [a, b] = javaLocale.split("_");
  return b ? `${a.toLowerCase()}_${b.toUpperCase()}` : javaLocale;
};
function statRange(value) {
  const m = /^(\d+)(?:-(\d+))?$/.exec(String(value ?? "").trim());
  if (!m) return null;
  const a = Number(m[1]);
  return [a, m[2] ? Number(m[2]) : a];
}
function rideStatsOf(raw) {
  const behaviours = raw.riding?.behaviours;
  if (!behaviours || Object.keys(behaviours).length === 0) return null;
  const stats = {};
  const keys = {};
  for (const [style, b] of Object.entries(behaviours)) {
    const table = {};
    for (const [stat2, value] of Object.entries(b.stats ?? {})) {
      const r = statRange(value);
      if (r) table[stat2] = r;
    }
    stats[style] = table;
    if (b.key) keys[style] = b.key;
  }
  return { stats, keys };
}
var textureRef = (t) => typeof t === "string" ? t : t?.frames?.[0];
async function resolveAssets(roots, names) {
  const pokemonDirs = roots.map((r) => path11.join(r, "bedrock", "pokemon"));
  const filesIn = async (sub) => (await Promise.all(pokemonDirs.map((d) => walk4(path11.join(d, sub))))).flat().filter((f) => f.endsWith(".json"));
  const geoFiles = (await filesIn("models")).reverse();
  const poserFiles = (await filesIn("posers")).reverse();
  const tex = (ref) => {
    const rel = ref.split(":").pop();
    for (const root of [...roots].reverse()) {
      const file = path11.join(root, rel);
      if (existsSync10(file)) return file;
    }
    return path11.join(roots[roots.length - 1], rel);
  };
  const byName = /* @__PURE__ */ new Map();
  for (const file of await filesIn("resolvers")) {
    const r = await readJson3(file);
    const name = speciesName(String(r.species ?? "").split(":").pop() ?? "");
    if (!names.has(name)) continue;
    const entry = byName.get(name) ?? { folder: path11.basename(path11.dirname(file)), files: [] };
    entry.files.push({ order: r.order ?? 0, variations: r.variations ?? [] });
    byName.set(name, entry);
  }
  const out = /* @__PURE__ */ new Map();
  for (const [name, entry] of byName) {
    const variations = entry.files.sort((a, b) => a.order - b.order).flatMap((f) => f.variations);
    out.set(name, {
      name,
      folder: entry.folder,
      variations,
      resolve(aspects) {
        const wanted = new Set(aspects);
        let model;
        let texture;
        let poser;
        let layers = [];
        for (const v of variations) {
          if (!(v.aspects ?? []).every((a) => wanted.has(a))) continue;
          if (v.model) model = v.model;
          const t = textureRef(v.texture);
          if (t) texture = t;
          if (v.poser) poser = v.poser;
          if (v.layers) layers = v.layers;
        }
        if (!model || !texture) return null;
        const geoFile = geoFiles.find((f) => path11.basename(f) === `${model.split(":").pop()}.json`);
        if (!geoFile) return null;
        const poserName = (poser ?? name).split(":").pop();
        return {
          poserName,
          geoFile,
          texture: tex(texture),
          layers: layers.map((l) => textureRef(l.texture)).filter((t) => !!t).map(tex).filter((f) => existsSync10(f)),
          poserFile: poserFiles.find((f) => path11.basename(f) === `${poserName}.json`) ?? null
        };
      }
    });
  }
  return out;
}
async function composedTexture(variant, dst) {
  const base = decodePng(await readFile12(variant.texture));
  const data = Buffer.from(base.data);
  for (const file of variant.layers) {
    const layer = decodePng(await readFile12(file));
    for (let y = 0; y < base.height; y++) {
      for (let x = 0; x < base.width; x++) {
        const lx = Math.floor(x * layer.width / base.width);
        const ly = Math.floor(y * layer.height / base.height);
        const s = (ly * layer.width + lx) * 4;
        const a = layer.data[s + 3] / 255;
        if (a === 0) continue;
        const d = (y * base.width + x) * 4;
        for (let c = 0; c < 3; c++) data[d + c] = Math.round(layer.data[s + c] * a + data[d + c] * (1 - a));
        data[d + 3] = Math.max(data[d + 3], layer.data[s + 3]);
      }
    }
  }
  await mkdir6(path11.dirname(dst), { recursive: true });
  await writeFile8(dst, encodePng({ width: base.width, height: base.height, data }));
}
async function writeGeometry(ns, geoFile, rp, fileName, name) {
  const geo = JSON.parse(sanitizeGeometryJson(await readFile12(geoFile, "utf8"), name));
  let id = "";
  (geo["minecraft:geometry"] ?? []).forEach((g, index) => {
    const own = `geometry.${ns}.${fileName}${index ? `_${index}` : ""}`;
    g.description = { ...g.description, identifier: own };
    id ||= own;
  });
  await writeJson5(path11.join(rp, "models", "entity", ns, `${fileName}.geo.json`), geo);
  return id;
}
function poseClip(pose) {
  for (const a of pose.animations ?? []) {
    const m = /q\.bedrock\(\s*'([^']+)'\s*,\s*(.+)\)\s*$/.exec(a);
    if (!m) continue;
    const names = [...m[2].matchAll(/'([a-z0-9_]+)'/gi)].map((x) => x[1]);
    if (names.length) return `${m[1]}.${names[names.length - 1]}`;
  }
  return null;
}
function rolesFromPoser(poser) {
  const roles = /* @__PURE__ */ new Map();
  const set = (role, pose) => {
    if (roles.has(role)) return;
    const clip = poseClip(pose);
    if (!clip) return;
    roles.set(role, { clip, hidden: (pose.transformedParts ?? []).filter((p) => p.isVisible === false).map((p) => p.part) });
  };
  for (const pose of Object.values(poser?.poses ?? {})) {
    const types = new Set(pose.poseTypes ?? []);
    const water = pose.isTouchingWater === true;
    const cond = pose.condition ?? "";
    const requires = (q) => new RegExp(`(^|[^!])q\\.${q}\\b`).test(cond);
    if (types.has("SLEEP") && !requires("is_flying")) set("sleep", pose);
    else if (pose.isBattle) set("battle_idle", pose);
    else if (water && types.has("SWIM")) set("swim", pose);
    else if (water && (types.has("FLOAT") || types.has("STAND"))) set("swim_idle", pose);
    else if (types.has("FLY")) set("air_move", pose);
    else if (types.has("HOVER")) set("air_idle", pose);
    else if (requires("in_air")) continue;
    else if (types.has("WALK") && requires("is_sprinting")) set("run", pose);
    else if (types.has("WALK")) set("walk", pose);
    else if (types.has("STAND") || types.has("NONE")) set("idle", pose);
  }
  return roles;
}
var TEMPLATES = {
  terrestrial: "pikachu",
  flyer: "pidgey",
  aquatic: "magikarp",
  ride_land: "arcanine",
  ride_water: "lapras",
  ride_air: "charizard"
};
function profileOf(raw) {
  const ride = raw.riding?.behaviours;
  if (ride && Object.keys(ride).length) {
    if (ride.AIR) return "ride_air";
    if (ride.LIQUID && !ride.LAND) return "ride_water";
    return "ride_land";
  }
  const m = raw.behaviour?.moving;
  if (m?.fly?.canFly) return "flyer";
  if (m?.swim?.avoidsLand) return "aquatic";
  return "terrestrial";
}
function rescale(node, ratio) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    node.forEach((n) => rescale(n, ratio));
    return;
  }
  const obj = node;
  for (const [key, value] of Object.entries(obj)) {
    if (key === "minecraft:scale" && value && typeof value === "object") {
      const v = value;
      if (typeof v.value === "number") v.value = Math.round(v.value * ratio * 1e3) / 1e3;
    } else if (key === "minecraft:collision_box" && value && typeof value === "object") {
      const v = value;
      if (typeof v.width === "number") v.width = Math.round(v.width * ratio * 100) / 100;
      if (typeof v.height === "number") v.height = Math.round(v.height * ratio * 100) / 100;
    } else rescale(value, ratio);
  }
}
async function behaviorEntity(id, family, raw, extras) {
  const template = TEMPLATES[profileOf(raw)];
  const entity = await readJson3(resolveFromRoot(`bp/entities/${template}.json`));
  const e = entity["minecraft:entity"];
  e.description.identifier = id;
  e.description.is_spawnable = true;
  e.description.is_summonable = true;
  const templateSpecies = await readJson3(
    (await walk4(resolveFromRoot("data/species"))).find((f) => path11.basename(f) === `${template}.json`)
  );
  const baseScale = raw.baseScale ?? 1;
  rescale(e, baseScale / (templateSpecies.baseScale ?? 1));
  const hitbox = raw.hitbox ?? { width: 1, height: 1 };
  e.components["minecraft:collision_box"] = {
    width: Math.round(hitbox.width * baseScale * 100) / 100,
    height: Math.round(hitbox.height * baseScale * 100) / 100
  };
  e.components["minecraft:scale"] = { value: baseScale };
  renameFamilies(e, template, family);
  e.components["minecraft:type_family"] = {
    family: ["pokemon", family, "mob", ...(e.components["minecraft:type_family"]?.family ?? []).filter(
      (f) => !["pokemon", "mob", family, "parrot_tame"].includes(f)
    )]
  };
  if (extras.shoulder && !e.component_groups?.["cooblemon:shoulder"]) {
    const pikachu = (await readJson3(resolveFromRoot("bp/entities/pikachu.json")))["minecraft:entity"];
    e.component_groups["cooblemon:shoulder"] = pikachu.component_groups["cooblemon:shoulder"];
    renameFamilies(e.component_groups["cooblemon:shoulder"], "pikachu", family);
    for (const ev of ["cooblemon:shoulder_start", "cooblemon:shoulder_stop"]) e.events[ev] ??= pikachu.events[ev];
  }
  const ride = e.component_groups?.["cooblemon:ride_on"];
  if (ride && extras.seats) {
    ride["minecraft:rideable"] = { ...ride["minecraft:rideable"], seat_count: extras.seats.length, seats: extras.seats };
  }
  if (ride?.["minecraft:movement"] && extras.rideSpeed) ride["minecraft:movement"].value = extras.rideSpeed;
  const walkSpeed = raw.behaviour?.moving?.walk?.walkSpeed;
  if (typeof walkSpeed === "number" && e.components["minecraft:movement"]) e.components["minecraft:movement"].value = walkSpeed;
  return entity;
}
var itemId = (id) => id.replace(/^cobblemon:/, "cooblemon:");
function formIdOf(aspect) {
  const known = ASPECT_FORMS.find((f) => f.aspect === aspect);
  if (known) return known.formId;
  return aspect.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}
function convertForm(f, ref) {
  const fa = parseAbilities(f.abilities);
  return {
    ...f,
    name: formIdOf(String(f.aspects?.[0] ?? f.name ?? "")),
    ...f.baseStats ? { baseStats: toCamelStats(f.baseStats) } : {},
    ...f.abilities ? { abilities: fa.normal } : {},
    ...f.evolutions ? { evolutions: f.evolutions.map((e) => ({ ...e, result: ref(String(e.result ?? "")) })) } : {}
  };
}
var MODIFIER_ASPECTS = /^(shiny|female|male|alpha.*)$/;
async function convertAdditions(ns, input, assets, own, convert, additions) {
  const addonRoots = [.../* @__PURE__ */ new Set([path11.join(input, "assets", "cobblemon"), assets])].filter((d) => existsSync10(d));
  const looks = /* @__PURE__ */ new Map();
  const resolverFiles = (await Promise.all(addonRoots.map((r) => walk4(path11.join(r, "bedrock", "pokemon", "resolvers"))))).flat();
  for (const file of resolverFiles.filter((f) => f.endsWith(".json"))) {
    const r = await readJson3(file);
    const name = speciesName(String(r.species ?? "").split(":").pop() ?? "");
    if (!name || own.has(name)) continue;
    for (const v of r.variations ?? []) {
      if (!v.model && !textureRef(v.texture) && !v.poser) continue;
      const formAspects = (v.aspects ?? []).filter((a) => !MODIFIER_ASPECTS.test(a));
      if (formAspects.length === 0) {
        logWarn(`${name}: the addon changes the species' default look; only forms can be changed in Cobblemon Bedrock (skipped)`);
        continue;
      }
      if (formAspects.length > 1) {
        logWarn(`${name}: a variation for ${formAspects.join(" + ")} combines several forms (skipped)`);
        continue;
      }
      if (!looks.has(name)) looks.set(name, /* @__PURE__ */ new Set());
      looks.get(name).add(formAspects[0]);
    }
  }
  const ref = (s) => {
    const [first, ...rest] = s.trim().split(/\s+/);
    const n = speciesName(first.split(":").pop());
    return [own.has(n) ? `${ns}:${n}` : n, ...rest].join(" ");
  };
  const dataForms = /* @__PURE__ */ new Map();
  for (const file of (await walk4(path11.join(input, "data", ns, "species_additions"))).filter((f) => f.endsWith(".json"))) {
    const a = await readJson3(file);
    const name = speciesName(String(a.target ?? "").split(":").pop() ?? "");
    if (!name) continue;
    const ignored = Object.keys(a).filter((k) => k !== "target" && k !== "forms");
    if (ignored.length) logWarn(`${name}: species_additions only converts \`forms\` (ignored: ${ignored.join(", ")})`);
    dataForms.set(name, [...dataForms.get(name) ?? [], ...(a.forms ?? []).map((f) => convertForm(f, ref))]);
  }
  if (looks.size === 0 && dataForms.size === 0) return;
  if (looks.size) {
    const jarAssets = cobblemonJava("assets/cobblemon");
    if (!existsSync10(jarAssets)) {
      throw new Error("This addon changes the look of Cobblemon species: the extracted Cobblemon .jar is needed (its models and animations are the base)");
    }
    const resolved = await resolveAssets([jarAssets, ...addonRoots], new Set(looks.keys()));
    const speciesFiles = await walk4(cobblemonJava("data/cobblemon/species"));
    for (const [name, aspects] of looks) {
      const file = speciesFiles.find((f) => path11.basename(f) === `${name}.json`);
      if (!file) {
        logWarn(`${name}: not a Cobblemon species (skipped)`);
        continue;
      }
      const raw = await readJson3(file);
      for (const aspect of aspects) {
        await convert(raw, resolved.get(name), [jarAssets, ...addonRoots], { form: formIdOf(aspect), aspects: [aspect] });
      }
    }
  }
  for (const [name, forms] of dataForms) {
    const list = additions.get(name) ?? [];
    for (const form of forms) {
      const look = list.find((f) => f.name === form.name);
      if (look) Object.assign(look, form, { entity: look.entity, battleClips: look.battleClips, locators: look.locators });
      else list.push(form);
    }
    additions.set(name, list);
  }
}
function convertSpecies(ns, raw, own, extras) {
  const ref = (s) => {
    const [first, ...rest] = s.trim().split(/\s+/);
    const n = speciesName(first.split(":").pop());
    return [own.has(n) ? `${ns}:${n}` : n, ...rest].join(" ");
  };
  const { normal, hidden } = parseAbilities(raw.abilities);
  const zero = { hp: 0, attack: 0, defence: 0, specialAttack: 0, specialDefence: 0, speed: 0 };
  const evolutions = (raw.evolutions ?? []).map((e) => ({ ...e, result: ref(String(e.result ?? "")) }));
  const forms = (raw.forms ?? []).map((f) => convertForm(f, ref));
  const drops = raw.drops?.entries ? {
    amount: raw.drops.amount ?? 1,
    entries: raw.drops.entries.map((e) => ({ ...e, item: itemId(String(e.item ?? "")) }))
  } : void 0;
  return {
    id: `${ns}:${speciesName(raw.name)}`,
    name: raw.name,
    nationalPokedexNumber: raw.nationalPokedexNumber,
    generation: 0,
    primaryType: raw.primaryType.toLowerCase(),
    secondaryType: raw.secondaryType?.toLowerCase() ?? null,
    maleRatio: raw.maleRatio ?? null,
    baseStats: toCamelStats(raw.baseStats),
    evYield: toCamelStats(raw.evYield ?? zero),
    catchRate: raw.catchRate ?? 45,
    baseExperienceYield: raw.baseExperienceYield ?? 0,
    experienceGroup: raw.experienceGroup ?? "medium_fast",
    eggCycles: raw.eggCycles ?? 20,
    baseFriendship: raw.baseFriendship ?? 50,
    abilities: normal,
    hiddenAbility: hidden,
    eggGroups: (raw.eggGroups ?? []).map((g) => String(g).toLowerCase()),
    moves: parseMoves(raw.moves),
    evolutions,
    forms,
    ...raw.preEvolution ? { preEvolution: ref(raw.preEvolution) } : {},
    baseScale: raw.baseScale ?? 1,
    hitbox: raw.hitbox ?? { width: 1, height: 1 },
    height: raw.height ?? null,
    weight: raw.weight ?? null,
    ...drops ? { drops } : {},
    battleClips: extras.battleClips,
    locators: extras.locators
  };
}
var RENDERER = existsSync10(resolveFromRoot("tools/kit/render-pokemon-sprites.mjs")) ? [resolveFromRoot("tools/kit/render-pokemon-sprites.mjs")] : [resolveFromRoot("node_modules/tsx/dist/cli.mjs"), resolveFromRoot("tools/render-pokemon-sprites.ts")];
var QUIET_RENDER = { encoding: "utf8", stdio: "pipe", maxBuffer: 64 * 1024 * 1024 };
function showRendererOutput(r) {
  const text = `${r.stdout ?? ""}${r.stderr ?? ""}${r.error ? String(r.error) : ""}`.trim();
  if (text) console.error(text.split(/\r?\n/).slice(-40).join("\n"));
}
async function renderSprites(ns, assetRoots, variants, rp, work, page) {
  const fileOf = (v, shiny) => `${v.name}${v.form ? `_${v.form}` : ""}${shiny ? "_shiny" : ""}`;
  const jobs = variants.flatMap(
    (v) => [false, true].map((shiny) => ({
      species: v.name,
      ...v.aspects.length || shiny ? { aspects: [...v.aspects, ...shiny ? ["shiny"] : []] } : {},
      files: {
        pc: path11.join(work, "pc", `${fileOf(v, shiny)}.png`),
        face: path11.join(work, "face", `${fileOf(v, shiny)}.png`)
      }
    }))
  );
  await rm4(work, { recursive: true, force: true });
  await mkdir6(path11.join(work, "pc"), { recursive: true });
  await mkdir6(path11.join(work, "face"), { recursive: true });
  const manifest = path11.join(work, "jobs.json");
  await writeFile8(manifest, JSON.stringify(jobs), "utf8");
  logStep(`  Sprites: rendering ${jobs.length} variants (this can take a few minutes)\u2026`);
  const run2 = spawnSync(
    process.execPath,
    [
      ...RENDERER,
      "--manifest",
      manifest,
      ...assetRoots.flatMap((r) => ["--asset-root", r]),
      "--workers",
      "2"
    ],
    QUIET_RENDER
  );
  if (run2.status !== 0) {
    showRendererOutput(run2);
    logWarn("  Sprites: the renderer failed (is there a browser? see SPRITE_BROWSER); the add-on is built without sprites");
    return {};
  }
  const dexDir = path11.join(work, "dex");
  const dexJobs = variants.flatMap(
    (v) => [false, true].map((shiny) => ({
      name: fileOf(v, shiny),
      species: v.name,
      ...v.aspects.length || shiny ? { aspects: [...v.aspects, ...shiny ? ["shiny"] : []] } : {}
    }))
  );
  for (const pass of ["icon", "portrait", "size"]) {
    const dir = path11.join(dexDir, pass);
    await mkdir6(dir, { recursive: true });
    const jobsFile = path11.join(dexDir, `${pass}.jobs.json`);
    const specFile = path11.join(dexDir, `${pass}.spec.json`);
    await writeFile8(jobsFile, JSON.stringify(pass === "size" ? dexJobs.filter((j) => !j.name.endsWith("_shiny")) : dexJobs), "utf8");
    await writeFile8(specFile, JSON.stringify(DEX_PASSES[pass]), "utf8");
    const r = spawnSync(
      process.execPath,
      [
        ...RENDERER,
        "--anim-sheet",
        dir,
        "--anim-jobs",
        jobsFile,
        "--sheet-spec",
        specFile,
        ...assetRoots.flatMap((r2) => ["--asset-root", r2]),
        "--workers",
        "2"
      ],
      QUIET_RENDER
    );
    if (r.status !== 0) {
      showRendererOutput(r);
      logWarn(`  Sprites: the Pok\xE9dex ${pass} pass failed; the PC sprite will be used`);
    }
  }
  const sprites = {};
  const faces = [];
  let index = 0;
  for (const v of variants) {
    for (const shiny of [false, true]) {
      const file = fileOf(v, shiny);
      const pc = path11.join(work, "pc", `${file}.png`);
      const face = path11.join(work, "face", `${file}.png`);
      if (!existsSync10(pc)) continue;
      const tex = `textures/${ns}/sprites`;
      await mkdir6(path11.join(rp, tex, "pc"), { recursive: true });
      await copyFile3(pc, path11.join(rp, tex, "pc", `${file}.png`));
      const set = { pc: `${tex}/pc/${file}`, dex: `${tex}/pc/${file}`, portrait: `${tex}/pc/${file}` };
      for (const [pass, key] of [["icon", "dex"], ["portrait", "portrait"], ["size", "size"]]) {
        const src = path11.join(dexDir, pass, `${pass === "size" ? fileOf(v, false) : file}.png`);
        if (!existsSync10(src)) continue;
        await mkdir6(path11.join(rp, tex, "dex", pass), { recursive: true });
        await copyFile3(src, path11.join(rp, tex, "dex", pass, `${file}.png`));
        set[key] = `${tex}/dex/${pass}/${file}`;
      }
      if (existsSync10(face)) {
        await mkdir6(path11.join(rp, tex, "face"), { recursive: true });
        await copyFile3(face, path11.join(rp, tex, "face", `${file}.png`));
        set.face = `${tex}/face/${file}`;
        faces.push(decodePng(await readFile12(face)));
        set.glyph = String.fromCharCode(page << 8 | index++);
      }
      sprites[`${v.base ? "" : `${ns}:`}${v.name}|${v.form ?? ""}|${shiny ? 1 : 0}`] = set;
    }
  }
  if (faces.length) {
    const fontName = `glyph_${page.toString(16).toUpperCase()}.png`;
    await mkdir6(path11.join(rp, "font"), { recursive: true });
    await writeFile8(path11.join(rp, "font", fontName), encodePng(glyphPage(faces)));
  }
  return sprites;
}
async function main() {
  const args = parseArgs();
  const dataRoot = path11.join(args.input, "data");
  const ns = args.ns ?? (existsSync10(dataRoot) ? (await readdir9(dataRoot, { withFileTypes: true })).find((d) => d.isDirectory() && d.name !== "minecraft" && d.name !== "cobblemon")?.name : void 0);
  if (!ns || !/^[a-z0-9_]+$/.test(ns) || ns === "cooblemon" || ns === "cobblemon") {
    throw new Error(`Invalid namespace: "${ns}". Pass it with --ns (lowercase letters, digits and _).`);
  }
  const data = path11.join(dataRoot, ns);
  const assets = path11.join(args.input, "assets", ns);
  const out = args.out ?? resolveFromRoot(`dist/kit/${ns}`);
  const bp = path11.join(out, "BP");
  const rp = path11.join(out, "RP");
  await rm4(bp, { recursive: true, force: true });
  await rm4(rp, { recursive: true, force: true });
  const rawSpecies = [];
  for (const file of (await walk4(path11.join(data, "species"))).filter((f) => f.endsWith(".json"))) {
    rawSpecies.push(await readJson3(file));
  }
  const own = new Set(rawSpecies.map((s) => speciesName(s.name)));
  const resolved = await resolveAssets([assets], own);
  const species = [];
  const additions = /* @__PURE__ */ new Map();
  const animTex = `textures/${ns}/pokemon`;
  const spriteJobs = [];
  const convert = async (raw, res, animRoots, addition) => {
    const name = speciesName(raw.name);
    const entityName = addition ? `${name}_${addition.form}` : name;
    const id = `${ns}:${entityName}`;
    const baseAspects = addition?.aspects ?? [];
    const base2 = res?.resolve(baseAspects);
    if (!res || !base2) {
      logWarn(`${id}: no model or texture in the resolvers; skipped`);
      return;
    }
    const animId = (ref) => {
      const [prefix, ...clip] = ref.split(".");
      return `animation.${ns}_${prefix}.${clip.join(".")}`;
    };
    const lengths = /* @__PURE__ */ new Map();
    const renamed = {};
    const animFiles = (await Promise.all(animRoots.map((r) => walk4(path11.join(r, "bedrock", "pokemon", "animations", res.folder))))).flat();
    for (const file of animFiles.filter((f) => f.endsWith(".animation.json"))) {
      const payload = await readJson3(file);
      const tree = sanitizeAnimationTree(payload.animations ?? {});
      for (const [key, anim] of Object.entries(tree)) {
        const ref = key.split(".").slice(1).join(".");
        if (!key.startsWith("animation.") || !ref.includes(".")) continue;
        renamed[animId(ref)] = anim;
        lengths.set(ref, [anim.animation_length ?? 1, anim.loop === true || anim.loop === "true"]);
      }
    }
    const rolesFor = async (poserFile, tag, poserName) => {
      const poser = poserFile ? await readJson3(poserFile) : null;
      const roles = poser ? rolesFromPoser(poser) : rolesFromNames(poserName, (ref) => lengths.has(ref));
      for (const [role, info] of roles) {
        if (info.clip && !lengths.has(info.clip)) {
          logWarn(`${id}: the ${role} pose asks for "${info.clip}", which is not in its animations`);
          roles.delete(role);
        }
      }
      const prefix = roles.get("idle")?.clip?.split(".")[0] ?? poserName;
      if (!roles.has("battle_idle") && lengths.has(`${prefix}.battle_idle`)) {
        roles.set("battle_idle", { clip: `${prefix}.battle_idle`, hidden: roles.get("idle")?.hidden ?? [] });
      }
      for (const [role, info] of roles) {
        if (!info.hidden.length || !info.clip) continue;
        const source = renamed[animId(info.clip)];
        if (!source) continue;
        const copy = JSON.parse(JSON.stringify(source));
        copy.bones ??= {};
        for (const bone of info.hidden) copy.bones[bone] = { ...copy.bones[bone] ?? {}, scale: 0 };
        const ref = `${info.clip.split(".")[0]}.kit_${tag}${role}`;
        renamed[animId(ref)] = copy;
        lengths.set(ref, lengths.get(info.clip) ?? [1, true]);
        roles.set(role, { clip: ref, hidden: [] });
      }
      return { roles, poser };
    };
    const baseRoles = await rolesFor(base2.poserFile, "", base2.poserName);
    const clipPrefix = baseRoles.roles.get("idle")?.clip?.split(".")[0] ?? base2.poserName;
    const battleClips = {};
    const entry = (ref) => {
      const l = lengths.get(ref);
      return l ? l[1] ? [animId(ref), l[0], 1] : [animId(ref), l[0]] : null;
    };
    for (const [clipKey, expr] of Object.entries(baseRoles.poser?.animations ?? {})) {
      const m = /q\.bedrock_(?:primary|stateful)\(\s*'([^']+)'\s*,\s*'([a-z0-9_]+)'/i.exec(expr);
      const e = m ? entry(`${m[1]}.${m[2]}`) : null;
      if (e) battleClips[clipKey] = e;
    }
    for (const n of ["physical", "special", "status", "recoil", "faint", "cry"]) {
      if (!battleClips[n]) {
        const e = entry(n === "cry" && lengths.has(`${clipPrefix}.battle_cry`) ? `${clipPrefix}.battle_cry` : `${clipPrefix}.${n}`);
        if (e) battleClips[n] = e;
      }
    }
    const baseGeo = JSON.parse(await readFile12(base2.geoFile, "utf8"));
    const modelLocators = locatorsOf(baseGeo);
    const locators = {};
    for (const [locName, vec2] of modelLocators) {
      (locators[locName.replace(/[0-9]+$/, "")] ??= []).push(vec2);
    }
    let shoulderClip = null;
    let shoulderPose = null;
    if (raw.shoulderMountable) {
      for (const [poseName, pose] of Object.entries(baseRoles.poser?.poses ?? {})) {
        const types = pose.poseTypes ?? [];
        const left = types.includes("SHOULDER_LEFT") || poseName === "shoulder_left";
        const right = types.includes("SHOULDER_RIGHT") || poseName === "shoulder_right";
        if (!left && !right) continue;
        const ref = poseClip(pose);
        if (!ref || !lengths.has(ref)) continue;
        shoulderPose ??= { left: null, right: null };
        if (right && !left) {
          shoulderPose.right = ref.split(".")[1];
          continue;
        }
        shoulderPose.left = ref.split(".")[1];
        const copy = JSON.parse(JSON.stringify(renamed[animId(ref)]));
        const offset = pose.transformedParts?.find((p) => p.part === "body")?.position;
        if (offset?.length === 3) {
          copy.bones ??= {};
          const body = copy.bones["body"] ??= {};
          const now = Array.isArray(body.position) ? body.position.map(Number) : [0, 0, 0];
          if (now.every(Number.isFinite)) body.position = now.map((v, k) => v + Number(offset[k]));
        }
        const seatRef = `${ref.split(".")[0]}.shoulder_seat`;
        renamed[animId(seatRef)] = copy;
        shoulderClip = animId(seatRef);
      }
    }
    const rideStats = rideStatsOf(raw);
    let seats = null;
    let rideSpeed = null;
    if (rideStats) {
      const flies = !!rideStats.stats.AIR;
      const clips = flies ? ["air_idle", "air_fly", "hover", "fly"] : ["ground_idle", "ground_walk"];
      seats = [];
      for (const seat of raw.riding?.seats ?? []) {
        const loc = seat.locator ? modelLocators.get(seat.locator) : void 0;
        if (!loc) continue;
        const heights = clips.flatMap(
          (c) => locatorHeights(baseGeo, seat.locator, renamed[animId(`${name}.${c}`)])
        );
        const mean = heights.length ? heights.reduce((a, b) => a + b, 0) / heights.length : 0;
        const lift = heights.length ? Math.max(0, mean + (Math.max(...heights) - mean) * 0.5) : 0;
        seats.push({ position: [-loc[0] / 16, (loc[1] + lift) / 16, -loc[2] / 16].map((n) => Number(n.toFixed(3)) || 0) });
      }
      if (seats.length === 0) seats.push({ position: [0, Number(((raw.hitbox?.height ?? 1.2) * 0.85).toFixed(2)), 0] });
      const land = rideStats.stats.LAND?.SPEED;
      if (land) rideSpeed = bedrockRideSpeed("LAND", rideStats.keys.LAND, land[0]);
    }
    const buildEntity = async (form, aspects) => {
      const variant = res.resolve([...baseAspects, ...aspects]);
      if (!variant) return false;
      const fileName = form ? `${entityName}_${form}` : entityName;
      const entityId = form ? `${id}_${form}` : id;
      const geometry = {
        default: await writeGeometry(ns, variant.geoFile, rp, fileName, name)
      };
      const texDir = `${animTex}/${name}`;
      await composedTexture(variant, path11.join(rp, `${texDir}/${fileName}.png`));
      await composedTexture(res.resolve([...baseAspects, ...aspects, "shiny"]) ?? variant, path11.join(rp, `${texDir}/${fileName}_shiny.png`));
      const textures = { default: `${texDir}/${fileName}`, shiny: `${texDir}/${fileName}_shiny` };
      const female = res.resolve([...baseAspects, ...aspects, "female"]);
      const femaleGeo = !!female && female.geoFile !== variant.geoFile;
      const femaleTex = !!female && (female.texture !== variant.texture || female.layers.join() !== variant.layers.join());
      if (female && femaleGeo) geometry.female = await writeGeometry(ns, female.geoFile, rp, `${fileName}_female`, name);
      if (female && femaleTex) {
        await composedTexture(female, path11.join(rp, `${texDir}/${fileName}_female.png`));
        await composedTexture(res.resolve([...baseAspects, ...aspects, "female", "shiny"]) ?? female, path11.join(rp, `${texDir}/${fileName}_female_shiny.png`));
        textures.female = `${texDir}/${fileName}_female`;
        textures.female_shiny = `${texDir}/${fileName}_female_shiny`;
      }
      const roles = variant.poserFile && variant.poserFile !== base2.poserFile ? (await rolesFor(variant.poserFile, `${form}_`, variant.poserName)).roles : baseRoles.roles;
      await writeJson5(
        path11.join(bp, "entities", `${fileName}.json`),
        await behaviorEntity(entityId, `${ns}_${name}`, raw, { shoulder: !!shoulderPose, seats, rideSpeed })
      );
      await writeJson5(
        path11.join(rp, "entity", `${fileName}.entity.json`),
        clientEntity(entityId, fileName, geometry, textures, roles, animId, battleClips, shoulderClip)
      );
      await writeJson5(
        path11.join(rp, "render_controllers", `${ns}.${fileName}.render_controllers.json`),
        renderController(entityId, { geometry: femaleGeo, texture: femaleTex })
      );
      spriteJobs.push(
        addition ? { name, form: addition.form, aspects: baseAspects, base: true } : { name, form, aspects }
      );
      return true;
    };
    await buildEntity(null, []);
    await writeJson5(path11.join(rp, "animations", ns, `${entityName}.animation.json`), { format_version: "1.8.0", animations: renamed });
    if (addition) {
      const list = additions.get(name) ?? [];
      list.push({ name: addition.form, entity: id, battleClips, locators });
      additions.set(name, list);
      logStep(`  ${id}: look of ${name}'s "${addition.form}" form, ${baseRoles.roles.size} poses, ${Object.keys(battleClips).length} battle clips`);
      return;
    }
    const converted = convertSpecies(ns, raw, own, { battleClips, locators });
    if (rideStats) converted.riding = rideStats;
    if (shoulderPose) converted.shoulder = shoulderPose;
    const ownForms = [];
    for (const f of converted.forms ?? []) {
      const aspects = (f.aspects ?? []).map(String);
      const variant = aspects.length ? res.resolve(aspects) : null;
      if (!variant || variant.geoFile === base2.geoFile && variant.texture === base2.texture && variant.layers.join() === base2.layers.join()) continue;
      if (await buildEntity(f.name, aspects)) ownForms.push(f.name);
    }
    species.push(converted);
    logStep(
      `  ${id}: template ${TEMPLATES[profileOf(raw)]}, ${baseRoles.roles.size} poses, ${Object.keys(battleClips).length} battle clips` + (base2.layers.length ? `, ${base2.layers.length} layer${base2.layers.length === 1 ? "" : "s"}` : "") + (ownForms.length ? `, forms with their own entity: ${ownForms.join(", ")}` : "") + (rideStats ? `, rideable (${Object.keys(rideStats.stats).join("/")}, ${seats?.length ?? 0} seat${seats?.length === 1 ? "" : "s"})` : "") + (shoulderPose ? ", shoulder" : "")
    );
  };
  for (const raw of rawSpecies) await convert(raw, resolved.get(speciesName(raw.name)), [assets], null);
  await convertAdditions(ns, args.input, assets, own, convert, additions);
  const ADDITIONS = [...additions].map(([target, forms]) => ({ target, forms }));
  const sprites = args.sprites && spriteJobs.length ? await renderSprites(
    ns,
    [path11.join(args.input, "assets", "cobblemon"), assets].filter((d) => existsSync10(d)),
    spriteJobs,
    rp,
    path11.join(out, ".sprites"),
    args.glyphPage
  ) : {};
  const spawnFiles = (await walk4(path11.join(data, "spawn_pool_world"))).filter((f) => f.endsWith(".json"));
  const pools = spawnFiles.length ? await convertJavaSpawnPools({ files: spawnFiles, generationOf: () => 0, quiet: true }) : {};
  const entries = [];
  const levels = {};
  for (const [n, spawn] of Object.entries(pools)) {
    if (!own.has(n)) {
      logWarn(`Spawn for "${n}", which is not a species of this addon: skipped`);
      continue;
    }
    const id = `${ns}:${n}`;
    entries.push(...bundleSpawnRules(id, spawn));
    levels[id] = { min: spawn.levelMin, max: spawn.levelMax };
  }
  const zones = await convertZoneSpawns({ input: args.input, ns, own, tmp: path11.join(out, ".zone-spawns") });
  if (zones) {
    entries.push(...zones.entries);
    for (const note of zones.notes) logWarn(note);
  }
  const items = await convertItems({ input: args.input, ns, bp, rp });
  const blockMap = args.blockMap ? await readJson3(args.blockMap) : {};
  const structures = await convertStructures({ input: args.input, ns, bp, blockMap, zones: Object.keys(zones?.zones ?? {}) });
  if (structures) await writeJson5(path11.join(out, "structures-report.json"), structures.report);
  if (species.length === 0 && ADDITIONS.length === 0 && items.items.length === 0 && !structures) {
    throw new Error(`No species, items or structures found in ${args.input} (data/${ns}/species, assets/${ns}/models/item, data/${ns}/structure)`);
  }
  const langFiles = (await walk4(path11.join(assets, "lang"))).filter((f) => f.endsWith(".json"));
  const languages = [];
  for (const file of langFiles) {
    const src = await readJson3(file);
    const lines = [];
    for (const s of species) {
      const id = String(s.id);
      const n = id.split(":")[1];
      const pick = (suffix) => src[`${ns}.species.${n}.${suffix}`] ?? src[`cobblemon.species.${n}.${suffix}`];
      const display = pick("name") ?? String(s.name);
      lines.push(`entity.${id}.name=${display}`, `item.spawn_egg.entity.${id}.name=${display}`);
      const desc = pick("desc");
      if (desc) lines.push(`cooblemon.species.${id}.desc=${desc.replace(/\n/g, " ")}`);
    }
    lines.push(...items.langLines.get(path11.basename(file, ".json")) ?? []);
    lines.push(...structures?.langLines.get(path11.basename(file, ".json")) ?? []);
    const locale = bedrockLocale(path11.basename(file, ".json"));
    languages.push(locale);
    await mkdir6(path11.join(rp, "texts"), { recursive: true });
    await writeFile8(path11.join(rp, "texts", `${locale}.lang`), `${lines.join("\n")}
`, "utf8");
  }
  if (!languages.includes("en_US") && structures?.langLines.get("en_us")?.length) {
    await mkdir6(path11.join(rp, "texts"), { recursive: true });
    await writeFile8(path11.join(rp, "texts", "en_US.lang"), `${structures.langLines.get("en_us").join("\n")}
`, "utf8");
    languages.push("en_US");
  }
  const SIBLINGS = {
    es_ES: ["es_MX"],
    es_MX: ["es_ES"],
    en_US: ["en_GB"],
    en_GB: ["en_US"],
    pt_BR: ["pt_PT"],
    pt_PT: ["pt_BR"],
    fr_FR: ["fr_CA"],
    fr_CA: ["fr_FR"],
    zh_CN: ["zh_TW"],
    zh_TW: ["zh_CN"]
  };
  for (const locale of [...languages]) {
    for (const sibling of SIBLINGS[locale] ?? []) {
      if (languages.includes(sibling)) continue;
      await copyFile3(path11.join(rp, "texts", `${locale}.lang`), path11.join(rp, "texts", `${sibling}.lang`));
      languages.push(sibling);
    }
  }
  if (languages.length) await writeJson5(path11.join(rp, "texts", "languages.json"), languages);
  const version = args.version.join(".");
  await mkdir6(path11.join(bp, "scripts"), { recursive: true });
  const apiLib = resolveFromRoot("packages/api/dist/cobblemon-bedrock-api.js");
  if (!existsSync10(apiLib)) throw new Error("Missing packages/api/dist/cobblemon-bedrock-api.js: run npm run api:build first");
  await copyFile3(apiLib, path11.join(bp, "scripts", "cobblemon-bedrock-api.js"));
  await writeFile8(
    path11.join(bp, "scripts", "main.js"),
    [
      "// Generated by the Cobblemon Bedrock creator kit: do not edit, regenerate it instead.",
      'import { registerAddon } from "./cobblemon-bedrock-api.js";',
      'import { ADDITIONS, ADDON, EVOLUTIONS, NPCS, NPC_MARKER, POKEMON_MARKER, SPAWN, SPECIES, SPRITES, VERSION, ZONES, ZONE_MARKER } from "./data.js";',
      "",
      "const cobblemon = registerAddon({ addon: ADDON, version: VERSION, species: SPECIES, additions: ADDITIONS, spawn: SPAWN, sprites: SPRITES, evolutions: EVOLUTIONS, npcs: NPCS, zones: ZONES });",
      ...structures && Object.keys(structures.npcMarker).length ? [`cobblemon.npcMarker("${ns}:npc_marker", NPC_MARKER, { tag: "${ns}:structure"${structures.npcGroups > 1 ? `, groupState: "${ns}:npc_group"` : ""} });`] : [],
      ...structures && Object.keys(structures.pokemonMarker).length ? [`cobblemon.pokemonMarker("${ns}:pokemon_marker", POKEMON_MARKER${structures.pokemonGroups > 1 ? `, { groupState: "${ns}:pokemon_group" }` : ""});`] : [],
      ...structures && Object.keys(structures.zoneMarker).length ? [`cobblemon.zoneMarker("${ns}:zone_marker", ZONE_MARKER${structures.zoneGroups > 1 ? `, { groupState: "${ns}:zone_group" }` : ""});`] : [],
      ""
    ].join("\n"),
    "utf8"
  );
  await writeFile8(
    path11.join(bp, "scripts", "data.js"),
    [
      "// Generated by the Cobblemon Bedrock creator kit: do not edit, regenerate it instead.",
      `export const ADDON = ${JSON.stringify(ns)};`,
      `export const VERSION = ${JSON.stringify(version)};`,
      `export const SPECIES = ${JSON.stringify(species)};`,
      `export const ADDITIONS = ${JSON.stringify(ADDITIONS)};`,
      `export const SPAWN = ${JSON.stringify({ entries, levels })};`,
      `export const SPRITES = ${JSON.stringify(sprites)};`,
      "export const EVOLUTIONS = {};",
      `export const NPCS = ${JSON.stringify(structures?.npcs ?? {})};`,
      `export const NPC_MARKER = ${JSON.stringify(structures?.npcMarker ?? {})};`,
      `export const POKEMON_MARKER = ${JSON.stringify(structures?.pokemonMarker ?? {})};`,
      `export const ZONES = ${JSON.stringify(zones?.zones ?? {})};`,
      `export const ZONE_MARKER = ${JSON.stringify(structures?.zoneMarker ?? {})};`,
      ""
    ].join("\n"),
    "utf8"
  );
  const base = await readJson3(resolveFromRoot("package.json"));
  const cv = base.version.split(".").map(Number);
  const bpManifest = await readJson3(resolveFromRoot("bp/manifest.json"));
  const rpManifest = await readJson3(resolveFromRoot("rp/manifest.json"));
  const engine = [1, 26, 50];
  await writeJson5(path11.join(bp, "manifest.json"), {
    format_version: 2,
    header: { name: `${ns} (Cobblemon Bedrock)`, description: `Cobblemon Bedrock add-on generated by the creator kit (${species.length} species, ${ADDITIONS.length} species changed, ${items.items.length} items, ${Object.keys(structures?.npcs ?? {}).length} NPCs).`, uuid: stableUuid(`${ns}:bp`), version: args.version, min_engine_version: engine },
    modules: [
      { type: "data", uuid: stableUuid(`${ns}:bp:data`), version: args.version },
      { type: "script", language: "javascript", uuid: stableUuid(`${ns}:bp:script`), version: args.version, entry: "scripts/main.js" }
    ],
    dependencies: [
      { uuid: bpManifest.header.uuid, version: cv },
      { uuid: stableUuid(`${ns}:rp`), version: args.version },
      { module_name: "@minecraft/server", version: "2.10.0" }
    ]
  });
  await writeJson5(path11.join(rp, "manifest.json"), {
    format_version: 2,
    capabilities: ["pbr"],
    header: { name: `${ns} (Cobblemon Bedrock, resources)`, description: "Models, animations, textures and texts.", uuid: stableUuid(`${ns}:rp`), version: args.version, min_engine_version: engine },
    modules: [{ type: "resources", uuid: stableUuid(`${ns}:rp:res`), version: args.version }],
    // También el BP propio: así, activar solo el paquete de recursos activa
    // los dos (el juego añade las dependencias). Sin el BP, el RP solo pinta
    // entidades que nunca aparecen.
    dependencies: [
      { uuid: rpManifest.header.uuid, version: cv },
      { uuid: stableUuid(`${ns}:bp`), version: args.version }
    ]
  });
  const pack = path11.join(out, `${ns}.mcaddon`);
  await new Promise((resolve, reject) => {
    const output = createWriteStream2(pack);
    const archive = archiver2("zip", { zlib: { level: 9 } });
    output.on("close", () => resolve());
    output.on("error", reject);
    archive.on("error", reject);
    archive.pipe(output);
    archive.directory(bp, `${ns}_bp`);
    archive.directory(rp, `${ns}_rp`);
    archive.finalize();
  });
  logStep(
    `Kit: ${species.length} species, ${ADDITIONS.length} Cobblemon species changed, ${entries.length} spawns (${Object.keys(zones?.zones ?? {}).length} zones), ${items.items.length} items, ${items.recipes} recipes, ${languages.length} languages, ${Object.keys(sprites).length} sprite sets \u2192 ${pack}`
  );
}
var run = process.argv[2] === "init" ? Promise.resolve().then(() => (init_init(), init_exports)).then((m) => m.runInit(process.argv.slice(3))) : main();
run.catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
