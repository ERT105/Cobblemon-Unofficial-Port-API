var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
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
  return path.join(ROOT, relativePath);
}
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
var ROOT, COBBLEMON_JAVA_LEGACY_PREFIX, COBBLEMON_JAVA_CANDIDATES;
var init_utils = __esm({
  "tools/lib/utils.ts"() {
    init_retiredFeatures();
    ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
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
  if (!allowed || allowed.size === 0) return void 0;
  const kept = {};
  for (const [name, value] of Object.entries(locators)) {
    if (allowed.has(name)) kept[name] = value;
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
    cube.inflate = Number((FLAT_CUBE_INFLATE + original).toFixed(4));
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
var GEO_ID_BODY, DEFAULT_PARTICLE_LOCATORS, FLAT_CUBE_INFLATE, GROSOR_MINIMO, STACK_DEPTH, STACK_COVERAGE;
var init_sanitize_geometry = __esm({
  "tools/lib/sanitize-geometry.ts"() {
    init_copy_pokemon_particles();
    GEO_ID_BODY = /^[A-Za-z0-9_.-]+$/;
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
  async function walk3(dir) {
    let entries;
    try {
      entries = await readdir2(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path2.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk3(full);
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
  await walk3(root);
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

// tools/kit/kit.ts
import archiver from "archiver";
import { createHash } from "node:crypto";
import { createWriteStream, existsSync as existsSync6 } from "node:fs";
import { copyFile as copyFile2, mkdir as mkdir2, readdir as readdir6, readFile as readFile7, rm as rm2, writeFile as writeFile4 } from "node:fs/promises";
import path7 from "node:path";

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
var MODELS = cobblemonJava("assets/cobblemon/bedrock/pokemon/models");
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
var BEDROCK_BLOCKS = "recursos/bedrock-samples-v1.26.50.4-full/metadata/vanilladata_modules/mojang-blocks.json";
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
  const { readdir: readdir7 } = await import("node:fs/promises");
  const bedrock = resolveFromRoot(BEDROCK_BLOCKS);
  if (existsSync3(bedrock)) {
    const json = JSON.parse(await readFile4(bedrock, "utf8"));
    for (const entry of json.data_items ?? []) if (entry.name) vanillaBlockIds.add(entry.name);
  }
  const blocksDir = resolveFromRoot("bp/blocks");
  if (existsSync3(blocksDir)) {
    for (const name of await readdir7(blocksDir)) {
      if (name.endsWith(".json")) portBlockIds.add(`cooblemon:${name.replace(/\.json$/, "")}`);
    }
  }
  for (const [tag, values] of Object.entries(VANILLA_TAGS)) tagCache.set(tag, values);
  for (const ns of ["cobblemon", "minecraft", "c"]) {
    const dir = resolveFromRoot(path4.join(MOD_DATA, ns, "tags/block"));
    if (!existsSync3(dir)) continue;
    for (const name of await readdir7(dir)) {
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
    // El peso del líder dentro de la manada, no el de la manada entera.
    weight: leader.weight ?? entry.weight,
    levelRange: entry.levelRange ?? leader.levelRange
  };
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
        if (shouldSkipGenericBiomeRule(biome, light, dimension, bucket, !!baseBlocks || !!nearbyBlocks)) {
          continue;
        }
        const expandedBiomes = biome === "overworld" && bucket === "ultra-rare" ? [...ULTRA_RARE_OVERWORLD_BIOMES] : [biome];
        for (const resolvedBiome of expandedBiomes) {
          const ruleSelector = resolvedBiome === biome ? selector : { any: [resolvedBiome] };
          for (const variant of lightVariants) {
            if (shouldSkipGenericBiomeRule(
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
              alpha: /alpha=true/i.test(entry.pokemon ?? "") || void 0
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
function bundleSpawnRules(id, spawn) {
  const out = [];
  for (const rule of filterCoastalLandRules(spawn.rules)) {
    if (shouldSkipGenericBiomeRule(
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
    if (rule.biomeTag && rule.biomeTag !== rule.biome) bundled.biomeTag = rule.biomeTag;
    const selector = rule.biomeSelector;
    if (selector?.any && selector.any.length > 1) bundled.biomeAny = [...selector.any];
    if (selector?.all && selector.all.length > 0) bundled.biomeAll = [...selector.all];
    if (selector?.not && selector.not.length > 0) bundled.biomeNot = [...selector.not];
    if (isDedicatedSpawnForm(rule.form)) bundled.form = rule.form;
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
      if (display) lines.push(`item.${id}.name=${display}`);
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

// tools/kit/kit.ts
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
    input: path7.resolve(input),
    ns: get("--ns") ?? null,
    out: get("--out") ? path7.resolve(get("--out")) : null,
    version: [v[0] ?? 1, v[1] ?? 0, v[2] ?? 0]
  };
}
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
  return JSON.parse(await readFile7(file, "utf8"));
}
async function writeJson2(file, data) {
  await mkdir2(path7.dirname(file), { recursive: true });
  await writeFile4(file, `${JSON.stringify(data, null, 2)}
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
async function resolveAssets(assets, names) {
  const pokemon = path7.join(assets, "bedrock", "pokemon");
  const geoFiles = (await walk2(path7.join(pokemon, "models"))).filter((f) => f.endsWith(".json"));
  const poserFiles = (await walk2(path7.join(pokemon, "posers"))).filter((f) => f.endsWith(".json"));
  const tex = (ref) => path7.join(assets, ref.split(":").pop());
  const byName = /* @__PURE__ */ new Map();
  for (const file of (await walk2(path7.join(pokemon, "resolvers"))).filter((f) => f.endsWith(".json"))) {
    const r = await readJson(file);
    const name = speciesName(String(r.species ?? "").split(":").pop() ?? "");
    if (!names.has(name)) continue;
    const entry = byName.get(name) ?? { folder: path7.basename(path7.dirname(file)), files: [] };
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
        const geoFile = geoFiles.find((f) => path7.basename(f) === `${model.split(":").pop()}.json`);
        if (!geoFile) return null;
        const poserName = `${(poser ?? name).split(":").pop()}.json`;
        return {
          geoFile,
          texture: tex(texture),
          layers: layers.map((l) => textureRef(l.texture)).filter((t) => !!t).map(tex).filter((f) => existsSync6(f)),
          poserFile: poserFiles.find((f) => path7.basename(f) === poserName) ?? null
        };
      }
    });
  }
  return out;
}
async function composedTexture(variant, dst) {
  const base = decodePng(await readFile7(variant.texture));
  const data = Buffer.from(base.data);
  for (const file of variant.layers) {
    const layer = decodePng(await readFile7(file));
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
  await mkdir2(path7.dirname(dst), { recursive: true });
  await writeFile4(dst, encodePng({ width: base.width, height: base.height, data }));
}
async function writeGeometry(ns, geoFile, rp, fileName, name) {
  const geo = JSON.parse(sanitizeGeometryJson(await readFile7(geoFile, "utf8"), name));
  let id = "";
  (geo["minecraft:geometry"] ?? []).forEach((g, index) => {
    const own = `geometry.${ns}.${fileName}${index ? `_${index}` : ""}`;
    g.description = { ...g.description, identifier: own };
    id ||= own;
  });
  await writeJson2(path7.join(rp, "models", "entity", ns, `${fileName}.geo.json`), geo);
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
async function behaviorEntity(id, family, raw, extras) {
  const template = TEMPLATES[profileOf(raw)];
  const entity = await readJson(resolveFromRoot(`bp/entities/${template}.json`));
  const e = entity["minecraft:entity"];
  e.description.identifier = id;
  e.description.is_spawnable = true;
  e.description.is_summonable = true;
  const templateSpecies = await readJson(
    (await walk2(resolveFromRoot("data/species"))).find((f) => path7.basename(f) === `${template}.json`)
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
    const pikachu = (await readJson(resolveFromRoot("bp/entities/pikachu.json")))["minecraft:entity"];
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
var STATE = {
  ground: "!query.is_in_water && query.is_on_ground",
  air: "!query.is_in_water && !query.is_on_ground",
  water: "query.is_in_water",
  moving: "(query.ground_speed > 0.08 || math.abs(query.vertical_speed) > 0.08)",
  free: "!query.property('cooblemon:in_battle') && !query.property('cooblemon:sleeping') && !query.is_riding"
};
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
var itemId = (id) => id.replace(/^cobblemon:/, "cooblemon:");
function convertSpecies(ns, raw, own, extras) {
  const ref = (s) => {
    const [first, ...rest] = s.trim().split(/\s+/);
    const n = speciesName(first.split(":").pop());
    return [own.has(n) ? `${ns}:${n}` : n, ...rest].join(" ");
  };
  const { normal, hidden } = parseAbilities(raw.abilities);
  const zero = { hp: 0, attack: 0, defence: 0, specialAttack: 0, specialDefence: 0, speed: 0 };
  const evolutions = (raw.evolutions ?? []).map((e) => ({ ...e, result: ref(String(e.result ?? "")) }));
  const forms = (raw.forms ?? []).map((f) => {
    const fa = parseAbilities(f.abilities);
    return {
      ...f,
      // **El id de la forma es su aspecto**, no su nombre: el Vulpix de Alola se
      // llama «Alola» pero el mod lo reconoce por `alolan`, que es lo que
      // escriben sus apariciones y lo que busca el port (`findSpeciesForm`).
      // En minúsculas y con `_` («region-bias-alola» → `region_bias_alola`):
      // el registro rechaza los demás.
      name: String(f.aspects?.[0] ?? f.name ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, ""),
      ...f.baseStats ? { baseStats: toCamelStats(f.baseStats) } : {},
      ...f.abilities ? { abilities: fa.normal } : {},
      ...f.evolutions ? { evolutions: f.evolutions.map((e) => ({ ...e, result: ref(String(e.result ?? "")) })) } : {}
    };
  });
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
var RENDERER = existsSync6(resolveFromRoot("tools/kit/render-pokemon-sprites.mjs")) ? [resolveFromRoot("tools/kit/render-pokemon-sprites.mjs")] : [resolveFromRoot("node_modules/tsx/dist/cli.mjs"), resolveFromRoot("tools/render-pokemon-sprites.ts")];
var QUIET_RENDER = { encoding: "utf8", stdio: "pipe", maxBuffer: 64 * 1024 * 1024 };
function showRendererOutput(r) {
  const text = `${r.stdout ?? ""}${r.stderr ?? ""}${r.error ? String(r.error) : ""}`.trim();
  if (text) console.error(text.split(/\r?\n/).slice(-40).join("\n"));
}
async function renderSprites(ns, assets, variants, rp, work, page) {
  const fileOf = (v, shiny) => `${v.name}${v.form ? `_${v.form}` : ""}${shiny ? "_shiny" : ""}`;
  const jobs = variants.flatMap(
    (v) => [false, true].map((shiny) => ({
      species: v.name,
      ...v.aspects.length || shiny ? { aspects: [...v.aspects, ...shiny ? ["shiny"] : []] } : {},
      files: {
        pc: path7.join(work, "pc", `${fileOf(v, shiny)}.png`),
        face: path7.join(work, "face", `${fileOf(v, shiny)}.png`)
      }
    }))
  );
  await rm2(work, { recursive: true, force: true });
  await mkdir2(path7.join(work, "pc"), { recursive: true });
  await mkdir2(path7.join(work, "face"), { recursive: true });
  const manifest = path7.join(work, "jobs.json");
  await writeFile4(manifest, JSON.stringify(jobs), "utf8");
  logStep(`  Sprites: rendering ${jobs.length} variants (this can take a few minutes)\u2026`);
  const run = spawnSync(
    process.execPath,
    [
      ...RENDERER,
      "--manifest",
      manifest,
      "--asset-root",
      assets,
      "--workers",
      "2"
    ],
    QUIET_RENDER
  );
  if (run.status !== 0) {
    showRendererOutput(run);
    logWarn("  Sprites: the renderer failed (is there a browser? see SPRITE_BROWSER); the add-on is built without sprites");
    return {};
  }
  const dexDir = path7.join(work, "dex");
  const dexJobs = variants.flatMap(
    (v) => [false, true].map((shiny) => ({
      name: fileOf(v, shiny),
      species: v.name,
      ...v.aspects.length || shiny ? { aspects: [...v.aspects, ...shiny ? ["shiny"] : []] } : {}
    }))
  );
  for (const pass of ["icon", "portrait", "size"]) {
    const dir = path7.join(dexDir, pass);
    await mkdir2(dir, { recursive: true });
    const jobsFile = path7.join(dexDir, `${pass}.jobs.json`);
    const specFile = path7.join(dexDir, `${pass}.spec.json`);
    await writeFile4(jobsFile, JSON.stringify(pass === "size" ? dexJobs.filter((j) => !j.name.endsWith("_shiny")) : dexJobs), "utf8");
    await writeFile4(specFile, JSON.stringify(DEX_PASSES[pass]), "utf8");
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
        "--asset-root",
        assets,
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
      const pc = path7.join(work, "pc", `${file}.png`);
      const face = path7.join(work, "face", `${file}.png`);
      if (!existsSync6(pc)) continue;
      const tex = `textures/${ns}/sprites`;
      await mkdir2(path7.join(rp, tex, "pc"), { recursive: true });
      await copyFile2(pc, path7.join(rp, tex, "pc", `${file}.png`));
      const set = { pc: `${tex}/pc/${file}`, dex: `${tex}/pc/${file}`, portrait: `${tex}/pc/${file}` };
      for (const [pass, key] of [["icon", "dex"], ["portrait", "portrait"], ["size", "size"]]) {
        const src = path7.join(dexDir, pass, `${pass === "size" ? fileOf(v, false) : file}.png`);
        if (!existsSync6(src)) continue;
        await mkdir2(path7.join(rp, tex, "dex", pass), { recursive: true });
        await copyFile2(src, path7.join(rp, tex, "dex", pass, `${file}.png`));
        set[key] = `${tex}/dex/${pass}/${file}`;
      }
      if (existsSync6(face)) {
        await mkdir2(path7.join(rp, tex, "face"), { recursive: true });
        await copyFile2(face, path7.join(rp, tex, "face", `${file}.png`));
        set.face = `${tex}/face/${file}`;
        faces.push(decodePng(await readFile7(face)));
        set.glyph = String.fromCharCode(page << 8 | index++);
      }
      sprites[`${ns}:${v.name}|${v.form ?? ""}|${shiny ? 1 : 0}`] = set;
    }
  }
  if (faces.length) {
    const fontName = `glyph_${page.toString(16).toUpperCase()}.png`;
    await mkdir2(path7.join(rp, "font"), { recursive: true });
    await writeFile4(path7.join(rp, "font", fontName), encodePng(glyphPage(faces)));
  }
  return sprites;
}
async function main() {
  const args = parseArgs();
  const dataRoot = path7.join(args.input, "data");
  const ns = args.ns ?? (existsSync6(dataRoot) ? (await readdir6(dataRoot, { withFileTypes: true })).find((d) => d.isDirectory() && d.name !== "minecraft")?.name : void 0);
  if (!ns || !/^[a-z0-9_]+$/.test(ns) || ns === "cooblemon" || ns === "cobblemon") {
    throw new Error(`Invalid namespace: "${ns}". Pass it with --ns (lowercase letters, digits and _).`);
  }
  const data = path7.join(dataRoot, ns);
  const assets = path7.join(args.input, "assets", ns);
  const out = args.out ?? resolveFromRoot(`dist/kit/${ns}`);
  const bp = path7.join(out, "BP");
  const rp = path7.join(out, "RP");
  await rm2(bp, { recursive: true, force: true });
  await rm2(rp, { recursive: true, force: true });
  const rawSpecies = [];
  for (const file of (await walk2(path7.join(data, "species"))).filter((f) => f.endsWith(".json"))) {
    rawSpecies.push(await readJson(file));
  }
  const own = new Set(rawSpecies.map((s) => speciesName(s.name)));
  const resolved = await resolveAssets(assets, own);
  const species = [];
  const animTex = `textures/${ns}/pokemon`;
  const spriteJobs = [];
  for (const raw of rawSpecies) {
    const name = speciesName(raw.name);
    const id = `${ns}:${name}`;
    const res = resolved.get(name);
    const base2 = res?.resolve([]);
    if (!res || !base2) {
      logWarn(`${id}: no model or texture in the resolvers; skipped`);
      continue;
    }
    const animId = (ref) => {
      const [prefix, ...clip] = ref.split(".");
      return `animation.${ns}_${prefix}.${clip.join(".")}`;
    };
    const lengths = /* @__PURE__ */ new Map();
    const renamed = {};
    for (const file of (await walk2(path7.join(assets, "bedrock", "pokemon", "animations", res.folder))).filter((f) => f.endsWith(".animation.json"))) {
      const payload = await readJson(file);
      const tree = sanitizeAnimationTree(payload.animations ?? {});
      for (const [key, anim] of Object.entries(tree)) {
        const ref = key.split(".").slice(1).join(".");
        if (!key.startsWith("animation.") || !ref.includes(".")) continue;
        renamed[animId(ref)] = anim;
        lengths.set(ref, [anim.animation_length ?? 1, anim.loop === true || anim.loop === "true"]);
      }
    }
    const rolesFor = async (poserFile, tag) => {
      const poser = poserFile ? await readJson(poserFile) : null;
      const roles = rolesFromPoser(poser);
      for (const [role, info] of roles) {
        if (info.clip && !lengths.has(info.clip)) {
          logWarn(`${id}: the ${role} pose asks for "${info.clip}", which is not in its animations`);
          roles.delete(role);
        }
      }
      const prefix = roles.get("idle")?.clip?.split(".")[0] ?? name;
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
    const baseRoles = await rolesFor(base2.poserFile, "");
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
        const e = entry(n === "cry" && lengths.has(`${name}.battle_cry`) ? `${name}.battle_cry` : `${name}.${n}`);
        if (e) battleClips[n] = e;
      }
    }
    const baseGeo = JSON.parse(await readFile7(base2.geoFile, "utf8"));
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
      const variant = res.resolve(aspects);
      if (!variant) return false;
      const fileName = form ? `${name}_${form}` : name;
      const entityId = form ? `${id}_${form}` : id;
      const geometry = {
        default: await writeGeometry(ns, variant.geoFile, rp, fileName, name)
      };
      const texDir = `${animTex}/${name}`;
      await composedTexture(variant, path7.join(rp, `${texDir}/${fileName}.png`));
      await composedTexture(res.resolve([...aspects, "shiny"]) ?? variant, path7.join(rp, `${texDir}/${fileName}_shiny.png`));
      const textures = { default: `${texDir}/${fileName}`, shiny: `${texDir}/${fileName}_shiny` };
      const female = res.resolve([...aspects, "female"]);
      const femaleGeo = !!female && female.geoFile !== variant.geoFile;
      const femaleTex = !!female && (female.texture !== variant.texture || female.layers.join() !== variant.layers.join());
      if (female && femaleGeo) geometry.female = await writeGeometry(ns, female.geoFile, rp, `${fileName}_female`, name);
      if (female && femaleTex) {
        await composedTexture(female, path7.join(rp, `${texDir}/${fileName}_female.png`));
        await composedTexture(res.resolve([...aspects, "female", "shiny"]) ?? female, path7.join(rp, `${texDir}/${fileName}_female_shiny.png`));
        textures.female = `${texDir}/${fileName}_female`;
        textures.female_shiny = `${texDir}/${fileName}_female_shiny`;
      }
      const roles = variant.poserFile && variant.poserFile !== base2.poserFile ? (await rolesFor(variant.poserFile, `${form}_`)).roles : baseRoles.roles;
      await writeJson2(
        path7.join(bp, "entities", `${fileName}.json`),
        await behaviorEntity(entityId, `${ns}_${name}`, raw, { shoulder: !!shoulderPose, seats, rideSpeed })
      );
      await writeJson2(
        path7.join(rp, "entity", `${fileName}.entity.json`),
        clientEntity(entityId, fileName, geometry, textures, roles, animId, battleClips, shoulderClip)
      );
      await writeJson2(
        path7.join(rp, "render_controllers", `${ns}.${fileName}.render_controllers.json`),
        renderController(entityId, { geometry: femaleGeo, texture: femaleTex })
      );
      spriteJobs.push({ name, form, aspects });
      return true;
    };
    await buildEntity(null, []);
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
    await writeJson2(path7.join(rp, "animations", ns, `${name}.animation.json`), { format_version: "1.8.0", animations: renamed });
    species.push(converted);
    logStep(
      `  ${id}: template ${TEMPLATES[profileOf(raw)]}, ${baseRoles.roles.size} poses, ${Object.keys(battleClips).length} battle clips` + (base2.layers.length ? `, ${base2.layers.length} layer${base2.layers.length === 1 ? "" : "s"}` : "") + (ownForms.length ? `, forms with their own entity: ${ownForms.join(", ")}` : "") + (rideStats ? `, rideable (${Object.keys(rideStats.stats).join("/")}, ${seats?.length ?? 0} seat${seats?.length === 1 ? "" : "s"})` : "") + (shoulderPose ? ", shoulder" : "")
    );
  }
  const sprites = args.sprites && spriteJobs.length ? await renderSprites(
    ns,
    assets,
    spriteJobs,
    rp,
    path7.join(out, ".sprites"),
    args.glyphPage
  ) : {};
  const spawnFiles = (await walk2(path7.join(data, "spawn_pool_world"))).filter((f) => f.endsWith(".json"));
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
  const items = await convertItems({ input: args.input, ns, bp, rp });
  if (species.length === 0 && items.items.length === 0) {
    throw new Error(`No species or items found in ${args.input} (data/${ns}/species, assets/${ns}/models/item)`);
  }
  const langFiles = (await walk2(path7.join(assets, "lang"))).filter((f) => f.endsWith(".json"));
  const languages = [];
  for (const file of langFiles) {
    const src = await readJson(file);
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
    lines.push(...items.langLines.get(path7.basename(file, ".json")) ?? []);
    const locale = bedrockLocale(path7.basename(file, ".json"));
    languages.push(locale);
    await mkdir2(path7.join(rp, "texts"), { recursive: true });
    await writeFile4(path7.join(rp, "texts", `${locale}.lang`), `${lines.join("\n")}
`, "utf8");
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
      await copyFile2(path7.join(rp, "texts", `${locale}.lang`), path7.join(rp, "texts", `${sibling}.lang`));
      languages.push(sibling);
    }
  }
  if (languages.length) await writeJson2(path7.join(rp, "texts", "languages.json"), languages);
  const version = args.version.join(".");
  await mkdir2(path7.join(bp, "scripts"), { recursive: true });
  const apiLib = resolveFromRoot("packages/api/dist/cobblemon-bedrock-api.js");
  if (!existsSync6(apiLib)) throw new Error("Missing packages/api/dist/cobblemon-bedrock-api.js: run npm run api:build first");
  await copyFile2(apiLib, path7.join(bp, "scripts", "cobblemon-bedrock-api.js"));
  await writeFile4(
    path7.join(bp, "scripts", "main.js"),
    [
      "// Generated by the Cobblemon Bedrock creator kit: do not edit, regenerate it instead.",
      'import { registerAddon } from "./cobblemon-bedrock-api.js";',
      'import { ADDON, EVOLUTIONS, SPAWN, SPECIES, SPRITES, VERSION } from "./data.js";',
      "",
      "registerAddon({ addon: ADDON, version: VERSION, species: SPECIES, spawn: SPAWN, sprites: SPRITES, evolutions: EVOLUTIONS });",
      ""
    ].join("\n"),
    "utf8"
  );
  await writeFile4(
    path7.join(bp, "scripts", "data.js"),
    [
      "// Generated by the Cobblemon Bedrock creator kit: do not edit, regenerate it instead.",
      `export const ADDON = ${JSON.stringify(ns)};`,
      `export const VERSION = ${JSON.stringify(version)};`,
      `export const SPECIES = ${JSON.stringify(species)};`,
      `export const SPAWN = ${JSON.stringify({ entries, levels })};`,
      `export const SPRITES = ${JSON.stringify(sprites)};`,
      "export const EVOLUTIONS = {};",
      ""
    ].join("\n"),
    "utf8"
  );
  const base = await readJson(resolveFromRoot("package.json"));
  const cv = base.version.split(".").map(Number);
  const bpManifest = await readJson(resolveFromRoot("bp/manifest.json"));
  const rpManifest = await readJson(resolveFromRoot("rp/manifest.json"));
  const engine = [1, 26, 50];
  await writeJson2(path7.join(bp, "manifest.json"), {
    format_version: 2,
    header: { name: `${ns} (Cobblemon Bedrock)`, description: `Cobblemon Bedrock add-on generated by the creator kit (${species.length} species, ${items.items.length} items).`, uuid: stableUuid(`${ns}:bp`), version: args.version, min_engine_version: engine },
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
  await writeJson2(path7.join(rp, "manifest.json"), {
    format_version: 2,
    capabilities: ["pbr"],
    header: { name: `${ns} (Cobblemon Bedrock, resources)`, description: "Models, animations, textures and texts.", uuid: stableUuid(`${ns}:rp`), version: args.version, min_engine_version: engine },
    modules: [{ type: "resources", uuid: stableUuid(`${ns}:rp:res`), version: args.version }],
    dependencies: [{ uuid: rpManifest.header.uuid, version: cv }]
  });
  const pack = path7.join(out, `${ns}.mcaddon`);
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
  logStep(
    `Kit: ${species.length} species, ${entries.length} spawns, ${items.items.length} items, ${items.recipes} recipes, ${languages.length} languages, ${Object.keys(sprites).length} sprite sets \u2192 ${pack}`
  );
}
main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
