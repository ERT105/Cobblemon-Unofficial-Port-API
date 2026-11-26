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
var PARTICLE_LOCATOR_ALLOWLIST, SHINY_PARTICLES, FURFROU_HAIR_COLORS, FURFROU_PARTICLES, IMPACT_TYPES, PARTICLE_TEXTURES, BATTLE_PARTICLES, FISHING_PARTICLES, AILMENT_PARTICLES;
var init_copy_pokemon_particles = __esm({
  "tools/lib/copy-pokemon-particles.ts"() {
    init_utils();
    PARTICLE_LOCATOR_ALLOWLIST = {
      gastly: /* @__PURE__ */ new Set(["gas"])
    };
    SHINY_PARTICLES = [
      "ambient_shiny_sparkle",
      "shiny_sparkle_ambient_wild",
      "shiny_ring",
      "wild_shiny_ring",
      "shiny_ring2",
      "shiny_ring3",
      "shiny_ring4",
      "shiny_ring5",
      "shiny_ring6",
      "shiny_ring7",
      "shiny_ring8",
      "shine_sparkle1",
      "shine_sparkle2"
    ].map((name) => ({
      sourceRel: `generic/${name}.particle.json`,
      destFile: `${name}.particle.json`,
      identifier: `cooblemon:${name}`,
      entityVariables: true
    }));
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

// tools/lib/anim-sample.ts
function evalMolang(expr, t, strict = false) {
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
        if (strict) throw new Error(`funci\xF3n ${name}`);
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
    if (strict && name === "math.pi") return Math.PI;
    if (strict) throw new Error(`consulta ${name}`);
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
    if (strict && (i !== src.length || !Number.isFinite(v))) return NaN;
    return Number.isFinite(v) ? v : 0;
  } catch {
    return strict ? NaN : 0;
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
var init_anim_sample = __esm({
  "tools/lib/anim-sample.ts"() {
  }
});

// tools/lib/bake-smooth-channels.ts
var init_bake_smooth_channels = __esm({
  "tools/lib/bake-smooth-channels.ts"() {
    init_anim_sample();
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
    init_bake_smooth_channels();
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
var BATTLE_CLIPS, MODEL_LOCATORS, LOCATOR_POSES;
var init_battle_anim_generated = __esm({
  "bp/src/data/bundled/battle-anim.generated.ts"() {
    BATTLE_CLIPS = JSON.parse('{"ancient_poke_ball":{"throw":["animation.ancient_poke_ball.throw",4,1]},"lileep":{"cry":["animation.lileep.cry",2]},"poke_ball":{"throw":["animation.poke_ball.throw",4,1]},"bulbasaur":{"faint":["animation.bulbasaur.faint",3],"cry":["animation.bulbasaur.cry",1],"recoil":["animation.bulbasaur.recoil",1]},"ivysaur":{"faint":["animation.ivysaur.faint",3],"cry":["animation.ivysaur.cry",1],"recoil":["animation.ivysaur.recoil",1]},"venusaur":{"cry":["animation.venusaur.cry",1.5],"recoil":["animation.venusaur.recoil",1]},"charmander":{"cry":["animation.charmander.cry",1.5],"special":["animation.charmander.special",3]},"charmeleon":{"cry":["animation.charmeleon.cry",1.25]},"charizard":{"cry":["animation.charizard.battle_cry",3,0,1],"recoil":["animation.charizard.recoil",1.5],"physical":["animation.charizard.physical",3],"special":["animation.charizard.special",3],"air_physical":["animation.charizard.air_physical",3],"air_special":["animation.charizard.air_special",3],"status":["animation.charizard.status",3]},"squirtle":{"special":["animation.squirtle.special",3],"physical":["animation.squirtle.physical",3],"recoil":["animation.squirtle.recoil",1.5],"status":["animation.squirtle.status",3],"cry":["animation.squirtle.cry",3],"faint":["animation.squirtle.faint",3]},"wartortle":{"special":["animation.wartortle.special",3],"physical":["animation.wartortle.physical",3],"recoil":["animation.wartortle.recoil",1.5],"status":["animation.wartortle.status",3],"cry":["animation.wartortle.cry",2.5],"faint":["animation.wartortle.faint",3]},"blastoise":{"faint":["animation.blastoise.faint",3],"cry":["animation.blastoise.cry",3],"recoil":["animation.blastoise.recoil",1.5],"physical":["animation.blastoise.physical",3],"special":["animation.blastoise.special",3],"status":["animation.blastoise.status",3]},"caterpie":{"cry":["animation.caterpie.cry",1.08],"faint":["animation.caterpie.faint",3]},"metapod":{"cry":["animation.metapod.cry",1.42],"faint":["animation.metapod.faint",3]},"butterfree":{"cry":["animation.butterfree.cry",1],"faint":["animation.butterfree.faint",1.85]},"weedle":{"cry":["animation.weedle.cry",1.33],"faint":["animation.weedle.faint",2.55]},"kakuna":{"faint":["animation.kakuna.faint",3],"cry":["animation.kakuna.cry",1],"physical":["animation.kakuna.physical",3]},"beedrill":{"cry":["animation.beedrill.cry",1.71]},"pidgey":{"cry":["animation.pidgey.cry",0.38],"recoil":["animation.pidgey.recoil",0.54]},"pidgeotto":{"cry":["animation.pidgeotto.cry",1.5],"recoil":["animation.pidgeotto.recoil",0.58]},"pidgeot":{"cry":["animation.pidgeot.battle_cry",3,0,1],"recoil":["animation.pidgeot.recoil",0.88],"status":["animation.pidgeot.status",3]},"rattata":{"faint":["animation.rattata.faint",3],"cry":["animation.rattata.cry",1]},"rattata_alolan":{"cry":["animation.rattata_alolan.cry",1],"faint":["animation.rattata_alolan.faint",3]},"raticate":{"cry":["animation.raticate.cry",0.79],"faint":["animation.raticate.faint",3]},"raticate_alolan":{"cry":["animation.raticate_alolan.cry",0.67],"faint":["animation.raticate_alolan.faint",3]},"spearow":{"cry":["animation.spearow.cry",1.17]},"fearow":{"cry":["animation.fearow.cry",1.25]},"ekans":{"recoil":["animation.ekans.recoil",1],"cry":["animation.ekans.cry",1.5]},"arbok":{"faint":["animation.arbok.faint",3],"recoil":["animation.arbok.recoil",1.04],"cry":["animation.arbok.cry",1.25]},"pikachu":{"faint":["animation.pikachu.faint",3],"recoil":["animation.pikachu.recoil",2],"cry":["animation.pikachu.battle_cry",3,0,1],"volttackle":["animation.pikachu.volttackle",3],"physical":["animation.pikachu.physical",3],"special":["animation.pikachu.special",3],"status":["animation.pikachu.status",3]},"pikachu_cap":{"special":["animation.pikachu_cap.special",3],"physical":["animation.pikachu_cap.physical",3],"recoil":["animation.pikachu_cap.recoil",1.5],"status":["animation.pikachu_cap.status",3],"cry":["animation.pikachu_cap.battle_cry",3],"faint":["animation.pikachu_cap.faint",3]},"pikachu_captain":{"special":["animation.pikachu_captain.special",3],"physical":["animation.pikachu_captain.physical",3],"recoil":["animation.pikachu_captain.recoil",2],"status":["animation.pikachu_captain.status",3],"cry":["animation.pikachu_captain.battle_cry",3],"faint":["animation.pikachu_captain.faint",3]},"raichu":{"faint":["animation.raichu.faint",3],"recoil":["animation.raichu.recoil",1.79],"cry":["animation.raichu.battle_cry",3,0,1],"physical":["animation.raichu.physical",3],"special":["animation.raichu.special",3],"thunder":["animation.raichu.special2",3],"risingvoltage":["animation.raichu.special2",3],"status":["animation.raichu.status",3]},"raichu_alolan":{"special":["animation.raichu_alolan.special",3],"physical":["animation.raichu_alolan.physical",3],"recoil":["animation.raichu_alolan.recoil",3],"cry":["animation.raichu_alolan.battle_cry",3],"faint":["animation.raichu_alolan.faint",3]},"raichu_alolan_cap":{"special":["animation.raichu_alolan_cap.special",3],"physical":["animation.raichu_alolan_cap.physical",3],"recoil":["animation.raichu_alolan_cap.recoil",3],"cry":["animation.raichu_alolan_cap.battle_cry",3],"faint":["animation.raichu_alolan_cap.faint",3]},"raichu_cap":{"special":["animation.raichu_cap.special",3],"physical":["animation.raichu_cap.physical",3],"recoil":["animation.raichu_cap.recoil",1.79],"status":["animation.raichu_cap.status",3],"cry":["animation.raichu_cap.battle_cry",3],"faint":["animation.raichu_cap.faint",2.96]},"sandshrew":{"cry":["animation.sandshrew.cry",1.2],"physical":["animation.sandshrew.physical",3],"recoil":["animation.sandshrew.recoil",1]},"sandshrew_alolan":{"cry":["animation.sandshrew_alolan.cry",1.2]},"sandslash":{"faint":["animation.sandslash_alolan.faint",2.65],"cry":["animation.sandslash_alolan.cry",1.2]},"sandslash_alolan":{"cry":["animation.sandslash_alolan.cry",1.2],"faint":["animation.sandslash_alolan.faint",2.65]},"nidoranf":{"cry":["animation.nidoranf.cry",1.5],"recoil":["animation.nidoranf.recoil",0.75]},"nidorina":{"cry":["animation.nidorina.cry",1.5],"recoil":["animation.nidorina.recoil",0.75]},"nidoqueen":{"cry":["animation.nidoqueen.cry",1]},"nidoranm":{"cry":["animation.nidoranm.cry",1.5],"recoil":["animation.nidoranm.recoil",0.75]},"nidorino":{"cry":["animation.nidorino.cry",1.2]},"nidoking":{"cry":["animation.nidoking.battle_cry",3,0,1],"recoil":["animation.nidoking.recoil",1.5],"physical":["animation.nidoking.physical",3],"special":["animation.nidoking.special",3],"beam":["animation.nidoking.beam",3],"status":["animation.nidoking.status",3]},"clefairy":{"faint":["animation.clefairy.faint",3],"cry":["animation.clefairy.cry",0.75],"special":["animation.clefairy.special",3]},"clefable":{"faint":["animation.clefable.faint",3],"cry":["animation.clefable.cry",0.79],"physical":["animation.clefable.physical",2],"special":["animation.clefable.special",3]},"vulpix":{"cry":["animation.vulpix.cry",2.08],"recoil":["animation.vulpix.recoil",1.21]},"vulpix_alolan":{"recoil":["animation.vulpix_alolan.recoil",1.21],"cry":["animation.vulpix_alolan.cry",2.08]},"ninetales":{"cry":["animation.ninetales.cry",2]},"ninetales_alolan":{"cry":["animation.ninetales_alolan.cry",2]},"jigglypuff":{"cry":["animation.jigglypuff.cry",1],"faint":["animation.jigglypuff.faint",3]},"wigglytuff":{"cry":["animation.wigglytuff.cry",1.25],"faint":["animation.wigglytuff.faint",3]},"zubat":{"cry":["animation.zubat.cry",1],"physical":["animation.zubat.physical",3]},"golbat":{"cry":["animation.golbat.cry",1.5]},"oddish":{"cry":["animation.oddish.cry",1],"recoil":["animation.oddish.recoil",0.42]},"gloom":{"cry":["animation.gloom.cry",1],"recoil":["animation.gloom.recoil",0.42]},"vileplume":{"cry":["animation.vileplume.cry",1.75],"recoil":["animation.vileplume.recoil",0.46]},"paras":{"cry":["animation.paras.cry",1.25],"faint":["animation.paras.faint",3]},"parasect":{"cry":["animation.parasect.cry",1.25],"faint":["animation.parasect.faint",3]},"venonat":{"cry":["animation.venonat.cry",1.25]},"venomoth":{"cry":["animation.venomoth.cry",0.75]},"diglett":{"faint":["animation.diglett.faint",3],"cry":["animation.diglett.cry",2],"physical":["animation.diglett.physical",3]},"diglett_alolan":{"physical":["animation.diglett_alolan.physical",3],"cry":["animation.diglett_alolan.cry",2],"faint":["animation.diglett_alolan.faint",3]},"dugtrio":{"faint":["animation.dugtrio.faint",3],"cry":["animation.dugtrio.cry",2.25],"physical":["animation.dugtrio.physical",3]},"dugtrio_alolan":{"physical":["animation.dugtrio_alolan.physical",3],"cry":["animation.dugtrio_alolan.cry",2.25],"faint":["animation.dugtrio_alolan.faint",3]},"meowth":{"cry":["animation.meowth.cry",1.5]},"meowth_alolan":{"cry":["animation.meowth_alolan.cry",1.5]},"meowth_galarian":{"cry":["animation.meowth_galarian.cry",1.5]},"persian":{"cry":["animation.persian.cry",1.5]},"persian_alolan":{"cry":["animation.persian_alolan.cry",1.5]},"psyduck":{"cry":["animation.psyduck.cry",0.92],"faint":["animation.psyduck.faint",3]},"golduck":{"cry":["animation.golduck.cry",0.79]},"mankey":{"cry":["animation.mankey.cry",0.96],"faint":["animation.mankey.faint",3]},"primeape":{"faint":["animation.primeape.faint",3],"cry":["animation.primeape.cry",2.25],"recoil":["animation.primeape.recoil",1.75],"physical":["animation.primeape.physical",3]},"growlithe":{"cry":["animation.growlithe.cry",0.71]},"arcanine":{"cry":["animation.arcanine.cry",2.5],"recoil":["animation.arcanine.recoil",1.25]},"poliwag":{"cry":["animation.poliwag.cry",1.25]},"poliwhirl":{"cry":["animation.poliwhirl.cry",1.25],"recoil":["animation.poliwhirl.recoil",1.5]},"poliwrath":{"cry":["animation.poliwrath.cry",1.25],"physical":["animation.poliwrath.physical",3],"recoil":["animation.poliwrath.recoil",1.5]},"abra":{"faint":["animation.abra.faint",3],"cry":["animation.abra.cry",1.5]},"kadabra_female":{"recoil":["animation.kadabra_female.recoil",1.5],"cry":["animation.kadabra_female.cry",1]},"kadabra_male":{"recoil":["animation.kadabra_male.recoil",1.5],"cry":["animation.kadabra_male.cry",1]},"alakazam_female":{"recoil":["animation.alakazam_female.recoil",1.5],"cry":["animation.alakazam_female.cry",1]},"alakazam_male":{"recoil":["animation.alakazam_male.recoil",1.5],"cry":["animation.alakazam_male.cry",1]},"machop":{"cry":["animation.machop.cry",1.25]},"machoke":{"cry":["animation.machoke.cry",1.25]},"machamp":{"cry":["animation.machamp.cry",1.25]},"bellsprout":{"cry":["animation.bellsprout.cry",1.5]},"weepinbell":{"cry":["animation.weepinbell.cry",1]},"victreebel":{"cry":["animation.victreebel.cry",1.5]},"geodude":{"cry":["animation.geodude.battle_cry",1.75],"recoil":["animation.geodude.recoil",1],"status":["animation.geodude.status",1.75]},"geodude_alolan":{"recoil":["animation.geodude_alolan.recoil",1],"status":["animation.geodude_alolan.status",1.75],"cry":["animation.geodude_alolan.battle_cry",1.75]},"graveler":{"cry":["animation.graveler.battle_cry",2],"recoil":["animation.graveler.battle_recoil",1],"status":["animation.graveler.status",2],"physical":["animation.graveler.physical",3]},"graveler_alolan":{"physical":["animation.graveler_alolan.physical",3],"recoil":["animation.graveler_alolan.recoil",1],"status":["animation.graveler_alolan.status",2],"cry":["animation.graveler_alolan.battle_cry",2]},"golem":{"cry":["animation.golem.cry",1.5],"recoil":["animation.golem.recoil",1]},"golem_alolan":{"recoil":["animation.golem_alolan.recoil",1],"cry":["animation.golem_alolan.cry",1.5]},"ponyta":{"cry":["animation.ponyta.cry",1.5],"faint":["animation.ponyta.faint",3]},"ponyta_galar":{"cry":["animation.ponyta_galar.cry",1.58],"faint":["animation.ponyta_galar.faint",3]},"rapidash":{"cry":["animation.rapidash.cry",1.83],"faint":["animation.rapidash.faint",3]},"rapidash_galar":{"cry":["animation.rapidash_galar.cry",2]},"slowpoke":{"cry":["animation.slowpoke.cry",1.75]},"slowpoke_galarian":{"cry":["animation.slowpoke_galarian.cry",1.75]},"slowbro":{"cry":["animation.slowbro.cry",2]},"slowbro_galarian":{"cry":["animation.slowbro_galarian.cry",2]},"magnemite":{"faint":["animation.magnemite.faint",3],"cry":["animation.magnemite.cry",1.2]},"magneton":{"faint":["animation.magneton.faint",2.59],"cry":["animation.magneton.cry",1.2]},"farfetchd":{"cry":["animation.farfetchd.cry",0.83]},"farfetchd_galar":{"cry":["animation.farfetchd_galar.cry",0.83]},"doduo":{"cry":["animation.doduo.cry",1.13]},"dodrio":{"cry":["animation.dodrio.cry",1.21]},"seel":{"cry":["animation.seel.cry",1.25]},"dewgong":{"cry":["animation.dewgong.cry",1.25]},"grimer":{"cry":["animation.grimer.cry",1],"recoil":["animation.grimer.recoil",1.5]},"grimer_alolan":{"recoil":["animation.grimer_alolan.recoil",1.5],"cry":["animation.grimer_alolan.cry",1]},"muk":{"cry":["animation.muk.cry",1.25]},"shellder":{"cry":["animation.shellder.cry",2],"recoil":["animation.shellder.recoil",0.5],"protect":["animation.shellder.protect",3]},"cloyster":{"cry":["animation.cloyster.cry",2],"recoil":["animation.cloyster.recoil",0.5],"protect":["animation.cloyster.protect",3]},"gastly":{"cry":["animation.gastly.cry",1.2]},"gastly_shiny":{"cry":["animation.gastly_shiny.cry",1.2]},"haunter":{"cry":["animation.haunter.cry",1.2]},"gengar":{"cry":["animation.gengar.cry",1.5]},"onix":{"faint":["animation.onix.faint",3],"cry":["animation.onix.cry",2]},"drowzee":{"cry":["animation.drowzee.battle_cry",2.25],"recoil":["animation.drowzee.recoil",1.25]},"hypno":{"cry":["animation.hypno.cry",2.5],"recoil":["animation.hypno.battle_recoil",1.75]},"krabby":{"cry":["animation.krabby.cry",1.33]},"kingler":{"cry":["animation.kingler.cry",1.5],"recoil":["animation.kingler.recoil",1.5]},"voltorb":{"cry":["animation.voltorb.cry",0.08]},"voltorb_hisuian":{"cry":["animation.voltorb_hisuian.cry",1.33]},"electrode":{"cry":["animation.electrode.cry",1.42]},"electrode_hisuian":{"cry":["animation.electrode_hisuian.cry",1.33]},"exeggcute":{"faint":["animation.exeggcute.faint",2]},"exeggutor":{"cry":["animation.exeggutor_alolan.cry",1.5]},"exeggutor_alolan":{"cry":["animation.exeggutor_alolan.cry",1.5]},"cubone":{"cry":["animation.cubone.cry",1.17]},"marowak":{"cry":["animation.marowak.cry",0.83]},"hitmonlee":{"cry":["animation.hitmonlee.cry",2],"faint":["animation.hitmonlee.faint",3]},"hitmonchan":{"cry":["animation.hitmonchan.cry",2.5],"faint":["animation.hitmonchan.faint",3]},"lickitung":{"cry":["animation.lickitung.cry",1.5]},"koffing":{"faint":["animation.koffing.faint",3],"cry":["animation.koffing.battle_cry",3,0,1],"recoil":["animation.koffing.recoil",1.5],"physical":["animation.koffing.physical",3],"special":["animation.koffing.special",3],"status":["animation.koffing.status",3]},"weezing":{"cry":["animation.weezing.cry",1.5],"recoil":["animation.weezing.recoil",1.5],"physical":["animation.weezing.physical",3],"special":["animation.weezing.special",3],"status":["animation.weezing.status",3]},"weezing_galar":{"cry":["animation.weezing_galar.cry",1.25]},"rhyhorn":{"cry":["animation.rhyhorn.battle_cry",3,0,1],"recoil":["animation.rhyhorn.recoil",1.5],"physical":["animation.rhyhorn.physical",3],"special":["animation.rhyhorn.special",3],"status":["animation.rhyhorn.status",3]},"rhydon":{"cry":["animation.rhydon.cry",2],"recoil":["animation.rhydon.recoil",2],"physical":["animation.rhydon.physical",3],"special":["animation.rhydon.special",3],"status":["animation.rhydon.status",3]},"chansey":{"faint":["animation.chansey.faint",3.5],"cry":["animation.chansey.battle_cry",3,0,1],"recoil":["animation.chansey.recoil",1.5],"physical":["animation.chansey.physical",3],"special":["animation.chansey.special",3],"status":["animation.chansey.status",3]},"tangela":{"cry":["animation.tangela.cry",1.33]},"kangaskhan":{"cry":["animation.kangaskhan.cry",1.17],"recoil":["animation.kangaskhan.recoil",0.75]},"horsea":{"cry":["animation.horsea.cry",1.25]},"seadra":{"cry":["animation.seadra.cry",1.2]},"goldeen":{"cry":["animation.goldeen.cry",1]},"seaking":{"cry":["animation.seaking.cry",1.25],"recoil":["animation.seaking.water_battle_recoil",1.5]},"staryu":{"cry":["animation.staryu.cry",1],"physical":["animation.staryu.physical",3,1]},"starmie":{"cry":["animation.starmie.cry",1.25],"faint":["animation.starmie.faint",3],"special":["animation.starmie.special",3],"recoil":["animation.starmie.recoil",1]},"mr_mime":{"faint":["animation.mr_mime.faint",3]},"mr_mime_galarian":{"cry":["animation.mr_mime_galarian.cry",1.5]},"scyther":{"cry":["animation.scyther.cry",0.75]},"electabuzz":{"cry":["animation.electabuzz.cry",1.46]},"magmar":{"cry":["animation.magmar.cry",1.2]},"pinsir":{"cry":["animation.pinsir.cry",3]},"tauros":{"cry":["animation.tauros.cry",2.13]},"tauros_paldean_aqua":{"cry":["animation.tauros_paldean_aqua.cry",2.13]},"tauros_paldean_blaze":{"cry":["animation.tauros_paldean_blaze.cry",2.13]},"tauros_paldean_combat":{"cry":["animation.tauros_paldean_combat.cry",2.13]},"magikarp":{"cry":["animation.magikarp.cry",1.5],"faint":["animation.magikarp.ground_faint",3]},"gyarados":{"cry":["animation.gyarados.battle_cry",1.5],"recoil":["animation.gyarados.recoil",1.75]},"lapras":{"cry":["animation.lapras.battle_cry",3,0,1],"recoil":["animation.lapras.recoil",1.5],"special":["animation.lapras.special",3],"status":["animation.lapras.status",3]},"ditto":{"faint":["animation.ditto.faint",3],"cry":["animation.ditto.cry",1.29]},"eevee":{"cry":["animation.eevee.cry",1.2]},"vaporeon":{"cry":["animation.vaporeon.cry",1.2]},"jolteon":{"cry":["animation.jolteon.cry",1.2]},"flareon":{"cry":["animation.flareon.cry",1.2]},"porygon":{"cry":["animation.porygon.battle_cry",3,0,1],"recoil":["animation.porygon.recoil",1],"physical":["animation.porygon.physical",3],"special":["animation.porygon.special",3],"status":["animation.porygon.status",3],"faint":["animation.porygon.faint",3]},"omanyte":{"cry":["animation.omanyte.cry",2]},"omastar":{"cry":["animation.omastar.cry",2.5]},"kabuto":{"cry":["animation.kabuto.cry",1.2]},"kabutops":{"cry":["animation.kabutops.cry",1.5]},"aerodactyl":{"cry":["animation.aerodactyl.battle_cry",2.75],"recoil":["animation.aerodactyl.recoil",1.75]},"snorlax":{"cry":["animation.snorlax.cry",2.92],"recoil":["animation.snorlax.recoil",2.13]},"dratini":{"cry":["animation.dratini.cry",1.25]},"dragonair":{"cry":["animation.dragonair.cry",2.63]},"dragonite":{"cry":["animation.dragonite.cry",2.5]},"chikorita":{"cry":["animation.chikorita.cry",1.13]},"bayleef":{"cry":["animation.bayleef.cry",1]},"meganium":{"cry":["animation.meganium.cry",1.25]},"cyndaquil":{"cry":["animation.cyndaquil.battle_cry",2]},"quilava":{"cry":["animation.quilava.battle_cry",1.17]},"typhlosion":{"cry":["animation.typhlosion.battle_cry",2.21]},"typhlosion_hisuian":{"cry":["animation.typhlosion_hisuian.battle_cry",2.21]},"totodile":{"cry":["animation.totodile.cry",1.5],"faint":["animation.totodile.faint",3]},"croconaw":{"cry":["animation.croconaw.cry",2],"faint":["animation.croconaw.faint",3]},"feraligatr":{"cry":["animation.feraligatr.cry",2],"faint":["animation.feraligatr.faint",3]},"sentret":{"cry":["animation.sentret.cry",1.5]},"furret":{"cry":["animation.furret.cry",1.5]},"hoothoot":{"cry":["animation.hoothoot.cry",0.67]},"noctowl":{"cry":["animation.noctowl.battle_cry",1.42],"recoil":["animation.noctowl.recoil",1]},"ledyba":{"cry":["animation.ledyba.cry",0.46]},"ledian":{"cry":["animation.ledian.cry",0.5]},"spinarak":{"cry":["animation.spinarak.cry",1],"recoil":["animation.spinarak.recoil",1.5],"sleep":["animation.spinarak.battle_sleep",1,1]},"ariados":{"cry":["animation.ariados.cry",1],"recoil":["animation.ariados.recoil",1.5],"sleep":["animation.ariados.battle_sleep",1,1]},"crobat":{"cry":["animation.crobat.cry",2]},"chinchou":{"faint":["animation.chinchou.water_faint",3]},"lanturn":{"faint":["animation.lanturn.water_faint",3]},"pichu":{"faint":["animation.pichu.faint",3],"cry":["animation.pichu.cry",1.5],"recoil":["animation.pichu.recoil",0.88],"physical":["animation.pichu.physical",3],"special":["animation.pichu.special",3],"status":["animation.pichu.status",3,1]},"pichu_cap":{"special":["animation.pichu_cap.special",3],"physical":["animation.pichu_cap.physical",3],"recoil":["animation.pichu_cap.recoil",0.88],"status":["animation.pichu_cap.status",3],"cry":["animation.pichu_cap.battle_cry",3],"faint":["animation.pichu_cap.faint",3]},"pichu_ukulele":{"special":["animation.pichu_ukulele.special",3],"physical":["animation.pichu_ukulele.physical",3],"recoil":["animation.pichu_ukulele.recoil",0.88],"status":["animation.pichu_ukulele.status",3],"cry":["animation.pichu_ukulele.battle_cry",3],"faint":["animation.pichu_ukulele.faint",3]},"cleffa":{"faint":["animation.cleffa.faint",2.2],"cry":["animation.cleffa.cry",1]},"igglybuff":{"cry":["animation.igglybuff.cry",1]},"togepi":{"cry":["animation.togepi.cry",1]},"togetic":{"faint":["animation.togetic.faint",3],"cry":["animation.togetic.battle_cry",3,0,1],"recoil":["animation.togetic.recoil",1.13],"physical":["animation.togetic.physical",3],"special":["animation.togetic.special",3],"status":["animation.togetic.status",3]},"mareep":{"cry":["animation.mareep.cry",0.67]},"flaaffy":{"cry":["animation.flaaffy.cry",0.75]},"ampharos":{"cry":["animation.ampharos.cry",2],"faint":["animation.ampharos.faint",3]},"bellossom":{"cry":["animation.bellossom.cry",1],"recoil":["animation.bellossom.recoil",0.42]},"sudowoodo":{"cry":["animation.sudowoodo.cry",2],"recoil":["animation.sudowoodo.recoil",2]},"politoed":{"cry":["animation.politoed.cry",1.25]},"hoppip":{"cry":["animation.hoppip.cry",1]},"skiploom":{"cry":["animation.skiploom.cry",1]},"jumpluff":{"cry":["animation.jumpluff.cry",1]},"aipom":{"cry":["animation.aipom.cry",1]},"sunkern":{"cry":["animation.sunkern.cry",1.04]},"sunflora":{"cry":["animation.sunflora.cry",1]},"yanma":{"cry":["animation.yanma.cry",1.33]},"wooper":{"cry":["animation.wooper.cry",1.58],"faint":["animation.wooper.faint",3]},"wooper_paldean":{"cry":["animation.wooper_paldean.cry",1.58],"faint":["animation.wooper_paldean.faint",3]},"quagsire":{"cry":["animation.quagsire.cry",1.5]},"espeon":{"cry":["animation.espeon.cry",1.2]},"umbreon":{"cry":["animation.umbreon.cry",1.2]},"murkrow":{"cry":["animation.murkrow.cry",2]},"slowking":{"cry":["animation.slowking.cry",1.75]},"slowking_galarian":{"cry":["animation.slowking_galarian.cry",1.75]},"misdreavus":{"cry":["animation.misdreavus.cry",1.2]},"unown":{"cry":["animation.unown.cry",1.25]},"wobbuffet":{"faint":["animation.wobbuffet.faint",3],"cry":["animation.wobbuffet.battle_cry",3,0,1],"recoil":["animation.wobbuffet.recoil",1.5],"physical":["animation.wobbuffet.physical",3],"special":["animation.wobbuffet.special",3],"status":["animation.wobbuffet.status",3]},"girafarig":{"cry":["animation.girafarig.cry",1.5],"recoil":["animation.girafarig.recoil",2]},"pineco":{"faint":["animation.pineco.faint",2.63]},"forretress":{"faint":["animation.forretress.faint",2.55]},"dunsparce":{"cry":["animation.dunsparce.battle_cry",3,0,1],"recoil":["animation.dunsparce.recoil",1.5],"physical":["animation.dunsparce.physical",3],"special":["animation.dunsparce.special",3],"status":["animation.dunsparce.status",3]},"gligar":{"cry":["animation.gligar.cry",1.33]},"steelix":{"cry":["animation.steelix.cry",2.5]},"snubbull":{"cry":["animation.snubbull.cry",1]},"granbull":{"cry":["animation.granbull.cry",1.25]},"qwilfish":{"cry":["animation.qwilfish.cry",1.33]},"qwilfish_hisuian":{"cry":["animation.qwilfish_hisuian.cry",1.33]},"scizor":{"cry":["animation.scizor.cry",1.83]},"shuckle":{"cry":["animation.shuckle.cry",1.25],"faint":["animation.shuckle.faint",3]},"sneasel":{"cry":["animation.sneasel.cry",0.75],"recoil":["animation.sneasel.recoil",1.25]},"sneasel_hisuian":{"recoil":["animation.sneasel_hisuian.recoil",1.25],"cry":["animation.sneasel_hisuian.cry",0.75]},"teddiursa":{"cry":["animation.teddiursa.cry",1.25],"recoil":["animation.teddiursa.recoil",0.75],"special":["animation.teddiursa.special",1,1],"physical":["animation.teddiursa.physical",3],"status":["animation.teddiursa.status",1,1]},"ursaring":{"cry":["animation.ursaring.cry",1.5],"recoil":["animation.ursaring.recoil",1]},"slugma":{"cry":["animation.slugma.cry",1.5]},"slugma_shiny":{"cry":["animation.slugma_shiny.cry",1.5]},"magcargo":{"cry":["animation.magcargo.cry",1.5]},"magcargo_shiny":{"cry":["animation.magcargo_shiny.cry",1.5]},"swinub":{"faint":["animation.swinub.faint",3],"cry":["animation.swinub.battle_cry",3],"recoil":["animation.swinub.recoil",1.5],"physical":["animation.swinub.physical",3],"special":["animation.swinub.special",3],"status":["animation.swinub.status",3]},"piloswine":{"faint":["animation.piloswine.faint",3],"cry":["animation.piloswine.battle_cry",3],"recoil":["animation.piloswine.recoil",1.5],"physical":["animation.piloswine.physical",3],"special":["animation.piloswine.special",3],"status":["animation.piloswine.status",3]},"corsola":{"cry":["animation.corsola.cry",0.79],"physical":["animation.corsola.physical",3],"recoil":["animation.corsola.recoil",1]},"corsola_galarian":{"cry":["animation.corsola_galarian.battle_cry",1.5],"faint":["animation.corsola_galarian.faint",3]},"remoraid":{"cry":["animation.remoraid.cry",1.2]},"octillery":{"cry":["animation.octillery.cry",1.2]},"mantine":{"cry":["animation.mantine.cry",1.25],"recoil":["animation.mantine.recoil",1,1]},"skarmory":{"faint":["animation.skarmory.faint",3],"cry":["animation.skarmory.battle_cry",3,0,1],"recoil":["animation.skarmory.recoil",1.5],"physical":["animation.skarmory.physical",3],"special":["animation.skarmory.special",3.08],"status":["animation.skarmory.status",3]},"houndour":{"cry":["animation.houndour.cry",1]},"houndoom":{"cry":["animation.houndoom.cry",1.5]},"kingdra":{"cry":["animation.kingdra.cry",1.2]},"phanpy":{"cry":["animation.phanpy.cry",3.42],"faint":["animation.phanpy.faint",3]},"donphan":{"cry":["animation.donphan.cry",3.58]},"porygon2":{"faint":["animation.porygon2.faint",3],"recoil":["animation.porygon2.recoil",1],"cry":["animation.porygon2.battle_cry",3,0,1],"physical":["animation.porygon2.physical",3.25],"special":["animation.porygon2.special",3],"status":["animation.porygon2.status",3]},"stantler":{"cry":["animation.stantler.cry",1.67]},"smeargle":{"faint":["animation.smeargle.faint",3],"cry":["animation.smeargle.battle_cry",3,0,1],"recoil":["animation.smeargle.recoil",1.13],"physical":["animation.smeargle.physical",3],"special":["animation.smeargle.special",3],"status":["animation.smeargle.status",3]},"tyrogue":{"faint":["animation.tyrogue.faint",2.01],"cry":["animation.tyrogue.cry",2],"physical":["animation.tyrogue.physical",3]},"hitmontop":{"cry":["animation.hitmontop.cry",2],"faint":["animation.hitmontop.faint",3]},"elekid":{"cry":["animation.elekid.cry",1.5]},"magby":{"faint":["animation.magby.faint",3],"recoil":["animation.magby.recoil",1],"physical":["animation.magby.physical",3],"special":["animation.magby.special",3],"status":["animation.magby.status",3],"cry":["animation.magby.battle_cry",3,0,1]},"miltank":{"cry":["animation.miltank.cry",2.25]},"blissey":{"faint":["animation.blissey.faint",3],"cry":["animation.blissey.battle_cry",3,0,1],"recoil":["animation.blissey.recoil",1.5],"physical":["animation.blissey.physical",3],"special":["animation.blissey.special",3],"status":["animation.blissey.status",3]},"larvitar":{"cry":["animation.larvitar.cry",1.2]},"pupitar":{"cry":["animation.pupitar.cry",1.2]},"tyranitar":{"cry":["animation.tyranitar.cry",1.2]},"treecko":{"faint":["animation.treecko.faint",3],"cry":["animation.treecko.battle_cry",3,0,1],"recoil":["animation.treecko.recoil",1],"physical":["animation.treecko.physical",3],"special":["animation.treecko.special",3],"status":["animation.treecko.status",3]},"grovyle":{"cry":["animation.grovyle.cry",1.25]},"sceptile":{"cry":["animation.sceptile.cry",1.25]},"torchic":{"recoil":["animation.torchic.recoil",1.5],"cry":["animation.torchic.battle_cry",3,0,1],"physical":["animation.torchic.physical",3],"special":["animation.torchic.special",3],"status":["animation.torchic.status",3]},"combusken":{"cry":["animation.combusken.cry",1.5]},"blaziken":{"cry":["animation.blaziken.battle_cry",3,0,1],"recoil":["animation.blaziken.recoil",1.5],"physical":["animation.blaziken.physical",3],"special":["animation.blaziken.special",3],"status":["animation.blaziken.status",3]},"mudkip":{"cry":["animation.mudkip.cry",1.75]},"marshtomp":{"cry":["animation.marshtomp.cry",2]},"swampert":{"cry":["animation.swampert.cry",2.5]},"poochyena":{"cry":["animation.poochyena.cry",0.83]},"mightyena":{"cry":["animation.mightyena.cry",1.67]},"zigzagoon":{"cry":["animation.zigzagoon.cry",1.25],"faint":["animation.zigzagoon.faint",2.38]},"zigzagoon_galarian":{"cry":["animation.zigzagoon_galarian.cry",1.25]},"linoone":{"cry":["animation.linoone.cry",1.5],"faint":["animation.linoone.faint",3]},"linoone_galarian":{"cry":["animation.linoone_galarian.cry",1.25]},"wurmple":{"cry":["animation.wurmple.cry",1.25]},"silcoon":{"cry":["animation.silcoon.cry",1.25]},"beautifly":{"cry":["animation.beautifly.cry",1.25]},"cascoon":{"cry":["animation.cascoon.cry",1.25]},"dustox":{"cry":["animation.dustox.cry",1]},"lotad":{"cry":["animation.lotad.cry",1.5],"faint":["animation.lotad.faint",2.55]},"lombre":{"cry":["animation.lombre.cry",1.5],"faint":["animation.lombre.faint",3]},"ludicolo":{"faint":["animation.ludicolo.faint",3]},"seedot":{"cry":["animation.seedot.cry",1.5]},"taillow":{"cry":["animation.taillow.cry",1.5]},"swellow":{"cry":["animation.swellow.cry",1.5]},"wingull":{"cry":["animation.wingull.cry",1.5]},"pelipper":{"cry":["animation.pelipper.cry",1.5]},"ralts":{"cry":["animation.ralts.cry",2]},"kirlia":{"cry":["animation.kirlia.cry",2]},"gardevoir":{"cry":["animation.gardevoir.cry",2]},"surskit":{"cry":["animation.surskit.cry",1.25]},"masquerain":{"cry":["animation.masquerain.cry",1.54]},"shroomish":{"faint":["animation.shroomish.faint",3]},"breloom":{"cry":["animation.breloom.cry",1.46],"faint":["animation.breloom.faint",2.55]},"slakoth":{"cry":["animation.slakoth.battle_cry",3,0,1],"physical":["animation.slakoth.physical",3],"status":["animation.slakoth.status",3]},"vigoroth":{"cry":["animation.vigoroth.cry",1.25]},"slaking":{"cry":["animation.slaking.battle_cry",3,0,1],"recoil":["animation.slaking.recoil",2],"physical":["animation.slaking.physical",3],"special":["animation.slaking.special",3],"status":["animation.slaking.status",3],"truant":["animation.slaking.truant",3]},"nincada":{"faint":["animation.nincada.faint",3],"cry":["animation.nincada.battle_cry",3,0,1],"recoil":["animation.nincada.recoil",1.5],"physical":["animation.nincada.physical",3],"special":["animation.nincada.special",3],"status":["animation.nincada.status",3]},"ninjask":{"faint":["animation.ninjask.faint",3],"cry":["animation.ninjask.battle_cry",3,0,1],"recoil":["animation.ninjask.recoil",0.67],"physical":["animation.ninjask.physical",3],"special":["animation.ninjask.special",3],"status":["animation.ninjask.status",3]},"shedinja":{"faint":["animation.shedinja.faint",3],"cry":["animation.shedinja.battle_cry",3,0,1],"recoil":["animation.shedinja.recoil",1.08],"physical":["animation.shedinja.physical",3],"special":["animation.shedinja.special",3],"status":["animation.shedinja.status",3]},"nosepass":{"faint":["animation.nosepass.faint",3],"cry":["animation.nosepass.battle_cry",3,0,1],"recoil":["animation.nosepass.recoil",0.63],"physical":["animation.nosepass.physical",3],"special":["animation.nosepass.special",3],"status":["animation.nosepass.status",3]},"skitty":{"faint":["animation.skitty.faint",3],"cry":["animation.skitty.battle_cry",3,0,1],"recoil":["animation.skitty.recoil",1],"physical":["animation.skitty.physical",3],"special":["animation.skitty.special",3],"status":["animation.skitty.status",3]},"mawile":{"cry":["animation.mawile.cry",1.5]},"electrike":{"cry":["animation.electrike.cry",1.5]},"manectric":{"cry":["animation.manectric.cry",1.5]},"plusle":{"faint":["animation.plusle.faint",3],"cry":["animation.plusle.cry",2],"recoil":["animation.plusle.recoil",2],"special":["animation.plusle.special",3],"status":["animation.plusle.status",3]},"minun":{"faint":["animation.minun.faint",3],"cry":["animation.minun.cry",2],"recoil":["animation.minun.recoil",2],"special":["animation.minun.special",3],"status":["animation.minun.status",3]},"volbeat":{"cry":["animation.volbeat.cry",1]},"illumise":{"cry":["animation.illumise.cry",1]},"roselia":{"cry":["animation.roselia.cry",1.25]},"wailmer":{"faint":["animation.wailmer.faint",3],"cry":["animation.wailmer.cry",2.48]},"wailord":{"faint":["animation.wailord.faint",3],"cry":["animation.wailord.cry",2.83]},"numel":{"cry":["animation.numel.cry",2]},"camerupt":{"cry":["animation.camerupt.cry",1.5]},"torkoal":{"faint":["animation.torkoal.faint",3],"cry":["animation.torkoal.cry",1.5]},"spinda":{"faint":["animation.spinda.faint",3],"cry":["animation.spinda.battle_cry",3,0,1],"recoil":["animation.spinda.recoil",1.5],"physical":["animation.spinda.physical",3],"special":["animation.spinda.special",3],"status":["animation.spinda.status",3]},"trapinch":{"cry":["animation.trapinch.cry",1.2]},"vibrava":{"cry":["animation.vibrava.cry",1.2]},"flygon":{"cry":["animation.flygon.cry",3]},"cacnea":{"faint":["animation.cacnea.faint",3],"cry":["animation.cacnea.cry",2],"recoil":["animation.cacnea.recoil",1.25],"physical":["animation.cacnea.physical",3],"special":["animation.cacnea.special",3],"status":["animation.cacnea.status",3]},"cacturne":{"cry":["animation.cacturne.cry",2],"recoil":["animation.cacturne.recoil",1.25]},"swablu":{"cry":["animation.swablu.cry",1.5]},"altaria":{"cry":["animation.altaria.cry",2.25]},"zangoose":{"cry":["animation.zangoose.cry",1.5]},"seviper":{"cry":["animation.seviper.cry",1.5]},"lunatone":{"cry":["animation.lunatone.battle_cry",3,0,1],"recoil":["animation.lunatone.recoil",1.75],"physical":["animation.lunatone.physical",3],"special":["animation.lunatone.special",3],"status":["animation.lunatone.status",3]},"solrock":{"cry":["animation.solrock.battle_cry",3,0,1],"recoil":["animation.solrock.recoil",1.75],"physical":["animation.solrock.physical",3],"special":["animation.solrock.special",3],"status":["animation.solrock.status",3]},"whiscash":{"cry":["animation.whiscash.cry",1.5]},"corphish":{"cry":["animation.corphish.cry",1.2]},"crawdaunt":{"cry":["animation.crawdaunt.cry",1.2]},"baltoy":{"faint":["animation.baltoy.faint",3],"cry":["animation.baltoy.cry",1.25]},"claydol":{"faint":["animation.claydol.faint",3],"cry":["animation.claydol.cry",1.75]},"cradily":{"cry":["animation.cradily.cry",2.38]},"anorith":{"cry":["animation.anorith.cry",1]},"armaldo":{"cry":["animation.armaldo.cry",1.75]},"feebas":{"cry":["animation.feebas.cry",1],"recoil":["animation.feebas.recoil",0.5]},"milotic":{"cry":["animation.milotic.cry",2.75],"recoil":["animation.milotic.recoil",0.92]},"kecleon":{"cry":["animation.kecleon.cry",1]},"shuppet":{"cry":["animation.shuppet.cry",1.5]},"banette":{"cry":["animation.banette.cry",1.5]},"duskull":{"cry":["animation.duskull.cry",1.2],"faint":["animation.duskull.faint",2.47]},"dusclops":{"cry":["animation.dusclops.cry",1.2],"faint":["animation.dusclops.faint",3]},"tropius":{"faint":["animation.tropius.faint",3],"cry":["animation.tropius.cry",2.58],"recoil":["animation.tropius.recoil",1.5]},"chimecho":{"faint":["animation.chimecho.faint",3],"cry":["animation.chimecho.cry",1.5]},"absol":{"cry":["animation.absol.cry",1]},"wynaut":{"cry":["animation.wynaut.cry",1.2]},"snorunt":{"cry":["animation.snorunt.cry",1]},"glalie":{"cry":["animation.glalie.cry",1]},"spheal":{"cry":["animation.spheal.cry",1.2]},"sealeo":{"cry":["animation.sealeo.cry",1.2]},"walrein":{"cry":["animation.walrein.cry",2.67]},"relicanth":{"cry":["animation.relicanth.cry",1.25]},"luvdisc":{"faint":["animation.luvdisc.ground_faint",2.55]},"bagon":{"cry":["animation.bagon.cry",1.25]},"shelgon":{"cry":["animation.shelgon.cry",1.5]},"salamence":{"cry":["animation.salamence.cry",2.5]},"beldum":{"cry":["animation.beldum.battle_cry",3,0,1],"recoil":["animation.beldum.recoil",1.75],"physical":["animation.beldum.physical",3],"special":["animation.beldum.special",3],"status":["animation.beldum.status",3]},"metang":{"cry":["animation.metang.battle_cry",3,0,1],"recoil":["animation.metang.recoil",2],"physical":["animation.metang.physical",3],"special":["animation.metang.special",3],"status":["animation.metang.status",3]},"metagross":{"cry":["animation.metagross.battle_cry",3,0,1],"recoil":["animation.metagross.recoil",3],"physical":["animation.metagross.physical",3],"special":["animation.metagross.special",3],"status":["animation.metagross.status",3],"air_physical":["animation.metagross.air_physical",3],"air_special":["animation.metagross.air_special",3],"air_status":["animation.metagross.air_status",3.04]},"turtwig":{"cry":["animation.turtwig.cry",1.17],"faint":["animation.turtwig.faint",3.08]},"grotle":{"cry":["animation.grotle.cry",1.5],"faint":["animation.grotle.faint",3]},"torterra":{"cry":["animation.torterra.cry",2.13],"faint":["animation.torterra.faint",3]},"torterra_cherry":{"cry":["animation.torterra_cherry.cry",1.92],"faint":["animation.torterra_cherry.faint",3]},"chimchar":{"cry":["animation.chimchar.cry",1.75],"faint":["animation.chimchar.faint",3]},"monferno":{"cry":["animation.monferno.cry",1.5],"faint":["animation.monferno.faint",3]},"infernape":{"cry":["animation.infernape.cry",2],"faint":["animation.infernape.faint",3]},"piplup":{"cry":["animation.piplup.cry",1.5]},"prinplup":{"cry":["animation.prinplup.cry",1.5],"recoil":["animation.prinplup.recoil",1,1]},"empoleon":{"recoil":["animation.empoleon.recoil",1,1]},"starly":{"cry":["animation.starly.cry",1.5]},"staravia":{"cry":["animation.staravia.cry",1.5]},"staraptor":{"cry":["animation.staraptor.cry",4],"recoil":["animation.staraptor.recoil",3]},"bidoof":{"faint":["animation.bidoof.faint",3],"cry":["animation.bidoof.cry",1.25]},"bibarel":{"cry":["animation.bibarel.cry",1.33]},"kricketot":{"cry":["animation.kricketot.cry",1.5],"faint":["animation.kricketot.faint",3]},"kricketune":{"cry":["animation.kricketune.cry",2.08],"faint":["animation.kricketune.faint",3]},"budew":{"cry":["animation.budew.cry",1.5],"faint":["animation.budew.faint",3]},"roserade":{"cry":["animation.roserade.battle_cry",1.75]},"cranidos":{"faint":["animation.cranidos.faint",3],"cry":["animation.cranidos.cry",2]},"rampardos":{"faint":["animation.rampardos.faint",3],"cry":["animation.rampardos.cry",2.75]},"shieldon":{"cry":["animation.shieldon.cry",1.5],"faint":["animation.shieldon.faint",3]},"bastiodon":{"faint":["animation.bastiodon.faint",3],"cry":["animation.bastiodon.cry",3]},"combee":{"cry":["animation.combee.cry",1.5],"faint":["animation.combee.faint",3]},"vespiquen":{"cry":["animation.vespiquen.cry",1.25],"faint":["animation.vespiquen.faint",3]},"buizel":{"cry":["animation.buizel.cry",1.33]},"floatzel":{"cry":["animation.floatzel.cry",1.33]},"cherubi":{"cry":["animation.cherubi.cry",1.5]},"cherrim":{"cry":["animation.cherrim_sunshine.cry",1.5]},"cherrim_overcast":{"cry":["animation.cherrim_overcast.cry",1.5]},"cherrim_sunshine":{"cry":["animation.cherrim_sunshine.cry",1.5]},"shellos":{"cry":["animation.shellos.cry",1.5],"faint":["animation.shellos.faint",3],"recoil":["animation.shellos.recoil",1.38]},"shellos_east":{"recoil":["animation.shellos_east.recoil",1,1]},"shellos_west":{"recoil":["animation.shellos_west.recoil",1,1]},"gastrodon_east":{"special":["animation.gastrodon_east.special",3],"physical":["animation.gastrodon_east.physical",3],"recoil":["animation.gastrodon_east.recoil",1.08],"status":["animation.gastrodon_east.status",3],"cry":["animation.gastrodon_east.battle_cry",3],"faint":["animation.gastrodon_east.faint",3]},"gastrodon_west":{"special":["animation.gastrodon_west.special",3],"physical":["animation.gastrodon_west.physical",3],"recoil":["animation.gastrodon_west.recoil",1.08],"status":["animation.gastrodon_west.status",3],"cry":["animation.gastrodon_west.battle_cry",3],"faint":["animation.gastrodon_west.faint",3]},"ambipom":{"cry":["animation.ambipom.cry",1]},"drifloon":{"cry":["animation.drifloon.cry",1.67],"faint":["animation.drifloon.faint",3]},"drifblim":{"faint":["animation.drifblim.faint",3],"cry":["animation.drifblim.cry",1.54]},"buneary":{"cry":["animation.buneary.cry",1.54]},"lopunny":{"cry":["animation.lopunny.cry",1.96]},"mismagius":{"cry":["animation.mismagius.cry",1.2]},"glameow":{"cry":["animation.glameow.cry",1.25]},"purugly":{"cry":["animation.purugly.cry",1.25]},"chingling":{"cry":["animation.chingling.cry",1.67]},"bronzor":{"cry":["animation.bronzor.cry",1]},"bronzong":{"faint":["animation.bronzong.faint",3],"cry":["animation.bronzong.battle_cry",4.5,0,1],"recoil":["animation.bronzong.recoil",2],"physical":["animation.bronzong.physical",4],"status":["animation.bronzong.status",4.5]},"happiny":{"faint":["animation.happiny.faint",3],"cry":["animation.happiny.battle_cry",3,0,1],"recoil":["animation.happiny.recoil",1.75],"physical":["animation.happiny.physical",3],"special":["animation.happiny.special",3],"status":["animation.happiny.status",3]},"spiritomb":{"cry":["animation.spiritomb.cry",1.5]},"gible":{"cry":["animation.gible.cry",1.5]},"gabite":{"cry":["animation.gabite.cry",1.5]},"garchomp":{"cry":["animation.garchomp.cry",2.5],"recoil":["animation.garchomp.recoil",1.5],"special":["animation.garchomp.special",3],"status":["animation.garchomp.status",3],"physical":["animation.garchomp.physical",3]},"munchlax":{"cry":["animation.munchlax.cry",2.38],"recoil":["animation.munchlax.recoil",2.71]},"riolu":{"cry":["animation.riolu.cry",1]},"lucario":{"cry":["animation.lucario.cry",1.5]},"hippopotas":{"cry":["animation.hippopotas.cry",3]},"hippowdon":{"cry":["animation.hippowdon.battle_cry",3.5]},"skorupi":{"cry":["animation.skorupi.cry",1.25]},"drapion":{"cry":["animation.drapion.cry",1.25]},"croagunk":{"recoil":["animation.croagunk.recoil",0.58],"faint":["animation.croagunk.faint",3],"physical":["animation.croagunk.physical",3],"special":["animation.croagunk.special",3],"status":["animation.croagunk.status",3],"cry":["animation.croagunk.battle_cry",3,0,1]},"toxicroak":{"recoil":["animation.toxicroak.recoil",1],"faint":["animation.toxicroak.faint",3],"physical":["animation.toxicroak.physical",3],"special":["animation.toxicroak.special",3],"status":["animation.toxicroak.status",3],"cry":["animation.toxicroak.battle_cry",3,0,1]},"carnivine":{"cry":["animation.carnivine.cry",2]},"finneon":{"cry":["animation.finneon.cry",1.5],"faint":["animation.finneon.ground_faint",3]},"lumineon":{"cry":["animation.lumineon.cry",2.5]},"mantyke":{"cry":["animation.mantyke.cry",0.75],"recoil":["animation.mantyke.recoil",1,1]},"weavile":{"cry":["animation.weavile.cry",1],"recoil":["animation.weavile.recoil",1.25]},"magnezone":{"faint":["animation.magnezone.faint",2.38],"cry":["animation.magnezone.cry",1.2]},"lickilicky":{"cry":["animation.lickilicky.cry",1.5]},"rhyperior":{"cry":["animation.rhyperior.battle_cry",3,0,1],"recoil":["animation.rhyperior.recoil",2.5],"physical":["animation.rhyperior.physical",3],"special":["animation.rhyperior.special",3],"status":["animation.rhyperior.status",3]},"tangrowth":{"cry":["animation.tangrowth.cry",1.33]},"electivire":{"cry":["animation.electivire.cry",1.33]},"magmortar":{"cry":["animation.magmortar.cry",1.2]},"togekiss":{"faint":["animation.togekiss.faint",3],"cry":["animation.togekiss.battle_cry",3,0,1],"recoil":["animation.togekiss.air_recoil",1.75],"special":["animation.togekiss.special",4],"status":["animation.togekiss.status",3]},"yanmega":{"cry":["animation.yanmega.cry",1.33]},"leafeon":{"cry":["animation.leafeon.cry",1.2]},"glaceon":{"cry":["animation.glaceon.cry",1.2]},"gliscor":{"cry":["animation.gliscor.cry",1.33]},"mamoswine":{"faint":["animation.mamoswine.faint",3],"cry":["animation.mamoswine.battle_cry",3],"recoil":["animation.mamoswine.recoil",1.5],"physical":["animation.mamoswine.physical",3],"special":["animation.mamoswine.special",3],"status":["animation.mamoswine.status",3]},"gallade":{"cry":["animation.gallade.battle_cry",1.5],"faint":["animation.gallade.faint",3]},"probopass":{"faint":["animation.probopass.faint",3],"cry":["animation.probopass.battle_cry",3,0,1],"recoil":["animation.probopass.recoil",0.92],"physical":["animation.probopass.physical",3],"special":["animation.probopass.special",3],"status":["animation.probopass.status",3]},"dusknoir":{"faint":["animation.dusknoir.faint",3],"cry":["animation.dusknoir.battle_cry",3.5,0,1],"recoil":["animation.dusknoir.recoil",0.92],"physical":["animation.dusknoir.physical",3],"special":["animation.dusknoir.special",3],"status":["animation.dusknoir.status",3.5]},"froslass":{"cry":["animation.froslass.cry",1]},"snivy":{"cry":["animation.snivy.cry",1.2],"recoil":["animation.snivy.recoil",1,1]},"servine":{"cry":["animation.servine.cry",1.2],"recoil":["animation.servine.recoil",1,1]},"serperior":{"cry":["animation.serperior.cry",2]},"tepig":{"cry":["animation.tepig.cry",2],"recoil":["animation.tepig.recoil",1.5]},"pignite":{"cry":["animation.pignite.cry",2.5],"recoil":["animation.pignite.recoil",1.5]},"emboar":{"cry":["animation.emboar.cry",2.5],"recoil":["animation.pignite.recoil",1.5]},"oshawott":{"cry":["animation.oshawott.cry",0.58]},"dewott":{"cry":["animation.dewott.cry",0.88]},"samurott":{"cry":["animation.samurott.cry",1.33]},"samurott_hisuian":{"cry":["animation.samurott_hisuian.cry",1.33]},"patrat":{"cry":["animation.patrat.cry",0.96]},"watchog":{"cry":["animation.watchog.cry",0.79]},"lillipup":{"cry":["animation.lillipup.cry",0.75]},"herdier":{"cry":["animation.herdier.cry",0.58]},"stoutland":{"cry":["animation.stoutland.cry",1.5]},"purrloin":{"faint":["animation.purrloin.faint",3],"recoil":["animation.purrloin.recoil",1.21],"cry":["animation.purrloin.battle_cry",3,0,1],"physical":["animation.purrloin.physical",3],"special":["animation.purrloin.special",3],"status":["animation.purrloin.status",3]},"liepard":{"faint":["animation.liepard.faint",3],"recoil":["animation.liepard.recoil",1.5],"cry":["animation.liepard.status",3,0,1],"physical":["animation.liepard.physical",3],"special":["animation.liepard.special",3],"status":["animation.liepard.status",3]},"pansage":{"cry":["animation.pansage.cry",1],"recoil":["animation.pansage.recoil",1,1]},"simisage":{"cry":["animation.simisage.cry",1],"recoil":["animation.simisage.recoil",1,1]},"pansear":{"cry":["animation.pansear.cry",1],"recoil":["animation.pansear.recoil",1,1]},"simisear":{"cry":["animation.simisear.cry",1],"recoil":["animation.simisear.recoil",0.04]},"panpour":{"cry":["animation.panpour.cry",1],"recoil":["animation.panpour.recoil",1,1]},"simipour":{"cry":["animation.simipour.cry",1],"recoil":["animation.simipour.recoil",0.04]},"munna":{"cry":["animation.munna.cry",1]},"musharna":{"cry":["animation.musharna.cry",1]},"pidove":{"cry":["animation.pidove.cry",1],"recoil":["animation.pidove.recoil",1.06]},"tranquill":{"cry":["animation.tranquill.cry",1.5],"recoil":["animation.tranquill.recoil",1.5]},"unfezant_female":{"recoil":["animation.unfezant_female.recoil",1.5],"cry":["animation.unfezant_female.cry",1.5]},"unfezant_male":{"recoil":["animation.unfezant_male.recoil",1.5],"cry":["animation.unfezant_male.cry",2.08]},"blitzle":{"cry":["animation.blitzle.cry",1.33],"recoil":["animation.blitzle.recoil",0.96]},"zebstrika":{"cry":["animation.zebstrika.battle_cry",3,0,1],"recoil":["animation.zebstrika.recoil",1.25],"physical":["animation.zebstrika.physical",3],"special":["animation.zebstrika.special",3],"status":["animation.zebstrika.status",3]},"roggenrola":{"cry":["animation.roggenrola.cry",1.58],"faint":["animation.roggenrola.faint",3]},"boldore":{"cry":["animation.boldore.cry",1.5],"faint":["animation.boldore.faint",3]},"gigalith":{"cry":["animation.gigalith.cry",3],"faint":["animation.gigalith.faint",3]},"swoobat":{"cry":["animation.swoobat.cry",1.46]},"drilbur":{"cry":["animation.drilbur.battle_cry",3,0,1],"recoil":["animation.drilbur.recoil",2],"physical":["animation.drilbur.physical",3],"special":["animation.drilbur.special",3],"status":["animation.drilbur.status",3]},"excadrill":{"cry":["animation.excadrill.battle_cry",3,0,1],"physical":["animation.excadrill.physical",3],"special":["animation.excadrill.special",3],"status":["animation.excadrill.status",3]},"audino":{"cry":["animation.audino.cry",1.5]},"timburr":{"cry":["animation.timburr.cry",1.5],"faint":["animation.timburr.faint",3]},"gurdurr":{"cry":["animation.gurdurr.battle_cry",2.5],"faint":["animation.gurdurr.faint",3]},"conkeldurr":{"cry":["animation.conkeldurr.cry",1.75]},"throh":{"cry":["animation.throh.cry",1.25]},"sawk":{"cry":["animation.sawk.cry",1.25]},"sewaddle":{"cry":["animation.sewaddle.cry",1],"recoil":["animation.sewaddle.recoil",0.75]},"swadloon":{"cry":["animation.swadloon.cry",1],"recoil":["animation.swadloon.recoil",1]},"leavanny":{"recoil":["animation.leavanny.recoil",1],"cry":["animation.leavanny.cry",1.5]},"venipede":{"cry":["animation.venipede.cry",1]},"whirlipede":{"cry":["animation.whirlipede.cry",1.5]},"scolipede":{"cry":["animation.scolipede.cry_idle",2.75],"recoil":["animation.scolipede.recoil",1]},"cottonee":{"cry":["animation.cottonee.cry",1]},"whimsicott":{"faint":["animation.whimsicott.faint",3],"cry":["animation.whimsicott.cry",1.5],"recoil":["animation.whimsicott.recoil",2.5],"special":["animation.whimsicott.special",3],"status":["animation.whimsicott.status",3]},"petilil":{"cry":["animation.petilil.cry",1.5],"faint":["animation.petilil.faint",3]},"lilligant":{"cry":["animation.lilligant.cry",1.2]},"lilligant_hisuian":{"cry":["animation.lilligant_hisuian.cry",1.2]},"basculin":{"cry":["animation.basculin.cry",1.5]},"basculin_whitestripe":{"cry":["animation.basculin_whitestripe.cry",1]},"sandile":{"faint":["animation.sandile.faint",3],"cry":["animation.sandile.battle_cry",3,0,1],"recoil":["animation.sandile.sand_recoil",1.5],"physical":["animation.sandile.physical",3],"special":["animation.sandile.special",3],"status":["animation.sandile.status",3]},"krokorok":{"faint":["animation.krokorok.battle_faint",3.5],"cry":["animation.krokorok.battle_cry",3,0,1],"recoil":["animation.krokorok.sand_recoil",1.5],"physical":["animation.krokorok.physical",3],"special":["animation.krokorok.special",3],"status":["animation.krokorok.status",3]},"krookodile":{"faint":["animation.krookodile.faint",3],"cry":["animation.krookodile.battle_cry",3,0,1],"recoil":["animation.krookodile.sand_recoil",1.5],"physical":["animation.krookodile.physical",3],"special":["animation.krookodile.special",3],"status":["animation.krookodile.status",3]},"darumaka":{"cry":["animation.darumaka.cry",1.25]},"darmanitan":{"cry":["animation.darmanitan.cry",1.5]},"darmanitan_zen":{"cry":["animation.darmanitan_zen.cry",1.5]},"maractus":{"cry":["animation.maractus.cry",1.25]},"dwebble":{"faint":["animation.dwebble.faint",3],"cry":["animation.dwebble.battle_cry",3,0,1],"recoil":["animation.dwebble.recoil",1],"physical":["animation.dwebble.physical",3],"special":["animation.dwebble.special",3],"status":["animation.dwebble.status",3]},"crustle":{"faint":["animation.crustle.faint",3],"cry":["animation.crustle.battle_cry",3,0,1],"recoil":["animation.crustle.recoil",1.17],"physical":["animation.crustle.physical",3],"special":["animation.crustle.special",3],"status":["animation.crustle.status",3]},"sigilyph":{"faint":["animation.sigilyph.faint",3],"cry":["animation.sigilyph.cry",1.2]},"yamask":{"faint":["animation.yamask.faint",3],"cry":["animation.yamask.cry",1.29]},"yamask_galarian":{"cry":["animation.yamask_galarian.cry",1.29]},"cofagrigus":{"faint":["animation.cofagrigus.faint",3],"cry":["animation.cofagrigus.cry",1.25]},"tirtouga":{"cry":["animation.tirtouga.cry",1.25]},"carracosta":{"cry":["animation.carracosta.cry",1.75]},"archen":{"cry":["animation.archen.battle_cry",2]},"archeops":{"cry":["animation.archeops.cry",2.5]},"trubbish":{"cry":["animation.trubbish.cry",1],"recoil":["animation.trubbish.recoil",1,1]},"garbodor":{"cry":["animation.garbodor.cry",1],"recoil":["animation.garbodor.recoil",1,1]},"zorua":{"cry":["animation.zorua.cry",1.2]},"zorua_hisuian":{"cry":["animation.zorua_hisuian.cry",1.2]},"zoroark":{"cry":["animation.zoroark.cry",1.04]},"zoroark_hisuian":{"cry":["animation.zoroark_hisuian.cry",1.04]},"ducklett":{"cry":["animation.ducklett.cry",1]},"swanna":{"cry":["animation.swanna.cry",1]},"jellicent":{"recoil":["animation.jellicent.recoil",0.75],"special":["animation.jellicent.special",3],"physical":["animation.jellicent.physical",3],"status":["animation.jellicent.status",3.46]},"joltik":{"cry":["animation.joltik.cry",0.83]},"galvantula":{"cry":["animation.galvantula.cry",1.75]},"ferroseed":{"cry":["animation.ferroseed.cry",1.5]},"ferrothorn":{"cry":["animation.ferrothorn.cry",1]},"klink":{"faint":["animation.klink.faint",3],"cry":["animation.klink.battle_cry",3,0,1],"physical":["animation.klink.physical",3],"special":["animation.klink.special",3],"status":["animation.klink.status",3],"recoil":["animation.klink.recoil",1.5]},"klang":{"faint":["animation.klang.faint",3],"cry":["animation.klang.battle_cry",3,0,1],"physical":["animation.klang.physical",3],"special":["animation.klang.special",3],"status":["animation.klang.status",3],"recoil":["animation.klang.recoil",1.5]},"klinklang":{"faint":["animation.klinklang.faint",3],"cry":["animation.klinklang.battle_cry",3,0,1],"recoil":["animation.klinklang.recoil",1.5],"physical":["animation.klinklang.physical",3],"special":["animation.klinklang.special",3],"status":["animation.klinklang.status",3]},"tynamo":{"cry":["animation.tynamo.cry",1.25]},"eelektrik":{"cry":["animation.eelektrik.cry",1.25]},"eelektross":{"cry":["animation.eelektross.cry",1.25]},"elgyem":{"cry":["animation.elgyem.cry",1.5],"recoil":["animation.elgyem.recoil",1.75],"faint":["animation.elgyem.faint",3]},"beheeyem":{"cry":["animation.beheeyem.cry",1.5]},"litwick":{"cry":["animation.litwick.cry",1.25]},"lampent":{"cry":["animation.lampent.cry",1.25]},"chandelure":{"cry":["animation.chandelure.cry",1.25]},"axew":{"cry":["animation.axew.cry",1],"recoil":["animation.axew.recoil",1.5],"physical":["animation.axew.physical",3],"special":["animation.axew.special",3],"status":["animation.axew.status",3]},"fraxure":{"cry":["animation.fraxure.cry",1.25]},"haxorus":{"cry":["animation.haxorus.cry",1.58]},"cubchoo":{"cry":["animation.cubchoo.cry",1.25]},"beartic":{"cry":["animation.beartic.cry",1.17]},"cryogonal":{"faint":["animation.cryogonal.faint",2.68]},"stunfisk":{"cry":["animation.stunfisk.cry",1.25]},"stunfisk_galarian":{"cry":["animation.stunfisk_galarian.cry",1.25]},"mienfoo":{"cry":["animation.mienfoo.cry",1.25]},"mienshao":{"cry":["animation.mienshao.cry",1]},"golett":{"faint":["animation.golett.faint",2.13]},"golurk":{"faint":["animation.golurk.faint",2.55],"highhorsepower":["animation.golurk.physical2",3],"stompingtantrum":["animation.golurk.physical2",3],"heavyslam":["animation.golurk.physical2",3],"earthquake":["animation.golurk.physical2",3],"bulldoze":["animation.golurk.physical2",3],"rocktomb":["animation.golurk.physical2",3],"bodyslam":["animation.golurk.physical2",3],"rockslide":["animation.golurk.physical2",3],"bodypress":["animation.golurk.physical2",3],"smackdown":["animation.golurk.physical2",3],"heatcrash":["animation.golurk.physical2",3],"hardpress":["animation.golurk.physical2",3],"physical":["animation.golurk.physical",3],"special":["animation.golurk.special",3],"status":["animation.golurk.status",3],"cry":["animation.golurk.battle_cry",3,0,1],"recoil":["animation.golurk.recoil",0.83]},"bouffalant":{"faint":["animation.bouffalant.faint",3],"cry":["animation.bouffalant.battle_cry",3,0,1],"physical":["animation.bouffalant.physical",3],"status":["animation.bouffalant.status",3]},"rufflet":{"cry":["animation.rufflet.cry",0.79],"recoil":["animation.rufflet.recoil",1]},"braviary":{"cry":["animation.braviary.cry",2],"recoil":["animation.braviary.recoil",1]},"braviary_hisuian":{"recoil":["animation.braviary_hisuian.recoil",1],"cry":["animation.braviary_hisuian.cry",2.04]},"durant":{"cry":["animation.durant.cry",1.5]},"deino":{"cry":["animation.deino.cry",1.25]},"zweilous":{"cry":["animation.zweilous.cry",1.25]},"hydreigon":{"cry":["animation.hydreigon.cry",2.75]},"larvesta":{"faint":["animation.larvesta.faint",3],"cry":["animation.larvesta.battle_cry",3,0,1],"recoil":["animation.larvesta.recoil",1.29],"physical":["animation.larvesta.physical",3],"special":["animation.larvesta.special",3],"status":["animation.larvesta.status",3]},"volcarona":{"faint":["animation.volcarona.faint",3],"cry":["animation.volcarona.battle_cry",3,0,1],"recoil":["animation.volcarona.recoil",1.25],"physical":["animation.volcarona.physical",3],"special":["animation.volcarona.special",3],"status":["animation.volcarona.status",3]},"chespin":{"cry":["animation.chespin.cry",1]},"quilladin":{"cry":["animation.quilladin.cry",1.5]},"chesnaught":{"cry":["animation.chesnaught.cry",2]},"fennekin":{"cry":["animation.fennekin.cry",0.75],"recoil":["animation.fennekin.recoil",1,1]},"braixen":{"cry":["animation.braixen.cry",1]},"delphox":{"cry":["animation.delphox.cry",1.75],"special":["animation.delphox.special",3]},"froakie":{"cry":["animation.froakie.cry",1.5],"faint":["animation.froakie.faint",3]},"frogadier":{"cry":["animation.frogadier.cry",1.42],"faint":["animation.frogadier.faint",3]},"greninja":{"cry":["animation.greninja.battle_cry",3,0,1],"faint":["animation.greninja.faint",3],"recoil":["animation.greninja.recoil",0.71],"physical":["animation.greninja.physical",3],"lick":["animation.greninja.physical_tongue",3],"gunkshot":["animation.greninja.physical_tongue",3],"bounce":["animation.greninja.physical_tongue",3],"thief":["animation.greninja.physical_tongue",3],"pound":["animation.greninja.physical_tongue",3],"punch":["animation.greninja.physical_tongue",3],"kick":["animation.greninja.physical_kick",3],"lowkick":["animation.greninja.physical_kick",3],"lowsweep":["animation.greninja.physical_kick",3],"acrobatics":["animation.greninja.physical_kick",3],"takedown":["animation.greninja.physical_kick",3],"gigaimpact":["animation.greninja.physical_kick",3],"liquidation":["animation.greninja.physical_kick",3],"cut":["animation.greninja.physical_katana",3],"aerialace":["animation.greninja.physical_katana",3],"nightslash":["animation.greninja.physical_katana",3],"falseswipe":["animation.greninja.physical_katana",3],"watershuriken_2hit":["animation.greninja.watershuriken_2hit",1.88],"watershuriken_3hit":["animation.greninja.watershuriken_3hit",2.5],"watershuriken_4hit":["animation.greninja.watershuriken_4hit",3.5],"watershuriken_5hit":["animation.greninja.watershuriken_5hit",4.67],"special":["animation.greninja.special",3],"status":["animation.greninja.status",3]},"greninja_ash":{"cry":["animation.greninja_ash.cry",1.25]},"bunnelby":{"cry":["animation.bunnelby.cry",1.25]},"diggersby":{"cry":["animation.diggersby.cry",2]},"fletchling":{"cry":["animation.fletchling.cry",1],"recoil":["animation.fletchling.recoil",0.71]},"fletchinder":{"cry":["animation.fletchinder.cry",1.5],"recoil":["animation.fletchling.recoil",0.71]},"talonflame":{"cry":["animation.talonflame.cry",1.75],"recoil":["animation.talonflame.recoil",1]},"scatterbug":{"cry":["animation.scatterbug.cry",1.13],"faint":["animation.scatterbug.faint",3.25]},"spewpa":{"cry":["animation.spewpa.cry",1],"faint":["animation.spewpa.faint",3]},"vivillon":{"cry":["animation.vivillon.cry",1]},"litleo":{"cry":["animation.litleo.cry",1.5]},"pyroar_female":{"cry":["animation.pyroar_female.cry",1.75]},"pyroar_male":{"cry":["animation.pyroar_male.cry",1.75]},"flabebe":{"cry":["animation.flabebe.cry",3],"recoil":["animation.flabebe.recoil",1.5]},"floette":{"cry":["animation.floette.cry",2.5],"recoil":["animation.floette.recoil",1.5]},"florges":{"cry":["animation.florges.cry",3],"recoil":["animation.florges.recoil",1.5]},"skiddo":{"faint":["animation.skiddo.faint",3],"cry":["animation.skiddo.battle_cry",3,0,1],"recoil":["animation.skiddo.recoil",1.5],"physical":["animation.skiddo.physical",3],"special":["animation.skiddo.special",3],"status":["animation.skiddo.status",3]},"gogoat":{"cry":["animation.gogoat.cry",2]},"pancham":{"cry":["animation.pancham.cry",1.25]},"pangoro":{"cry":["animation.pangoro.cry",1.08]},"furfrou":{"cry":["animation.furfrou.cry",0.75]},"espurr":{"cry":["animation.espurr.cry",1.25]},"meowstic_female":{"cry":["animation.meowstic_female.cry",1.25]},"meowstic_male":{"cry":["animation.meowstic_male.cry",1.25]},"honedge":{"cry":["animation.honedge.cry",1,1]},"doublade":{"cry":["animation.doublade.cry",1,1]},"aegislash":{"cry":["animation.aegislash.cry",1,1]},"spritzee":{"cry":["animation.spritzee.cry",0.88]},"aromatisse":{"cry":["animation.aromatisse.cry",1.75]},"swirlix":{"cry":["animation.swirlix.cry",1.25]},"slurpuff":{"cry":["animation.slurpuff.cry",1.25]},"inkay":{"cry":["animation.inkay.cry",1]},"malamar":{"cry":["animation.malamar.cry",1]},"binacle":{"cry":["animation.binacle.cry",1]},"barbaracle":{"cry":["animation.barbaracle.cry",1]},"skrelp":{"cry":["animation.skrelp.cry",0.88]},"dragalge":{"cry":["animation.dragalge.cry",2]},"clauncher_left":{"cry":["animation.clauncher_left.cry",1.2]},"clauncher_right":{"cry":["animation.clauncher_right.cry",1.2]},"clawitzer":{"cry":["animation.clawitzer_right.cry",1.2]},"clawitzer_left":{"cry":["animation.clawitzer_left.cry",1.2]},"clawitzer_right":{"cry":["animation.clawitzer_right.cry",1.2]},"helioptile":{"cry":["animation.helioptile.cry",1.21]},"heliolisk":{"cry":["animation.heliolisk.cry",1.25]},"tyrunt":{"cry":["animation.tyrunt.cry",2.5]},"tyrantrum":{"cry":["animation.tyrantrum.battle_cry",3,0,1],"recoil":["animation.tyrantrum.recoil",2.54],"physical":["animation.tyrantrum.physical",3],"special":["animation.tyrantrum.special",3],"status":["animation.tyrantrum.status",3]},"amaura":{"faint":["animation.amaura.faint",3],"cry":["animation.amaura.cry",3]},"aurorus":{"cry":["animation.aurorus.cry",3.5]},"sylveon":{"cry":["animation.sylveon.cry",1.2]},"hawlucha":{"cry":["animation.hawlucha.cry",1]},"dedenne":{"cry":["animation.dedenne.cry",0.95]},"carbink":{"cry":["animation.carbink.cry",1.2]},"goomy":{"faint":["animation.goomy.faint",3],"cry":["animation.goomy.battle_cry",3,0,1],"recoil":["animation.goomy.recoil",1.5],"physical":["animation.goomy.physical",3],"special":["animation.goomy.special",3],"status":["animation.goomy.status",3]},"sliggoo":{"cry":["animation.sliggoo.battle_cry",2],"recoil":["animation.sliggoo.recoil",1.17]},"sliggoo_hisuian":{"recoil":["animation.sliggoo_hisuian.recoil",1.13],"cry":["animation.sliggoo_hisuian.battle_cry",2]},"goodra":{"cry":["animation.goodra.cry",1.75],"recoil":["animation.goodra.recoil",1.25]},"goodra_hisuian":{"recoil":["animation.goodra_hisuian.recoil",1.25],"cry":["animation.goodra_hisuian.cry",1.75]},"klefki":{"cry":["animation.klefki.cry",1.2]},"phantump":{"cry":["animation.phantump.cry",2.92],"faint":["animation.phantump.faint",3]},"trevenant":{"faint":["animation.trevenant.battle_faint",3],"cry":["animation.trevenant.battle_cry",4]},"pumpkaboo":{"cry":["animation.pumpkaboo.cry",2]},"gourgeist":{"cry":["animation.gourgeist.cry",1.75]},"bergmite":{"cry":["animation.bergmite.cry",1.5],"faint":["animation.bergmite.faint",3]},"avalugg":{"cry":["animation.avalugg.cry",1.5],"faint":["animation.avalugg.faint",3]},"avalugg_hisuian":{"cry":["animation.avalugg_hisuian.cry",1.5],"faint":["animation.avalugg_hisuian.faint",3]},"noibat":{"cry":["animation.noibat.cry",1]},"noivern":{"cry":["animation.noivern.cry",1.71]},"rowlet":{"cry":["animation.rowlet.cry",2]},"dartrix":{"cry":["animation.dartrix.cry",1.33]},"decidueye":{"cry":["animation.decidueye.cry",1.33]},"litten":{"cry":["animation.litten.cry",2.5],"recoil":["animation.litten.recoil",1.5]},"torracat":{"cry":["animation.torracat.cry",2.67],"recoil":["animation.torracat.recoil",1.5]},"incineroar":{"cry":["animation.incineroar.battle_cry",3.5],"recoil":["animation.incineroar.recoil",1.5]},"brionne":{"faint":["animation.brionne.faint",3],"cry":["animation.brionne.cry",2]},"primarina":{"faint":["animation.primarina.faint",3],"cry":["animation.primarina.cry",2]},"pikipek":{"cry":["animation.pikipek.cry",1,1]},"trumbeak":{"cry":["animation.trumbeak.cry",0.5]},"yungoos":{"cry":["animation.yungoos.cry",2],"recoil":["animation.yungoos.recoil",0.75]},"gumshoos":{"cry":["animation.gumshoos.cry",2],"recoil":["animation.gumshoos.recoil",0.75]},"grubbin":{"cry":["animation.grubbin.cry",0.75],"physical":["animation.grubbin.physical",3]},"charjabug":{"cry":["animation.charjabug.cry",0.75]},"vikavolt":{"cry":["animation.vikavolt.battle_cry",3,0,1],"recoil":["animation.vikavolt.air_recoil",1.5],"physical":["animation.vikavolt.physical",3],"special":["animation.vikavolt.special",3],"status":["animation.vikavolt.status",3]},"cutiefly":{"faint":["animation.cutiefly.faint",2.68],"cry":["animation.cutiefly.cry",1.25]},"ribombee":{"faint":["animation.ribombee.faint",3],"cry":["animation.ribombee.cry",1.08]},"rockruff":{"cry":["animation.rockruff.cry",1.5]},"lycanroc_dusk":{"cry":["animation.lycanroc_dusk.cry",1.5]},"lycanroc_midday":{"cry":["animation.lycanroc_midday.cry",1.5]},"lycanroc_midnight":{"cry":["animation.lycanroc_midnight.cry",1.5]},"wishiwashi_school":{"cry":["animation.wishiwashi_school.cry",2]},"wishiwashi_solo":{"cry":["animation.wishiwashi_solo.cry",1.5]},"mareanie":{"cry":["animation.mareanie.cry",1.2]},"toxapex":{"cry":["animation.toxapex.cry",1.2],"recoil":["animation.toxapex.recoil",1,1]},"mudbray":{"cry":["animation.mudbray.cry",1.21]},"mudsdale":{"cry":["animation.mudsdale.cry",1.5]},"dewpider":{"cry":["animation.dewpider.cry",1]},"araquanid":{"cry":["animation.araquanid.cry",1]},"fomantis":{"cry":["animation.fomantis.cry",1]},"lurantis":{"cry":["animation.lurantis.cry",1.25]},"shiinotic":{"cry":["animation.shiinotic.cry",1.5]},"stufful":{"cry":["animation.stufful.cry",1.17],"faint":["animation.stufful.faint",2.68]},"bewear":{"cry":["animation.bewear.cry",1.5],"faint":["animation.bewear.faint",2.63]},"comfey":{"cry":["animation.comfey.cry",1.42]},"wimpod":{"cry":["animation.wimpod.cry",1.5],"faint":["animation.wimpod.faint",3]},"golisopod":{"cry":["animation.golisopod.cry",2],"faint":["animation.golisopod.faint",3]},"palossand":{"recoil":["animation.palossand.recoil",1,1]},"togedemaru":{"cry":["animation.togedemaru.cry",0.79]},"mimikyu":{"cry":["animation.mimikyu.cry",1],"recoil":["animation.mimikyu.recoil",2],"physical":["animation.mimikyu.physical",3]},"bruxish":{"recoil":["animation.bruxish.recoil",1,1],"cry":["animation.bruxish.cry",1.2]},"drampa":{"cry":["animation.drampa.cry",4],"recoil":["animation.drampa.recoil",1.5],"yawn":["animation.drampa.yawn_quirk",6]},"dhelmise":{"faint":["animation.dhelmise.faint",3]},"grookey":{"cry":["animation.grookey.cry",2]},"thwackey":{"cry":["animation.thwackey.cry",1.08]},"rillaboom":{"cry":["animation.rillaboom.cry",1.5]},"scorbunny":{"cry":["animation.scorbunny.cry",2]},"cinderace":{"cry":["animation.cinderace.battle_cry",3,0,1],"recoil":["animation.cinderace.recoil",0.38],"pyroball":["animation.cinderace.pyroball",3.75],"physical":["animation.cinderace.physical",3],"special":["animation.cinderace.special",3],"status":["animation.cinderace.status",3],"faint":["animation.cinderace.faint",3]},"sobble":{"cry":["animation.sobble.cry",1.75]},"drizzile":{"cry":["animation.drizzile.cry",1.75]},"inteleon":{"cry":["animation.inteleon.cry",2]},"greedent":{"recoil":["animation.greedent.recoil",1.5]},"rookidee":{"cry":["animation.rookidee.battle_cry",2.5,0,1],"recoil":["animation.rookidee.recoil",1.5],"physical":["animation.rookidee.physical",3],"special":["animation.rookidee.special",3],"status":["animation.rookidee.status",2.5]},"corvisquire":{"cry":["animation.corvisquire.cry",2.5],"recoil":["animation.corvisquire.recoil",1.5]},"corviknight":{"cry":["animation.corviknight.cry",2.17]},"nickit":{"cry":["animation.nickit.cry",1.08],"faint":["animation.nickit.faint",3.13]},"thievul":{"cry":["animation.thievul.cry",1.5]},"gossifleur":{"cry":["animation.gossifleur.cry",1.5],"recoil":["animation.gossifleur.recoil",1.17]},"eldegoss":{"cry":["animation.eldegoss.cry",2],"recoil":["animation.eldegoss.recoil",1.17]},"wooloo":{"cry":["animation.wooloo.cry",1.38]},"dubwool":{"cry":["animation.dubwool.cry",1.21],"faint":["animation.dubwool.faint",3]},"chewtle":{"cry":["animation.chewtle.cry",1.25]},"drednaw":{"cry":["animation.drednaw.cry",1.25]},"yamper":{"cry":["animation.yamper.cry",1.25],"faint":["animation.yamper.faint",3]},"boltund":{"cry":["animation.boltund.cry",1.25],"faint":["animation.boltund.faint",3]},"applin":{"cry":["animation.applin.cry",1.2]},"flapple":{"cry":["animation.flapple.cry",1]},"appletun":{"cry":["animation.appletun.cry",3]},"silicobra":{"cry":["animation.silicobra.cry",1]},"sandaconda":{"cry":["animation.sandaconda.cry",1]},"arrokuda":{"cry":["animation.arrokuda.cry",1.5]},"barraskewda":{"cry":["animation.barraskewda.cry",2.08]},"sizzlipede":{"cry":["animation.sizzlipede.cry",2]},"centiskorch":{"cry":["animation.centiskorch.cry",2.5]},"sinistea":{"cry":["animation.sinistea.cry",1.25]},"polteageist":{"cry":["animation.polteageist.cry",1.25]},"hatenna":{"cry":["animation.hatenna.cry",1.2]},"hattrem":{"cry":["animation.hattrem.cry",1.2]},"hatterene":{"cry":["animation.hatterene.cry",1.2]},"impidimp":{"cry":["animation.impidimp.cry",1.2]},"morgrem":{"cry":["animation.morgrem.cry",1.2]},"grimmsnarl":{"cry":["animation.grimmsnarl.cry",1.2]},"obstagoon":{"cry":["animation.obstagoon.cry",2]},"cursola":{"faint":["animation.cursola.faint",3],"cry":["animation.cursola.cry",4],"recoil":["animation.cursola.recoil",1.25],"special":["animation.cursola.special",3]},"sirfetchd":{"cry":["animation.sirfetchd.cry",0.75]},"runerigus":{"cry":["animation.runerigus.cry",1.25]},"milcery":{"faint":["animation.milcery.faint",2.42]},"alcremie":{"faint":["animation.alcremie.faint",3]},"falinks":{"physical":["animation.falinks.physical",1.46],"faint":["animation.falinks.faint",2.22],"cry":["animation.falinks.cry",1]},"pincurchin":{"cry":["animation.pincurchin.cry",1.2]},"stonjourner":{"faint":["animation.stonjourner.faint",3],"cry":["animation.stonjourner.cry",2.13],"recoil":["animation.stonjourner.recoil",1.5]},"eiscue_ice":{"cry":["animation.eiscue_ice.cry",1.21],"faint":["animation.eiscue_ice.faint",3]},"eiscue_no_ice":{"cry":["animation.eiscue_no_ice.cry",1.21],"faint":["animation.eiscue_no_ice.faint",3]},"morpeko":{"cry":["animation.morpeko.cry",1]},"cufant":{"special":["animation.cufant.special",3],"physical":["animation.cufant.physical",3],"recoil":["animation.cufant.recoil",1.5],"status":["animation.cufant.status",3],"cry":["animation.cufant.battle_cry",3],"faint":["animation.cufant.faint",3]},"copperajah":{"special":["animation.copperajah.special",3],"physical":["animation.copperajah.physical",3],"recoil":["animation.copperajah.recoil",1.5],"status":["animation.copperajah.status",3],"cry":["animation.copperajah.battle_cry",3],"faint":["animation.copperajah.faint",3]},"dracozolt":{"cry":["animation.dracozolt.cry",3.58]},"arctozolt":{"cry":["animation.arctozolt.cry",2.5]},"dracovish":{"cry":["animation.dracovish.cry",4.88]},"arctovish":{"cry":["animation.arctovish.cry",4]},"duraludon":{"faint":["animation.duraludon.faint",3],"cry":["animation.duraludon.battle_cry",3,0,1],"recoil":["animation.duraludon.recoil",0.58],"physical":["animation.duraludon.physical",3],"special":["animation.duraludon.special",3],"status":["animation.duraludon.status",3]},"dreepy":{"faint":["animation.dreepy.faint",3.25],"cry":["animation.dreepy.cry",1.5]},"drakloak":{"cry":["animation.drakloak.cry",1.75]},"dragapult":{"cry":["animation.dragapult.cry",2],"recoil":["animation.dragapult.recoil",1],"physical":["animation.dragapult.physical",3.75],"special":["animation.dragapult.special",3],"dragondarts":["animation.dragapult.special",3]},"zarude":{"cry":["animation.zarude.cry",1.5]},"wyrdeer":{"cry":["animation.wyrdeer.cry",2.25]},"kleavor":{"recoil":["animation.kleavor.recoil",1.5],"physical":["animation.kleavor.physical",3],"special":["animation.kleavor.special",3],"status":["animation.kleavor.status",3]},"ursaluna":{"cry":["animation.ursaluna.cry",1.5],"recoil":["animation.ursaluna.recoil",1]},"basculegion":{"cry":["animation.basculegion.cry",1.5]},"sneasler":{"cry":["animation.sneasler.cry",1],"recoil":["animation.sneasler.recoil",1.25]},"overqwil":{"cry":["animation.overqwil.cry",1.2]},"sprigatito":{"cry":["animation.sprigatito.cry",1.5]},"floragato":{"cry":["animation.floragato.battle_cry_merged",2.67,0,1]},"meowscarada":{"cry":["animation.meowscarada.cry",2.04]},"fuecoco":{"cry":["animation.fuecoco.cry",1]},"crocalor":{"cry":["animation.crocalor.cry",1.25]},"skeledirge":{"cry":["animation.skeledirge.cry",2.25]},"quaxly":{"cry":["animation.quaxly.cry",1],"faint":["animation.quaxly.faint",3],"recoil":["animation.quaxly.recoil",1,1]},"quaxwell":{"cry":["animation.quaxwell.cry",1.5],"faint":["animation.quaxwell.faint",3]},"quaquaval":{"cry":["animation.quaquaval.cry",2.21]},"lechonk":{"faint":["animation.lechonk.battle_faint",3],"cry":["animation.lechonk.cry",1.5],"recoil":["animation.lechonk.recoil",1.5]},"oinkologne_female":{"recoil":["animation.oinkologne_female.recoil",1.5],"cry":["animation.oinkologne_female.cry",2]},"oinkologne_male":{"recoil":["animation.oinkologne_male.recoil",1.5],"cry":["animation.oinkologne_male.cry",2]},"tandemaus":{"cry":["animation.tandemaus.cry",1.25],"faint":["animation.tandemaus.faint",3]},"maushold_four":{"cry":["animation.maushold_four.cry",1.25],"faint":["animation.maushold_four.faint",3]},"maushold_three":{"cry":["animation.maushold_three.cry",1.25],"faint":["animation.maushold_three.faint",3]},"fidough":{"cry":["animation.fidough.cry",0.83]},"dachsbun":{"cry":["animation.dachsbun.cry",1.04]},"squawkabilly":{"cry":["animation.squawkabilly.cry",2]},"garganacl":{"cry":["animation.garganacl.cry",1.25],"faint":["animation.garganacl.faint",3]},"charcadet":{"cry":["animation.charcadet.cry",1.25],"faint":["animation.charcadet.faint",3]},"armarouge":{"faint":["animation.armarouge.faint",3],"cry":["animation.armarouge.battle_cry",3,0,1],"recoil":["animation.armarouge.recoil",1],"physical":["animation.armarouge.physical",3],"special":["animation.armarouge.special",3],"status":["animation.armarouge.status",3]},"ceruledge":{"faint":["animation.ceruledge.faint",3],"cry":["animation.ceruledge.battle_cry",3,0,1],"recoil":["animation.ceruledge.recoil",1.25],"physical":["animation.ceruledge.physical",3],"special":["animation.ceruledge.special",3],"status":["animation.ceruledge.status",3]},"tadbulb":{"faint":["animation.tadbulb.faint",3],"cry":["animation.tadbulb.battle_cry",3,0,1],"recoil":["animation.tadbulb.recoil",1],"physical":["animation.tadbulb.physical",3],"special":["animation.tadbulb.special",3],"status":["animation.tadbulb.status",3]},"bellibolt":{"faint":["animation.bellibolt.faint",3],"cry":["animation.bellibolt.battle_cry",3,0,1],"recoil":["animation.bellibolt.recoil",1],"physical":["animation.bellibolt.physical",3],"special":["animation.bellibolt.special",3],"status":["animation.bellibolt.status",3]},"kilowattrel":{"cry":["animation.kilowattrel.cry",1.83],"physical":["animation.kilowattrel.physical",3],"special":["animation.kilowattrel.special",3]},"maschiff":{"cry":["animation.maschiff.cry",1.5]},"mabosstiff":{"cry":["animation.mabosstiff.cry",1.5]},"shroodle":{"cry":["animation.shroodle.cry",1.13]},"grafaiai":{"cry":["animation.grafaiai.cry",2]},"bramblin":{"cry":["animation.bramblin.cry",1]},"brambleghast":{"cry":["animation.brambleghast.cry",1]},"klawf":{"cry":["animation.klawf.cry",1.75]},"capsakid":{"cry":["animation.capsakid.battle_cry",3,0,1],"recoil":["animation.capsakid.recoil",0.75],"status":["animation.capsakid.status",3]},"scovillain":{"cry":["animation.scovillain.cry",2.5],"recoil":["animation.scovillain.recoil",1]},"rellor":{"cry":["animation.rellor.battle_cry",3,0,1],"recoil":["animation.rellor.recoil",0.75],"physical":["animation.rellor.physical",3],"special":["animation.rellor.special",3],"status":["animation.rellor.status",3],"faint":["animation.rellor.faint",3]},"rabsca":{"cry":["animation.rabsca.battle_cry",3],"physical":["animation.rabsca.physical",3],"special":["animation.rabsca.special",3],"status":["animation.rabsca.status",3]},"flittle":{"cry":["animation.flittle.cry",1.25],"faint":["animation.flittle.faint",3]},"espathra":{"faint":["animation.espathra.faint",3],"cry":["animation.espathra.cry",2]},"tinkatink":{"faint":["animation.tinkatink.faint",3],"cry":["animation.tinkatink.cry",1.5]},"tinkatuff":{"faint":["animation.tinkatuff.faint",3],"cry":["animation.tinkatuff.cry",1.5]},"tinkaton":{"physical":["animation.tinkaton.physical",3],"special":["animation.tinkaton.special",3],"status":["animation.tinkaton.status",3],"gigatonhammer":["animation.tinkaton.signature",3.33],"recoil":["animation.tinkaton.recoil",0.29],"faint":["animation.tinkaton.faint",3],"cry":["animation.tinkaton.battle_cry",3,0,1]},"wiglett":{"recoil":["animation.wiglett.recoil",1]},"wugtrio":{"recoil":["animation.wugtrio.recoil",1]},"finizen":{"cry":["animation.finizen.cry",1.2]},"palafin_hero":{"cry":["animation.palafin_hero.cry",1.2]},"palafin_zero":{"cry":["animation.palafin_zero.cry",1.2]},"varoom":{"cry":["animation.varoom.cry",2]},"revavroom":{"cry":["animation.revavroom.cry",2.25]},"cyclizar":{"cry":["animation.cyclizar.cry",1.25]},"orthworm":{"faint":["animation.orthworm.faint",3],"cry":["animation.orthworm.cry",2.75],"recoil":["animation.orthworm.recoil",0.58],"physical":["animation.orthworm.physical",3],"special":["animation.orthworm.special",3],"status":["animation.orthworm.status",3]},"glimmet":{"faint":["animation.glimmet.faint",3],"cry":["animation.glimmet.cry",1.33]},"glimmora":{"cry":["animation.glimmora.cry",1.25],"faint":["animation.glimmora.faint",3]},"flamigo":{"cry":["animation.flamigo.cry",3],"recoil":["animation.flamigo.recoil",1.5]},"cetoddle":{"faint":["animation.cetoddle.faint",3]},"cetitan":{"cry":["animation.cetitan.cry",3.21],"faint":["animation.cetitan.faint",3]},"dondozo":{"cry":["animation.dondozo.cry",2.5],"sleep":["animation.dondozo.water_sleep",1,1]},"tatsugiri":{"cry":["animation.tatsugiri.cry",1.2]},"annihilape":{"faint":["animation.annihilape.faint",3],"ragefist":["animation.annihilape.signature",3],"physical":["animation.annihilape.physical",3],"special":["animation.annihilape.special",3],"status":["animation.annihilape.status",3.25],"cry":["animation.annihilape.battle_cry",3.25,0,1],"recoil":["animation.annihilape.recoil",0.38]},"clodsire":{"cry":["animation.clodsire.cry",1.17]},"farigiraf":{"cry":["animation.farigiraf.cry",2],"recoil":["animation.farigiraf.recoil",1]},"dudunsparce":{"recoil":["animation.dudunsparce.recoil",1.5],"cry":["animation.dudunsparce.cry",2.5]},"dudunsparce_three_segment":{"recoil":["animation.dudunsparce_three_segment.recoil",1.5],"cry":["animation.dudunsparce_three_segment.cry",2.5]},"gimmighoul":{"faint":["animation.gimmighoul_roaming.faint",3],"cry":["animation.gimmighoul_roaming.cry",3],"recoil":["animation.gimmighoul_roaming.recoil",1.5]},"gimmighoul_roaming":{"recoil":["animation.gimmighoul_roaming.recoil",1.5],"cry":["animation.gimmighoul_roaming.cry",3],"faint":["animation.gimmighoul_roaming.faint",3]},"gholdengo":{"cry":["animation.gholdengo.cry",3]},"walkingwake":{"cry":["animation.walkingwake.cry",1.67],"faint":["animation.walkingwake.faint",3]},"dipplin":{"cry":["animation.dipplin.cry",1.5]},"poltchageist":{"cry":["animation.poltchageist.cry",1.25]},"sinistcha":{"cry":["animation.sinistcha.cry",1.25]},"archaludon":{"faint":["animation.archaludon.faint",3],"cry":["animation.archaludon.battle_cry",3.63,0,1],"recoil":["animation.archaludon.recoil",0.88],"physical":["animation.archaludon.physical",3],"special":["animation.archaludon.special",3],"status":["animation.archaludon.status",3.63]},"hydrapple":{"cry":["animation.hydrapple.cry",2.17]}}');
    MODEL_LOCATORS = JSON.parse('{"bulbasaur":{"root":[[0,0,0]],"middle":[[0,6.7,0]],"top":[[0,14,-0.1]],"target":[[0,8.7,-10]],"special":[[-9.71,11.57,-15.32]],"mouth":[[0,2.83,-9.74]],"physical":[[-9.71,11.57,-15.32]],"eye":[[-3.51,5.47,-9.65],[3.49,5.47,-9.65]],"face":[[-0.01,5.73,-9.89]]},"ivysaur":{"root":[[0,0,0]],"middle":[[0,8.25,0.75]],"top":[[0,20.75,0]],"target":[[0,8.25,-13.75]],"special":[[-13.45,9.15,-14.2]],"mouth":[[0,4.33,-10.98]],"physical":[[0,4.33,-10.98]],"eye":[[-3.5,6.08,-11.13],[3.5,6.08,-11.13]],"face":[[0,6.05,-11.38]]},"venusaur":{"root":[[0,0,0]],"middle":[[0,11.75,4.25]],"top":[[0,38.75,3]],"target":[[0,11.75,-27.75]],"special":[[-22.5,21,-14.75]],"mouth":[[-0.39,4.7,-20.32]],"physical":[[-0.39,4.7,-20.32]],"eye":[[5.49,10.99,-17.77],[-6.15,10.77,-17.67]],"face":[[-0.48,9.02,-23.18]]},"charmander":{"root":[[0,0,0]],"middle":[[0,9,0]],"top":[[0,21.1,0]],"target":[[0,10,-6.2]],"special":[[1.17,13.6,-3.92]],"mouth":[[1.17,13.6,-3.92]],"hand_primary":[[-6.21,9.18,-0.62]],"physical":[[-6.21,9.18,-0.62]],"eye":[[-1.85,17.36,-5.04],[4.14,17.45,-4.82]],"face":[[1.15,16.9,-4.97]],"hand_secondary":[[7.8,9.11,-1.17]]},"charmeleon":{"root":[[0,0,0]],"middle":[[0,13,0]],"top":[[0,28.5,0]],"target":[[1.62,15.25,-6.04]],"special":[[1.23,20.15,-6.22]],"mouth":[[1.23,20.15,-6.22]],"hand_primary":[[-4.8,12.64,-9.81]],"physical":[[-4.8,12.64,-9.81]],"eye":[[-2.73,22.46,-7.6],[5.25,22.08,-7.94]],"face":[[1.1,21.57,-10.72]],"hand_secondary":[[11.86,14.1,-2.3]]},"charizard":{"root":[[0,0,0]],"middle":[[-0.58,20.95,-0.47]],"top":[[0,41,0]],"target":[[2.67,20.95,-9.4]],"special":[[0.99,32.41,-14.97]],"mouth":[[0.99,32.41,-14.97]],"hand_primary":[[-15,19.04,-11.69]],"physical":[[-15,19.04,-11.69]],"eye":[[-1.47,33.84,-18.43],[3.53,33.83,-18.37]],"face":[[1.07,31.36,-23.09]],"hand_secondary":[[14.75,19.16,2.72]]},"squirtle":{"root":[[0,0,0]],"middle":[[0.08,9.11,-1.13]],"top":[[0,18.5,0]],"target":[[0.05,7.1,-5.77]],"special":[[0.19,11.47,-7.86]],"mouth":[[0.19,11.07,-7.83]],"hand_primary":[[-7.04,9.31,-6.42]],"physical":[[0.05,7.91,-0.81]],"eye":[[-2.36,14.42,-8.08],[2.64,14.5,-8.12]],"face":[[0.14,14.46,-8.1]],"hand_secondary":[[7.25,9.06,-6.38]]},"wartortle":{"root":[[0,0,0]],"middle":[[-0.08,11.75,-0.67]],"top":[[0,24.75,0]],"target":[[0.07,9.71,-7.37]],"special":[[0.05,14.88,-8.68]],"mouth":[[0.05,14.63,-8.71]],"hand_primary":[[-10.12,10.09,-4.41]],"physical":[[0.14,23.19,-8.36]],"eye":[[-2.65,18.4,-9.04],[2.85,18.34,-8.9]],"face":[[0.1,17.87,-8.93]],"hand_secondary":[[10.14,10.44,-4.06]]},"blastoise":{"root":[[0,0,0]],"middle":[[0,23.5,0]],"top":[[0,47,0]],"target":[[0,23.5,-16]],"special":[[-16.35,40.31,-23.75],[15.93,40.31,-24.03]],"mouth":[[-0.2,34.18,-22.49]],"hand_primary":[[-17.07,22.97,-27.06]],"physical":[[-17.07,22.97,-27.06]],"eye":[[3.8,39.18,-22.58],[-4.2,39.18,-22.51]],"face":[[-0.24,37.9,-27.23]],"hand_secondary":[[16.6,22.97,-27.35]]},"caterpie":{"root":[[0,0,0]],"middle":[[0,5,-0.5]],"top":[[0,10,-1]],"special":[[0,6,16.75]],"mouth":[[0,2.75,-13.05]],"physical":[[0,2.75,-13.05]],"eye":[[-4,6,-9.5],[4,6,-9.5]]},"metapod":{"root":[[0,0,0]],"middle":[[0,6,-1.75]],"top":[[0,15.2,-1.75]],"target":[[0,6.25,-8.5]],"special":[[0,5.8,-7]],"mouth":[[0,5.8,-7]],"physical":[[0,5.8,-7]],"eye":[[-3.5,8.53,-4.75],[3.5,8.53,-4.75]],"face":[[0,8.38,-8.47]]},"butterfree":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,27.25,0]],"target":[[0,12,-4.5]],"special":[[0,13.5,-3]],"mouth":[[0,13.5,-3]],"physical":[[0,13.5,-3]],"eye":[[2.75,15.5,-3.25],[-2.75,15.5,-3.25]],"face":[[0,15.5,-3.75]]},"weedle":{"root":[[0,0,0]],"middle":[[0,3.25,0.5]],"top":[[0,13.5,-1.5]],"target":[[0,5.75,-13]],"special":[[0,9,-8.5]],"physical":[[0,9,-8.5]],"eye":[[-2.25,5.25,-11],[2.25,5.25,-11]],"face":[[0,4.25,-12]]},"kakuna":{"root":[[0,0,0]],"middle":[[0,8,-0.5]],"top":[[0,16.52,-0.25]],"target":[[0,9,-5.5]],"special":[[0,15.9,-1.75]],"physical":[[0,15.9,-1.75]],"eye":[[-2,12.9,-4.5],[2,12.9,-4.5]],"face":[[0,12.9,-4.5]]},"beedrill":{"root":[[0,0,0]],"middle":[[0,13.5,-0.5]],"top":[[0,26,-1.75]],"target":[[0,13.75,-4.5]],"special":[[-23,16,-1],[23,16,-1]],"physical":[[-23,16,-1],[23,16,-1]],"eye":[[-2.5,20,-2.15],[2.5,20,-2.15]],"face":[[0,19.25,-5]]},"pidgey":{"root":[[0,0,0]],"middle":[[0,5.25,0]],"top":[[0,11.75,-0.25]],"target":[[0,6,-5.5]],"special":[[0,8.65,-2.8]],"mouth":[[0,8.65,-2.8]],"physical":[[0,8.82,-4.62]],"eye":[[-1.75,9.68,-2.77],[1.75,9.68,-2.77]],"face":[[0,9.8,-3.45]]},"pidgeotto":{"root":[[0,0,0]],"middle":[[0,6.75,-0.75]],"top":[[0,18,-1]],"target":[[0,8.5,-8.25]],"special":[[0,9.2,-9]],"mouth":[[0,9.2,-9]],"physical":[[0,9.43,-11]],"eye":[[1.55,10.53,-9.02],[-1.55,10.53,-9.02]],"face":[[0,10.25,-9.02]]},"pidgeot":{"root":[[0,0,0]],"middle":[[-1.29,16.65,-0.72]],"top":[[0,18,-1]],"target":[[7.02,17.9,-12.6]],"special":[[3.52,23.88,-11.97]],"mouth":[[3.52,23.88,-11.97]],"physical":[[-5.92,6.84,-4.8]],"eye":[[5.47,26.61,-11.49],[0.72,26.54,-13.04]],"face":[[4.27,25.23,-14.35]]},"rattata":{"root":[[0,0,0]],"middle":[[0,5.75,-0.25]],"top":[[0,10.05,-1.25]],"target":[[0,9,-10]],"special":[[0,5.95,-8.75]],"mouth":[[0,5.95,-8.75]],"physical":[[0,5.95,-8.75]],"eye":[[-2.5,7.75,-6.35],[2.5,7.75,-6.35]],"face":[[0,7.25,-10.7]]},"raticate":{"root":[[0,0,0]],"middle":[[0,8.5,-0.5]],"top":[[0,19.13,0.23]],"target":[[0,7.15,-10.42]],"special":[[0,11.5,-7.25]],"mouth":[[0,11.5,-7.25]],"hand_primary":[[-9.1,7.25,-4.3]],"physical":[[-9.1,7.25,-4.3]],"eye":[[-4.5,15.85,-5.45],[4.5,15.85,-5.45]],"face":[[0,15.9,-9.6]],"hand_secondary":[[9.1,7.25,-4.3]]},"spearow":{"root":[[0,0,0]],"middle":[[0,7,0]],"top":[[0,15,0]],"target":[[0,7,-6]],"special":[[-9.5,9.15,-1]],"mouth":[[0,11.15,-4.95]],"physical":[[0,11.6,-6.75]],"eye":[[-1.5,12.6,-5.25],[1.5,12.6,-5.25]],"face":[[0,11.85,-7.1]]},"fearow":{"root":[[0,0,0]],"middle":[[0,16,0]],"top":[[0,32,0]],"target":[[0,16,-18]],"special":[[-39,18.25,-13.75]],"mouth":[[0,31.75,-20]],"physical":[[0,32,-38]],"eye":[[-2,33.75,-22],[2,33.75,-22]],"face":[[0,31,-34]]},"ekans":{"root":[[0,0,0]],"middle":[[0,8.5,25]],"top":[[0,8,0]],"target":[[0,8.5,-26]],"special":[[-6.27,15.32,-16.74]],"mouth":[[-6.27,15.32,-16.74]],"physical":[[-6.27,15.32,-16.74]],"eye":[[-10.11,19.26,-12.26],[-2.71,19.54,-12.28]],"face":[[-6.36,17.88,-14.2]]},"arbok":{"root":[[0,0,0]],"middle":[[0,5,-13.75]],"top":[[0,31,0]],"target":[[0,17.75,-24.5]],"special":[[-0.72,31.9,-20.99]],"mouth":[[-0.72,31.9,-20.99]],"physical":[[-0.72,31.9,-20.99]],"eye":[[-4.69,34.55,-21.92],[3.31,34.44,-21.96]],"face":[[-0.72,33.18,-24.95]]},"pikachu":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,22,0]],"target":[[0,10,-6]],"special":[[-4.5,5.52,-14.63],[4.5,5.52,-14.63]],"mouth":[[0,4.81,-14.39]],"hand_primary":[[-5.16,0.21,-6.84]],"physical":[[5.28,20.69,14.58]],"eye":[[-2.75,7.9,-14.36],[2.75,7.9,-14.36]],"face":[[0,6.53,-14.98]],"hand_secondary":[[5.16,0.21,-6.84]]},"raichu":{"root":[[0,0,0]],"middle":[[-0.07,14.4,0]],"top":[[0,23,0]],"target":[[-0.85,14.4,-5.94]],"special":[[-6.13,17.63,-6.4],[3.85,17.67,-6.91]],"mouth":[[-1.13,16.81,-6.51]],"hand_primary":[[-9.75,10.85,-2.96]],"physical":[[23.03,45.77,15.51]],"eye":[[-4.12,19.93,-6],[1.87,19.96,-6.31]],"face":[[-1.16,18.64,-6.89]],"hand_secondary":[[6.48,11.61,-6.83]]},"sandshrew":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,17.5,0]],"target":[[1.52,8,-6.83]],"special":[[0.59,8.05,-6.06]],"mouth":[[0.59,8.05,-6.06]],"hand_primary":[[-2.64,4.64,-5.35]],"physical":[[-2.64,4.64,-5.35]],"eye":[[4.04,11.64,-5.3],[-2.95,11.62,-5.68]],"face":[[0.72,10.05,-8.63]],"hand_secondary":[[4.86,5.22,-3.42]]},"sandslash":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,24,0]],"target":[[0,10,-8]],"special":[[0,15.4,-5.5]],"mouth":[[0,15.4,-5.5]],"hand_primary":[[-11.85,13,-1.5]],"physical":[[-11.85,13,-1.5]],"eye":[[-2.5,17.5,-5.5],[2.5,17.5,-5.5]],"face":[[0,17,-7]],"hand_secondary":[[11.85,13,-1.5]]},"nidoranf":{"root":[[0,0,0]],"middle":[[0,5.25,-0.5]],"top":[[0,13,0]],"target":[[0,4,-9.25]],"special":[[0.17,13.95,-7.11]],"mouth":[[0.04,6.76,-7.9]],"physical":[[0.04,6.76,-7.9]],"eye":[[3.1,10.16,-6.8],[-2.9,10.26,-6.8]],"face":[[0.08,9.29,-9.55]]},"nidorina":{"root":[[0,0,0]],"middle":[[0,6.5,-3.5]],"top":[[0,12,0]],"target":[[0,3.5,-17]],"special":[[0.06,5.56,-8.31]],"mouth":[[0.06,5.56,-8.31]],"hand_primary":[[-4.45,0.58,-6.52]],"physical":[[0.06,5.56,-8.31]],"eye":[[3.09,6.54,-11.25],[-2.91,6.69,-11.27]],"face":[[0.08,5.73,-13.65]],"jaw_lower":[[0.04,4.62,-10.4]],"hand_secondary":[[4.45,0.58,-6.52]]},"nidoqueen":{"root":[[0,0,0]],"middle":[[0,13,-1]],"top":[[0,27,0]],"target":[[0,15,-12]],"special":[[0,21.75,-3.75]],"mouth":[[0,21.75,-3.75]],"hand_primary":[[-18,17,0]],"physical":[[-18,17,0]],"eye":[[4.5,23.5,-6],[-4.5,23.5,-6]],"face":[[0,23.25,-9.5]],"jaw_lower":[[0,21.5,-7.15]],"hand_secondary":[[18,17,0]]},"nidoranm":{"root":[[0,0,0]],"middle":[[0,5.25,0.75]],"top":[[0,13,0]],"target":[[0,3.75,-11.5]],"special":[[0.16,9.98,-11.33]],"mouth":[[-0.03,3.24,-9.64]],"physical":[[-0.03,3.24,-9.64]],"eye":[[3.03,5.66,-8.19],[-2.97,5.83,-8.21]],"face":[[0.04,5.73,-10.65]]},"nidorino":{"root":[[0,0,0]],"middle":[[0,8,-0.5]],"top":[[0,12.5,0]],"target":[[0,7,-17]],"special":[[0,5.75,-9]],"mouth":[[0,5.75,-9]],"physical":[[0,5.75,-9]],"eye":[[3,7,-10.9],[-3,7,-10.9]],"face":[[0,7.25,-13.75]],"jaw_lower":[[0,5.25,-11.65]]},"nidoking":{"root":[[0,0,0]],"middle":[[0.26,16.65,-0.97]],"top":[[0,29.5,0]],"target":[[2.2,14.65,-8.21]],"special":[[4.44,19.36,-14.88]],"mouth":[[4.44,19.36,-14.88]],"hand_primary":[[-9.53,6.2,-16.03]],"physical":[[-9.53,6.2,-16.03]],"eye":[[7.48,19.39,-20.64],[1.97,19.9,-20.88]],"face":[[4.56,17.5,-21.74]],"hand_secondary":[[17.4,6.66,-9.93]]},"clefairy":{"root":[[0,0,0]],"middle":[[0,10.5,0]],"top":[[0,20,0]],"target":[[0,10.5,-8]],"special":[[0,10.25,-6.25]],"mouth":[[0,10.25,-6.25]],"hand_primary":[[-13,9.25,-4.25]],"physical":[[-13,9.25,-4.25]],"eye":[[2.25,12.75,-6.25],[-2.25,12.75,-6.25]],"face":[[0,12.75,-6.25]],"hand_secondary":[[13,9.25,-4.25]]},"clefable":{"root":[[0,0,0]],"middle":[[0,14,0]],"top":[[0,27,0]],"target":[[0,14,-8]],"special":[[0,15.75,-6.75]],"mouth":[[0,15.75,-6.75]],"hand_primary":[[-13.5,14.75,-4.25]],"physical":[[-13.5,14.75,-4.25]],"eye":[[2.25,18.25,-6.75],[-2.25,18.25,-6.75]],"face":[[0,18.25,-6.75]],"hand_secondary":[[13.5,14.75,-4.25]]},"vulpix":{"root":[[0,0,0]],"middle":[[0,9.75,0]],"top":[[0,18,0]],"target":[[0,8.75,-12]],"special":[[0.03,6.46,-9.75]],"mouth":[[0.03,6.46,-9.75]],"physical":[[0.04,11.74,15.69]],"eye":[[2.06,9.54,-9.62],[-1.94,9.58,-9.65]],"face":[[0.06,9.56,-9.63]]},"ninetales":{"root":[[0,0,0]],"middle":[[0,16,0]],"top":[[0,32,0]],"target":[[0,16,-18]],"special":[[0,23.75,-10.5]],"mouth":[[0,23.75,-10.5]],"physical":[[0,17,63.25]],"eye":[[2,26.25,-10.25],[-2,26.25,-10.25]],"face":[[0,26,-10.25]]},"jigglypuff":{"root":[[0,0,0]],"middle":[[0,7.5,0]],"top":[[0,16.5,0]],"target":[[0,7.5,-6.5]],"special":[[0,5.25,-5.5]],"mouth":[[0,5.25,-5.5]],"hand_primary":[[-5.5,4,-7.5]],"physical":[[-5.5,4,-7.5]],"eye":[[3.25,8,-5.5],[-3.25,8,-5.5]],"face":[[0,7.5,-5.5]],"hand_secondary":[[5.5,4,-7.5]]},"wigglytuff":{"root":[[0,0,0]],"middle":[[0,14,0]],"top":[[0,32,0]],"target":[[0,11.5,-8.5]],"special":[[0,14.75,-7]],"mouth":[[0,14.75,-7]],"hand_primary":[[-11.5,11.75,-5.25]],"physical":[[-11.5,11.75,-5.25]],"eye":[[-4,17.65,-7],[4,17.65,-7]],"face":[[0,17.5,-7]],"hand_secondary":[[12.5,11.75,-5.25]]},"zubat":{"root":[[0,0,0]],"middle":[[0,13,0]],"top":[[0,25,0]],"target":[[0,12,-6]],"special":[[0,13,-2]],"mouth":[[0,13,-2]],"physical":[[0,13,-2]],"face":[[0,14.5,-2]]},"golbat":{"root":[[0,0,0]],"middle":[[0.38,13.71,0.58]],"top":[[0,28,0]],"target":[[2.03,10.38,-6.78]],"special":[[1.07,9.94,-2.55]],"mouth":[[1.07,9.94,-2.55]],"physical":[[1.07,9.94,-2.55]],"eye":[[3.7,16.38,-3.83],[-1.66,16.41,-5.04]],"face":[[1.5,16.19,-4.28]]},"oddish":{"root":[[0,0,0]],"middle":[[0,8.1,-0.4]],"top":[[0,18,0]],"target":[[0,5.6,-5.4]],"special":[[0,4.3,-4.42]],"mouth":[[0,4.3,-4.42]],"physical":[[0,7.8,-4.24]],"eye":[[2,6.3,-4.32],[-2,6.3,-4.32]],"face":[[0,5.8,-4.34]]},"gloom":{"root":[[0,0,0]],"middle":[[0,7.25,0]],"top":[[0,18,0]],"target":[[0,7.25,-6.5]],"special":[[0,16.36,-1.68]],"mouth":[[0,6.7,-5.6]],"hand_primary":[[-8.96,5.2,-1.83]],"physical":[[-8.96,5.2,-1.83]],"eye":[[2.75,9.1,-5.75],[-2.75,9.1,-5.75]],"face":[[0,9.6,-5.78]],"hand_secondary":[[8.96,5.2,-1.83]]},"vileplume":{"root":[[0,0,0]],"middle":[[0,11.07,-0.22]],"top":[[0,23,0]],"target":[[0,9.32,-9.22]],"special":[[0,23.28,-1.08]],"mouth":[[0,8.37,-6.8]],"hand_primary":[[-10.26,7.74,-2.68]],"physical":[[-10.26,7.74,-2.68]],"eye":[[2.75,10.62,-6.87],[-2.75,10.62,-6.87]],"face":[[0,10.62,-6.87]],"hand_secondary":[[10.26,7.74,-2.68]]},"paras":{"root":[[0,0,0]],"middle":[[0,6,0.5]],"top":[[0,11.5,0.5]],"target":[[0,5,-6.5]],"special":[[0,11,2]],"mouth":[[0,2.75,-5.75]],"hand_primary":[[-6.54,3.88,-6.21]],"physical":[[-6.54,3.88,-6.21]],"eye":[[-3,5.5,-5],[3,5.5,-5]],"face":[[0,3.75,-5.75]],"hand_secondary":[[6.54,3.88,-6.21]]},"parasect":{"root":[[0,0,0]],"middle":[[0,11.5,0]],"top":[[0,22.75,-1]],"target":[[0,11.5,-9]],"special":[[0,20.89,-0.88]],"mouth":[[0,6.75,-8.55]],"hand_primary":[[-12.75,7.25,-4]],"physical":[[-12.75,7.25,-4]],"eye":[[-1.75,9.25,-9.25],[1.75,9.25,-9.25]],"face":[[0,7.75,-8.55]],"hand_secondary":[[12.75,7.25,-4]]},"venonat":{"root":[[0,0,0]],"middle":[[0,11.5,0]],"top":[[0,13.75,0]],"target":[[0,7.5,-7]],"special":[[0,15.67,-4.78]],"mouth":[[0,5.15,-5.57]],"hand_primary":[[-3.47,3.52,-5.76]],"physical":[[-3.47,3.52,-5.76]],"eye":[[3.75,9.14,-5.9],[-3.75,9.14,-5.9]],"face":[[0,8.65,-5.64]],"hand_secondary":[[3.47,3.52,-5.76]]},"venomoth":{"root":[[0,0,0]],"middle":[[0,12,-4]],"top":[[0,24,0]],"target":[[0,8.25,-10.5]],"special":[[-1.55,12.97,-8.53]],"mouth":[[-1.6,13.7,-11.32]],"hand_primary":[[-3.64,13.78,-9.17]],"physical":[[-1.6,13.7,-11.32]],"eye":[[0.64,17,-13.38],[-4.25,16.68,-13.38]],"face":[[-1.81,16.97,-12.9]],"hand_secondary":[[0.41,14.05,-9.17]]},"diglett":{"root":[[0,0,0]],"middle":[[0,6.5,0]],"top":[[0,12.5,0]],"target":[[-0.1,6.5,-5.5]],"special":[[-0.36,11.98,0.28]],"physical":[[-0.36,11.98,0.28]],"eye":[[1.22,9.74,-3.38],[-1.78,9.56,-3.33]],"face":[[-0.28,9.65,-3.33]]},"dugtrio":{"root":[[0,0,0]],"middle":[[0,9,0]],"top":[[0,19,0]],"target":[[0,9,-9]],"special":[[0,9,-9]],"physical":[[0,9,-9]],"eye":[[-2.74,10.27,-7.78],[-5.71,9.88,-7.97],[6.27,6.63,-7.73],[3.34,7.19,-7.39],[3.33,14.59,-0.06],[0.37,15.08,-0.12]],"face":[[-4.23,10.08,-7.88],[4.81,6.91,-7.56],[1.85,14.84,-0.09]]},"meowth":{"root":[[0,0,0]],"middle":[[0,6.5,0]],"top":[[0,21.75,0]],"target":[[0,8.75,-5.25]],"special":[[-10.5,9.25,0]],"mouth":[[0,10.75,-3.5]],"hand_primary":[[-10.5,9.25,0]],"physical":[[-10.5,9.25,0]],"eye":[[-2.75,14,-3.55],[2.75,14,-3.55]],"face":[[0,13.5,-3.5]],"hand_secondary":[[10.5,9.25,0]]},"persian":{"root":[[0,0,0]],"middle":[[0,15,-0.75]],"top":[[0,24.75,0]],"target":[[0,18,-19.75]],"special":[[-2.75,0.5,-5.25]],"physical":[[-2.75,0.5,-5.25]],"eye":[[-2,23.4,-11.25],[2,23.4,-11.25]],"face":[[0,23.25,-12.25]],"jaw_lower":[[0,20.83,-12.6]]},"psyduck":{"root":[[0,0,0]],"middle":[[0,7.25,0]],"top":[[0,16.25,0]],"target":[[0,6.5,-7.25]],"special":[[0,11,-4.75]],"mouth":[[0,11,-4.75]],"hand_primary":[[-10.25,8.5,0]],"physical":[[-10.25,8.5,0]],"eye":[[-2.45,13.55,-4],[2.45,13.55,-4]],"hand_secondary":[[10.25,8.5,0]]},"golduck":{"root":[[0,0,0]],"middle":[[0,13,0]],"top":[[0,25,0]],"target":[[0,14,-6.25]],"special":[[0,20.15,-3.5]],"mouth":[[0,20.15,-3.5]],"hand_primary":[[-16.25,17,0]],"physical":[[-16.25,17,0]],"eye":[[-1.7,22.5,-3.27],[1.7,22.5,-3.27]],"face":[[0,21.5,-7.25]],"hand_secondary":[[16.25,17,0]]},"mankey":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,16,0]],"target":[[0,8,-6]],"special":[[-15.5,10.25,0]],"hand_primary":[[-15.5,10.25,0]],"physical":[[-15.5,10.25,0]],"eye":[[-1.9,9.75,-4],[1.9,9.75,-4]],"face":[[0,10,-4]],"hand_secondary":[[15.5,10.25,0]]},"primeape":{"root":[[0,0,0]],"middle":[[-0.06,10.47,0.2]],"top":[[0,21.25,0]],"target":[[-1.53,10.98,-6.7]],"special":[[-11.83,6.84,-0.94]],"hand_primary":[[-9.91,8.92,-1.94]],"physical":[[-9.91,8.92,-1.94]],"eye":[[0.99,12.33,-5.48],[-3.66,12.4,-4.15]],"face":[[-1.48,12.33,-4.77]],"hand_secondary":[[5.22,12.23,-10.43]]},"growlithe":{"root":[[0,0,0]],"middle":[[0,9.5,-1.5]],"top":[[0,18.75,0]],"target":[[0,10.5,-14.5]],"special":[[0,13.25,-8.5]],"mouth":[[0,13.25,-8.5]],"physical":[[0,13.25,-8.5]],"eye":[[-2.5,16,-8.5],[2.5,16,-8.5]],"face":[[0,15.3,-10.4]],"jaw_lower":[[0,13.08,-9.45]]},"arcanine":{"root":[[0,0,0]],"middle":[[-0.34,14.5,0.94]],"top":[[0,38.5,0]],"target":[[8.12,19.5,-22.32]],"special":[[5.09,25.97,-14.05]],"mouth":[[5.09,25.97,-14.05]],"physical":[[5.09,25.97,-14.05]],"eye":[[8.05,30.46,-14.7],[2.05,30.36,-14.93]],"face":[[5.21,28.43,-18.1]]},"poliwag":{"root":[[0,0,0]],"middle":[[0,7,0]],"top":[[0,12.5,0]],"target":[[0,7,-6]],"special":[[0,8.25,-5.5]],"mouth":[[0,8.25,-5.5]],"physical":[[0,12,-2]],"eye":[[2.75,10,-4.52],[-2.75,10,-4.52]],"face":[[0,9.25,-4.5]]},"poliwhirl":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,20,0]],"target":[[0,10,-10.75]],"special":[[-13.91,9.45,-1.95]],"hand_primary":[[-13.91,9.45,-1.95]],"physical":[[-13.91,9.45,-1.95]],"eye":[[4.66,18.58,-5.5],[-4.33,18.79,-5.34]],"face":[[0.12,18.17,-7.33]],"hand_secondary":[[13.95,9.59,-2.19]]},"poliwrath":{"root":[[0,0,0]],"middle":[[1,16,0]],"top":[[0,28.75,0]],"target":[[-6.39,15.75,-8.81]],"special":[[-16.69,13.03,0.82]],"hand_primary":[[-16.69,13.03,0.82]],"physical":[[-16.69,13.03,0.82]],"eye":[[2.87,24.55,-6.85],[-5.16,24.49,-2.23]],"face":[[-2.8,23.65,-6.43]],"hand_secondary":[[8.13,16.68,-19.51]]},"abra":{"root":[[0,0,0]],"middle":[[-0.17,11.19,0.09]],"top":[[0,21,0]],"target":[[-0.12,10.92,-2.9]],"special":[[-0.18,18.35,-4.79]],"mouth":[[-0.15,14.54,-3.58]],"hand_primary":[[-6.2,14.04,-5.84]],"physical":[[-6.2,14.04,-5.84]],"eye":[[-2.17,16.9,-4.36],[1.83,16.94,-4.31]],"face":[[-0.16,16.45,-4.19]],"hand_secondary":[[6.45,14.86,-5.49]]},"kadabra":{"root":[[0,0,0]],"middle":[[0,13.5,0]],"top":[[0,27,0]],"target":[[0,13.5,-6]],"special":[[-6.5,4,-5]],"mouth":[[0,19.75,-6.5]],"hand_primary":[[-6.5,5,-1]],"physical":[[-6.5,5,-1]],"face":[[0,21.25,-7.75]],"hand_secondary":[[6.5,5,-1]]},"alakazam":{"root":[[0,0,0]],"middle":[[0,16,0]],"top":[[0,32,0]],"target":[[0,20,-4]],"special":[[0,31.25,-7.75]],"mouth":[[0,25.75,-6.75]],"hand_primary":[[-6.5,6.25,0]],"physical":[[-6.5,6.25,0]],"eye":[[2.25,28,-7.25],[-2.25,28,-7.25]],"face":[[0,27.75,-8.25]],"hand_secondary":[[6.5,6.25,0]]},"machop":{"root":[[0,0,0]],"middle":[[0,11.75,0]],"top":[[0,21.5,0.75]],"target":[[0,11,-6.25]],"special":[[-15,13,0.25]],"hand_primary":[[-15,13,0.25]],"physical":[[-15,13,0.25]],"face":[[0,17.75,-3.5]],"hand_secondary":[[15,13,0.25]]},"machoke":{"root":[[0,0,0]],"middle":[[0,17,1.75]],"top":[[0,27.5,0]],"target":[[0,17,-6.25]],"special":[[-23.47,20,1.35]],"hand_primary":[[-23.47,20,1.35]],"physical":[[-23.47,20,1.35]],"eye":[[-3,24.75,-1.5],[3,24.75,-1.5]],"face":[[0,24.25,-5.25]],"hand_secondary":[[23.48,20,1.35]]},"machamp":{"root":[[0,0,0]],"middle":[[0,18,0]],"top":[[0,29.15,0]],"target":[[0,19,-9]],"special":[[-24.47,21.5,-1.25]],"hand_primary":[[-24.47,21.5,-1.25],[24.48,21.5,-1.25]],"physical":[[-24.47,21.5,-1.25]],"face":[[0,26.75,-6.25]],"hand_secondary":[[-23.5,23.5,4],[23.5,23.5,4]]},"bellsprout":{"root":[[0,0,0]],"middle":[[0.64,9.94,0]],"top":[[0,24.5,0]],"target":[[0.64,9.94,-3]],"special":[[-0.01,9.38,-12.96]],"mouth":[[-0.01,9.38,-12.96]],"hand_primary":[[-10.47,9.23,2.15]],"physical":[[-10.47,9.23,2.15]],"eye":[[2.18,13.79,-11.62],[-2.81,13.47,-11.71]],"face":[[-0.08,10.61,-13.82]],"hand_secondary":[[10.14,10.86,2.15]]},"weepinbell":{"root":[[0,0,0]],"middle":[[0,8.51,1.66]],"top":[[0,16,0]],"target":[[0,10.03,-4.23]],"special":[[0,4.68,-3.6]],"mouth":[[0,4.68,-3.6]],"hand_primary":[[-12.8,7.4,-1.14]],"physical":[[-12.8,7.4,-1.14]],"eye":[[-2.4,10.53,-2.91],[2.4,10.53,-2.91]],"face":[[0,10.13,-2]],"hand_secondary":[[12.8,7.4,-1.14]]},"victreebel":{"root":[[0,0,0]],"middle":[[0,19.7,0]],"top":[[0,40,0]],"target":[[0,19.7,-11]],"special":[[0.1,28.31,-7.14]],"mouth":[[0.1,28.31,-7.14]],"hand_primary":[[31.66,11.74,0.46],[-31.66,11.74,0.46]],"physical":[[-31.66,11.74,0.46]],"eye":[[4.2,23.69,-11.37],[-3.8,23.67,-11.53]],"face":[[0.2,23.68,-11.45]]},"tentacool":{"root":[[0,0,0]],"middle":[[0,30,0]],"top":[[0,28.5,0]],"target":[[0,26,-9.5]],"special":[[-3.5,0,0]],"hand_primary":[[-3.5,0,0]],"physical":[[-3.5,0,0]],"eye":[[2.5,23.5,-4],[-2.5,23.5,-4]],"face":[[0,22,-6.5]],"hand_secondary":[[3.5,0,0]]},"tentacruel":{"root":[[0,0,0]],"middle":[[0,36,0]],"top":[[0,38,0]],"target":[[0,29,-18]],"hand_primary":[[2.5,4.25,-5.5],[-2.5,4.25,-5.5]],"eye":[[3.5,32.75,-7.65],[-3.5,32.75,-7.65]],"face":[[0,31.75,-14]],"hand_secondary":[[4.5,5.25,-2.75],[6,5.25,0],[4.5,5.25,2.75],[2,5.25,5.5],[-4.5,5.25,-2.75],[-6,5.25,0],[-4.5,5.25,2.75],[-2,5.25,5.5]]},"geodude":{"root":[[0,0,0]],"middle":[[0,4,0]],"top":[[0,8.75,0]],"target":[[0,4.5,-8.25]],"special":[[-11.53,3.49,-4]],"hand_primary":[[-11.53,3.49,-4]],"physical":[[-11.53,3.49,-4]],"face":[[0,4.51,-4.49]],"hand_secondary":[[11.53,3.49,-4]]},"graveler":{"root":[[0,0,0]],"middle":[[0,11,-0.25]],"top":[[0,18.75,0]],"target":[[0,10.5,-11.5]],"special":[[-13.03,7.68,-9.55]],"hand_primary":[[-13.03,7.68,-9.55],[13.03,7.68,-9.55]],"physical":[[-13.03,7.68,-9.55]],"face":[[0,8.19,-7.93]],"hand_secondary":[[-8.28,0.52,-10.13],[8.28,0.52,-10.13]]},"golem":{"root":[[0,0,0]],"middle":[[0,18.2,-0.5]],"top":[[0,28.75,0]],"target":[[0,12.7,-21.75]],"special":[[-18.9,19.97,-7.95]],"hand_primary":[[-18.9,19.97,-7.95]],"physical":[[-18.9,19.97,-7.95]],"eye":[[4,14.61,-17.23],[-4,14.61,-17.23]],"face":[[0,13.58,-20.28]],"hand_secondary":[[19.31,20.45,-8.18]]},"ponyta":{"root":[[0,0,0]],"middle":[[0,10.5,-0.75]],"top":[[0,24.5,0]],"target":[[0,11.75,-11.5]],"special":[[0,17,-8.5]],"mouth":[[0,17,-8.5]],"physical":[[0,21.5,-6.5]],"eye":[[-2.5,20,-7.5],[2.5,20,-7.5]],"face":[[0,19.1,-11.15]]},"rapidash":{"root":[[0,0,0]],"middle":[[0,14.5,0]],"top":[[0,32,0]],"target":[[0,17,-15]],"special":[[0,24.1,-9.5]],"mouth":[[0,24.1,-9.5]],"physical":[[0,34.5,-9.9]],"eye":[[-3,27.63,-8.15],[3,27.63,-8.15]],"face":[[0,27,-13]]},"slowpoke":{"root":[[0,0,0]],"middle":[[0,6.5,0]],"top":[[0,22,0]],"target":[[0,6,-19.25]],"eye":[[3.45,6.5,-13],[-3.45,6.5,-13]],"face":[[0,6,-15]],"jaw_lower":[[0,3.75,-14.25]]},"slowbro":{"root":[[0,0,0]],"middle":[[0.26,13,0.03]],"top":[[0,27.25,-1.5]],"target":[[2.98,13.25,-10.11]],"special":[[-3.13,10.36,-7.93]],"hand_primary":[[-3.13,10.36,-7.93]],"physical":[[-3.13,10.36,-7.93]],"eye":[[4.59,20.37,-8.95],[-2.09,20.76,-8.69],[-2.58,14.07,6.96],[-7.87,12.95,6.64]],"face":[[1.09,19.01,-10.57]],"jaw_lower":[[0.99,16.22,-8.91]],"hand_secondary":[[7.18,10.36,-5.17]]},"magnemite":{"root":[[0,0,0]],"middle":[[0,5,0]],"top":[[0,13.5,0]],"target":[[0,5,-6]],"special":[[0,5,-4]],"physical":[[0,5,-4]],"eye":[[0,5,-4]],"face":[[0,5,-4]]},"magneton":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,25.5,0]],"target":[[0,11,-8]],"special":[[0,17,-4]],"physical":[[0,17,-4]],"eye":[[0,17,-4],[10,5,-4],[-10,5,-4]],"face":[[0,17,-4]]},"farfetchd":{"root":[[0,0,0]],"middle":[[0,7.5,-0.25]],"top":[[0,16.05,0.25]],"target":[[0,7.5,-9]],"special":[[10,7.75,-7]],"physical":[[10,7.75,-7]],"eye":[[-2,13.75,-2.5],[2,13.75,-2.5]],"face":[[0,13,-7.5]]},"doduo":{"root":[[0,0,0]],"middle":[[0,11.8,0]],"top":[[0,25.25,0]],"target":[[-1.17,14.8,-6.65]],"special":[[2.27,20.62,-13.13]],"physical":[[2.27,20.62,-13.13]],"eye":[[0.87,21.91,-7.16],[4.36,22.03,-7.39],[-7.02,20.18,-8.58],[-3.53,20.21,-8.72]],"face":[[2.25,21.11,-13.2]]},"dodrio":{"root":[[0,0,0]],"middle":[[0,12.85,0]],"top":[[0,31,0]],"target":[[4.02,14.6,-5.73]],"special":[[1.68,20.14,-18.79]],"physical":[[1.68,20.14,-18.79]],"eye":[[-5.93,17.76,-13.77],[-2.93,17.87,-13.68],[10.9,19.04,-6.21],[7.93,19.06,-5.76],[0.71,21.66,-11.82],[3.7,21.73,-12.07]],"face":[[1.65,20.89,-18.88]]},"seel":{"root":[[0,0,0]],"middle":[[0,6.33,-0.79]],"top":[[0,15.75,0]],"target":[[0,5.04,-16.5]],"special":[[0,8.28,-14.41]],"mouth":[[0,8.28,-14.41]],"hand_primary":[[-13.04,1.35,-3.17],[13.04,1.35,-3.17]],"physical":[[-13.04,1.35,-3.17]],"eye":[[2.4,12.49,-13.51],[-2.4,12.49,-13.51]],"face":[[0,11.47,-15.11]]},"dewgong":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,31,0]],"target":[[0,8,-18]],"special":[[0,1.75,-39.2]],"mouth":[[0,1.75,-39.2]],"hand_primary":[[-22.5,6,-14.25]],"physical":[[-22.5,6,-14.25]],"eye":[[3.4,7,-39.2],[-3.4,7,-39.2]],"face":[[0,4.7,-42.15]],"hand_secondary":[[22.5,6,-14.25]]},"grimer":{"root":[[0,0,0]],"top":[[0,21.5,0]],"eye":[[3.19,19.81,-8.45],[-2.35,19.76,-8.48]]},"muk":{"root":[[0,0,0]],"top":[[0,17.5,0]],"eye":[[5.28,15,-9.54],[-5.28,15,-9.54]]},"shellder":{"eye":[[-2.95,6.34,-4.69],[2.95,6.34,-4.69]]},"cloyster":{"eye":[[2.96,16.51,-13.04],[-3.04,16.45,-13.04]]},"gastly":{"root":[[0,0,0]],"middle":[[0,6.5,0.5]],"top":[[0,12,0.5]],"target":[[0,6,-6]],"special":[[0,3.25,-5]],"mouth":[[0,3.25,-5]],"physical":[[0,2.5,-23]],"eye":[[-3.25,6.75,-5.1],[3.25,6.75,-5.1]],"face":[[0,6.75,-5.2]]},"haunter":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,19,0]],"target":[[0,12,-10]],"special":[[0,8,-3]],"mouth":[[0,8,-3]],"hand_primary":[[-13,2,-10.5]],"physical":[[-13,2,-10.5]],"eye":[[-3.5,11.25,-8],[3.5,11.25,-8]],"face":[[0,11.25,-8]],"jaw_lower":[[0,8,-7.5]],"hand_secondary":[[13,2,-10.5]]},"gengar":{"root":[[0,0,0]],"middle":[[0,17,1]],"top":[[0,30.5,1]],"target":[[0,17,-11]],"special":[[0,14,-9]],"mouth":[[0,14,-9]],"hand_primary":[[-19,19.25,0]],"physical":[[-19,19.25,0]],"eye":[[-4.5,21.5,-9],[4.5,21.5,-9]],"face":[[0,20.5,-9]],"hand_secondary":[[19,19.25,0]]},"onix":{"root":[[0,0,0]],"middle":[[-0.34,48.75,0.86]],"top":[[0,84,0]],"target":[[-0.34,34.75,-7.14]],"special":[[0.66,42.56,-53.03]],"physical":[[0.66,42.56,-53.03]],"face":[[0.79,44.57,-64.73]]},"drowzee":{"root":[[0,0,0]],"middle":[[0,11.4,-1]],"top":[[0,23.5,-1]],"target":[[0,10.9,-9.5]],"special":[[0.12,14.6,-8.63]],"mouth":[[-0.03,16.52,-3.76]],"hand_primary":[[-6.85,12.59,-4.51]],"physical":[[-6.85,12.59,-4.51]],"eye":[[3.92,18.69,-4.91],[-4.12,18.41,-4.9]],"face":[[-0.06,17.27,-9.57]],"hand_secondary":[[6.94,12.68,-4.46]]},"hypno":{"root":[[0,0,0]],"middle":[[0,13,2]],"top":[[0,32,0]],"target":[[-0.57,13,-4.48]],"special":[[12.48,17.96,-11.79]],"mouth":[[-2.76,18.41,-4.7]],"hand_primary":[[-13.18,14.98,-3.21]],"physical":[[-13.18,14.98,-3.21]],"eye":[[-0.19,22.48,-6.47],[-5.63,21.83,-3.99]],"face":[[-3.48,21.02,-5.61]],"hand_secondary":[[8.4,24.93,-10.39]]},"krabby":{"eye":[[-1.91,7.99,-3.88],[1.73,7.99,-3.95]]},"kingler":{"eye":[[5.7,16.51,-9.74],[-4.55,16.73,-9.74]]},"voltorb":{"root":[[0,0,0]],"middle":[[0,5.5,0]],"top":[[0,11.25,0]],"target":[[0,5,-8]],"special":[[0,11,-2.5]],"physical":[[0,11,-2.5]],"eye":[[-2.25,6.75,-5.25],[2.25,6.75,-5.25]],"face":[[0,6.25,-6]]},"electrode":{"root":[[0,0,0]],"middle":[[0,9,0]],"top":[[0,18.25,0]],"target":[[0,8,-13]],"eye":[[-3,11,-9.3],[3,11,-9.3]],"face":[[0,10,-9]]},"exeggcute":{"root":[[0,0,0]],"middle":[[0,4,0]],"top":[[0,7.25,0]],"target":[[0,4,-12]],"special":[[0,7,-1]],"mouth":[[0,2.25,-3]],"physical":[[0,7,-1]],"face":[[0,3.5,-3],[-7,3.5,-9],[7,3.5,-9],[8,3.5,-1],[-8,3.5,-1],[0,3.5,5]]},"exeggutor":{"root":[[0,0,0]],"middle":[[0,23,0]],"top":[[0,63,0]],"target":[[0,21,-20]],"special":[[0.4,30.24,-21.69]],"mouth":[[0.4,30.24,-21.69],[16.96,31.13,-14.74],[-15.29,33.47,-14.03]],"physical":[[0.4,30.24,-21.69]],"eye":[[-1.62,35.82,-22.83],[3.36,35.38,-22.82],[15.99,36.06,-17.19],[19.82,35.87,-13.97],[-12.61,38.3,-17.25],[-18.18,38.99,-12.58]],"face":[[0.78,34.56,-22.47],[17.43,33.97,-15.13],[-15.33,36.34,-14.5]]},"cubone":{"root":[[0,0,0]],"middle":[[0,6,0]],"top":[[0,15.7,0]],"target":[[0,5,-5]],"special":[[-6.75,11.5,-1]],"hand_primary":[[-6.25,7,0]],"physical":[[-6.75,11.5,-1]],"eye":[[3,10.75,-1.75],[-3,10.75,-1.75]],"face":[[0,10.5,-6.5]],"jaw_lower":[[0,8.6,-5]],"hand_secondary":[[6.25,7,0]]},"marowak":{"root":[[0,0,0]],"middle":[[0,9,0]],"top":[[0,22,0]],"target":[[0,9.25,-5.75]],"special":[[-12,11,-6]],"hand_primary":[[-12.5,11.5,0]],"physical":[[-12,11,-6]],"eye":[[4,17,-3.5],[-4,17,-3.5]],"face":[[0,16.75,-9]],"jaw_lower":[[0,13.35,-7]],"hand_secondary":[[12.5,11.5,0]]},"hitmonlee":{"root":[[0,0,0]],"middle":[[0,14.85,0]],"top":[[0,25.5,0]],"target":[[0,16.6,-5.5]],"special":[[-13.94,15.62,5.42]],"hand_primary":[[-13.94,15.62,5.42]],"physical":[[-13.94,15.62,5.42]],"face":[[0.59,18.81,-3.59]],"hand_secondary":[[6.35,16.57,-8.98]]},"hitmonchan":{"root":[[0,0,0]],"middle":[[0,18,0]],"top":[[0,31,0]],"target":[[0,19,-6]],"special":[[-4.88,17.08,-12]],"hand_primary":[[-4.88,17.08,-12]],"physical":[[-4.88,17.08,-12]],"face":[[0.6,22.09,-4.89]],"hand_secondary":[[6.88,18.64,-7.3]]},"lickitung":{"root":[[0,0,0]],"middle":[[0,12,0.25]],"top":[[0,25.7,0]],"target":[[0,12,-10.25]],"special":[[-1.05,11.67,-12.7]],"mouth":[[-0.1,17.51,-5.44]],"hand_primary":[[-9.74,12.97,-2.51]],"physical":[[-1.05,11.67,-12.7]],"eye":[[4.4,21.57,-7.35],[-3.71,22.59,-6.7]],"face":[[0.09,21.62,-9.48]],"hand_secondary":[[9.74,12.97,-2.51]]},"koffing":{"root":[[0,0,0]],"middle":[[0,10.7,0]],"top":[[0,21,0]],"target":[[-0.11,9.81,-11.23]],"eye":[[2.68,15.2,-7.19],[-2.82,15.2,-7.13]],"face":[[-0.07,14.2,-7.13]]},"weezing":{"root":[[0,0,0]],"middle":[[0,11.01,0.12]],"top":[[0,22.5,0]],"target":[[1.9,8.29,-10.73]],"eye":[[-0.85,13.04,-8.59],[-7.48,13.13,-8.44],[11.93,14.04,-1.39],[8.3,14.22,-4.11]],"face":[[-4.17,12.58,-8.35]]},"rhyhorn":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,25.5,0]],"target":[[0,6.75,-31]],"special":[[-0.02,12.88,-27.5]],"mouth":[[0.03,6.14,-15.27]],"physical":[[-0.02,12.88,-27.5]],"eye":[[5.02,8.07,-21.44],[-4.98,7.98,-21.45]],"face":[[0.04,6.2,-26.1]],"jaw_lower":[[0.06,3.98,-19.85]]},"rhydon":{"root":[[0,0,0]],"middle":[[0.28,17,-1.98]],"top":[[0,38,0]],"target":[[2.23,17,-15.84]],"special":[[0.42,37.43,-25.79]],"mouth":[[0.69,26.24,-11.7]],"hand_primary":[[-15.3,15.05,-16.18]],"physical":[[0.42,37.43,-25.79]],"face":[[0.49,28.33,-19.94]],"hand_secondary":[[18.74,14.4,-9.64]]},"chansey":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,22,0]],"target":[[0,11,-14]],"special":[[-0.08,16.1,-8.53]],"mouth":[[-0.08,16.1,-8.53]],"hand_primary":[[-3.34,10.44,-10.75]],"physical":[[0,11,-14]],"eye":[[2.17,18.1,-8.63],[-2.33,18.1,-8.59]],"face":[[-0.08,18.6,-8.63]],"hand_secondary":[[3.13,10.44,-10.81]]},"tangela":{"eye":[[-2,5.2,-3.1],[2,5.2,-3.1]]},"kangaskhan":{"root":[[0,0,0]],"middle":[[0,25.1,0]],"top":[[0,54,0]],"target":[[0,31.1,-18]],"special":[[0,39.89,-11.78]],"mouth":[[0,39.89,-11.78]],"hand_primary":[[-23.12,25.01,-12.55]],"physical":[[-23.12,25.01,-12.55]],"eye":[[6.5,44.1,-16.73],[-6.5,44.1,-16.73],[2,21.67,-20.38],[-2,21.67,-20.38]],"face":[[0,41.93,-21.46]],"hand_secondary":[[23.12,25.01,-12.55]]},"horsea":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,21,0]],"target":[[0,9,-6]],"special":[[0,14.5,-8]],"mouth":[[0,14.5,-8]],"physical":[[0,-3.5,-0.5]],"eye":[[-2.9,17,-5],[2.9,17,-5]],"face":[[0,17,-8.5]]},"seadra":{"root":[[0,0,0]],"middle":[[0,13.5,1.5]],"top":[[0,25,0]],"target":[[0,12.25,-6]],"mouth":[[0,19.5,-12]],"eye":[[-2.5,21.25,-4.5],[2.5,21.25,-4.5]],"face":[[0,21.25,-10.25]]},"goldeen":{"root":[[0,0,0]],"middle":[[0,5,-2.5]],"top":[[0,11,-2]],"target":[[0,5,-14]],"special":[[0,4.13,-11.26]],"mouth":[[0,4.13,-11.26]],"hand_primary":[[-9.96,0.32,-7.22]],"physical":[[0,11.95,-8.68]],"eye":[[-4.5,4.76,-8.88],[4.5,4.76,-8.88]],"face":[[0,4.45,-11.73]],"hand_secondary":[[9.96,0.32,-7.22]]},"seaking":{"root":[[0,0,0]],"middle":[[0,11,-1.5]],"top":[[0,22,0]],"target":[[0,10,-19.75]],"special":[[0,8.79,-16.53]],"mouth":[[0,8.79,-16.53]],"hand_primary":[[-12.07,1.29,-6.08]],"physical":[[0,20.13,-22.03]],"eye":[[-8.5,12.78,-10.57],[8.5,12.78,-10.57]],"face":[[0,11.7,-17.42]],"hand_secondary":[[12.07,1.29,-6.08]]},"staryu":{"eye":[[0,8.2,-4.25]]},"starmie":{"special":[[0,12.77,-8.49]],"eye":[[0,12.77,-8.49]]},"mrmime":{"eye":[[1.5,29.5,-3.5],[-1.5,29.5,-3.5]]},"scyther":{"root":[[0,0,0]],"middle":[[0,24,0]],"top":[[0,39,0]],"target":[[-0.78,24,-4.43]],"special":[[-1.82,17.51,-17.57]],"mouth":[[-1.82,17.51,-17.57]],"physical":[[-13.37,17.48,-18.77]],"eye":[[0.08,19.14,-20.08],[-3.91,19.35,-19.76]],"face":[[-2.18,17.06,-21.76]]},"jynx":{"root":[[0,0,0]],"middle":[[0,16,0]],"top":[[0,32,0]],"target":[[0,16,-8]],"special":[[0,21,-8]],"mouth":[[0,21,-8]],"hand_primary":[[-22,15.5,-1]],"physical":[[-22,15.5,-1]],"eye":[[3,24.7,-6.7],[-3,24.7,-6.7]],"face":[[0,23,-7]],"hand_secondary":[[22,15.5,-1]]},"electabuzz":{"root":[[0,0,0]],"middle":[[0,12.45,0]],"top":[[0,29,0]],"target":[[0,14.45,-7]],"special":[[5.54,25.06,-4.08],[-5.54,25.06,-4.08]],"mouth":[[0,16.89,-6.35]],"hand_primary":[[-14.39,11.55,-5.26]],"physical":[[-15.52,10.21,-6.37]],"eye":[[2,19.22,-7.9],[-2,19.22,-7.9]],"face":[[0,18.66,-8.33]],"hand_secondary":[[14.39,11.55,-5.26]]},"magmar":{"root":[[0,0,0]],"middle":[[0,14,0]],"top":[[0,28,0]],"target":[[0,15,-6.5]],"special":[[0,21,-5.5]],"mouth":[[0,21,-5.5]],"hand_primary":[[-15,17,0]],"physical":[[-15,17,0]],"eye":[[-1.75,22.5,-4.5],[1.75,22.5,-4.5]],"face":[[0,22.5,-7.5]],"hand_secondary":[[15,17,0]]},"pinsir":{"root":[[0,0,0]],"middle":[[0,15,0]],"top":[[0,34.5,0]],"target":[[0,16,-9]],"special":[[-0.08,14.84,-8.28]],"mouth":[[-0.08,14.84,-8.28]],"hand_primary":[[-22.97,13.46,-7.66]],"physical":[[6.42,33.38,-5.46],[-6.16,33.49,-5.24]],"eye":[[2.81,20.23,-9.41],[-2.92,20.28,-9.31]],"face":[[-0.07,18.95,-9.36]],"hand_secondary":[[22.79,13.06,-8.46]]},"tauros":{"eye":[[-2.75,19.75,-19],[2.75,19.75,-19]]},"magikarp":{"eye":[[-2.66,6.82,-3.21],[-2.66,11.74,-4.53]]},"gyarados":{"root":[[0,0,0]],"middle":[[-13.31,13.16,-6.07]],"top":[[0,55,0]],"target":[[-14.79,14.68,-12.74]],"special":[[-11.81,35.35,-19.27]],"mouth":[[-11.81,35.35,-19.27]],"physical":[[28.15,2.14,-11.2]],"eye":[[-15.46,45.07,-19.05],[-7.96,44.99,-19.03]],"face":[[-11.73,42.07,-23.34]]},"lapras":{"root":[[0,0,0]],"middle":[[0,13.88,0.42]],"top":[[0,45.2,-6]],"target":[[0,16.97,-24.47]],"special":[[-0.48,34.24,-20.26]],"mouth":[[-0.48,34.24,-20.26]],"physical":[[-0.51,45.66,-23.17]],"eye":[[-5.98,39.67,-20.33],[5.02,39.66,-20.45]],"face":[[-0.56,39.14,-27.79]],"jaw_lower":[[-0.53,35.51,-24.88]]},"ditto":{"root":[[0,0,0]],"middle":[[0,5.5,0]],"top":[[0,10.5,0]],"target":[[0,5.5,-4]],"special":[[0,6.4,-2]],"mouth":[[0,6.4,-2]],"hand_primary":[[-6,6.2,-0.5]],"physical":[[-6,6.2,-0.5]],"face":[[0,7.7,-2]],"hand_secondary":[[6,6.2,-0.5]]},"eevee":{"root":[[0,0,0]],"middle":[[0,9,0]],"top":[[0,18,0]],"target":[[0,7.5,-11]],"special":[[0,9.65,-7.1]],"mouth":[[0,9.65,-7.1]],"physical":[[0,9.65,-7.1]],"eye":[[2.4,12.45,-6.7],[-2.4,12.45,-6.7]],"face":[[0,12.45,-6.75]]},"vaporeon":{"root":[[0,0,0]],"middle":[[0,12.4,0]],"top":[[0,22.4,0]],"target":[[0,9.4,-15]],"special":[[0,14.1,-11.6]],"mouth":[[0,14.1,-11.6]],"physical":[[0,14.1,-11.6]],"eye":[[-2,17.15,-11],[2,17.15,-11]],"face":[[0,16.9,-11]]},"jolteon":{"root":[[0,0,0]],"middle":[[0,13.1,0]],"top":[[0,22.1,0]],"target":[[0,9.1,-15]],"special":[[0,13.8,-11.6]],"mouth":[[0,15.1,-11]],"physical":[[0,13.8,-11.6]],"eye":[[-2,18.35,-11],[2,18.35,-11]],"face":[[0,18.1,-11]]},"flareon":{"root":[[0,0,0]],"middle":[[0,12.9,0]],"top":[[0,21.9,0]],"target":[[0,8.9,-16]],"special":[[0,13.45,-12.29]],"mouth":[[0,13.45,-12.29]],"physical":[[0,13.45,-12.29]],"eye":[[-2,16.65,-12],[2,16.65,-12]],"face":[[0,16.4,-12]]},"porygon":{"root":[[0,0,0]],"middle":[[0,10.43,0.2]],"top":[[0,23.7,0]],"target":[[0,8.72,-6.62]],"special":[[0,12.88,-12.01]],"physical":[[0,12.88,-12.01]],"eye":[[3.5,17.43,-4.19],[-3.5,17.43,-4.19]],"face":[[0,13.73,-12.44]]},"omanyte":{"root":[[0,0,0]],"middle":[[0,5.16,2.21]],"top":[[0,11.5,0]],"target":[[0,4.69,-4.32]],"face":[[0,2.86,-2.4]]},"omastar":{"root":[[0,0,0]],"middle":[[0,6.05,3.22]],"top":[[0,17.75,1]],"target":[[0,7.29,-3.16]],"mouth":[[0,2.74,-2.01]],"face":[[0,5.04,-2.07]]},"kabuto":{"root":[[0,0,0]],"middle":[[0,2.25,0]],"top":[[0,5.5,0]],"target":[[0,2,-6]],"eye":[[1.5,1,-3],[-1.5,1,-3]],"face":[[0,1,-3]]},"kabutops":{"root":[[0,0,0]],"middle":[[0.11,15.83,-0.02]],"top":[[0,29.25,0]],"target":[[-2.97,15.33,-4.86]],"eye":[[1.78,15.16,-9.68],[-4.75,14.77,-9.62]]},"aerodactyl":{"root":[[0,0,0]],"middle":[[-0.6,17,-1.91]],"top":[[0,26,0]],"target":[[-12.33,14,-39.1]],"special":[[-3.97,24.07,-27.64]],"mouth":[[-3.99,26.15,-19.77]],"hand_primary":[[-46.31,27.92,-19.91],[-46.48,28.21,-20.88]],"physical":[[-3.91,23.91,-36.65]],"eye":[[1.13,29.48,-27],[-8.86,29.68,-27.07]],"face":[[-3.84,27.37,-37.4]],"jaw_lower":[[-4.01,20.79,-31.67]],"hand_secondary":[[37.38,29.96,-32.45],[37.13,30.23,-33.16]]},"snorlax":{"root":[[0,0,0]],"middle":[[0,25,0]],"top":[[0,57,0]],"target":[[0,28,-18.25]],"mouth":[[0,42.44,-10.5]],"hand_primary":[[-27.12,20.93,-2.08]],"eye":[[-5,45.92,-10.93],[5,45.92,-10.93]],"face":[[0,45.42,-10.87]],"hand_secondary":[[27.12,20.93,-2.08]]},"articuno":{"root":[[0,0,0]],"middle":[[0,34,0]],"top":[[0,60,0]],"target":[[0,14,-25]],"special":[[0,24,-41]],"mouth":[[0,24,-41]],"physical":[[0,25,-45]],"eye":[[3.4,27.75,-41],[-3.4,27.75,-41]],"face":[[0,27.4,-43]]},"zapdos":{"root":[[0,0,0]],"middle":[[0,25,0]],"top":[[0,44,0]],"target":[[0,5,-28]],"special":[[0,20.7,-28.5]],"mouth":[[0,20.7,-28.5]],"physical":[[0,21.25,-51.5]],"eye":[[2.25,22.75,-28.5],[-2.25,22.75,-28.5]],"face":[[0,22.3,-31.5]]},"moltres":{"root":[[0,0,0]],"middle":[[0,34,0]],"top":[[0,84,0]],"target":[[0,5,-23]],"special":[[0,22.7,-42]],"mouth":[[0,22.7,-42]],"physical":[[0,23.25,-56.5]],"eye":[[-3.35,24.8,-42],[3.35,24.8,-42]],"face":[[0,25.2,-47.5]]},"dratini":{"root":[[0,0,0]],"middle":[[0,9.74,-5.06]],"top":[[0,22,0]],"target":[[0,13.74,-16.06]],"special":[[-0.03,16.97,-12.26]],"mouth":[[-0.03,16.97,-12.26]],"physical":[[-0.08,24.98,-11.06]],"face":[[-0.06,21.92,-11.85]]},"dragonair":{"root":[[0,0,0]],"middle":[[0,17.57,-0.35]],"top":[[0,38,0]],"target":[[0,17.57,-7.6]],"special":[[0.05,42.34,-4.71]],"mouth":[[0.01,35.02,-1.87]],"physical":[[-24.67,24.92,24.63]],"eye":[[3.03,38.41,-1.9],[-2.97,38.45,-1.88]],"face":[[0.02,37.91,-4.89]]},"dragonite":{"root":[[0,0,0]],"middle":[[0,24.4,0]],"top":[[0,56,0]],"target":[[0,24.4,-9]],"special":[[-0.27,39.12,-18.41]],"mouth":[[-0.22,39.31,-12.89]],"hand_primary":[[-17.56,31.67,-8.5]],"physical":[[-17.56,31.67,-8.5]],"face":[[-0.26,45.32,-17.17]],"hand_secondary":[[18.73,30.59,-7.28]]},"mewtwo":{"root":[[0,0,0]],"middle":[[0,26,0]],"top":[[0,38,0]],"target":[[0,24,-5]],"special":[[-21.3,31.75,1.15]],"mouth":[[0,36.65,-3.95]],"hand_primary":[[-21.3,31.75,1.15]],"physical":[[0,17.45,71.7]],"eye":[[-2.5,39.65,-3.95],[2.5,39.65,-3.95]],"face":[[0,39.65,-4]],"hand_secondary":[[21.3,31.75,1.15]]},"mew":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,25,0]],"target":[[0,9,-5]],"special":[[0,13,-10]],"mouth":[[0,14.5,-4]],"hand_primary":[[-5.3,13.25,-0.5]],"physical":[[0,3.75,57.5]],"eye":[[-3,17.7,-4],[3,17.7,-4]],"face":[[0,18,-4]],"hand_secondary":[[5.3,13.25,-0.5]]},"chikorita":{"root":[[0,0,0]],"middle":[[0,8,-0.75]],"top":[[0,18,0]],"target":[[0,9,-9]],"special":[[0.19,22.28,6.96]],"mouth":[[0.06,11.06,-6.07]],"physical":[[-8.16,16.32,-12.46]],"eye":[[2.44,13.88,-5.91],[-2.26,13.93,-5.92]],"face":[[0.08,13.06,-6.03]]},"bayleef":{"root":[[0,0,0]],"middle":[[0,9.75,-1]],"top":[[0,27.25,0]],"target":[[0,14,-12.25]],"special":[[0.03,29.28,-12.56]],"mouth":[[0.15,16.15,-13]],"physical":[[-10.87,18.51,-20.16]],"eye":[[-3.4,18.88,-14.19],[3.5,18.99,-14.34]],"face":[[0.06,18.47,-16.8]]},"meganium":{"root":[[0,0,0]],"middle":[[0,16.8,0]],"top":[[0,51.75,-0.5]],"target":[[0,30.8,-21]],"special":[[0.4,37.43,-25.18]],"mouth":[[0.4,37.43,-25.18]],"physical":[[0.4,37.43,-25.18]],"face":[[0.31,39.92,-30.8]]},"cyndaquil":{"root":[[0,0,0]],"middle":[[0.21,9.75,1.49]],"top":[[0,22.25,0]],"target":[[-1.25,7,-8.91]],"hand_primary":[[-1.66,4.68,-4.39]],"eye":[[-4.6,14.53,-7.72],[4.39,14.74,-7.73]],"face":[[-0.06,12.71,-14.69]],"hand_secondary":[[1.88,4.73,-4.54]]},"quilava":{"root":[[0,0,0]],"middle":[[0.81,8,0.34]],"top":[[0,13,0]],"target":[[5.41,8,-20.41]],"special":[[2.02,13.86,-11.4]],"hand_primary":[[-2.27,0.95,-6.42]],"physical":[[1.91,10.5,-14.16]],"eye":[[-2.29,6.11,-13.07],[5.7,5.78,-12.98]],"face":[[1.75,6,-16.98]],"hand_secondary":[[4.82,0.92,-2.92]]},"typhlosion":{"root":[[0,0,0]],"middle":[[0.49,27,2.2]],"top":[[0,43,0]],"target":[[-3.03,23.25,-13.67]],"special":[[-0.09,32.49,-15.9]],"mouth":[[-0.09,32.49,-15.9]],"hand_primary":[[-8.14,19.5,-3.39]],"physical":[[-8.14,19.5,-3.39]],"eye":[[-5.04,34.34,-19.24],[4.96,34.31,-19.11]],"face":[[0.02,35.67,-24.03]],"hand_secondary":[[7.37,19.5,-5.9]]},"totodile":{"root":[[0,0,0]],"middle":[[0,9,0]],"top":[[0,23,0]],"target":[[0,9.5,-8]],"special":[[1.66,15.31,-5.91]],"mouth":[[1.66,15.31,-5.91]],"hand_primary":[[-8.29,13.31,-1.22]],"physical":[[-8.29,13.31,-1.22]],"eye":[[-2.45,18.89,-4.15],[6.44,17.6,-3.72]],"face":[[2.3,17.35,-12.88]],"hand_secondary":[[10.2,11.04,0.16]]},"croconaw":{"root":[[0,0,0]],"middle":[[0,13,0.75]],"top":[[0,30.75,0]],"target":[[0,13,-10.75]],"special":[[-1.05,22.05,-11.81]],"mouth":[[-1.05,22.05,-11.81]],"hand_primary":[[-11.38,14.54,-5.98]],"physical":[[-11.38,14.54,-5.98]],"eye":[[-6.93,26.38,-9.95],[3.98,27.56,-10.72]],"face":[[-1.78,25.76,-16.48]],"hand_secondary":[[11.1,15.82,-5.86]]},"feraligatr":{"root":[[0,0,0]],"middle":[[0,18.75,1.25]],"top":[[0,33.75,0]],"target":[[0,18,-11]],"special":[[0.2,24.63,-19.71]],"mouth":[[0.2,24.63,-19.71]],"hand_primary":[[-15.37,14.77,-20.03],[16.44,15.55,-19.86]],"physical":[[0.2,24.63,-19.71]],"face":[[0.24,28.25,-28.76]]},"sentret":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,22,0]],"target":[[0,8,-6.5]],"special":[[0,3.5,13.25]],"hand_primary":[[-10,8,0]],"physical":[[0,3.5,13.25]],"eye":[[-1.5,12.5,-4.5],[1.5,12.5,-4.5]],"face":[[0,12.5,-4.5]],"hand_secondary":[[10,8,0]]},"furret":{"root":[[0,0,0]],"middle":[[0,12,-2.5]],"top":[[0,22.75,0]],"target":[[0,12,-11]],"special":[[0,5,13]],"mouth":[[0,3.75,-21]],"hand_primary":[[-2,-0.5,-9]],"physical":[[0,5,13]],"eye":[[2.5,6,-21],[-2.5,6,-21]],"face":[[0,5.5,-21]],"hand_secondary":[[2,-0.5,-9]]},"hoothoot":{"root":[[0,0,0]],"middle":[[0,9,0]],"top":[[0,15,0]],"target":[[0,8,-7.5]],"special":[[-0.2,9.9,-7.27]],"physical":[[-0.2,9.9,-7.27]],"face":[[-0.21,11.65,-7.35]]},"noctowl":{"root":[[0,0,0]],"middle":[[0,15.5,0]],"top":[[0,32,0]],"target":[[0,16.5,-9]],"special":[[-0.47,15.98,-15.85]],"mouth":[[-0.47,15.98,-15.85]],"physical":[[-0.18,16.85,-17.02]],"eye":[[2.76,17.39,-15.5],[-2.28,19.01,-15.53]],"face":[[0.28,18.28,-17.13]]},"ledyba":{"root":[[0,0,0]],"middle":[[0,9.05,1.43]],"top":[[0,15,0]],"target":[[0,20.92,-6]],"special":[[0,14.37,1.98]],"mouth":[[0,12.85,-4.68]],"hand_primary":[[-9.73,11.42,-5.68],[-10.1,6.91,-3.45]],"physical":[[-9.73,11.42,-5.68]],"face":[[0,14.5,-8.72]],"jaw_lower":[[0,12.79,-7.18]],"hand_secondary":[[10.53,11.53,-5.1],[8.72,6.43,-4.28]]},"ledian":{"root":[[0,0,0]],"middle":[[0.8,8.85,2.23]],"top":[[0,29,0]],"target":[[-1.49,9.85,-1.05]],"special":[[-1.49,9.85,-1.05]],"mouth":[[-0.35,12.61,-4.3]],"hand_primary":[[-7.04,12.05,3.51],[-6.06,7.32,2.27]],"physical":[[-7.04,12.05,3.51]],"face":[[-0.29,15.35,-5.5]],"hand_secondary":[[4.85,11.43,-6.1],[5.58,6.57,-4.96]]},"spinarak":{"root":[[0,0,0]],"middle":[[0,4.78,-0.36]],"top":[[0,9,0]],"target":[[0,2.65,-11.18]],"special":[[-0.07,2.07,-7.23]],"mouth":[[-0.07,2.07,-7.23]],"physical":[[-0.07,2.07,-7.23]],"eye":[[2.46,3.77,-6.02],[-2.54,3.82,-5.96]],"face":[[-0.06,3.55,-7.47]]},"ariados":{"root":[[0,0,0]],"middle":[[0,7.81,-0.02]],"top":[[0,22,0]],"target":[[0,6.14,-14.68]],"special":[[-0.02,3.16,-10.43]],"mouth":[[-0.02,3.16,-10.43]],"physical":[[-0.02,3.16,-10.43]],"eye":[[2.53,5.22,-8.46],[-2.47,5.27,-8.38]],"face":[[0,4.89,-10.66]]},"crobat":{"root":[[0,0,0]],"middle":[[0.29,36.11,0]],"top":[[0,42,0]],"target":[[0.29,30.24,-6.17]],"special":[[0.29,32.17,-3.88]],"mouth":[[0.29,32.17,-3.88]],"physical":[[0.29,32.17,-3.88]],"eye":[[3.44,35.23,-6.46],[-2.86,35.23,-6.46]],"face":[[0.29,34.46,-5.81]]},"chinchou":{"root":[[0,0,0]],"middle":[[0,5,0]],"top":[[0,10,0]],"target":[[0,6,-10]],"special":[[10.12,6.67,-16.74],[-10.24,6.64,-16.73]],"physical":[[0.04,9.17,-2.86]],"eye":[[4.33,5.07,-7.37],[-4.18,5.07,-7.43]],"face":[[0.07,4.6,-7.35]]},"lanturn":{"root":[[0,0,0]],"middle":[[0,8,-2.75]],"top":[[0,20.75,0]],"target":[[0,10,-23]],"special":[[0.13,9.34,-24.97],[-0.06,16.86,-3.9]],"mouth":[[0.09,2.5,-18.88]],"physical":[[0.07,10.76,-17.41]],"eye":[[5.07,5.8,-16.74],[-4.93,5.79,-16.82]],"face":[[0.09,5.48,-19.26]]},"pichu":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,20,0]],"target":[[0,8,-4.75]],"special":[[-4.41,7.3,-4.88],[4.58,6.88,-4.78]],"mouth":[[0.08,7.09,-4.84]],"hand_primary":[[-5.12,4.22,-0.77]],"physical":[[-5.12,4.22,-0.77]],"eye":[[2.65,9.51,-5.02],[-2.25,9.74,-5.07]],"face":[[0.13,8.08,-4.94]],"hand_secondary":[[5.08,4.04,-0.73]]},"cleffa":{"root":[[0,0,0]],"middle":[[0,7,0]],"top":[[0,15.5,0]],"target":[[0,7,-6]],"special":[[0,7,-4.4]],"mouth":[[0,7,-4.4]],"hand_primary":[[-4.25,5,-6.75]],"physical":[[-4.25,5,-6.75]],"face":[[0,8.85,-4.4]],"hand_secondary":[[4.25,5,-6.75]]},"igglybuff":{"root":[[0,0,0]],"middle":[[0,7.5,0]],"top":[[0,15,0]],"target":[[0,6,-5.5]],"special":[[0,4.5,-4.5]],"mouth":[[0,4.5,-4.5]],"hand_primary":[[-5,3,-5.9]],"physical":[[-5,3,-5.9]],"face":[[0,6.5,-4.5]],"hand_secondary":[[5,3,-5.9]]},"togepi":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,16.65,0]],"target":[[0,8,-7]],"special":[[0,11.7,-5.5]],"mouth":[[0,11.7,-5.5]],"physical":[[0,13.5,-4.1]],"eye":[[1.75,12.95,-5.5],[-1.75,12.95,-5.5]],"face":[[0,11.85,-5.5]]},"togetic":{"root":[[0,0,0]],"middle":[[0,10.95,0]],"top":[[0,25.6,0.8]],"target":[[0,10.95,-5]],"special":[[-0.52,15.19,-6.06]],"mouth":[[-0.52,15.19,-6.06]],"hand_primary":[[-6.75,8.99,0.22]],"physical":[[-6.75,8.99,0.22]],"eye":[[1.36,17.21,-6.75],[-2.24,17.28,-6.95]],"face":[[-0.46,16.83,-6.69]],"hand_secondary":[[5.07,9.45,-3.89]]},"natu":{"root":[[0,0,0]],"middle":[[0,5.5,0]],"top":[[0,9.5,0]],"target":[[0,5,-9]],"special":[[0,5.25,-7]],"physical":[[0,5.25,-7]],"eye":[[3,6.25,-4],[-3,6.25,-4]],"face":[[0,5,-7]]},"xatu":{"root":[[0,0,0]],"middle":[[0,15,0]],"top":[[0,29.5,0]],"target":[[0,17,-9]],"special":[[0,25.25,-9.3]],"physical":[[0,25.25,-9.3]],"eye":[[3,26,-3.75],[-3,26,-3.75]],"face":[[0,26,-9.25]]},"mareep":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,14.25,0]],"target":[[0,7,-12]],"special":[[-1.14,20.17,9.99]],"physical":[[0,11.32,-9.75]],"eye":[[2,9.55,-10.12],[-2,9.55,-10.12]],"face":[[0,9.35,-12.39]]},"flaaffy":{"root":[[0,0,0]],"middle":[[0,11.75,0]],"top":[[0,24,0]],"target":[[0,13,-9.5]],"special":[[-9.63,11.8,6.69]],"mouth":[[1.23,16.9,-7.84]],"hand_primary":[[-1.5,9.61,-5.55]],"physical":[[-1.5,9.61,-5.55]],"eye":[[4.22,19.32,-5.57],[-0.67,20.34,-5.71]],"face":[[1.95,20.29,-8.38]],"hand_secondary":[[3,9.43,-5.62]]},"ampharos":{"root":[[0,0,0]],"middle":[[0,16.09,-0.22]],"top":[[0,40.75,0]],"target":[[0,19.89,-9.3]],"special":[[-12.84,25.99,13.48]],"hand_primary":[[-12.05,16.81,2.4]],"physical":[[-12.05,16.81,2.4]],"eye":[[2.29,36.9,-4.78],[-4.61,35.67,-4.45]],"face":[[-1.15,35.05,-8.95]],"hand_secondary":[[12,16.24,-2.54]]},"bellossom":{"root":[[0,0,0]],"middle":[[-0.01,8.88,0]],"top":[[0,18.25,0]],"target":[[-0.01,8.88,-6.5]],"special":[[-0.07,12.23,-3.82]],"mouth":[[-0.06,12.21,-3.32]],"hand_primary":[[-5.24,10.92,-4.19]],"physical":[[-5.24,10.92,-4.19]],"eye":[[1.8,13.85,-3.31],[-1.89,13.88,-3.24]],"face":[[-0.04,13.96,-3.27]],"hand_secondary":[[5.76,10.15,-2.87]]},"marill":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,17.35,0]],"target":[[0,8,-8]],"special":[[0,10.25,-6.5]],"mouth":[[0,10.25,-6.5]],"hand_primary":[[-6.2,8,-8]],"physical":[[0,2.5,29]],"eye":[[3,12.25,-6.45],[-3,12.25,-6.45]],"face":[[0,12.25,-6.5]],"hand_secondary":[[6.2,8,-8]]},"azumarill":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,21.35,0]],"target":[[0,10,-8]],"special":[[0,13.25,-6]],"mouth":[[0,13.25,-6]],"hand_primary":[[-12,9,0]],"physical":[[0,4,27.5]],"eye":[[3,15.5,-5.95],[-3,15.5,-5.95]],"face":[[0,15.5,-6]],"hand_secondary":[[12,9,0]]},"sudowoodo":{"root":[[0,0.5,0]],"middle":[[0,19,0]],"top":[[0,37,0]],"target":[[0,19.5,-6]],"special":[[2.34,22.59,-4.23]],"mouth":[[2.34,22.59,-4.23]],"hand_primary":[[-9.35,24.9,-1]],"physical":[[-9.35,24.9,-1]],"eye":[[3.67,25.67,-4.12],[0.67,25.5,-4.15]],"face":[[2.21,24.83,-4.16]],"hand_secondary":[[14.09,17.67,-0.34]]},"politoed":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,26,0]],"target":[[0,11,-6.5]],"special":[[0,14.75,-4]],"mouth":[[0,14.75,-4]],"hand_primary":[[-13,12.25,0]],"physical":[[0,15,-20.5]],"eye":[[4.5,18,-4.5],[-4.5,18,-4.5]],"face":[[0,17.5,-6.5]],"hand_secondary":[[13,12.25,0]]},"hoppip":{"root":[[0,0,0]],"middle":[[0,4.5,0]],"top":[[0,15,0]],"target":[[0,4.5,-6]],"special":[[0,3.5,-4.5]],"mouth":[[0,3.5,-4.5]],"hand_primary":[[-3.87,1.49,-5.14]],"physical":[[0,7.5,-4.5]],"eye":[[-2.5,5.25,-4.5],[2.5,5.25,-4.5]],"face":[[0,4.5,-6]],"hand_secondary":[[3.87,1.49,-5.14]]},"skiploom":{"root":[[0,0,0]],"middle":[[0,6.1,0]],"top":[[0,15,0]],"target":[[0,6.1,-6.5]],"special":[[-0.14,5.9,-5.5]],"mouth":[[-0.14,5.9,-5.5]],"hand_primary":[[-5.13,2.75,-6.43]],"physical":[[-0.14,10.1,-5.5]],"eye":[[3.36,8.1,-5.59],[-3.63,8.1,-5.42]],"face":[[-0.14,7.1,-5.5]],"hand_secondary":[[4.81,2.75,-6.68]]},"jumpluff":{"root":[[0,0,0]],"middle":[[0.53,6,0]],"top":[[0,19,0]],"target":[[0.56,6,-6]],"special":[[0.52,5.17,-3.87]],"mouth":[[0.52,5.17,-3.87]],"hand_primary":[[7.96,5.22,-5.27],[-6.88,5.7,-5.35]],"physical":[[0.74,14.31,-2.69]],"eye":[[2.57,6.6,-3.79],[-1.43,6.73,-3.81]],"face":[[0.57,6.67,-3.8]]},"aipom":{"root":[[0,0,0]],"middle":[[0,10.5,0]],"top":[[0,24,0]],"target":[[0,10,-5]],"special":[[0,7,34]],"mouth":[[0,14.25,-4]],"hand_primary":[[0,7,34]],"physical":[[0,7,34]],"eye":[[3,17.5,-4],[-3,17.5,-4]],"face":[[0,16,-4]],"hand_secondary":[[9,11.5,0],[-9,11.5,0]]},"sunkern":{"root":[[0,0,0]],"middle":[[-0.57,3,0.07]],"top":[[0,9,0]],"target":[[-0.58,3.1,-3.92]],"special":[[-0.55,2.05,-1.95]],"mouth":[[-0.55,2.05,-1.95]],"physical":[[-0.55,2.05,-1.95]],"eye":[[-2.6,4,-1.9],[1.4,4.1,-1.9]],"face":[[-0.6,4.05,-1.9]]},"sunflora":{"root":[[0,0,0]],"middle":[[0,7,1]],"top":[[0,22,0]],"target":[[0,10,-5]],"special":[[-10.88,8.23,0.42]],"hand_primary":[[-10.88,8.23,0.42]],"physical":[[-10.88,8.23,0.42]],"eye":[[-2.52,19.07,-7.93],[1.47,19.27,-7.73]],"face":[[-0.46,17.93,-7.88]],"hand_secondary":[[9.93,9.26,1.97]]},"yanma":{"root":[[0,0,0]],"middle":[[0,5,-3]],"top":[[0,9,0]],"target":[[0,6,-15]],"special":[[0,1.75,-12]],"mouth":[[0,1.75,-12]],"physical":[[0,1.75,-12]],"eye":[[3.5,5.25,-10.25],[-3.5,5.25,-10.25]],"face":[[0,4.5,-13]]},"wooper":{"root":[[0,0,0]],"middle":[[0,5.25,0]],"top":[[0,15,0]],"target":[[0,6,-7]],"special":[[0,15,-2]],"mouth":[[0,9.5,-5]],"physical":[[0,15,-2]],"eye":[[3,12,-5],[-3,12,-5]],"face":[[0,11,-5]]},"quagsire":{"root":[[0,0,0]],"middle":[[0,11,-0.5]],"top":[[0,23,0]],"target":[[0,11,-7.75]],"special":[[-13,13.25,-2]],"mouth":[[0,16.5,-6.25]],"hand_primary":[[-13,13.25,-2]],"physical":[[-13,13.25,-2]],"eye":[[3.5,20.5,-6.25],[-3.5,20.5,-6.25]],"face":[[0,19.5,-6.25]],"hand_secondary":[[13,13.25,-2]]},"espeon":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,24,0]],"target":[[0,11,-13]],"special":[[0,20.2,-10.4]],"mouth":[[0,15.85,-10.4]],"physical":[[0,15.85,-10.4]],"eye":[[-2,18.85,-10.15],[2,18.85,-10.15]],"face":[[0,19,-10.15]]},"umbreon":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,23,0]],"target":[[0,11,-13]],"special":[[0,15.45,-11.3]],"mouth":[[0,15.45,-11.3]],"physical":[[0,15.45,-11.3]],"eye":[[2.25,18.2,-10.45],[-2.25,18.2,-10.45]],"face":[[0,18.2,-10.45]]},"murkrow":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,20,0]],"target":[[0,8,-6]],"special":[[0,11.2,-4]],"mouth":[[0,11.2,-4]],"physical":[[0,11.35,-8.35]],"eye":[[-1.4,13.4,-4],[1.4,13.4,-4]],"face":[[0,12.1,-7.7]]},"slowking":{"root":[[0,0,0]],"middle":[[0,14,0]],"top":[[0,33.5,0]],"target":[[0,14.5,-9]],"special":[[-4.1,12.19,6.73]],"mouth":[[0,19.07,-3.32]],"hand_primary":[[-4.1,12.19,6.73]],"physical":[[-4.1,12.19,6.73]],"eye":[[2.25,22.37,-3.23],[-2.25,22.37,-3.23]],"face":[[0,22.13,-5.23]],"hand_secondary":[[4.1,12.19,6.73]]},"misdreavus":{"root":[[0,0,0]],"middle":[[0,7,0]],"top":[[0,19,0]],"target":[[0,7,-7]],"special":[[0,11,-6]],"mouth":[[0,11,-6]],"physical":[[0,18,-3]],"eye":[[-2.5,13,-6],[2.5,13,-6]],"face":[[0,12.75,-6]]},"unown":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,12,0]],"target":[[0,8,-4]],"special":[[0,8,-4]],"physical":[[0,8,-4]],"eye":[[0,8,-0.6]],"face":[[0,8,-0.6]]},"wobbuffet":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,24.5,0]],"target":[[0,12,-8]],"special":[[0.19,16.49,-7.31]],"mouth":[[0.19,16.49,-7.31]],"hand_primary":[[-2.92,6.34,-6.45]],"physical":[[0.14,23.82,-6.1]],"eye":[[-8.62,7.99,5.66],[-6.49,9.96,6.39]],"face":[[0.16,19.64,-8.14]],"hand_secondary":[[3.45,6.39,-6.47]]},"girafarig":{"root":[[0,0,0]],"middle":[[0,15,0]],"top":[[0,32,0]],"target":[[-3.3,17.5,-12.32]],"special":[[-2.25,26.56,-13.88]],"mouth":[[-2.43,21.51,-16.01]],"physical":[[-2.25,26.56,-13.88]],"eye":[[-0.27,24.13,-15.68],[-4.25,24.39,-15.97]],"face":[[-2.03,23.91,-19.33]]},"pineco":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,18,0]],"target":[[0,8,-8]],"special":[[0,12,-2.75]],"physical":[[0,12,-2.75]],"eye":[[1,11,-4],[-1,11,-4]],"face":[[0,11,-6.5]]},"forretress":{"root":[[0,0,0]],"middle":[[0,10.5,0]],"top":[[0,23,0]],"target":[[0,11,-11.75]],"special":[[6.75,10.5,-13.6],[-6.75,10.5,-13.6]],"physical":[[0,21.5,-7.75]],"eye":[[4.5,10.5,-8],[-4.5,10.5,-8]],"face":[[0,10.25,-9]]},"dunsparce":{"root":[[0,0,0]],"middle":[[0.01,3.44,-0.08]],"top":[[0,9,0]],"target":[[0.07,2.59,-15.06]],"special":[[0,3.13,-12.59]],"mouth":[[0,3.13,-12.59]],"physical":[[0.06,8.79,-10.12]],"eye":[[-4.97,5.07,-8.71],[5.03,4.96,-8.73]],"face":[[0.03,5.59,-12.18]]},"gligar":{"root":[[0,0,0]],"middle":[[0,7,0]],"top":[[0,17,0]],"target":[[-2.83,7.75,-2.83]],"special":[[10.06,6.95,5.65]],"mouth":[[-0.43,10.26,-1.8]],"hand_primary":[[-9.05,5.87,1.57]],"physical":[[-9.05,5.87,1.57]],"eye":[[1.9,11.67,-4.54],[-2.82,11.56,-4.55]],"face":[[-0.45,11.56,-4.79]],"hand_secondary":[[4.41,5.73,-9.19]]},"steelix":{"root":[[0,0,1]],"middle":[[0,66.25,4]],"top":[[0,119,-1]],"target":[[0,66.25,-19]],"special":[[0,98.67,-49.95]],"mouth":[[0,98.67,-49.95]],"physical":[[1.12,14.8,37.51]],"eye":[[9.01,101.92,-64.59],[-8.99,101.95,-64.59]],"face":[[-0.01,94.71,-73.92]]},"snubbull":{"root":[[0,0,0]],"middle":[[0,7.75,0]],"top":[[0,18.5,0]],"target":[[0,7.75,-6]],"special":[[-0.8,11.13,-5.71]],"mouth":[[-0.8,11.13,-5.71]],"hand_primary":[[-5.64,6.06,0.3]],"eye":[[2.12,13.69,-6.28],[-3.89,13.51,-5.29]],"face":[[-0.89,12.62,-5.99]],"hand_secondary":[[5.66,5.51,-1.06]]},"granbull":{"root":[[0,0,0]],"middle":[[0,15.25,0]],"top":[[0,33.5,0]],"target":[[0,15.25,-7]],"special":[[0.12,23.46,-6.68]],"mouth":[[0.12,23.46,-6.68]],"hand_primary":[[-15.97,15.48,2.08]],"eye":[[3.24,26.19,-8.05],[-2.75,26.48,-7.98]],"face":[[0.2,25.68,-9.43]],"hand_secondary":[[15.82,14.93,1.46]]},"qwilfish":{"root":[[0,0,0]],"middle":[[0,6,0]],"top":[[0,13,0]],"target":[[0,6,-7]],"special":[[0,5.5,-5]],"mouth":[[0,5.5,-5]],"physical":[[0,10.5,-3]],"eye":[[2.37,7.5,-4.52],[-2.37,7.5,-4.52]],"face":[[0,7,-5]]},"scizor":{"root":[[0,0,0]],"middle":[[0,26,0]],"top":[[0,46,0]],"target":[[0.91,24.5,-3.38]],"special":[[1,30.21,-4.88],[-8.93,20.92,-11.04]],"mouth":[[1,30.21,-4.88]],"hand_primary":[[-9.28,22.31,-15.04]],"physical":[[-9.28,22.31,-15.04]],"eye":[[2.98,32.32,-4.56],[-0.9,32.4,-5.19]],"face":[[1.31,31.48,-6.67]],"hand_secondary":[[14.22,14.99,-3.83]]},"shuckle":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,23.25,0]],"target":[[0,10,-14.75]],"special":[[0,23.25,-10]],"hand_primary":[[-6.6,2.3,-15],[6.6,2.3,-15]],"physical":[[0,23.25,-10]],"eye":[[-1.5,21,-12],[1.5,21,-12]],"face":[[0,21,-12]],"hand_secondary":[[6.6,2.3,15],[-6.6,2.3,15]]},"heracross":{"eye":[[3.25,19.25,-2.5],[-3.25,19.25,-2.5]]},"sneasel":{"root":[[0,0,0]],"middle":[[0,10.15,0]],"top":[[0,22,0]],"target":[[-0.03,10.15,-7.1]],"special":[[-7.5,6.29,-0.69]],"mouth":[[-0.05,13.43,-4.23]],"hand_primary":[[-7.5,6.29,-0.69]],"physical":[[-7.5,6.29,-0.69]],"eye":[[-2.08,16.01,-4.29],[1.92,16.05,-4.31]],"face":[[-0.08,16.03,-4.3]],"hand_secondary":[[7.2,6.6,-3.16]]},"teddiursa":{"root":[[0,0,0]],"middle":[[0,6.5,0]],"top":[[0,19.25,0]],"target":[[0,7.25,-6.25]],"special":[[-5.19,4.48,3.38]],"mouth":[[-0.02,8.46,-4.21]],"hand_primary":[[-5.19,4.48,3.38]],"physical":[[-5.19,4.48,3.38]],"eye":[[2.19,10.75,-4.35],[-2.31,10.67,-4.35]],"face":[[-0.05,10.21,-4.32]],"hand_secondary":[[5.19,4.48,3.38]]},"ursaring":{"root":[[0,0.5,0]],"middle":[[0,22.7,0]],"top":[[0,43.5,0]],"target":[[0,24.7,-11]],"special":[[-21.27,30.16,-17.85]],"mouth":[[-0.11,32.2,-13.48]],"hand_primary":[[-21.27,30.16,-17.85]],"physical":[[-21.27,30.16,-17.85]],"eye":[[-2.13,34.47,-14.54],[1.87,34.48,-14.56]],"face":[[-0.13,33.41,-16.83]],"hand_secondary":[[19.06,28.94,-20.88]]},"slugma":{"root":[[0,0,0]],"middle":[[0,6.5,-3.25]],"top":[[0,18,0]],"target":[[0,7.5,-11.25]],"special":[[0,15.5,-1]],"physical":[[0,15.5,-1]],"eye":[[3.35,16.6,-7.75],[-3.35,16.6,-7.75]],"face":[[0,17,-7.75]]},"magcargo":{"root":[[0,0,0]],"middle":[[0,11,1]],"top":[[0,23.5,0]],"target":[[0,10,-15]],"special":[[0,13.75,-10]],"mouth":[[0,13.75,-10]],"physical":[[0,20.65,-10.5]],"eye":[[-3,20.5,-11.4],[3,20.5,-11.4]],"face":[[0,18.25,-15.5]]},"swinub":{"root":[[0,0,0]],"top":[[0,6.35,0]],"special":[[-0.15,0.24,-4.91]],"mouth":[[-0.15,0.24,-4.91]],"physical":[[-0.16,5.8,-5.12]],"eye":[[1.57,2.81,-5.2],[-1.9,2.81,-5.08]],"face":[[-0.16,3.8,-5.04]]},"piloswine":{"root":[[0,0,0]],"middle":[[0,9.04,-0.14],[0,9.5,0]],"top":[[0,22.35,0]],"target":[[0,10.5,-13]],"special":[[0,1.84,-10.99]],"mouth":[[0,1.84,-10.99]],"physical":[[4.6,0.93,-16.28],[-4.6,0.93,-16.28]],"eye":[[-3,7.08,-11.06],[3,7.08,-11.06]],"face":[[0,6.31,-11.04]]},"corsola":{"root":[[0,0,0]],"middle":[[0,6,0.25]],"top":[[0,18,0.25]],"target":[[0,6,-6.25]],"special":[[0,5.6,-5.25]],"mouth":[[0,5.6,-5.25]],"hand_primary":[[-4.39,3.36,-5.8]],"physical":[[7.13,9.41,7.23],[-7.13,9.41,7.23]],"eye":[[-2,6.95,-5.25],[2,6.95,-5.25]],"face":[[0,6.9,-5.25]],"hand_secondary":[[4.39,3.36,-5.8]]},"remoraid":{"root":[[0,0,0]],"middle":[[0,3.5,0]],"top":[[0,9.5,0]],"target":[[0,4,-9]],"special":[[0,3.5,-7.5]],"mouth":[[0,3.5,-7.5]],"physical":[[0,6.5,-5]],"eye":[[-2,4,-4.5],[2,4,-4.5]],"face":[[0,3.5,-7.5]]},"octillery":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,21.5,0]],"target":[[0,8.5,-11.5]],"special":[[0,12.75,-11.5]],"mouth":[[0,12.75,-11.5]],"hand_primary":[[-4,3,-19.5]],"physical":[[-4,3,-19.5]],"eye":[[-5.5,15,-6],[5.5,15,-6]],"face":[[0,14.25,-11.5]],"hand_secondary":[[4,3,-19.5]]},"delibird":{"root":[[0,0,0]],"middle":[[0,13,0]],"top":[[0,26,0]],"target":[[0,14,-9]],"special":[[0,19.5,-8.75]],"hand_primary":[[-14,14.6,0]],"physical":[[-14,14.6,0]],"eye":[[1.4,21.1,-4.6],[-1.4,21.1,-4.6]],"face":[[0,21,-8.75]],"hand_secondary":[[14,14.6,0]]},"mantine":{"root":[[0,0,0]],"middle":[[0,6,0]],"top":[[0,17,0]],"target":[[0,4.5,-16.25]],"special":[[0,2.5,-11]],"mouth":[[0,2.5,-11]],"physical":[[0,11,-8]],"eye":[[-7,5.5,-11],[7,5.5,-11]],"face":[[0,5,-11]]},"skarmory":{"root":[[0,0,0]],"middle":[[0,19.9,0]],"top":[[0,36.5,0]],"target":[[0,17.9,-17]],"special":[[0,24.3,-22.04]],"mouth":[[0,24.3,-22.04]],"physical":[[0,23.52,-29.71]],"eye":[[2.55,26.33,-23.43],[-2.55,26.33,-23.43]],"face":[[0,24.58,-27.43]]},"houndour":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,21,0]],"target":[[0,10,-10]],"special":[[0,14.75,-7.25]],"mouth":[[0,14.75,-7.25]],"physical":[[0,14.75,-7.25]],"eye":[[-1.85,17.3,-7.25],[1.85,17.3,-7.25]],"face":[[0,16.75,-9.25]]},"houndoom":{"root":[[0,0,0]],"middle":[[0,19,0]],"top":[[0,35,0]],"target":[[0,19,-15]],"special":[[0,27.7,-13.3]],"mouth":[[0,27.7,-13.3]],"physical":[[0,27.7,-13.3]],"eye":[[-2,30.5,-13.25],[2,30.5,-13.25]],"face":[[0,30,-17.15]]},"kingdra":{"root":[[0,0,0]],"middle":[[0,21,0]],"top":[[0,46,0]],"target":[[0,24,-17]],"special":[[0,39.25,-21.75]],"mouth":[[0,39.25,-21.75]],"physical":[[-3,54.75,2],[3,54.75,2]],"eye":[[-2.65,41.25,-6.75],[2.65,41.25,-6.75]],"face":[[0,41,-21]]},"phanpy":{"root":[[0,0,0]],"middle":[[0,6.5,-0.25]],"top":[[0,17,0]],"target":[[0,0,0]],"special":[[1.45,8.29,-13.36]],"mouth":[[0.1,7.39,-6.96]],"physical":[[0.4,14.84,-5.25]],"eye":[[3.78,11.49,-6.58],[-3.21,11.81,-6.76]],"face":[[0.42,11.9,-11.36]]},"donphan":{"root":[[0,0,0]],"middle":[[0,13,0]],"top":[[0,27,0]],"target":[[0,13,-30]],"special":[[-0.37,4.1,-24.5]],"physical":[[-0.37,4.1,-24.5]],"face":[[-0.31,13.3,-20.78]],"jaw_lower":[[-0.3,11.01,-19.62]]},"porygon2":{"root":[[0,0,0]],"middle":[[2.03,12.4,3]],"top":[[0,21.7,0]],"target":[[1.13,12.56,-3.44]],"special":[[0.68,18.45,-9.53]],"physical":[[0.68,18.45,-9.53]],"eye":[[4.64,19.74,-3.64],[-1.28,20.16,-2.81]],"face":[[0.88,19.51,-8.68]]},"hitmontop":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,24,0]],"target":[[0,11,-4.5]],"special":[[-0.77,21.14,-3.67]],"physical":[[-10.7,7.61,-0.46]],"face":[[-0.77,13.12,-7.15]]},"smoochum":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,19,0]],"target":[[0,10,-7]],"special":[[0,10.5,-6]],"mouth":[[0,10.5,-6]],"hand_primary":[[-8,6.2,0]],"physical":[[-8,6.2,0]],"face":[[0,12,-5]],"hand_secondary":[[8,6.2,0]]},"elekid":{"root":[[0,0,0]],"middle":[[0,7,0]],"top":[[0,19,0]],"target":[[0,7,-5.25]],"special":[[-8.84,11.68,-2]],"mouth":[[-0.08,7.67,-3.67]],"hand_primary":[[-8.84,11.68,-2]],"physical":[[-8.84,11.68,-2]],"eye":[[1.16,9.32,-3.72],[-1.39,9.28,-3.72]],"face":[[-0.11,8.97,-3.71]],"hand_secondary":[[8.53,11.98,-2]]},"magby":{"root":[[0,0,0]],"middle":[[0,8.6,0]],"top":[[0,20,0]],"target":[[0,8.25,-3.75]],"special":[[0.07,11.81,-7.83]],"mouth":[[0.07,11.81,-7.83]],"hand_primary":[[-5.8,8.1,0.58]],"physical":[[-5.8,8.1,0.58]],"eye":[[1.62,14.06,-5.96],[-1.38,14.15,-6.01]],"face":[[0.14,13.87,-8.22]],"hand_secondary":[[5.85,8.13,0.23]]},"miltank":{"root":[[0,0,0]],"middle":[[0,14,0]],"top":[[0,33.1,2]],"target":[[0,16,-12]],"special":[[-17.5,18,1.5]],"hand_primary":[[-17.5,18,1.5]],"physical":[[-17.5,18,1.5]],"eye":[[3,26,-4],[-3,26,-4]],"face":[[0,25,-8]],"jaw_lower":[[0,22,-6.25]],"hand_secondary":[[17.5,18,1.5]]},"blissey":{"root":[[0,0,0]],"middle":[[0,17,0]],"top":[[0,31.8,0]],"target":[[0,17,-15]],"special":[[-0.82,21.7,-10.19]],"mouth":[[-0.82,21.7,-10.19]],"hand_primary":[[-5.09,13.55,-12.11]],"physical":[[0,17,-15]],"eye":[[1.36,23.78,-10.29],[-3.14,23.62,-10.23]],"face":[[-0.91,24.2,-10.28]],"hand_secondary":[[3.95,13.87,-12.23]]},"larvitar":{"root":[[0,0,0]],"middle":[[0,7,0.5]],"top":[[0,20.75,0]],"target":[[0,7,-5]],"special":[[0,19.5,3.75]],"hand_primary":[[-5,7.75,1.25]],"physical":[[0,19.5,3.75]],"eye":[[-3,11.75,-2.25],[3,11.75,-2.25]],"face":[[0,12,-5]],"hand_secondary":[[5,7.75,1.25]]},"pupitar":{"root":[[0,0,0]],"middle":[[0,15,0]],"top":[[0,32.25,0]],"target":[[0,12.75,-10.75]],"special":[[0,26,-6]],"physical":[[0,26,-6]],"eye":[[3.5,17,-6],[-3.5,17,-6]],"face":[[0,16.25,-9.25]]},"tyranitar":{"root":[[0,0,0]],"middle":[[0,27,0]],"top":[[0,54,0]],"target":[[0,27,-11]],"special":[[0,45,-3]],"mouth":[[0,45,-3]],"hand_primary":[[-23.5,27.5,2.75]],"eye":[[3,46.6,-5.4],[-3,46.6,-5.4]],"face":[[0,46.05,-8.8]],"hand_secondary":[[23.5,27.5,2.75]]},"lugia":{"root":[[0,0,0]],"middle":[[0,42,0]],"top":[[0,75,0]],"target":[[0,40,-33.5]],"special":[[0,86.5,3.1]],"mouth":[[0,86.5,3.1]],"hand_primary":[[-66.9,42.8,5]],"physical":[[-66.9,42.8,5]],"eye":[[3.55,91,6.45],[-3.55,91,6.45]],"face":[[0,96.4,7]],"hand_secondary":[[66.9,42.8,5]]},"hooh":{"root":[[0,0,0]],"middle":[[0,28,0]],"top":[[0,61.5,0]],"target":[[0,28,-32]],"special":[[0,29.7,-43.1]],"mouth":[[0,29.7,-43.1]],"physical":[[-6.5,1,4.45]],"eye":[[-3.25,32.1,-43],[3.25,32.1,-43]],"face":[[0,31,-56.2]]},"treecko":{"root":[[0,0,0]],"middle":[[0,12.5,0]],"top":[[0,25,0]],"target":[[0,10.5,-5.5]],"special":[[-0.97,12.74,-5.39]],"mouth":[[-0.97,12.74,-5.39]],"hand_primary":[[-6.04,6.64,-6.45]],"physical":[[-6.04,6.64,-6.45]],"eye":[[-4.81,15.32,-6.82],[2.13,15.69,-7.68]],"face":[[-1.78,14.89,-11.07]],"hand_secondary":[[4.83,7.39,-4.81]]},"grovyle":{"root":[[0,0,0]],"middle":[[0,18,0]],"top":[[0,34,0]],"target":[[0,18,-7.5]],"special":[[0,27,-1.5]],"mouth":[[0,27,-1.5]],"hand_primary":[[-16.5,16.5,0]],"physical":[[-16.5,16.5,0]],"eye":[[3,28.6,-4],[-3,28.6,-4]],"face":[[0,29,-8.8]],"hand_secondary":[[16.5,16.5,0]]},"sceptile":{"root":[[0,0,0]],"middle":[[0,21,0]],"top":[[0,39,0]],"target":[[0,21,-10]],"special":[[0,32.9,-3.8]],"mouth":[[0,32.9,-3.8]],"hand_primary":[[-18.5,21,0.5]],"physical":[[-18.5,21,0.5]],"eye":[[-3,34.9,-5.4],[3,34.9,-5.4]],"face":[[0,35.1,-9.75]],"hand_secondary":[[18.5,21,0.5]]},"torchic":{"eye":[[-2.87,12.36,-5.12],[4.12,12.28,-5.42]]},"combusken":{"eye":[[-2.4,21.49,-3.98],[2.4,21.49,-3.98]]},"blaziken":{"eye":[[4.41,43.66,-8.76],[0.06,43.32,-8.85]]},"mudkip":{"eye":[[2.43,8.85,-8.42],[-2.27,8.78,-8.5]]},"marshtomp":{"eye":[[2.85,18.63,-5.29],[-2.95,18.49,-5.21]]},"swampert":{"eye":[[3.12,22.08,-24.4],[-3.88,22,-24.24]]},"poochyena":{"eye":[[2.5,14,-9.5],[-2.5,14,-9.5]]},"mightyena":{"eye":[[-2.5,17.5,-19.37],[2.5,17.5,-19.37]]},"zigzagoon":{"eye":[[2.4,3.11,-9.05],[-1.6,3.11,-9.05]]},"linoone":{"eye":[[1.81,3.02,-10.41],[-2.18,3.07,-10.21]]},"wurmple":{"root":[[0,0,0]],"middle":[[0,5.3,0]],"top":[[0,12,0]],"target":[[0,5.3,-9]],"special":[[0,6.66,-8.94]],"mouth":[[0,6.66,-8.94]],"hand_primary":[[-2.34,2.36,-6.14]],"physical":[[0,15.63,-4.02]],"eye":[[2.5,7.98,-6.07],[-2.5,7.98,-6.07]],"face":[[0,7.13,-9.12]],"hand_secondary":[[2.34,2.36,-6.14]]},"silcoon":{"root":[[0,0,0]],"middle":[[0,8.5,0]],"top":[[0,16,0]],"target":[[0,8,-7.5]],"special":[[0,19.97,-7.18]],"physical":[[0,19.97,-7.18]],"eye":[[6,8.72,-4.36],[-6,8.72,-4.36]],"face":[[0,8.3,-6.38]]},"beautifly":{"root":[[0,0,0]],"middle":[[0,15,0]],"top":[[0,24,0]],"target":[[0,15.5,-8]],"special":[[0,6.28,-9.83]],"mouth":[[0,0.65,-22.87]],"hand_primary":[[-3.07,11.51,-2.97]],"physical":[[0,6.28,-9.83]],"eye":[[4,17.08,-5.14],[-4,17.08,-5.14]],"face":[[0,17.08,-5.09]],"hand_secondary":[[3.07,11.51,-2.97]]},"cascoon":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,18,0]],"target":[[0,8.5,-8]],"special":[[0,22.39,-8.06]],"physical":[[0,22.39,-8.06]],"eye":[[5,8.69,-7.12],[-5,8.69,-7.12]],"face":[[0,8.69,-7.12]]},"dustox":{"root":[[0,0,0]],"middle":[[0,12.97,-0.35]],"top":[[0,24,0]],"target":[[0,13.23,-7.5]],"special":[[0,13.26,-4.46]],"mouth":[[0,13.26,-4.46]],"hand_primary":[[5.57,9.37,-4.93],[-5.57,9.37,-4.93]],"physical":[[0,22.3,-5.04]],"eye":[[3.5,14.88,-5.05],[-3.5,14.88,-5.05]],"face":[[0,14.74,-4.72]],"hand_secondary":[[5.51,6.88,-4.23],[-5.51,6.88,-4.23]]},"lotad":{"eye":[[3,5.25,-4.5],[-3,5.25,-4.5]]},"lombre":{"eye":[[3,14.5,-4.5],[-3,14.5,-4.5]]},"ludicolo":{"eye":[[2,17.5,-6.5],[-2,17.5,-6.5]]},"seedot":{"root":[[0,0,0]],"middle":[[0,4.5,0]],"top":[[0,13,0]],"target":[[0,4.5,-4.75]],"special":[[0,3.5,-3.5]],"physical":[[0,4.5,-4.75]],"eye":[[-2,6,-3.5],[2,6,-3.5]],"face":[[0,5,-3.5]]},"nuzleaf":{"root":[[0,0,0]],"middle":[[0,9.5,0]],"top":[[0,24.5,0]],"target":[[-1.72,9.5,-2.46]],"special":[[0,14.92,-8.26]],"mouth":[[0,13.29,-3.97]],"hand_primary":[[-6.84,9.34,1.87]],"physical":[[-6.84,9.34,1.87]],"eye":[[-2,15.79,-4.1],[2,15.79,-4.1]],"face":[[0,15.14,-4.07]],"hand_secondary":[[4.55,12.18,-7.67]]},"shiftry":{"eye":[[-2.4,20,-7],[2.4,20,-7]]},"taillow":{"eye":[[1.65,9,-4.35],[-1.65,9,-4.35]]},"swellow":{"eye":[[1.7,14.4,-7.7],[-1.7,14.4,-7.7]]},"wingull":{"eye":[[1.75,3.85,-3.5],[-1.75,3.85,-3.5]]},"pelipper":{"eye":[[-3,15.5,-2.75],[3,15.5,-2.75]]},"ralts":{"eye":[[1.79,10.21,-3.91],[-1.71,10.24,-3.91]]},"kirlia":{"eye":[[2.16,16.84,-1.88],[-2.25,16.85,-1.77]]},"gardevoir":{"eye":[[2.07,30.39,-2.47],[-1.91,30.37,-2.66]]},"surskit":{"eye":[[-2.5,11,-4],[2.5,11,-4]]},"masquerain":{"eye":[[-2.5,9,-8],[2.5,9,-8]]},"shroomish":{"eye":[[-1.17,7.35,-6.12],[1.83,7.27,-6.04]]},"breloom":{"eye":[[-0.3,18.95,-4.28],[3.65,18.74,-3.67]]},"slakoth":{"root":[[0,0,0]],"middle":[[0,12.21,4.84]],"top":[[0,10,0]],"target":[[0,23.12,3.4]],"special":[[0,12.62,-3.26]],"mouth":[[0,12.62,-3.26]],"hand_primary":[[-7.88,2.01,-0.88]],"physical":[[-7.88,2.01,-0.88]],"eye":[[2.4,15.56,-3.88],[-2.4,15.56,-3.85]],"face":[[0,15.37,-4.83]],"hand_secondary":[[7.88,2.01,-0.88]]},"vigoroth":{"eye":[[3.43,23.34,-10.24],[-1.06,23.34,-10.61]]},"slaking":{"root":[[0,0,0]],"middle":[[0.25,9,0]],"top":[[0,42.5,0]],"target":[[-0.75,9,-13]],"special":[[10.96,12.04,-7.99]],"mouth":[[10.96,12.04,-7.99]],"hand_primary":[[-8.76,16.96,-10.59]],"physical":[[-8.76,16.96,-10.59]],"eye":[[16,11.67,-9.63],[13.1,16.84,-8.72]],"face":[[14.23,14.24,-10.1]],"hand_secondary":[[20.33,8.22,-0.46]]},"nincada":{"eye":[[3.34,6.75,-7.09],[-3.66,6.67,-7.2]]},"ninjask":{"eye":[[4.02,15.51,-7.62],[-3.97,15.93,-7.62]]},"shedinja":{"eye":[[4.75,16.82,-6.95],[-4.75,16.82,-6.95]]},"whismur":{"eye":[[-2.25,6.75,-4],[2.25,6.75,-4]]},"loudred":{"eye":[[2.75,17.25,-6],[-2.75,17.25,-6]]},"exploud":{"eye":[[-4,26.5,-5],[4,26.5,-5]]},"makuhita":{"eye":[[1.75,14.5,-4],[-1.75,14.5,-4]]},"hariyama":{"eye":[[-3.5,27,-6],[3.5,27,-6]]},"azurill":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,18.35,0]],"target":[[0,12.75,-6]],"special":[[0,12.09,-3.79]],"mouth":[[0,12.09,-3.79]],"physical":[[0,16.69,-1.88]],"eye":[[2,13.83,-3.59],[-2,13.83,-3.59]],"face":[[0,13.83,-3.64]]},"nosepass":{"eye":[[-4.16,14.09,-4.07],[4.14,14.09,-4.07]]},"skitty":{"root":[[0,0,0]],"middle":[[0,6.5,0]],"top":[[0,15,0]],"target":[[-2.74,6,-7.52]],"special":[[-0.71,5.3,-7.37]],"mouth":[[-0.71,5.3,-7.37]],"physical":[[-0.67,11.77,-8.03]],"eye":[[-3.45,7.5,-7.66],[2.05,7.48,-7.53]],"face":[[-0.7,6.79,-7.52]]},"delcatty":{"root":[[0,0,0]],"middle":[[0,14,0]],"top":[[0,28,0]],"target":[[0,14,-14]],"special":[[0,18.4,-11.25]],"mouth":[[0,18.4,-11.25]],"physical":[[-2.5,0.5,-5]],"eye":[[2.25,21.2,-11],[-2.25,21.2,-11]],"face":[[0,21,-11]]},"sableye":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,21.5,0]],"target":[[0,12,-6]],"special":[[0,15.2,-5.8]],"mouth":[[0,15.2,-5.8]],"hand_primary":[[-11.6,12.5,0.5]],"physical":[[-12.7,13,0.5]],"eye":[[0.35,18.3,-5.2],[-0.35,18.3,-5.2]],"face":[[0,18,-5.65]],"hand_secondary":[[11.6,12.5,0.5]]},"mawile":{"root":[[0,0,0]],"middle":[[3,9.5,0]],"top":[[0,18.5,0]],"target":[[0.21,8.5,-24.9]],"special":[[-13.74,17.62,-24.57]],"mouth":[[-13.74,17.62,-24.57]],"hand_primary":[[7.23,6.19,-3.69]],"physical":[[-13.74,17.62,-24.57]],"eye":[[4.38,13.05,1.56],[4.39,12.85,-3.5]],"face":[[6.71,13.06,-0.11]],"hand_secondary":[[-1.2,6.08,3]]},"aron":{"eye":[[4.5,6.5,-7.55],[-4.5,6.5,-7.55]]},"lairon":{"eye":[[4.5,9.6,-14.1],[-4.5,9.6,-14.1]]},"aggron":{"eye":[[-4.5,43.6,-10],[4.5,43.6,-10]]},"meditite":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,25,0]],"target":[[0,12,-5]],"special":[[-9.5,13,0]],"mouth":[[0,14.8,-4.5]],"hand_primary":[[-9.5,13,0]],"physical":[[-9.5,13,0]],"eye":[[2.75,17,-4.5],[-2.75,17,-4.5]],"face":[[0,17.1,-4.5]],"hand_secondary":[[-9.5,13,0]]},"medicham":{"root":[[0,0,0]],"middle":[[0,20.9,0]],"top":[[0,36,0]],"target":[[-1.81,20.9,-6.76]],"special":[[-11.15,30.93,2.85]],"mouth":[[-1.26,26.44,-3.71]],"hand_primary":[[-11.15,30.93,2.85]],"physical":[[-11.15,30.93,2.85]],"eye":[[-3.42,29.69,-3.47],[1.08,29.58,-3.62]],"face":[[-1.18,28.95,-3.41]],"hand_secondary":[[5.61,23.6,-7.69]]},"electrike":{"root":[[0,0,0]],"middle":[[0,8.5,0]],"top":[[0,17,0]],"target":[[0,8,-16]],"special":[[0,7.4,-11.66]],"mouth":[[0,7.4,-11.66]],"physical":[[0,13.13,-13.79]],"eye":[[2.5,9.89,-11.88],[-2.5,9.89,-11.88]],"face":[[0,8.67,-15.54]]},"manectric":{"root":[[0,0,0]],"middle":[[0,17,0]],"top":[[0,38,0]],"target":[[0,15,-17]],"special":[[0,21.71,-14.26]],"mouth":[[0,21.71,-14.26]],"physical":[[0,20.75,-17.92]],"eye":[[3.4,24.86,-14.19],[-3.4,24.86,-14.19]],"face":[[0,23.59,-19.34]]},"plusle":{"root":[[0,0,0]],"middle":[[0,8,-0.75]],"top":[[0,25.4,-0.75]],"target":[[0,8,-5.75]],"special":[[0.3,-0.02,-0.28]],"mouth":[[-0.08,8.95,-5.13]],"hand_primary":[[-6.25,6.67,-0.97]],"physical":[[0,8,-5.75]],"eye":[[-2.95,11.57,-5.01],[2.54,11.81,-5.01]],"face":[[-0.19,11.45,-5.02]],"hand_secondary":[[6.22,7,-0.97]]},"minun":{"root":[[0,0,0]],"middle":[[0,8,-0.75]],"top":[[0,25.4,-0.75]],"target":[[0,8,-5.75]],"special":[[0.3,-0.02,-0.28]],"mouth":[[-0.08,8.95,-5.13]],"hand_primary":[[-6.25,6.67,-0.97]],"physical":[[0,8,-5.75]],"eye":[[-2.95,11.57,-5.01],[2.54,11.81,-5.01]],"face":[[-0.19,11.45,-5.02]],"hand_secondary":[[6.22,7,-0.97]]},"volbeat":{"eye":[[2.2,15.13,-4.19],[-2.79,14.94,-3.92]]},"illumise":{"eye":[[2.2,15.14,-3.69],[-2.79,14.95,-3.42]]},"roselia":{"eye":[[2.05,15.94,-4.61],[-3.03,15.77,-4.42]]},"carvanha":{"eye":[[-4.55,6.44,-4.05],[4.4,6.44,-4.94]]},"sharpedo":{"root":[[0,0,0]],"middle":[[0,8,1]],"top":[[0,33,1]],"target":[[0,8,-17]],"special":[[0,3.5,-2.5]],"mouth":[[0,3.5,-2.5]],"physical":[[0,3.5,-2.5]],"eye":[[-6.5,7,-6],[6.5,7,-6]],"face":[[0,7.85,-15.75]],"jaw_lower":[[0,2.5,-9.25]]},"wailmer":{"root":[[0,0,0]],"middle":[[0,7,0.53]],"top":[[0,15,0]],"target":[[0,9.68,-9.63]],"special":[[0,8.23,-0.6]],"mouth":[[0,8.23,-0.6]],"physical":[[0,16.01,-2.27]],"eye":[[4.5,13.03,-6.67],[-4.5,13.03,-6.67]],"face":[[0,12.07,-6.93]]},"wailord":{"root":[[0,0,0]],"middle":[[0,19,8]],"top":[[0,38,8]],"target":[[0,19,-42.5]],"special":[[0,19,-9]],"mouth":[[0,19,-9]],"eye":[[-21.61,20.14,-25.36],[21.39,20.14,-25.65]],"face":[[-0.21,19.79,-41.01]]},"numel":{"eye":[[2.06,12.87,-12.48],[-2.92,12.43,-12.32]]},"camerupt":{"eye":[[-6.5,18,-27.25],[6.5,18,-27.25]]},"torkoal":{"eye":[[3.5,14.6,-16.71],[-3.5,14.6,-16.71]]},"spoink":{"eye":[[2,14.9,-4],[-2,14.9,-4]]},"grumpig":{"eye":[[3.5,22.5,-4.5],[-3.5,22.5,-4.5]]},"spinda":{"eye":[[0.98,15.54,-7.76],[-5.81,14.19,-7.07]]},"trapinch":{"eye":[[5.5,9.3,-9.6],[-5.5,9.3,-9.6]]},"vibrava":{"eye":[[4,7.5,-10.5],[-4,7.5,-10.5]]},"flygon":{"eye":[[1.69,34.49,-22.82],[-7.31,34.6,-22.96]]},"cacnea":{"root":[[0,0,0]],"middle":[[0,5,0]],"top":[[0,17,0]],"target":[[0,5,-6]],"special":[[0,5.54,-3.95]],"mouth":[[0,5.54,-3.95]],"hand_primary":[[-9.75,1.74,4.5]],"physical":[[-9.75,1.74,4.5]],"eye":[[2.35,7.6,-2.44],[-2.35,7.6,-2.44]],"face":[[0,7,-3.61]],"hand_secondary":[[9.75,1.74,4.5]]},"cacturne":{"root":[[0,0,0]],"middle":[[0,13.95,0]],"top":[[0,34.25,0]],"target":[[0,13.95,-3.5]],"special":[[-1.05,19.98,-4.97]],"mouth":[[-1.05,19.98,-4.97]],"hand_primary":[[-12.31,13.97,0.74]],"physical":[[-12.31,13.97,0.74]],"eye":[[0.9,23.03,-3.34],[-3.64,22.49,-3.32]],"face":[[-1.2,21.23,-5.29]],"hand_secondary":[[11.35,17.26,0.45]]},"swablu":{"root":[[0,0,0]],"middle":[[0,5.63,0]],"top":[[0,12.25,0]],"target":[[0,4.63,-8]],"special":[[0,5.46,-5.01]],"mouth":[[0,5.46,-5.01]],"physical":[[0,6.31,-7.08]],"eye":[[2.5,6.72,-5.01],[-2.5,6.72,-5.01]],"face":[[0,6.31,-7.08]]},"altaria":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,34.25,0]],"target":[[0,12,-12]],"special":[[2.87,18.16,-10.35]],"mouth":[[2.87,18.16,-10.35]],"physical":[[4.37,19.9,-11.99]],"eye":[[1.59,21.2,-11.81],[4.6,21.1,-9.18]],"face":[[4.37,19.9,-11.99]]},"zangoose":{"root":[[0,0,0]],"middle":[[0,11.59,-1.95]],"top":[[0,28,0]],"target":[[0,6.11,-2.43]],"special":[[0,12.83,-11.7]],"mouth":[[0,12.83,-11.7]],"hand_primary":[[-4.98,1.41,-6.91]],"physical":[[-5.14,-1.1,-7.34]],"eye":[[-2,15.81,-11.54],[2,15.61,-11.51]],"face":[[0,15.61,-11.51]],"hand_secondary":[[4.98,1.41,-6.91]]},"seviper":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,26,0]],"target":[[0,12,-16]],"special":[[0,17.3,-4]],"mouth":[[0,17.3,-4]],"physical":[[2.75,13.4,-8.35],[-2.75,13.4,-8.35]],"eye":[[4,19.7,-6],[-4,19.7,-6]],"face":[[0,19.3,-10.5]]},"lunatone":{"eye":[[2.65,15.44,-0.37],[-2.72,16.01,6.58]]},"solrock":{"eye":[[-1,19.65,-5.73],[-7.93,20.5,-5.2]]},"barboach":{"eye":[[2.24,8.19,-11.96],[-3.68,8.2,-10.99]]},"whiscash":{"eye":[[-10,10,-20],[10,10,-20]]},"corphish":{"eye":[[-3.5,4.35,-10.6],[3.5,4.35,-10.6]]},"crawdaunt":{"eye":[[1.45,24.95,-2.85],[-1.45,24.95,-2.85]]},"baltoy":{"eye":[[3.51,13.7,-3.71],[-3.91,13.7,-3.71]]},"claydol":{"eye":[[-0.63,22.34,-15.93],[-0.56,24.58,13.98],[14.4,23,-0.97],[-15.59,23.91,-0.97],[9.98,22.34,-11.55],[-11.22,22.98,-11.55],[10.03,23.93,9.6],[-11.17,24.57,9.6]]},"lileep":{"eye":[[1.75,13.75,0.25],[-1.75,13.75,0.25]]},"cradily":{"eye":[[-5,38,-10.5],[5,38,-10.5]]},"anorith":{"eye":[[-5.42,2.69,-4.84],[5.42,2.69,-4.84]]},"armaldo":{"eye":[[4.9,28.67,-13.37],[-4.76,28.65,-13.51]]},"feebas":{"eye":[[3.5,7.25,-4.5],[-3.5,7.25,-4.5]]},"milotic":{"eye":[[6.2,26.71,-25.31],[0.2,26.73,-25.28]]},"kecleon":{"eye":[[4,19.75,-1],[-4,19.75,-1]]},"shuppet":{"root":[[0,0,0]],"middle":[[0,9,0]],"top":[[0,22,0]],"target":[[0,8,-8]],"special":[[0,8,-6]],"mouth":[[0,8,-6]],"physical":[[0,21.5,0]],"eye":[[4,11,-6],[-4,11,-6]],"face":[[0,10.3,-6]]},"banette":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,25,0]],"target":[[0,9,-7]],"special":[[0,12.9,-5]],"mouth":[[0,12.9,-5]],"hand_primary":[[-12.7,9.5,0]],"physical":[[-12.7,9.5,0]],"eye":[[3.4,15.7,-5],[-3.4,15.7,-5]],"face":[[0,15.25,-5]],"hand_secondary":[[12.7,9.5,0]]},"duskull":{"eye":[[0.17,11.18,-5.4]]},"dusclops":{"eye":[[0,26.08,-6.97]]},"tropius":{"root":[[0,0,0]],"middle":[[0,41,0]],"top":[[0,82,0]],"target":[[0,41,-27]],"special":[[0,55.11,-51.14]],"mouth":[[0,58.82,-45.32]],"physical":[[0,55.11,-51.14]],"eye":[[4.7,60.96,-47.51],[-4.5,60.96,-47.51]],"face":[[0,56.46,-52.18]]},"chimecho":{"root":[[0,0,0]],"middle":[[0,20,0]],"top":[[0,28,0]],"target":[[0,20,-6.5]],"special":[[0,19.7,-3.5]],"mouth":[[0,19.7,-3.5]],"hand_primary":[[-2.7,19,-4.5]],"physical":[[0,0,0]],"eye":[[2,21,-3.5],[-2,21,-3.5]],"face":[[0,20.5,-3.5]],"hand_secondary":[[2.7,19,-4.5]]},"absol":{"root":[[0,0,0]],"middle":[[0,20,0]],"top":[[0,38,0]],"target":[[0,24,-17.5]],"special":[[0,28.35,-17.5]],"mouth":[[0,28.35,-17.5]],"physical":[[-3.75,-1.4,-10.4]],"eye":[[2.5,31,-16],[-2.5,31,-16]],"face":[[0,29.35,-17.4]]},"wynaut":{"eye":[[0,3,10]]},"snorunt":{"eye":[[2.25,7.5,-5],[-2.25,7.5,-5]]},"glalie":{"eye":[[5.5,13.5,-10],[-5.5,13.5,-10]]},"spheal":{"root":[[0,0,0]],"middle":[[0,7,0]],"top":[[0,14,0]],"target":[[0,7,-9]],"special":[[0,7.5,-7]],"mouth":[[0,7.5,-7]],"hand_primary":[[-9,2,-5.5]],"physical":[[0,7,-9]],"eye":[[3.25,10.75,-7],[-3.25,10.75,-7]],"face":[[0,9.75,-7.75]],"hand_secondary":[[9,2,-5.5]]},"sealeo":{"eye":[[2.35,16.75,-5.05],[-2.35,16.75,-5.05]]},"walrein":{"eye":[[2.85,26.25,-16.45],[-2.85,26.25,-16.45]]},"clamperl":{"eye":[[-1,5.85,-2],[1,5.85,-2]]},"huntail":{"eye":[[3,5.5,-16.5],[-3,5.5,-16.5]]},"gorebyss":{"eye":[[1.5,3.5,-15],[-1.5,3.5,-15]]},"relicanth":{"eye":[[4.5,11,-12],[-4.5,11,-12]]},"luvdisc":{"eye":[[-0.5,4.25,-1.75],[0.5,4.25,-1.75]]},"bagon":{"eye":[[1.45,12.58,-7.09],[-1.35,12.6,-7.09]]},"shelgon":{"eye":[[2.75,13.06,-11.45],[-2.75,13.06,-11.45]]},"salamence":{"root":[[0,0,0]],"middle":[[0,13.94,-2.13]],"top":[[0,39,0]],"target":[[0,14.38,-35.14]],"special":[[0.42,32.58,-38.46]],"mouth":[[0.42,32.58,-38.46]],"physical":[[3.94,34.69,89]],"eye":[[5.87,33.84,-42.71],[-5.12,33.52,-42.64]],"face":[[0.48,30.09,-47.92]]},"beldum":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,13,0]],"target":[[-0.18,13.59,-6.46]],"special":[[0.49,4.01,0.39]],"physical":[[0.49,4.01,0.39]],"eye":[[-0.29,15.67,-3.12]],"face":[[-0.29,15.67,-3.12]]},"metang":{"root":[[0,0,0]],"middle":[[0,14.5,0]],"top":[[0,21,0]],"target":[[0,10.5,-12]],"special":[[-0.12,14.39,-11.71]],"hand_primary":[[-10.43,8.29,-9.97]],"physical":[[-10.43,8.29,-9.97]],"eye":[[3.17,16.36,-5.22],[-3.33,16.31,-5.16]],"face":[[-0.12,14.39,-11.71]],"hand_secondary":[[10.31,8.44,-10.15]]},"metagross":{"root":[[0,0,0]],"middle":[[0,13.9,0]],"top":[[0,35.5,0]],"target":[[0,13.9,-19]],"special":[[-0.04,7.27,-9.36]],"mouth":[[-0.04,7.27,-9.36]],"hand_primary":[[-26.11,1.99,-12.9],[-23.23,2.02,18.77]],"physical":[[-26.11,1.99,-12.9]],"eye":[[5.44,14.69,-13.08],[-5.56,14.67,-13.04]],"face":[[-0.07,13.24,-16.38]],"hand_secondary":[[26.11,1.99,-12.9],[23.47,2,19.43]]},"regirock":{"eye":[[0,40,-4.5],[3,40,-4.5],[3,43,-4.5],[3,37,-4.5],[-3,40,-4.5],[-3,43,-4.5],[-3,37,-4.5]]},"regice":{"eye":[[2,33,-6],[5,33,-6],[1,33,-6],[1,36,-6],[1,30,-6],[-2,33,-6],[-5,33,-6]]},"registeel":{"eye":[[0,31.75,-11],[4,31.75,-11],[2,35.25,-11],[2,28.25,-11],[-4,31.75,-11],[-2,35.25,-11],[-2,28.25,-11]]},"latias":{"eye":[[4.5,17.5,-30.5],[-4.5,17.5,-30.5]]},"latios":{"eye":[[4,16.75,-33.5],[-4,16.75,-33.5]]},"rayquaza":{"root":[[0,0,0]],"middle":[[0,50,0]],"top":[[0,92,0]],"target":[[0,-1,-64]],"special":[[0,6.95,-113]],"mouth":[[0,6.95,-113]],"hand_primary":[[-30.9,6.8,-72]],"physical":[[0,6.95,-113]],"eye":[[6.6,10.5,-118.4],[-6.6,10.5,-118.4]],"face":[[0,12,-127.15]],"hand_secondary":[[30.9,6.8,-72]]},"turtwig":{"root":[[0,0,0]],"middle":[[0,6,0]],"top":[[0,20,0]],"target":[[0,7,-11]],"special":[[0,6.75,-7]],"mouth":[[0,6.75,-4.5]],"physical":[[0,6.75,-7]],"eye":[[3.5,9.75,-8],[-3.5,9.75,-8]],"face":[[0,9.75,-9]]},"grotle":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,26.5,0]],"target":[[0,10,-20]],"special":[[0.14,7.67,-13.54]],"mouth":[[0.1,8.73,-12.46]],"physical":[[0.14,7.67,-13.54]],"eye":[[3.57,11.93,-13.57],[-3.43,11.81,-13.7]],"face":[[0.11,12.16,-16.37]]},"torterra":{"root":[[0,0,0]],"middle":[[0,14,0]],"top":[[0,53.5,0]],"target":[[0,10,-34]],"special":[[0,10,-25]],"mouth":[[0,10,-23]],"physical":[[0,10,-25]],"eye":[[4.5,13,-25],[-4.5,13,-25]],"face":[[0,13,-30.5]]},"chimchar":{"root":[[0,0,0]],"middle":[[0,9.6,0]],"top":[[0,27,0]],"target":[[0,11.6,-8]],"special":[[0.69,11.12,-5.7]],"mouth":[[0.69,11.12,-5.7]],"hand_primary":[[-5.08,5.03,-7.74]],"physical":[[-5.08,5.03,-7.74]],"eye":[[-1.66,14.05,-6.91],[3.33,13.88,-6.68]],"face":[[0.89,14.28,-7.82]],"hand_secondary":[[3.59,7.18,-7.81]]},"monferno":{"root":[[0,0,0]],"middle":[[0,13.5,0]],"top":[[0,29.25,0]],"target":[[0,16,-6]],"special":[[-0.21,19.29,-5.26]],"mouth":[[-0.21,19.29,-5.26]],"hand_primary":[[-6.4,13.91,-9]],"physical":[[-6.4,13.91,-9]],"eye":[[1.93,22.21,-5.61],[-2.45,22.15,-5.45]],"face":[[-0.32,21.86,-7.26]],"hand_secondary":[[10.13,11.09,-2.2]]},"infernape":{"root":[[0,0,0]],"middle":[[0,21,1]],"top":[[0,50.25,0]],"target":[[-8.19,23,-4.74]],"special":[[-3.82,27.34,-7.2]],"mouth":[[-3.82,27.34,-7.2]],"hand_primary":[[-19.49,14.46,1.46]],"physical":[[-19.49,14.46,1.46]],"eye":[[-7.12,30.89,-7.89],[-1.68,31.59,-8.36]],"face":[[-4.4,29.16,-11.22]],"hand_secondary":[[3.91,14.72,-17.48]]},"piplup":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,17,0]],"target":[[2.03,7.75,-6.44]],"special":[[0.18,-0.19,-1.07]],"mouth":[[0.6,10.76,-5.67]],"physical":[[0.69,11.5,-7.17]],"eye":[[3.64,12.45,-5.55],[-2.36,12.57,-5.82]],"face":[[0.71,12.75,-7.18]]},"prinplup":{"root":[[0,0,0]],"middle":[[-0.3,13,-0.05]],"top":[[0,27.75,0]],"target":[[1.8,14,-6.72]],"special":[[0.72,18.93,-6.22]],"mouth":[[0.72,18.93,-6.22]],"physical":[[0.82,19.91,-8.17]],"eye":[[3.25,20.63,-6.12],[-1.75,20.73,-6.34]],"face":[[0.84,20.66,-8.18]]},"empoleon":{"root":[[0,0,0]],"middle":[[0,24,0]],"top":[[0,52,0]],"target":[[-5,27,-8.66]],"special":[[-0.86,36.81,-4]],"mouth":[[-0.86,36.81,-4]],"hand_primary":[[-25.03,28.47,13.15]],"physical":[[-25.03,28.47,13.15]],"eye":[[0.6,39.22,-5.4],[-2.55,39.28,-4.96]],"face":[[-1.32,38.62,-7.55]],"hand_secondary":[[23.9,28.47,-15.1]]},"starly":{"root":[[0,0,0]],"middle":[[0,6,0]],"top":[[0,12,0]],"target":[[0,6,-8]],"special":[[0,7.2,-5.1]],"mouth":[[0,7.2,-5.1]],"physical":[[0,7.75,-8]],"eye":[[2,8,-5.1],[-2,8,-5.1]],"face":[[0,8.2,-5.1]]},"staravia":{"root":[[0,0,0]],"middle":[[0,9,0]],"top":[[0,16,0]],"target":[[0,9,-9]],"special":[[0,10.9,-6.6]],"mouth":[[0,10.9,-6.6]],"physical":[[0,11.5,-9]],"eye":[[-1.75,12,-6.6],[1.75,12,-6.6]],"face":[[0,12,-6.6]]},"staraptor":{"root":[[0,0,0]],"middle":[[0,18.9,0]],"top":[[0,32,0]],"target":[[0,18.9,-16]],"special":[[-0.06,23.56,-11.55]],"mouth":[[-0.06,23.56,-11.55]],"physical":[[-0.04,23.48,-15.19]],"eye":[[-1.75,25.2,-10.84],[1.64,25.19,-10.82]],"face":[[-0.04,24.93,-12.48]]},"bidoof":{"root":[[0,0,0]],"middle":[[0,6.75,0]],"top":[[0,13.5,0]],"target":[[0,6.75,-9.5]],"special":[[0,4.25,-9.5]],"mouth":[[0,4.25,-9.5]],"physical":[[0,2.25,-9.5]],"eye":[[-2.75,7.5,-8.52],[2.75,7.5,-8.52]],"face":[[0,6.75,-9.5]]},"bibarel":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,20,0]],"target":[[0,10,-18]],"special":[[0,8.5,-16.5]],"mouth":[[0,8.5,-16.5]],"physical":[[0,8.5,-16.5]],"eye":[[-2.05,13.5,-14.5],[2.05,13.5,-14.5]],"face":[[0,13,-14.5]]},"kricketot":{"eye":[[2.57,9.07,-3.12],[-1.92,9.27,-3.12]]},"kricketune":{"eye":[[3.5,20.57,-2.99],[-3.5,20.57,-2.99]]},"shinx":{"root":[[0,0,0]],"middle":[[0,9,0]],"top":[[0,20,0]],"target":[[0,9,-10]],"special":[[0,9.75,-8.25]],"mouth":[[0,9.75,-8.25]],"physical":[[0,16.75,-8.25]],"eye":[[-2.7,12.25,-8.25],[2.7,12.25,-8.25]],"face":[[0,12.25,-8.25]]},"luxio":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,25,0]],"target":[[0,11,-14]],"special":[[0,13.75,-11.75]],"mouth":[[0,13.75,-11.75]],"physical":[[-3.1,0.5,-6.1]],"eye":[[-2.5,16.6,-11.75],[2.5,16.6,-11.75]],"face":[[0,16.25,-11.75]]},"luxray":{"root":[[0,0,0]],"middle":[[0,18,0]],"top":[[0,35,0]],"target":[[0,18,-20]],"special":[[0,21.3,-16]],"mouth":[[0,21.3,-16]],"physical":[[-3.8,0.5,-8.5]],"eye":[[2.45,24.3,-15.5],[-2.45,24.3,-15.5]],"face":[[0,24.5,-15.5]]},"budew":{"root":[[0,0,0]],"middle":[[0,7,0]],"top":[[0,18.5,0]],"target":[[0,6.75,-5.75]],"special":[[1.32,12.91,0.6]],"mouth":[[0.22,4.45,-3.85]],"physical":[[0.88,9.52,-1.08]],"eye":[[2.38,5.71,-3.85],[-1.6,6.17,-3.73]],"face":[[0.28,4.95,-3.82]]},"roserade":{"root":[[0,0,0]],"middle":[[0,15,0]],"top":[[0,30,0]],"target":[[0,15,-4]],"special":[[6.28,16.07,-12.39]],"mouth":[[-0.18,18.92,-3.46]],"hand_primary":[[-10.29,14.83,4.74]],"physical":[[-10.29,14.83,4.74]],"eye":[[1.85,21.15,-3.48],[-2.15,21.19,-3.56]],"face":[[-0.16,20.17,-3.48]],"hand_secondary":[[6.28,16.07,-12.39]]},"cranidos":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,24.5,0]],"target":[[0,11,-8.5]],"special":[[-0.11,12.66,-9.6]],"mouth":[[-0.11,12.66,-9.6]],"hand_primary":[[-3.28,8.28,-5.73]],"physical":[[-0.03,21.59,-8.21]],"eye":[[-4.63,15.52,-8.81],[4.47,15.47,-8.93]],"face":[[-0.12,16.89,-12.57]],"hand_secondary":[[3.07,8.21,-5.78]]},"rampardos":{"eye":[[-4.22,27.98,-22.99],[3.78,28.09,-23.15]]},"shieldon":{"eye":[[3.19,7.33,-11.12],[-1.8,7.27,-11.46]]},"bastiodon":{"root":[[0,0,0]],"middle":[[0,12.5,0]],"top":[[0,26.6,0]],"target":[[0,12.5,-21.5]],"special":[[-0.56,7.55,-12.6]],"mouth":[[-0.56,7.55,-12.6]],"physical":[[-0.75,18.66,-18.64]],"eye":[[4.14,10.42,-16.91],[-5.36,10.25,-16.91]],"face":[[-0.56,7.59,-19.47]],"jaw_lower":[[-0.57,8.03,-18.18]]},"burmy":{"root":[[0,0,0]],"middle":[[0,8.5,0]],"top":[[0,24,0]],"target":[[0,8.5,-6]],"special":[[0,10.5,-4.5]],"mouth":[[0,10.25,-3.75]],"physical":[[0,3.75,0]],"eye":[[1.65,11.75,-3.4],[-1.65,11.75,-3.4]],"face":[[0,11.75,-3.4]]},"wormadam":{"root":[[0,0,0]],"middle":[[0,8.5,0]],"top":[[0,27.5,0]],"target":[[0,8.5,-8]],"special":[[0,11.5,-6.25]],"physical":[[0,3.65,0]],"eye":[[1.55,12.75,-2.75],[-1.55,12.75,-2.75]],"face":[[0,13,-2.75]]},"mothim":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,21,0]],"target":[[0,9,-5.5]],"special":[[0,11.5,-5.25]],"mouth":[[0,12,-3.5]],"hand_primary":[[-4.1,10.25,-0.75]],"physical":[[0,17.5,-0.5]],"eye":[[1.75,14.5,-3.5],[-1.75,14.5,-3.5]],"face":[[0,14.5,-4]],"hand_secondary":[[4.1,10.25,-0.75]]},"combee":{"eye":[[-1.5,8.25,-2.4],[-4.5,8.25,-2.4],[-1.5,2.25,-2.4],[1.5,2.25,-2.4],[4.5,8.25,-2.4],[1.5,8.25,-2.4]]},"vespiquen":{"eye":[[-1.6,22.6,-5.55],[1.6,22.6,-5.55]]},"pachirisu":{"root":[[0,0,0]],"middle":[[0,8.5,0]],"top":[[0,24,0]],"target":[[0,9.5,-10]],"special":[[0,20.73,6.9]],"mouth":[[0,9.42,-8.43]],"hand_primary":[[-1.95,6.79,-6]],"physical":[[0,17.05,23.5]],"eye":[[-3.14,12.92,-8.48],[3.14,12.92,-8.48]],"face":[[0,12.42,-8.43]],"hand_secondary":[[1.95,6.79,-6]]},"buizel":{"eye":[[3,20,-2.5],[-3,20,-2.5]]},"floatzel":{"eye":[[3,24,-3],[-3,24,-3]]},"cherubi":{"root":[[0,0,0]],"middle":[[0,6,0]],"top":[[0,16,0]],"target":[[0,5,-6]],"special":[[0,3,-4]],"mouth":[[0,3,-4]],"physical":[[5.2,10.54,4.36]],"eye":[[3,5,-4],[-3,5,-4],[6.89,10.95,5.82],[5.94,8.67,5.42]],"face":[[0,5,-4]]},"cherrim":{"root":[[0,0,0]],"middle":[[0,9,0]],"top":[[0,20,0]],"target":[[0,7,-6]],"special":[[0,2.5,-3]],"physical":[[0,25.5,0]],"eye":[[2.5,2.5,-3],[-2.5,2.5,-3]],"face":[[0,2.5,-3]]},"shellos":{"eye":[[2.53,13.07,-11.27],[-3.45,12.61,-11.08]]},"gastrodon":{"eye":[[3.5,25.75,-14.25],[-3.5,25.75,-14.25]]},"ambipom":{"root":[[0,0,0]],"middle":[[0,17,0]],"top":[[0,36,0]],"target":[[0,17,-5]],"special":[[15.35,36.66,5.24]],"mouth":[[0.25,22.01,-7.85]],"hand_primary":[[15.35,36.66,5.24],[-15.29,36.84,4.68]],"physical":[[-15.29,36.84,4.68]],"eye":[[4.2,25.52,-8.27],[-3.29,25.93,-8.37]],"face":[[0.35,23.74,-8.07]],"hand_secondary":[[9.02,9,-6.92],[-9.25,9.45,-7.06]]},"drifloon":{"eye":[[3.25,19,-5.05],[-3.25,19,-5.05]]},"drifblim":{"eye":[[10,27.5,-12],[-10,27.5,-12]]},"buneary":{"root":[[0,0,0]],"middle":[[0,10.5,0]],"top":[[0,33,0]],"target":[[0,10,-6]],"special":[[0.26,12.75,-6.52]],"mouth":[[0.26,12.75,-6.52]],"hand_primary":[[-1.58,8.55,-5.47]],"physical":[[1.03,19.81,-4.05]],"eye":[[3.85,15.33,-6.53],[-2.6,16.11,-6.74]],"face":[[0.51,14.73,-6.6]],"hand_secondary":[[1.31,8.26,-5.31]]},"lopunny":{"root":[[0,0,0]],"middle":[[1.56,23,-2.5]],"top":[[0,51.5,0]],"target":[[1.56,22.5,-7]],"special":[[1.02,27.31,-13.31]],"mouth":[[1.02,27.31,-13.31]],"hand_primary":[[-1.04,22.04,-14.98]],"physical":[[-1.04,22.04,-14.98]],"eye":[[4.69,30.88,-11.34],[-3.28,30.29,-11.67]],"face":[[0.89,29.29,-13.59]],"hand_secondary":[[3.79,22.42,-14.84]]},"mismagius":{"root":[[0,0,0]],"middle":[[0,20,0]],"top":[[0,40,0]],"target":[[0,19,-6]],"special":[[0,19,-6]],"mouth":[[0,23.5,-4]],"hand_primary":[[-2.7,14,-17]],"physical":[[-2.7,14,-17]],"eye":[[-2.8,25.75,-4],[2.8,25.75,-4]],"face":[[0,25,-4]],"hand_secondary":[[2.7,14,-17]]},"honchkrow":{"root":[[0,0,0]],"middle":[[0.05,15.49,0.1]],"top":[[0,29,0]],"target":[[-6.41,13.49,-12.32]],"special":[[-2.02,20.89,-7]],"mouth":[[-2.02,20.89,-7]],"physical":[[-2.17,20.42,-11.76]],"eye":[[-4.41,21.8,-7.01],[0.38,21.78,-7.16]],"face":[[-2.17,20.45,-11.88]]},"glameow":{"eye":[[2.5,13.1,-7.5],[-2.5,13.1,-7.5]]},"purugly":{"eye":[[3,16.7,-10.5],[-3,16.7,-10.5]]},"chingling":{"root":[[0,0,0]],"middle":[[0,6.5,0]],"top":[[0,14,0]],"target":[[0,5,-6.5]],"special":[[0,3.45,-4]],"mouth":[[0,3.45,-4]],"hand_primary":[[-6.1,4,1]],"physical":[[0,9.05,-4]],"eye":[[2.25,5,-4],[-2.25,5,-4]],"face":[[0,5,-4]],"hand_secondary":[[6.1,4,1]]},"stunky":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,22,0]],"target":[[0,7,-12.5]],"special":[[0,8.5,6]],"mouth":[[0,3.8,-8.2]],"physical":[[-2.5,0.5,-6.5]],"eye":[[1.4,7.8,-10.8],[-1.4,7.8,-10.8]],"face":[[0,7.55,-10.8]]},"skuntank":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,28,0]],"target":[[0,8,-20]],"special":[[0,15.25,-21]],"mouth":[[0,5.25,-12.5]],"physical":[[0,5.25,-13.75]],"eye":[[1.75,9.1,-13.25],[-1.75,9.1,-13.25]],"face":[[0,8.75,-14.5]]},"bronzor":{"eye":[[3.25,9,-1],[-3.25,9,-1]]},"bronzong":{"root":[[0,0,0]],"middle":[[0,12.5,0]],"top":[[0,39.5,0]],"target":[[0,11,-13]],"special":[[0,0,-7]],"hand_primary":[[-32,24,0]],"physical":[[0,0,-7]],"eye":[[6,7.5,-10.5],[-6,7.5,-10.5]],"face":[[0,7.5,-10]],"hand_secondary":[[32,24,0]]},"bonsly":{"eye":[[2.25,10.14,-3.83],[-2.25,10.14,-3.83]]},"mimejr":{"eye":[[2.75,10.75,-4],[-2.75,10.75,-4]]},"happiny":{"root":[[0,0,0]],"middle":[[0,7,0]],"top":[[0,20.75,0]],"target":[[0,7,-7]],"special":[[-0.03,8.68,-3.92]],"mouth":[[-0.03,8.68,-3.92]],"hand_primary":[[-2.58,7.08,-4.66]],"physical":[[0,7,-6]],"eye":[[1.71,9.68,-4.02],[-1.78,9.68,-3.99]],"face":[[-0.03,9.68,-4.01]],"hand_secondary":[[2.5,7.08,-4.71]]},"chatot":{"eye":[[3,10.75,-3.4],[-3,10.75,-3.4]]},"spiritomb":{"eye":[[-2.5,15,-9],[2.5,15.5,-9]]},"gible":{"root":[[0,0,1]],"middle":[[0,10,0]],"top":[[0,21,0]],"target":[[0,8,-13]],"special":[[0,8.8,-4.5]],"mouth":[[0,8.8,-4.5]],"hand_primary":[[-9.5,7.65,-1.75]],"physical":[[0,8.8,-4.5]],"eye":[[3.4,10.65,-8.6],[-3.4,10.65,-8.6]],"face":[[0,11.5,-11.95]],"hand_secondary":[[9.5,7.65,-1.75]]},"gabite":{"root":[[0,0,1]],"middle":[[-0.65,15,0.64]],"top":[[0,29,0]],"target":[[3.94,14,-5.91]],"special":[[2.3,21.47,-6.44]],"mouth":[[2.3,21.47,-6.44]],"hand_primary":[[-0.4,11.48,-12.02]],"physical":[[-0.4,11.48,-12.02]],"eye":[[4.95,21.86,-9.01],[-0.05,21.82,-9.29]],"face":[[2.69,19.66,-13.19]],"hand_secondary":[[7.09,11.29,-4.73]]},"garchomp":{"root":[[0,0,1]],"middle":[[0,22.93,0.18]],"top":[[0,38.5,0]],"target":[[1.95,20.29,-8.2]],"special":[[1.53,33.4,-13.31]],"mouth":[[1.53,33.4,-13.31]],"hand_primary":[[-6.87,21.42,-22.94]],"physical":[[-6.87,21.42,-22.94]],"eye":[[4.25,33.65,-16.69],[-1.29,33.74,-16.61]],"face":[[1.44,32.98,-19.2]],"hand_secondary":[[20.21,18.82,-5.92]]},"munchlax":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,22,0]],"target":[[0,9,-6]],"special":[[-0.07,11.47,-4.17]],"mouth":[[-0.07,11.47,-4.17]],"hand_primary":[[-8.06,6.21,-0.62]],"physical":[[-8.06,6.21,-0.62]],"eye":[[-1.61,13.96,-4.62],[1.39,14,-4.67]],"face":[[-0.11,13.98,-4.65]],"hand_secondary":[[8.06,6.26,0.11]]},"riolu":{"root":[[0,0,0]],"middle":[[-0.05,13.02,-0.01]],"top":[[0,26,0]],"target":[[1.14,13.02,-5.38]],"special":[[-3.16,13.6,-6.2]],"mouth":[[0.26,16.04,-4.55]],"hand_primary":[[-3.16,13.6,-6.2]],"physical":[[-3.16,13.6,-6.2]],"eye":[[2.19,19.45,-4.37],[-1.81,19.35,-4.35]],"face":[[0.18,19.43,-4.87]],"hand_secondary":[[5.23,11.21,0.36]]},"lucario":{"root":[[0,0,0]],"middle":[[0.5,24.35,0]],"top":[[0,46.5,0]],"target":[[-3.26,23.85,-5.9]],"special":[[-8.61,27.78,-0.08]],"mouth":[[-0.67,31.41,-3.97]],"hand_primary":[[-9.84,26.94,0.13]],"physical":[[-9.84,26.94,0.13]],"eye":[[1.91,34.63,-4.28],[-3.08,34.75,-4.31]],"face":[[-0.59,34.39,-4.26]],"hand_secondary":[[4.06,22.49,-11.69]]},"hippopotas":{"eye":[[1.63,18.48,-4.16],[-1.1,18.58,-4.1]]},"hippowdon":{"eye":[[14.58,28.94,-26.12],[-13.41,29.47,-26.6]]},"skorupi":{"eye":[[2.6,8.25,-11.1],[-2.6,8.25,-11.1]]},"drapion":{"eye":[[4.3,12.5,-39.4],[-4.3,12.5,-39.4]]},"croagunk":{"eye":[[1.16,19.13,-11.97],[-6,18.96,-9.75]]},"toxicroak":{"eye":[[5.68,23.72,-16.57],[-4.19,23.53,-15.79]]},"carnivine":{"eye":[[5.15,25.72,-14.24],[-5.84,26.22,-13.98]]},"finneon":{"eye":[[0,0,-2.65],[0,3,-2.65]]},"lumineon":{"eye":[[-4,6,-8],[4,6,-8]]},"mantyke":{"eye":[[-3.5,3.5,-7],[3.5,3.5,-7]]},"snover":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,23,0]],"target":[[0,10,-8]],"special":[[0,10.5,-7]],"hand_primary":[[-16.5,11.5,0]],"physical":[[-16.5,11.5,0]],"eye":[[-2.4,12.7,-5.5],[2.4,12.7,-5.5]],"face":[[0,12,-5.5]],"hand_secondary":[[16.5,11.5,0]]},"abomasnow":{"root":[[0,0,0]],"middle":[[0,24,0]],"top":[[0,40,0]],"target":[[0,24,-14]],"special":[[0,31,-8.5]],"mouth":[[0,31,-8.5]],"hand_primary":[[-33.5,26.5,0.5]],"physical":[[-33.5,26.5,0.5]],"eye":[[-3.15,36.25,-8.5],[3.15,36.25,-8.5]],"face":[[0,36,-8.5]],"hand_secondary":[[33.5,26.5,0.5]]},"weavile":{"root":[[0,0,0]],"middle":[[0,11.15,0]],"top":[[0,28,0]],"target":[[-0.59,10.15,-6.05]],"special":[[-6.59,7.85,-1.88]],"mouth":[[-0.29,14.53,-5.05]],"hand_primary":[[-6.59,7.85,-1.88]],"physical":[[-6.59,7.85,-1.88]],"eye":[[-2.3,17.12,-5.13],[1.7,17.14,-5.13]],"face":[[-0.3,17.13,-5.13]],"hand_secondary":[[5.38,8.41,-5.1]]},"magnezone":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,27.5,0]],"target":[[0,10,-18]],"special":[[0,13.5,-11.5],[13.5,8,-19],[-13.5,8,-19]],"physical":[[0,10,-15]],"eye":[[0,13.5,-11.5],[15.5,12.1,-4.5],[-15.5,12.1,-4.5]],"face":[[0,10,-15]]},"lickilicky":{"root":[[0,0,0]],"middle":[[0,21,0]],"top":[[0,47,0]],"target":[[0,21,-13.5]],"special":[[1.07,32.2,-5.43]],"mouth":[[1.07,32.2,-5.43]],"hand_primary":[[-16.77,18.33,-0.89]],"physical":[[-16.77,18.33,-0.89]],"eye":[[5.57,35.49,-4.23],[-3.43,35.54,-4.38]],"face":[[1.07,35.51,-4.31]],"hand_secondary":[[17.16,18.32,-7.03]]},"rhyperior":{"eye":[[9.19,37.97,-12.15],[-6.73,38.27,-13.68]]},"tangrowth":{"eye":[[1,12.5,-4.5],[-1,12.5,-4.5]]},"electivire":{"eye":[[3.4,32.9,-8.25],[-3.4,32.9,-8.25]]},"magmortar":{"root":[[0,0,0]],"middle":[[0,25,0]],"top":[[0,46,0]],"target":[[0,25,-10]],"special":[[-33.5,30.5,-1]],"mouth":[[0,30,-7]],"hand_primary":[[-33.5,30.5,-1]],"physical":[[-33.5,30.5,-1]],"eye":[[-2.7,33.2,-8.5],[2.7,33.2,-8.5]],"face":[[0,33,-8.5]],"hand_secondary":[[33.5,30.5,-1]]},"togekiss":{"root":[[0,0,0]],"middle":[[0.04,16.61,0.08]],"top":[[0,28,0]],"target":[[0.1,14.84,-16.83]],"special":[[-23.14,20.28,13.42],[0.1,14.66,-15.91]],"mouth":[[0.1,14.66,-15.91]],"hand_primary":[[-23.14,20.28,13.42]],"physical":[[0.06,15.91,-15.92]],"eye":[[3,17.71,-15.93],[-3,17.5,-15.93]],"face":[[0.06,15.91,-15.92]],"hand_secondary":[[22.9,21.88,13.42]]},"yanmega":{"root":[[0,0,0]],"middle":[[0,11,-0.75]],"top":[[0,14.8,0]],"target":[[0,8,-18.5]],"mouth":[[0,8.25,-16]],"face":[[0,10.5,-17.5]]},"leafeon":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,23,0]],"target":[[0,11,-13]],"special":[[0,14.75,-11]],"mouth":[[0,14.75,-11]],"physical":[[0,14.75,-11]],"eye":[[-2.15,17.95,-10.9],[2.15,17.95,-10.9]],"face":[[0,17.6,-10.9]]},"glaceon":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,22.5,0]],"target":[[0,11,-13]],"special":[[0,14.75,-11.2]],"mouth":[[0,14.75,-11.2]],"physical":[[0,14.75,-11.2]],"eye":[[-2.15,17.6,-11],[2.15,17.6,-11]],"face":[[0,17.6,-11]]},"gliscor":{"eye":[[2.25,21,-6.25],[-2.25,21,-6.25]]},"mamoswine":{"root":[[0,0,0]],"middle":[[0,33.5,0]],"top":[[0,56.75,0]],"target":[[0,24.5,-37]],"special":[[0,25.39,-28]],"mouth":[[0,25.39,-28]],"physical":[[-17.26,33.44,-51.19],[17.26,33.44,-51.19]],"eye":[[9.27,44.67,-28.85],[-9.27,44.67,-28.85]],"face":[[0,44.3,-28.49]]},"porygonz":{"root":[[0,0,0]],"middle":[[0,15.4,0]],"top":[[0,36.7,0]],"target":[[0,15.5,-5]],"special":[[0,24.55,-9.5]],"hand_primary":[[-13.6,17.95,-0.5]],"physical":[[0,24.55,-9.5]],"eye":[[4,25.5,-1.47],[-4,25.5,-1.47]],"face":[[0,25.5,-8.5]],"hand_secondary":[[13.6,17.95,-0.5]]},"gallade":{"eye":[[3.38,28.62,-5.34],[-1.02,28.63,-5.52]]},"probopass":{"eye":[[-4.01,23.44,-6.11],[2.98,23.68,-6.35]]},"dusknoir":{"root":[[0,0,0]],"middle":[[0,31.48,-2.65]],"top":[[0,48,0]],"target":[[0,28.35,-15.43]],"special":[[-20.77,27.93,-31.19]],"mouth":[[0,29.75,-4.07]],"hand_primary":[[-20.77,27.93,-31.19]],"physical":[[-20.77,27.93,-31.19]],"eye":[[0,40.95,-16.36]],"face":[[0,41.14,-16.41]],"hand_secondary":[[20.77,27.93,-31.19]]},"froslass":{"eye":[[2.5,22.97,-4.84],[-2.5,22.97,-4.84]]},"rotom":{"eye":[[2,11.5,-3.5],[-2,11.5,-3.5]]},"regigigas":{"eye":[[0,84.68,-19.21],[0,98.66,-18.6],[5,91.67,-18.91],[-4.5,91.67,-18.91],[0,75.44,-19.19],[0,65.73,-18.34],[0,55.77,-17.47]]},"snivy":{"root":[[0,0,0]],"middle":[[0,11,-0.25]],"top":[[0,22.5,0]],"target":[[0,10,-8]],"special":[[-30.5,7.75,-13]],"mouth":[[0,1.1,-15.6]],"physical":[[-30.5,7.75,-13]],"eye":[[3.5,4.25,-18],[-3.5,4.25,-18]],"face":[[0,-4.5,-18.25]]},"servine":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,30,0]],"target":[[0,14,-10]],"special":[[-31,9.75,-15.75]],"physical":[[-31,9.75,-15.75]],"eye":[[3,3.5,-19],[-3,3.5,-19]],"face":[[0,-2,-19]]},"serperior":{"eye":[[-0.74,29.33,-8.42],[-6.74,29.41,-8.33]]},"tepig":{"root":[[0,0,0]],"middle":[[0,5.75,0]],"top":[[0,19.25,0]],"target":[[0,4,-14]],"special":[[-0.02,2.96,-10.02]],"mouth":[[-0.02,2.96,-10.02]],"physical":[[0.08,10.95,-9.17]],"eye":[[2.73,6.33,-10.96],[-2.67,6.4,-10.99]],"face":[[0.05,6.59,-12.92]]},"pignite":{"root":[[0,0,0]],"middle":[[0,12,1]],"top":[[0,24,0]],"target":[[0,14,-7]],"special":[[0.61,16.74,-3.19]],"mouth":[[0.61,16.74,-3.19]],"hand_primary":[[-10.36,20.04,1.81]],"physical":[[-10.36,20.04,1.81]],"eye":[[3.48,19.15,-3.38],[-2.32,19.07,-3.35]],"face":[[0.56,19.71,-4.38]],"hand_secondary":[[11.48,19.89,-0.79]]},"emboar":{"root":[[0,0,0]],"middle":[[0,19,0]],"top":[[0,40,0]],"target":[[0,22,-11]],"special":[[-0.47,27.77,-7.06]],"mouth":[[-0.47,27.77,-7.06]],"hand_primary":[[-23,14.76,-7.31]],"physical":[[-23,14.76,-7.31]],"eye":[[1.75,30.6,-7.49],[-2.94,30.39,-7.45]],"face":[[-0.58,30.02,-8.38]],"hand_secondary":[[14.75,16.67,-15.87]]},"oshawott":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,22.5,0]],"target":[[0,9.25,-8]],"special":[[-7.53,3.47,1.13]],"hand_primary":[[-5.15,5.96,0.44]],"physical":[[-7.53,3.47,1.13]],"eye":[[-3.93,15.72,-5.08],[3.57,15.72,-5.33]],"face":[[-0.21,14.99,-6.22]],"hand_secondary":[[5.15,5.96,0.1]]},"dewott":{"root":[[0,0,0]],"middle":[[0,15,0]],"top":[[0,30.5,0]],"target":[[0,16,-6]],"special":[[-8.86,9.75,-0.39],[8.09,10.49,-4.05]],"mouth":[[-0.21,20.39,-4.49]],"hand_primary":[[-7.16,12.07,0.65]],"physical":[[-8.86,9.75,-0.39],[8.09,10.49,-4.05]],"eye":[[-3.2,23.85,-4.63],[2.75,23.87,-4.89]],"face":[[-0.26,23.57,-5.49]],"hand_secondary":[[6.9,12.42,-2]]},"samurott":{"eye":[[-2.3,35.1,-13.7],[2.3,35.1,-13.7]]},"patrat":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,22.5,0]],"target":[[0,10,-5.5]],"special":[[0,18,-4]],"mouth":[[0,14,-4.5]],"hand_primary":[[-12,12.25,0]],"physical":[[0,14,-6]],"eye":[[2.5,17.75,-4.02],[-2.5,17.75,-4.02]],"face":[[0,17,-5.35]],"hand_secondary":[[12,12.25,0]]},"watchog":{"root":[[0,0,0]],"middle":[[0,20,0]],"top":[[0,40.5,0]],"target":[[0,20,-6.5]],"special":[[0,19.25,-4.5]],"mouth":[[0,31.25,-4.75]],"hand_primary":[[-18,23.25,0]],"physical":[[-18,23.25,0]],"eye":[[2,35.25,-4.5],[-2,35.25,-4.5]],"face":[[0,34.35,-5.75]],"hand_secondary":[[18,23.25,0]]},"lillipup":{"root":[[0,0,0]],"middle":[[0,9,0]],"top":[[0,20,0]],"target":[[0,8,-10]],"special":[[0,8.1,-7.7]],"mouth":[[0,8.1,-7.7]],"physical":[[0,8.1,-7.7]],"eye":[[-2.5,12.25,-7.3],[2.5,12.25,-7.3]],"face":[[0,11.3,-7.3]]},"herdier":{"root":[[0,0,0]],"middle":[[0,14,0]],"top":[[0,30,0]],"target":[[0,14,-13]],"special":[[0,15.7,-12.3]],"mouth":[[0,15.7,-12.3]],"physical":[[0,15.7,-12.3]],"eye":[[-2.2,19.85,-9.3],[2.2,19.85,-9.3]],"face":[[0,19.5,-12.3]]},"stoutland":{"root":[[0,0,0]],"middle":[[0,17,0]],"top":[[0,34,0]],"target":[[0,16,-19]],"special":[[0,19.7,-18]],"mouth":[[0,19.7,-18]],"physical":[[0,19.7,-18]],"eye":[[3,24.35,-16.2],[-3,24.35,-16.2]],"face":[[0,24.3,-17.7]]},"purrloin":{"eye":[[-1.25,20.43,-4.56],[3.29,20.47,-3.02]]},"liepard":{"eye":[[-3.05,31.22,-19.9],[3.05,31.22,-19.9]]},"pansage":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,26,0]],"target":[[0,11,-7]],"special":[[0,12.6,-4]],"mouth":[[0,12.6,-4]],"hand_primary":[[-11,10.75,0]],"physical":[[-11,10.75,0]],"eye":[[2.5,15.75,-4],[-2.5,15.75,-4]],"face":[[0,14.7,-4]],"hand_secondary":[[11,10.75,0]]},"simisage":{"root":[[0,0,0]],"middle":[[0,17,0]],"top":[[0,44,0]],"target":[[0,17,-7]],"special":[[0,20.6,-4]],"mouth":[[0,20.6,-4]],"hand_primary":[[-15.5,18.5,0]],"physical":[[-15.5,18.5,0]],"eye":[[2.8,24,-4],[-2.8,24,-4]],"face":[[0,23.5,-4]],"hand_secondary":[[-15.5,18.5,0]]},"pansear":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,24,0]],"target":[[0,11,-7]],"special":[[0,12.2,-4]],"mouth":[[0,12.2,-4]],"hand_primary":[[-11,10.35,0]],"physical":[[-11,10.35,0]],"eye":[[2.5,15.35,-4],[-2.5,15.35,-4]],"face":[[0,14.3,-4]],"hand_secondary":[[11,10.35,0]]},"simisear":{"root":[[0,0,0]],"middle":[[0,17,0]],"top":[[0,34,0]],"target":[[0,17,-7]],"special":[[0,21.1,-4]],"mouth":[[0,21.1,-4]],"hand_primary":[[-16,18.5,0]],"physical":[[-16,18.5,0]],"eye":[[2.75,24.25,-4],[-2.75,24.25,-4]],"face":[[0,24,-4]],"hand_secondary":[[-16,18.5,0]]},"panpour":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,25,0]],"target":[[0,11,-7]],"special":[[0,12.6,-4]],"mouth":[[0,12.6,-4]],"hand_primary":[[-11,10.75,0]],"physical":[[-11,10.75,0]],"eye":[[2.75,15.75,-4],[-2.75,15.75,-4]],"face":[[0,14.7,-4]],"hand_secondary":[[11,10.75,0]]},"simipour":{"root":[[0,0,0]],"middle":[[0,17,0]],"top":[[0,32,0]],"target":[[0,17,-7]],"special":[[0,20.1,-4]],"mouth":[[0,20.1,-4]],"hand_primary":[[-14.5,18.5,0]],"physical":[[-14.5,18.5,0]],"eye":[[3,24.25,-4],[-3,24.25,-4]],"face":[[0,23.5,-4]],"hand_secondary":[[14.5,18.5,0]]},"munna":{"root":[[0,0,0]],"middle":[[0,9,0]],"top":[[0,18,0]],"target":[[0,9,-8]],"special":[[0,3.4,-4]],"mouth":[[0,3.4,-4]],"physical":[[0,11,-7]],"eye":[[4.5,7.3,-4],[-4.5,7.3,-4]],"face":[[0,7,-7]]},"musharna":{"root":[[0,0,0]],"middle":[[0,12,-1]],"top":[[0,30,0]],"target":[[0,11,-19]],"special":[[0,21.9,-8]],"mouth":[[0,21.9,-8]],"hand_primary":[[-6.5,12.2,-12.5]],"physical":[[0,27.5,-10]],"eye":[[5.5,23.5,-3],[-5.5,23.5,-3]],"face":[[0,24.5,-14]],"hand_secondary":[[6.5,12.2,-12.5]]},"pidove":{"root":[[0,0,0]],"middle":[[0,7,0]],"top":[[0,16.5,0]],"target":[[0,7,-6.5]],"special":[[0.02,12.32,-4.3]],"mouth":[[0.02,12.32,-4.3]],"physical":[[0.01,12.47,-6.96]],"eye":[[3.02,12.99,-4.32],[-2.98,13.04,-4.31]],"face":[[0.03,13.72,-5.04]]},"tranquill":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,23,0]],"target":[[0,11,-7.5]],"special":[[0,15.5,-7]],"mouth":[[0,15.5,-7]],"physical":[[0,15.8,-8.8]],"eye":[[2.5,16.2,-6.7],[-2.5,16.2,-6.7]],"face":[[0,17,-7]]},"unfezant":{"root":[[0,0,2]],"middle":[[0,17,0]],"top":[[0,35,0]],"target":[[0,17,-10.5]],"special":[[0,24.1,-6.75]],"mouth":[[0,24.1,-6.75]],"physical":[[-2.5,0.9,0.3]],"eye":[[3,25,-5.3],[-3,25,-5.3]],"face":[[0,26,-6.75]]},"blitzle":{"root":[[0,0,0]],"middle":[[0,13,0]],"top":[[0,25,0]],"target":[[0,11,-12]],"special":[[-0.11,16.2,-9.49]],"mouth":[[-0.11,16.2,-9.49]],"physical":[[-0.11,16.2,-9.49]],"eye":[[2.83,20.4,-8.64],[-3.27,20.24,-8.64]],"face":[[-0.18,18.76,-12.09]]},"zebstrika":{"root":[[0,0,0]],"middle":[[0,19,0]],"top":[[0,34,0]],"target":[[0,16,-19]],"special":[[0,24.02,-16.92]],"mouth":[[0,24.02,-16.92]],"physical":[[0,24.02,-16.92]],"eye":[[3.05,27.26,-16.92],[-3.05,27.26,-16.92]],"face":[[0,25.09,-22]]},"roggenrola":{"root":[[0,0,0]],"middle":[[0,7,0]],"top":[[0,17,0]],"target":[[0,6,-6]],"special":[[-0.21,5.64,-4.33]],"physical":[[-0.21,5.64,-4.33]],"eye":[[-0.21,5.64,-4.33]],"face":[[-0.21,5.64,-4.33]]},"boldore":{"root":[[0,0,0]],"middle":[[0,9.95,0]],"top":[[0,21,0]],"target":[[0,9.95,-10]],"special":[[0.2,5.33,-8.91]],"physical":[[-9.46,0.34,-9.52]],"eye":[[2.03,7.76,-5.94],[-1.56,7.92,-6.05]],"face":[[0.28,7.8,-7.54]]},"gigalith":{"root":[[0,0,0]],"middle":[[0,18,0]],"top":[[0,33,0]],"target":[[0,17,-18]],"special":[[0.18,19.13,-9.84]],"physical":[[-10.66,0.5,-9.43]],"eye":[[-1.76,23.95,-8.41],[2.24,23.89,-8.41]],"face":[[0.22,22.54,-12.16]]},"woobat":{"root":[[0,0,0]],"middle":[[0,5,0]],"top":[[0,16,0]],"target":[[0,6,-8]],"special":[[0,2,-5]],"mouth":[[0,2,-5]],"physical":[[0,10,-4]],"eye":[[4.1,5.4,-5],[-4.1,5.4,-5]],"face":[[0,5,-6]]},"swoobat":{"root":[[0,0,0]],"middle":[[0,14,0]],"top":[[0,32,0]],"target":[[0,16,-10]],"special":[[0,14.5,-5]],"mouth":[[0,14.5,-5]],"physical":[[-3,-6.5,-1]],"eye":[[4.1,18.15,-5],[-4.1,18.15,-5]],"face":[[0,18,-6]]},"drilbur":{"root":[[0,0,0]],"middle":[[0.01,10.5,-0.04]],"top":[[0,18,0]],"target":[[0.79,8.22,-6.4]],"special":[[-12.2,21.04,-3.19]],"mouth":[[0.57,10.83,-5.01]],"hand_primary":[[-10.18,16.41,-2.31]],"physical":[[-12.2,21.04,-3.19]],"eye":[[-2.86,14.59,-3.94],[4.12,14.32,-3.51]],"face":[[1.17,15.17,-12.04]],"hand_secondary":[[11.09,15.13,-2.48]]},"excadrill":{"root":[[0,0,0]],"middle":[[0,13,0]],"top":[[0,26,0]],"target":[[1.65,12,-9.36]],"special":[[-13.48,7.04,-13.01]],"mouth":[[2.3,15.75,-8.17]],"hand_primary":[[-10.31,10.18,-10.02]],"physical":[[-13.48,7.04,-13.01]],"eye":[[0.53,17.76,-12.51],[6.2,18,-10.56]],"face":[[5.02,15.12,-15.99]],"hand_secondary":[[11.54,13.72,6.08]]},"audino":{"root":[[0,0,0]],"middle":[[0,15,0]],"top":[[0,30,0]],"target":[[0,16,-8]],"special":[[0,20.74,-5.47]],"mouth":[[0,20.74,-5.47]],"hand_primary":[[-10.18,10.75,0]],"physical":[[-10.18,10.75,0]],"eye":[[-2.95,23.5,-5],[2.95,23.5,-5]],"face":[[0,23.2,-5]],"hand_secondary":[[10.18,10.75,0]]},"timburr":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,24,0]],"target":[[1.8,10,-5.72]],"special":[[0.57,12.56,-6.78]],"mouth":[[0.57,12.56,-6.78]],"hand_primary":[[8.48,9.67,4.19]],"physical":[[14.25,3.89,-7.61]],"eye":[[3.33,15.76,-7.54],[-2.16,15.83,-7.33]],"face":[[0.59,15.79,-7.43]],"hand_secondary":[[-5.3,7.35,-8.18]]},"gurdurr":{"root":[[0,0,0]],"middle":[[0,16,0]],"top":[[0,34,0]],"target":[[4.5,16,-5.36]],"special":[[3.89,22.38,-4.28]],"mouth":[[3.89,22.38,-4.28]],"hand_primary":[[-9.59,34.42,-13.09]],"physical":[[-15.04,36.98,-19.42]],"eye":[[5.75,26.42,-2.99],[1.11,26.38,-5.23]],"face":[[3.58,26.85,-3.87]],"hand_secondary":[[13.32,32.77,17.85]]},"conkeldurr":{"root":[[0,0,0]],"middle":[[0,19.75,4]],"top":[[0,35,0]],"target":[[0,15.75,-16]],"special":[[0.07,20.15,-17.87]],"mouth":[[0.07,20.15,-17.87]],"hand_primary":[[-21.38,26.03,-18.19]],"physical":[[-22.28,5.83,-23.89]],"eye":[[2.42,23.59,-18.51],[-2.29,23.59,-18.49]],"face":[[0.07,23.2,-18.43]],"hand_secondary":[[21.49,25.9,-18.56]]},"tympole":{"root":[[0,0,0]],"middle":[[0,4,0]],"top":[[0,9,0]],"target":[[0,4,-5]],"special":[[0,1.17,-3.95]],"mouth":[[0,1.17,-3.95]],"physical":[[0,0.52,14.97]],"eye":[[2.4,4.07,-3.83],[-2.4,4.07,-3.83]],"face":[[0,2.67,-3.89]]},"palpitoad":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,25,0]],"target":[[0,10,-7.5]],"special":[[0,10.97,-5.2]],"mouth":[[0,10.97,-5.2]],"physical":[[0,12.2,-4.18]],"eye":[[3,14.22,-5.2],[-3,14.22,-5.2]],"face":[[0,13.47,-5.95]]},"seismitoad":{"root":[[0,0,0]],"middle":[[0,14.8,0]],"top":[[0,32,0]],"target":[[0,14.8,-10]],"special":[[0,19.83,-13.09]],"mouth":[[0,19.83,-13.09]],"hand_primary":[[-16.84,9.3,-5.58]],"physical":[[0,20.53,-11.17]],"eye":[[3.25,23.8,-14.26],[-3.25,23.8,-14.26]],"face":[[0,20.9,-15.94]],"hand_secondary":[[16.84,9.3,-5.58]]},"throh":{"root":[[0,0,0]],"middle":[[0,19,0]],"top":[[0,33,0]],"target":[[0,19,-13]],"special":[[-17.74,15.38,-9.91]],"mouth":[[-0.23,22,-9]],"hand_primary":[[-17.74,15.38,-9.91]],"physical":[[-17.74,15.38,-9.91]],"eye":[[2.27,25.1,-11],[-2.73,25.1,-11]],"face":[[-0.23,25,-11]],"hand_secondary":[[19.99,24.1,-10.56]]},"sawk":{"root":[[0,0,0]],"middle":[[-0.63,18.25,-0.14]],"top":[[0,42,0]],"target":[[2.75,18.25,-7.39]],"special":[[-5.78,24.02,-18.99]],"mouth":[[1.4,25.64,-5.51]],"hand_primary":[[-5.78,24.02,-18.99]],"physical":[[-5.78,24.02,-18.99]],"eye":[[3.59,28.26,-8.88],[-0.9,28.29,-8.79]],"face":[[1.34,27.78,-8.78]],"hand_secondary":[[9.69,18.89,-5.27]]},"sewaddle":{"root":[[0,0,0]],"middle":[[0,7,0]],"top":[[0,14,0]],"target":[[0,5,-12]],"special":[[-0.01,3.77,-8.8]],"mouth":[[-0.01,3.77,-8.8]],"physical":[[0.18,9.76,-7.75]],"eye":[[2.83,6.43,-8.78],[-2.67,6.61,-8.78]],"face":[[0.07,6.27,-8.78]]},"swadloon":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,19.5,0]],"target":[[0,8,-8.75]],"special":[[0.05,5.06,-7.71]],"mouth":[[0.05,5.06,-7.71]],"physical":[[0.18,12.62,-10.11]],"eye":[[3.58,6.7,-8.43],[-3.42,6.82,-8.43]],"face":[[0.07,6.44,-8.3]]},"leavanny":{"root":[[0,0,0]],"middle":[[-2.5,22.55,0]],"top":[[0,44,0]],"target":[[-4.99,22.55,-6.01]],"special":[[-1.81,28.66,-5.25]],"mouth":[[-1.81,28.66,-5.25]],"hand_primary":[[-11.12,20.35,12.86]],"physical":[[-11.12,20.35,12.86]],"eye":[[1.45,30.51,-5.34],[-4.5,31.27,-5.3]],"face":[[-1.52,30.94,-5.32]],"hand_secondary":[[5.62,24.97,-15.61]]},"venipede":{"root":[[0,0,0]],"middle":[[0,9,0]],"top":[[0,18,0]],"target":[[0,7,-15]],"special":[[0,13.3,-10.5]],"mouth":[[0,2.3,-12]],"physical":[[0,13.3,-10.5]],"eye":[[4.2,4.7,-10.2],[-4.2,4.7,-10.2]],"face":[[0,8.35,-13.6]]},"whirlipede":{"root":[[0,0,0]],"middle":[[0,13.3,0]],"top":[[0,28,0]],"target":[[0,11.89,-14.94]],"special":[[0,12.65,-12.76]],"physical":[[0,12.65,-12.76]],"eye":[[4.3,12.38,0.1],[-4.3,12.38,0.1]],"face":[[0,12.28,-11.32]]},"scolipede":{"root":[[0,0,0]],"middle":[[-0.25,24.5,0.5]],"top":[[0,69.5,0]],"target":[[2.8,24.5,-34.37]],"special":[[1.66,38.59,-43.91]],"mouth":[[1.66,38.59,-43.91]],"physical":[[8.46,60.75,-62.37],[-6.9,60.49,-61.95]],"eye":[[5.13,42.36,-42.78],[-1.87,42.24,-42.59]],"face":[[1.58,38.99,-46.49]]},"cottonee":{"root":[[0,0,0]],"middle":[[0.01,6,0]],"top":[[0,14,0]],"target":[[0.72,4.99,-6.96]],"special":[[0.67,4.79,-6.46]],"hand_primary":[[-11.18,7.58,-1.69]],"physical":[[0.64,11.49,-5.17]],"eye":[[2.96,5.95,-4.21],[-2.01,6.04,-4.74]],"face":[[0.47,5.49,-4.48]],"hand_secondary":[[11.34,6.91,0.68]]},"whimsicott":{"root":[[0,0,0]],"middle":[[0,6.5,0]],"top":[[0,25,0]],"target":[[0,6.5,-6]],"special":[[0,6.41,0.58]],"mouth":[[0,6.41,0.58]],"hand_primary":[[-2.18,3.31,-2.04]],"physical":[[0,12.44,1.2]],"eye":[[-2,8.37,1.36],[2,8.37,1.36]],"face":[[0,7.69,1.02]],"hand_secondary":[[2.18,3.31,-2.04]]},"petilil":{"root":[[0,0,0]],"middle":[[0.16,6.69,-0.4]],"top":[[0,18,0]],"target":[[0.15,6.29,-7.39]],"special":[[0.15,6.29,-7.39]],"hand_primary":[[-5.38,4.51,-0.27]],"physical":[[0.31,13.54,-5.25]],"eye":[[2.43,7.69,-5.3],[-2.07,7.79,-5.3]],"face":[[0.18,7.74,-5.3]],"hand_secondary":[[5.59,4.26,-0.27]]},"lilligant":{"root":[[0,0,0]],"middle":[[0,21,0]],"top":[[0,38,0]],"target":[[0,22,-9]],"special":[[2,41.5,0]],"hand_primary":[[-15.4,23,0]],"physical":[[-15.4,23,0]],"eye":[[2.5,26.5,-4],[-2.5,26.5,-4]],"face":[[0,26,-4]],"hand_secondary":[[15.4,23,0]]},"basculin":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,18,0]],"target":[[0,7.5,-14]],"special":[[0,6,-8.75]],"mouth":[[0,6,-8.75]],"physical":[[0,6,-8.75]],"eye":[[-3.5,9.5,-9.5],[3.5,9.5,-9.5]],"face":[[0,9,-12.3]]},"sandile":{"root":[[0,0,0]],"middle":[[0,5,0]],"top":[[0,12,0]],"target":[[0,6,-12]],"mouth":[[0,3.6,-7.74]],"eye":[[-2.45,6.5,-7.3],[2.55,6.41,-7.3]],"face":[[0.04,5.87,-11.29]]},"krokorok":{"root":[[0,0,0]],"middle":[[0,13,0]],"top":[[0,30,0]],"target":[[0,17,-10]],"special":[[0.05,18.8,-11.8]],"mouth":[[0.05,18.8,-11.8]],"hand_primary":[[-8.36,9.87,-7.06]],"physical":[[-8.36,9.87,-7.06]],"eye":[[-2.49,22.6,-11.6],[2.51,22.64,-11.49]],"face":[[0.01,22.72,-11.56]],"hand_secondary":[[8.27,9.83,-7.19]]},"krookodile":{"root":[[0,0,0]],"middle":[[0,22,0]],"top":[[0,44,0]],"target":[[0,23,-11]],"special":[[-0.18,27.95,-20.12]],"mouth":[[-0.18,27.95,-20.12]],"hand_primary":[[-11.86,16.52,-12.3]],"physical":[[-11.86,16.52,-12.3]],"eye":[[3.2,34.37,-15.01],[-3.77,34.32,-15.1]],"face":[[-0.23,33.37,-18.48]],"hand_secondary":[[9.21,17.21,-17.49]]},"darumaka":{"root":[[0,0,0]],"middle":[[2.17,8,0]],"top":[[0,15.5,0]],"target":[[2.17,8,-6.5]],"special":[[3.25,8.09,-4.6]],"mouth":[[3.25,8.09,-4.6]],"hand_primary":[[-2.51,11.14,0.75]],"physical":[[-2.51,11.14,0.75]],"eye":[[6.5,8.82,-4.78],[1.14,10.65,-4.14]],"face":[[3.86,9.83,-4.45]],"hand_secondary":[[10.66,6,-1.15]]},"darmanitan":{"root":[[0,0,0]],"middle":[[0,17,0]],"top":[[0,31,0]],"target":[[1.18,19,-13.45]],"special":[[-0.44,13.74,-12.26]],"mouth":[[-0.44,13.74,-12.26]],"hand_primary":[[-31.43,16.85,-4.99]],"physical":[[-31.43,16.85,-4.99]],"eye":[[5.27,22.35,-10.31],[-4.69,23.14,-10.24]],"face":[[0.27,22.5,-10.33]],"hand_secondary":[[16.39,2.89,-19.65]]},"maractus":{"root":[[0,0,0]],"middle":[[0.5,10,0]],"top":[[0,25,0]],"target":[[0.5,10,-6]],"special":[[1.49,12.14,-4.02]],"mouth":[[1.49,12.14,-4.02]],"hand_primary":[[-5.77,4.21,-0.58]],"physical":[[-5.77,4.21,-0.58]],"eye":[[-1.11,14.57,-4.27],[3.87,14.8,-3.83]],"face":[[1.39,14.44,-4.05]],"hand_secondary":[[11,8.88,0.85]]},"dwebble":{"root":[[0,0,0]],"middle":[[0,6.5,0]],"top":[[0,18,0]],"target":[[0,6.5,-10]],"special":[[0,3.77,-7.21]],"mouth":[[0,3.77,-7.21]],"hand_primary":[[-7.17,1.39,-7.37]],"physical":[[-7.17,1.39,-7.37]],"eye":[[1.55,7.39,-9.36],[-1.7,7.4,-9.31]],"face":[[0,5.72,-7.67]],"hand_secondary":[[7.15,1.24,-7.45]]},"crustle":{"root":[[0,0,0]],"middle":[[0,15,0]],"top":[[0,28,0]],"target":[[0,17,-15]],"special":[[0.13,2.37,-13.74]],"mouth":[[0.13,2.37,-13.74]],"physical":[[-0.03,19.89,-13.29]],"eye":[[2.07,5.82,-15.78],[-1.84,5.79,-15.82]],"face":[[0.11,4.83,-14.21]]},"scraggy":{"root":[[0,0,0]],"middle":[[0,9,0]],"top":[[0,20,0]],"target":[[0,9,-6]],"special":[[0,12,-5]],"mouth":[[0,12,-5]],"hand_primary":[[-8.2,9,0]],"physical":[[0,18.5,-5]],"eye":[[-4.5,14.1,-3.4],[4.5,14.1,-3.4]],"face":[[0,14.5,-5]],"hand_secondary":[[8.2,9,0]]},"scrafty":{"root":[[0,0,0]],"middle":[[0,13,0]],"top":[[0,28,0]],"target":[[0,14,-6]],"special":[[0.19,17.09,-4.79]],"mouth":[[0.19,17.09,-4.79]],"hand_primary":[[-3.62,8.55,-4.73]],"physical":[[0.02,21.92,-6.06]],"eye":[[5.06,20.01,-4.18],[-4.93,19.59,-4.45]],"face":[[0.12,19.02,-5.3]],"hand_secondary":[[6.84,10.74,-1.23]]},"sigilyph":{"root":[[0,0,0]],"middle":[[0,20,0]],"top":[[0,36,0]],"target":[[0,21,-7]],"special":[[0,29.8,-2]],"hand_primary":[[7.95,20.5,0],[-7.95,20.5,0]],"physical":[[0,36.2,0]],"eye":[[0,29.8,-2]],"face":[[0,29.7,-2]]},"yamask":{"root":[[0,0,0]],"middle":[[0,9.5,0]],"top":[[0,21,0]],"target":[[0,9.5,-8]],"special":[[0,11.05,-2.81]],"mouth":[[0,11.05,-2.81]],"hand_primary":[[-9.55,9.56,0.33]],"physical":[[-9.55,9.56,0.33]],"eye":[[-1.5,13.73,-0.79],[1.5,13.73,-0.79]],"face":[[0,13.86,-5.07]],"jaw_lower":[[0,10.05,-2.73]],"hand_secondary":[[9.55,9.56,0.33]]},"cofagrigus":{"root":[[0,0,0]],"middle":[[0,28,0]],"top":[[0,54,0]],"target":[[0,30,-12]],"special":[[-36.84,47.18,-4.37]],"mouth":[[-0.33,36.26,-3.67]],"hand_primary":[[-36.84,47.18,-4.37]],"physical":[[-36.84,47.18,-4.37]],"eye":[[-3.5,40.03,-3.6],[2.49,40.29,-3.6]],"face":[[-0.5,40.1,-4.5]],"jaw_lower":[[-0.26,34.66,-3.74]],"hand_secondary":[[-37.45,19.73,-10.37],[34.68,48.21,-9.67],[41.06,22,-4.44]]},"tirtouga":{"root":[[0,0,0]],"middle":[[0,5,0]],"top":[[0,10,0]],"target":[[0,4,-21]],"special":[[0,2,-16.5]],"mouth":[[0,2,-16.5]],"hand_primary":[[-18,3,-6]],"physical":[[0,2,-16.5]],"eye":[[3,5,-16],[-3,5,-16]],"face":[[0,4.5,-20]],"hand_secondary":[[18,3,-6]]},"carracosta":{"root":[[0,0,0]],"middle":[[0,11.25,0]],"top":[[0,29,0]],"target":[[0,13.25,-11]],"special":[[-0.41,19.83,-10.96]],"mouth":[[-0.41,19.83,-10.96]],"hand_primary":[[-16.74,5.02,-6.96]],"physical":[[-16.74,5.02,-6.96]],"eye":[[2.52,21.92,-13.27],[-3.48,21.98,-13.03]],"face":[[-0.62,20.36,-16.15]],"hand_secondary":[[16.24,5.02,-7.83]]},"archen":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,19,0]],"target":[[0,9,-8]],"eye":[[3,15.71,-4.31],[-3,15.71,-4.31]],"face":[[0,15.08,-12.29]]},"archeops":{"root":[[0,0,0]],"middle":[[0,18,0]],"top":[[0,34.25,0]],"target":[[0,18.5,-18]],"special":[[-0.71,36.81,-17.9]],"mouth":[[-0.58,37.28,-13.78]],"hand_primary":[[-29.33,37.17,-3.58]],"physical":[[-0.71,36.81,-17.9]],"eye":[[3.43,39.64,-15.06],[-4.56,39.78,-14.82]],"face":[[-0.73,39.34,-20.43]],"hand_secondary":[[29.16,37.45,-4]]},"trubbish":{"root":[[0,0,0]],"middle":[[0,7,0]],"top":[[0,20,0]],"target":[[0,7,-9]],"special":[[0,6,-7.5]],"mouth":[[0,6,-7.5]],"hand_primary":[[-19.5,3,0.2]],"physical":[[-19.5,3,0.2]],"eye":[[5,7,-7.5],[-5,7,-7.5]],"face":[[0,6.5,-7.5]],"hand_secondary":[[19.5,3,0.2]]},"garbodor":{"root":[[0,0,0]],"middle":[[0,21,0]],"top":[[0,42,0]],"target":[[0,24,-15]],"special":[[-44,-0.8,0.5]],"mouth":[[0,33,-8]],"hand_primary":[[-47.5,4.2,0.5]],"physical":[[-47.5,4.2,0.5]],"eye":[[6,33.55,-8],[-6,33.55,-8]],"face":[[0,34,-8]],"hand_secondary":[[50.5,24,0.5]]},"zorua":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,18,0]],"target":[[0,8,-11]],"special":[[0,7,-7.3]],"mouth":[[0,7,-7.3]],"physical":[[0,7,-7.3]],"eye":[[-1.75,9.45,-7],[1.75,9.45,-7]],"face":[[0,9.7,-7]]},"zoroark":{"root":[[0,0,0]],"middle":[[0,32,0]],"top":[[0,53,0]],"target":[[0,32,-18]],"special":[[-24.2,36.5,0]],"mouth":[[0,43,-2.5]],"hand_primary":[[-24.2,36.5,0]],"physical":[[-24.2,36.5,0]],"eye":[[-3,45.4,-4.1],[3,45.4,-4.1]],"face":[[0,46.1,-11.2]],"hand_secondary":[[24.2,36.5,0]]},"minccino":{"root":[[0,0,0]],"middle":[[0,7,0]],"top":[[0,20,0]],"target":[[0,6,-6]],"special":[[0,7.7,-4]],"mouth":[[0,7.7,-4]],"hand_primary":[[-5,5.5,0]],"physical":[[-5,5.5,0]],"eye":[[2.55,9.7,-4],[-2.55,9.7,-4]],"face":[[0,8.9,-4]],"hand_secondary":[[5,5.5,0]]},"cinccino":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,22,0]],"target":[[0,7,-6]],"special":[[0,9.5,-4.5]],"mouth":[[0,9.5,-4.5]],"hand_primary":[[-6,7,0]],"physical":[[-6,7,0]],"eye":[[2.85,12,-4.5],[-2.85,12,-4.5]],"face":[[0,11.9,-4.5]],"hand_secondary":[[6,7,0]]},"gothita":{"root":[[0,0,0]],"middle":[[0,6,0]],"top":[[0,14,0]],"target":[[0,6,-4.5]],"special":[[0,9,-5]],"mouth":[[0,5.7,-3]],"hand_primary":[[-3.2,4.25,0]],"physical":[[0,11,-2]],"eye":[[2,8,-3],[-2,8,-3]],"face":[[0,8,-3]],"hand_secondary":[[3.2,4.25,0]]},"gothorita":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,23,0]],"target":[[0,11,-5]],"special":[[0,15,-7]],"mouth":[[0,14.2,-4]],"hand_primary":[[-7.2,12.25,0]],"physical":[[-7.2,12.25,0]],"eye":[[-2.5,16.75,-4],[2.5,16.75,-4]],"face":[[0,16,-4]],"hand_secondary":[[7.2,12.25,0]]},"gothitelle":{"root":[[0,0,0]],"middle":[[0,22,0]],"top":[[0,38,0]],"target":[[0,21,-7]],"special":[[0,27,-9]],"mouth":[[0,27.5,-4.75]],"hand_primary":[[-14.2,25.25,-1]],"physical":[[-14.2,25.25,-1]],"eye":[[-2.5,29.75,-4.75],[2.5,29.75,-4.75]],"face":[[0,30,-4.75]],"hand_secondary":[[14.2,25.25,-1]]},"solosis":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,15,0]],"target":[[0,8,-8]],"special":[[0,8,-7]],"mouth":[[0,7.5,-5]],"physical":[[0,8,-7]],"eye":[[3.45,7.65,-5],[-3.45,7.65,-5]],"face":[[0,8,-7]]},"duosion":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,24.5,0]],"target":[[0,12,-9.5]],"special":[[0,12,-9.5]],"mouth":[[0,14.4,-5]],"hand_primary":[[-2.25,9,-3.5]],"physical":[[0,12,-9.5]],"eye":[[3.25,14.5,-5],[-3.25,14.5,-5]],"face":[[0,14.4,-8.5]],"hand_secondary":[[2.25,9,-3.5]]},"reuniclus":{"root":[[0,0,0]],"middle":[[0,14,0]],"top":[[0,28.25,0]],"target":[[0,14,-10]],"special":[[27,11,-3]],"mouth":[[0,12.5,-6.5]],"hand_primary":[[-27,11,-3]],"physical":[[-27,11,-3]],"eye":[[4.5,14.5,-6.5],[-4.5,14.5,-6.5]],"hand_secondary":[[27,11,-3]]},"ducklett":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,18,0]],"target":[[0,9,-9]],"special":[[0,12.25,-6.5]],"mouth":[[0,12.25,-6.5]],"physical":[[0,13,-8.5]],"eye":[[2.25,14,-5.5],[-2.25,14,-5.5]],"face":[[0,14,-5.5]]},"swanna":{"root":[[0,0,0]],"middle":[[0,17,0]],"top":[[0,40,0]],"target":[[0,16,-10]],"special":[[0,32.25,-13.5]],"mouth":[[0,32.25,-13.5]],"physical":[[0,33.1,-20]],"eye":[[2,33.4,-12],[-2,33.4,-12]],"face":[[0,34,-12]]},"vanillite":{"root":[[0,0,0]],"middle":[[0,6,0]],"top":[[0,16,0]],"target":[[0,5,-6]],"special":[[0,4.55,-4.5]],"mouth":[[0,4.55,-4.5]],"hand_primary":[[-3.25,1.9,0]],"physical":[[0,10.25,-3.5]],"eye":[[1.95,6.75,-4.5],[-1.95,6.75,-4.5]],"face":[[0,6.55,-4.5]],"hand_secondary":[[3.25,1.9,0]]},"vanillish":{"root":[[0,0,0]],"middle":[[0,17,0]],"top":[[0,32,0]],"target":[[0,17,-11]],"special":[[0,19.95,-5]],"mouth":[[0,19.95,-5]],"hand_primary":[[-5,16.5,-9.7]],"physical":[[0,0,0]],"eye":[[1.3,22.5,-5],[-1.3,22.5,-5]],"face":[[0,21.75,-5]],"hand_secondary":[[5,16.5,-9.7]]},"vanilluxe":{"root":[[0,0,0]],"middle":[[0,18,0]],"top":[[0,34,0]],"target":[[0,18,-10]],"special":[[9,36.5,-3.5]],"mouth":[[-5.5,20.8,-5],[5.5,20.8,-5]],"hand_primary":[[-11,17.5,-9.7]],"physical":[[0,0,0]],"eye":[[-4.05,23.75,-5],[-6.95,23.75,-5],[4.05,23.75,-5],[6.95,23.75,-5]],"face":[[-5.5,23.4,-5],[5.5,23.4,-5]],"hand_secondary":[[11,17.5,-9.7]]},"deerling":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,22,0]],"target":[[0,11,-10]],"special":[[0,14,-8.5]],"mouth":[[0,14,-8.5]],"physical":[[0,21,-8.5]],"eye":[[-3,17,-8.5],[3,17,-8.5]],"face":[[0,16.5,-8.5]]},"sawsbuck":{"root":[[0,0,0]],"middle":[[0,22,0]],"top":[[0,40,0]],"target":[[0,22,-22]],"special":[[0,16,-19]],"mouth":[[0,16,-19]],"physical":[[0,22,-32]],"eye":[[2.5,18.75,-21],[-2.5,18.75,-21]],"face":[[0,14.5,-21.75]]},"emolga":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,22,0]],"target":[[0,8,-7]],"special":[[0,8.5,-5]],"mouth":[[0,8.5,-5]],"hand_primary":[[-8.5,6.5,0]],"physical":[[-8.5,6.5,0]],"eye":[[-2.9,11.5,-5],[2.9,11.5,-5]],"face":[[0,11,-5]],"hand_secondary":[[8.5,6.5,0]]},"karrablast":{"root":[[0,0,0]],"middle":[[0,9,0]],"top":[[0,24,0]],"target":[[0,9,-7]],"special":[[0,10.1,-4.5]],"mouth":[[0,10.1,-4.5]],"hand_primary":[[-7.5,10.5,-2]],"physical":[[0,25,0]],"eye":[[2.5,13,-4.5],[-2.5,13,-4.5]],"face":[[0,12.3,-4.5]],"hand_secondary":[[7.5,10.5,-2]]},"escavalier":{"root":[[0,0,0]],"middle":[[0,14,-10]],"top":[[0,40,0]],"target":[[0,2,-23]],"special":[[-13,22.5,-33]],"mouth":[[0,23.5,-9.5]],"physical":[[-13,22.5,-33]],"eye":[[3.5,25.1,-11],[-3.5,25.1,-11]],"face":[[0,24.5,-15]]},"foongus":{"root":[[0,0,0]],"middle":[[0,5,0]],"top":[[0,14,0]],"target":[[0,4,-6]],"special":[[0,3.25,-4]],"mouth":[[0,3.25,-4]],"hand_primary":[[-5,2.5,0]],"physical":[[0,12.5,-6]],"eye":[[1.75,4.25,-3],[-1.75,4.25,-3]],"face":[[0,4.25,-3]],"hand_secondary":[[5,2.5,0]]},"amoonguss":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,22,0]],"target":[[0,9,-7]],"special":[[0,11,-5]],"mouth":[[0,11,-5]],"hand_primary":[[-13,8.2,0.5]],"physical":[[-13,8.2,0.5]],"eye":[[2,13.4,-3.5],[-2,13.4,-3.5]],"face":[[0,12.5,-3.5]],"hand_secondary":[[13,8.2,0.5]]},"frillish":{"root":[[0,0,0]],"middle":[[0,15,0]],"top":[[0,28,0]],"target":[[0,15,-6]],"special":[[0,19.5,-4]],"mouth":[[0,19.5,-4]],"hand_primary":[[-11.75,15,0]],"physical":[[-11.75,15,0]],"eye":[[-2.25,21.5,-4],[2.25,21.5,-4]],"face":[[0,21,-4]],"hand_secondary":[[11.75,15,0]]},"jellicent":{"root":[[0,0,0]],"middle":[[-0.27,32.62,-0.27]],"top":[[0,40,0]],"target":[[-6.92,24.04,-18.88]],"special":[[-16.1,16.47,5.98]],"mouth":[[-1.42,30.01,-14.07]],"hand_primary":[[-16.1,16.47,5.98]],"physical":[[-16.1,16.47,5.98]],"eye":[[-4.79,33.62,-14.52],[1.66,33.75,-15.08]],"face":[[-1.54,32.95,-14.65]],"hand_secondary":[[10.99,13.67,-11.36]]},"alomomola":{"root":[[0,0,0]],"middle":[[-0.5,2.38,0]],"top":[[0,28,0]],"target":[[-0.5,2.38,-10]],"special":[[-2.5,2.38,-9]],"mouth":[[-2.5,2.38,-9]],"physical":[[1,2.38,-9]],"eye":[[0.87,-0.12,-4.14],[0.87,4.88,-5.14]],"face":[[1,2.38,-9]]},"galvantula":{"root":[[0,0,0]],"middle":[[0,7.99,-0.13]],"top":[[0,15,0]],"target":[[0,5.17,-13.88]],"special":[[0.11,1.07,-14.69]],"mouth":[[0.1,2.52,-6.81]],"hand_primary":[[-5.06,4.34,-15.01]],"physical":[[-5.06,4.34,-15.01]],"eye":[[-0.93,5.91,-7.65],[1.07,5.93,-7.66],[-0.94,7.85,-8.14],[1.06,7.87,-8.14],[-4.47,5.2,-6.45],[4.63,5.28,-6.46]],"face":[[0.08,4.95,-7.41]],"hand_secondary":[[4.42,4.32,-15.24]]},"ferroseed":{"root":[[0,0,0]],"middle":[[0,9.49,-1.13]],"top":[[0,16,0]],"target":[[0,7.46,-8.93]],"special":[[0,7.39,-9.43]],"physical":[[0,14.98,-5.38]],"eye":[[2.5,7.78,-6.45],[-2.5,7.78,-6.45]],"face":[[0,7.78,-6.45]]},"ferrothorn":{"root":[[0,0,0]],"middle":[[0,14.17,1.7]],"top":[[0,30,0]],"target":[[0,14.75,-16.32]],"special":[[-0.36,12.61,-15.19]],"physical":[[-0.08,19.11,-9.73]],"eye":[[4.36,17.44,-9.62],[-4.64,17.79,-9.59]],"face":[[-0.16,17.12,-9.56]]},"klink":{"root":[[0,0,0]],"middle":[[1,12.62,0]],"top":[[0,24,0]],"target":[[1.44,11.77,-3.4]],"special":[[1,12.62,0]],"physical":[[1,12.62,0]],"eye":[[4.69,8.5,-0.41],[-6.34,10.25,-1.17]],"face":[[4.64,11,-0.6]]},"klang":{"root":[[0,0,0]],"middle":[[0,14.5,0]],"top":[[0,28,0]],"target":[[-0.16,13.62,-4.44]],"special":[[-0.23,13.26,-2.9]],"physical":[[-0.23,13.26,-2.9]],"eye":[[-8.26,25.53,-1.92]],"face":[[-0.02,14.38,-2.6]]},"klinklang":{"root":[[0,0,0]],"middle":[[0,16.5,0]],"top":[[0,28,0]],"target":[[-0.15,18.07,-10.68]],"special":[[0.15,14.9,-6.89]],"physical":[[0.15,14.9,-6.89]],"eye":[[-10.22,24.75,-1.91]],"face":[[0.01,16.37,-2.6]]},"tynamo":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,13,0]],"target":[[0,8,-10]],"special":[[0,8,-8.5]],"mouth":[[0,8,-8.5]],"physical":[[0,10.5,-8.5]],"eye":[[2,8,-6.75],[-2,8,-6.75]],"face":[[0,8,-8.5]]},"eelektrik":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,26,0]],"target":[[0,13,-12]],"special":[[0,17.53,-10.86]],"mouth":[[0,17.53,-10.86]],"physical":[[0,21.07,-11.54]],"eye":[[3.1,18.56,-6.22],[-3.1,18.56,-6.22]],"face":[[0,17.53,-10.86]]},"eelektross":{"root":[[0,0,0]],"middle":[[0,20,0]],"top":[[0,36,0]],"target":[[0,16,-20]],"special":[[0,21.98,-15.98]],"mouth":[[0,21.98,-15.98]],"hand_primary":[[-14.23,6.44,-14.53]],"physical":[[-14.23,6.44,-14.53]],"eye":[[4.5,26.01,-12.71],[-4.5,26.01,-12.71]],"face":[[0,21.68,-17.06]],"hand_secondary":[[14.23,6.44,-14.53]]},"elgyem":{"root":[[0,0,0]],"middle":[[-0.51,11.72,1.49]],"top":[[0,24,0]],"target":[[-0.13,12.85,-4.48]],"special":[[-5.24,7.37,-1.58]],"hand_primary":[[-5.24,7.37,-1.58]],"physical":[[-5.24,7.37,-1.58]],"eye":[[-1.99,11.84,-3.34],[1,11.7,-3.15]],"face":[[-0.46,12.26,-3.33]],"hand_secondary":[[3.63,5.82,-0.6]]},"beheeyem":{"root":[[0,0,0]],"middle":[[0.07,13.99,0.21]],"top":[[0,31,0]],"target":[[0.06,13.41,-7.83]],"special":[[-6.04,6.89,-0.26]],"hand_primary":[[-6.04,6.89,-0.26]],"physical":[[-6.04,6.89,-0.26]],"eye":[[2.15,15.09,-6.21],[-1.84,15.33,-6.21]],"face":[[0.15,15.25,-6.12]],"hand_secondary":[[5.8,6.48,-0.27]]},"litwick":{"root":[[0,0,0]],"middle":[[0,5,0]],"top":[[0,15.5,0]],"target":[[0,4.5,-6]],"special":[[0.42,12.52,-1.01]],"hand_primary":[[-5.05,1.24,-0.37]],"physical":[[0.48,8.75,-5.29]],"eye":[[2.64,3.27,-4.4],[-2.25,3.53,-4.4]],"face":[[0.19,3.3,-4.35]],"hand_secondary":[[5.19,0.7,-0.37]]},"lampent":{"root":[[0,0,0]],"middle":[[0,16,0]],"top":[[0,28,0]],"target":[[0,16,-10]],"special":[[-1.47,16.28,-10]],"hand_primary":[[-13.32,26.84,2.39]],"physical":[[-13.32,26.84,2.39]],"eye":[[1.74,16.18,-5],[-4.62,16.88,-5]],"face":[[-1.44,16.53,-5]],"hand_secondary":[[2.12,5.91,-1.09]]},"chandelure":{"root":[[0,0,0]],"middle":[[0,18,0]],"top":[[0,40,0]],"target":[[0,18,-12]],"special":[[-1.55,40.97,0.9]],"hand_primary":[[-20.96,17.17,0]],"physical":[[-20.96,17.17,0]],"eye":[[2.58,17.63,-8.5],[-9.38,18.67,-8.5]],"face":[[-3.4,18.15,-8.5]],"hand_secondary":[[13.72,14.13,0]]},"axew":{"root":[[0,0,0]],"middle":[[-0.12,5.9,0.97]],"top":[[0,17,0]],"target":[[-0.12,5.9,0.97]],"special":[[0.68,7.72,-4.65]],"mouth":[[0.68,7.72,-4.65]],"hand_primary":[[-2.75,3.44,-4.53]],"physical":[[5.21,7.93,-6.03],[-3.74,7,-6.21]],"eye":[[3.56,9.64,-7.52],[-2.41,9.01,-7.64]],"face":[[0.68,8.7,-9.65]],"hand_secondary":[[4.89,4.03,-2.45]]},"fraxure":{"root":[[0,0,0]],"middle":[[-0.52,13.5,-0.07]],"top":[[0,32,0]],"target":[[1.81,13.5,-8.76]],"special":[[-0.19,22.28,-6.87]],"mouth":[[-0.19,22.28,-6.87]],"hand_primary":[[-14.75,18.46,0.14]],"physical":[[-11.73,22.05,-8.96]],"eye":[[4.22,24.18,-10.44],[-4.77,24.08,-10.28]],"face":[[-0.33,24.19,-13.46]],"hand_secondary":[[13.34,17.37,-4.98]]},"haxorus":{"root":[[0,0,0]],"middle":[[0,27,0]],"top":[[0,46,0]],"target":[[0,27.26,-7.51]],"special":[[0,52.56,-1.81]],"mouth":[[0,52.56,-1.81]],"hand_primary":[[-22.85,31.31,1.79]],"physical":[[6.5,53.06,0.69],[-6.5,53.06,0.69]],"eye":[[2.5,54.36,-1.51],[-2.5,54.36,-1.51]],"face":[[0,55.06,-5.21]],"hand_secondary":[[22.85,31.31,1.79]]},"cubchoo":{"eye":[[3.3,12.2,-4],[-3.3,12.2,-4]]},"beartic":{"eye":[[-2.3,32.7,-1.4],[2.3,32.7,-1.4]]},"cryogonal":{"eye":[[6.3,20.7,-0.4],[-6.3,20.7,-0.4]]},"shelmet":{"root":[[0,0,0]],"middle":[[0,7,0]],"top":[[0,17,0]],"target":[[0,6,-12]],"special":[[0,5.9,-10.4]],"mouth":[[0,5.9,-10.4]],"physical":[[0,10.8,-11.8]],"eye":[[3,6,-3.75],[-3,6,-3.75]],"face":[[0,7.2,-5.5]]},"accelgor":{"root":[[0,0,0]],"middle":[[0,14,0]],"top":[[0,28,0]],"target":[[0,14,-8]],"special":[[0,20.4,-7.1]],"mouth":[[0,20.4,-7.1]],"hand_primary":[[-13.5,14.5,-3.5]],"physical":[[-13.5,14.5,-3.5]],"eye":[[2.5,20.5,-7.1],[-2.5,20.5,-7.1]],"face":[[0,22.2,-7.1]],"hand_secondary":[[13.5,14.5,-3.5]]},"stunfisk":{"root":[[0,0,0]],"middle":[[0.02,2,0]],"top":[[0,6,0]],"target":[[0.03,3,-6]],"special":[[0.04,3.84,9.16]],"mouth":[[0.01,1.11,-1.01]],"hand_primary":[[-9.69,0.56,3.68]],"physical":[[0.04,3.84,9.16]],"eye":[[-2.99,1.16,-0.51],[3.01,1.08,-0.51]],"face":[[0.01,1.16,0.99]],"hand_secondary":[[9.69,0.3,3.68]]},"mienfoo":{"root":[[0,1,0]],"middle":[[0,11.8,0]],"top":[[0,27,0]],"target":[[6.93,11.8,-4]],"special":[[-9.23,11.53,-10.91]],"mouth":[[0.21,16.27,-4.24]],"hand_primary":[[-9.23,11.53,-10.91]],"physical":[[-9.23,11.53,-10.91]],"eye":[[-1.79,18.51,-3.33],[2.21,18.52,-3.37]],"face":[[0.21,18.52,-3.35]],"hand_secondary":[[5.53,18.9,12.95]]},"mienshao":{"root":[[0,0,0]],"middle":[[0,22,0]],"top":[[0,36,0]],"target":[[0,21,-10]],"special":[[-7.81,17.57,-10.75]],"mouth":[[0,24.9,-6.9]],"hand_primary":[[-7.81,17.57,-10.75]],"physical":[[-7.81,17.57,-10.75]],"eye":[[-3,27.93,-6.01],[3,27.93,-6.01]],"face":[[0,28.43,-6.02]],"hand_secondary":[[7.81,17.57,-10.75]]},"druddigon":{"root":[[0,0,0]],"middle":[[0,17,-0.6]],"top":[[0,35,0]],"target":[[1.73,17,-8.41]],"special":[[1.75,26.01,-16.12]],"mouth":[[1.75,26.01,-16.12]],"hand_primary":[[-12.08,12.05,-20.74]],"physical":[[-12.07,12.48,-19.84]],"eye":[[5.74,26.51,-19.32],[-2.26,26.55,-19.29]],"face":[[1.71,25.65,-24.23]],"hand_secondary":[[12.75,9.68,-15.37]]},"golett":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,24,0]],"target":[[0,12,-8]],"special":[[0,12,-8]],"hand_primary":[[-8,8.5,0]],"physical":[[-8,8.5,0]],"eye":[[-1.5,17.75,-3.5],[1.5,17.75,-3.5]],"face":[[0,17.75,-3.5]],"hand_secondary":[[8,8.5,0]]},"golurk":{"root":[[0,0,0]],"middle":[[0,50.2,-0.1]],"top":[[0,88,0]],"target":[[0,60.2,-24.6]],"special":[[0,35.6,-0.1]],"hand_primary":[[-39.05,37.21,-14.19]],"physical":[[-39.05,37.21,-14.19]],"eye":[[2,80.6,-5.1],[-2,80.6,-5.1]],"face":[[0,80.6,-5.1]],"hand_secondary":[[38.11,38.12,-16.03]]},"pawniard":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,21,0]],"target":[[0,10,-7]],"special":[[0,12,-8]],"hand_primary":[[-13,10.75,0]],"physical":[[0,19.5,-8.5]],"eye":[[-2.5,15,-3.5],[2.5,15,-3.5]],"face":[[0,14.5,-3.5]],"hand_secondary":[[13,10.75,0]]},"bisharp":{"root":[[0,0,0]],"middle":[[0,24,0]],"top":[[0,40,0]],"target":[[0,25,-7]],"special":[[0,27,-9]],"mouth":[[0,30.95,-4.05]],"hand_primary":[[-16.5,27.5,0]],"physical":[[-11.5,31.5,0]],"eye":[[2.4,32.8,-4.1],[-2.4,32.8,-4.1]],"face":[[0,32.25,-4.05]],"hand_secondary":[[16.5,27.5,0]]},"bouffalant":{"root":[[0,0,0]],"middle":[[0,19.25,0]],"top":[[0,39,0]],"target":[[4.97,19.25,-30.61]],"special":[[5.55,9.89,-21.62]],"mouth":[[5.55,9.89,-21.62]],"physical":[[24.56,19.41,-19.46],[-14.16,18.05,-20.23]],"eye":[[9.46,13.84,-22.94],[1.42,13.56,-23.1]],"face":[[5.46,13.73,-23.96]]},"rufflet":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,22,0]],"target":[[0,7,-9]],"special":[[0,9.5,-6.5]],"mouth":[[0,9.5,-6.5]],"physical":[[0,10,-8.3]],"eye":[[1.9,12.5,-6],[-1.9,12.5,-6]],"face":[[0,13,-6]]},"braviary":{"root":[[0,0,0]],"middle":[[0,22,0]],"top":[[0,42,0]],"target":[[0,22,-14]],"special":[[0,21.8,-22.8]],"mouth":[[0,21.8,-22.8]],"physical":[[-5,0.2,5.3]],"eye":[[1.9,24,-20.75],[-1.9,24,-20.75]],"face":[[0,24.7,-21.25]]},"heatmor":{"root":[[0,0,0]],"middle":[[0,16,0]],"top":[[0,28,0]],"target":[[0,15,-13.5]],"special":[[0,53.5,1.5]],"mouth":[[0,44.5,1.5]],"hand_primary":[[-17,17.5,0]],"physical":[[-17,17.5,0]],"eye":[[2.5,36,1],[-2.5,36,1]],"face":[[0,40.95,3.4]],"hand_secondary":[[17,17.5,0]]},"durant":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,16,0]],"target":[[0,8,-12]],"special":[[0,7.75,-10.5]],"mouth":[[0,7.75,-8.5]],"physical":[[0,7.75,-10.5]],"eye":[[3.25,9.75,-6.5],[-3.25,9.75,-6.5]],"face":[[0,9.75,-8.5]]},"deino":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,25,0]],"target":[[0,12,-13]],"special":[[-0.05,16.79,-8.98]],"mouth":[[-0.05,16.79,-8.98]],"physical":[[-0.05,16.79,-8.98]],"face":[[0.1,16.79,-12.78]]},"zweilous":{"root":[[0,0,0]],"middle":[[0,12.7,0]],"top":[[0,30,0]],"target":[[0,12.7,-16]],"special":[[4.89,15.28,-18.12],[-3.8,19.96,-10.42]],"mouth":[[4.89,15.28,-18.12],[-3.8,19.96,-10.42]],"physical":[[4.89,15.28,-18.12],[-3.8,19.96,-10.42]],"face":[[5.02,15.97,-22.81],[-3.75,20.78,-15.09]]},"hydreigon":{"eye":[[4.36,36.18,-28.05],[-4.54,36.21,-28.01]]},"larvesta":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,16,0]],"target":[[0,7,-15]],"special":[[0,6.11,-13.83]],"hand_primary":[[-3,3.22,-10.95]],"physical":[[0,10.97,-14.91]],"eye":[[2.85,8.36,-9.38],[-2.85,8.36,-9.38]],"face":[[0,6.98,-11.96]],"hand_secondary":[[3,3.22,-10.95]]},"volcarona":{"root":[[0,0,0]],"middle":[[0,22.6,0]],"top":[[0,36.6,0]],"target":[[0,22.6,-8.5]],"special":[[0,29.4,-9]],"hand_primary":[[-4,24.7,-7.1],[-4,21.6,-7.1]],"physical":[[-4.4,43.2,-7]],"eye":[[2.5,32.5,-9.3],[-2.5,32.5,-9.4]],"face":[[0,31,-9.5]],"hand_secondary":[[4.2,24.7,-7.1],[4.2,21.5,-7.1]]},"chespin":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,24,0]],"target":[[0,10,-8]],"special":[[0,10.75,-5.5]],"mouth":[[0,10.75,-5.5]],"hand_primary":[[-8,8,0]],"physical":[[0,19.5,-3.5]],"eye":[[2.85,13.9,-5.5],[-2.85,13.9,-5.5]],"face":[[0,13.5,-5.5]],"hand_secondary":[[8,8,0]]},"quilladin":{"root":[[0,0,0]],"middle":[[0,14,0]],"top":[[0,27,0]],"target":[[0,14,-10]],"special":[[0,15.25,-8]],"mouth":[[0,15.25,-8]],"hand_primary":[[-16,13,-1.5]],"physical":[[-16,13,-1.5]],"eye":[[3.35,19.3,-8],[-3.35,19.3,-8]],"face":[[0,18,-11.5]],"hand_secondary":[[16,13,-1.5]]},"chesnaught":{"root":[[0,0,0]],"middle":[[0,32,0]],"top":[[0,48,0]],"target":[[0,30,-22]],"special":[[0,41.2,-7.6]],"mouth":[[0,41.2,-7.6]],"hand_primary":[[-29,36.5,-1.5]],"physical":[[-29,36.5,-1.5]],"eye":[[2.5,44,-6.5],[-2.5,44,-6.5]],"face":[[0,43,-8]],"hand_secondary":[[29,36.5,-1.5]]},"fennekin":{"root":[[0,0,0]],"middle":[[0,13,0]],"top":[[0,28,0]],"target":[[0,9,-18]],"special":[[0,10.2,-13.5]],"mouth":[[0,10.2,-13.5]],"physical":[[0,20.8,-12.55]],"eye":[[3.3,14.55,-12.55],[-3.3,14.55,-12.55]],"face":[[0,14.5,-12.55]]},"braixen":{"root":[[0,0,0]],"middle":[[-0.5,17.95,0]],"top":[[0,36,0]],"target":[[-0.5,19.95,-8]],"special":[[-3.62,30.65,-16.73]],"mouth":[[0.29,22.82,-7.34]],"hand_primary":[[-6.48,16.77,-11.31]],"physical":[[-3.24,26.75,-15.76]],"eye":[[2.88,25.02,-7.41],[-2.11,25.2,-7.66]],"face":[[0.38,25.11,-7.53]],"hand_secondary":[[10.2,17.38,-0.18]]},"delphox":{"root":[[0,0,0]],"middle":[[0,36,-0.25]],"top":[[0,60,0]],"target":[[0,36,-8]],"special":[[0.56,54.96,-29.82]],"mouth":[[2.55,40.85,-11.6]],"hand_primary":[[-4.35,35.12,-25.8]],"physical":[[-1.22,52.56,-30.59]],"eye":[[4.95,43.65,-12.03],[-0.03,43.52,-11.61]],"face":[[2.46,43.59,-11.8]],"hand_secondary":[[17.35,32.4,3.84]]},"froakie":{"root":[[0,0,0]],"middle":[[0,6.25,0]],"top":[[0,20,0]],"target":[[0,6.25,-8]],"special":[[-0.37,8.37,-8.47]],"mouth":[[-0.37,8.37,-8.47]],"hand_primary":[[-2.18,0.61,-5.55]],"physical":[[-2.18,0.61,-5.55]],"eye":[[3.17,14.17,-6.14],[-3.83,14.2,-6.09]],"face":[[-0.33,14.22,-6.13]],"hand_secondary":[[9.33,6.97,0.02]]},"frogadier":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,34,0]],"target":[[0,12,-7]],"special":[[0,14.93,-12.38]],"mouth":[[0,14.93,-12.38]],"hand_primary":[[-6.6,1.09,-10.42]],"physical":[[-6.6,1.09,-10.42]],"eye":[[4.54,18.41,-13.88],[-4.54,18.41,-13.88]],"face":[[0,16.48,-18.55]],"hand_secondary":[[16.71,10.73,-5.49]]},"greninja":{"root":[[0,0,0]],"middle":[[0,17.1,6]],"top":[[0,50,0]],"target":[[0,17.1,-4]],"special":[[-10.63,0.8,-13.53]],"mouth":[[-0.86,22.54,-9.68]],"hand_primary":[[-10.63,0.8,-13.53]],"physical":[[-10.63,0.8,-13.53]],"eye":[[2.91,23.54,-12.49],[-4.56,23.54,-12.57]],"face":[[-0.81,19.74,-14.43]],"hand_secondary":[[23.8,24.65,5.93]]},"bunnelby":{"eye":[[2,14.43,-6.17],[-1.5,14.45,-6.29]]},"diggersby":{"eye":[[2.18,29.73,-7.56],[-2.82,29.68,-7.56]]},"fletchling":{"root":[[0,0,0]],"middle":[[0,7,0]],"top":[[0,13,0]],"target":[[0,7,-8]],"special":[[0,7,-3]],"mouth":[[0,7,-3]],"physical":[[0,7.8,-5.5]],"eye":[[1.75,8.25,-2.5],[-1.75,8.25,-2.5]],"face":[[0,8.25,-2.5]]},"fletchinder":{"root":[[0,0,0]],"middle":[[0,13,0]],"top":[[0,22,0]],"target":[[0,13,-15]],"special":[[0,16.5,-11.3]],"mouth":[[0,16.5,-11.3]],"physical":[[0,17.25,-15.45]],"eye":[[-2,17.25,-11],[2,17.25,-11]],"face":[[0,17.8,-10.95]]},"talonflame":{"root":[[0,0,0]],"middle":[[0,17,0]],"top":[[0,28,0]],"target":[[0,17,-14]],"special":[[0,11.7,-14]],"mouth":[[0,11.7,-14]],"physical":[[-3,0.5,1.1]],"eye":[[-2,12.05,-15.5],[2,12.05,-15.5]],"face":[[0,12.1,-15.3]]},"scatterbug":{"eye":[[2.5,-1.5,-6],[-2.5,-1.5,-6]]},"spewpa":{"eye":[[2.5,8,-3],[-2.5,8,-3]]},"vivillon":{"eye":[[-2.5,9.2,-3],[2.5,9.2,-3]]},"litleo":{"eye":[[2.75,15.25,-10],[-2.75,15.25,-10]]},"pyroar":{"eye":[[2.5,37.5,-14],[-2.5,37.5,-14]]},"flabebe":{"eye":[[0.19,17.68,-3.71],[-1.78,17.33,-3.81]]},"floette":{"eye":[[1.54,15.71,-3.83],[-1.46,15.67,-3.85]]},"florges":{"eye":[[0.63,34.91,-4.38],[-2.96,34.85,-2.92]]},"skiddo":{"root":[[0,0,0]],"middle":[[0,13,0]],"top":[[0,22,0]],"target":[[0,12,-15]],"special":[[-0.08,9.66,-11.89]],"mouth":[[-0.08,9.66,-11.89]],"physical":[[-0.32,20,-9.45]],"eye":[[2.44,12.6,-13.14],[-2.76,12.47,-13.1]],"face":[[-0.17,12.93,-13.17]]},"gogoat":{"root":[[0,0,0]],"middle":[[0,18,0]],"top":[[0,38,0]],"target":[[0,18,-26]],"special":[[0,21.39,-23.5]],"mouth":[[0,21.39,-23.5]],"physical":[[0,36.58,-15.94]],"eye":[[3.5,26.42,-23.19],[-3.5,26.42,-23.19]],"face":[[0,26.25,-26.18]]},"pancham":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,22,0]],"target":[[0,8,-6.5]],"special":[[0,9.75,-5]],"mouth":[[0,9.75,-5]],"hand_primary":[[-8,7.5,0]],"physical":[[-8,7.5,0]],"eye":[[2.75,13.3,-5],[-2.75,13.3,-5]],"face":[[0,12.75,-5]],"hand_secondary":[[8,7.5,0]]},"pangoro":{"root":[[0,0,0]],"middle":[[0,24,0]],"top":[[0,40,0]],"target":[[0,26,-10]],"special":[[0,32.5,-6]],"mouth":[[0,32.5,-6]],"hand_primary":[[-26.8,27.3,1]],"physical":[[-26.8,27.3,1]],"eye":[[2.25,34.8,-5.5],[-2.25,34.8,-5.5]],"face":[[0,35,-5.5]],"hand_secondary":[[26.8,27.3,1]]},"furfrou":{"root":[[0,0,0]],"middle":[[0,13,0]],"top":[[0,28,0]],"target":[[0,13,-14]],"special":[[0,16.75,-8.7]],"mouth":[[0,16.75,-8.7]],"physical":[[-2.5,0.2,-6.5]],"eye":[[-2,18.8,-8.5],[2,18.8,-8.5]],"face":[[0,18.7,-10]]},"espurr":{"eye":[[2.5,10,-3.8],[-2.5,10,-3.8]]},"meowstic":{"eye":[[2.6,15.3,-3.55],[-2.6,15.3,-3.55]]},"honedge":{"eye":[[-0.28,22.61,-1.88]]},"doublade":{"eye":[[13.37,26.44,-8.57],[-13.37,26.34,-7.58]]},"aegislash":{"eye":[[0,36.34,-2.59]]},"spritzee":{"eye":[[2.25,5.5,-3.5],[-2.25,5.5,-3.5]]},"aromatisse":{"eye":[[-2.75,16.75,-5],[2.75,16.75,-5]]},"swirlix":{"eye":[[-2.75,10,-5.5],[2.75,10,-5.5]]},"slurpuff":{"eye":[[-3.25,14,-7],[3.25,14,-7]]},"inkay":{"eye":[[-2.12,7.84,-4.93],[2.12,7.84,-4.93]]},"malamar":{"eye":[[2.15,31,-4],[-2.15,31,-4]]},"binacle":{"root":[[0,0,0]],"top":[[0,25,0]],"special":[[0,18,-6]],"physical":[[-4.5,27.2,-4.25]],"eye":[[5.75,19.7,-3.75],[3.25,19.7,-3.75],[-5.75,19.7,-3.75],[-3.25,19.7,-3.75]]},"barbaracle":{"root":[[0,0,0]],"top":[[0,48,0]],"special":[[0,30,-13]],"physical":[[-35.5,29,-2]],"eye":[[28.5,28.75,-2],[-28.5,28.75,-2],[11.4,47,-2],[-11.4,47,-2],[1.7,40.1,-2.95],[-1.7,40.1,-2.95]]},"skrelp":{"eye":[[2,17.5,-1.5],[-2,17.5,-1.5]]},"dragalge":{"eye":[[2,29.15,-7.55],[-2,29.15,-7.55]]},"clauncher":{"eye":[[0.35,4.65,-7.5],[3.75,4.65,-4.1]]},"clawitzer":{"eye":[[0.55,4.4,-12.55],[3.8,4.4,-9.3]]},"helioptile":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,22,0]],"target":[[0,7,-11]],"special":[[0,16.5,-6.5]],"mouth":[[0,13.5,-5]],"hand_primary":[[-6.1,9.5,-0.6]],"physical":[[-6.1,9.5,-0.6]],"eye":[[-3,16.5,-5],[3,16.5,-5]],"face":[[0,16.5,-5]],"hand_secondary":[[6.1,9.5,-0.6]]},"heliolisk":{"root":[[0,0,0]],"middle":[[0,17,0]],"top":[[0,32,0]],"target":[[0,17,-7]],"special":[[0,27,-8]],"mouth":[[0,26,-3]],"hand_primary":[[-11.25,16.75,-1.5]],"physical":[[-3.5,0,4]],"eye":[[-3.15,27.5,-3.4],[3.18,27.5,-3.4]],"face":[[0,27,-6.55]],"hand_secondary":[[11.25,16.75,-1.5]]},"tyrunt":{"eye":[[-5.45,17.43,-17.04],[5.55,17.3,-16.93]]},"tyrantrum":{"root":[[0,0,0]],"eye":[[-13.33,51.96,-49.04],[0.28,52.82,-48.79]]},"amaura":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,41.75,0]],"target":[[0,15.5,-10]],"special":[[0.2,28.98,-14.4]],"mouth":[[0.15,23.42,-16.1]],"physical":[[0.2,28.98,-14.4]],"eye":[[-2.33,26.16,-16.5],[2.67,26.12,-16.5]],"face":[[0.17,26.14,-16.5]]},"aurorus":{"eye":[[-4.5,61.87,-29.52],[4.5,61.87,-29.52]]},"sylveon":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,24,0]],"target":[[0,11,-12]],"special":[[0,15.15,-9.2]],"mouth":[[0,15.15,-9.2]],"physical":[[-27.8,14.15,-6.8]],"eye":[[-2.1,18.58,-9.05],[2.1,18.58,-9.05]],"face":[[0,18,-9.05]]},"hawlucha":{"root":[[0,0,0]],"middle":[[0,17.5,0]],"top":[[0,34.5,0]],"target":[[0,16.22,-10.3]],"special":[[0,21.35,-4.38]],"mouth":[[0,21.35,-4.38]],"hand_primary":[[-12.77,9.04,-3.78]],"physical":[[-12.77,9.04,-3.78]],"eye":[[4,25.58,-4.49],[-4,25.58,-4.49]],"face":[[0,24.39,-9.08]],"hand_secondary":[[12.77,9.04,-3.78]]},"dedenne":{"eye":[[-2.71,11.3,-6.01],[2.71,11.3,-6.01]]},"carbink":{"eye":[[2,15.5,-3.5],[-2,15.5,-3.5]]},"goomy":{"eye":[[2,6.08,-4.97],[-2,6.08,-4.97]]},"sliggoo":{"eye":[[1.38,21.89,-11.7],[-3.42,20.47,-11.65]]},"goodra":{"eye":[[2.12,42.9,-30.66],[-5.88,42.94,-30.63]]},"klefki":{"eye":[[2.25,26.27,-3.04],[-2.25,26.27,-3.04]]},"phantump":{"eye":[[-2.6,13.17,-3.98],[0.5,13.36,-3.98]]},"trevenant":{"eye":[[-1.96,33.71,-4.05]]},"pumpkaboo":{"eye":[[-0.97,12.39,-1.51],[2.03,12.53,-1.51]]},"gourgeist":{"eye":[[-1,23,-2.05],[1,23,-2.05]]},"bergmite":{"eye":[[3.11,5.06,-6.33],[-2.92,5.27,-6.33]]},"avalugg":{"eye":[[8.34,40.47,-44.18],[-8.34,40.47,-44.18]]},"noibat":{"root":[[0,0,0]],"middle":[[0,7,0]],"top":[[0,21,0]],"target":[[0,7,-4]],"special":[[0,9.15,0.6]],"mouth":[[0,9.15,0.6]],"hand_primary":[[-6.36,4.17,-5.29]],"physical":[[0,9.15,0.6]],"eye":[[-3.5,11.25,-2.75],[3.5,11.25,-2.75]],"face":[[0,11.25,-3.3]],"hand_secondary":[[6.36,4.17,-5.29]]},"noivern":{"root":[[0,0,0]],"middle":[[0,33,0]],"top":[[0,62,0]],"target":[[0,36,-9]],"special":[[0,47.15,-3.1]],"mouth":[[0,47.15,-3.1]],"hand_primary":[[-31,49.75,0.5]],"physical":[[-31,49.75,0.5]],"eye":[[4,50,-6.9],[-4,50,-6.9]],"face":[[0,46.8,-8]],"hand_secondary":[[31,49.75,0.5]]},"xerneas":{"eye":[[3,50,-17.25],[-3,50,-17.25]]},"rowlet":{"eye":[[2.95,12,-6],[-2.95,12,-6]]},"dartrix":{"eye":[[3.7,26.65,-7],[-3.7,26.65,-7]]},"decidueye":{"eye":[[2.6,40,-5.5],[-2.6,40,-5.5]]},"litten":{"eye":[[-2.12,11.22,-9.52],[2.18,11.28,-9.52]]},"torracat":{"eye":[[-2.07,15.56,-19.28],[3.4,15.53,-19.21]]},"incineroar":{"eye":[[-1.11,39.12,-7.58],[2.89,38.98,-7.47]]},"popplio":{"root":[[0,0,0]],"middle":[[0,8.1,-1.5]],"top":[[0,14,0]],"target":[[0,7.33,-6.83]],"special":[[-0.11,10.86,-4.95]],"mouth":[[-0.11,10.86,-4.95]],"hand_primary":[[-9.08,7.89,-0.23]],"physical":[[-9.08,7.89,-0.23]],"eye":[[2.56,13.47,-4.38],[-2.93,13.26,-4.22]],"face":[[-0.33,13.81,-8.74]],"hand_secondary":[[9.15,7.88,0.31]]},"brionne":{"root":[[0,0,0]],"middle":[[0,7.77,-2.68]],"top":[[0,20,0]],"target":[[0,8.69,-8.93]],"special":[[-0.34,12.35,-8.61]],"mouth":[[-0.34,12.35,-8.61]],"hand_primary":[[-13.99,11.12,-10.65]],"physical":[[-13.99,11.12,-10.65]],"eye":[[2.42,15.89,-7.86],[-3.25,15.63,-7.38]],"face":[[-0.96,15.93,-13.95]],"hand_secondary":[[14.67,7.3,-8.8]]},"primarina":{"root":[[0,0,0]],"middle":[[2.81,12.4,-6.08]],"top":[[0,36,0]],"target":[[4.02,10.64,-11.45]],"special":[[1.55,25.17,-5.81]],"mouth":[[1.55,25.17,-5.81]],"hand_primary":[[-0.1,0.91,-11.19]],"physical":[[-25.73,2.83,12.52]],"eye":[[4.57,27.39,-6.21],[-1.42,27.38,-6.5]],"face":[[1.88,25.64,-12.48]],"hand_secondary":[[7.26,0.82,-8.62]]},"pikipek":{"eye":[[-1.5,6.6,-2.5],[1.5,6.6,-2.5]]},"trumbeak":{"eye":[[2,12.85,-4.75],[-2,12.85,-4.75]]},"toucannon":{"eye":[[3.5,27.45,-6],[-3.5,27.45,-6]]},"yungoos":{"root":[[0,0,0]],"middle":[[0,7.5,0]],"top":[[0,17,0]],"target":[[0,7.5,-22.5]],"special":[[0,4.05,-20.2]],"mouth":[[0,4.05,-20.2]],"physical":[[-4.61,0.57,-6.3]],"eye":[[2.25,6.5,-20.09],[-2.25,6.5,-20.09]],"face":[[0,6.85,-20.08]]},"gumshoos":{"root":[[0,0,0]],"middle":[[0,15,-2]],"top":[[0,32,0]],"target":[[0,13.5,-16]],"special":[[2.26,21.15,-18.11]],"mouth":[[2.26,21.15,-18.11]],"hand_primary":[[-4.25,12.91,-14.48]],"physical":[[-4.25,12.91,-14.48]],"eye":[[5.35,23.89,-18.01],[-0.55,24.18,-18.38]],"face":[[2.44,23.62,-19.18]],"hand_secondary":[[12.04,14.19,-1.69]]},"grubbin":{"root":[[0,0,0]],"middle":[[0,3,0]],"top":[[0,6.5,0]],"target":[[0,3,-10]],"special":[[0,2.5,-9.75]],"mouth":[[0,2.5,-4.25]],"hand_primary":[[-2.25,1,-1]],"physical":[[1,2.5,-8.25],[-1,2.5,-8.25]],"eye":[[-3.53,3.25,-2.75],[3.53,3.25,-2.75]],"face":[[0,2.5,-9.75]],"hand_secondary":[[2.25,1,-1]]},"charjabug":{"root":[[0,0,0]],"middle":[[0,4,0]],"top":[[0,8,0]],"target":[[0,4,-6]],"special":[[0,1.25,-7.25]],"mouth":[[0,2.75,-5.45]],"physical":[[2.99,1.5,-6.5],[-2.99,1.5,-6.5]],"eye":[[3,3.75,-5.5],[-3,3.75,-5.5]],"face":[[0,4,-5.5]]},"vikavolt":{"root":[[0,0,0]],"middle":[[0,17.09,0]],"top":[[0,14,0]],"target":[[-0.03,15.18,-10.84]],"special":[[-0.09,11.61,-17]],"mouth":[[-0.09,13.23,-8.68]],"hand_primary":[[-2.63,6.49,-3.33]],"physical":[[1.89,10.87,-22.96],[-2.11,10.94,-22.96]],"eye":[[-2.56,15.02,-8.81],[2.44,14.93,-8.84]],"face":[[-0.07,14.72,-8.8]],"hand_secondary":[[2.42,6.47,-3.34]]},"crabrawler":{"eye":[[1,16.45,-4.5],[-1,16.45,-4.5]]},"crabominable":{"eye":[[3.5,39.45,-13],[-3.5,39.45,-13]]},"cutiefly":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,20,0]],"target":[[0,11,-10]],"special":[[0,11,-10]],"hand_primary":[[-2,0.8,1]],"physical":[[0,11,-10]],"eye":[[2.5,11,-5],[-2.5,11,-5]],"face":[[0,11.3,-5]],"hand_secondary":[[2,0.8,1]]},"ribombee":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,21,0]],"target":[[0,11,-6]],"special":[[0,13.2,-4]],"mouth":[[0,13.2,-4]],"hand_primary":[[-1.5,10.1,5.25]],"physical":[[-1.5,10.1,5.25]],"eye":[[2.5,14.8,-4],[-2.5,14.8,-4]],"face":[[0,15.3,-4]],"hand_secondary":[[-1.5,10.1,5.25]]},"rockruff":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,20,0]],"target":[[0,8,-9.25]],"special":[[0,10.5,-7.75]],"mouth":[[0,10.5,-7.75]],"physical":[[-2.25,0.5,-3.5]],"eye":[[2.35,13,-5.75],[-2.35,13,-5.75]],"face":[[0,12.75,-7.75]]},"lycanroc":{"root":[[0,0,0]],"middle":[[0,14,0]],"top":[[0,28,0]],"target":[[0,12,-20]],"special":[[0,14.5,-18]],"mouth":[[0,14.5,-18]],"physical":[[-3.25,0.5,-7.5]],"eye":[[-2.3,17.3,-18],[2.3,17.3,-18]],"face":[[0,17.2,-21.2]]},"wishiwashi":{"eye":[[-18.15,30.25,-32.35],[18.15,30.05,-31.05]]},"mareanie":{"eye":[[2.5,10.7,-3.5],[-2.5,10.7,-3.5]]},"toxapex":{"eye":[[1,12.25,-2.5],[-1,12.25,-2.5]]},"mudbray":{"eye":[[3,16.2,-7],[-3,16.2,-7]]},"mudsdale":{"root":[[0,0,0]],"middle":[[0,24.5,0]],"top":[[0,41,0]],"target":[[0,20,-23.75]],"special":[[0,36,-10.25],[-4,2,10.77]],"mouth":[[0,36,-10.25]],"physical":[[4,2,10.77],[-4,2,10.77]],"eye":[[3.5,41.25,-14.25],[-3.5,41.25,-14.25]],"face":[[0,39,-17]]},"dewpider":{"eye":[[-2.75,9.65,-4],[2.75,9.65,-4]]},"araquanid":{"eye":[[8.75,26.35,-29],[-8.75,26.35,-29]]},"fomantis":{"eye":[[2,7.75,-3.5],[-2,7.75,-3.5]]},"lurantis":{"eye":[[1.17,20.51,-4.14],[-2.94,19.85,-2.99]]},"morelull":{"eye":[[1,4.5,-2],[-1,4.5,-2]]},"shiinotic":{"eye":[[1.25,12.75,-2],[-1.25,12.75,-2]]},"salandit":{"eye":[[2.5,4,-13.25],[-2.5,4,-13.25]]},"salazzle":{"eye":[[2.5,30.73,-4.16],[-2.5,30.73,-4.16]]},"stufful":{"eye":[[-2.08,10.32,-9.49],[2.32,10.32,-9.41]]},"bewear":{"eye":[[-3.15,38.6,-10.26],[3.15,38.6,-10.26]]},"bounsweet":{"eye":[[-1.75,5.75,-3.5],[1.75,5.75,-3.5]]},"steenee":{"eye":[[-2.1,17.5,-3],[2.1,17.5,-3]]},"tsareena":{"eye":[[-1.75,32.75,-4.5],[1.75,32.75,-4.5]]},"comfey":{"eye":[[1.5,4.5,-4],[-1.5,4.5,-4]]},"wimpod":{"eye":[[3,3.7,-9.55],[-3,3.7,-9.55]]},"golisopod":{"eye":[[7.17,38.9,-27.19],[-0.29,39.61,-27.39]]},"sandygast":{"eye":[[1.5,9.8,-6],[-1.5,9.8,-6]]},"palossand":{"eye":[[3,21.7,-5.5],[-3,21.7,-5.5]]},"pyukumuku":{"eye":[[-3.25,3,-6.5],[3.25,3,-6.5]]},"minior":{"root":[[0,0,0]],"middle":[[0,9,0]],"top":[[0,18,0]],"target":[[0,9,-6.5]],"special":[[0,6.25,-5]],"mouth":[[0,6.25,-5]],"physical":[[0,17.25,0]],"face":[[0,8.5,-5]]},"komala":{"eye":[[3.5,12.5,-4.5],[-3.5,12.5,-4.5]]},"turtonator":{"root":[[0,0,0]],"eye":[[13.65,42.07,3.43],[20.13,40.9,7.97]]},"mimikyu":{"eye":[[-1.25,2.7,-3],[1.25,2.7,-3]]},"bruxish":{"eye":[[3,9.7,-3.5],[-3,9.7,-3.5]]},"drampa":{"eye":[[4.4,30.22,-48.63],[-2.59,30.43,-48.86]]},"dhelmise":{"eye":[[14,51,-2.2]]},"jangmoo":{"eye":[[4.5,14,-5.5],[-4.5,14,-5.5]]},"hakamoo":{"eye":[[3,29.75,-2],[-3,29.75,-2]]},"kommoo":{"eye":[[-3,53.5,-3.25],[3,53.5,-3.25]]},"poipole":{"eye":[[-2.5,14.25,-3.75],[2.5,14.25,-3.75]]},"naganadel":{"eye":[[-3,60.75,2],[3,60.75,2]]},"grookey":{"eye":[[2.25,10.44,-6.14],[-2.74,10.26,-6.02]]},"thwackey":{"eye":[[2.5,21,-4.5],[-2.5,21,-4.5]]},"rillaboom":{"eye":[[2.5,30.26,-13.9],[-2.5,30.26,-13.9]]},"scorbunny":{"root":[[0,0,0]],"middle":[[1,9.5,0]],"top":[[0,28,0]],"target":[[1,8.5,-7]],"special":[[1,9.5,-9]],"mouth":[[0.34,10.05,-7.04]],"hand_primary":[[-6.49,5.32,-0.63]],"physical":[[-1.95,0.9,-1.15]],"eye":[[-3.01,12.22,-7.63],[3.46,12.61,-7.15]],"face":[[0.23,12.22,-7.36]],"hand_secondary":[[6.27,7.1,-2.65]]},"raboot":{"root":[[0,0,0]],"middle":[[-0.55,16.3,-0.05]],"top":[[0,30,0]],"target":[[-0.54,16.06,-7.05]],"special":[[-0.54,16.06,-7.05]],"mouth":[[-0.69,20.11,-5.93]],"hand_primary":[[-8.03,10.18,0.5]],"physical":[[-2.25,2.11,2.13]],"eye":[[-3.56,22.29,-6.23],[2.03,22.48,-6.23]],"face":[[-0.74,21.69,-6.14]],"hand_secondary":[[7.34,10.71,0.5]]},"cinderace":{"root":[[0,0,0]],"middle":[[-3,31.63,3]],"top":[[0,56,0]],"target":[[-3,31.63,-8]],"special":[[-3,31.63,-11]],"mouth":[[-3.45,39.31,-0.44]],"hand_primary":[[-8.12,30.58,-6.06]],"physical":[[-8.87,10.17,-9.74]],"eye":[[-5.54,41.94,-0.78],[-1.24,41.83,-0.83]],"face":[[-3.41,40.9,-0.6]],"hand_secondary":[[6.53,28.02,7.62]]},"sobble":{"eye":[[3.5,12.25,-5.5],[-3.5,12.25,-5.5]]},"drizzile":{"eye":[[3.25,18.89,-13.36],[-4.69,19.29,-12.4]]},"inteleon":{"eye":[[1.87,40.44,-4.39],[-3.13,40.41,-4.41]]},"skwovet":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,22.5,0]],"target":[[0,11.5,-6.5]],"special":[[0,11.3,-4.3]],"mouth":[[0,11.3,-4.3]],"hand_primary":[[-7.9,8.5,0]],"physical":[[0,1,26]],"eye":[[2.4,14.25,-3.5],[-2.4,14.25,-3.5]],"face":[[0,14.3,-3.5]],"hand_secondary":[[7.9,8.5,0]]},"greedent":{"root":[[0,0,0]],"middle":[[0,11,0]],"top":[[0,25.5,0]],"target":[[0,11.5,-6.5]],"special":[[0,14,-4.5]],"mouth":[[0,14,-4.5]],"hand_primary":[[-11.9,10.5,-1.5]],"physical":[[0,-8,32]],"eye":[[-1.75,17.75,-3.5],[1.75,17.75,-3.5]],"face":[[0,17.3,-3.5]],"hand_secondary":[[11.9,10.5,-1.5]]},"rookidee":{"root":[[0,0,0]],"middle":[[0,6,0]],"top":[[0,9.3,0]],"target":[[0,6,-6]],"special":[[0,5.67,-6.77]],"physical":[[-2,0.49,-2.05]],"eye":[[-2.25,6.96,-4.78],[2.25,6.96,-4.78]],"face":[[0,6.71,-5.03]]},"corvisquire":{"eye":[[2.5,14.4,-6],[-2.5,14.4,-6]]},"corviknight":{"root":[[0,0,0]],"middle":[[0,32,-9]],"top":[[0,67,0]],"target":[[0,33.5,-30.75]],"special":[[-0.46,52.37,-39.26]],"eye":[[4.91,57.37,-28.34],[-4.16,57.39,-27.67]],"face":[[-0.5,55.56,-39.85]]},"nickit":{"root":[[0,0,0]],"middle":[[0,10.5,0]],"top":[[0,23,0]],"target":[[0,7.5,-11.5]],"special":[[-4.45,6.44,18.18]],"mouth":[[0.03,9.44,-8.93]],"physical":[[0.03,9.63,-10.43]],"eye":[[-2.95,12.86,-8.97],[3.05,12.82,-8.94]],"face":[[0.05,12.84,-8.96]]},"thievul":{"root":[[0,0,0]],"middle":[[0,17,-0.05]],"top":[[0,34,0]],"target":[[0,18.17,-16.54]],"special":[[-17.94,11.96,30.48]],"mouth":[[0,22.6,-14.57]],"physical":[[0,21.46,-16.5]],"eye":[[-2.5,25.33,-15.56],[2.5,25.33,-15.56]],"face":[[0,25.33,-15.56]]},"gossifleur":{"eye":[[1.47,10.58,-1.33],[-2.02,10.58,-1.03]]},"eldegoss":{"eye":[[2,8.37,-2.38],[-2,8.37,-2.38]]},"wooloo":{"eye":[[-2.5,9.75,-9],[2.5,9.75,-9]]},"dubwool":{"eye":[[2.5,19.25,-7.5],[-2.5,19.25,-7.5]]},"chewtle":{"root":[[0,0,0]],"middle":[[0,9,0]],"top":[[0,20,0]],"target":[[0,9,-13]],"special":[[0,1.2,-8.5]],"mouth":[[0,1.2,-8.5]],"physical":[[0,1.2,-8.5]],"eye":[[-2,-0.75,-11.8],[2,-0.75,-11.8]],"face":[[0,-0.75,-11]]},"drednaw":{"root":[[0,0,0]],"middle":[[0,15,0]],"top":[[0,30,0]],"target":[[0,12,-30]],"special":[[0,10.12,-20.01]],"mouth":[[0,10.12,-20.01]],"physical":[[0,10.12,-20.01]],"eye":[[3.18,13.42,-22.48],[-3.18,13.42,-22.48]],"face":[[0,12.72,-25.66]]},"yamper":{"eye":[[-2.35,7.76,-10.47],[2.35,7.76,-10.47]]},"boltund":{"eye":[[-2.75,15.82,-15.26],[2.75,15.82,-15.26]]},"rolycoly":{"root":[[0,0,0]],"middle":[[0,7,0]],"top":[[0,13,0]],"target":[[0,7,-9]],"special":[[0,7,-7]],"physical":[[0,9,-7]],"eye":[[0,7,-7]],"face":[[0,6.8,-7]]},"carkol":{"root":[[0,0,0]],"middle":[[0,13,0]],"top":[[0,26,0]],"target":[[0,11,-12]],"special":[[0,12.54,-7.46]],"mouth":[[0,12.54,-7.46]],"physical":[[0,14.78,-9.87]],"eye":[[-1.4,14.72,-9.95],[1.4,14.72,-9.95]],"face":[[0,14.78,-9.87]]},"coalossal":{"root":[[0,0,0]],"middle":[[0,18,0]],"top":[[0,42,0]],"target":[[0,18,-12]],"special":[[0,20.51,-8.87]],"mouth":[[0,20.51,-8.87]],"hand_primary":[[-16.95,14.93,-7.77]],"physical":[[-16.95,14.93,-7.77]],"eye":[[1.88,24.65,-9.36],[-1.88,24.65,-9.36]],"face":[[0,23.7,-12.04]],"hand_secondary":[[16.95,14.93,-7.77]]},"applin":{"eye":[[2.21,10.34,-0.13],[-1.52,10.46,-0.13]]},"flapple":{"eye":[[3.58,23.82,-5.47],[-3.8,23.99,-5.51]]},"appletun":{"eye":[[4.2,3.18,-13.47],[-4.22,3.32,-13.47]]},"silicobra":{"eye":[[3.5,33.3,-8.15],[-3.5,33.3,-8.15]]},"sandaconda":{"eye":[[4,12.9,-6.55],[-4,12.9,-6.55]]},"cramorant":{"eye":[[-2.5,25.5,-1.55],[2.5,25.5,-1.55]]},"arrokuda":{"eye":[[2,4.2,-7.82],[-2,4.2,-7.82]]},"barraskewda":{"eye":[[3,6.41,-8.24],[-3,6.41,-8.24]]},"toxel":{"root":[[0,0,0]],"middle":[[0,4,4]],"top":[[0,14.5,0]],"target":[[0,4,-1.5]],"special":[[0,6.02,-1.48]],"mouth":[[0,6.02,-1.48]],"hand_primary":[[-1.36,0.53,-2.32]],"physical":[[-1.36,0.53,-2.32]],"eye":[[1.65,7.05,-3.76],[-1.65,7.05,-3.76]],"face":[[0,7.01,-3.95]],"hand_secondary":[[1.36,0.53,-2.32]]},"toxtricity":{"root":[[0,0,0]],"middle":[[0,26,0]],"top":[[0,47.5,0]],"target":[[0,26,-4.5]],"special":[[0,37.6,-2.3]],"mouth":[[0,37.6,-2.3]],"hand_primary":[[-25.2,28.7,0.3]],"physical":[[-25.2,28.7,0.3]],"eye":[[2.4,38.71,-4.94],[-2.4,38.71,-4.94]],"face":[[0,38.45,-7.45]],"hand_secondary":[[25.2,28.7,0.3]]},"sizzlipede":{"eye":[[-1.89,10.92,-12.62],[1.61,10.86,-12.68]]},"centiskorch":{"eye":[[-3.25,42.01,-13.65],[3.25,42.01,-13.65]]},"clobbopus":{"eye":[[-3.5,9.83,-4.27],[3.5,9.83,-4.27]]},"grapploct":{"eye":[[2.75,26.76,-9.25],[-2.75,26.76,-9.25]]},"sinistea":{"root":[[0,0,0]],"middle":[[0,4,0]],"top":[[0,11,0]],"target":[[0,4,-6]],"special":[[0,12.25,-2.5]],"mouth":[[0,3,-4.5]],"hand_primary":[[-12,5.25,0]],"physical":[[0,16.75,0]],"eye":[[2.45,4.5,-4.5],[-2.45,4.5,-4.5]],"face":[[0,4.3,-4.5]]},"polteageist":{"root":[[0,0,0]],"middle":[[0,6,0]],"top":[[0,26,0]],"target":[[0,10,-9]],"special":[[0,5,-22]],"mouth":[[0,14.3,-2.5]],"hand_primary":[[-5.5,13.5,-4]],"physical":[[0,21.75,-4]],"eye":[[1.25,16,-2.5],[-1.25,16,-2.5],[1.25,6.7,-22],[-1.25,6.7,-22]],"face":[[0,15.3,-2.5]],"hand_secondary":[[5.5,13.5,-4]]},"hattrem":{"eye":[[2.25,10.5,-3.5],[-2.25,10.5,-3.5]]},"hatterene":{"eye":[[-2.4,47.5,-6.5],[2.4,47.5,-6.5]]},"impidimp":{"eye":[[3,16.5,-4],[-3,16.5,-4]]},"morgrem":{"eye":[[3,23.8,-4.5],[-3,23.8,-4.5]]},"grimmsnarl":{"eye":[[0.2,40.4,-6.3],[-0.2,40.4,-6.3]]},"obstagoon":{"eye":[[-2.03,39.64,-19.36],[2.84,39.14,-19.55]]},"perrserker":{"eye":[[2.75,18.5,-4.5],[-2.75,18.5,-4.5]]},"cursola":{"root":[[0,0,0]],"middle":[[0,17,0]],"top":[[0,32,0]],"target":[[0,18,-8]],"special":[[0.22,21.34,-11.54]],"mouth":[[0.19,20.34,-5.7]],"physical":[[-16.61,23.56,-3.42]],"eye":[[1.82,22.02,-5.76],[-1.38,22.07,-5.77]],"face":[[0.22,21.94,-5.76]]},"sirfetchd":{"eye":[[2.25,14,-2.75],[-2.25,14,-2.75]]},"mrrime":{"eye":[[-2.5,31.25,-6],[2.5,31.25,-6]]},"runerigus":{"root":[[0,0,0]],"middle":[[0,25,0]],"top":[[0,50,0]],"target":[[0,26,-22]],"special":[[0.62,37.76,-25.34]],"hand_primary":[[-31.55,32.07,-11.24]],"physical":[[-31.55,32.07,-11.24]],"eye":[[-0.5,40.03,-20.36]],"face":[[0.46,37.72,-20.35]],"hand_secondary":[[28.69,38.97,-15.69]]},"milcery":{"eye":[[-2,2.25,-4],[2,2.25,-4]]},"alcremie":{"eye":[[-2.25,14.65,-3.25],[2.25,14.65,-3.25]]},"falinks":{"root":[[0,0,0]],"middle":[[0,7,0]],"top":[[0,16.5,0]],"target":[[0,6.5,-42]],"special":[[0,7,-42]],"physical":[[-2.33,17.49,-41.75]],"eye":[[2.06,8.12,-38.31],[-3.36,7.17,-38.39],[1.94,6.82,-23.49],[-2.98,5.96,-23.57],[1.94,6.82,-10.49],[-2.98,5.96,-10.57],[1.94,6.81,2.5],[-2.98,5.95,2.42],[1.96,6.74,15.45],[-2.97,5.88,15.37],[1.9,7.02,28.66],[-3.02,6.16,28.59]],"face":[[-0.61,7.45,-38.38]]},"pincurchin":{"eye":[[3.7,3.25,-5],[-3.7,3.25,-5]]},"snom":{"root":[[0,0,0]],"middle":[[0,3.5,0]],"top":[[0,9,0]],"target":[[0,3,-8]],"special":[[0,1.5,-7.25]],"mouth":[[0,1.5,-7.25]],"physical":[[0,5.5,-6.25]],"eye":[[3,1.5,-3.75],[-3,1.5,-3.75]],"face":[[0,3,-6.25]]},"frosmoth":{"root":[[0,0,0]],"middle":[[0,14,0.04]],"top":[[0,26,0]],"target":[[0,14.17,-9.51]],"special":[[0,13.69,-7.73]],"physical":[[0,19.08,-6.03]],"eye":[[1.93,18.52,-4.39],[-1.93,18.52,-4.39]],"face":[[0,17.85,-6.23]]},"stonjourner":{"eye":[[-3.5,44.3,-6],[2.5,43.8,-6]]},"eiscue":{"eye":[[4,20.1,-7.54],[-4,20.1,-7.54]]},"indeedee":{"root":[[0,0,0]],"middle":[[0,15,0]],"top":[[0,30,0]],"target":[[0,16,-6]],"special":[[0,20.1,-5]],"mouth":[[0,20.1,-5]],"hand_primary":[[-10.5,17.5,0]],"physical":[[-10.5,17.5,0]],"eye":[[-2.7,22,-5],[2.7,22,-5]],"face":[[0,22,-5]],"hand_secondary":[[10.5,17.5,0]]},"morpeko":{"eye":[[3,11.7,-5.5],[-3,11.7,-5.5]]},"cufant":{"eye":[[4.84,15,-9.48],[-5.16,15,-9.31]]},"copperajah":{"eye":[[11.5,49.53,-25.41],[-11.5,49.53,-25.41]]},"dracozolt":{"eye":[[2.34,33.78,-23.9],[-2.65,33.62,-23.86]]},"arctozolt":{"eye":[[1.58,45.49,-29.82],[-3.41,45.24,-29.71]]},"dracovish":{"eye":[[-16.28,55.5,-37.16],[9.18,59.12,-36.85]]},"arctovish":{"eye":[[13.5,50.25,-5.75],[-13.5,50.25,-5.75]]},"duraludon":{"root":[[0,0,0]],"middle":[[0,19.7,0]],"top":[[0,37,0]],"target":[[0,21.7,-8]],"special":[[0,29.51,-5.08]],"mouth":[[0,29.51,-5.08]],"hand_primary":[[-12.85,15.78,-10.01]],"physical":[[-12.85,15.78,-10.01]],"eye":[[2.09,26.66,-7.94],[-2.09,26.66,-7.94]],"face":[[0,25.42,-8.59]],"hand_secondary":[[12.85,15.78,-10.01]]},"dreepy":{"eye":[[1.94,10.27,-6.65],[-1.94,10.27,-6.65]]},"drakloak":{"eye":[[2.56,22.97,-7.28],[-2.37,23.02,-7.19],[1.41,32.12,-0.94],[-2.5,32.12,-0.94]]},"dragapult":{"eye":[[15.37,50.93,-3.23],[11.69,50.49,-4.44],[3.09,49.19,-4.41],[-15.54,50.99,-2.87],[-11.89,50.53,-4.17],[-3.3,49.2,-4.34]]},"eternatus":{"root":[[0,0,0]],"top":[[0,92.5,0]],"special":[[0,33.95,-110.9]],"physical":[[17,73.5,-38.5]],"eye":[[-5,42.75,-109.5],[5,42.75,-109.5]]},"zarude":{"eye":[[-2.8,45.3,-11],[2.8,45.3,-11]]},"regieleki":{"eye":[[0,20.5,-8.5],[2.5,20.5,-8.5],[5,22,-8.5],[5,19,-8.5],[-2.5,20.5,-8.5],[-5,22,-8.5],[-5,19,-8.5]]},"regidrago":{"eye":[[0,24,-12],[0,20,-12],[0,16,-12],[4,26,-12],[3,22,-12],[-4,26,-12],[-3,22,-12]]},"wyrdeer":{"eye":[[-2.51,24.68,-8.9],[2.51,24.68,-8.9]]},"kleavor":{"eye":[[-1.84,29.12,-20.38],[-6.15,29.35,-19.51]]},"ursaluna":{"root":[[0,0,0]],"middle":[[0,19,0]],"top":[[0,41.5,-3.5]],"target":[[0,19,-38]],"special":[[0.66,11.86,-35.97]],"mouth":[[0.66,11.86,-35.97]],"hand_primary":[[-22.38,2.01,-7.35]],"physical":[[-22.38,2.01,-7.35]],"eye":[[3.55,17.63,-34.12],[-1.67,17.87,-34.07]],"face":[[0.85,16.52,-38.22]],"hand_secondary":[[22.31,2,-7.5]]},"basculegion":{"root":[[0,0,0]],"middle":[[0,11,-4]],"top":[[0,36.5,0]],"target":[[0,11,-33]],"special":[[-0.25,8,-26.75]],"mouth":[[-0.25,8,-26.75]],"physical":[[-0.25,8,-26.75]],"eye":[[-4.5,15.5,-28],[4.5,15.5,-28]]},"sneasler":{"root":[[0,0,-0.5]],"middle":[[0,22.51,-0.5]],"top":[[0,39,-0.5]],"target":[[-1.88,22.51,-5.67]],"special":[[-5.19,17.54,10.33]],"mouth":[[-1.46,27.66,-7.58]],"hand_primary":[[-5.19,17.54,10.33]],"physical":[[-5.19,17.54,10.33]],"eye":[[-3.74,30.35,-7.98],[0.86,30.31,-7.98]],"face":[[-1.44,30.33,-7.98]],"hand_secondary":[[1.47,22.81,-12.52]]},"overqwil":{"eye":[[2,22.8,-7],[-2,22.8,-7]]},"sprigatito":{"eye":[[-1.96,11.1,-9.02],[1.96,11.1,-9.02]]},"floragato":{"eye":[[-1.25,23.1,-5.51],[2.95,22.93,-5.55]]},"meowscarada":{"eye":[[-1.52,38.17,-3.03],[2.27,38.11,-2.73]]},"fuecoco":{"eye":[[-2.25,14.08,-3.19],[2.25,14.08,-3.19]]},"crocalor":{"eye":[[-2.54,19.54,-10.43],[2.56,19.27,-10.31]]},"skeledirge":{"eye":[[4.59,22.85,-36.09],[-4.31,22.81,-36.09],[-0.81,21.11,-54.25],[2.09,21.12,-54.23]]},"quaxly":{"eye":[[-1.51,14.2,-5.4],[2.39,14.02,-5.37]]},"quaxwell":{"eye":[[-2.99,26.8,-2.97],[1.9,26.96,-2.82]]},"quaquaval":{"eye":[[-0.62,44.69,-6.71],[2.99,44.27,-5.86]]},"lechonk":{"eye":[[-3,4.92,-4.82],[3.1,4.82,-4.82]]},"oinkologne":{"eye":[[2.75,16.25,-9],[-2.75,16.25,-9]]},"tarountula":{"eye":[[1.6,15.75,-9],[-1.6,15.75,-9]]},"spidops":{"eye":[[1.6,32.25,-5],[-1.6,32.25,-5]]},"nymble":{"root":[[0,0,0]],"middle":[[0,4.5,0]],"top":[[0,9,0]],"target":[[0,4,-6]],"special":[[0,0.75,-3.7]],"physical":[[0,1.85,-5]],"eye":[[-2,3.85,-3.5],[2,3.85,-3.5]],"face":[[0,0.75,-3.7]]},"lokix":{"root":[[0,0,0]],"middle":[[0,17,0]],"top":[[0,28,0]],"target":[[0,19,-6]],"special":[[0,22.5,-3.3]],"hand_primary":[[-12.1,20,0]],"physical":[[-12.1,20,0]],"eye":[[-1.75,24.5,-2.8],[1.75,24.5,-2.8]],"face":[[0,24.5,-2.8]],"hand_secondary":[[12.1,20,0]]},"tandemaus":{"eye":[[-10.5,6.5,-3],[-5.5,6.5,-3],[10.5,6.5,-3],[5.5,6.5,-3]]},"maushold":{"eye":[[10.5,6.5,-3],[5.5,6.5,-3],[-10.5,6.5,-3],[-5.5,6.5,-3],[2.25,2.75,4.5],[3.75,2.75,4.5],[-2.25,2.75,4.5],[-3.75,2.75,4.5]]},"fidough":{"eye":[[3,14.5,-12.4],[-3,14.5,-12.4]]},"dachsbun":{"eye":[[3,17.7,-18.95],[-3,17.7,-18.95]]},"smoliv":{"root":[[0,0,0]],"middle":[[0,6,0]],"top":[[0,18,0]],"target":[[0,5,-6.5]],"special":[[0,3,-4.5]],"mouth":[[0,3,-4.5]],"physical":[[0,16.6,-2.5]],"eye":[[3.35,4.35,-4.5],[-3.35,4.35,-4.5]],"face":[[0,4.75,-4.5]]},"dolliv":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,28.5,0]],"target":[[0,12,-6.5]],"special":[[-6.55,8.31,0.85]],"mouth":[[0,15.3,-4.5]],"hand_primary":[[-6.55,8.31,0.85]],"physical":[[-6.55,8.31,0.85]],"eye":[[3,16.8,-4.56],[-3,16.8,-4.56]],"face":[[0,17.05,-4.57]],"hand_secondary":[[6.55,8.31,0.85]]},"arboliva":{"root":[[0,0,0]],"middle":[[0,22,0]],"top":[[0,42,0]],"target":[[0,22,-8]],"special":[[0,29,-5]],"hand_primary":[[2.1,51.11,1.1]],"physical":[[2.1,51.11,1.1]],"eye":[[-1.5,31.5,-2.5],[1.5,31.5,-2.5]],"face":[[0,31.5,-2.5]],"hand_secondary":[[-1.84,51.61,-1.14]]},"squawkabilly":{"eye":[[2.65,12.5,-7.5],[-2.65,12.5,-7.5]]},"nacli":{"root":[[0,0,0]],"middle":[[0,4,0]],"top":[[0,12,0]],"target":[[0,3,-6]],"special":[[0,3,-6]],"physical":[[0,7.2,-4.1]],"eye":[[-1,1.8,-2.5],[1,1.8,-2.5]],"face":[[0,1.5,-2.5]]},"naclstack":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,14,0]],"target":[[0,8,-10]],"special":[[0,8,-10]],"physical":[[0,12.2,-8.85]],"eye":[[-1.1,10.1,-8.85],[1.1,10.1,-8.85]],"face":[[0,9.6,-8.85]]},"garganacl":{"root":[[0,0,0]],"middle":[[0,31,0]],"top":[[0,54,0]],"target":[[0,25,-14]],"special":[[-19.75,14.36,-10.62]],"hand_primary":[[-19.75,14.36,-10.62]],"physical":[[-19.75,14.36,-10.62]],"eye":[[-1.02,35.9,-3.1],[0.98,35.89,-3.12]],"face":[[-0.02,35.65,-3.09]],"hand_secondary":[[18.27,12.85,-9.39]]},"charcadet":{"eye":[[3,15.7,-5.45],[-3,15.7,-5.45]]},"armarouge":{"eye":[[2.73,34.59,-2.22],[-1.77,34.54,-2.08]]},"ceruledge":{"eye":[[2.3,33.59,-9.71],[-2.3,33.59,-9.71]]},"tadbulb":{"root":[[0,0,0]],"middle":[[1,17.35,0.07]],"top":[[0,21.5,0]],"target":[[1,16.51,-6.45]],"special":[[1,17.16,-4.43]],"mouth":[[1,17.16,-4.43]],"physical":[[1,24.43,-3.25]],"eye":[[3.25,18.96,-4.39],[-1.25,18.96,-4.39]],"face":[[1,19.76,-4.37]]},"bellibolt":{"root":[[0,0,0]],"middle":[[0.5,14,0]],"top":[[0,26,0]],"target":[[0.5,14,-12]],"special":[[0.14,10.12,-9.21]],"mouth":[[-0.07,18.94,-6.41]],"hand_primary":[[-6.51,11.23,-8.66]],"physical":[[-6.51,11.23,-8.66]],"eye":[[2.43,20.74,-6.52],[-2.57,20.74,-6.51]],"face":[[-0.07,20.74,-6.52]],"hand_secondary":[[6.42,11.87,-8.92]]},"wattrel":{"eye":[[-2.5,11.05,-8.32],[2.5,11.05,-8.32]]},"kilowattrel":{"eye":[[2.5,22.61,-12.35],[-2.5,22.61,-12.35]]},"maschiff":{"eye":[[2.25,11.5,-13],[-2.25,11.5,-13]]},"mabosstiff":{"eye":[[-3,27,-26],[3,27,-26]]},"shroodle":{"root":[[0,0,0]],"middle":[[0,4,0]],"top":[[0,10.5,0]],"target":[[0,4.5,-9]],"special":[[0,0.41,-6.7]],"mouth":[[0,0.41,-6.7]],"physical":[[0,3.61,-7.72]],"eye":[[-2.25,1.75,-3.95],[2.25,1.75,-3.95]],"face":[[0,3.61,-7.72]]},"grafaiai":{"root":[[0,0,0]],"middle":[[0,10.2,0]],"top":[[0,22.5,0]],"target":[[2.38,9.7,-10.74]],"special":[[-4.72,7.7,-10.94]],"mouth":[[0.36,9.57,-5.9]],"hand_primary":[[-4.72,7.7,-10.94]],"physical":[[-4.72,7.7,-10.94]],"eye":[[-3.78,13.02,-7.05],[4.71,12.85,-6.69]],"face":[[0.49,13.7,-7.09]],"hand_secondary":[[10.83,6.91,0.15]]},"bramblin":{"eye":[[3,11,-2.5],[-3,11,-2.5]]},"brambleghast":{"eye":[[4.97,12.62,-4.22],[-5.03,12.62,-4.22]]},"toedscool":{"root":[[0,0,0]],"middle":[[0,19.42,0]],"top":[[0,32,0]],"target":[[0,17.42,-8]],"mouth":[[0,14.83,-3.64]],"eye":[[-2.44,18.42,-3.74],[2.44,18.42,-3.74]],"face":[[0,18,-6.21]]},"toedscruel":{"root":[[0,0,0]],"middle":[[0,29.13,0]],"top":[[0,50,0]],"target":[[0,19.13,-16]],"special":[[0,26.58,-15.16]],"mouth":[[0,26.58,-15.16]],"hand_primary":[[15.17,23.66,-24.95],[-15.17,23.66,-24.95]],"eye":[[3.51,34.89,-7.52],[-3.51,34.89,-7.52]],"face":[[0,33.1,-12.01]]},"klawf":{"eye":[[-10,29.14,-19.95],[10,29.14,-19.95]]},"capsakid":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,18,0]],"target":[[0,7,-8]],"special":[[0.16,8.16,-6.38]],"mouth":[[0.16,8.16,-6.38]],"hand_primary":[[-5.44,6.2,0]],"physical":[[0.18,15.6,-5.11]],"eye":[[-2.83,10.81,-6.47],[3.17,10.8,-6.46]],"face":[[0.17,11.05,-6.47]],"hand_secondary":[[5.64,6.04,0.03]]},"scovillain":{"root":[[0,0,0]],"middle":[[0,18.25,0]],"top":[[0,36,0]],"target":[[0,19.25,-13]],"special":[[-3.18,18.95,-17.37]],"mouth":[[-3.18,18.95,-17.37],[8.97,22.4,-11.97]],"hand_primary":[[-3.65,12.31,-7.5]],"physical":[[8.97,22.4,-11.97]],"eye":[[-10.3,18.46,-23.27],[-4.05,22.79,-25.75],[16.35,22.71,-17.56],[9.91,26.7,-20.13]],"face":[[-7.99,21.88,-24.39],[13.85,26,-18.63]],"hand_secondary":[[7.52,11.67,-3.88]]},"rellor":{"eye":[[1.64,4.65,-0.68],[-1.31,4.65,-1.21]]},"rabsca":{"eye":[[-2.1,12.48,-2.86],[2.1,12.48,-2.86],[-1.4,43.19,-2.61],[1.4,43.19,-2.61]]},"flittle":{"eye":[[2.3,8.2,-4],[-2.3,8.2,-4]]},"espathra":{"eye":[[2,21.2,-34.75],[-2,21.2,-34.75]]},"tinkatink":{"root":[[0,0,0]],"middle":[[0,6,0]],"top":[[0,14,0]],"target":[[0,6,-6]],"special":[[0,6,-7]],"mouth":[[-0.06,5.65,-3.52]],"hand_primary":[[-5.25,1.84,2.33]],"physical":[[6.39,7.68,-8.97]],"eye":[[2.46,7.62,-3.56],[-2.54,7.68,-3.52]],"face":[[-0.04,7.2,-3.53]],"hand_secondary":[[5.36,1.98,-1.94]]},"tinkatuff":{"root":[[0,0,0]],"middle":[[0,8.6,-0.1]],"top":[[0,22,0]],"target":[[0,7.6,-6.1]],"special":[[0,8,-8]],"mouth":[[-0.17,9.93,-4.16]],"hand_primary":[[-3.02,3.99,-2.91]],"physical":[[13.6,13.87,-6.1]],"eye":[[2.33,12.18,-4.22],[-2.67,12.18,-4.22]],"face":[[-0.17,11.93,-4.21]],"hand_secondary":[[4.56,5.31,-2.67]]},"tinkaton":{"root":[[0,0,0]],"middle":[[0,6.5,-0.15]],"top":[[0,23,0]],"target":[[-1.04,6.5,-6.06]],"special":[[0,7,-8],[24.54,16.29,-33.63]],"mouth":[[-0.72,9.92,-4.15]],"hand_primary":[[-5.04,7.95,-6.28]],"physical":[[24.54,16.29,-33.63]],"eye":[[1.78,12.41,-4.34],[-3.22,12.42,-4.31]],"face":[[-0.71,11.45,-3.29]],"hand_secondary":[[3.89,6.65,-6.22]]},"wiglett":{"eye":[[1.5,26.44,-14.92],[-1.5,26.44,-14.92]]},"wugtrio":{"eye":[[-11.22,25.84,-21.31],[-14.19,25.78,-20.84],[20.67,15.43,-11.38],[17.71,15.83,-11.57],[5.72,30.14,16.13],[2.73,30.09,16.33]]},"finizen":{"eye":[[5.5,5.5,-14],[-5.5,5.5,-14]]},"palafin":{"eye":[[4.75,38.2,-5.75],[-4.75,38.2,-5.75]]},"varoom":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,17,0]],"target":[[0,8,-9.5]],"special":[[0,7.75,-8.25]],"mouth":[[0,7.75,-8.25]],"physical":[[0,7.5,-5.5]],"eye":[[3.75,6,1.5],[-3.75,6,1.5]],"face":[[0,7.5,-5.5]]},"revavroom":{"root":[[0,0,0]],"middle":[[0,12,0]],"top":[[0,25,0]],"target":[[0,13,-20.5]],"special":[[0,21,-17]],"mouth":[[0,21,-17]],"physical":[[0,17,-19.5]],"eye":[[0,14.5,-19.54]],"face":[[0,12.5,-19.5]]},"cyclizar":{"eye":[[-3.4,21.9,-16],[3.4,21.9,-16]]},"orthworm":{"root":[[0,0,0]],"middle":[[0,13.72,0.22]],"top":[[0,39,0]],"target":[[0,19.26,-9.5]],"special":[[0.79,31.11,-11.99]],"mouth":[[0.79,31.11,-11.99]],"hand_primary":[[9.15,30.14,-7.69],[-8.16,31.81,-7.5]],"physical":[[9.15,30.14,-7.69]],"face":[[0.94,31.61,-16.08]],"hand_secondary":[[10.16,27.01,-1.15],[8.81,22.58,2.29],[-9.24,26.87,-2.85],[-9.26,24.09,1.81]]},"glimmet":{"root":[[0,0,0]],"middle":[[0,2,0]],"top":[[0,19.5,0]],"target":[[0,11,-12]],"special":[[0,10.95,-8.65]],"physical":[[0,6,19.5]],"eye":[[1,11,-2.45],[-1,11,-2.45]],"face":[[0,11,-8.5]]},"glimmora":{"root":[[0,0,0]],"middle":[[0,26.8,0]],"top":[[0,46.5,0]],"target":[[0,26.8,-13]],"special":[[0,26.75,-11.65]],"physical":[[-1.6,0.85,-0.5]],"eye":[[1.25,26.72,-3.45],[-1.25,26.88,-3.45]],"face":[[0,26.8,-11.5]]},"greavard":{"root":[[0,0,0]],"middle":[[0,8,0]],"top":[[0,18,0]],"target":[[0,7,-13]],"special":[[0,7,-7]],"mouth":[[0,7,-7]],"physical":[[0,7,-7]],"face":[[0,9.5,-11]]},"houndstone":{"root":[[0,0,0]],"middle":[[0,18,0]],"top":[[0,34,0]],"target":[[0,18,-33]],"special":[[0,18,-21]],"mouth":[[0,18,-21]],"physical":[[0,18,-21]],"face":[[0,22.5,-26.75]]},"flamigo":{"eye":[[1.1,31.32,-7.31],[-1.1,31.31,-7.3]]},"cetoddle":{"eye":[[3.24,10.85,-6.58],[-3.11,11.44,-6.02]]},"cetitan":{"eye":[[-16.46,27.89,-24.03],[16.54,27.78,-24.03]]},"veluza":{"eye":[[-2.5,7.95,-18],[2.5,7.95,-18]]},"dondozo":{"eye":[[-20,27.82,-27.78],[20,27.82,-27.78]]},"tatsugiri":{"eye":[[1.3,4.8,-8],[-1.3,4.8,-8]]},"annihilape":{"root":[[0,0,0]],"middle":[[0,15,-0.15]],"top":[[0,31,0]],"target":[[0,14,-7.15]],"special":[[-14.2,7.29,-7.04]],"hand_primary":[[-13.43,6.71,-6.79]],"physical":[[-13.43,6.71,-6.79]],"face":[[-0.52,16.26,-4.67]],"hand_secondary":[[13.17,6.78,-6.89]]},"clodsire":{"eye":[[7.5,8.5,-20.5],[-7.5,8.5,-20.5]]},"farigiraf":{"root":[[0,0,0]],"middle":[[0,40,-4]],"top":[[0,91.75,0]],"target":[[0,40,-24]],"special":[[7.5,61.43,-36.53],[-7.5,61.43,-36.53]],"mouth":[[0,54.81,-35.3]],"physical":[[0,64.42,-41.85]],"eye":[[3.5,57.12,-39.73],[-3.5,57.12,-39.73],[7.5,61.43,-36.53],[-7.5,61.43,-36.53]],"face":[[0,52.93,-43.83]]},"dudunsparce":{"root":[[0,0,0]],"middle":[[0,5,0]],"top":[[0,13.5,0]],"target":[[0,5,-41]],"special":[[0,2.5,-40]],"mouth":[[0,2.5,-40]],"physical":[[0,5,50]],"eye":[[8.5,7.5,-34.5],[-8.5,7.5,-34.5]],"face":[[0,6.5,-40]]},"kingambit":{"root":[[0,0,0]],"middle":[[0,22,0]],"top":[[0,52,0]],"target":[[0,24,-10]],"special":[[0,30,-12]],"mouth":[[0,34.2,-5]],"hand_primary":[[-26.2,28.5,0.1]],"physical":[[0,57.4,-7.75]],"eye":[[2.1,37.6,-5],[-2.1,37.6,-5]],"face":[[0,36.5,-5]],"hand_secondary":[[26.2,28.5,0.1]]},"gimmighoul":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,17,0]],"target":[[0,8,-9]],"special":[[0,9,-5]],"hand_primary":[[-6,7.7,0]],"physical":[[0,13,-6]],"eye":[[1.7,11.45,-1.55],[-1.7,11.45,-1.55]],"face":[[0,11.5,-1.5]],"hand_secondary":[[6,7.7,0]]},"gholdengo":{"root":[[0,0,0]],"middle":[[0,17.9,0]],"top":[[0,40,0]],"target":[[0,19.4,-8]],"special":[[-7.54,20.48,-2.49]],"mouth":[[0.35,23.92,-4.03]],"hand_primary":[[-7.54,20.48,-2.49]],"physical":[[-7.54,20.48,-2.49]],"eye":[[1.16,26.95,-5.06],[-2.04,26.74,-5.08]],"face":[[-0.4,26.28,-4.87]],"hand_secondary":[[1.53,16.02,-9.3]]},"walkingwake":{"eye":[[2.5,31.5,-49],[-2.5,31.5,-49]]},"ironleaves":{"eye":[[2.5,32.5,-10.25],[-2.5,32.5,-10.25]]},"dipplin":{"eye":[[1.69,11.45,-0.67],[-1.55,11.47,-0.67]]},"poltchageist":{"root":[[0,0,0]],"middle":[[0,4,0]],"top":[[0,19,0]],"target":[[0,4,-6]],"special":[[0,16.5,-2.5]],"mouth":[[0,3.7,-4]],"hand_primary":[[-14,4.5,0]],"physical":[[16,-0.5,-12.5]],"eye":[[2.5,5,-4],[-2.5,5,-4]],"face":[[0,4.8,-4]],"hand_secondary":[[14,4.5,0]]},"sinistcha":{"root":[[0,0,0]],"middle":[[0,10,0]],"top":[[0,28,0]],"target":[[0,11,-11]],"special":[[0,1,-8.25]],"mouth":[[0,14.3,-3]],"hand_primary":[[-6,12.75,-6]],"physical":[[0,23.5,-1.9]],"eye":[[1.25,16,-3],[-1.25,16,-3],[1.25,2.75,-8.25],[-1.25,2.75,-8.25]],"face":[[0,15,-3]],"hand_secondary":[[6,12.75,-6]]},"archaludon":{"root":[[0,0,0]],"middle":[[0,18,0]],"top":[[0,42,0]],"target":[[0,22,-14]],"special":[[0,31.26,-3.31]],"mouth":[[0,31.26,-3.31]],"hand_primary":[[-9.32,13.42,-9.76]],"physical":[[-9.32,13.42,-9.76]],"eye":[[1.55,33.59,-6.69],[-1.55,33.59,-6.69]],"face":[[0,33.12,-7.66]],"hand_secondary":[[9.32,13.42,-9.76]]},"hydrapple":{"eye":[[5.53,34.86,-1.47],[-0.75,34.91,-1.44],[32.6,14.36,-35.35],[35.43,14.31,-32.52],[-32.5,15.1,-35.35],[-35.33,15.11,-32.52],[-35.34,14.69,32.58],[-32.51,14.64,35.41],[35.42,13.89,32.58],[32.59,13.9,35.41]]}}');
    LOCATOR_POSES = JSON.parse('{"venusaur":{"animation.venusaur.recoil@0.55":{"target":[[0,13,-25.75]]},"animation.venusaur.recoil@0.6":{"target":[[0,13,-25.75]]},"animation.venusaur.recoil@0.65":{"target":[[0,13,-25.75]]},"animation.venusaur.recoil@0.3":{"target":[[0,13,-25.75]]},"animation.venusaur.recoil@0.45":{"target":[[0,13,-25.75]]},"animation.venusaur.recoil@0.75":{"target":[[0,13,-25.75]]},"animation.venusaur.cry@1.25":{"target":[[0,13,-25.75]]},"animation.venusaur.cry@2":{"target":[[0,13,-25.75]]}},"charmander":{"animation.charmander.special@1.2":{"special":[[0.29,11.93,-8.72]]},"animation.charmander.special@1.25":{"special":[[0.02,11.93,-10.22]],"mouth":[[0.02,11.93,-10.22]],"hand_primary":[[-8.07,10.51,-3.38]]},"animation.charmander.special@0.8":{"special":[[1.39,14.39,-2.78]]},"animation.charmander.special@1.35":{"special":[[0.02,11.93,-10.22]]},"animation.charmander.special@1.45":{"face":[[0.02,15.22,-11.29]]},"animation.charmander.special@1.3":{"special":[[0.02,11.93,-10.22]]},"animation.charmander.special@0":{"special":[[0.06,13.12,-5.81]]},"animation.charmander.special@0.7":{"special":[[1.21,14.31,-3.18]]},"animation.charmander.special@0.65":{"eye":[[-1.48,18.47,-3.49],[4.49,17.88,-3.73]]},"animation.charmander.special@1.1":{"special":[[0.96,12.47,-5.42]]},"animation.charmander.special@0.3":{"hand_secondary":[[6.36,9.39,-3.35]]}},"charmeleon":{"animation.charmeleon.cry@1.25":{"target":[[0,15.25,-6.25]]},"animation.charmeleon.cry@2":{"target":[[0,15.25,-6.25]]}},"charizard":{"animation.charizard.special@1.2":{"target":[[0.52,20.99,-10.42]],"special":[[1.61,22.11,-24.9]]},"animation.charizard.special@1.25":{"special":[[-0.45,16.74,-30.01]],"target":[[0.6,21,-10.42]],"mouth":[[-0.45,16.74,-30.01]],"hand_primary":[[-18.87,20.05,-0.93]]},"animation.charizard.special@1.85":{"target":[[0.58,21,-10.42]]},"animation.charizard.special@2.15":{"target":[[0.13,20.97,-10.42]]},"animation.charizard.special@0.8":{"special":[[1.09,35.49,-2.28]],"target":[[-0.14,20.95,-10.42]]},"animation.charizard.special@1.35":{"special":[[-0.48,20.07,-31.59]],"target":[[0.6,21.22,-10.42]]},"animation.charizard.special@1.45":{"target":[[0.6,21.02,-10.42]],"face":[[-0.93,23.45,-33.33]]},"animation.charizard.special@1.95":{"target":[[0.43,20.99,-10.42]]},"animation.charizard.special@1.55":{"target":[[0.6,21.11,-10.42]]},"animation.charizard.special@1.3":{"special":[[-0.46,18.46,-30.98]],"target":[[0.6,20.9,-10.42]]},"animation.charizard.special@3.1":{"target":[[-0.15,20.95,-10.42]]},"animation.charizard.special@2.25":{"target":[[-0.02,20.96,-10.42]]},"animation.charizard.special@1.5":{"target":[[0.6,21.2,-10.42]]},"animation.charizard.special@1.75":{"target":[[0.6,20.95,-10.42]]},"animation.charizard.special@1.65":{"target":[[0.6,20.93,-10.42]]},"animation.charizard.special@2.2":{"target":[[0.05,20.96,-10.42]]},"animation.charizard.special@1.6":{"target":[[0.6,21.02,-10.42]]},"animation.charizard.special@0":{"target":[[-0.15,20.95,-10.42]]},"animation.charizard.special@0.7":{"special":[[1.1,35.83,-2.95]],"target":[[-0.15,20.95,-10.42]]},"animation.charizard.special@2.5":{"target":[[-0.15,20.95,-10.42]]},"animation.charizard.special@0.65":{"eye":[[-1.08,37.32,-6.93],[3.9,37.34,-6.55]]},"animation.charizard.special@1.7":{"target":[[0.6,20.92,-10.42]]},"animation.charizard.special@2":{"target":[[0.35,20.98,-10.42]]},"animation.charizard.special@1.1":{"special":[[3.35,29.38,-15.89]],"target":[[0.36,20.98,-10.42]]},"animation.charizard.special@0.15":{"hand_primary":[[-13.15,20.05,-12.49]],"target":[[-0.15,20.95,-10.42]]},"animation.charizard.special@0.3":{"hand_secondary":[[15.29,20.18,2.06]],"target":[[-0.15,20.95,-10.42]]},"animation.charizard.special@3.9":{"target":[[0.03,20.96,-10.42]]},"animation.charizard.physical@1.25":{"target":[[2.67,20.85,-11.4]],"middle":[[-0.58,20.85,-2.47]]},"animation.charizard.physical@1.2":{"target":[[2.67,20.89,-10.6]]},"animation.charizard.physical@1.45":{"target":[[2.67,20.81,-11.45]]},"animation.charizard.physical@1.65":{"target":[[2.67,20.95,-11.38]]},"animation.charizard.physical@1.3":{"middle":[[-0.58,21.03,-2.5]],"target":[[2.67,21.03,-11.43]]},"animation.charizard.physical@1.5":{"target":[[2.67,21.05,-11.44]]},"animation.charizard.physical@1.35":{"target":[[2.67,21.05,-11.45]]},"animation.charizard.status@1.15":{"mouth":[[-1.66,38.3,-16.52]],"special":[[-1.66,38.3,-16.52]]},"animation.charizard.status@1.25":{"special":[[0.37,40.93,-15.08]]},"animation.charizard.status@1.35":{"eye":[[-2.03,45.28,-13.02],[2.96,45.22,-13.23]]},"animation.charizard.recoil@0.55":{"target":[[0,20,-10]]},"animation.charizard.recoil@0.6":{"target":[[0,20,-10]]},"animation.charizard.recoil@0.65":{"target":[[0,20,-10]]},"animation.charizard.recoil@0.3":{"hand_primary":[[-19.88,23.68,-4.27]],"target":[[0,20,-10]]},"animation.charizard.recoil@0.45":{"hand_primary":[[-20.46,23.59,-3.58]],"target":[[0,20,-10]]},"animation.charizard.recoil@0.75":{"hand_primary":[[-21.31,23.14,-2.14]],"target":[[0,20,-10]]}},"squirtle":{"animation.squirtle.special@1.2":{"special":[[0.62,12.47,-8.78]]},"animation.squirtle.special@1.25":{"special":[[0.12,10.62,-9.4]],"mouth":[[0.11,10.22,-9.35]],"hand_primary":[[-8.86,10.34,-3.97]]},"animation.squirtle.special@0.8":{"special":[[0.71,11.73,-6.32]]},"animation.squirtle.special@1.35":{"special":[[0.05,10.58,-10.1]],"target":[[0.01,5.94,-6.28]]},"animation.squirtle.special@1.45":{"target":[[0.02,6.02,-6.26]],"middle":[[0.04,9,-2.17]],"face":[[0.06,13.69,-10.18]]},"animation.squirtle.special@1.55":{"target":[[0.04,6.04,-6.15]]},"animation.squirtle.special@1.3":{"special":[[0.08,10.75,-9.69]],"target":[[0.03,6.09,-6.06]]},"animation.squirtle.special@1.5":{"target":[[0.03,6.09,-6.09]]},"animation.squirtle.special@1.75":{"target":[[0.06,6.05,-6.21]]},"animation.squirtle.special@1.65":{"target":[[0.06,6.09,-6.11]]},"animation.squirtle.special@1.6":{"target":[[0.05,6.06,-6.05]]},"animation.squirtle.special@0.7":{"special":[[0.36,10.98,-6.84]]},"animation.squirtle.special@0.65":{"eye":[[-2.07,13.61,-8.18],[2.91,13.26,-7.97]]},"animation.squirtle.special@1.7":{"target":[[0.06,6.06,-6.15]]},"animation.squirtle.special@1":{"middle":[[0.59,9.31,0.3]]},"animation.squirtle.special@1.1":{"special":[[1.65,14.45,-6.56]],"target":[[0.82,8.49,-5.12]]},"animation.squirtle.special@0.15":{"hand_primary":[[-7.8,8.97,-5.48]]},"animation.squirtle.special@0.3":{"hand_secondary":[[8.2,8.47,-5.04]]},"animation.squirtle.special@3.9":{"target":[[0.65,8.41,-5.08]]},"animation.squirtle.physical@1.25":{"target":[[1.05,-0.36,-13.66]],"middle":[[-0.93,3.24,-16.6]]},"animation.squirtle.physical@1.05":{"target":[[-0.91,-1.26,21.95]]},"animation.squirtle.physical@1.2":{"target":[[1.86,-0.22,-9.79]]},"animation.squirtle.physical@1.45":{"target":[[0.52,25.29,-9.94]]},"animation.squirtle.physical@1.65":{"target":[[-0.01,22.1,-15.95]]},"animation.squirtle.physical@0.1":{"middle":[[0.68,9.06,0.28]],"hand_primary":[[-5.34,11.85,-4.21]]},"animation.squirtle.physical@1.3":{"middle":[[0.62,14.1,-15.98]],"target":[[2.54,9.95,-18.14]]},"animation.squirtle.physical@1.15":{"target":[[-0.66,-1.06,4.98]]},"animation.squirtle.physical@1.5":{"target":[[2.51,19.89,-8.59]]},"animation.squirtle.physical@1.1":{"target":[[0.2,-1.22,15.49]]},"animation.squirtle.physical@1.35":{"target":[[1.57,21.04,-19.34]]},"animation.squirtle.physical@0.3":{"target":[[-0.51,4.67,14.36]]},"animation.squirtle.physical@0.5":{"middle":[[2.91,4.54,22.45]]},"animation.squirtle.physical@0.8":{"target":[[-1.26,-1.12,29.16]]},"animation.squirtle.physical@0.6":{"target":[[1.95,0.25,27.46]]},"animation.squirtle.physical@0.85":{"target":[[-0.98,-1.21,28.98]]},"animation.squirtle.status@1.15":{"mouth":[[0.16,11.98,-7.4]],"special":[[0.16,12.38,-7.36]]},"animation.squirtle.status@1.85":{"target":[[-0.17,8.3,-5.1]]},"animation.squirtle.status@1.25":{"special":[[-0.02,12.15,-7.03]]},"animation.squirtle.status@0.2":{"target":[[0.04,5.93,-6.14]]},"animation.squirtle.status@1.35":{"eye":[[-2.77,14.98,-6.53],[2.22,15.03,-6.4]]},"animation.squirtle.status@1.65":{"target":[[-0.25,8.32,-4.91]]},"animation.squirtle.recoil@0.3":{"hand_primary":[[-8.9,10.04,-1.73]],"target":[[0,8.68,-4.83]]},"animation.squirtle.recoil@0.45":{"hand_primary":[[-8.99,9.97,-1.59]],"target":[[0,8.26,-5.2]]},"animation.squirtle.recoil@0.75":{"hand_primary":[[-8.98,10.02,-1.03]],"target":[[0,8.13,-5.3]]},"animation.squirtle.cry@1.25":{"target":[[0,8.5,-5]]},"animation.squirtle.cry@2":{"target":[[0,8.37,-5.11]]}},"wartortle":{"animation.wartortle.special@1.2":{"special":[[-0.38,14.59,-10.1]]},"animation.wartortle.special@1.25":{"special":[[0.16,13.14,-12.15]],"target":[[0.13,7.15,-8.25]],"mouth":[[0.16,12.89,-12.09]],"middle":[[-0.03,10.96,-2.38]]},"animation.wartortle.special@1.85":{"target":[[0.13,7.24,-8.23]],"middle":[[0.02,11,-2.32]]},"animation.wartortle.special@2.15":{"target":[[0.13,7.23,-8.23]]},"animation.wartortle.special@0.8":{"special":[[-0.08,13.99,-8.03]],"target":[[-0.02,10.78,-6.81]]},"animation.wartortle.special@1.35":{"special":[[0.17,12.86,-12.25]],"target":[[0.14,6.95,-8.28]]},"animation.wartortle.special@1.45":{"target":[[0.14,6.9,-8.29]],"middle":[[-0.03,10.86,-2.52]],"face":[[0.2,15.78,-12.32]]},"animation.wartortle.special@1.95":{"target":[[0.13,7.21,-8.23]]},"animation.wartortle.special@1.55":{"middle":[[-0.03,10.96,-2.38]],"target":[[0.13,7.14,-8.25]]},"animation.wartortle.special@2.4":{"middle":[[0.04,11.28,-1.84]]},"animation.wartortle.special@1.3":{"special":[[0.17,13,-12.2]],"target":[[0.14,7.05,-8.26]]},"animation.wartortle.special@2.25":{"target":[[0.13,7.55,-8.16]]},"animation.wartortle.special@1.5":{"target":[[0.14,7.02,-8.27]],"middle":[[-0.03,10.91,-2.45]]},"animation.wartortle.special@1.75":{"target":[[0.13,7.28,-8.22]]},"animation.wartortle.special@1.65":{"target":[[0.13,7.31,-8.21]]},"animation.wartortle.special@2.2":{"target":[[0.13,7.39,-8.2]]},"animation.wartortle.special@1.6":{"target":[[0.13,7.26,-8.22]],"middle":[[-0.04,11,-2.31]]},"animation.wartortle.special@1.8":{"middle":[[0.01,11,-2.31]]},"animation.wartortle.special@0.7":{"special":[[0.3,13.77,-8.52]]},"animation.wartortle.special@2.5":{"target":[[0.12,8.33,-7.94]]},"animation.wartortle.special@0.65":{"eye":[[-2.15,17.14,-10.09],[3.33,16.91,-9.65]]},"animation.wartortle.special@1.7":{"target":[[0.13,7.29,-8.22]]},"animation.wartortle.special@2":{"target":[[0.13,7.19,-8.24]]},"animation.wartortle.special@1":{"middle":[[-1.14,12.33,0.82]]},"animation.wartortle.special@1.1":{"special":[[-1.4,14.95,-6.58]],"target":[[-1.06,12.4,-5.79]]},"animation.wartortle.special@0.3":{"hand_secondary":[[9.38,9.43,-5.02]]},"animation.wartortle.special@3.9":{"target":[[-0.34,11.34,-6.49]]},"animation.wartortle.physical@1.25":{"target":[[1.26,7.05,-9.98]],"middle":[[-0.15,10.88,-4.29]]},"animation.wartortle.physical@1.05":{"target":[[1.32,14.78,-3.14]]},"animation.wartortle.physical@1.2":{"target":[[0.59,14.71,-2.7]]},"animation.wartortle.physical@1.45":{"target":[[1.63,6.55,-9.93]]},"animation.wartortle.physical@1.65":{"target":[[1.59,7.38,-9.41]]},"animation.wartortle.physical@0.1":{"physical":[[-0.02,22.66,-9.39]]},"animation.wartortle.physical@1.3":{"middle":[[-0.13,10.85,-4.34]],"target":[[1.43,6.99,-9.97]]},"animation.wartortle.physical@1.15":{"target":[[0.96,14.82,-2.38]]},"animation.wartortle.physical@1.5":{"target":[[1.67,6.48,-9.83]]},"animation.wartortle.physical@1.1":{"target":[[1.32,14.92,-2.76]]},"animation.wartortle.physical@1.35":{"target":[[1.56,6.88,-9.97]]},"animation.wartortle.physical@0.5":{"middle":[[0.14,12.09,0.28]]},"animation.wartortle.physical@0.8":{"target":[[0.54,13.3,-4.91]]},"animation.wartortle.physical@0.6":{"target":[[0.13,11.84,-6.12]]},"animation.wartortle.physical@0.85":{"target":[[0.67,13.63,-4.58]]},"animation.wartortle.status@1.15":{"mouth":[[-0.77,14.15,-9.49]],"special":[[-0.8,14.4,-9.55]],"target":[[-0.71,8.86,-7.71]]},"animation.wartortle.status@1.2":{"target":[[-0.57,8.94,-7.69]]},"animation.wartortle.status@0.5":{"middle":[[-0.78,11.7,0.82]],"target":[[-0.75,11.2,-6.17]]},"animation.wartortle.status@0.2":{"target":[[-0.23,10.55,-6.81]]},"animation.wartortle.status@1":{"middle":[[-0.58,11.18,-1.38]]},"animation.wartortle.recoil@0.55":{"target":[[0,11.02,-6]]},"animation.wartortle.recoil@0.6":{"target":[[0,10.89,-6.09]]},"animation.wartortle.recoil@0.65":{"target":[[0,10.76,-6.18]]},"animation.wartortle.recoil@0.3":{"hand_primary":[[-12,13.32,-0.62]],"target":[[0,11.67,-5.52]]},"animation.wartortle.recoil@0.45":{"hand_primary":[[-11.91,13.31,0.01]],"target":[[0,11.29,-5.82]]},"animation.wartortle.recoil@0.75":{"hand_primary":[[-11.86,13.13,-0.51]],"target":[[0,10.48,-6.35]]},"animation.wartortle.cry@1.25":{"target":[[0,10.36,-6.43]]},"animation.wartortle.cry@2":{"target":[[0,10.45,-6.37]]}},"blastoise":{"animation.blastoise.special@1.2":{"special":[[-13.35,36.89,-28.8],[12.85,36.89,-29.03]]},"animation.blastoise.special@1.25":{"special":[[-13.18,36.9,-28.76],[12.67,36.9,-28.98]],"mouth":[[-0.22,30.44,-25.6]],"hand_primary":[[-5.08,16.22,-21.73]]},"animation.blastoise.special@0.8":{"special":[[-14.36,37.87,-28.8],[13.86,37.87,-29.05]]},"animation.blastoise.special@1.35":{"special":[[-19.55,42.02,-14.89],[17.51,43.21,-15.03]]},"animation.blastoise.special@1.45":{"face":[[-0.74,40.58,-20.44]]},"animation.blastoise.special@1.3":{"special":[[-17.23,39.02,-24.86],[16.59,39.18,-25.13]]},"animation.blastoise.special@0.7":{"special":[[-14.47,38.51,-28.58],[13.97,38.51,-28.83]]},"animation.blastoise.special@0.65":{"eye":[[3.77,36.07,-25.76],[-4.23,36.07,-25.69]]},"animation.blastoise.special@1.1":{"special":[[-13.68,36.94,-28.89],[13.17,36.94,-29.12]]},"animation.blastoise.special@0.3":{"hand_secondary":[[17.68,23.69,-27.66]]},"animation.blastoise.physical@0.1":{"hand_primary":[[-15.99,21.66,-26.17]],"physical":[[-15.99,21.66,-26.17]]},"animation.blastoise.status@1.15":{"mouth":[[-1.35,41.65,-13.79]],"special":[[-16.89,45.89,-12.91],[13.77,47.23,-13.17]]},"animation.blastoise.status@1.25":{"special":[[-17.46,39.58,-23.67],[16.25,40.07,-23.96]]},"animation.blastoise.status@1.35":{"eye":[[3.76,34.56,-27.04],[-4.24,34.56,-26.97]]},"animation.blastoise.recoil@0.55":{"target":[[0,25,-16]]},"animation.blastoise.recoil@0.6":{"target":[[0,25,-16]]},"animation.blastoise.recoil@0.65":{"target":[[0,25,-16]]},"animation.blastoise.recoil@0.3":{"hand_primary":[[-19.83,40.4,-16.25]],"target":[[0,25,-16]]},"animation.blastoise.recoil@0.45":{"hand_primary":[[-19.78,39.84,-17.19]],"target":[[0,25,-16]]},"animation.blastoise.recoil@0.75":{"hand_primary":[[-19.65,38.62,-19.01]],"target":[[0,25,-16]]},"animation.blastoise.cry@1.25":{"target":[[0,25,-16]]},"animation.blastoise.cry@2":{"target":[[0,25,-16]]}},"weedle":{"animation.weedle.cry@1.25":{"target":[[0,6.97,-12.72]]},"animation.weedle.cry@2":{"target":[[0,15.48,-7.48]]}},"kakuna":{"animation.kakuna.physical@1.25":{"target":[[0.65,5.1,-10.47]],"middle":[[1.01,7.79,-6.15]]},"animation.kakuna.physical@1.05":{"target":[[-2.91,10.01,-2.83]]},"animation.kakuna.physical@1.2":{"target":[[-5.89,5.7,-7.25]]},"animation.kakuna.physical@1.45":{"target":[[2.97,5.31,-9.65]]},"animation.kakuna.physical@1.65":{"target":[[4.42,5.78,-8.12]]},"animation.kakuna.physical@0.1":{"physical":[[-0.98,15.73,-2.68]]},"animation.kakuna.physical@1.3":{"middle":[[1.27,7.8,-5.95]],"target":[[1.22,5.16,-10.31]]},"animation.kakuna.physical@1.15":{"target":[[-6.25,7.77,-4.57]]},"animation.kakuna.physical@1.5":{"target":[[3.55,5.35,-9.37]]},"animation.kakuna.physical@1.1":{"target":[[-4.73,9.01,-3.81]]},"animation.kakuna.physical@1.35":{"target":[[1.8,5.21,-10.12]]},"animation.kakuna.physical@0.3":{"target":[[-0.26,7.98,-7.24]]},"animation.kakuna.physical@0.5":{"middle":[[1.94,8.02,-2.45]]},"animation.kakuna.physical@0.8":{"target":[[2.65,9.87,-3.52]]},"animation.kakuna.physical@0.6":{"target":[[2.77,8.42,-6.43]]},"animation.kakuna.physical@0.85":{"target":[[1.19,10.22,-2.88]]}},"pidgeot":{"animation.pidgeot.status@1.15":{"mouth":[[-1.14,23,-13.87]],"special":[[-1.14,23,-13.87]]},"animation.pidgeot.status@1.25":{"special":[[-0.24,23.27,-13.43]]},"animation.pidgeot.status@1.35":{"eye":[[3.52,26.98,-12.12],[-0.97,26.57,-13.03]]},"animation.pidgeot.recoil@0.55":{"target":[[0,18,-14.5]]},"animation.pidgeot.recoil@0.6":{"target":[[0,18,-14.5]]},"animation.pidgeot.recoil@0.65":{"target":[[0,18,-14.5]]},"animation.pidgeot.recoil@0.3":{"target":[[0,18,-14.5]]},"animation.pidgeot.recoil@0.45":{"target":[[0,18,-14.5]]},"animation.pidgeot.recoil@0.75":{"target":[[0,18,-14.5]]}},"ekans":{"animation.ekans.recoil@0.55":{"target":[[0,2.5,-26]]},"animation.ekans.recoil@0.6":{"target":[[0,2.5,-26]]},"animation.ekans.recoil@0.65":{"target":[[0,2.5,-26]]},"animation.ekans.recoil@0.3":{"target":[[0,2.5,-26]]},"animation.ekans.recoil@0.45":{"target":[[0,2.5,-26]]},"animation.ekans.recoil@0.75":{"target":[[0,2.5,-26]]},"animation.ekans.cry@1.25":{"target":[[0,2.5,-26]]},"animation.ekans.cry@2":{"target":[[0,2.5,-26]]}},"arbok":{"animation.arbok.recoil@0.55":{"target":[[0,17.75,-16.5]]},"animation.arbok.recoil@0.6":{"target":[[0,17.75,-16.5]]},"animation.arbok.recoil@0.65":{"target":[[0,17.75,-16.5]]},"animation.arbok.recoil@0.3":{"target":[[0,17.75,-16.5]]},"animation.arbok.recoil@0.45":{"target":[[0,17.75,-16.5]]},"animation.arbok.recoil@0.75":{"target":[[0,17.75,-16.5]]},"animation.arbok.cry@1.25":{"target":[[0,17.75,-16.5]]},"animation.arbok.cry@2":{"target":[[0,17.75,-16.5]]}},"pikachu":{"animation.pikachu.special@1.2":{"special":[[-3.1,16.57,-6.12],[5.78,16.43,-4.68]]},"animation.pikachu.special@1.25":{"special":[[-3.48,11.59,-12.41],[5.49,11.53,-11.76]],"mouth":[[1,10.81,-12.04]],"hand_primary":[[-6.7,3.92,-4.44]]},"animation.pikachu.special@0.8":{"special":[[-1.78,9.35,-3.3],[6.65,8.9,-0.17]]},"animation.pikachu.special@1.45":{"face":[[0,9.13,-14.39]]},"animation.pikachu.special@0.7":{"special":[[-1.81,9.85,-3.1],[6.61,9.34,0.05]]},"animation.pikachu.special@0.65":{"eye":[[0.25,12.17,-3.17],[5.39,11.85,-1.25]]},"animation.pikachu.special@1.1":{"special":[[-2.8,14.31,-2.17],[5.83,14.07,0.39]]},"animation.pikachu.special@0.3":{"hand_secondary":[[8.4,7.12,-0.05]]},"animation.pikachu.physical@1.25":{"target":[[-2.11,12.5,-32.43]],"middle":[[-2.98,13.93,-26.67]]},"animation.pikachu.physical@1.05":{"target":[[-0.14,10.62,0.25]]},"animation.pikachu.physical@1.2":{"target":[[-2.17,13.37,-31.36]]},"animation.pikachu.physical@1.45":{"target":[[-2.65,21.49,-13.53]]},"animation.pikachu.physical@1.65":{"target":[[-0.83,16.73,-7.84]]},"animation.pikachu.physical@0.1":{"physical":[[6.04,19.75,14.58]]},"animation.pikachu.physical@1.3":{"middle":[[-2.82,16.12,-19.68]],"target":[[-3.03,16.92,-25.63]]},"animation.pikachu.physical@1.15":{"target":[[-2.01,16.52,-23.87]]},"animation.pikachu.physical@1.5":{"target":[[-2.34,21.87,-11.13]]},"animation.pikachu.physical@1.1":{"target":[[-1.1,14.22,-14.13]]},"animation.pikachu.physical@1.35":{"target":[[-3.25,19.96,-19.11]]},"animation.pikachu.physical@0.5":{"middle":[[0,12,6.67]]},"animation.pikachu.physical@0.8":{"target":[[0,10,3]]},"animation.pikachu.physical@0.6":{"target":[[0,10,3]]},"animation.pikachu.physical@0.85":{"target":[[0,10,3]]},"animation.pikachu.status@1.15":{"mouth":[[-0.09,11.55,-2.42]],"special":[[-4.58,11.8,-3.16],[4.4,12.21,-2.86]]},"animation.pikachu.status@1.25":{"special":[[-4.88,24.86,-4.96],[4.09,24.17,-5.07]]},"animation.pikachu.status@1.35":{"eye":[[-2.84,31.96,-4.29],[2.64,31.6,-4.25]]},"animation.pikachu.recoil@0.3":{"hand_primary":[[-9.25,9.75,-2.25]]},"animation.pikachu.recoil@0.45":{"hand_primary":[[-9.25,9.75,-2.25]]},"animation.pikachu.recoil@0.75":{"hand_primary":[[-9.25,9.75,-2.25]]}},"raichu":{"animation.raichu.special@1.2":{"target":[[-0.85,14.37,-9.34]],"special":[[-5.61,18.4,-9.92],[4.37,18.1,-10.48]],"middle":[[-0.07,14.37,-3.4]]},"animation.raichu.special@1.25":{"special":[[-4.76,21.19,-7.49],[5.19,20.48,-8.2]],"target":[[-0.85,14.55,-10.44]],"mouth":[[0.15,20,-7.99]],"middle":[[-0.07,14.55,-4.5]],"hand_primary":[[-9.73,17.41,-1.09]]},"animation.raichu.special@1.85":{"target":[[-0.85,14.55,-10.44]],"middle":[[-0.07,14.55,-4.5]]},"animation.raichu.special@2.15":{"target":[[-0.85,14.17,-9.16]]},"animation.raichu.special@0.8":{"special":[[-5.65,20.9,-4.47],[4.26,20.52,-5.74]],"target":[[-0.85,17.4,-5.94]]},"animation.raichu.special@1.35":{"special":[[-4.74,21.55,-7.37],[5.21,20.9,-8.08]],"target":[[-0.85,14.55,-10.44]]},"animation.raichu.special@1.45":{"target":[[-0.85,14.55,-10.44]],"middle":[[-0.07,14.55,-4.5]],"face":[[0.37,22.33,-7.35]]},"animation.raichu.special@1.95":{"target":[[-0.85,14.55,-10.44]]},"animation.raichu.special@1.55":{"middle":[[-0.07,14.55,-4.5]],"target":[[-0.85,14.55,-10.44]]},"animation.raichu.special@2.4":{"middle":[[-0.07,13.17,-0.93]]},"animation.raichu.special@1.3":{"special":[[-4.78,21.47,-7.52],[5.18,20.83,-8.22]],"target":[[-0.85,14.55,-10.44]]},"animation.raichu.special@2.25":{"target":[[-0.85,13.83,-8.28]]},"animation.raichu.special@1.5":{"target":[[-0.85,14.55,-10.44]],"middle":[[-0.07,14.55,-4.5]]},"animation.raichu.special@1.75":{"target":[[-0.85,14.55,-10.44]]},"animation.raichu.special@1.65":{"target":[[-0.85,14.55,-10.44]]},"animation.raichu.special@2.2":{"target":[[-0.85,14.04,-8.74]]},"animation.raichu.special@1.6":{"target":[[-0.85,14.55,-10.44]],"middle":[[-0.07,14.55,-4.5]]},"animation.raichu.special@2.7":{"middle":[[-0.07,13.39,0]]},"animation.raichu.special@0.5":{"middle":[[-0.07,20.4,0]]},"animation.raichu.special@1.8":{"middle":[[-0.07,14.55,-4.5]]},"animation.raichu.special@0.7":{"special":[[-5.93,24.23,-5.09],[3.98,23.96,-6.43]],"target":[[-0.85,20.8,-5.94]]},"animation.raichu.special@2.5":{"target":[[-0.85,12.72,-5.94]]},"animation.raichu.special@0.55":{"middle":[[-0.07,20.5,0]]},"animation.raichu.special@0.65":{"eye":[[-4.01,25.57,-5.85],[1.95,25.47,-6.55]]},"animation.raichu.special@1.7":{"target":[[-0.85,14.55,-10.44]]},"animation.raichu.special@2":{"target":[[-0.85,14.55,-10.44]]},"animation.raichu.special@1":{"middle":[[-0.07,12.25,-0.12]]},"animation.raichu.special@1.1":{"special":[[-6.41,12.23,-11.18],[3.57,12.61,-11.7]],"target":[[-0.85,13.73,-7.37]]},"animation.raichu.special@0.3":{"hand_secondary":[[6.57,10.53,-6.94]]},"animation.raichu.special@3.9":{"target":[[-0.85,12.17,-5.97]]},"animation.raichu.physical@1.25":{"target":[[-0.85,14.4,-8.01]],"middle":[[-0.07,14.4,-2.06]]},"animation.raichu.physical@1.45":{"target":[[-0.85,14.4,-10.72]]},"animation.raichu.physical@1.65":{"target":[[-0.85,14.4,-11.09]]},"animation.raichu.physical@0.1":{"physical":[[22.21,48.45,15.09]]},"animation.raichu.physical@1.3":{"middle":[[-0.07,14.4,-4.16]],"target":[[-0.85,14.4,-10.11]]},"animation.raichu.physical@1.5":{"target":[[-0.85,14.4,-10.92]]},"animation.raichu.physical@1.35":{"target":[[-0.85,14.4,-10.31]]},"animation.raichu.status@1.15":{"mouth":[[1.65,19.67,-4.83]],"special":[[-3.33,20.6,-4.7],[6.65,20.44,-5.22]],"target":[[1.55,17.78,-5.94]]},"animation.raichu.status@1.25":{"special":[[-7.74,17.25,-4.52],[2.04,19.27,-4.98]]},"animation.raichu.status@1.2":{"target":[[0.35,16.34,-5.94]]},"animation.raichu.status@1.35":{"eye":[[-7.05,18.36,-3.89],[-1.32,20.15,-4.13]]},"animation.raichu.status@1":{"middle":[[5.93,13.4,0]]},"animation.raichu.recoil@0.55":{"target":[[0,11.66,-5.83]]},"animation.raichu.recoil@0.6":{"target":[[0,11.69,-5.85]]},"animation.raichu.recoil@0.65":{"target":[[0,11.72,-5.86]]},"animation.raichu.recoil@0.3":{"hand_primary":[[-9.22,15.8,3.81]],"target":[[0,11.53,-5.76]]},"animation.raichu.recoil@0.45":{"hand_primary":[[-8.57,15.36,4.53]],"target":[[0,11.61,-5.8]]},"animation.raichu.recoil@0.75":{"hand_primary":[[-9.4,14.04,3.45]],"target":[[0,11.77,-5.89]]},"animation.raichu.special2@1":{"middle":[[-0.07,16.19,0.12]]},"animation.raichu.special2@3.3":{"middle":[[-0.07,21.12,1.11]]}},"sandshrew":{"animation.sandshrew.physical@1.25":{"target":[[0,8,-22]],"middle":[[0,8,-15]]},"animation.sandshrew.physical@1.05":{"target":[[1.52,26,-18.11]]},"animation.sandshrew.physical@1.2":{"target":[[0,22.22,-21.81]]},"animation.sandshrew.physical@1.45":{"target":[[0,8.08,-22]]},"animation.sandshrew.physical@1.65":{"target":[[0,8.08,-22]]},"animation.sandshrew.physical@1.3":{"middle":[[0,8.32,-15]],"target":[[0,8.32,-22]]},"animation.sandshrew.physical@1.15":{"target":[[1.52,24.74,-20.5]]},"animation.sandshrew.physical@1.5":{"target":[[0,8.2,-22]]},"animation.sandshrew.physical@1.1":{"target":[[1.52,26,-19.33]]},"animation.sandshrew.physical@1.35":{"target":[[0,7.88,-22]]},"animation.sandshrew.physical@0.8":{"target":[[1.52,24.66,-12.03]]},"animation.sandshrew.physical@0.6":{"target":[[1.52,14.72,-7.53]]},"animation.sandshrew.physical@0.85":{"target":[[1.52,26,-13.24]]},"animation.sandshrew.recoil@0.55":{"target":[[0,8,-7]]},"animation.sandshrew.recoil@0.6":{"target":[[0,8,-7]]},"animation.sandshrew.recoil@0.65":{"target":[[0,8,-7]]},"animation.sandshrew.recoil@0.3":{"hand_primary":[[-8.95,8.35,-0.64]],"target":[[0,8,-7]]},"animation.sandshrew.recoil@0.45":{"hand_primary":[[-8.96,8.65,-0.66]],"target":[[0,8,-7]]},"animation.sandshrew.recoil@0.75":{"hand_primary":[[-8.99,8.49,-1.52]],"target":[[0,8,-7]]},"animation.sandshrew.cry@1.25":{"target":[[0,8,-7]]},"animation.sandshrew.cry@2":{"target":[[0,8,-7]]}},"nidorina":{"animation.nidorina.recoil@0.55":{"target":[[0,4,-13]]},"animation.nidorina.recoil@0.6":{"target":[[0,4,-13]]},"animation.nidorina.recoil@0.65":{"target":[[0,4,-13]]},"animation.nidorina.recoil@0.3":{"hand_primary":[[-3.5,-0.06,-1.56]],"target":[[0,4,-13]]},"animation.nidorina.recoil@0.45":{"hand_primary":[[-3.5,0,-1.5]],"target":[[0,4,-13]]},"animation.nidorina.recoil@0.75":{"hand_primary":[[-3.5,0,-1.5]],"target":[[0,4,-13]]},"animation.nidorina.cry@1.25":{"target":[[0,4,-13]]},"animation.nidorina.cry@2":{"target":[[0,4,-13]]}},"nidoking":{"animation.nidoking.special@1.2":{"special":[[1.25,38.17,-17.43]]},"animation.nidoking.special@1.25":{"special":[[2.56,24.46,-27.72]],"mouth":[[2.4,23.73,-21.55]],"hand_primary":[[-21.54,25.49,-9.29]]},"animation.nidoking.special@0.8":{"special":[[0.57,37.9,-14.42]]},"animation.nidoking.special@1.35":{"special":[[3.11,20.99,-30.53]]},"animation.nidoking.special@1.45":{"face":[[3.33,24.13,-30.94]]},"animation.nidoking.special@1.3":{"special":[[2.81,21.3,-29.61]]},"animation.nidoking.special@0.7":{"special":[[2.19,28.4,-16.97]]},"animation.nidoking.special@0.65":{"eye":[[6.08,26.18,-21.75],[0.55,26.3,-21.96]]},"animation.nidoking.special@1.1":{"special":[[-2.03,41.93,-0.55]]},"animation.nidoking.special@0.15":{"hand_primary":[[-0.95,6.97,-18.28]]},"animation.nidoking.special@0.3":{"hand_secondary":[[5.03,12.6,-20.15]]},"animation.nidoking.physical@1.25":{"target":[[6.56,16.85,-13.81]],"middle":[[4.3,18.85,-6.65]]},"animation.nidoking.physical@1.05":{"target":[[7.57,15.68,-5.45]]},"animation.nidoking.physical@1.2":{"target":[[6.81,16.56,-11.72]]},"animation.nidoking.physical@1.45":{"target":[[6.56,17.09,-13.81]]},"animation.nidoking.physical@1.65":{"target":[[6.56,16.85,-13.81]]},"animation.nidoking.physical@0.1":{"middle":[[0.95,16.65,0.18]],"hand_primary":[[-9.93,7.39,-13.34]],"physical":[[-9.93,7.39,-13.34]]},"animation.nidoking.physical@1.3":{"middle":[[4.3,19.33,-6.65]],"target":[[6.56,17.33,-13.81]]},"animation.nidoking.physical@0":{"hand_primary":[[-8.21,5.49,-14.64]],"physical":[[-8.21,5.49,-14.64]]},"animation.nidoking.physical@1.15":{"target":[[7.06,16.26,-9.63]]},"animation.nidoking.physical@1.5":{"target":[[6.56,16.85,-13.81]]},"animation.nidoking.physical@1.1":{"target":[[7.31,15.97,-7.54]]},"animation.nidoking.physical@1.35":{"target":[[6.56,16.97,-13.81]]},"animation.nidoking.physical@0.3":{"target":[[4.34,14.65,-4.76]]},"animation.nidoking.physical@0.5":{"middle":[[3.7,16.65,4.75]]},"animation.nidoking.physical@0.8":{"target":[[7.91,14.65,1]]},"animation.nidoking.physical@0.6":{"target":[[6.49,14.65,-1.31]]},"animation.nidoking.physical@0.85":{"target":[[8.27,14.65,1.57]]},"animation.nidoking.beam@0.8":{"special":[[0.38,46.62,-6.64]]},"animation.nidoking.beam@1.35":{"special":[[3.37,25.2,-34.82]]},"animation.nidoking.beam@1.25":{"special":[[2.37,20.27,-32.13]]},"animation.nidoking.beam@1.3":{"special":[[2.99,23.36,-34.26]]},"animation.nidoking.beam@1.2":{"special":[[1.15,43.04,-15.97]]},"animation.nidoking.status@1.15":{"mouth":[[-9.4,20.43,-11.29]],"special":[[-9.4,20.43,-11.29]],"target":[[-6.23,14.65,-5.79]]},"animation.nidoking.status@1.85":{"target":[[-6.74,14.65,-5.17]]},"animation.nidoking.status@1.25":{"middle":[[-0.79,16.65,-0.61]],"special":[[-5.78,30.36,-7.53]],"target":[[-6.74,14.65,-5.17]]},"animation.nidoking.status@1.3":{"middle":[[-0.79,17.13,-0.61]]},"animation.nidoking.status@1.2":{"target":[[-6.49,14.65,-5.49]]},"animation.nidoking.status@0.5":{"target":[[-1.77,14.65,-8.31]]},"animation.nidoking.status@2.15":{"target":[[-6.74,14.65,-5.17]]},"animation.nidoking.status@0.2":{"target":[[0.62,14.65,-8.48]]},"animation.nidoking.status@1.35":{"eye":[[5.1,39.04,-2.79],[-0.64,39.87,-2.33]],"target":[[-6.74,14.77,-5.17]]},"animation.nidoking.status@1.65":{"target":[[-6.74,14.65,-5.17]]},"animation.nidoking.status@2":{"target":[[-6.74,14.65,-5.17]]},"animation.nidoking.status@2.05":{"target":[[-6.74,14.65,-5.17]]},"animation.nidoking.status@2.2":{"target":[[-6.74,14.65,-5.17]]},"animation.nidoking.recoil@0.55":{"target":[[0,15.25,-8.5]]},"animation.nidoking.recoil@0.6":{"target":[[0,15.25,-8.5]]},"animation.nidoking.recoil@0.65":{"target":[[0,15.25,-8.5]]},"animation.nidoking.recoil@0.3":{"hand_primary":[[-22.5,32.97,1.07]],"target":[[0,15.25,-8.5]]},"animation.nidoking.recoil@0.45":{"hand_primary":[[-23.1,32.16,-1.56]],"target":[[0,15.25,-8.5]]},"animation.nidoking.recoil@0.75":{"hand_primary":[[-24.59,27.63,-5.23]],"target":[[0,15.25,-8.5]]},"animation.nidoking.battle_cry@1.25":{"target":[[-6.74,14.65,-5.17]]},"animation.nidoking.battle_cry@2":{"target":[[-6.74,14.65,-5.17]]}},"clefairy":{"animation.clefairy.special@1.25":{"hand_primary":[[-10.97,11.81,-7.89]]},"animation.clefairy.special@1.3":{"special":[[0.13,11.17,-6.64]]},"animation.clefairy.special@2.7":{"middle":[[0,10,1.5]]},"animation.clefairy.special@0.5":{"middle":[[0,10.25,1.07]]},"animation.clefairy.special@0.7":{"special":[[-0.1,8.52,-6.66]],"target":[[0,10.25,-6.93]]},"animation.clefairy.special@0.55":{"middle":[[0,10.25,1.29]]},"animation.clefairy.special@0.65":{"eye":[[2.14,10.39,-7.2],[-2.36,10.33,-7.2]]},"animation.clefairy.special@0.15":{"hand_primary":[[-8,7,-8.62]]},"animation.clefairy.special@0.3":{"hand_secondary":[[10.86,4.86,-6.76]]}},"clefable":{"animation.clefable.special@1.2":{"target":[[-0.24,18.11,-7.1]],"special":[[-0.27,19.75,-5.72]],"middle":[[-0.23,17.49,0.87]]},"animation.clefable.special@1.25":{"special":[[-0.28,19.82,-5.74]],"target":[[-0.26,18.17,-7.12]],"mouth":[[-0.28,19.82,-5.74]],"middle":[[-0.24,17.57,0.86]],"hand_primary":[[-12.87,20.49,-4.72]]},"animation.clefable.special@1.85":{"target":[[0.2,16.83,-7.33]],"middle":[[0.2,16.34,0.66]]},"animation.clefable.special@2.15":{"target":[[-0.2,17.31,-7.43]]},"animation.clefable.special@0.8":{"special":[[0.27,19.24,-5.57]],"target":[[0.24,17.61,-6.96]]},"animation.clefable.special@1.35":{"special":[[-0.23,19.52,-5.78]],"target":[[-0.21,17.87,-7.15]]},"animation.clefable.special@1.45":{"target":[[-0.08,17.57,-7.19]],"middle":[[-0.08,17,0.79]],"face":[[-0.1,21.72,-5.64]]},"animation.clefable.special@1.95":{"target":[[0.08,16.99,-7.36]]},"animation.clefable.special@1.55":{"middle":[[0.08,16.72,0.76]],"target":[[0.08,17.27,-7.22]]},"animation.clefable.special@2.4":{"middle":[[-0.14,16.68,0.48]]},"animation.clefable.special@1.3":{"special":[[-0.27,19.67,-5.76]],"target":[[-0.24,18.02,-7.14]]},"animation.clefable.special@2.25":{"target":[[-0.25,17.47,-7.46]]},"animation.clefable.special@1.5":{"target":[[0,17.42,-7.21]],"middle":[[0,16.86,0.78]]},"animation.clefable.special@1.75":{"target":[[0.25,16.66,-7.29]]},"animation.clefable.special@1.65":{"target":[[0.21,16.97,-7.26]]},"animation.clefable.special@2.2":{"target":[[-0.24,17.39,-7.45]]},"animation.clefable.special@1.6":{"target":[[0.15,17.12,-7.24]],"middle":[[0.14,16.58,0.74]]},"animation.clefable.special@2.7":{"middle":[[0.23,14.53,-1.35]]},"animation.clefable.special@0.5":{"middle":[[0,12.63,-3.38]]},"animation.clefable.special@1.8":{"middle":[[0.23,16.25,0.68]]},"animation.clefable.special@0.4":{"middle":[[-0.14,12.94,-2.72]]},"animation.clefable.special@0.7":{"special":[[0.27,17.94,-6.02]],"target":[[0.24,16.26,-7.37]]},"animation.clefable.special@2.5":{"target":[[0,16.76,-7.55]]},"animation.clefable.special@0.55":{"middle":[[0.07,13.24,-1.72]]},"animation.clefable.special@0.65":{"eye":[[2.51,19.24,-6.42],[-1.99,19.3,-6.42]]},"animation.clefable.special@1.7":{"target":[[0.24,16.82,-7.27]]},"animation.clefable.special@2":{"target":[[0,17.07,-7.38]]},"animation.clefable.special@1":{"middle":[[0,17.29,0.94]]},"animation.clefable.special@3.3":{"middle":[[-0.23,13.29,-2.06]]},"animation.clefable.special@1.1":{"special":[[-0.17,19.66,-5.68]],"target":[[-0.15,18.02,-7.07]]},"animation.clefable.special@0.15":{"hand_primary":[[-12.49,11.81,-7.1]],"target":[[-0.19,13.03,-9]]},"animation.clefable.special@0.3":{"hand_secondary":[[12.11,10.41,-6.95]],"target":[[-0.2,11.83,-9.92]]},"animation.clefable.special@3.9":{"target":[[0.15,17.82,-7]]},"animation.clefable.physical@1.25":{"target":[[0.87,13.41,-9.24]],"middle":[[-0.13,13.7,-1.31]]},"animation.clefable.physical@1.05":{"target":[[3.59,12.93,-11.18]]},"animation.clefable.physical@1.2":{"target":[[1.48,13.32,-9.8]]},"animation.clefable.physical@0.1":{"hand_primary":[[-9.27,13.16,-9.32]],"physical":[[-9.27,13.16,-9.32]]},"animation.clefable.physical@0":{"hand_primary":[[-12.22,13.1,-6.52]],"physical":[[-12.22,13.1,-6.52]]},"animation.clefable.physical@1.15":{"target":[[2.15,13.22,-10.31]]},"animation.clefable.physical@1.1":{"target":[[2.85,13.09,-10.77]]},"animation.clefable.physical@0.3":{"target":[[3.86,13.73,-6.24]]},"animation.clefable.physical@0.5":{"middle":[[0.62,13.31,-4.01]]},"animation.clefable.physical@0.8":{"target":[[1.2,12.63,-12.16]]},"animation.clefable.physical@0.6":{"target":[[-0.53,12.46,-12.26]]},"animation.clefable.physical@0.85":{"target":[[2.17,12.63,-12.14]]}},"zubat":{"animation.zubat.physical@1.25":{"target":[[3.43,4.79,-15.59]],"middle":[[2.22,10,-12.7]]},"animation.zubat.physical@1.05":{"target":[[-13.56,22.86,-5.87]]},"animation.zubat.physical@1.2":{"target":[[-5.56,15.74,-10.5]]},"animation.zubat.physical@1.45":{"target":[[7.98,5.51,-16.27]]},"animation.zubat.physical@1.65":{"target":[[10.68,5.65,-14.8]]},"animation.zubat.physical@0.1":{"middle":[[-2.61,14.35,-0.48]],"physical":[[-2.45,13.97,-1.61]]},"animation.zubat.physical@1.3":{"middle":[[3.79,9.61,-13.19]],"target":[[3.09,3.62,-14.01]]},"animation.zubat.physical@0":{"physical":[[-0.33,16.47,-2.85]],"middle":[[-0.3,16.86,-1.71]]},"animation.zubat.physical@1.15":{"target":[[-14.66,22.42,-6.62]]},"animation.zubat.physical@1.5":{"target":[[9.37,6.31,-16.46]]},"animation.zubat.physical@1.1":{"target":[[-14.11,22.25,-6.27]]},"animation.zubat.physical@1.35":{"target":[[4.69,3.57,-14.67]]},"animation.zubat.physical@0.3":{"target":[[-0.91,9.15,0.71]]},"animation.zubat.physical@0.5":{"middle":[[7.06,21.47,14.24]]},"animation.zubat.physical@0.8":{"target":[[-3.86,22.86,-0.99]]},"animation.zubat.physical@0.6":{"target":[[9.89,19.46,5.81]]},"animation.zubat.physical@0.85":{"target":[[-8.58,23.15,-3.43]]}},"golbat":{"animation.golbat.cry@1.25":{"target":[[0,11,-8]]},"animation.golbat.cry@2":{"target":[[0,11,-8]]}},"gloom":{"animation.gloom.recoil@0.3":{"hand_primary":[[-9.25,6.35,-1.02]]},"animation.gloom.recoil@0.45":{"hand_primary":[[-9.25,6.12,-1.46]]},"animation.gloom.recoil@0.75":{"hand_primary":[[-9.25,6.33,-1.05]]}},"vileplume":{"animation.vileplume.recoil@0.3":{"hand_primary":[[-10.5,8.4,-1.68]]},"animation.vileplume.recoil@0.45":{"hand_primary":[[-10.5,8.25,-1.76]]},"animation.vileplume.recoil@0.75":{"hand_primary":[[-10.5,8.41,-1.67]]}},"venomoth":{"animation.venomoth.cry@1.25":{"target":[[0,-2.75,-6.5]]},"animation.venomoth.cry@2":{"target":[[0,-2.75,-6.5]]}},"diglett":{"animation.diglett.physical@1.25":{"target":[[2.65,0.88,-21.99]],"middle":[[1.64,4.93,-18.41]]},"animation.diglett.physical@1.05":{"target":[[-7.5,4.2,-4.98]]},"animation.diglett.physical@1.2":{"target":[[-2.43,3.56,-16.23]]},"animation.diglett.physical@1.45":{"target":[[1.13,6.78,-21.64]]},"animation.diglett.physical@1.65":{"target":[[1.22,6.76,-21.5]]},"animation.diglett.physical@0.1":{"middle":[[1.86,6.71,0.11]],"physical":[[0.78,12.07,-0.49]]},"animation.diglett.physical@1.3":{"middle":[[2.29,5.85,-18.86]],"target":[[3.02,2.79,-23.38]]},"animation.diglett.physical@1.15":{"target":[[-6.61,3.81,-11.51]]},"animation.diglett.physical@1.5":{"target":[[1.1,6.93,-21.48]]},"animation.diglett.physical@1.1":{"target":[[-8.57,4.31,-7.51]]},"animation.diglett.physical@1.35":{"target":[[1.99,4.56,-22.73]]},"animation.diglett.physical@0.3":{"target":[[6.04,6.66,-3.45]]},"animation.diglett.physical@0.5":{"middle":[[6.66,4.39,4.65]]},"animation.diglett.physical@0.8":{"target":[[1.83,4.23,2.04]]},"animation.diglett.physical@0.6":{"target":[[5.72,4.52,0.64]]},"animation.diglett.physical@0.85":{"target":[[0.46,4.44,2.55]]}},"dugtrio":{"animation.dugtrio.physical@1.25":{"target":[[0,9,-25]],"middle":[[0,9,-16]]},"animation.dugtrio.physical@1.05":{"target":[[0.72,9.18,-14.41]]},"animation.dugtrio.physical@1.2":{"target":[[0.79,9.04,-21.4]]},"animation.dugtrio.physical@1.45":{"target":[[0,9,-25.28]]},"animation.dugtrio.physical@1.65":{"target":[[0,9,-25.56]]},"animation.dugtrio.physical@1.3":{"middle":[[0,9,-16.07]],"target":[[0,9,-25.07]]},"animation.dugtrio.physical@1.15":{"target":[[1.52,8.94,-17.94]]},"animation.dugtrio.physical@1.5":{"target":[[0,9,-25.35]]},"animation.dugtrio.physical@1.1":{"target":[[1.35,8.92,-15.68]]},"animation.dugtrio.physical@1.35":{"target":[[0,9,-25.14]]},"animation.dugtrio.physical@0.8":{"target":[[0.15,8.75,-10.33]]},"animation.dugtrio.physical@0.85":{"target":[[-0.3,9.16,-10.42]]}},"primeape":{"animation.primeape.recoil@0.55":{"target":[[0,11.5,-7]]},"animation.primeape.recoil@0.6":{"target":[[0,11.5,-7]]},"animation.primeape.recoil@0.65":{"target":[[0,11.5,-7]]},"animation.primeape.recoil@0.3":{"hand_primary":[[-16.24,13.87,-2.24]],"target":[[0,11.5,-7]]},"animation.primeape.recoil@0.45":{"hand_primary":[[-16.24,13.68,-2.39]],"target":[[0,11.5,-7]]},"animation.primeape.recoil@0.75":{"hand_primary":[[-16.48,13.49,-1.15]],"target":[[0,11.5,-7]]},"animation.primeape.cry@1.25":{"target":[[0,11.5,-7]]},"animation.primeape.cry@2":{"target":[[0,11.5,-7]]}},"arcanine":{"animation.arcanine.recoil@0.55":{"target":[[0,20,-23.75]]},"animation.arcanine.recoil@0.6":{"target":[[0,20,-23.75]]},"animation.arcanine.recoil@0.65":{"target":[[0,20,-23.75]]},"animation.arcanine.recoil@0.3":{"target":[[0,20,-23.75]]},"animation.arcanine.recoil@0.45":{"target":[[0,20,-23.75]]},"animation.arcanine.recoil@0.75":{"target":[[0,20,-23.75]]},"animation.arcanine.cry@1.25":{"target":[[0,20,-23.75]]},"animation.arcanine.cry@2":{"target":[[0,20,-23.75]]}},"poliwhirl":{"animation.poliwhirl.recoil@0.3":{"hand_primary":[[-15.65,16.47,-0.46]]},"animation.poliwhirl.recoil@0.45":{"hand_primary":[[-15.71,16.84,-0.16]]},"animation.poliwhirl.recoil@0.75":{"hand_primary":[[-16.81,14.7,0.22]]}},"poliwrath":{"animation.poliwrath.physical@1.25":{"target":[[6.93,14.75,-14.1]],"middle":[[3,15,-3.29]]},"animation.poliwrath.physical@1.05":{"target":[[-9.28,15.98,7.19]]},"animation.poliwrath.physical@1.2":{"target":[[-3.67,15.11,-4.01]]},"animation.poliwrath.physical@1.45":{"target":[[9.71,14.63,-15.85]]},"animation.poliwrath.physical@1.65":{"target":[[6.06,14.72,-18.83]]},"animation.poliwrath.physical@0.1":{"hand_primary":[[-17.46,10.22,1.6]],"physical":[[-17.46,10.22,1.6]]},"animation.poliwrath.physical@1.3":{"middle":[[3.24,14.97,-3.71]],"target":[[7.64,14.72,-14.33]]},"animation.poliwrath.physical@1.15":{"target":[[-8.14,15.34,2.58]]},"animation.poliwrath.physical@1.5":{"target":[[9.05,14.65,-16.62]]},"animation.poliwrath.physical@1.1":{"target":[[-9.64,15.6,6.86]]},"animation.poliwrath.physical@1.35":{"target":[[8.34,14.69,-14.99]]},"animation.poliwrath.physical@0.3":{"target":[[-7.27,17.31,-5]]},"animation.poliwrath.physical@0.5":{"middle":[[1,18.59,8]]},"animation.poliwrath.physical@0.8":{"target":[[-8.53,16.55,5.7]]},"animation.poliwrath.physical@0.6":{"target":[[-8.06,16.91,2.77]]},"animation.poliwrath.physical@0.85":{"target":[[-8.64,16.34,6]]},"animation.poliwrath.recoil@0.55":{"target":[[0,16.75,-11.5]]},"animation.poliwrath.recoil@0.6":{"target":[[0,16.75,-11.5]]},"animation.poliwrath.recoil@0.65":{"target":[[0,16.75,-11.5]]},"animation.poliwrath.recoil@0.3":{"hand_primary":[[-29.61,21.99,7.91]],"target":[[0,16.75,-11.5]]},"animation.poliwrath.recoil@0.45":{"hand_primary":[[-29.95,21.07,5.24]],"target":[[0,16.75,-11.5]]},"animation.poliwrath.recoil@0.75":{"hand_primary":[[-29.53,18.76,-0.79]],"target":[[0,16.75,-11.5]]},"animation.poliwrath.cry@1.25":{"target":[[0,16.75,-11.5]]},"animation.poliwrath.cry@2":{"target":[[0,16.75,-11.5]]}},"bellsprout":{"animation.bellsprout.cry@1.25":{"target":[[0,12.25,-3]]},"animation.bellsprout.cry@2":{"target":[[0,12.25,-3]]}},"weepinbell":{"animation.weepinbell.cry@1.25":{"target":[[0,10.02,-6]]},"animation.weepinbell.cry@2":{"target":[[0,10,-6]]}},"geodude":{"animation.geodude.status@1.15":{"special":[[-16.95,4.27,5.03]]},"animation.geodude.status@1.25":{"special":[[-17.73,4.44,2.19]]},"animation.geodude.recoil@0.3":{"hand_primary":[[-16.38,5.75,-3.85]]},"animation.geodude.recoil@0.45":{"hand_primary":[[-17.18,5.18,-2.62]]},"animation.geodude.recoil@0.75":{"hand_primary":[[-17.75,4.29,0]]}},"graveler":{"animation.graveler.physical@1.25":{"target":[[0,9.5,-18.1]],"middle":[[0,10,-6.85]]},"animation.graveler.physical@1.05":{"target":[[0,11.91,-17.78]]},"animation.graveler.physical@1.2":{"target":[[0,11.06,-17.74]]},"animation.graveler.physical@1.45":{"target":[[0,9.56,-18.1]]},"animation.graveler.physical@1.65":{"target":[[0,9.34,-17.76]]},"animation.graveler.physical@0.1":{"hand_primary":[[-13.45,8.83,-9.41],[14.41,10.02,-8.12]],"physical":[[-13.45,8.83,-9.41]]},"animation.graveler.physical@1.3":{"middle":[[0,10.12,-6.85]],"target":[[0,9.62,-18.1]]},"animation.graveler.physical@1.15":{"target":[[0,12.07,-17.54]]},"animation.graveler.physical@1.5":{"target":[[0,9.7,-18.1]]},"animation.graveler.physical@1.1":{"target":[[0,11.99,-17.66]]},"animation.graveler.physical@1.35":{"target":[[0,9.7,-18.1]]},"animation.graveler.physical@0.5":{"middle":[[0,10.2,-6.25]]},"animation.graveler.physical@0.8":{"target":[[0,10.97,-18.38]]},"animation.graveler.physical@0.6":{"target":[[0,10.04,-18.03]]},"animation.graveler.physical@0.85":{"target":[[0,11.28,-18.26]]},"animation.graveler.status@1.15":{"special":[[-18.9,8.25,-1.46]]},"animation.graveler.status@1.25":{"special":[[-18.51,7.77,-3]]},"animation.graveler.battle_recoil@0.3":{"hand_primary":[[-20.41,10.75,1.87],[20.41,10.75,1.87]]},"animation.graveler.battle_recoil@0.45":{"hand_primary":[[-20.92,11.14,0.69],[20.92,11.14,0.69]]},"animation.graveler.battle_recoil@0.75":{"hand_primary":[[-21.23,11.89,-0.03],[21.23,11.89,-0.03]]}},"golem":{"animation.golem.recoil@0.3":{"hand_primary":[[-24.02,17.39,-3.01]]},"animation.golem.recoil@0.45":{"hand_primary":[[-24.21,17.3,-3.34]]},"animation.golem.recoil@0.75":{"hand_primary":[[-24.47,17.25,-3.56]]}},"slowbro":{"animation.slowbro.cry@1.25":{"target":[[0,13.25,-10.5]]},"animation.slowbro.cry@2":{"target":[[0,13.25,-10.5]]}},"doduo":{"animation.doduo.cry@1.25":{"target":[[0,15,-6.75]]},"animation.doduo.cry@2":{"target":[[0,15,-6.75]]}},"dodrio":{"animation.dodrio.cry@1.25":{"target":[[0,16.5,-7]]},"animation.dodrio.cry@2":{"target":[[0,16.5,-7]]}},"seel":{"animation.seel.cry@1.25":{"target":[[0,3,-17.25]]},"animation.seel.cry@2":{"target":[[0,3,-17.25]]}},"onix":{"animation.onix.cry@1.25":{"target":[[0,-13.02,-13]]},"animation.onix.cry@2":{"target":[[0,-13,-13]]}},"drowzee":{"animation.drowzee.recoil@0.55":{"target":[[0,12,-9.5]]},"animation.drowzee.recoil@0.6":{"target":[[0,12,-9.5]]},"animation.drowzee.recoil@0.65":{"target":[[0,12,-9.5]]},"animation.drowzee.recoil@0.3":{"hand_primary":[[-11.5,14.18,2.4]],"target":[[0,12,-9.5]]},"animation.drowzee.recoil@0.45":{"hand_primary":[[-11.5,14.54,0.81]],"target":[[0,12,-9.5]]},"animation.drowzee.recoil@0.75":{"hand_primary":[[-11.5,14.5,1]],"target":[[0,12,-9.5]]},"animation.drowzee.battle_cry@1.25":{"target":[[0,12,-9.5]]},"animation.drowzee.battle_cry@2":{"target":[[0,12,-9.5]]}},"hypno":{"animation.hypno.battle_recoil@0.55":{"target":[[0,17,-6.5]]},"animation.hypno.battle_recoil@0.6":{"target":[[0,17,-6.5]]},"animation.hypno.battle_recoil@0.65":{"target":[[0,17,-6.5]]},"animation.hypno.battle_recoil@0.3":{"hand_primary":[[-19.98,19.84,7.49]],"target":[[0,17,-5.77]]},"animation.hypno.battle_recoil@0.45":{"hand_primary":[[-20.66,21.51,0.26]],"target":[[0,17,-6.46]]},"animation.hypno.battle_recoil@0.75":{"hand_primary":[[-20.53,21.5,0.2]],"target":[[0,17,-6.5]]},"animation.hypno.cry@1.25":{"target":[[0,17,-6.5]]},"animation.hypno.cry@2":{"target":[[0,17,-6.5]]}},"hitmonlee":{"animation.hitmonlee.cry@1.25":{"target":[[0,18,-5.5]]},"animation.hitmonlee.cry@2":{"target":[[0,18,-5.5]]}},"hitmonchan":{"animation.hitmonchan.cry@1.25":{"target":[[0,20.04,-6.07]]},"animation.hitmonchan.cry@2":{"target":[[0,20,-6]]}},"koffing":{"animation.koffing.special@1.2":{"target":[[0,5.56,-9.2]],"middle":[[0,7.8,1.84]]},"animation.koffing.special@1.25":{"target":[[0,5.52,-13.16]],"middle":[[0,7,-2]]},"animation.koffing.special@1.85":{"target":[[0.24,6.95,-14.98]],"middle":[[0,8.42,-3.82]]},"animation.koffing.special@2.15":{"target":[[0,6.57,-13.14]]},"animation.koffing.special@0.8":{"target":[[-0.46,18.57,4.63]]},"animation.koffing.special@1.35":{"target":[[0.67,6.18,-14.46]]},"animation.koffing.special@1.45":{"target":[[0.47,6.88,-15.8]],"middle":[[0,8.3,-4.64]],"face":[[0.08,11.46,-11.93]]},"animation.koffing.special@1.95":{"target":[[0.12,6.8,-14.32]]},"animation.koffing.special@1.55":{"middle":[[0,8.89,-5.8]],"target":[[-0.4,7.45,-16.96]]},"animation.koffing.special@2.4":{"middle":[[0,7.64,-1.59]]},"animation.koffing.special@1.3":{"target":[[0.22,5.86,-13.82]]},"animation.koffing.special@2.25":{"target":[[0,6.76,-13.02]]},"animation.koffing.special@1.5":{"target":[[0,7.17,-16.47]],"middle":[[0,8.63,-5.3]]},"animation.koffing.special@1.75":{"target":[[0,7.11,-15.64]]},"animation.koffing.special@1.65":{"target":[[-0.41,7.26,-16.29]]},"animation.koffing.special@2.2":{"target":[[0,6.66,-13.08]]},"animation.koffing.special@1.6":{"target":[[-0.53,7.37,-16.62]],"middle":[[0,8.81,-5.47]]},"animation.koffing.special@2.7":{"middle":[[0,8.32,-0.94]]},"animation.koffing.special@0.5":{"middle":[[0,11.39,7.27]]},"animation.koffing.special@1.8":{"middle":[[0,8.5,-4.15]]},"animation.koffing.special@0.4":{"middle":[[0,9.66,3.41]]},"animation.koffing.special@0.7":{"target":[[-0.24,17.69,4.08]]},"animation.koffing.special@2.5":{"target":[[0,7.23,-12.69]]},"animation.koffing.special@0.55":{"middle":[[0,12.26,9.2]]},"animation.koffing.special@0.65":{"eye":[[2.79,20.56,6.13],[-2.71,20.67,6.2]]},"animation.koffing.special@1.7":{"target":[[-0.19,7.19,-15.97]]},"animation.koffing.special@2":{"target":[[0,6.72,-13.99]]},"animation.koffing.special@1":{"middle":[[0,12.33,13.04]]},"animation.koffing.special@3.3":{"middle":[[0,9.52,1.96]]},"animation.koffing.special@1.1":{"target":[[0,5.67,-1.11]]},"animation.koffing.special@0.15":{"target":[[0.32,9.21,-10.24]]},"animation.koffing.special@0.3":{"target":[[0.75,8.62,-9.24]]},"animation.koffing.special@3.9":{"target":[[-0.34,14.7,4.05]]},"animation.koffing.physical@1.25":{"target":[[-2.9,6.71,-22.27]],"middle":[[1.7,7,-12]]},"animation.koffing.physical@1.05":{"target":[[-9.57,15.29,12.78]]},"animation.koffing.physical@1.2":{"target":[[6.34,5.03,-17.69]]},"animation.koffing.physical@1.45":{"target":[[-10.02,5.13,-14.41]]},"animation.koffing.physical@1.65":{"target":[[-8.68,7.1,-17.74]]},"animation.koffing.physical@0.1":{"middle":[[0,10.31,1.19]]},"animation.koffing.physical@1.3":{"middle":[[0.36,7.35,-13.1]],"target":[[-8.19,6.23,-20.34]]},"animation.koffing.physical@1.15":{"target":[[-10.79,11.64,1.07]]},"animation.koffing.physical@1.5":{"target":[[-10.55,5.86,-16.24]]},"animation.koffing.physical@1.1":{"target":[[5.75,8.16,21.63]]},"animation.koffing.physical@1.35":{"target":[[-10.2,4.83,-15.62]]},"animation.koffing.physical@0.3":{"target":[[-0.38,11.18,-7.57]]},"animation.koffing.physical@0.5":{"middle":[[0,11.39,10.66]]},"animation.koffing.physical@0.8":{"target":[[-7.82,19.3,27.87]]},"animation.koffing.physical@0.6":{"target":[[-7.8,15.47,7.85]]},"animation.koffing.physical@0.85":{"target":[[-4.48,19.24,30.42]]},"animation.koffing.status@1.15":{"target":[[0.04,17.68,-9.64]]},"animation.koffing.status@1.85":{"target":[[-0.02,5.12,-11.98]]},"animation.koffing.status@1.25":{"middle":[[0,13.45,0.75]],"target":[[-0.03,16.54,-10.08]]},"animation.koffing.status@1.3":{"middle":[[-0.05,12.83,0.59]]},"animation.koffing.status@1.2":{"target":[[-0.01,17.32,-9.79]]},"animation.koffing.status@0.5":{"middle":[[0,12.11,0.43]],"target":[[-0.36,12.22,-10.83]]},"animation.koffing.status@2.15":{"target":[[0,6.84,-11.71]]},"animation.koffing.status@1.35":{"eye":[[2.67,16.25,-6.88],[-2.83,16.23,-6.87]],"target":[[-0.07,11.07,-10.92]]},"animation.koffing.status@1.65":{"target":[[0.07,4.85,-11.74]]},"animation.koffing.status@2.4":{"middle":[[0,8.97,-0.19]]},"animation.koffing.status@2":{"target":[[0,5.98,-11.85]]},"animation.koffing.status@2.05":{"target":[[0,6.27,-11.81]]},"animation.koffing.status@2.2":{"target":[[0,7.13,-11.66]]},"animation.koffing.status@1":{"middle":[[0,13.53,0.86]]},"animation.koffing.recoil@0.55":{"target":[[0,7.97,-7]]},"animation.koffing.recoil@0.6":{"target":[[0,7.74,-7.21]]},"animation.koffing.recoil@0.65":{"target":[[0,7.51,-7.41]]},"animation.koffing.recoil@0.3":{"target":[[0,12.09,-6.01]]},"animation.koffing.recoil@0.45":{"target":[[0,9.8,-6.57]]},"animation.koffing.recoil@0.75":{"target":[[0,7.06,-7.79]]},"animation.koffing.battle_cry@1.25":{"target":[[-0.03,16.54,-10.08]]},"animation.koffing.battle_cry@2":{"target":[[0,5.98,-11.85]]}},"weezing":{"animation.weezing.special@1.45":{"face":[[-3.65,14.94,-15.8]]},"animation.weezing.special@0.65":{"eye":[[-0.78,19.87,1.34],[-7.4,19.72,1.03],[11.33,18.36,9.57],[7.48,19.44,6.63]]},"animation.weezing.physical@1.25":{"target":[[2.46,9.93,-10.67]],"middle":[[1.07,11.76,0.45]]},"animation.weezing.physical@1.05":{"target":[[2.5,10.05,-10.68]]},"animation.weezing.physical@1.2":{"target":[[2.47,9.96,-10.67]]},"animation.weezing.physical@1.45":{"target":[[2.44,9.76,-10.66]]},"animation.weezing.physical@1.65":{"target":[[2.37,9.57,-10.68]]},"animation.weezing.physical@1.3":{"target":[[1.39,9.15,-10.67]]},"animation.weezing.physical@1.15":{"target":[[2.48,9.99,-10.68]]},"animation.weezing.physical@1.5":{"target":[[2.43,9.71,-10.67]]},"animation.weezing.physical@1.1":{"target":[[2.49,10.02,-10.68]]},"animation.weezing.physical@1.35":{"target":[[1.61,9.27,-10.66]]},"animation.weezing.physical@0.3":{"target":[[2.4,9.74,-10.57]]},"animation.weezing.physical@0.5":{"middle":[[1.24,11.86,0.5]]},"animation.weezing.physical@0.8":{"target":[[2.55,10.2,-10.71]]},"animation.weezing.physical@0.6":{"target":[[2.56,10.25,-10.69]]},"animation.weezing.physical@0.85":{"target":[[2.54,10.17,-10.7]]},"animation.weezing.status@1.15":{"target":[[2.45,15.72,-9.63]]},"animation.weezing.status@1.25":{"target":[[2.54,13.01,-10.41]]},"animation.weezing.status@1.3":{"middle":[[0.92,10.36,0.41]]},"animation.weezing.status@1.2":{"target":[[2.43,14.82,-9.97]]},"animation.weezing.status@0.5":{"target":[[2.22,10.82,-10.29]]},"animation.weezing.status@2.15":{"target":[[2.21,7.29,-10.78]]},"animation.weezing.status@0.2":{"target":[[2.32,10.31,-10.57]]},"animation.weezing.status@1.35":{"eye":[[0.84,13.45,-8.35],[-6.86,12.76,-8.56],[13.36,13.9,0.45],[9.5,14.39,-2.59]],"target":[[3,9.01,-11.01]]},"animation.weezing.status@1.65":{"target":[[0.03,6.81,-10.89]]},"animation.weezing.status@2.4":{"middle":[[-0.01,9.48,0.12]]},"animation.weezing.status@2":{"target":[[3.31,7.88,-10.67]]},"animation.weezing.status@2.05":{"target":[[2.95,7.68,-10.71]]},"animation.weezing.status@2.2":{"target":[[1.85,7.1,-10.81]]},"animation.weezing.status@1":{"middle":[[0,13.76,1.46]]},"animation.weezing.recoil@0.55":{"target":[[1.5,10.47,-7]]},"animation.weezing.recoil@0.6":{"target":[[1.5,10.24,-7.21]]},"animation.weezing.recoil@0.65":{"target":[[1.5,10.01,-7.41]]},"animation.weezing.recoil@0.3":{"target":[[1.5,14.59,-6.01]]},"animation.weezing.recoil@0.45":{"target":[[1.5,12.3,-6.57]]},"animation.weezing.recoil@0.75":{"target":[[1.5,9.56,-7.79]]},"animation.weezing.cry@1.25":{"target":[[1.5,11,-11.25]]},"animation.weezing.cry@2":{"target":[[1.5,11,-11.25]]}},"rhyhorn":{"animation.rhyhorn.special@1.2":{"special":[[-0.06,16.85,-27.05]]},"animation.rhyhorn.special@1.25":{"special":[[-0.93,16.52,-26.79]],"mouth":[[0.17,6.1,-17.55]]},"animation.rhyhorn.special@0.8":{"special":[[-0.06,18.21,-26.13]]},"animation.rhyhorn.special@1.35":{"special":[[0.39,20.94,-23.19]]},"animation.rhyhorn.special@1.45":{"face":[[0.23,15.69,-25.85]]},"animation.rhyhorn.special@1.3":{"special":[[-0.28,19.28,-24.89]]},"animation.rhyhorn.special@0.7":{"special":[[-0.04,14.17,-27.69]]},"animation.rhyhorn.special@1.1":{"special":[[0.12,18.6,-25.93]]},"animation.rhyhorn.physical@1.25":{"target":[[0,6.75,-42.42]],"middle":[[0,12,-11.42]]},"animation.rhyhorn.physical@1.05":{"target":[[0,6.75,-19.36]]},"animation.rhyhorn.physical@1.2":{"target":[[0,6.75,-36]]},"animation.rhyhorn.physical@1.45":{"target":[[0,6.75,-47.1]]},"animation.rhyhorn.physical@1.65":{"target":[[0,6.75,-47.1]]},"animation.rhyhorn.physical@0.1":{"middle":[[0,12.6,1.57]],"physical":[[-0.02,13.06,-26.5]]},"animation.rhyhorn.physical@1.3":{"middle":[[0,12,-12.82]],"target":[[0,6.75,-43.82]]},"animation.rhyhorn.physical@1.15":{"target":[[0,6.75,-29.57]]},"animation.rhyhorn.physical@1.5":{"target":[[0,6.75,-47.1]]},"animation.rhyhorn.physical@1.1":{"target":[[0,6.75,-23.15]]},"animation.rhyhorn.physical@1.35":{"target":[[0,6.75,-45.23]]},"animation.rhyhorn.physical@0.3":{"target":[[0,11.5,-15.09]]},"animation.rhyhorn.physical@0.5":{"middle":[[0,12.27,20.75]]},"animation.rhyhorn.physical@0.8":{"target":[[0,6.75,-8.7]]},"animation.rhyhorn.physical@0.6":{"target":[[0,6.75,-9.56]]},"animation.rhyhorn.physical@0.85":{"target":[[0,6.75,-9.52]]},"animation.rhyhorn.status@1.15":{"mouth":[[0.08,5.16,-15.76]],"special":[[0.48,11.76,-28.06]],"jaw_lower":[[0.04,4.59,-20.82]]},"animation.rhyhorn.status@1.25":{"special":[[0.63,14.09,-27.56]]},"animation.rhyhorn.status@1.35":{"eye":[[5.3,10.79,-21.98],[-4.7,10.41,-22.09]]}},"rhydon":{"animation.rhydon.special@1.2":{"special":[[-0.23,33.31,-29.25]]},"animation.rhydon.special@1.25":{"special":[[0.63,37.15,-27.92]],"mouth":[[0.41,25.35,-14.35]],"hand_primary":[[-17.37,17.14,-9.58]]},"animation.rhydon.special@0.8":{"special":[[1.47,40.28,-23.35]]},"animation.rhydon.special@1.35":{"special":[[1.41,38.19,-27.17]]},"animation.rhydon.special@1.45":{"face":[[0.96,28.78,-22.04]]},"animation.rhydon.special@1.3":{"special":[[1.09,38.59,-27.12]]},"animation.rhydon.special@0.7":{"special":[[1.91,40.37,-22.92]]},"animation.rhydon.special@1.1":{"special":[[-0.42,32.79,-28.4]]},"animation.rhydon.special@0.15":{"hand_primary":[[-15.05,16.61,-17.3]]},"animation.rhydon.special@0.3":{"hand_secondary":[[20.23,16.12,-11.63]]},"animation.rhydon.status@1.15":{"mouth":[[4.89,26.07,-11.02]],"special":[[8.3,33.69,-26.96]]},"animation.rhydon.status@1.25":{"special":[[-0.68,43.85,-17.1]]},"animation.rhydon.recoil@0.55":{"target":[[0,17,-16]]},"animation.rhydon.recoil@0.6":{"target":[[0,17,-16]]},"animation.rhydon.recoil@0.65":{"target":[[0,17,-16]]},"animation.rhydon.recoil@0.3":{"hand_primary":[[-21.72,20.27,-8.69]],"target":[[0,17,-16]]},"animation.rhydon.recoil@0.45":{"hand_primary":[[-22.14,20.09,-8.03]],"target":[[0,17,-16]]},"animation.rhydon.recoil@0.75":{"hand_primary":[[-23.21,20.62,-5.82]],"target":[[0,17,-16]]},"animation.rhydon.cry@1.25":{"target":[[0,17,-16]]},"animation.rhydon.cry@2":{"target":[[0,17,-16]]}},"chansey":{"animation.chansey.special@1.2":{"special":[[-1.29,17.31,-8.77]]},"animation.chansey.special@1.25":{"special":[[-0.17,16.05,-9.78]],"mouth":[[-0.17,16.05,-9.78]],"hand_primary":[[-4.88,10.8,-12.69]]},"animation.chansey.special@0.8":{"special":[[-2.26,17.36,-7.65]]},"animation.chansey.special@1.35":{"special":[[-0.15,16,-9.81]]},"animation.chansey.special@1.45":{"face":[[-0.15,18.54,-10.01]]},"animation.chansey.special@1.3":{"special":[[-0.16,15.94,-9.83]]},"animation.chansey.special@0.7":{"special":[[-1.73,16.71,-8.13]]},"animation.chansey.special@0.65":{"eye":[[0.7,18.54,-8.68],[-3.77,17.98,-8.66]]},"animation.chansey.special@1.1":{"special":[[-2.88,18.14,-7.11]]},"animation.chansey.special@0.3":{"hand_secondary":[[3.44,9.06,-11.2]]},"animation.chansey.status@1.15":{"mouth":[[1.39,16.03,-11.79]],"special":[[1.39,16.03,-11.79]]},"animation.chansey.status@1.25":{"special":[[1.72,16.31,-11.73]]},"animation.chansey.status@1.35":{"eye":[[4.21,18.11,-11.67],[-0.27,18.57,-11.85]]},"animation.chansey.recoil@0.3":{"hand_primary":[[-5,12.89,-10.34]]},"animation.chansey.recoil@0.45":{"hand_primary":[[-5,12.52,-10.97]]},"animation.chansey.recoil@0.75":{"hand_primary":[[-5,12.5,-11]]}},"kangaskhan":{"animation.kangaskhan.recoil@0.3":{"hand_primary":[[-36,37.03,1.06]]},"animation.kangaskhan.recoil@0.45":{"hand_primary":[[-36,37.03,0.03]]},"animation.kangaskhan.recoil@0.75":{"hand_primary":[[-36,37.03,-0.22]]}},"seaking":{"animation.seaking.water_battle_recoil@0.3":{"hand_primary":[[-12.55,5.8,-7.07]]},"animation.seaking.water_battle_recoil@0.45":{"hand_primary":[[-12.69,5.75,-6.43]]},"animation.seaking.water_battle_recoil@0.75":{"hand_primary":[[-15.31,4.73,-2.8]]}},"starmie":{"animation.starmie.special@1.2":{"special":[[-0.01,24.42,-8.4]]},"animation.starmie.special@1.25":{"special":[[-0.03,24.28,-8.4]]},"animation.starmie.special@0.8":{"special":[[0.01,23.5,-8.4]]},"animation.starmie.special@1.35":{"special":[[-0.03,24.29,-8.4]]},"animation.starmie.special@1.3":{"special":[[-0.04,24.89,-8.4]]},"animation.starmie.special@0.7":{"special":[[0,18.79,-8.4]]},"animation.starmie.special@0.65":{"eye":[[0,14.86,-8.4]]},"animation.starmie.special@1.1":{"special":[[0.01,24.2,-8.4]]}},"scyther":{"animation.scyther.cry@1.25":{"target":[[0,25,-4.5]]},"animation.scyther.cry@2":{"target":[[0,25,-4.5]]}},"electabuzz":{"animation.electabuzz.cry@1.25":{"target":[[0,16,-7]]},"animation.electabuzz.cry@2":{"target":[[0,16,-7]]}},"gyarados":{"animation.gyarados.recoil@0.55":{"target":[[0,0,-7]]},"animation.gyarados.recoil@0.6":{"target":[[0,0,-7]]},"animation.gyarados.recoil@0.65":{"target":[[0,0,-7]]},"animation.gyarados.recoil@0.3":{"target":[[0,0,-7]]},"animation.gyarados.recoil@0.45":{"target":[[0,0,-7]]},"animation.gyarados.recoil@0.75":{"target":[[0,0,-7]]},"animation.gyarados.battle_cry@1.25":{"target":[[0,0,-7]]},"animation.gyarados.battle_cry@2":{"target":[[0,0,-7]]}},"lapras":{"animation.lapras.special@1.2":{"special":[[-0.3,25.47,-37.07]]},"animation.lapras.special@1.25":{"special":[[-0.48,21.15,-42.8]],"mouth":[[-0.48,21.15,-42.8]]},"animation.lapras.special@0.8":{"special":[[1.83,39.48,-12.07]],"target":[[0,21.33,-22.49]]},"animation.lapras.special@1.35":{"special":[[-0.48,20.74,-42.23]]},"animation.lapras.special@1.45":{"face":[[-0.46,27.8,-48.59]]},"animation.lapras.special@1.3":{"special":[[-0.48,20.74,-42.03]]},"animation.lapras.special@0.5":{"middle":[[0,14.59,1.17]]},"animation.lapras.special@0.7":{"special":[[1.98,39.31,-11.05]],"target":[[0,21.47,-22.39]]},"animation.lapras.special@0.55":{"middle":[[0,14.75,1.35]]},"animation.lapras.special@0.65":{"eye":[[-3.64,43.49,-8.95],[7.34,44.05,-9.24]]},"animation.lapras.special@1":{"middle":[[0,15.24,1.64]]},"animation.lapras.special@1.1":{"special":[[0.63,34.07,-26.41]],"target":[[0,19.27,-23.48]]},"animation.lapras.special@3.9":{"target":[[0,21.07,-22.66]]},"animation.lapras.status@1.15":{"mouth":[[-1.82,40.45,-20.16]],"special":[[-1.82,40.45,-20.16]],"jaw_lower":[[-2.54,41.23,-24.11]]},"animation.lapras.status@1.25":{"special":[[-0.65,42.87,-16.76]]},"animation.lapras.status@1.35":{"eye":[[-6.17,45.4,-11.69],[4.83,45.61,-11.7]]},"animation.lapras.recoil@0.55":{"target":[[0,16,-25]]},"animation.lapras.recoil@0.6":{"target":[[0,16,-25]]},"animation.lapras.recoil@0.65":{"target":[[0,16,-25]]},"animation.lapras.recoil@0.3":{"target":[[0,16,-25]]},"animation.lapras.recoil@0.45":{"target":[[0,16,-25]]},"animation.lapras.recoil@0.75":{"target":[[0,16,-25]]}},"porygon":{"animation.porygon.special@1.2":{"target":[[0,14.45,-17.76]],"special":[[0,13.04,-22.96]],"middle":[[0,14.81,-10.74]]},"animation.porygon.special@1.25":{"special":[[0,15.83,-31.57]],"target":[[0,7.84,-20.57]],"middle":[[0,13.6,-16.55]]},"animation.porygon.special@1.85":{"target":[[0,5.48,-18.88]],"middle":[[0,11.78,-15.77]]},"animation.porygon.special@2.15":{"target":[[0,9.18,-17.94]]},"animation.porygon.special@0.8":{"special":[[0,9.7,-4.66]],"target":[[0,11.01,-0.8]]},"animation.porygon.special@1.35":{"special":[[0,14.9,-31.97]],"target":[[0,7.52,-20.78]]},"animation.porygon.special@1.45":{"target":[[0,7.09,-19.15]],"middle":[[0,12.98,-15.31]],"face":[[0,15.51,-30.61]]},"animation.porygon.special@1.95":{"target":[[0,5.37,-14.85]]},"animation.porygon.special@1.55":{"middle":[[0,11.79,-15.1]],"target":[[0,5.69,-18.59]]},"animation.porygon.special@2.4":{"middle":[[0,16.08,-8.38]]},"animation.porygon.special@1.3":{"special":[[0,15.24,-31.57]],"target":[[0,7.66,-20.27]]},"animation.porygon.special@2.25":{"target":[[0,8.74,-17.55]]},"animation.porygon.special@1.5":{"target":[[0,6.93,-16.68]],"middle":[[0,12.93,-13.03]]},"animation.porygon.special@1.75":{"target":[[0,6.5,-18.02]]},"animation.porygon.special@1.65":{"target":[[0,6.08,-18.56]]},"animation.porygon.special@2.2":{"target":[[0,8.96,-17.77]]},"animation.porygon.special@1.6":{"target":[[0,7.38,-18.78]],"middle":[[0,13.51,-15.34]]},"animation.porygon.special@0":{"special":[[0,16.17,-11.26]],"target":[[0,11.39,-6.97]]},"animation.porygon.special@2.7":{"middle":[[0,11.75,-0.3]]},"animation.porygon.special@0.5":{"middle":[[0,10.75,-1.41]]},"animation.porygon.special@1.8":{"middle":[[0,12.13,-15.94]]},"animation.porygon.special@0.4":{"middle":[[0,13.33,-3.63]]},"animation.porygon.special@0.7":{"special":[[0,8.23,-7]],"target":[[0,7.51,-0.67]]},"animation.porygon.special@2.5":{"target":[[0,18.82,-12.23]]},"animation.porygon.special@0.65":{"eye":[[3.4,15,-4.25],[-3.4,15,-4.25]]},"animation.porygon.special@1.7":{"target":[[0,5.99,-18.4]]},"animation.porygon.special@2":{"target":[[0,5.33,-13.5]]},"animation.porygon.special@1":{"middle":[[0,16.91,4.16]]},"animation.porygon.special@3.3":{"middle":[[0,10.13,-1.41]]},"animation.porygon.special@1.1":{"special":[[0,18.4,-9.49]],"target":[[0,20.32,-5.06]]},"animation.porygon.special@0.15":{"target":[[0,7.64,-6.8]]},"animation.porygon.special@0.3":{"target":[[0,6.37,-7.35]]},"animation.porygon.special@3.9":{"target":[[0,15.2,-2.11]]},"animation.porygon.physical@1.25":{"target":[[0,1.17,-21.52]],"middle":[[0,7.87,-19.41]]},"animation.porygon.physical@1.05":{"target":[[0,36.89,23.74]]},"animation.porygon.physical@1.2":{"target":[[0,22.87,2.17]]},"animation.porygon.physical@1.45":{"target":[[0,1.58,-21.65]]},"animation.porygon.physical@1.65":{"target":[[0,1.17,-21.52]]},"animation.porygon.physical@0.1":{"middle":[[0,12.31,0.05]],"physical":[[0,18.02,-11.14]]},"animation.porygon.physical@1.3":{"middle":[[0,7.87,-19.41]],"target":[[0,1.17,-21.52]]},"animation.porygon.physical@0":{"physical":[[0,16.17,-11.26]]},"animation.porygon.physical@1.15":{"target":[[0,36.54,22.87]]},"animation.porygon.physical@1.5":{"target":[[0,1.17,-21.52]]},"animation.porygon.physical@1.1":{"target":[[0,37.52,24.1]]},"animation.porygon.physical@1.35":{"target":[[0,0.03,-21.08]]},"animation.porygon.physical@0.3":{"target":[[0,16.11,-6.78]]},"animation.porygon.physical@0.5":{"middle":[[0,21.43,4.76]]},"animation.porygon.physical@0.8":{"target":[[0,29.62,17.83]]},"animation.porygon.physical@0.6":{"target":[[0,21.59,5.2]]},"animation.porygon.physical@0.85":{"target":[[0,32.69,20.74]]},"animation.porygon.status@0.1":{"middle":[[0.48,10.01,3.9]]},"animation.porygon.status@1.15":{"special":[[-0.71,25.61,0.21]],"target":[[1.02,25.24,4.42]]},"animation.porygon.status@1.85":{"target":[[-0.09,10.46,0.77]]},"animation.porygon.status@1.25":{"middle":[[-0.64,20.82,9.19]],"special":[[-1.83,31.48,-0.6]],"target":[[-1.8,23.26,2.7]]},"animation.porygon.status@1.3":{"middle":[[-1.2,20.46,9]]},"animation.porygon.status@1.2":{"target":[[-0.99,23.96,3.11]]},"animation.porygon.status@0.5":{"middle":[[-10.24,18.47,9.14]],"target":[[-4.27,15.8,6.57]]},"animation.porygon.status@2.15":{"target":[[-0.02,32.77,-4.66]]},"animation.porygon.status@0.2":{"target":[[0.96,7.48,0.82]]},"animation.porygon.status@1.35":{"eye":[[2.25,28.01,4.51],[-4.64,28.42,5.68]],"target":[[-2.35,20.41,1.01]]},"animation.porygon.status@1.65":{"target":[[-0.07,8.36,1.52]]},"animation.porygon.status@2.4":{"middle":[[0,13.82,-0.56]]},"animation.porygon.status@2":{"target":[[-0.08,32.77,-4.2]]},"animation.porygon.status@2.05":{"target":[[-0.06,32.77,-4.35]]},"animation.porygon.status@2.2":{"target":[[0,32.77,-4.82]]},"animation.porygon.status@1":{"middle":[[10.49,27.27,13.1]]},"animation.porygon.recoil@0.55":{"target":[[0,6.7,-3.21]]},"animation.porygon.recoil@0.6":{"target":[[0,6.68,-3.06]]},"animation.porygon.recoil@0.65":{"target":[[0,6.67,-3.39]]},"animation.porygon.recoil@0.3":{"target":[[0,7.35,0.07]]},"animation.porygon.recoil@0.45":{"target":[[0,6.59,-3.49]]},"animation.porygon.recoil@0.75":{"target":[[0,6.76,-4.98]]},"animation.porygon.battle_cry@1.25":{"target":[[-1.8,23.26,2.7]]},"animation.porygon.battle_cry@2":{"target":[[-0.08,32.77,-4.2]]}},"omastar":{"animation.omastar.cry@1.25":{"target":[[0,6,-4]]},"animation.omastar.cry@2":{"target":[[0,6,-4]]}},"kabutops":{"animation.kabutops.cry@1.25":{"target":[[0,17.53,-5.53]]},"animation.kabutops.cry@2":{"target":[[0,17.53,-5.53]]}},"aerodactyl":{"animation.aerodactyl.recoil@0.55":{"target":[[0,17,-43]]},"animation.aerodactyl.recoil@0.6":{"target":[[0,17,-43]]},"animation.aerodactyl.recoil@0.65":{"target":[[0,17,-43]]},"animation.aerodactyl.recoil@0.3":{"hand_primary":[[-55.5,19.9,-14],[-55.5,19.9,-14]],"target":[[0,17,-43]]},"animation.aerodactyl.recoil@0.45":{"hand_primary":[[-55.5,19.9,-14],[-55.5,19.9,-14]],"target":[[0,17,-43]]},"animation.aerodactyl.recoil@0.75":{"hand_primary":[[-55.5,19.9,-14],[-55.5,19.9,-14]],"target":[[0,17,-43]]},"animation.aerodactyl.battle_cry@1.25":{"target":[[0,17,-43]]},"animation.aerodactyl.battle_cry@2":{"target":[[0,17,-43]]}},"snorlax":{"animation.snorlax.recoil@0.3":{"hand_primary":[[-33.98,31,-0.67]]},"animation.snorlax.recoil@0.45":{"hand_primary":[[-33.99,31,-0.7]]},"animation.snorlax.recoil@0.75":{"hand_primary":[[-34,30.99,-0.76]]}},"dratini":{"animation.dratini.cry@1.25":{"target":[[0,10,-9]]},"animation.dratini.cry@2":{"target":[[0,10,-9]]}},"dragonair":{"animation.dragonair.cry@1.25":{"target":[[0,14,-7.25]]},"animation.dragonair.cry@2":{"target":[[0,14,-7.25]]}},"cyndaquil":{"animation.cyndaquil.battle_cry@1.25":{"target":[[0,7,-9]]},"animation.cyndaquil.battle_cry@2":{"target":[[0,7,-9]]}},"quilava":{"animation.quilava.battle_cry@1.25":{"target":[[0,8,-21]]},"animation.quilava.battle_cry@2":{"target":[[0,8,-21]]}},"typhlosion":{"animation.typhlosion.battle_cry@1.25":{"target":[[0,23.75,-14]]},"animation.typhlosion.battle_cry@2":{"target":[[0,23.75,-14]]}},"ledyba":{"animation.ledyba.cry@1.25":{"target":[[0,7,-14]]},"animation.ledyba.cry@2":{"target":[[0,7,-14]]}},"ledian":{"animation.ledian.cry@1.25":{"target":[[0,11,-4]]},"animation.ledian.cry@2":{"target":[[0,11,-4]]}},"spinarak":{"animation.spinarak.recoil@0.55":{"target":[[0,5,-11]]},"animation.spinarak.recoil@0.6":{"target":[[0,5,-11]]},"animation.spinarak.recoil@0.65":{"target":[[0,5,-11]]},"animation.spinarak.recoil@0.3":{"target":[[0,5,-11]]},"animation.spinarak.recoil@0.45":{"target":[[0,5,-11]]},"animation.spinarak.recoil@0.75":{"target":[[0,5,-11]]},"animation.spinarak.cry@1.25":{"target":[[0,5,-11]]},"animation.spinarak.cry@2":{"target":[[0,5,-11]]}},"ariados":{"animation.ariados.recoil@0.55":{"target":[[0,8,-13.45]]},"animation.ariados.recoil@0.6":{"target":[[0,8,-13.49]]},"animation.ariados.recoil@0.65":{"target":[[0,8,-13.53]]},"animation.ariados.recoil@0.3":{"target":[[0,8,-13.28]]},"animation.ariados.recoil@0.45":{"target":[[0,8,-13.38]]},"animation.ariados.recoil@0.75":{"target":[[0,8,-13.61]]},"animation.ariados.cry@1.25":{"target":[[0,8,-13.75]]},"animation.ariados.cry@2":{"target":[[0,8,-13.75]]}},"crobat":{"animation.crobat.cry@1.25":{"target":[[0,13.97,-8.38]]},"animation.crobat.cry@2":{"target":[[0,13.89,-8.36]]}},"pichu":{"animation.pichu.special@1.2":{"special":[[-4.5,4.73,-5.32],[4.5,4.73,-5.32]]},"animation.pichu.special@1.25":{"special":[[-4.5,4.72,-5.25],[4.5,4.72,-5.25]],"mouth":[[0,4.72,-5.26]],"hand_primary":[[-2.09,3.98,-3]]},"animation.pichu.special@0.8":{"special":[[-4.5,9.64,-1.11],[4.5,9.64,-1.11]]},"animation.pichu.special@1.35":{"special":[[-4.5,4.64,-5.29],[4.5,4.64,-5.29]]},"animation.pichu.special@1.45":{"face":[[0,5.44,-5.88]]},"animation.pichu.special@1.3":{"special":[[-4.5,4.61,-5.3],[4.5,4.61,-5.3]]},"animation.pichu.special@0.7":{"special":[[-4.5,9.58,-1.09],[4.5,9.58,-1.09]]},"animation.pichu.special@0.65":{"eye":[[2.45,11.55,0.31],[-2.45,11.55,0.31]]},"animation.pichu.special@1.1":{"special":[[-4.5,5.31,-5.45],[4.5,5.31,-5.45]]},"animation.pichu.physical@1.25":{"target":[[0,9,-13.75]],"middle":[[0,9,-9]]},"animation.pichu.physical@1.05":{"target":[[0,8.4,-5.85]]},"animation.pichu.physical@1.2":{"target":[[0,9.3,-12.7]]},"animation.pichu.physical@1.45":{"target":[[0,9,-13.95]]},"animation.pichu.physical@1.65":{"target":[[0,9,-14]]},"animation.pichu.physical@0.1":{"hand_primary":[[-5.4,5.05,-0.19]],"physical":[[-5.4,5.05,-0.19]]},"animation.pichu.physical@1.3":{"middle":[[0,9,-9.05]],"target":[[0,9,-13.8]]},"animation.pichu.physical@1.15":{"target":[[0,9.6,-11.65]]},"animation.pichu.physical@1.5":{"target":[[0,9,-14]]},"animation.pichu.physical@1.1":{"target":[[0,9.9,-10.6]]},"animation.pichu.physical@1.35":{"target":[[0,9,-13.85]]},"animation.pichu.status@1.15":{"mouth":[[1.37,7.61,-4.12]],"special":[[-2.88,9.09,-4.17],[5.62,6.12,-4.05]]},"animation.pichu.status@1.25":{"special":[[-2.71,9.2,-4.18],[5.68,5.95,-4.04]]},"animation.pichu.status@0.5":{"middle":[[0,10.31,0]],"target":[[0,10.31,-4.75]]},"animation.pichu.status@1.35":{"eye":[[4.85,8.92,-3.77],[0.34,10.83,-3.85]]},"animation.pichu.recoil@0.3":{"hand_primary":[[-4.95,6.65,1.93]]},"animation.pichu.recoil@0.45":{"hand_primary":[[-5.37,6.2,0.43]]},"animation.pichu.recoil@0.75":{"hand_primary":[[-5.5,5.34,-0.03]]}},"cleffa":{"animation.cleffa.cry@1.25":{"target":[[0,11.75,-6]]}},"igglybuff":{"animation.igglybuff.cry@1.25":{"target":[[0,10.75,-5.5]]}},"togetic":{"animation.togetic.special@1.2":{"target":[[0,21.63,-2.41]],"special":[[-0.14,25.62,-2.14]],"middle":[[0,19.47,2.09]]},"animation.togetic.special@1.25":{"special":[[0,27.04,-1.75]],"target":[[0,23.62,-1.61]],"mouth":[[0,27.04,-1.75]],"middle":[[0,20.97,2.63]],"hand_primary":[[-6.25,21.12,-1.68]]},"animation.togetic.special@1.85":{"target":[[0,23.76,-2.65]],"middle":[[0,21.66,1.89]]},"animation.togetic.special@2.15":{"target":[[0,19.33,-2.47]]},"animation.togetic.special@0.8":{"special":[[-0.39,18.51,-7.14]],"target":[[0,16.91,-5]]},"animation.togetic.special@1.35":{"special":[[0,27.77,-2.12]],"target":[[0,24.6,-1.39]]},"animation.togetic.special@1.45":{"target":[[0,25.59,-1.17]],"middle":[[0,22.81,2.99]],"face":[[0,30.19,-2.86]]},"animation.togetic.special@1.95":{"target":[[0,22.76,-2.59]]},"animation.togetic.special@1.55":{"middle":[[0,22.76,2.81]],"target":[[0,25.57,-1.33]]},"animation.togetic.special@2.4":{"middle":[[0,10.13,1.9]]},"animation.togetic.special@1.3":{"special":[[0,27.41,-1.94]],"target":[[0,24.11,-1.5]]},"animation.togetic.special@2.25":{"target":[[0,15.33,-2.41]]},"animation.togetic.special@1.5":{"target":[[0,25.63,-1.21]],"middle":[[0,22.82,2.93]]},"animation.togetic.special@1.75":{"target":[[0,24.54,-2.5]]},"animation.togetic.special@1.65":{"target":[[0,25.32,-2.02]]},"animation.togetic.special@2.2":{"target":[[0,17.87,-2.44]]},"animation.togetic.special@1.6":{"target":[[0,25.45,-1.68]],"middle":[[0,22.79,2.56]]},"animation.togetic.special@1.8":{"middle":[[0,22.03,1.87]]},"animation.togetic.special@0.7":{"special":[[-0.4,15.8,-7.44]],"target":[[0,15.92,-5]]},"animation.togetic.special@2.5":{"target":[[0,13.27,-3.77]]},"animation.togetic.special@0.65":{"eye":[[1.31,14.02,-9.76],[-2.29,14,-9.62]]},"animation.togetic.special@1.7":{"target":[[0,24.99,-2.28]]},"animation.togetic.special@2":{"target":[[0,22.21,-2.56]]},"animation.togetic.special@1":{"middle":[[0,18.45,0]]},"animation.togetic.special@1.1":{"special":[[-0.32,23.61,-3.3]],"target":[[0,18.53,-3.88]]},"animation.togetic.special@0.15":{"hand_primary":[[-6.4,8.01,-1.53]]},"animation.togetic.special@0.3":{"hand_secondary":[[5.93,8.89,-4.16]]},"animation.togetic.special@3.9":{"target":[[0,17.68,-5]]},"animation.togetic.physical@1.25":{"target":[[0.45,14.47,-26.37]],"middle":[[0.03,14.93,-21.41]]},"animation.togetic.physical@1.05":{"target":[[0.49,15.19,-2.31]]},"animation.togetic.physical@1.2":{"target":[[0.49,14.38,-17.25]]},"animation.togetic.physical@1.45":{"target":[[0.33,14.55,-26.89]]},"animation.togetic.physical@1.65":{"target":[[0.09,14.53,-26.48]]},"animation.togetic.physical@1.3":{"middle":[[0.03,14.94,-22.23]],"target":[[0.41,14.56,-27.2]]},"animation.togetic.physical@1.15":{"target":[[0.53,14.29,-8.13]]},"animation.togetic.physical@1.5":{"target":[[0.27,14.54,-26.79]]},"animation.togetic.physical@1.1":{"target":[[0.53,14.56,-3.15]]},"animation.togetic.physical@1.35":{"target":[[0.38,14.56,-27.1]]},"animation.togetic.physical@0.3":{"target":[[2.22,11.27,-4.48]]},"animation.togetic.physical@0.5":{"middle":[[0,13.26,0]]},"animation.togetic.physical@0.8":{"target":[[0.2,16.48,-3.93]]},"animation.togetic.physical@0.6":{"target":[[-1.85,14.57,-4.64]]},"animation.togetic.physical@0.85":{"target":[[0.26,16.29,-3.05]]},"animation.togetic.status@1.15":{"mouth":[[-0.47,19.3,-8.72]],"special":[[-0.47,19.3,-8.72]],"target":[[0.67,16.7,-4.6]]},"animation.togetic.status@1.85":{"target":[[0.58,16.95,-5.17]]},"animation.togetic.status@1.25":{"middle":[[0,17.2,-0.75]],"special":[[-0.63,15.73,-12.54]],"target":[[0.68,17.2,-5.7]]},"animation.togetic.status@1.3":{"middle":[[0,17.47,-1.26]]},"animation.togetic.status@1.2":{"target":[[0.67,16.9,-5.1]]},"animation.togetic.status@2.15":{"target":[[0.35,12.62,-4.99]]},"animation.togetic.status@1.35":{"eye":[[1.03,16.83,-14.86],[-2.57,16.79,-14.67]],"target":[[0.68,17.56,-6.27]]},"animation.togetic.status@1.65":{"target":[[0.68,17.9,-6.05]]},"animation.togetic.status@2":{"target":[[0.47,15.2,-4.98]]},"animation.togetic.status@2.05":{"target":[[0.43,14.45,-4.98]]},"animation.togetic.status@1":{"middle":[[0,15.45,0.87]]},"animation.togetic.recoil@0.3":{"hand_primary":[[-6.17,8.3,1.21]]},"animation.togetic.recoil@0.45":{"hand_primary":[[-6.89,8.3,2.47]]},"animation.togetic.recoil@0.75":{"hand_primary":[[-7.83,7.34,0.87]]},"animation.togetic.battle_cry@1.25":{"target":[[0.68,17.2,-5.7]]},"animation.togetic.battle_cry@2":{"target":[[0.47,15.2,-4.98]]}},"bellossom":{"animation.bellossom.recoil@0.3":{"hand_primary":[[-6.75,10.8,-1.48]]},"animation.bellossom.recoil@0.45":{"hand_primary":[[-6.75,10.64,-1.63]]},"animation.bellossom.recoil@0.75":{"hand_primary":[[-6.75,10.78,-1.49]]}},"sudowoodo":{"animation.sudowoodo.recoil@0.55":{"target":[[0,20.5,-6]]},"animation.sudowoodo.recoil@0.6":{"target":[[0,20.5,-6]]},"animation.sudowoodo.recoil@0.65":{"target":[[0,20.5,-6]]},"animation.sudowoodo.recoil@0.3":{"hand_primary":[[-14.07,20.75,3.19]],"target":[[0,20.5,-6]]},"animation.sudowoodo.recoil@0.45":{"hand_primary":[[-14.3,20.83,1.07]],"target":[[0,20.5,-6]]},"animation.sudowoodo.recoil@0.75":{"hand_primary":[[-14.37,20.61,-0.94]],"target":[[0,20.5,-6]]},"animation.sudowoodo.cry@1.25":{"target":[[0,20.5,-6]]},"animation.sudowoodo.cry@2":{"target":[[0,20.5,-6]]}},"sunflora":{"animation.sunflora.cry@1.25":{"target":[[0,10,-6]]},"animation.sunflora.cry@2":{"target":[[0,10,-6]]}},"wobbuffet":{"animation.wobbuffet.special@1.2":{"special":[[0,18.39,1.75]]},"animation.wobbuffet.special@1.25":{"special":[[0,18.63,1.88]],"mouth":[[0,18.63,1.88]],"hand_primary":[[-6.1,25.9,1.84]]},"animation.wobbuffet.special@0.8":{"special":[[0,12.58,-10.48]]},"animation.wobbuffet.special@1.35":{"special":[[0,18.83,2.51]]},"animation.wobbuffet.special@1.45":{"face":[[0,21.92,5.48]]},"animation.wobbuffet.special@1.3":{"special":[[0,18.73,2.08]]},"animation.wobbuffet.special@0.7":{"special":[[0,12.72,-10.38]]},"animation.wobbuffet.special@0.65":{"eye":[[-8.62,8.39,4.64],[-6.53,10.47,5.2]]},"animation.wobbuffet.special@1.1":{"special":[[0,15.68,-4.33]]},"animation.wobbuffet.special@0.3":{"hand_secondary":[[1.82,5.8,-6.71]]},"animation.wobbuffet.status@1.15":{"mouth":[[0,17.75,-3.89]],"special":[[0,17.75,-3.89]]},"animation.wobbuffet.status@1.25":{"special":[[0,18.94,-1.86]]},"animation.wobbuffet.status@1.35":{"eye":[[-9.48,5.63,4.07],[-8.45,8.34,4.82]]},"animation.wobbuffet.recoil@0.3":{"hand_primary":[[-15.8,12.73,0.82]]},"animation.wobbuffet.recoil@0.45":{"hand_primary":[[-15.6,14.04,-1.49]]},"animation.wobbuffet.recoil@0.75":{"hand_primary":[[-15,15.45,-2.01]]}},"girafarig":{"animation.girafarig.recoil@0.55":{"target":[[0,17.5,-12.75]]},"animation.girafarig.recoil@0.6":{"target":[[0,17.5,-12.75]]},"animation.girafarig.recoil@0.65":{"target":[[0,17.5,-12.75]]},"animation.girafarig.recoil@0.3":{"target":[[0,17.5,-12.75]]},"animation.girafarig.recoil@0.45":{"target":[[0,17.5,-12.75]]},"animation.girafarig.recoil@0.75":{"target":[[0,17.5,-12.75]]},"animation.girafarig.cry@1.25":{"target":[[0,17.5,-12.75]]},"animation.girafarig.cry@2":{"target":[[0,17.5,-12.75]]}},"dunsparce":{"animation.dunsparce.special@1.2":{"target":[[0.1,12.19,-15.49]],"special":[[0.13,12.52,-13.11]],"middle":[[0.13,13.23,-0.52]]},"animation.dunsparce.special@1.25":{"special":[[0.11,12.25,-13.3]],"target":[[0.08,11.53,-15.61]],"mouth":[[0.11,12.25,-13.3]],"middle":[[0.15,13.23,-0.7]]},"animation.dunsparce.special@1.85":{"target":[[-0.03,10.63,-15.61]],"middle":[[-0.08,12.96,-0.79]]},"animation.dunsparce.special@2.15":{"target":[[-0.14,12.04,-15.43]]},"animation.dunsparce.special@0.8":{"special":[[-0.08,11.16,-12.25]],"target":[[-0.17,12.64,-14.89]]},"animation.dunsparce.special@1.35":{"special":[[0.12,12.43,-13.36]],"target":[[0.09,11.32,-15.64]]},"animation.dunsparce.special@1.45":{"target":[[0.1,11.12,-15.67]],"middle":[[0.13,13.03,-0.79]],"face":[[0.17,14.77,-12.99]]},"animation.dunsparce.special@1.95":{"target":[[-0.08,10.55,-15.57]]},"animation.dunsparce.special@1.55":{"middle":[[0.13,12.93,-0.83]],"target":[[0.11,10.92,-15.7]]},"animation.dunsparce.special@2.4":{"middle":[[-0.07,9.17,-0.08]]},"animation.dunsparce.special@1.3":{"special":[[0.12,12.6,-13.34]],"target":[[0.09,11.54,-15.63]]},"animation.dunsparce.special@2.25":{"target":[[-0.15,13.06,-15.31]]},"animation.dunsparce.special@1.5":{"target":[[0.11,11.13,-15.69]],"middle":[[0.13,12.99,-0.81]]},"animation.dunsparce.special@1.75":{"target":[[0.02,10.71,-15.64]]},"animation.dunsparce.special@1.65":{"target":[[0.08,10.79,-15.68]]},"animation.dunsparce.special@2.2":{"target":[[-0.15,12.59,-15.38]]},"animation.dunsparce.special@1.6":{"target":[[0.11,10.95,-15.71]],"middle":[[0.11,12.91,-0.84]]},"animation.dunsparce.special@0.5":{"middle":[[-0.09,8.6,0.37]]},"animation.dunsparce.special@1.8":{"middle":[[-0.04,12.96,-0.79]]},"animation.dunsparce.special@0.4":{"middle":[[0,4.05,0.78]]},"animation.dunsparce.special@0.7":{"special":[[-0.13,10.18,-12.2]],"target":[[-0.25,13.93,-15.28]]},"animation.dunsparce.special@2.5":{"target":[[0.04,6.11,-14.92]]},"animation.dunsparce.special@0.55":{"middle":[[-0.14,11,0.05]]},"animation.dunsparce.special@0.65":{"eye":[[-5.19,11.98,-9.14],[4.81,12.21,-9.13]]},"animation.dunsparce.special@1.7":{"target":[[0.05,10.87,-15.68]]},"animation.dunsparce.special@2":{"target":[[-0.08,10.63,-15.52]]},"animation.dunsparce.special@1":{"middle":[[-0.06,12.31,1.11]]},"animation.dunsparce.special@1.1":{"special":[[0.08,12.27,-11.37]],"target":[[0.03,12.18,-13.79]]},"animation.dunsparce.special@0.15":{"target":[[-0.09,1.54,-15.14]]},"animation.dunsparce.special@0.3":{"target":[[0,1.02,-15.01]]},"animation.dunsparce.special@3.9":{"target":[[-0.12,12.39,-14.41]]},"animation.dunsparce.physical@1.25":{"target":[[-0.35,8.56,-34.06]],"middle":[[-0.24,4.12,-19.73]]},"animation.dunsparce.physical@1.05":{"target":[[-0.53,43.48,-26.48]]},"animation.dunsparce.physical@1.2":{"target":[[-0.56,30.57,-29.61]]},"animation.dunsparce.physical@1.45":{"target":[[-0.39,3.7,-34.72]]},"animation.dunsparce.physical@1.65":{"target":[[0.49,3.77,-34.22]]},"animation.dunsparce.physical@1.3":{"middle":[[-0.22,3.61,-20]],"target":[[-0.22,3.87,-35]]},"animation.dunsparce.physical@1.15":{"target":[[-0.55,42.5,-27.96]]},"animation.dunsparce.physical@1.5":{"target":[[-0.43,3.72,-34.59]]},"animation.dunsparce.physical@1.1":{"target":[[-0.54,42.99,-27.22]]},"animation.dunsparce.physical@1.35":{"target":[[-0.21,3.71,-34.96]]},"animation.dunsparce.physical@0.3":{"target":[[-0.01,5.65,-14.26]]},"animation.dunsparce.physical@0.5":{"middle":[[-0.15,14.88,0.42]]},"animation.dunsparce.physical@0.8":{"target":[[-0.25,16.98,-20.4]]},"animation.dunsparce.physical@0.6":{"target":[[-0.22,13.55,-16.06]]},"animation.dunsparce.physical@0.85":{"target":[[-0.33,20.95,-22.4]]},"animation.dunsparce.status@1.15":{"mouth":[[0,20.16,-0.3]],"special":[[0,20.16,-0.3]],"target":[[0,27.76,5.36]]},"animation.dunsparce.status@1.85":{"target":[[0,26.47,2.86]]},"animation.dunsparce.status@1.25":{"middle":[[0,13.68,10.21]],"special":[[0,21.61,1.25]],"target":[[0,28.32,6.94]]},"animation.dunsparce.status@1.3":{"middle":[[0,13.66,10.3]]},"animation.dunsparce.status@1.2":{"target":[[0,28.09,6.19]]},"animation.dunsparce.status@0.5":{"target":[[-0.03,0.93,-14.73]]},"animation.dunsparce.status@2.15":{"target":[[0,7.39,-12.79]]},"animation.dunsparce.status@1.35":{"eye":[[-5,21.67,6.43],[5,21.67,6.43]],"target":[[0,28.42,7.85]]},"animation.dunsparce.status@1.65":{"target":[[0,28.14,6.67]]},"animation.dunsparce.status@2":{"target":[[0,18.92,-6.75]]},"animation.dunsparce.status@2.05":{"target":[[0,15.3,-9.16]]},"animation.dunsparce.status@2.2":{"target":[[0,5.66,-13.46]]},"animation.dunsparce.status@1":{"middle":[[0,9.86,5.63]]},"animation.dunsparce.recoil@0.55":{"target":[[0.01,4.24,-14.94]]},"animation.dunsparce.recoil@0.6":{"target":[[0.01,4.14,-14.99]]},"animation.dunsparce.recoil@0.65":{"target":[[0.01,4.13,-14.99]]},"animation.dunsparce.recoil@0.3":{"target":[[0,4.93,-14.52]]},"animation.dunsparce.recoil@0.45":{"target":[[0,4.52,-14.78]]},"animation.dunsparce.recoil@0.75":{"target":[[0.01,4.12,-14.99]]},"animation.dunsparce.battle_cry@1.25":{"target":[[0,28.32,6.94]]},"animation.dunsparce.battle_cry@2":{"target":[[0,18.92,-6.75]]}},"gligar":{"animation.gligar.cry@1.25":{"target":[[0,8.75,-4]]},"animation.gligar.cry@2":{"target":[[0,8.75,-4]]}},"steelix":{"animation.steelix.cry@1.25":{"target":[[0,-23,24]]},"animation.steelix.cry@2":{"target":[[0,-23,24]]}},"scizor":{"animation.scizor.cry@1.25":{"target":[[0,26.5,-3.5]]},"animation.scizor.cry@2":{"target":[[0,26.5,-3.5]]}},"sneasel":{"animation.sneasel.recoil@0.3":{"hand_primary":[[-11.33,13.72,5.08]]},"animation.sneasel.recoil@0.45":{"hand_primary":[[-11.56,13.86,3.95]]},"animation.sneasel.recoil@0.75":{"hand_primary":[[-12,13.01,0.36]]}},"teddiursa":{"animation.teddiursa.special@1.2":{"special":[[-5.63,4.12,0.24]]},"animation.teddiursa.special@1.25":{"special":[[-5.63,4.12,0.24]],"hand_primary":[[-5.63,4.12,0.24]]},"animation.teddiursa.special@0.8":{"special":[[-5.63,4.12,0.24]]},"animation.teddiursa.special@1.35":{"special":[[-5.63,4.12,0.24]]},"animation.teddiursa.special@1.3":{"special":[[-5.63,4.12,0.24]]},"animation.teddiursa.special@0":{"special":[[-5.63,4.12,0.24]]},"animation.teddiursa.special@0.7":{"special":[[-5.63,4.12,0.24]]},"animation.teddiursa.special@1.1":{"special":[[-5.63,4.12,0.24]]},"animation.teddiursa.special@0.15":{"hand_primary":[[-5.63,4.12,0.24]]},"animation.teddiursa.special@0.3":{"hand_secondary":[[5.63,4.12,0.24]]},"animation.teddiursa.physical@0.1":{"hand_primary":[[-5.26,4.49,1.99]],"physical":[[-5.26,4.49,1.99]]},"animation.teddiursa.physical@0":{"hand_primary":[[-5.63,4.12,0.24]],"physical":[[-5.63,4.12,0.24]]},"animation.teddiursa.status@1.15":{"special":[[-5.63,4.12,0.24]]},"animation.teddiursa.status@1.25":{"special":[[-5.63,4.12,0.24]]},"animation.teddiursa.recoil@0.3":{"hand_primary":[[-7.5,6.95,0.78]]},"animation.teddiursa.recoil@0.45":{"hand_primary":[[-7.5,6.98,0.42]]},"animation.teddiursa.recoil@0.75":{"hand_primary":[[-7.5,7,0]]}},"ursaring":{"animation.ursaring.recoil@0.55":{"target":[[0,28,-11]]},"animation.ursaring.recoil@0.6":{"target":[[0,28,-11]]},"animation.ursaring.recoil@0.65":{"target":[[0,28,-11]]},"animation.ursaring.recoil@0.3":{"hand_primary":[[-27.5,31.84,2.23]],"target":[[0,28,-11]]},"animation.ursaring.recoil@0.45":{"hand_primary":[[-27.5,31.95,1.34]],"target":[[0,28,-11]]},"animation.ursaring.recoil@0.75":{"hand_primary":[[-27.5,32,-0.45]],"target":[[0,28,-11]]},"animation.ursaring.cry@1.25":{"target":[[0,28,-11]]},"animation.ursaring.cry@2":{"target":[[0,28,-11]]}},"swinub":{"animation.swinub.special@1.25":{"special":[[0,0.05,-6.29]],"mouth":[[0,0.05,-6.29]]},"animation.swinub.special@0.8":{"special":[[0,1.12,-2.9]]},"animation.swinub.special@1.35":{"special":[[0,0.04,-6.48]]},"animation.swinub.special@1.45":{"face":[[0,3.58,-6.95]]},"animation.swinub.special@1.3":{"special":[[0,0.04,-6.39]]},"animation.swinub.special@0.7":{"special":[[0,0.82,-2.91]]},"animation.swinub.special@0.65":{"eye":[[1.74,3.26,-3.03],[-1.74,3.26,-3.03]]},"animation.swinub.special@1.1":{"special":[[0,2.02,-2.85]]},"animation.swinub.physical@0.1":{"physical":[[0,6.59,-0.5]]},"animation.swinub.status@1.15":{"mouth":[[0.83,0.52,-4.02]],"special":[[0.83,0.52,-4.02]]},"animation.swinub.status@1.25":{"special":[[-1.25,1.48,-5.32]]},"animation.swinub.status@1.35":{"eye":[[1.95,3.78,-4.35],[-1.51,3.7,-4.58]]}},"piloswine":{"animation.piloswine.special@1.2":{"special":[[0.2,3.2,-11.85]]},"animation.piloswine.special@1.25":{"special":[[0,1.57,-12.77]],"mouth":[[0,1.57,-12.77]],"middle":[[0,8.6,-1.35],[0,9.5,0]]},"animation.piloswine.special@1.85":{"middle":[[0,8.75,-1.22],[0,9.5,0]]},"animation.piloswine.special@0.8":{"special":[[0.36,4.45,-10.15]]},"animation.piloswine.special@1.35":{"special":[[0,1.63,-12.77]]},"animation.piloswine.special@1.45":{"middle":[[0,8.65,-1.31],[0,9.5,0]],"face":[[0,6.16,-12.75]]},"animation.piloswine.special@1.55":{"middle":[[0,8.68,-1.29],[0,9.5,0]]},"animation.piloswine.special@2.4":{"middle":[[0,8.64,-1.32],[0,9.5,0]]},"animation.piloswine.special@1.3":{"special":[[0,1.62,-12.85]]},"animation.piloswine.special@1.5":{"middle":[[0,8.66,-1.3],[0,9.5,0]]},"animation.piloswine.special@1.6":{"middle":[[0,8.69,-1.28],[0,9.5,0]]},"animation.piloswine.special@1.8":{"middle":[[0,8.74,-1.23],[0,9.5,0]]},"animation.piloswine.special@0.7":{"special":[[0.24,3.66,-10.48]]},"animation.piloswine.special@0.65":{"eye":[[-2.88,8.45,-10.32],[3.12,8.51,-10.32]]},"animation.piloswine.special@1":{"middle":[[0,11.05,2.44],[0,9.5,0]]},"animation.piloswine.special@1.1":{"special":[[0.65,6.13,-9.46]]},"animation.piloswine.physical@1.25":{"target":[[1.64,10.5,-18.96]],"middle":[[-0.06,9,-6.07],[-0.06,9.5,-6.07]]},"animation.piloswine.physical@1.2":{"target":[[1.16,10.46,-15.39]]},"animation.piloswine.physical@1.45":{"target":[[1.64,10.32,-19.38]]},"animation.piloswine.physical@1.65":{"target":[[1.64,10.47,-19.38]]},"animation.piloswine.physical@1.3":{"middle":[[-0.15,9.37,-5.8],[-0.06,9.16,-6.49]],"target":[[1.64,10.16,-19.38]]},"animation.piloswine.physical@1.5":{"target":[[1.64,10.53,-19.38]]},"animation.piloswine.physical@1.35":{"target":[[1.64,10.38,-19.38]]},"animation.piloswine.status@1.15":{"mouth":[[-1.29,4.88,-15.7]],"special":[[-1.29,4.88,-15.7]],"target":[[0,10.5,-18.6]]},"animation.piloswine.status@1.85":{"target":[[0,10.5,-18.81]]},"animation.piloswine.status@1.25":{"middle":[[0,11.32,-2.73],[0,9.5,-5.63]],"special":[[0,8.61,-15.84]],"target":[[0,10.5,-18.63]]},"animation.piloswine.status@1.3":{"middle":[[0,11.32,-2.75],[0,9.5,-5.65]]},"animation.piloswine.status@1.2":{"target":[[0,10.5,-18.62]]},"animation.piloswine.status@0.5":{"middle":[[0,8.88,-5.42],[0,9.38,-5.42]],"target":[[0,10.38,-18.42]]},"animation.piloswine.status@2.15":{"target":[[0,10.5,-18.9]]},"animation.piloswine.status@1.35":{"eye":[[-2.6,13.64,-14.2],[3.39,13.53,-14.06]],"target":[[0,10.5,-18.66]]},"animation.piloswine.status@1.65":{"target":[[0,10.5,-18.75]]},"animation.piloswine.status@2.4":{"middle":[[0,8.98,-5.94],[0,9.5,-5.92]]},"animation.piloswine.status@2":{"target":[[0,10.5,-18.85]]},"animation.piloswine.status@2.05":{"target":[[0,10.5,-18.87]]},"animation.piloswine.status@2.2":{"target":[[0,10.5,-18.91]]},"animation.piloswine.status@1":{"middle":[[0,9.57,-5],[0,9.5,-5.56]]},"animation.piloswine.battle_cry@1.25":{"target":[[0,10.5,-18.63]]},"animation.piloswine.battle_cry@2":{"target":[[0,10.5,-18.85]]}},"corsola":{"animation.corsola.physical@1.25":{"target":[[0,6,-7.94]],"middle":[[0,6,-1.44]]},"animation.corsola.physical@1.05":{"target":[[0,6,-8.99]]},"animation.corsola.physical@1.2":{"target":[[0,6,-8.2]]},"animation.corsola.physical@1.15":{"target":[[0,6,-8.46]]},"animation.corsola.physical@1.1":{"target":[[0,6,-8.73]]},"animation.corsola.physical@0.5":{"middle":[[0,5.84,-1]]},"animation.corsola.physical@0.8":{"target":[[0,5.71,-8.36]]},"animation.corsola.physical@0.6":{"target":[[0,5.8,-7.78]]},"animation.corsola.physical@0.85":{"target":[[0,5.73,-8.53]]},"animation.corsola.recoil@0.3":{"hand_primary":[[-4.39,7.12,-3.6]]},"animation.corsola.recoil@0.45":{"hand_primary":[[-4.39,7.04,-3.66]]}},"skarmory":{"animation.skarmory.special@1.2":{"target":[[0.51,23.58,-11.07]],"special":[[0.77,30.09,-16.06]],"middle":[[0.94,25.34,5.95]]},"animation.skarmory.special@1.25":{"special":[[0.78,33.46,-14.31]],"target":[[0.54,24.67,-10.07]],"mouth":[[0.78,33.46,-14.31]],"middle":[[1.12,26.36,6.95]]},"animation.skarmory.special@1.85":{"target":[[0.26,25.45,-5.4]],"middle":[[0.48,26.56,11.68]],"root":[[0,0,2.7]]},"animation.skarmory.special@2.15":{"target":[[0.26,21.84,-13.2]]},"animation.skarmory.special@0.8":{"special":[[-0.64,31.48,-14.81]]},"animation.skarmory.special@1.35":{"special":[[1.51,41.27,-5.54]],"target":[[0.51,26.91,-7.92]]},"animation.skarmory.special@1.45":{"target":[[0.07,27.79,-6.32]],"middle":[[0.98,29.1,10.72]],"face":[[1.76,46.13,-3.4]]},"animation.skarmory.special@1.95":{"target":[[0.25,25.96,-7.55]],"root":[[0,0,2.7]]},"animation.skarmory.special@1.55":{"middle":[[0.85,28.18,11.74]],"target":[[-0.17,27.05,-5.31]],"root":[[0,0,1.35]]},"animation.skarmory.special@2.4":{"middle":[[0.04,22.59,0.47]]},"animation.skarmory.special@1.3":{"special":[[1.21,38.99,-8.98]],"target":[[0.53,25.79,-9]]},"animation.skarmory.special@2.25":{"target":[[0.32,17.87,-15.73]]},"animation.skarmory.special@1.5":{"target":[[-0.21,28,-5.61]],"root":[[0,0,1.12]],"middle":[[0.77,29.21,11.43]]},"animation.skarmory.special@1.75":{"target":[[0.11,24.96,-4.91]]},"animation.skarmory.special@2.1":{"root":[[0,0,1.35]]},"animation.skarmory.special@1.65":{"target":[[-0.03,25.05,-4.75]]},"animation.skarmory.special@2.2":{"target":[[0.29,19.85,-14.47]]},"animation.skarmory.special@1.6":{"root":[[0,0,1.57]],"target":[[-0.1,26.05,-5.03]],"middle":[[0.79,27.17,12.02]]},"animation.skarmory.special@1.8":{"middle":[[0.54,26.23,12.02]],"root":[[0,0,2.47]]},"animation.skarmory.special@0.7":{"special":[[-0.66,33.93,-11.28]]},"animation.skarmory.special@0.65":{"eye":[[1.47,37.36,-10.82],[-3.6,36.81,-10.69]]},"animation.skarmory.special@1.7":{"target":[[0.04,24.81,-4.76]]},"animation.skarmory.special@2":{"target":[[0.24,26.06,-9.09]]},"animation.skarmory.special@1.1":{"special":[[0.35,28.63,-17.81]],"target":[[0.32,20.9,-13.76]]},"animation.skarmory.physical@1.25":{"target":[[1.15,19.74,-42.54]],"middle":[[2.15,22.39,-25.66]]},"animation.skarmory.physical@1.05":{"target":[[-0.76,18.53,15.43]]},"animation.skarmory.physical@1.2":{"target":[[-2.16,17.19,-12]]},"animation.skarmory.physical@1.45":{"target":[[1.07,26.53,-35.61]]},"animation.skarmory.physical@1.65":{"target":[[2.07,31.52,-25.07]]},"animation.skarmory.physical@0.1":{"physical":[[0.56,20.78,-30.85]]},"animation.skarmory.physical@1.3":{"middle":[[1.83,24.26,-29.07]],"target":[[0.85,21.12,-45.86]]},"animation.skarmory.physical@1.15":{"target":[[-0.89,14.26,9.66]]},"animation.skarmory.physical@1.5":{"target":[[1.3,27.96,-32.95]]},"animation.skarmory.physical@1.1":{"target":[[0.74,16.93,12.45]]},"animation.skarmory.physical@1.35":{"target":[[0.95,23.15,-40.88]]},"animation.skarmory.physical@0.3":{"target":[[0,17.9,-14.21]]},"animation.skarmory.physical@0.5":{"middle":[[-1.37,22.05,12.38]]},"animation.skarmory.physical@0.8":{"target":[[-2.29,31.19,11.55]]},"animation.skarmory.physical@0.6":{"target":[[-3.28,30.16,1.87]]},"animation.skarmory.physical@0.85":{"target":[[-0.73,29.3,13.68]]},"animation.skarmory.status@1.15":{"mouth":[[2.47,24.38,-24.71]],"special":[[2.47,24.38,-24.71]],"target":[[0.16,23.44,-15.54]]},"animation.skarmory.status@1.85":{"target":[[1.14,40.52,-3.3]]},"animation.skarmory.status@1.25":{"middle":[[1,31.23,3.9]],"special":[[3.66,38.01,-22.38]],"target":[[1,38,-11.82]]},"animation.skarmory.status@1.3":{"middle":[[1.54,31.5,6.62]]},"animation.skarmory.status@1.2":{"target":[[0.52,30.14,-13.88]]},"animation.skarmory.status@2.15":{"target":[[-1.19,29.77,-8.82]]},"animation.skarmory.status@1.35":{"eye":[[7.44,47.31,-14.65],[2.4,48.04,-14.54]],"target":[[2.03,42,-4.74]]},"animation.skarmory.status@1.65":{"target":[[2.9,35.05,-2.47]]},"animation.skarmory.status@2.4":{"middle":[[-0.35,24.45,1.15]]},"animation.skarmory.status@2":{"target":[[-0.37,37.99,-5.35]]},"animation.skarmory.status@2.05":{"target":[[-0.83,36.36,-6.01]]},"animation.skarmory.status@2.2":{"target":[[-1.37,26.06,-10.07]]},"animation.skarmory.battle_cry@1.25":{"target":[[1,38,-11.82]]},"animation.skarmory.battle_cry@2":{"target":[[-0.37,37.99,-5.35]]}},"porygon2":{"animation.porygon2.special@1.2":{"target":[[0,13.47,-9.9]],"special":[[0,15.28,-19.25]],"middle":[[0,13.37,-3.4]]},"animation.porygon2.special@1.25":{"special":[[0,12.55,-24.38]],"target":[[0,13.5,-13.5]],"middle":[[0,13.4,-7]]},"animation.porygon2.special@1.85":{"target":[[0.5,13.02,-14.39]],"middle":[[0.4,13.02,-7.89]]},"animation.porygon2.special@2.15":{"target":[[0,13.62,-4.38]]},"animation.porygon2.special@0.8":{"special":[[0,14.1,-7.54]],"target":[[0,10.98,-1.27]]},"animation.porygon2.special@1.35":{"special":[[0.37,12.63,-24.45]],"target":[[-0.36,13.35,-13.64]]},"animation.porygon2.special@1.45":{"target":[[-0.5,12.99,-13.78]],"middle":[[-0.4,12.99,-7.28]],"face":[[-0.54,12.99,-23.73]]},"animation.porygon2.special@1.95":{"target":[[0.33,13.37,-14.1]]},"animation.porygon2.special@1.55":{"middle":[[-0.28,12.71,-7.89]],"target":[[-0.34,12.64,-14.39]]},"animation.porygon2.special@2.4":{"middle":[[0,11.4,-2.93]]},"animation.porygon2.special@1.3":{"special":[[0.19,12.55,-24.45]],"target":[[-0.19,13.46,-13.61]]},"animation.porygon2.special@3.1":{"target":[[0,10.91,-6.37]]},"animation.porygon2.special@2.25":{"target":[[0,12.77,-5.63]]},"animation.porygon2.special@1.5":{"target":[[-0.46,12.8,-14.05]],"middle":[[-0.37,12.84,-7.55]]},"animation.porygon2.special@1.75":{"target":[[0.37,12.66,-14.22]]},"animation.porygon2.special@1.65":{"target":[[0.02,12.5,-14.68]]},"animation.porygon2.special@2.2":{"target":[[0,13.26,-4.31]]},"animation.porygon2.special@1.6":{"target":[[-0.18,12.53,-13.88]],"middle":[[-0.14,12.63,-7.38]]},"animation.porygon2.special@0":{"special":[[0,16.81,-13.24]],"middle":[[0,11.4,0]],"target":[[0,11.5,-6.5]]},"animation.porygon2.special@2.7":{"middle":[[0,11.4,-0.84]]},"animation.porygon2.special@0.5":{"middle":[[0,8.93,1.38]]},"animation.porygon2.special@1.8":{"middle":[[0.38,12.86,-7.84]]},"animation.porygon2.special@0.4":{"middle":[[0,9.04,0.52]]},"animation.porygon2.special@0.7":{"special":[[0,14.97,-7.39]],"target":[[0,10.15,-1.36]]},"animation.porygon2.special@2.5":{"target":[[0,11.5,-8.73]]},"animation.porygon2.special@0.55":{"middle":[[0,9.21,2.32]]},"animation.porygon2.special@0.65":{"eye":[[3,17.16,-1.81],[-3,17.16,-1.81]]},"animation.porygon2.special@1.7":{"target":[[0.21,12.55,-14.48]]},"animation.porygon2.special@2":{"target":[[0.16,13.47,-13.5]]},"animation.porygon2.special@1":{"middle":[[0,12.59,5.07]]},"animation.porygon2.special@3.3":{"middle":[[0,9.63,0.39]]},"animation.porygon2.special@1.1":{"special":[[0,12.54,-8.87]],"target":[[0,13.41,-2.7]]},"animation.porygon2.special@0.15":{"target":[[0,10.62,-6.3]]},"animation.porygon2.special@0.3":{"target":[[0,9.73,-6.11]]},"animation.porygon2.special@3.9":{"target":[[0,11.84,-1.35]]},"animation.porygon2.physical@1.25":{"target":[[0,8.55,-30.04]],"middle":[[0,11.36,-24.18]]},"animation.porygon2.physical@1.05":{"target":[[1.38,39.28,0.64]]},"animation.porygon2.physical@1.2":{"target":[[1.21,31.61,-16.98]]},"animation.porygon2.physical@1.45":{"target":[[0,27.77,-23.75]]},"animation.porygon2.physical@1.65":{"target":[[0,26.34,-16.86]]},"animation.porygon2.physical@0.1":{"middle":[[-1.17,12.12,-0.6]],"physical":[[-1.17,16.62,-14]]},"animation.porygon2.physical@1.3":{"middle":[[0,15.26,-22.8]],"target":[[0,14.33,-29.24]]},"animation.porygon2.physical@0":{"physical":[[0,16.8,-13.37]],"middle":[[0,11.4,-0.05]]},"animation.porygon2.physical@1.15":{"target":[[1.16,36.6,-8.73]]},"animation.porygon2.physical@1.5":{"target":[[0,27.83,-21.76]]},"animation.porygon2.physical@1.1":{"target":[[1.12,38.94,-2.27]]},"animation.porygon2.physical@1.35":{"target":[[0,20.17,-27.84]]},"animation.porygon2.physical@0.3":{"target":[[-3.06,13.17,-8.14]]},"animation.porygon2.physical@0.5":{"middle":[[-3.39,19.78,-1.66]]},"animation.porygon2.physical@0.8":{"target":[[2.19,35.02,3.96]]},"animation.porygon2.physical@0.6":{"target":[[-1.56,24.01,-7.04]]},"animation.porygon2.physical@0.85":{"target":[[3.03,36.63,5.21]]},"animation.porygon2.status@0.1":{"middle":[[0,11.55,0.43]]},"animation.porygon2.status@1.15":{"special":[[11.94,15.35,-4.87]],"target":[[4.31,8.63,-8.93]]},"animation.porygon2.status@1.85":{"target":[[-9.34,10.85,-7.09]]},"animation.porygon2.status@1.25":{"middle":[[3.13,7.4,-4.01]],"special":[[14.49,12.22,-0.5]],"target":[[9.17,6.95,-6.37]]},"animation.porygon2.status@1.3":{"middle":[[2.56,7.68,-4]]},"animation.porygon2.status@1.2":{"target":[[7.22,7.79,-8.19]]},"animation.porygon2.status@0.5":{"middle":[[0.16,12.25,1.8]],"target":[[-2.79,12.05,-3.99]]},"animation.porygon2.status@2.15":{"target":[[-2.92,12.78,-9.68]]},"animation.porygon2.status@0.2":{"target":[[-0.17,11.99,-5.63]]},"animation.porygon2.status@1.35":{"eye":[[5.53,15.05,2.12],[9.45,14.85,-2.15]],"target":[[7.43,7.84,-0.44]]},"animation.porygon2.status@1.65":{"target":[[-6.76,9.73,-0.35]]},"animation.porygon2.status@2.4":{"middle":[[0.36,12.99,-2.3]]},"animation.porygon2.status@2":{"target":[[-6.71,11.8,-8.78]]},"animation.porygon2.status@2.05":{"target":[[-5.5,12.13,-9.17]]},"animation.porygon2.status@2.2":{"target":[[-1.58,13.1,-9.78]]},"animation.porygon2.status@1":{"middle":[[2.05,12.42,-0.58]]},"animation.porygon2.recoil@0.55":{"target":[[0,4.69,-3.6]]},"animation.porygon2.recoil@0.6":{"target":[[0,5.03,-3.6]]},"animation.porygon2.recoil@0.65":{"target":[[0,5.12,-3.94]]},"animation.porygon2.recoil@0.3":{"target":[[0,3.46,-3.13]]},"animation.porygon2.recoil@0.45":{"target":[[0,4.01,-3.6]]},"animation.porygon2.recoil@0.75":{"target":[[0,4.78,-5.28]]},"animation.porygon2.battle_cry@1.25":{"target":[[9.17,6.95,-6.37]]},"animation.porygon2.battle_cry@2":{"target":[[-6.71,11.8,-8.78]]}},"magby":{"animation.magby.special@1.2":{"special":[[1.78,13.81,-8.4]]},"animation.magby.special@1.25":{"special":[[1.36,11.46,-9.72]],"mouth":[[1.36,11.46,-9.72]],"hand_primary":[[-4.11,11.68,-0.9]]},"animation.magby.special@0.8":{"special":[[-0.87,15.43,-1.97]]},"animation.magby.special@1.35":{"special":[[0.56,10.18,-9.39]]},"animation.magby.special@1.45":{"face":[[0.44,11.54,-11.59]]},"animation.magby.special@1.3":{"special":[[0.38,10.58,-9.6]]},"animation.magby.special@0":{"special":[[0.06,12.36,-5.91]]},"animation.magby.special@0.7":{"special":[[-1.05,15.23,-3.18]]},"animation.magby.special@0.65":{"eye":[[0.5,16.47,-2.93],[-2.48,16.21,-2.79]]},"animation.magby.special@1.1":{"special":[[0.14,15.8,-4.6]]},"animation.magby.special@0.15":{"hand_primary":[[-5.75,7.62,-0.57]]},"animation.magby.special@0.3":{"hand_secondary":[[4.53,8.73,-2.34]]},"animation.magby.physical@1.25":{"target":[[0,8.25,-2.75]],"middle":[[0,8.6,1]]},"animation.magby.physical@1.05":{"target":[[0,8.25,-2.75]]},"animation.magby.physical@1.2":{"target":[[0,8.25,-2.75]]},"animation.magby.physical@1.15":{"target":[[0,8.25,-2.75]]},"animation.magby.physical@1.1":{"target":[[0,8.25,-2.75]]},"animation.magby.physical@0.5":{"middle":[[0,8.6,1]]},"animation.magby.physical@0.8":{"target":[[0,8.25,-2.75]]},"animation.magby.physical@0.6":{"target":[[0,8.25,-2.75]]},"animation.magby.physical@0.85":{"target":[[0,8.25,-2.75]]},"animation.magby.status@1.15":{"mouth":[[1.58,13.3,-6.55]],"special":[[1.58,13.3,-6.55]]},"animation.magby.status@1.25":{"special":[[2.21,12.04,-9.05]]},"animation.magby.status@1.35":{"eye":[[2.38,13.84,-7.15],[-0.45,13.15,-7.85]]},"animation.magby.recoil@0.3":{"hand_primary":[[-5.84,7.69,2.85]]},"animation.magby.recoil@0.75":{"hand_primary":[[-6.52,9.56,-0.08]]}},"blissey":{"animation.blissey.special@1.2":{"special":[[0.05,22.52,-9.25]]},"animation.blissey.special@1.25":{"hand_primary":[[-5.47,15.93,-13.86]]},"animation.blissey.special@0.8":{"special":[[-0.1,22.98,-8.47]]},"animation.blissey.special@1.45":{"face":[[0,24.19,-10.85]]},"animation.blissey.special@0.7":{"special":[[0.04,22.33,-9.64]]},"animation.blissey.special@0.65":{"eye":[[2.4,23.78,-10.63],[-2.1,23.79,-10.66]]},"animation.blissey.special@1.1":{"special":[[-0.07,23.52,-7.22]]},"animation.blissey.special@0.15":{"hand_primary":[[-4.54,11.96,-12.74]]},"animation.blissey.special@0.3":{"hand_secondary":[[4.75,11.1,-12.69]]},"animation.blissey.status@1.15":{"mouth":[[0.07,21.12,-10.76]],"special":[[0.07,21.12,-10.76]]},"animation.blissey.status@1.25":{"special":[[0.26,21.25,-10.73]]},"animation.blissey.status@1.35":{"eye":[[3.3,23.6,-10.55],[-1.2,23.73,-10.61]]},"animation.blissey.recoil@0.3":{"hand_primary":[[-7.5,15.83,-12.84]]},"animation.blissey.recoil@0.45":{"hand_primary":[[-7.5,15.59,-13.29]]},"animation.blissey.recoil@0.75":{"hand_primary":[[-7.5,15.3,-13.68]]}},"treecko":{"animation.treecko.special@1.2":{"special":[[-0.23,6.16,-7.68]]},"animation.treecko.special@1.25":{"special":[[-0.22,6.56,-7.16]],"mouth":[[-0.22,6.56,-7.16]],"hand_primary":[[-4.64,1.04,-8.29]]},"animation.treecko.special@0.8":{"special":[[-0.22,6.31,-8.44]]},"animation.treecko.special@1.35":{"special":[[-0.23,7,-7.44]]},"animation.treecko.special@1.45":{"face":[[-0.42,11.25,-12.42]]},"animation.treecko.special@1.3":{"special":[[-0.23,6.93,-7.13]]},"animation.treecko.special@0.5":{"middle":[[0,19.5,0]]},"animation.treecko.special@0.4":{"middle":[[0,16.14,0]]},"animation.treecko.special@0.7":{"special":[[-0.56,10.89,-7.58]],"target":[[0,12.6,-5.5]]},"animation.treecko.special@0.55":{"middle":[[0,19.5,0]]},"animation.treecko.special@0.65":{"eye":[[-4.23,16.78,-8.6],[2.75,16.69,-9.1]]},"animation.treecko.special@1.1":{"special":[[-0.19,5.51,-8.55]]},"animation.treecko.special@0.15":{"hand_primary":[[-5.85,5.91,-4.91]]},"animation.treecko.special@0.3":{"hand_secondary":[[5.4,6.25,-3.2]]},"animation.treecko.physical@1.25":{"target":[[0,12,-14.88]],"middle":[[0,8.24,-10.4]]},"animation.treecko.physical@1.05":{"target":[[0,14.32,-8.83]]},"animation.treecko.physical@1.2":{"target":[[0,14.88,-9.82]]},"animation.treecko.physical@1.45":{"target":[[0,11.72,-14.88]]},"animation.treecko.physical@1.65":{"target":[[0,11.76,-14.88]]},"animation.treecko.physical@0.1":{"hand_primary":[[-6.23,6.45,-4.93]],"physical":[[-6.23,6.45,-4.93]]},"animation.treecko.physical@1.3":{"middle":[[0,7.73,-10.4]],"target":[[0,11.5,-14.88]]},"animation.treecko.physical@1.15":{"target":[[0,14.42,-6.67]]},"animation.treecko.physical@1.5":{"target":[[0,11.76,-14.88]]},"animation.treecko.physical@1.1":{"target":[[0,14.13,-6.84]]},"animation.treecko.physical@1.35":{"target":[[0,11.9,-14.88]]},"animation.treecko.status@1.15":{"mouth":[[0.09,26.47,-2.07]],"special":[[0.09,26.47,-2.07]],"target":[[0,22.7,-5.5]]},"animation.treecko.status@1.25":{"middle":[[0,25.5,0]],"special":[[0.09,27.26,-2.12]],"target":[[0,23.5,-5.5]]},"animation.treecko.status@1.3":{"middle":[[0,25.14,0]]},"animation.treecko.status@1.2":{"target":[[0,23.1,-5.5]]},"animation.treecko.status@1.35":{"eye":[[-3.34,29.97,-2.37],[3.49,29.54,-3.86]],"target":[[0,22.79,-5.5]]},"animation.treecko.status@1.65":{"target":[[0,14.99,-5.5]]},"animation.treecko.status@1":{"middle":[[0,23.5,0]]},"animation.treecko.recoil@0.3":{"hand_primary":[[-9.5,12.24,0.51]]},"animation.treecko.recoil@0.45":{"hand_primary":[[-9.5,12.26,0.21]]},"animation.treecko.recoil@0.75":{"hand_primary":[[-9.5,12.25,-0.4]]},"animation.treecko.battle_cry@1.25":{"target":[[0,23.5,-5.5]]}},"torchic":{"animation.torchic.special@0.65":{"eye":[[-0.42,16.79,2.07],[6.48,15.64,2.24]]},"animation.torchic.status@1.35":{"eye":[[-3.77,39.6,-3.59],[3.16,39.36,-4.5]]}},"blaziken":{"animation.blaziken.special@0.65":{"eye":[[6.3,42.85,7.22],[2.01,43.47,6.68]]},"animation.blaziken.status@1.35":{"eye":[[2.27,48.2,8.47],[-2.05,48.19,9.08]]}},"silcoon":{"animation.silcoon.cry@1.25":{"target":[[0,3.5,-7.5]]},"animation.silcoon.cry@2":{"target":[[0,3.5,-7.5]]}},"beautifly":{"animation.beautifly.cry@1.25":{"target":[[0,7.5,-8]]},"animation.beautifly.cry@2":{"target":[[0,7.5,-8]]}},"cascoon":{"animation.cascoon.cry@1.25":{"target":[[0,3.5,-8]]},"animation.cascoon.cry@2":{"target":[[0,3.5,-8]]}},"dustox":{"animation.dustox.cry@1.25":{"target":[[0,9.5,-7]]},"animation.dustox.cry@2":{"target":[[0,9.5,-7]]}},"slakoth":{"animation.slakoth.physical@1.25":{"target":[[1,22.62,-1.7]],"middle":[[1,11.71,-0.26]]},"animation.slakoth.physical@1.05":{"target":[[1,24.21,2]]},"animation.slakoth.physical@1.2":{"target":[[1.01,23.47,-0.34]]},"animation.slakoth.physical@1.45":{"target":[[1,22.43,-1.7]]},"animation.slakoth.physical@1.65":{"target":[[1,22.62,-1.7]]},"animation.slakoth.physical@0.1":{"hand_primary":[[-6.56,2.24,-2.27]],"physical":[[-6.56,2.24,-2.27]]},"animation.slakoth.physical@1.3":{"middle":[[1,11.13,-0.26]],"target":[[1,22.04,-1.7]]},"animation.slakoth.physical@1.15":{"target":[[1.01,24.05,0.77]]},"animation.slakoth.physical@1.5":{"target":[[1,22.62,-1.7]]},"animation.slakoth.physical@1.1":{"target":[[1,24.13,1.38]]},"animation.slakoth.physical@1.35":{"target":[[1,22.55,-1.7]]},"animation.slakoth.physical@0.8":{"target":[[0.63,23.93,3.04]]},"animation.slakoth.physical@0.85":{"target":[[0.72,24.04,2.93]]},"animation.slakoth.status@1.15":{"mouth":[[0.26,11.35,-2.72]],"special":[[0.26,11.35,-2.72]]},"animation.slakoth.status@1.35":{"eye":[[2.81,16.18,-2.99],[-1.98,16.39,-2.87]]},"animation.slakoth.status@1":{"middle":[[0,11.21,4.84]]}},"slaking":{"animation.slaking.special@1.2":{"special":[[6.48,15.76,-10.9]]},"animation.slaking.special@1.25":{"special":[[7.33,16.5,-10.84]],"mouth":[[7.33,16.5,-10.84]],"hand_primary":[[-11.78,15.19,-10.28]]},"animation.slaking.special@0.8":{"special":[[9.49,16.37,-8.33]]},"animation.slaking.special@1.35":{"special":[[8.32,17.26,-10.38]]},"animation.slaking.special@1.45":{"face":[[11.38,20.29,-11.38]]},"animation.slaking.special@1.3":{"special":[[8.09,17.09,-10.59]]},"animation.slaking.special@0.7":{"special":[[9.98,16.35,-8.14]]},"animation.slaking.special@0.65":{"eye":[[15.39,16.77,-9.19],[11.63,21.41,-8.59]]},"animation.slaking.special@1.1":{"special":[[5.6,14.73,-10.44]]},"animation.slaking.special@0.3":{"hand_secondary":[[26.32,7.74,-4.27]]},"animation.slaking.physical@1.25":{"target":[[-0.75,20.95,-29.13]],"middle":[[0.25,8,-28]]},"animation.slaking.physical@1.05":{"target":[[-0.75,17.09,-8.91]]},"animation.slaking.physical@1.2":{"target":[[-0.75,23.03,-23.37]]},"animation.slaking.physical@1.45":{"target":[[-0.75,20.89,-29.13]]},"animation.slaking.physical@1.65":{"target":[[-0.75,20.98,-28.69]]},"animation.slaking.physical@0.1":{"hand_primary":[[-8.36,21.17,-10.24]],"physical":[[-8.36,21.17,-10.24]]},"animation.slaking.physical@1.3":{"middle":[[0.25,8.88,-28]],"target":[[-0.75,21.83,-29.13]]},"animation.slaking.physical@1.15":{"target":[[-0.75,23.11,-17.87]]},"animation.slaking.physical@1.5":{"target":[[-0.75,21.35,-29.13]]},"animation.slaking.physical@1.1":{"target":[[-0.75,20.5,-12.95]]},"animation.slaking.physical@1.35":{"target":[[-0.75,22.56,-29.13]]},"animation.slaking.physical@0.5":{"middle":[[0.25,9.5,-1.47]]},"animation.slaking.physical@0.8":{"target":[[-0.75,0.3,-5.69]]},"animation.slaking.physical@0.6":{"target":[[-0.75,0.86,-13.5]]},"animation.slaking.physical@0.85":{"target":[[-0.75,2.51,-4.26]]},"animation.slaking.status@1.15":{"mouth":[[10.25,12.89,-8.48]],"special":[[10.25,12.89,-8.48]]},"animation.slaking.status@1.25":{"special":[[10.63,13.17,-8.3]]},"animation.slaking.status@1.35":{"eye":[[16.51,11.73,-9.05],[14.06,17.12,-8.12]]},"animation.slaking.recoil@0.55":{"target":[[0,20,-13]]},"animation.slaking.recoil@0.6":{"target":[[0,20,-13]]},"animation.slaking.recoil@0.65":{"target":[[0,20,-13]]},"animation.slaking.recoil@0.3":{"hand_primary":[[-42.59,28.45,-0.17]],"target":[[0,20,-13]]},"animation.slaking.recoil@0.45":{"hand_primary":[[-42.56,28.55,-0.03]],"target":[[0,20,-13]]},"animation.slaking.recoil@0.75":{"hand_primary":[[-42.5,28.75,0.19]],"target":[[0,20,-13]]}},"nincada":{"animation.nincada.special@0.65":{"eye":[[4.08,6.75,-3.23],[-2.92,6.93,-3.22]]},"animation.nincada.status@1.35":{"eye":[[3.5,10.03,3.85],[-3.5,10.03,3.85]]}},"ninjask":{"animation.ninjask.special@0.65":{"eye":[[4,18.59,7.25],[-4,18.59,7.25]]},"animation.ninjask.status@1.35":{"eye":[[5.83,35.67,-6.52],[-2.13,34.97,-6.52]]}},"shedinja":{"animation.shedinja.special@0.65":{"eye":[[5.96,17.86,1.19],[-3.46,17.86,2.38]]},"animation.shedinja.status@1.35":{"eye":[[-7.44,29.48,6.55],[2.06,29.48,6.65]]}},"nosepass":{"animation.nosepass.special@0.65":{"eye":[[-3.94,13.81,-3.64],[4.09,13.61,-1.57]]},"animation.nosepass.status@1.35":{"eye":[[-4.16,16.86,-3.94],[4.14,16.86,-3.94]]}},"skitty":{"animation.skitty.special@1.2":{"target":[[2.56,5.7,7.58]],"special":[[0.99,3.66,7.82]]},"animation.skitty.special@1.25":{"special":[[2.67,3.89,7.43]],"target":[[4.09,6,6.88]],"mouth":[[2.67,3.89,7.43]]},"animation.skitty.special@1.85":{"target":[[0.78,6,7.96]]},"animation.skitty.special@2.15":{"target":[[-0.81,5.48,7.96]]},"animation.skitty.special@0.8":{"special":[[7.31,3.97,-3]],"target":[[7.22,6.2,1.15]]},"animation.skitty.special@1.35":{"special":[[0.41,4.31,8.1]],"target":[[1.51,6,7.86]]},"animation.skitty.special@1.45":{"target":[[-1.25,6,7.9]],"face":[[-1.52,6.05,8.19]]},"animation.skitty.special@1.95":{"target":[[2.86,6,7.47]]},"animation.skitty.special@1.55":{"target":[[-3.86,6,7.01]]},"animation.skitty.special@2.4":{"middle":[[0,7.62,0]]},"animation.skitty.special@1.3":{"special":[[1.57,4.12,7.87]],"target":[[2.84,6,7.48]]},"animation.skitty.special@2.25":{"target":[[-2.8,5,7.49]]},"animation.skitty.special@1.5":{"target":[[-2.6,6,7.57]]},"animation.skitty.special@1.75":{"target":[[-1.37,6,7.88]]},"animation.skitty.special@1.65":{"target":[[-3.41,6,7.24]]},"animation.skitty.special@2.2":{"target":[[-1.82,5.24,7.79]]},"animation.skitty.special@1.6":{"target":[[-4.35,6,6.71]]},"animation.skitty.special@0.5":{"middle":[[-3,6.5,-4.75]]},"animation.skitty.special@0.4":{"middle":[[-3,6.5,-4.15]]},"animation.skitty.special@0.7":{"special":[[6.17,5.14,-8.48]],"target":[[8.71,6.3,-4.16]]},"animation.skitty.special@2.5":{"target":[[3.84,7.6,-7.02]]},"animation.skitty.special@0.55":{"middle":[[-2.35,7.53,-5]]},"animation.skitty.special@0.65":{"eye":[[1.51,8.73,-11.5],[6.4,8.93,-8.99]]},"animation.skitty.special@1.7":{"target":[[-2.41,6,7.63]]},"animation.skitty.special@2":{"target":[[2.22,6,7.68]]},"animation.skitty.special@1":{"middle":[[1,6.55,-0.13]]},"animation.skitty.special@3.3":{"middle":[[-2.53,7.87,-2.97]]},"animation.skitty.special@1.1":{"special":[[-1.3,4.35,7.58]],"target":[[-0.38,6.35,7.96]]},"animation.skitty.special@0.3":{"target":[[-4.69,7.37,-10.67]]},"animation.skitty.special@3.9":{"target":[[3.14,6.6,6.34]]},"animation.skitty.physical@1.25":{"target":[[-0.96,11.91,-14.91]],"middle":[[0,12.25,-6.96]]},"animation.skitty.physical@1.05":{"target":[[-0.07,8.58,-9.09]]},"animation.skitty.physical@1.2":{"target":[[-0.68,12.19,-13.41]]},"animation.skitty.physical@1.45":{"target":[[-1.72,7.98,-17.46]]},"animation.skitty.physical@1.65":{"target":[[-2.22,1.38,-18.25]]},"animation.skitty.physical@1.3":{"middle":[[-0.02,12.35,-8.02]],"target":[[-1.23,11.08,-15.84]]},"animation.skitty.physical@1.15":{"target":[[-0.41,12.08,-11.81]]},"animation.skitty.physical@1.5":{"target":[[-1.81,6.71,-17.72]]},"animation.skitty.physical@1.1":{"target":[[-0.15,11.21,-10.2]]},"animation.skitty.physical@1.35":{"target":[[-1.45,10.19,-16.59]]},"animation.skitty.physical@0.3":{"target":[[-0.14,6,-8]]},"animation.skitty.physical@0.8":{"target":[[0,5.8,-8]]},"animation.skitty.physical@0.6":{"target":[[0,6,-8]]},"animation.skitty.physical@0.85":{"target":[[0,5.6,-8]]},"animation.skitty.status@1.15":{"mouth":[[-0.96,2.8,-11.91]],"special":[[-0.96,2.8,-11.91]],"target":[[-1,6,-13]]},"animation.skitty.status@1.85":{"target":[[-0.6,6.22,-13]]},"animation.skitty.status@1.25":{"middle":[[-0.5,7.5,-5]],"special":[[-0.52,5.75,-11.63]],"target":[[-0.5,7,-13]]},"animation.skitty.status@1.3":{"middle":[[-0.33,7.7,-5.01]]},"animation.skitty.status@1.2":{"target":[[-0.8,6.4,-13]]},"animation.skitty.status@0.5":{"middle":[[-0.74,8.39,-1.46]],"target":[[-0.92,8.68,-9.47]]},"animation.skitty.status@2.15":{"target":[[0.1,4.91,-13.31]]},"animation.skitty.status@0.2":{"target":[[-1.66,6,-6.87]]},"animation.skitty.status@1.35":{"eye":[[-3.59,9.08,-12.02],[1.83,9.98,-12.28]],"target":[[-0.18,7.22,-13.02]]},"animation.skitty.status@1.65":{"target":[[-0.6,6.38,-12.96]]},"animation.skitty.status@2.4":{"middle":[[1,6.94,-2.34]]},"animation.skitty.status@2":{"target":[[0,6,-13.3]]},"animation.skitty.status@2.05":{"target":[[0,5.44,-13.48]]},"animation.skitty.status@2.2":{"target":[[0.45,5.59,-12.43]]},"animation.skitty.status@1":{"middle":[[-1,6.5,-5]]},"animation.skitty.recoil@0.55":{"target":[[0,6,-8]]},"animation.skitty.recoil@0.6":{"target":[[0,6,-8]]},"animation.skitty.recoil@0.65":{"target":[[0,6,-8]]},"animation.skitty.recoil@0.3":{"target":[[0,6,-8]]},"animation.skitty.recoil@0.45":{"target":[[0,6,-8]]},"animation.skitty.recoil@0.75":{"target":[[0,6,-8]]},"animation.skitty.battle_cry@1.25":{"target":[[-0.5,7,-13]]},"animation.skitty.battle_cry@2":{"target":[[0,6,-13.3]]}},"mawile":{"animation.mawile.cry@1.25":{"target":[[0,9,-8]]},"animation.mawile.cry@2":{"target":[[0,9,-8]]}},"plusle":{"animation.plusle.special@1.2":{"target":[[0,17.39,-1.37]],"special":[[0,28.08,-6.27]],"middle":[[0,21.23,-4.58]]},"animation.plusle.special@1.25":{"special":[[0.03,21.83,-6.81]],"target":[[0.03,20.68,5.16]],"mouth":[[0.03,24.8,2.96]],"middle":[[0.03,19.66,0.26]],"hand_primary":[[-2.4,22.99,2.65]]},"animation.plusle.special@1.85":{"target":[[0,25.39,-5.75]],"middle":[[0,25.39,-0.75]]},"animation.plusle.special@0.8":{"special":[[0,13.39,-0.23]],"target":[[0,26.34,3.41]]},"animation.plusle.special@1.35":{"special":[[-0.01,18.89,-2.93]],"target":[[0.02,28.28,5.4]]},"animation.plusle.special@1.45":{"target":[[-0.24,31.99,-1.05]],"middle":[[-0.24,28.61,2.63]],"face":[[-0.25,31.98,0.44]]},"animation.plusle.special@1.95":{"target":[[0,16.96,-5.75]]},"animation.plusle.special@1.55":{"middle":[[0.48,29.39,1.03]],"target":[[0.48,31.17,-3.64]]},"animation.plusle.special@1.3":{"special":[[-0.13,19.84,-5.17]],"target":[[-0.13,24.38,6.32]]},"animation.plusle.special@3.1":{"target":[[0,10.49,-5.39]]},"animation.plusle.special@1.5":{"target":[[-0.22,31.81,-2.59]],"middle":[[-0.22,29.32,1.74]]},"animation.plusle.special@1.75":{"target":[[0.09,26.92,-5.75]]},"animation.plusle.special@1.65":{"target":[[-0.31,28.54,-5.48]]},"animation.plusle.special@1.6":{"target":[[-0.04,30.22,-4.61]],"middle":[[-0.04,29.18,0.29]]},"animation.plusle.special@0.5":{"middle":[[0,13.75,-2.62]]},"animation.plusle.special@1.8":{"middle":[[-0.11,26.08,-0.75]]},"animation.plusle.special@0.4":{"middle":[[0,7.16,-1.74]]},"animation.plusle.special@0.7":{"special":[[0,23.95,-5.58]],"target":[[0,11.94,1.15]]},"animation.plusle.special@0.55":{"middle":[[0,16.99,-3.38]]},"animation.plusle.special@0.65":{"eye":[[-2.75,10.87,-1.42],[2.75,10.87,-1.42]]},"animation.plusle.special@1.7":{"target":[[0.18,27.63,-5.75]]},"animation.plusle.special@2":{"target":[[0,11.6,-5.75]]},"animation.plusle.special@1":{"middle":[[0,20.68,3.7]]},"animation.plusle.special@1.1":{"special":[[0,26.17,5.7]],"target":[[0,28.1,-6.28]]},"animation.plusle.special@0.15":{"hand_primary":[[-6.08,9.09,0.86]],"target":[[0,10.51,-5.37]]},"animation.plusle.special@0.3":{"hand_secondary":[[5.73,6.18,-0.52]]},"animation.plusle.special@3.9":{"target":[[0,18.76,-6.92]]},"animation.plusle.status@1.15":{"mouth":[[-3.47,8.64,-5.2]],"target":[[-2.44,8.05,-5.75]]},"animation.plusle.status@1.25":{"middle":[[-2.44,8.16,-0.75]],"special":[[-0.94,0.46,0.68]],"target":[[-2.44,8.16,-5.75]]},"animation.plusle.status@1.3":{"middle":[[-2.42,8.22,-0.75]]},"animation.plusle.status@1.2":{"target":[[-2.44,8.07,-5.75]]},"animation.plusle.status@0.5":{"middle":[[2.44,8.23,-0.75]],"target":[[2.44,8.23,-5.75]]},"animation.plusle.status@1.35":{"eye":[[-5.92,10.29,-5.73],[-0.53,11.32,-6.07]],"target":[[-2.33,8.18,-5.75]]},"animation.plusle.status@1":{"middle":[[-2.19,10.38,-0.75]]},"animation.plusle.recoil@0.3":{"hand_primary":[[-5.18,8.15,0.2]]},"animation.plusle.recoil@0.45":{"hand_primary":[[-5.35,5.86,-0.61]]}},"minun":{"animation.minun.special@1.2":{"target":[[0,17.39,-1.37]],"special":[[0,28.08,-6.27]],"middle":[[0,21.23,-4.58]]},"animation.minun.special@1.25":{"special":[[0.03,21.83,-6.81]],"target":[[0.03,20.68,5.16]],"mouth":[[0.03,24.8,2.96]],"middle":[[0.03,19.66,0.26]],"hand_primary":[[-2.4,22.99,2.65]]},"animation.minun.special@1.85":{"target":[[0,25.39,-5.75]],"middle":[[0,25.39,-0.75]]},"animation.minun.special@0.8":{"special":[[0,13.39,-0.23]],"target":[[0,26.34,3.41]]},"animation.minun.special@1.35":{"special":[[-0.01,18.89,-2.93]],"target":[[0.02,28.28,5.4]]},"animation.minun.special@1.45":{"target":[[-0.24,31.99,-1.05]],"middle":[[-0.24,28.61,2.63]],"face":[[-0.25,31.98,0.44]]},"animation.minun.special@1.95":{"target":[[0,16.96,-5.75]]},"animation.minun.special@1.55":{"middle":[[0.48,29.39,1.03]],"target":[[0.48,31.17,-3.64]]},"animation.minun.special@1.3":{"special":[[-0.13,19.84,-5.17]],"target":[[-0.13,24.38,6.32]]},"animation.minun.special@3.1":{"target":[[0,10.49,-5.39]]},"animation.minun.special@1.5":{"target":[[-0.22,31.81,-2.59]],"middle":[[-0.22,29.32,1.74]]},"animation.minun.special@1.75":{"target":[[0.09,26.92,-5.75]]},"animation.minun.special@1.65":{"target":[[-0.31,28.54,-5.48]]},"animation.minun.special@1.6":{"target":[[-0.04,30.22,-4.61]],"middle":[[-0.04,29.18,0.29]]},"animation.minun.special@0.5":{"middle":[[0,13.75,-2.62]]},"animation.minun.special@1.8":{"middle":[[-0.11,26.08,-0.75]]},"animation.minun.special@0.4":{"middle":[[0,7.16,-1.74]]},"animation.minun.special@0.7":{"special":[[0,23.95,-5.58]],"target":[[0,11.94,1.15]]},"animation.minun.special@0.55":{"middle":[[0,16.99,-3.38]]},"animation.minun.special@0.65":{"eye":[[-2.75,10.87,-1.42],[2.75,10.87,-1.42]]},"animation.minun.special@1.7":{"target":[[0.18,27.63,-5.75]]},"animation.minun.special@2":{"target":[[0,11.6,-5.75]]},"animation.minun.special@1":{"middle":[[0,20.68,3.7]]},"animation.minun.special@1.1":{"special":[[0,26.17,5.7]],"target":[[0,28.1,-6.28]]},"animation.minun.special@0.15":{"hand_primary":[[-6.08,9.09,0.86]],"target":[[0,10.51,-5.37]]},"animation.minun.special@0.3":{"hand_secondary":[[5.73,6.18,-0.52]]},"animation.minun.special@3.9":{"target":[[0,18.76,-6.92]]},"animation.minun.status@1.15":{"mouth":[[-3.47,8.64,-5.2]],"target":[[-2.44,8.05,-5.75]]},"animation.minun.status@1.25":{"middle":[[-2.44,8.16,-0.75]],"special":[[-0.94,0.46,0.68]],"target":[[-2.44,8.16,-5.75]]},"animation.minun.status@1.3":{"middle":[[-2.42,8.22,-0.75]]},"animation.minun.status@1.2":{"target":[[-2.44,8.07,-5.75]]},"animation.minun.status@0.5":{"middle":[[2.44,8.23,-0.75]],"target":[[2.44,8.23,-5.75]]},"animation.minun.status@1.35":{"eye":[[-5.92,10.29,-5.73],[-0.53,11.32,-6.07]],"target":[[-2.33,8.18,-5.75]]},"animation.minun.status@1":{"middle":[[-2.19,10.38,-0.75]]},"animation.minun.recoil@0.3":{"hand_primary":[[-5.18,8.15,0.2]]},"animation.minun.recoil@0.45":{"hand_primary":[[-5.35,5.86,-0.61]]}},"wailmer":{"animation.wailmer.cry@1.25":{"target":[[-0.19,8.26,-9.89]]},"animation.wailmer.cry@2":{"target":[[0,6.19,-10.39]]}},"spinda":{"animation.spinda.special@0.65":{"eye":[[5.53,19.29,10.86],[9.38,14.37,7.81]]},"animation.spinda.status@1.35":{"eye":[[-1.33,25.09,-9.5],[-7.39,23.35,-6.57]]}},"cacnea":{"animation.cacnea.special@1.2":{"target":[[0,16.6,-5.95]],"special":[[-0.04,15.57,-5.34]],"middle":[[0,16.56,0.05]]},"animation.cacnea.special@1.25":{"special":[[-0.14,15.48,-5.4]],"target":[[0,16.67,-5.91]],"mouth":[[-0.14,15.48,-5.4]],"middle":[[0,16.6,0.09]],"hand_primary":[[-9.99,11.34,-0.37]]},"animation.cacnea.special@1.85":{"target":[[0,16.28,-5.79]],"middle":[[0,16.13,0.2]]},"animation.cacnea.special@2.15":{"target":[[0,15.06,-5.99]]},"animation.cacnea.special@0.8":{"special":[[-0.05,7.66,-4.84]],"target":[[-0.02,8.16,-5.89]]},"animation.cacnea.special@1.35":{"special":[[-0.29,15.48,-5.39]],"target":[[0,16.77,-5.84]]},"animation.cacnea.special@1.45":{"target":[[0,16.83,-5.77]],"middle":[[0,16.66,0.23]],"face":[[-0.42,17.34,-5.22]]},"animation.cacnea.special@1.95":{"target":[[0,15.94,-5.86]]},"animation.cacnea.special@1.55":{"middle":[[0,16.62,0.3]],"target":[[0,16.84,-5.7]]},"animation.cacnea.special@2.4":{"middle":[[0,8.64,0]]},"animation.cacnea.special@1.3":{"special":[[-0.24,15.71,-5.25]],"target":[[0,16.72,-5.88]]},"animation.cacnea.special@3.1":{"target":[[-0.06,8.43,-5.67]]},"animation.cacnea.special@2.25":{"target":[[0,13.74,-6]]},"animation.cacnea.special@1.5":{"target":[[0,16.84,-5.74]],"middle":[[0,16.64,0.26]]},"animation.cacnea.special@1.75":{"target":[[0,16.56,-5.73]]},"animation.cacnea.special@1.65":{"target":[[0,16.77,-5.66]]},"animation.cacnea.special@2.2":{"target":[[0,14.48,-6]]},"animation.cacnea.special@1.6":{"target":[[0,16.82,-5.66]],"middle":[[0,16.57,0.33]]},"animation.cacnea.special@0":{"special":[[-0.31,7.61,-4.66]],"middle":[[0,7.89,0.35]],"target":[[0,8.15,-5.65]]},"animation.cacnea.special@2.7":{"middle":[[0,8.34,0]]},"animation.cacnea.special@0.5":{"middle":[[-0.8,8.39,0.19]]},"animation.cacnea.special@1.8":{"middle":[[0,16.25,0.24]]},"animation.cacnea.special@0.4":{"middle":[[-0.88,8.44,0.22]]},"animation.cacnea.special@0.7":{"special":[[-0.09,7.85,-4.8]],"target":[[-0.04,8.3,-5.85]]},"animation.cacnea.special@2.5":{"target":[[0,8.13,-6]]},"animation.cacnea.special@0.55":{"middle":[[-0.72,8.34,0.18]]},"animation.cacnea.special@0.65":{"eye":[[2.05,10.49,-4.42],[-2.62,10.18,-4.8]]},"animation.cacnea.special@1.7":{"target":[[0,16.67,-5.7]]},"animation.cacnea.special@2":{"target":[[0,15.74,-5.89]]},"animation.cacnea.special@1":{"middle":[[0,10.13,0.04]]},"animation.cacnea.special@3.3":{"middle":[[-0.86,8.44,0.25]]},"animation.cacnea.special@1.1":{"special":[[0.01,15.29,-4.86]],"target":[[0,15.23,-5.99]]},"animation.cacnea.special@0.15":{"hand_primary":[[-11.73,7.81,-1.31]],"target":[[-0.08,8.53,-5.67]]},"animation.cacnea.special@0.3":{"hand_secondary":[[8.99,10.99,1.7]],"target":[[-0.11,8.71,-5.69]]},"animation.cacnea.special@3.9":{"target":[[-0.01,8.07,-5.93]]},"animation.cacnea.physical@1.25":{"target":[[-4.84,9.8,-2.08]],"middle":[[1.02,9.8,-0.78]]},"animation.cacnea.physical@1.05":{"target":[[-4,8.81,0.59]]},"animation.cacnea.physical@1.2":{"target":[[-0.13,9.9,-2.17]]},"animation.cacnea.physical@1.45":{"target":[[-2.92,9.88,-3.02]]},"animation.cacnea.physical@1.65":{"target":[[-7.17,8.3,-7.68]]},"animation.cacnea.physical@0.1":{"middle":[[0.15,7.7,-0.34]],"hand_primary":[[-10.84,5.23,1.02]],"physical":[[-10.84,5.23,1.02]]},"animation.cacnea.physical@1.3":{"middle":[[2.52,10.56,-2.17]],"target":[[2.59,10.56,3.83]]},"animation.cacnea.physical@0":{"hand_primary":[[-10.7,4.38,0.69]],"physical":[[-10.7,4.38,0.69]],"middle":[[0,8,0]]},"animation.cacnea.physical@1.15":{"target":[[-1.34,9.49,1.49]]},"animation.cacnea.physical@1.5":{"target":[[2.96,8,-0.41]]},"animation.cacnea.physical@1.1":{"target":[[-2.55,9.3,0.87]]},"animation.cacnea.physical@1.35":{"target":[[9.19,10.89,-4.9]]},"animation.cacnea.physical@0.3":{"target":[[-2.05,5.95,-7.57]]},"animation.cacnea.physical@0.5":{"middle":[[-1.64,7.68,-2.27]]},"animation.cacnea.physical@0.8":{"target":[[-6.92,7.41,-2.68]]},"animation.cacnea.physical@0.6":{"target":[[-4.86,5.42,-6.94]]},"animation.cacnea.physical@0.85":{"target":[[-7.04,7.58,-1.81]]},"animation.cacnea.status@0.1":{"middle":[[0,8,0.18]]},"animation.cacnea.status@1.15":{"mouth":[[-0.07,9.67,-0.31]],"special":[[-0.07,9.67,-0.31]],"target":[[0,9.27,-3.76]]},"animation.cacnea.status@1.85":{"target":[[0,3.13,-9.5]]},"animation.cacnea.status@1.25":{"middle":[[0,6.93,-4]],"special":[[-0.55,6.08,-7.35]],"target":[[0,3.93,-9.2]]},"animation.cacnea.status@1.3":{"middle":[[0,6.79,-4.23]]},"animation.cacnea.status@1.2":{"target":[[0,7.68,-6.41]]},"animation.cacnea.status@0.5":{"middle":[[0,7.95,0.9]],"target":[[0,8.62,-5.07]]},"animation.cacnea.status@2.15":{"target":[[0,3.8,-9.25]]},"animation.cacnea.status@0.2":{"target":[[0,8.26,-5.64]]},"animation.cacnea.status@1.35":{"eye":[[1.2,7.73,-8.74],[-3.39,7.93,-7.79]],"target":[[0,3.3,-9.44]]},"animation.cacnea.status@1.65":{"target":[[0,2.67,-9.64]]},"animation.cacnea.status@2.4":{"middle":[[0,7.38,-3.09]]},"animation.cacnea.status@2":{"target":[[0,3.47,-9.38]]},"animation.cacnea.status@2.05":{"target":[[0,3.58,-9.34]]},"animation.cacnea.status@2.2":{"target":[[0,3.91,-9.2]]},"animation.cacnea.status@1":{"middle":[[0,7.8,1.78]]},"animation.cacnea.recoil@0.55":{"target":[[0,8,-6]]},"animation.cacnea.recoil@0.6":{"target":[[0,8,-6]]},"animation.cacnea.recoil@0.65":{"target":[[0,8,-6]]},"animation.cacnea.recoil@0.3":{"hand_primary":[[-11.3,8.37,0.14]],"target":[[0,8,-6]]},"animation.cacnea.recoil@0.45":{"hand_primary":[[-11.46,7.35,0.46]],"target":[[0,8,-6]]},"animation.cacnea.recoil@0.75":{"hand_primary":[[-11.5,7.5,-0.02]],"target":[[0,8,-6]]},"animation.cacnea.cry@1.25":{"target":[[0,8,-6]]},"animation.cacnea.cry@2":{"target":[[0,8,-6]]}},"cacturne":{"animation.cacturne.recoil@0.3":{"hand_primary":[[-13.34,17.6,-0.37]]},"animation.cacturne.recoil@0.45":{"hand_primary":[[-13.43,17.49,-0.17]]},"animation.cacturne.recoil@0.75":{"hand_primary":[[-13.5,17.7,0.07]]}},"zangoose":{"animation.zangoose.cry@1.25":{"target":[[0,16,-5.5]]},"animation.zangoose.cry@2":{"target":[[0,16,-5.5]]}},"lunatone":{"animation.lunatone.special@0.65":{"eye":[[3.43,16.15,6.29],[5.99,14.62,14.57]]},"animation.lunatone.status@1.35":{"eye":[[1.69,22.65,2.64],[-6.98,22.82,1.14]]}},"solrock":{"animation.solrock.special@0.65":{"eye":[[3.02,17.32,1.71],[-3.95,17.5,2.3]]},"animation.solrock.status@1.35":{"eye":[[3.35,29.79,-5.56],[-3.63,30.23,-5.31]]}},"salamence":{"animation.salamence.cry@1.25":{"target":[[0,12.5,-35]]},"animation.salamence.cry@2":{"target":[[0,12.5,-35]]}},"beldum":{"animation.beldum.special@1.2":{"target":[[1.53,15.79,0.07]],"special":[[-1.91,4.75,2.43]],"middle":[[0,11.03,4.91]]},"animation.beldum.special@1.25":{"special":[[-0.2,10.18,-5.15]],"target":[[2.25,17.02,4.14]],"middle":[[0,10.85,1.83]]},"animation.beldum.special@1.85":{"target":[[0.06,18.41,2.58]]},"animation.beldum.special@2.15":{"target":[[0,18.54,2.74]]},"animation.beldum.special@0.8":{"special":[[-0.45,11.83,11.71]],"target":[[-0.7,12.76,-0.05]]},"animation.beldum.special@1.35":{"special":[[-0.27,10.24,-7.8]],"target":[[1.74,17.92,0.98]]},"animation.beldum.special@1.45":{"target":[[1.19,18.35,0.77]],"middle":[[0,11.67,-0.8]],"face":[[0.77,16.12,0.95]]},"animation.beldum.special@1.95":{"target":[[0,18.42,2.72]]},"animation.beldum.special@1.55":{"middle":[[0,11.79,-0.62]],"target":[[0.78,18.53,0.95]]},"animation.beldum.special@1.3":{"special":[[-0.24,10.38,-8.03]],"target":[[2,17.65,1.08]]},"animation.beldum.special@2.25":{"target":[[0,18.2,2.67]]},"animation.beldum.special@1.5":{"target":[[0.91,18.49,0.67]],"middle":[[0,11.73,-0.71]]},"animation.beldum.special@1.75":{"target":[[0.29,18.54,2.05]]},"animation.beldum.special@1.65":{"target":[[0.53,18.57,1.51]]},"animation.beldum.special@2.2":{"target":[[0,18.41,2.71]]},"animation.beldum.special@1.6":{"target":[[0.66,18.56,1.23]],"middle":[[0,11.85,-0.53]]},"animation.beldum.special@0.5":{"middle":[[0,13.49,3.75]]},"animation.beldum.special@0.4":{"middle":[[0,13.54,2.72]]},"animation.beldum.special@0.7":{"special":[[-0.01,8.47,8.38]],"target":[[-0.67,14.83,-1.53]]},"animation.beldum.special@2.5":{"target":[[-0.01,16.95,1.33]]},"animation.beldum.special@0.55":{"middle":[[0,13.47,4.27]]},"animation.beldum.special@0.65":{"eye":[[-0.44,18.21,1.38]]},"animation.beldum.special@1.7":{"target":[[0.41,18.59,1.78]]},"animation.beldum.special@2":{"target":[[0,18.45,2.72]]},"animation.beldum.special@1":{"middle":[[0,16.87,6.58]]},"animation.beldum.special@3.3":{"middle":[[0,13.6,1.69]]},"animation.beldum.special@1.1":{"special":[[-0.53,15.07,13.34]],"target":[[-1.14,11.71,2.05]]},"animation.beldum.special@0.15":{"target":[[-0.12,14.39,-5.85]]},"animation.beldum.special@0.3":{"target":[[-0.44,15.86,-4.88]]},"animation.beldum.special@3.9":{"target":[[-1.14,11.71,2.05]]},"animation.beldum.physical@1.25":{"target":[[-9.34,16.03,-13.98]],"middle":[[-9,13.58,-7.47]]},"animation.beldum.physical@1.05":{"target":[[-0.96,17.22,0.09]]},"animation.beldum.physical@1.2":{"target":[[-7.35,16.75,-10.2]]},"animation.beldum.physical@1.45":{"target":[[9.11,8.73,-21.77]]},"animation.beldum.physical@1.65":{"target":[[6.85,8.59,-20.14]]},"animation.beldum.physical@0.1":{"middle":[[1,10.91,1.34]],"physical":[[1.9,4.72,4.53]]},"animation.beldum.physical@1.3":{"middle":[[6.09,9.8,-20.8]],"target":[[5.74,12.27,-27.3]]},"animation.beldum.physical@1.15":{"target":[[-5.36,17.47,-6.42]]},"animation.beldum.physical@1.5":{"target":[[8.76,8.55,-21.17]]},"animation.beldum.physical@1.1":{"target":[[-3.37,18.19,-2.63]]},"animation.beldum.physical@1.35":{"target":[[6.86,11.09,-25.46]]},"animation.beldum.physical@0.3":{"target":[[2.69,13.13,-2.46]]},"animation.beldum.physical@0.5":{"middle":[[4.41,10.35,6.75]]},"animation.beldum.physical@0.8":{"target":[[5.47,12.47,4.35]]},"animation.beldum.physical@0.6":{"target":[[4.58,12.66,1.6]]},"animation.beldum.physical@0.85":{"target":[[5.69,12.42,5.04]]},"animation.beldum.status@1.15":{"special":[[-0.4,5.09,0.26]],"target":[[-0.74,15.26,-5.72]]},"animation.beldum.status@1.85":{"target":[[0,9.44,-6.57]]},"animation.beldum.status@1.25":{"middle":[[0.14,6.9,-0.14]],"special":[[0.04,-0.1,0.36]],"target":[[0.18,9.4,-6.64]]},"animation.beldum.status@1.3":{"middle":[[0.44,6.9,0]]},"animation.beldum.status@1.2":{"target":[[-0.1,10.32,-6.36]]},"animation.beldum.status@0.5":{"middle":[[0,8.98,0]],"target":[[-0.18,12.05,-6.25]]},"animation.beldum.status@2.15":{"target":[[-0.04,12.49,-6.29]]},"animation.beldum.status@1.35":{"eye":[[1.42,11.86,-2.39]],"target":[[0.63,9.82,-5.84]]},"animation.beldum.status@1.65":{"target":[[0.33,9.32,-6.8]]},"animation.beldum.status@2":{"target":[[0,9.27,-6.85]]},"animation.beldum.status@2.05":{"target":[[-0.01,9.5,-6.47]]},"animation.beldum.status@1":{"middle":[[-0.79,12.4,0.28]]},"animation.beldum.recoil@0.55":{"target":[[0,8.37,-7.57]]},"animation.beldum.recoil@0.6":{"target":[[-0.01,8.14,-7.64]]},"animation.beldum.recoil@0.65":{"target":[[-0.02,7.91,-7.71]]},"animation.beldum.recoil@0.3":{"target":[[-0.03,9.51,-7.13]]},"animation.beldum.recoil@0.45":{"target":[[0,8.83,-7.41]]},"animation.beldum.recoil@0.75":{"target":[[-0.02,7.78,-7.86]]},"animation.beldum.battle_cry@1.25":{"target":[[0.18,9.4,-6.64]]},"animation.beldum.battle_cry@2":{"target":[[0,9.27,-6.85]]}},"metang":{"animation.metang.special@1.2":{"target":[[0,12.25,-12.63]],"special":[[0.21,13.83,-12.51]],"middle":[[0,16.25,-0.63]]},"animation.metang.special@1.25":{"special":[[0.22,15.65,-13.13]],"target":[[0,11.28,-13.42]],"middle":[[0,15.28,-1.42]],"hand_primary":[[-4.84,13.67,-11.01]]},"animation.metang.special@1.85":{"target":[[0,10.46,-13.68]],"middle":[[0,14.46,-1.68]]},"animation.metang.special@2.15":{"target":[[0,10.5,-13.14]]},"animation.metang.special@0.8":{"special":[[-0.32,17.6,-4.14]],"target":[[-0.51,13.18,-4.44]]},"animation.metang.special@1.95":{"target":[[0,10.5,-13.61]]},"animation.metang.special@1.55":{"middle":[[0,14.37,-1.25]],"target":[[0,10.37,-13.24]]},"animation.metang.special@1.3":{"special":[[0.2,14.44,-13.21]],"target":[[0,10.48,-13.42]]},"animation.metang.special@1.75":{"target":[[0,10.43,-13.76]]},"animation.metang.special@1.65":{"target":[[0,10.39,-13.84]]},"animation.metang.special@2.2":{"target":[[0,10.5,-13.02]]},"animation.metang.special@1.6":{"target":[[0,10.38,-13.65]],"middle":[[0,14.38,-1.66]]},"animation.metang.special@0.5":{"middle":[[-0.36,14.81,4.68]]},"animation.metang.special@1.8":{"middle":[[0,14.44,-1.72]]},"animation.metang.special@0.4":{"middle":[[-0.14,14.62,2.89]]},"animation.metang.special@0.7":{"special":[[0.44,14.1,-3.6]],"target":[[-0.78,11.18,-3.75]]},"animation.metang.special@0.55":{"middle":[[-0.46,14.9,5.57]]},"animation.metang.special@0.65":{"eye":[[3.47,16.58,2.07],[-3,16.59,1.41]]},"animation.metang.special@1.7":{"target":[[0,10.41,-13.8]]},"animation.metang.special@2":{"target":[[0,10.5,-13.5]]},"animation.metang.special@1":{"middle":[[0,19.95,5.82]]},"animation.metang.special@3.3":{"middle":[[0,14.5,1.53]]},"animation.metang.special@1.1":{"special":[[-0.11,18.74,-6.53]],"target":[[0,14.39,-6.84]]},"animation.metang.special@0.15":{"hand_primary":[[-9.04,7.82,-10]]},"animation.metang.special@0.3":{"hand_secondary":[[7.84,7.39,-9.76]],"target":[[0,10.5,-10.47]]},"animation.metang.special@3.9":{"target":[[-0.19,15.34,-5.36]]},"animation.metang.physical@1.25":{"target":[[0,10.08,-17.06]],"middle":[[0,14.49,-5.2]]},"animation.metang.physical@1.05":{"target":[[0.09,14.46,-1.12]]},"animation.metang.physical@1.2":{"target":[[-0.01,15.36,-6.41]]},"animation.metang.physical@1.45":{"target":[[0,10.19,-17.12]]},"animation.metang.physical@1.65":{"target":[[0,10.49,-16.74]]},"animation.metang.physical@0.1":{"hand_primary":[[-11.13,7.57,-10.33]],"physical":[[-11.13,7.57,-10.33]]},"animation.metang.physical@1.3":{"middle":[[0,14.29,-5.62]],"target":[[0,10.19,-17.59]]},"animation.metang.physical@1.15":{"target":[[-0.02,15.34,-3.02]]},"animation.metang.physical@1.5":{"target":[[0,10.09,-17.17]]},"animation.metang.physical@1.1":{"target":[[-0.01,15.14,-0.65]]},"animation.metang.physical@1.35":{"target":[[0,10.56,-16.32]]},"animation.metang.physical@0.5":{"middle":[[-0.46,14.52,1.69]]},"animation.metang.physical@0.8":{"target":[[0.69,12.55,-6.66]]},"animation.metang.physical@0.6":{"target":[[-0.04,11.55,-9.46]]},"animation.metang.physical@0.85":{"target":[[0.62,12.92,-5.47]]},"animation.metang.status@0.1":{"middle":[[0,13.49,0]]},"animation.metang.status@1.15":{"target":[[0,9.46,-11.91]]},"animation.metang.status@1.85":{"target":[[0,12.5,-12.27]]},"animation.metang.status@1.25":{"special":[[0.57,18.79,-10.78]]},"animation.metang.status@1.3":{"middle":[[0.06,15.45,-0.83]]},"animation.metang.status@0.5":{"middle":[[0,22.09,2]],"target":[[0,18.09,-10]]},"animation.metang.status@0.2":{"target":[[0,8.48,-12]]},"animation.metang.status@1.35":{"eye":[[3.43,20.16,-4.67],[-3.07,20.1,-4.57]],"target":[[-0.12,12.34,-13.14]]},"animation.metang.status@1.65":{"target":[[-0.07,12.86,-12.64]]},"animation.metang.status@2.4":{"middle":[[0,13,0]]},"animation.metang.status@1":{"middle":[[0,17.07,0.89]]},"animation.metang.recoil@0.3":{"hand_primary":[[-16.53,6.48,-3.73]],"target":[[0,11.53,-11.02]]},"animation.metang.recoil@0.45":{"hand_primary":[[-15.65,5.31,-4.63]]},"animation.metang.recoil@0.75":{"hand_primary":[[-15.71,2.64,-4.87]]}},"metagross":{"animation.metagross.special@1.2":{"special":[[-0.39,9.97,-9.75]]},"animation.metagross.special@1.25":{"special":[[-0.18,11.63,-10.8]],"mouth":[[-0.18,11.63,-10.8]]},"animation.metagross.special@0.8":{"special":[[0.26,8.64,-5.6]]},"animation.metagross.special@1.35":{"special":[[-0.05,13.62,-11.65]]},"animation.metagross.special@1.45":{"face":[[0,21.04,-16.41]]},"animation.metagross.special@1.3":{"special":[[-0.06,13.56,-11.44]]},"animation.metagross.special@0.7":{"special":[[0.48,8.92,-5.96]]},"animation.metagross.special@0.65":{"eye":[[6.15,16.72,-8.83],[-4.84,16.69,-9.39]]},"animation.metagross.special@1.1":{"special":[[-0.39,8.18,-7.17]]},"animation.metagross.status@1.15":{"mouth":[[0.67,11.13,-9.42]],"special":[[0.67,11.13,-9.42]]},"animation.metagross.status@1.25":{"special":[[0.61,12.52,-9.79]]},"animation.metagross.status@1.35":{"eye":[[4.85,22.73,-10.71],[-6.14,22.14,-10.69]]},"animation.metagross.recoil@0.55":{"target":[[0,25.5,-19]]},"animation.metagross.recoil@0.6":{"target":[[0,25.5,-19]]},"animation.metagross.recoil@0.65":{"target":[[0,25.5,-19]]},"animation.metagross.recoil@0.3":{"hand_primary":[[-26.68,5,-6.75],[-26.68,5,6.75]],"target":[[0,25.5,-19]]},"animation.metagross.recoil@0.45":{"hand_primary":[[-26.68,5,-6.75],[-26.68,5,6.75]],"target":[[0,25.5,-19]]},"animation.metagross.recoil@0.75":{"hand_primary":[[-26.68,5,-6.75],[-26.68,5,6.75]],"target":[[0,25.5,-19]]}},"infernape":{"animation.infernape.cry@1.25":{"target":[[0,32,-10]]},"animation.infernape.cry@2":{"target":[[0,32,-10]]}},"piplup":{"animation.piplup.cry@1.25":{"target":[[0,7.75,-6.75]]},"animation.piplup.cry@2":{"target":[[0,7.75,-6.75]]}},"prinplup":{"animation.prinplup.recoil@0.55":{"target":[[0,14,-7]]},"animation.prinplup.recoil@0.6":{"target":[[0,14,-7]]},"animation.prinplup.recoil@0.65":{"target":[[0,14,-7]]},"animation.prinplup.recoil@0.3":{"target":[[0,14,-7]]},"animation.prinplup.recoil@0.45":{"target":[[0,14,-7]]},"animation.prinplup.recoil@0.75":{"target":[[0,14,-7]]},"animation.prinplup.cry@1.25":{"target":[[0,14,-7]]},"animation.prinplup.cry@2":{"target":[[0,14,-7]]}},"empoleon":{"animation.empoleon.recoil@0.55":{"target":[[0,27,-10]]},"animation.empoleon.recoil@0.6":{"target":[[0,27,-10]]},"animation.empoleon.recoil@0.65":{"target":[[0,27,-10]]},"animation.empoleon.recoil@0.3":{"hand_primary":[[-28.25,28.5,0]],"target":[[0,27,-10]]},"animation.empoleon.recoil@0.45":{"hand_primary":[[-28.25,28.5,0]],"target":[[0,27,-10]]},"animation.empoleon.recoil@0.75":{"hand_primary":[[-28.25,28.5,0]],"target":[[0,27,-10]]}},"lopunny":{"animation.lopunny.cry@1.25":{"target":[[0,24,-7]]},"animation.lopunny.cry@2":{"target":[[0,24,-7]]}},"bronzong":{"animation.bronzong.physical@1.25":{"target":[[-0.06,7.62,1.4]],"middle":[[-0.5,15.87,11.54]]},"animation.bronzong.physical@1.05":{"target":[[-0.04,19.16,21.86]]},"animation.bronzong.physical@1.2":{"target":[[-0.24,8.63,7.38]]},"animation.bronzong.physical@1.45":{"target":[[-1.05,28.46,-25.81]]},"animation.bronzong.physical@1.65":{"target":[[-2.6,27.47,-25.47]]},"animation.bronzong.physical@0.1":{"middle":[[0,13.19,5.4]],"hand_primary":[[-26.06,17.13,1.54]],"physical":[[0,2.9,2.06]]},"animation.bronzong.physical@1.3":{"middle":[[-0.31,13.53,6.58]],"target":[[0.25,8.12,-5.33]]},"animation.bronzong.physical@0":{"hand_primary":[[-24.34,15.39,-0.32]],"physical":[[0,3.38,-5.82]]},"animation.bronzong.physical@1.15":{"target":[[-0.29,10.99,12.98]]},"animation.bronzong.physical@1.5":{"target":[[-1.82,38.58,-25.96]]},"animation.bronzong.physical@1.1":{"target":[[-0.22,14.56,17.89]]},"animation.bronzong.physical@1.35":{"target":[[0.27,12.03,-14.67]]},"animation.bronzong.physical@0.3":{"target":[[0,8.38,6.47]]},"animation.bronzong.physical@0.5":{"middle":[[0,27.62,20.53]]},"animation.bronzong.physical@0.8":{"target":[[0,20.79,22.88]]},"animation.bronzong.physical@0.6":{"target":[[0,19.92,22.36]]},"animation.bronzong.physical@0.85":{"target":[[0,20.63,22.79]]},"animation.bronzong.status@0.1":{"middle":[[-0.9,12.84,0.9]]},"animation.bronzong.status@1.15":{"special":[[-1.27,13.66,-10.33]],"target":[[-0.95,22.26,-16.3]]},"animation.bronzong.status@1.85":{"target":[[0.28,21.64,-16.36]]},"animation.bronzong.status@1.25":{"middle":[[-0.53,21.96,-4.01]],"special":[[-1.03,14.1,-11.43]],"target":[[-0.51,22.91,-17.06]]},"animation.bronzong.status@1.3":{"middle":[[-0.32,22.06,-4.4]]},"animation.bronzong.status@1.2":{"target":[[-0.73,22.58,-16.68]]},"animation.bronzong.status@0.5":{"middle":[[-0.83,15.31,0.72]],"target":[[-0.91,13.37,-12.22]]},"animation.bronzong.status@2.15":{"target":[[-0.17,14.77,-13.31]]},"animation.bronzong.status@0.2":{"target":[[-2.01,10.68,-11.03]]},"animation.bronzong.status@1.35":{"eye":[[5.68,22.44,-15.01],[-6.32,22.49,-15.01]],"target":[[-0.09,23.6,-17.8]]},"animation.bronzong.status@1.65":{"target":[[0.52,24.13,-18.22]]},"animation.bronzong.status@2.4":{"middle":[[-0.36,12.12,0.92]]},"animation.bronzong.status@2":{"target":[[0.06,18.15,-14.87]]},"animation.bronzong.status@2.05":{"target":[[-0.01,17.01,-14.36]]},"animation.bronzong.status@2.2":{"target":[[-0.26,13.67,-12.78]]},"animation.bronzong.status@1":{"middle":[[-0.35,20.78,-2.69]]},"animation.bronzong.recoil@0.65":{"target":[[0,11.9,-14.48]]},"animation.bronzong.recoil@0.3":{"hand_primary":[[-32.1,24,2.36]],"target":[[0,8.63,-7.36]]},"animation.bronzong.recoil@0.45":{"hand_primary":[[-32.04,23.96,1.05]],"target":[[0,9.77,-10.53]]},"animation.bronzong.recoil@0.75":{"target":[[0,12.39,-15.2]]},"animation.bronzong.battle_cry@1.25":{"target":[[-0.51,22.91,-17.06]]},"animation.bronzong.battle_cry@2":{"target":[[0.06,18.15,-14.87]]}},"happiny":{"animation.happiny.special@1.25":{"hand_primary":[[-3.61,7.8,-5.58]]},"animation.happiny.special@0.8":{"special":[[0,9.39,-3.06]]},"animation.happiny.special@1.1":{"special":[[0,9.67,-2.86]]},"animation.happiny.physical@1.25":{"target":[[0,7,-13.2]],"middle":[[0,7,-6.2]]},"animation.happiny.physical@1.05":{"target":[[0,8.92,-11.02]]},"animation.happiny.physical@1.2":{"target":[[0,7.2,-13.06]]},"animation.happiny.physical@1.45":{"target":[[0,7,-13.2]]},"animation.happiny.physical@1.65":{"target":[[0,7,-13.2]]},"animation.happiny.physical@1.3":{"middle":[[0,7,-6.2]],"target":[[0,7,-13.2]]},"animation.happiny.physical@1.15":{"target":[[0,8.41,-12.24]]},"animation.happiny.physical@1.5":{"target":[[0,7,-13.2]]},"animation.happiny.physical@1.1":{"target":[[0,8.99,-11.56]]},"animation.happiny.physical@1.35":{"target":[[0,7,-13.2]]},"animation.happiny.physical@0.8":{"target":[[0,7.94,-8.17]]},"animation.happiny.physical@0.85":{"target":[[0,8.45,-8.81]]},"animation.happiny.recoil@0.3":{"hand_primary":[[-3.6,7.48,-3.82]]},"animation.happiny.recoil@0.45":{"hand_primary":[[-3.46,6.8,-4.13]]}},"gabite":{"animation.gabite.cry@1.25":{"target":[[0,14,-8]]},"animation.gabite.cry@2":{"target":[[0,14,-8]]}},"garchomp":{"animation.garchomp.special@1.2":{"special":[[2.28,18.32,-24.82]]},"animation.garchomp.special@1.25":{"special":[[3.17,25.69,-26.98]],"mouth":[[3.17,25.69,-26.98]],"hand_primary":[[-14.72,14.89,-27.43]]},"animation.garchomp.special@0.8":{"special":[[1,22.91,-21.2]]},"animation.garchomp.special@1.35":{"special":[[3.72,30.61,-29.39]]},"animation.garchomp.special@1.45":{"face":[[3.66,35.58,-30.4]]},"animation.garchomp.special@1.3":{"special":[[3.51,29.67,-28.47]]},"animation.garchomp.special@0.7":{"special":[[9.88,39.5,-14.72]]},"animation.garchomp.special@0.65":{"eye":[[12.55,42.55,-10.7],[7.49,42.61,-12.96]]},"animation.garchomp.special@1.1":{"special":[[-2.35,13.75,-18.28]]},"animation.garchomp.special@0.15":{"hand_primary":[[-10.04,27.49,-21.61]]},"animation.garchomp.special@0.3":{"hand_secondary":[[26.23,24.58,3.77]]},"animation.garchomp.physical@1.25":{"target":[[0.58,20.06,-14.37]],"middle":[[-1.37,22.7,-5.99]]},"animation.garchomp.physical@1.05":{"target":[[1.65,19.94,-7.2]]},"animation.garchomp.physical@1.2":{"target":[[1.05,19.5,-12.01]]},"animation.garchomp.physical@1.45":{"target":[[0.96,19.58,-13.44]]},"animation.garchomp.physical@1.65":{"target":[[1.35,19.11,-12.5]]},"animation.garchomp.physical@0.1":{"hand_primary":[[-5.36,19.34,-23.97]],"physical":[[-5.36,19.34,-23.97]]},"animation.garchomp.physical@1.3":{"middle":[[-1.27,22.58,-5.76]],"target":[[0.68,19.94,-14.14]]},"animation.garchomp.physical@0":{"hand_primary":[[-7.98,21.84,-22.42]],"physical":[[-7.98,21.84,-22.42]]},"animation.garchomp.physical@1.15":{"target":[[1.37,19.73,-9.01]]},"animation.garchomp.physical@1.5":{"target":[[1.06,19.47,-13.2]]},"animation.garchomp.physical@1.35":{"target":[[0.77,19.82,-13.91]]},"animation.garchomp.physical@0.3":{"target":[[1.95,19.01,-8.03]]},"animation.garchomp.physical@0.5":{"middle":[[0.02,21.76,0.92]]},"animation.garchomp.physical@0.8":{"target":[[1.95,19.93,-6.67]]},"animation.garchomp.physical@0.6":{"target":[[1.96,19.32,-7.19]]},"animation.garchomp.physical@0.85":{"target":[[1.95,20.08,-6.54]]},"animation.garchomp.status@1.15":{"mouth":[[-2.18,16.13,-27.83]],"special":[[-2.18,16.13,-27.83]],"target":[[0.68,20.13,-16.52]]},"animation.garchomp.status@1.85":{"target":[[-1.24,20.08,-24.22]]},"animation.garchomp.status@1.25":{"middle":[[0,22.8,-15.73]],"special":[[-1.53,28.8,-33.79]],"target":[[-1.24,20.08,-24.22]]},"animation.garchomp.status@1.3":{"middle":[[0,22.8,-15.73]]},"animation.garchomp.status@1.2":{"target":[[-0.28,20.07,-20.41]]},"animation.garchomp.status@0.5":{"middle":[[0,20.93,0.18]],"target":[[1.95,18.29,-8.2]]},"animation.garchomp.status@2.15":{"target":[[-0.88,20.07,-22.46]]},"animation.garchomp.status@1.35":{"eye":[[1.22,30.6,-36.62],[-4.32,30.34,-36.72]],"target":[[-1.24,20.08,-24.22]]},"animation.garchomp.status@1.65":{"target":[[-1.24,20.08,-24.22]]},"animation.garchomp.status@2.4":{"middle":[[0,22.85,-9.78]]},"animation.garchomp.status@2":{"target":[[-1.24,20.08,-24.22]]},"animation.garchomp.status@2.05":{"target":[[-1.21,20.08,-24.08]]},"animation.garchomp.status@2.2":{"target":[[-0.71,20.07,-21.64]]},"animation.garchomp.status@1":{"middle":[[0,22.93,-1.32]]},"animation.garchomp.recoil@0.55":{"target":[[0,25,-9]]},"animation.garchomp.recoil@0.6":{"target":[[0,25,-9]]},"animation.garchomp.recoil@0.65":{"target":[[0,25,-9]]},"animation.garchomp.recoil@0.3":{"hand_primary":[[-26.9,37.6,2.75]],"target":[[0,25,-9]]},"animation.garchomp.recoil@0.45":{"hand_primary":[[-27.11,36.97,-0.9]],"target":[[0,25,-9]]},"animation.garchomp.recoil@0.75":{"hand_primary":[[-27.36,33.75,-4.58]],"target":[[0,25,-9]]},"animation.garchomp.cry@1.25":{"target":[[0,25,-9]]},"animation.garchomp.cry@2":{"target":[[0,25,-9]]}},"munchlax":{"animation.munchlax.recoil@0.3":{"hand_primary":[[-9.2,9.34,-1.66]]},"animation.munchlax.recoil@0.45":{"hand_primary":[[-9.11,9.19,-2.09]]},"animation.munchlax.recoil@0.75":{"hand_primary":[[-9.17,8.86,-2.07]]}},"riolu":{"animation.riolu.cry@1.25":{"target":[[0,14,-5.5]]},"animation.riolu.cry@2":{"target":[[0,14,-5.5]]}},"lucario":{"animation.lucario.cry@1.25":{"target":[[0,28,-7]]},"animation.lucario.cry@2":{"target":[[0,28,-7]]}},"croagunk":{"animation.croagunk.special@0.65":{"eye":[[-1.9,11.96,-9.53],[-9.15,11.87,-9.67]]},"animation.croagunk.status@1.35":{"eye":[[5.41,15.61,-11.39],[-1.5,15.35,-12.47]]}},"toxicroak":{"animation.toxicroak.special@0.65":{"eye":[[6.23,22,-15.04],[-3.66,21.55,-14.96]]},"animation.toxicroak.status@1.35":{"eye":[[2.78,16.01,-15.71],[-7.11,16.38,-16.06]]}},"weavile":{"animation.weavile.recoil@0.55":{"target":[[0,11,-6]]},"animation.weavile.recoil@0.6":{"target":[[0,11,-6]]},"animation.weavile.recoil@0.65":{"target":[[0,11,-6]]},"animation.weavile.recoil@0.3":{"hand_primary":[[-10.29,14.58,4.75]],"target":[[0,11,-6]]},"animation.weavile.recoil@0.45":{"hand_primary":[[-10.5,14.72,3.69]],"target":[[0,11,-6]]},"animation.weavile.recoil@0.75":{"hand_primary":[[-10.9,13.98,0.34]],"target":[[0,11,-6]]},"animation.weavile.cry@1.25":{"target":[[0,11,-6]]},"animation.weavile.cry@2":{"target":[[0,11,-6]]}},"rhyperior":{"animation.rhyperior.special@0.65":{"eye":[[11.76,40.01,-7.12],[-4.01,42.19,-8.73]]},"animation.rhyperior.status@1.35":{"eye":[[9.98,45.89,-6.19],[-6,46.3,-5.61]]}},"togekiss":{"animation.togekiss.special@1.2":{"target":[[-0.4,43.71,-44.41]],"special":[[5.05,10.42,-27.7],[-0.65,42.9,-43.98]],"middle":[[-0.4,27.36,-39.75]]},"animation.togekiss.special@1.25":{"special":[[7.75,9.01,-39.99],[0.4,44.98,-42.63]],"target":[[0.25,45.8,-43.08]],"mouth":[[0.4,44.98,-42.63]],"middle":[[0.25,29.14,-39.66]],"hand_primary":[[7.75,9.01,-39.99]]},"animation.togekiss.special@1.85":{"target":[[-0.5,68.84,-16.01]],"middle":[[-0.5,55.62,-26.69]]},"animation.togekiss.special@2.15":{"target":[[0.46,49.53,-3.75]]},"animation.togekiss.special@0.8":{"special":[[3.35,6.72,-9.98],[0.76,16.31,-45.21]],"target":[[0.47,16.2,-46.1]]},"animation.togekiss.special@1.35":{"special":[[-8.17,13.02,-37.07],[-0.25,48.69,-41.8]],"target":[[-0.15,49.59,-41.54]]},"animation.togekiss.special@1.45":{"target":[[0.07,53.14,-38.12]],"middle":[[0.07,36.22,-39.8]],"face":[[-0.06,52.24,-39.13]]},"animation.togekiss.special@1.95":{"target":[[-0.18,63.48,-6.6]]},"animation.togekiss.special@1.55":{"middle":[[0.01,41.34,-38.97]],"target":[[0.01,57.83,-34.82]]},"animation.togekiss.special@2.4":{"middle":[[0,30.69,-0.88]]},"animation.togekiss.special@1.3":{"special":[[-2.85,10.27,-45.65],[0.76,46.78,-42.49]],"target":[[0.46,47.68,-42.48]]},"animation.togekiss.special@3.1":{"target":[[0,17.28,-16.97]]},"animation.togekiss.special@2.25":{"target":[[0,36.39,-2.63]]},"animation.togekiss.special@1.5":{"target":[[0.5,54.85,-37.43]],"middle":[[0.5,38.11,-40.38]]},"animation.togekiss.special@1.75":{"target":[[0.16,68.64,-22.76]]},"animation.togekiss.special@1.65":{"target":[[-0.09,63.01,-27.83]]},"animation.togekiss.special@2.2":{"target":[[0.28,43.97,-3.65]]},"animation.togekiss.special@1.6":{"target":[[-0.5,60.5,-31.34]],"middle":[[-0.5,44.36,-36.67]]},"animation.togekiss.special@0":{"special":[[-22.96,21.67,13.44],[0,15.46,-15.98]]},"animation.togekiss.special@2.7":{"middle":[[0,15.88,2.45]]},"animation.togekiss.special@0.5":{"middle":[[0,17.62,4.06]]},"animation.togekiss.special@1.8":{"middle":[[-0.42,54.85,-29.08]]},"animation.togekiss.special@0.4":{"middle":[[0,17.53,4.43]]},"animation.togekiss.special@0.7":{"special":[[13.16,23.16,-2.94],[-0.2,10.21,-33.86]],"target":[[-0.12,9.59,-34.57]]},"animation.togekiss.special@2.5":{"target":[[0,5.57,-10.06]]},"animation.togekiss.special@0.55":{"middle":[[-0.33,16.98,-1.7]]},"animation.togekiss.special@0.65":{"eye":[[0.04,4.97,-25.39],[3.44,9.3,-27.76]]},"animation.togekiss.special@1.7":{"target":[[0.48,65.78,-25.19]]},"animation.togekiss.special@2":{"target":[[0.1,59.25,-3.6]]},"animation.togekiss.special@1":{"middle":[[-0.19,20.86,-39.24]]},"animation.togekiss.special@1.1":{"special":[[-7.05,3.65,-37.07],[0.5,38.14,-47.23]],"target":[[0.31,39.06,-47.38]]},"animation.togekiss.special@0.15":{"hand_primary":[[-22.69,24.03,17.65]],"target":[[0,14.72,-12.05]]},"animation.togekiss.special@0.3":{"hand_secondary":[[22.33,26.31,16.94]],"target":[[0,13.77,-11.8]]},"animation.togekiss.status@0.1":{"middle":[[0,17.49,-0.45]]},"animation.togekiss.status@1.15":{"mouth":[[0,18.93,-15.51]],"special":[[-25.5,17.72,13.37],[0,18.93,-15.51]],"target":[[0,20.08,-16.4]]},"animation.togekiss.status@1.85":{"target":[[0,22.24,-15.85]]},"animation.togekiss.status@1.25":{"middle":[[0,18.87,0.85]],"special":[[-25.5,18.31,13.79],[0,19.97,-15.17]],"target":[[0,21.08,-16]]},"animation.togekiss.status@1.3":{"middle":[[0,19,1]]},"animation.togekiss.status@1.2":{"target":[[0,20.58,-16.21]]},"animation.togekiss.status@0.5":{"target":[[0,13.76,-17.44]]},"animation.togekiss.status@2.15":{"target":[[0,20.46,-16.6]]},"animation.togekiss.status@0.2":{"target":[[0,13.83,-17.51]]},"animation.togekiss.status@1.35":{"eye":[[3,23.57,-14.34],[-3,23.57,-14.34]],"target":[[0,21.72,-15.78]]},"animation.togekiss.status@1.65":{"target":[[0,22.91,-15.55]]},"animation.togekiss.status@2.4":{"middle":[[0,19.16,-0.09]]},"animation.togekiss.status@2":{"target":[[0,21.36,-16.25]]},"animation.togekiss.status@2.05":{"target":[[0,21.06,-16.37]]},"animation.togekiss.status@2.2":{"target":[[0,20.16,-16.71]]},"animation.togekiss.status@1":{"middle":[[0,18.21,0.11]]},"animation.togekiss.air_recoil@0.55":{"target":[[0,12.49,-17]]},"animation.togekiss.air_recoil@0.6":{"target":[[0,12.44,-17]]},"animation.togekiss.air_recoil@0.65":{"target":[[0,12.39,-17]]},"animation.togekiss.air_recoil@0.3":{"hand_primary":[[-25.49,11.84,12.8]],"target":[[0,12.74,-17]]},"animation.togekiss.air_recoil@0.45":{"hand_primary":[[-25.51,12.71,12.91]],"target":[[0,12.59,-17]]},"animation.togekiss.air_recoil@0.75":{"hand_primary":[[-25.51,13.33,12.93]],"target":[[0,12.29,-17]]},"animation.togekiss.battle_cry@1.25":{"target":[[0,21.08,-16]]},"animation.togekiss.battle_cry@2":{"target":[[0,21.36,-16.25]]}},"mamoswine":{"animation.mamoswine.special@1.2":{"target":[[0,24.5,-42.46]],"special":[[4.23,20.62,-32.8]],"middle":[[0,33.5,-5.46]]},"animation.mamoswine.special@1.25":{"special":[[1.86,21.09,-35.43]],"target":[[0,24.5,-44.7]],"mouth":[[1.86,21.09,-35.43]],"middle":[[0,33.5,-7.7]]},"animation.mamoswine.special@1.85":{"target":[[0,24.05,-45]],"middle":[[0,33.05,-8]]},"animation.mamoswine.special@2.15":{"target":[[0,24.17,-42.86]]},"animation.mamoswine.special@0.8":{"special":[[6.28,45.59,-19.77]]},"animation.mamoswine.special@1.35":{"special":[[1.79,20.58,-35.75]],"target":[[0,23.96,-45]]},"animation.mamoswine.special@1.45":{"target":[[0,23.87,-45]],"middle":[[0,32.87,-8]],"face":[[2.74,39.67,-36.87]]},"animation.mamoswine.special@1.95":{"target":[[0,24.05,-45]]},"animation.mamoswine.special@1.55":{"middle":[[0,33.1,-8]],"target":[[0,24.1,-45]]},"animation.mamoswine.special@2.4":{"middle":[[0,33.38,-2.29]]},"animation.mamoswine.special@1.3":{"special":[[1.84,20.42,-35.72]],"target":[[0,23.43,-45]]},"animation.mamoswine.special@2.25":{"target":[[0,24.26,-41.43]]},"animation.mamoswine.special@1.5":{"target":[[0,24.28,-45]],"middle":[[0,33.28,-8]]},"animation.mamoswine.special@1.75":{"target":[[0,24.05,-45]]},"animation.mamoswine.special@1.65":{"target":[[0,24.05,-45]]},"animation.mamoswine.special@2.2":{"target":[[0,24.21,-42.14]]},"animation.mamoswine.special@1.6":{"target":[[0,24.21,-45]],"middle":[[0,33.21,-8]]},"animation.mamoswine.special@1.8":{"middle":[[0,33.05,-8]]},"animation.mamoswine.special@0.7":{"special":[[5.29,42.12,-22.08]]},"animation.mamoswine.special@0.65":{"eye":[[10.98,59.43,-15.98],[-7.19,57.67,-19.17]]},"animation.mamoswine.special@1.7":{"target":[[0,24.05,-45]]},"animation.mamoswine.special@2":{"target":[[0,24.05,-45]]},"animation.mamoswine.special@1.1":{"special":[[8.5,36.48,-24.56]],"target":[[0,24.5,-38.47]]},"animation.mamoswine.physical@1.25":{"target":[[0,24.5,-47]],"middle":[[0,33.5,-10]]},"animation.mamoswine.physical@1.05":{"target":[[0,24.2,-47]]},"animation.mamoswine.physical@1.2":{"target":[[0,24.5,-47]]},"animation.mamoswine.physical@1.45":{"target":[[0,24.5,-47]]},"animation.mamoswine.physical@1.65":{"target":[[0,24.5,-47]]},"animation.mamoswine.physical@0.1":{"physical":[[-18,30.38,-50.77],[16.52,29.77,-51.22]]},"animation.mamoswine.physical@1.3":{"middle":[[0,33.5,-10]],"target":[[0,24.5,-47]]},"animation.mamoswine.physical@1.15":{"target":[[0,24.5,-47]]},"animation.mamoswine.physical@1.5":{"target":[[0,24.5,-47]]},"animation.mamoswine.physical@1.1":{"target":[[0,24.5,-47]]},"animation.mamoswine.physical@1.35":{"target":[[0,24.5,-47]]},"animation.mamoswine.physical@0.5":{"middle":[[0,33.5,-8.12]]},"animation.mamoswine.physical@0.8":{"target":[[0,23.67,-47]]},"animation.mamoswine.physical@0.6":{"target":[[0,24.5,-47]]},"animation.mamoswine.physical@0.85":{"target":[[0,24.08,-47]]},"animation.mamoswine.status@1.15":{"mouth":[[-1.65,22.94,-27.66]],"special":[[-1.65,22.94,-27.66]],"target":[[0,23.28,-37]]},"animation.mamoswine.status@1.85":{"target":[[0,22.62,-35.46]]},"animation.mamoswine.status@1.25":{"special":[[-1.59,37.27,-25.7]]},"animation.mamoswine.status@2.15":{"target":[[0,23.22,-35.98]]},"animation.mamoswine.status@1.35":{"eye":[[8.89,59.84,-17.17],[-9.62,60.44,-16.25]]},"animation.mamoswine.status@1.65":{"target":[[0,22.78,-35.54]]},"animation.mamoswine.status@2":{"target":[[0,22.5,-35.4]]},"animation.mamoswine.status@2.05":{"target":[[0,22.74,-35.59]]},"animation.mamoswine.status@2.2":{"target":[[0,23.46,-36.17]]},"animation.mamoswine.status@1":{"middle":[[0,31.46,0]]},"animation.mamoswine.battle_cry@2":{"target":[[0,22.5,-35.4]]}},"probopass":{"animation.probopass.special@0.65":{"eye":[[-2.7,28.28,-4.36],[4.23,28.21,-3.39]]},"animation.probopass.status@1.35":{"eye":[[-3.44,29.87,-4.1],[3.56,29.87,-4.1]]}},"dusknoir":{"animation.dusknoir.special@1.2":{"target":[[0.16,21.09,-15.98]],"special":[[-14.1,23.74,-25.79]],"middle":[[0,26.43,-3.96]]},"animation.dusknoir.special@1.25":{"special":[[-32.87,33.95,-23.3]],"target":[[0.57,26.55,-30.57]],"mouth":[[0.66,29.06,-22.16]],"middle":[[0.68,29.54,-17.76]],"hand_primary":[[-32.87,33.95,-23.3]]},"animation.dusknoir.special@1.85":{"target":[[-0.24,24.6,-24.88]],"middle":[[-0.28,27.49,-12.05]]},"animation.dusknoir.special@2.15":{"target":[[-0.15,24.56,-20.39]]},"animation.dusknoir.special@0.8":{"special":[[-28.89,13.92,-18.48]],"target":[[0.38,23.95,-11.45]]},"animation.dusknoir.special@1.35":{"special":[[-33.46,35.78,-18.92]],"target":[[0.7,26.36,-29.26]]},"animation.dusknoir.special@1.45":{"target":[[0.6,26.19,-28.34]],"middle":[[0.7,28.8,-15.45]],"face":[[1.4,47.53,-21.51]]},"animation.dusknoir.special@1.95":{"target":[[-0.44,24.48,-23.21]]},"animation.dusknoir.special@1.55":{"middle":[[0.45,28.1,-13.83]],"target":[[0.38,25.1,-26.64]]},"animation.dusknoir.special@2.4":{"middle":[[0,30.18,-4.32]]},"animation.dusknoir.special@1.3":{"special":[[-33.23,34.9,-21.07]],"target":[[0.64,26.41,-29.92]]},"animation.dusknoir.special@2.25":{"target":[[0,22.28,-18.83]]},"animation.dusknoir.special@1.5":{"target":[[0.49,26.55,-27.62]],"middle":[[0.57,29.37,-14.77]]},"animation.dusknoir.special@1.75":{"target":[[-0.03,25.63,-24.32]]},"animation.dusknoir.special@1.65":{"target":[[0.18,26.25,-26.76]]},"animation.dusknoir.special@2.2":{"target":[[-0.02,24.56,-18.83]]},"animation.dusknoir.special@1.6":{"target":[[0.28,25.63,-26.57]],"middle":[[0.33,28.49,-13.73]]},"animation.dusknoir.special@0":{"special":[[-26.72,23.5,-23.71]]},"animation.dusknoir.special@2.7":{"middle":[[0,32.39,-3.32]]},"animation.dusknoir.special@0.5":{"middle":[[0.44,32.28,4.19]]},"animation.dusknoir.special@1.8":{"middle":[[-0.16,27.97,-11.89]]},"animation.dusknoir.special@0.4":{"middle":[[0.09,32.54,3.27]]},"animation.dusknoir.special@0.7":{"special":[[-30.58,23.83,-15.88]],"target":[[0.67,29.26,-8.23]]},"animation.dusknoir.special@2.5":{"target":[[0,29.89,-16.43]]},"animation.dusknoir.special@0.55":{"middle":[[0.62,32.14,4.65]]},"animation.dusknoir.special@0.65":{"eye":[[1.52,43.2,-6.71]]},"animation.dusknoir.special@1.7":{"target":[[0.07,24.27,-25.51]]},"animation.dusknoir.special@2":{"target":[[-0.54,24.67,-23.15]]},"animation.dusknoir.special@1":{"middle":[[-0.12,26.54,-0.9]]},"animation.dusknoir.special@3.3":{"middle":[[0,32.25,-0.27]]},"animation.dusknoir.special@1.1":{"special":[[-5.41,15.88,-20.95]],"target":[[1.71,19.59,-12.62]]},"animation.dusknoir.special@0.15":{"hand_primary":[[-26.72,24.25,-23.42]]},"animation.dusknoir.special@0.3":{"hand_secondary":[[31.62,26.09,-17.43]],"target":[[0,30.67,-13.33]]},"animation.dusknoir.special@3.9":{"target":[[0.79,21.42,-12.39]]},"animation.dusknoir.physical@1.25":{"target":[[0,30.85,-39.48]],"middle":[[0,32.31,-26.41]]},"animation.dusknoir.physical@1.05":{"target":[[0,44.31,7.59]]},"animation.dusknoir.physical@1.2":{"target":[[0,40.79,-7.17]]},"animation.dusknoir.physical@1.45":{"target":[[0,30.53,-40.66]]},"animation.dusknoir.physical@1.65":{"target":[[0,30.8,-36.37]]},"animation.dusknoir.physical@0.1":{"hand_primary":[[-26.72,24.02,-23.51]],"physical":[[-26.72,24.02,-23.51]]},"animation.dusknoir.physical@1.3":{"middle":[[0,31.13,-29.85]],"target":[[0,27.47,-42.48]]},"animation.dusknoir.physical@0":{"hand_primary":[[-26.72,23.5,-23.71]],"physical":[[-26.72,23.5,-23.71]]},"animation.dusknoir.physical@1.15":{"target":[[0,43.21,7.32]]},"animation.dusknoir.physical@1.5":{"target":[[0,30.34,-39.99]]},"animation.dusknoir.physical@1.1":{"target":[[0,43.75,7.42]]},"animation.dusknoir.physical@1.35":{"target":[[0,28.89,-41.65]]},"animation.dusknoir.physical@0.3":{"target":[[0,29.67,-14.37]]},"animation.dusknoir.physical@0.5":{"middle":[[-0.43,34.42,5.41]]},"animation.dusknoir.physical@0.8":{"target":[[-2.22,43.9,3.13]]},"animation.dusknoir.physical@0.6":{"target":[[-1.6,38.11,-5.2]]},"animation.dusknoir.physical@0.85":{"target":[[-1.77,45.01,4.59]]},"animation.dusknoir.status@1.15":{"mouth":[[0,35.03,-3.99]],"special":[[-35.66,31.76,-10.23]],"target":[[0,37.61,-16.36]]},"animation.dusknoir.status@1.85":{"target":[[0,38.03,-13.52]]},"animation.dusknoir.status@1.25":{"middle":[[0,39.46,-3.41]],"special":[[-35.05,32.84,-10.99]],"target":[[0,38.2,-16.5]]},"animation.dusknoir.status@1.3":{"middle":[[0,39.53,-3.42]]},"animation.dusknoir.status@1.2":{"target":[[0,38.05,-16.48]]},"animation.dusknoir.status@0.5":{"middle":[[0,29.49,-3.35]],"target":[[0,25.88,-16]]},"animation.dusknoir.status@2.15":{"target":[[0,36.08,-12.31]]},"animation.dusknoir.status@1.35":{"eye":[[0,61.55,-8.53]],"target":[[0,38.51,-16.54]]},"animation.dusknoir.status@1.65":{"target":[[0,38.31,-14.8]]},"animation.dusknoir.status@2.4":{"middle":[[0,37.27,1.18]]},"animation.dusknoir.status@2":{"target":[[0,37.08,-12.88]]},"animation.dusknoir.status@2.05":{"target":[[0,36.75,-12.69]]},"animation.dusknoir.status@2.2":{"target":[[0,36.12,-12.21]]},"animation.dusknoir.status@1":{"middle":[[0,34.34,-6.79]]},"animation.dusknoir.recoil@0.55":{"target":[[0,22,-13]]},"animation.dusknoir.recoil@0.6":{"target":[[0,22,-13]]},"animation.dusknoir.recoil@0.65":{"target":[[0,22,-13]]},"animation.dusknoir.recoil@0.3":{"hand_primary":[[-41.59,26.56,10.58]],"target":[[0,22,-13]]},"animation.dusknoir.recoil@0.45":{"hand_primary":[[-42.81,28.42,-1.51]],"target":[[0,22,-13]]},"animation.dusknoir.recoil@0.75":{"hand_primary":[[-45.37,26.7,-0.16]],"target":[[0,22,-13]]},"animation.dusknoir.battle_cry@1.25":{"target":[[0,38.2,-16.5]]},"animation.dusknoir.battle_cry@2":{"target":[[0,37.08,-12.88]]}},"pignite":{"animation.pignite.recoil@0.55":{"target":[[0,14,-8]]},"animation.pignite.recoil@0.6":{"target":[[0,14,-8]]},"animation.pignite.recoil@0.65":{"target":[[0,14,-8]]},"animation.pignite.recoil@0.3":{"hand_primary":[[-14.76,14.86,3.48]],"target":[[0,14,-8]]},"animation.pignite.recoil@0.45":{"hand_primary":[[-14.94,14.98,1.96]],"target":[[0,14,-8]]},"animation.pignite.recoil@0.75":{"hand_primary":[[-15,15,0.59]],"target":[[0,14,-8]]},"animation.pignite.cry@1.25":{"target":[[0,14,-8]]},"animation.pignite.cry@2":{"target":[[0,14,-8]]}},"emboar":{"animation.pignite.recoil@0.3":{"hand_primary":[[-32.49,27.46,6.3]]},"animation.pignite.recoil@0.45":{"hand_primary":[[-32.91,27.71,2.92]]},"animation.pignite.recoil@0.75":{"hand_primary":[[-33,27.74,-0.36]]}},"purrloin":{"animation.purrloin.special@0.65":{"eye":[[-3.59,19.55,-3.79],[0.73,21.65,-3.75]]},"animation.purrloin.status@1.35":{"eye":[[-0.97,20.71,-4.54],[3.74,19.85,-4.85]]}},"liepard":{"animation.liepard.special@0.65":{"eye":[[-3.29,31.07,-16.97],[2.76,31.3,-17.71]]},"animation.liepard.status@1.35":{"eye":[[-6.52,35.57,-16.89],[-0.81,37.71,-19.09]]}},"musharna":{"animation.musharna.cry@1.25":{"target":[[0,4.5,-17.85]]},"animation.musharna.cry@2":{"target":[[0,4.5,-17.85]]}},"zebstrika":{"animation.zebstrika.special@1.25":{"special":[[-1.22,28.09,-17.23]],"mouth":[[-1.22,28.09,-17.23]]},"animation.zebstrika.special@0.8":{"special":[[1.46,18.66,-12.35]]},"animation.zebstrika.special@1.35":{"special":[[-0.81,28.66,-16.9]]},"animation.zebstrika.special@1.45":{"face":[[-0.41,33.86,-18.88]]},"animation.zebstrika.special@1.3":{"special":[[-0.97,28.72,-16.74]]},"animation.zebstrika.special@0":{"special":[[0,24.67,-15.84]]},"animation.zebstrika.special@0.7":{"special":[[1.29,20.82,-12.48]]},"animation.zebstrika.special@0.65":{"eye":[[4.88,23.66,-14.09],[-1.05,24.81,-14.89]]},"animation.zebstrika.special@1.1":{"special":[[1.53,20.73,-13.46]]},"animation.zebstrika.physical@1.25":{"target":[[0,16,-20]],"middle":[[0,19,-1]]},"animation.zebstrika.physical@0.1":{"physical":[[-0.15,22.07,-16.56]]},"animation.zebstrika.physical@0":{"physical":[[0,24.67,-15.84]]},"animation.zebstrika.status@1.15":{"mouth":[[-3.92,22.55,-17.51]],"special":[[-3.92,22.55,-17.51]],"target":[[0,16,-23]]},"animation.zebstrika.status@1.85":{"target":[[0,16,-23]]},"animation.zebstrika.status@1.25":{"middle":[[0,19,-4]],"special":[[1.56,30.06,-15.73]],"target":[[0,16,-23]]},"animation.zebstrika.status@1.3":{"middle":[[0,19,-4]]},"animation.zebstrika.status@1.2":{"target":[[0,16,-23]]},"animation.zebstrika.status@0.5":{"middle":[[0,19,-4]],"target":[[0,16,-23]]},"animation.zebstrika.status@2.15":{"target":[[0,16,-23]]},"animation.zebstrika.status@1.35":{"eye":[[4.87,32.59,-12.87],[-1.13,33.57,-13.28]],"target":[[0,16,-23]]},"animation.zebstrika.status@1.65":{"target":[[0,16,-23]]},"animation.zebstrika.status@2.4":{"middle":[[0,19,-2.47]]},"animation.zebstrika.status@2":{"target":[[0,16,-23]]},"animation.zebstrika.status@2.05":{"target":[[0,16,-23]]},"animation.zebstrika.status@2.2":{"target":[[0,16,-23]]},"animation.zebstrika.status@1":{"middle":[[0,19,-4]]},"animation.zebstrika.battle_cry@1.25":{"target":[[0,16,-23]]},"animation.zebstrika.battle_cry@2":{"target":[[0,16,-23]]}},"drilbur":{"animation.drilbur.special@1.2":{"special":[[-6.86,9.23,-15.58]]},"animation.drilbur.special@1.25":{"special":[[-3.82,9.09,-16.36]],"mouth":[[0.53,8.48,-5.25]],"hand_primary":[[-5.26,9.52,-11.53]]},"animation.drilbur.special@0.8":{"special":[[-16.3,9.99,-6.82]]},"animation.drilbur.special@1.35":{"special":[[-13.64,15.75,-5.09]]},"animation.drilbur.special@1.45":{"face":[[0.94,16.88,-10.5]]},"animation.drilbur.special@1.3":{"special":[[-4.22,10.42,-12.13]]},"animation.drilbur.special@0.7":{"special":[[-16.93,9.77,-5.38]]},"animation.drilbur.special@0.65":{"eye":[[-3.81,13.73,-3.85],[3.19,13.94,-3.93]]},"animation.drilbur.special@1.1":{"special":[[-11.61,9.22,-12.71]]},"animation.drilbur.special@0.15":{"hand_primary":[[-12.26,13.81,-1.45]]},"animation.drilbur.special@0.3":{"hand_secondary":[[12.3,12.5,0.65]]},"animation.drilbur.physical@1.25":{"target":[[-0.91,9,-32.43]],"middle":[[0.04,10.49,-25.87]]},"animation.drilbur.physical@1.05":{"target":[[-1.28,8.48,-30.83]]},"animation.drilbur.physical@1.2":{"target":[[-1.45,8.22,-32.28]]},"animation.drilbur.physical@1.45":{"target":[[6.21,35.13,-24.68]]},"animation.drilbur.physical@1.65":{"target":[[-1.97,33.61,-9.4]]},"animation.drilbur.physical@0.1":{"hand_primary":[[-11.12,14.83,-3.4]],"physical":[[-14.31,17.52,-6.38]]},"animation.drilbur.physical@1.3":{"middle":[[0.09,17.03,-24.88]],"target":[[2.26,16.32,-31.28]]},"animation.drilbur.physical@1.15":{"target":[[-1.45,8.22,-32.28]]},"animation.drilbur.physical@1.5":{"target":[[-3.17,33.07,-16.24]]},"animation.drilbur.physical@1.1":{"target":[[-1.45,8.22,-32.28]]},"animation.drilbur.physical@1.35":{"target":[[2.02,18.9,-19.1]]},"animation.drilbur.physical@0.8":{"target":[[0.07,9.9,-18.89]]},"animation.drilbur.physical@0.85":{"target":[[-0.2,10.08,-22]]},"animation.drilbur.status@1.15":{"mouth":[[1.06,11.88,-4.83]],"special":[[-8.29,17.51,10.19]],"target":[[-0.43,10.2,-5.91]]},"animation.drilbur.status@1.85":{"target":[[4.38,10.2,-7.66]]},"animation.drilbur.status@1.25":{"middle":[[3.75,12.31,-0.88]],"special":[[13.02,15.66,-17.53]],"target":[[8.92,10.2,2.99]]},"animation.drilbur.status@1.3":{"middle":[[4.33,12.31,-0.96]]},"animation.drilbur.status@1.2":{"target":[[-0.46,10.2,3.48]]},"animation.drilbur.status@2.15":{"target":[[3.79,10.05,-7.04]]},"animation.drilbur.status@1.35":{"eye":[[1.69,18.62,2.48],[4.58,18.41,-3.89]],"target":[[-1.36,10.2,-4.82]]},"animation.drilbur.status@1.65":{"target":[[6.88,10.2,-6.99]]},"animation.drilbur.status@2.4":{"middle":[[2.73,11.95,0]]},"animation.drilbur.status@2":{"target":[[4.19,10.2,-7.44]]},"animation.drilbur.status@2.05":{"target":[[4.06,10.15,-7.31]]},"animation.drilbur.status@2.2":{"target":[[3.66,10,-6.91]]},"animation.drilbur.recoil@0.3":{"hand_primary":[[-12.69,10.52,-1.81]]},"animation.drilbur.recoil@0.45":{"hand_primary":[[-12.89,10.18,-0.96]]},"animation.drilbur.recoil@0.75":{"hand_primary":[[-13,9.76,0.11]]},"animation.drilbur.battle_cry@1.25":{"target":[[8.92,10.2,2.99]]},"animation.drilbur.battle_cry@2":{"target":[[4.19,10.2,-7.44]]}},"excadrill":{"animation.excadrill.special@1.2":{"special":[[-18.6,17.14,2.69]]},"animation.excadrill.special@1.25":{"special":[[-8.75,16.56,-19.5]],"mouth":[[0.37,18.49,-9.61]],"hand_primary":[[-7.12,15.97,-14.08]]},"animation.excadrill.special@0.8":{"special":[[-15.59,17.74,-8.89]]},"animation.excadrill.special@1.35":{"special":[[-5.99,13.8,-19.83]]},"animation.excadrill.special@1.45":{"face":[[0.31,16.82,-18.77]]},"animation.excadrill.special@1.3":{"special":[[-6.05,14.41,-20.54]]},"animation.excadrill.special@0.7":{"special":[[-14.43,15.24,-12.14]]},"animation.excadrill.special@0.65":{"eye":[[-2.27,21.15,-11.33],[3.67,21.52,-10.61]]},"animation.excadrill.special@1.1":{"special":[[-14.58,16.6,12.03]]},"animation.excadrill.special@0.15":{"hand_primary":[[-11.1,11.2,-9.62]]},"animation.excadrill.special@0.3":{"hand_secondary":[[12.54,16,2.35]]},"animation.excadrill.physical@1.25":{"target":[[1.46,16.72,-15.98]],"middle":[[0,23.37,-22.68]]},"animation.excadrill.physical@1.05":{"target":[[-6.33,59.25,38.02]]},"animation.excadrill.physical@1.2":{"target":[[9.48,34.79,-5.14]]},"animation.excadrill.physical@1.45":{"target":[[0.13,17.64,-12.02]]},"animation.excadrill.physical@1.65":{"target":[[-8.41,-0.42,-40.7]]},"animation.excadrill.physical@0.1":{"middle":[[0,15.72,9.34]],"hand_primary":[[-9.64,14.78,1.75]],"physical":[[-11.48,11.52,-2.1]]},"animation.excadrill.physical@1.3":{"middle":[[0,27.07,-17.88]],"target":[[-9.5,27.76,-17.14]]},"animation.excadrill.physical@1.15":{"target":[[2.69,53.58,5.01]]},"animation.excadrill.physical@1.5":{"target":[[4.58,30.56,-23.52]]},"animation.excadrill.physical@1.1":{"target":[[-8.3,59.91,20.86]]},"animation.excadrill.physical@1.35":{"target":[[8.22,16.98,-20.54]]},"animation.excadrill.physical@0.3":{"target":[[0,16.88,17.42]]},"animation.excadrill.physical@0.5":{"middle":[[0,13,42.03]]},"animation.excadrill.physical@0.8":{"target":[[7.84,77.83,44.62]]},"animation.excadrill.physical@0.6":{"target":[[0,25.37,33.04]]},"animation.excadrill.physical@0.85":{"target":[[-2,81.51,42.27]]},"animation.excadrill.status@1.15":{"mouth":[[-0.03,16.86,-10.62]],"special":[[-6,5.22,-14.5]]},"animation.excadrill.status@1.25":{"special":[[-6.23,5.3,-13.87]]},"animation.excadrill.status@1.35":{"eye":[[-1.4,20.68,-12.67],[4.22,21.48,-11.5]]}},"timburr":{"animation.timburr.cry@1.25":{"target":[[0,10,-6]]},"animation.timburr.cry@2":{"target":[[0,10,-6]]}},"gurdurr":{"animation.gurdurr.battle_cry@1.25":{"target":[[0,16,-7]]},"animation.gurdurr.battle_cry@2":{"target":[[0,16,-7]]}},"conkeldurr":{"animation.conkeldurr.cry@1.25":{"target":[[0,16,-20]]},"animation.conkeldurr.cry@2":{"target":[[0,16,-20]]}},"throh":{"animation.throh.cry@1.25":{"target":[[0,20,-13]]},"animation.throh.cry@2":{"target":[[0,20,-13]]}},"sawk":{"animation.sawk.cry@1.25":{"target":[[0,26,-8]]},"animation.sawk.cry@2":{"target":[[0,26,-8]]}},"leavanny":{"animation.leavanny.recoil@0.55":{"target":[[0,25,-6.5]]},"animation.leavanny.recoil@0.6":{"target":[[0,25,-6.5]]},"animation.leavanny.recoil@0.65":{"target":[[0,25,-6.5]]},"animation.leavanny.recoil@0.3":{"hand_primary":[[-17.82,28.64,0.79]],"target":[[0,25,-6.5]]},"animation.leavanny.recoil@0.45":{"hand_primary":[[-17.65,29.35,0.49]],"target":[[0,25,-6.5]]},"animation.leavanny.recoil@0.75":{"hand_primary":[[-17.65,29.35,0.49]],"target":[[0,25,-6.5]]},"animation.leavanny.cry@1.25":{"target":[[0,25,-6.5]]},"animation.leavanny.cry@2":{"target":[[0,25,-6.5]]}},"whirlipede":{"animation.whirlipede.cry@1.25":{"target":[[0,13,-15]]},"animation.whirlipede.cry@2":{"target":[[0,13,-15]]}},"scolipede":{"animation.scolipede.recoil@0.55":{"target":[[0,26,-35]]},"animation.scolipede.recoil@0.6":{"target":[[0,26,-35]]},"animation.scolipede.recoil@0.65":{"target":[[0,26,-35]]},"animation.scolipede.recoil@0.3":{"target":[[0,26,-35]]},"animation.scolipede.recoil@0.45":{"target":[[0,26,-35]]},"animation.scolipede.recoil@0.75":{"target":[[0,26,-35]]},"animation.scolipede.cry_idle@1.25":{"target":[[0,26,-35]]},"animation.scolipede.cry_idle@2":{"target":[[0,26,-35]]}},"cottonee":{"animation.cottonee.cry@1.25":{"target":[[0,6.53,-6.48]]}},"whimsicott":{"animation.whimsicott.special@1.2":{"target":[[0,15.22,-9.16]],"special":[[0,16.58,-6.23]],"middle":[[0,17.61,-3.66]]},"animation.whimsicott.special@1.25":{"special":[[0,16.92,-4.32]],"target":[[0,15.06,-7.22]],"mouth":[[0,16.92,-4.32]],"middle":[[0,17.6,-1.78]],"hand_primary":[[-3.92,15.12,-1.66]]},"animation.whimsicott.special@1.85":{"target":[[0.09,18.36,-5.25]],"middle":[[0.04,16.75,0.53]]},"animation.whimsicott.special@2.15":{"target":[[-0.54,13.44,-6.67]]},"animation.whimsicott.special@0.8":{"special":[[0,16.66,-7.16]],"target":[[0.01,17.16,-10.18]]},"animation.whimsicott.special@1.35":{"special":[[-0.41,20.47,1.75]],"target":[[-0.43,20.8,-2.05]]},"animation.whimsicott.special@1.45":{"target":[[-0.25,21.77,-1.86]],"middle":[[-0.15,19.11,3.52]],"face":[[-0.27,22.12,2.96]]},"animation.whimsicott.special@1.95":{"target":[[-0.16,16.76,-5.85]]},"animation.whimsicott.special@1.55":{"middle":[[-0.01,19.1,2.9]],"target":[[-0.04,21.94,-2.38]]},"animation.whimsicott.special@2.4":{"middle":[[-0.28,11.3,-0.66]]},"animation.whimsicott.special@1.3":{"special":[[-0.24,19.04,-0.41]],"target":[[-0.21,18.35,-3.91]]},"animation.whimsicott.special@3.1":{"target":[[0,8.7,-6.74]]},"animation.whimsicott.special@2.25":{"target":[[-0.45,12.18,-6.63]]},"animation.whimsicott.special@1.5":{"target":[[-0.16,22.02,-1.82]],"middle":[[-0.08,19.05,3.39]]},"animation.whimsicott.special@1.75":{"target":[[0.36,19.84,-4.57]]},"animation.whimsicott.special@1.65":{"target":[[0.17,20.9,-3.48]]},"animation.whimsicott.special@2.2":{"target":[[-0.52,12.82,-6.65]]},"animation.whimsicott.special@1.6":{"target":[[0.07,21.43,-2.93]],"middle":[[0.05,18.7,2.42]]},"animation.whimsicott.special@0":{"special":[[0,8.5,-3]],"middle":[[0,8,0]],"target":[[0,8,-6]]},"animation.whimsicott.special@2.7":{"middle":[[-0.09,9.34,-0.39]]},"animation.whimsicott.special@0.5":{"middle":[[0.01,13.81,-2.83]]},"animation.whimsicott.special@1.8":{"middle":[[0.14,17.13,0.75]]},"animation.whimsicott.special@0.4":{"middle":[[0.01,12.07,-2.51]]},"animation.whimsicott.special@0.7":{"special":[[0.01,15.58,-6.91]],"target":[[0.01,16.17,-9.79]]},"animation.whimsicott.special@2.5":{"target":[[-0.17,9.64,-6.53]]},"animation.whimsicott.special@0.55":{"middle":[[0.01,14.68,-3.1]]},"animation.whimsicott.special@0.65":{"eye":[[-1.99,16.82,-7.83],[2.01,16.81,-7.83]]},"animation.whimsicott.special@1.7":{"target":[[0.27,20.37,-4.03]]},"animation.whimsicott.special@2":{"target":[[-0.27,15.93,-6.12]]},"animation.whimsicott.special@1":{"middle":[[0,18.8,-4.85]]},"animation.whimsicott.special@3.3":{"middle":[[0.01,10.32,-2.19]]},"animation.whimsicott.special@1.1":{"special":[[0,16.56,-7.32]],"target":[[0,16,-10.51]]},"animation.whimsicott.special@0.15":{"hand_primary":[[-3.9,5.86,-1.71]],"target":[[0,9.06,-7.11]]},"animation.whimsicott.special@0.3":{"hand_secondary":[[3.73,7.15,-3.35]],"target":[[0.01,10.19,-8.19]]},"animation.whimsicott.special@3.9":{"target":[[0,17.33,-10.45]]},"animation.whimsicott.status@0.1":{"middle":[[0,8.27,0]]},"animation.whimsicott.status@1.15":{"mouth":[[2.04,20.88,-2.62]],"special":[[2.04,20.88,-2.62]],"target":[[3.69,20.7,-4.73]]},"animation.whimsicott.status@1.85":{"target":[[0.99,16.44,-5.92]]},"animation.whimsicott.status@1.25":{"middle":[[0,20.34,0]],"special":[[1.53,20.91,-2.28]],"target":[[3.35,20.34,-4.98]]},"animation.whimsicott.status@1.3":{"middle":[[0,20.16,0]]},"animation.whimsicott.status@1.2":{"target":[[3.52,20.52,-4.86]]},"animation.whimsicott.status@0.5":{"middle":[[0,14.4,0]],"target":[[-5.86,14.4,-1.3]]},"animation.whimsicott.status@2.15":{"target":[[0,13.02,-6]]},"animation.whimsicott.status@0.2":{"target":[[-2.21,8.53,-5.58]]},"animation.whimsicott.status@1.35":{"eye":[[-0.85,22.95,-2.53],[2.62,22.95,-0.54]],"target":[[2.99,19.99,-5.2]]},"animation.whimsicott.status@1.65":{"target":[[1.82,18.72,-5.72]]},"animation.whimsicott.status@2.4":{"middle":[[0,10.17,0]]},"animation.whimsicott.status@2":{"target":[[0.35,14.73,-5.99]]},"animation.whimsicott.status@2.05":{"target":[[0.14,14.16,-6]]},"animation.whimsicott.status@2.2":{"target":[[0,12.45,-6]]},"animation.whimsicott.status@1":{"middle":[[0,21.24,0]]},"animation.whimsicott.recoil@0.55":{"target":[[0,8,-6]]},"animation.whimsicott.recoil@0.6":{"target":[[0,8,-6]]},"animation.whimsicott.recoil@0.65":{"target":[[0,8,-6]]},"animation.whimsicott.recoil@0.3":{"hand_primary":[[-4.01,6.34,0.62]],"target":[[0,8,-6]]},"animation.whimsicott.recoil@0.45":{"hand_primary":[[-4.16,6.13,0.63]],"target":[[0,8,-6]]},"animation.whimsicott.recoil@0.75":{"hand_primary":[[-4.25,5.07,-0.38]],"target":[[0,8,-6]]},"animation.whimsicott.cry@1.25":{"target":[[0,8,-6]]},"animation.whimsicott.cry@2":{"target":[[0,8,-6]]}},"sandile":{"animation.sandile.special@1.25":{"mouth":[[-0.19,5.03,-7.54]]},"animation.sandile.special@1.45":{"face":[[-0.29,7.72,-10.64]]},"animation.sandile.special@0.65":{"eye":[[-2.55,7.48,-7.12],[2.45,7.57,-7.12]]},"animation.sandile.status@1.35":{"eye":[[-1.68,8.22,-7.05],[3.26,7.48,-7]]},"animation.sandile.sand_recoil@0.55":{"target":[[0,7,-12]]},"animation.sandile.sand_recoil@0.6":{"target":[[0,7,-12]]},"animation.sandile.sand_recoil@0.65":{"target":[[0,7,-12]]},"animation.sandile.sand_recoil@0.3":{"target":[[0,7,-12]]},"animation.sandile.sand_recoil@0.45":{"target":[[0,7,-12]]},"animation.sandile.sand_recoil@0.75":{"target":[[0,7,-12]]}},"krokorok":{"animation.krokorok.special@1.2":{"special":[[0.45,21.58,-11.17]]},"animation.krokorok.special@1.25":{"special":[[-0.16,19.34,-13.66]],"mouth":[[-0.16,19.34,-13.66]],"hand_primary":[[-10.65,11.23,-11.16]]},"animation.krokorok.special@0.8":{"special":[[1.22,19.44,-10.25]]},"animation.krokorok.special@1.35":{"special":[[-0.14,19.57,-13.42]]},"animation.krokorok.special@1.45":{"face":[[-0.23,23.7,-11.96]]},"animation.krokorok.special@1.3":{"special":[[-0.15,19.45,-13.59]]},"animation.krokorok.special@0.7":{"special":[[0.89,16.97,-10.99]]},"animation.krokorok.special@0.65":{"eye":[[-1.4,19.49,-13.71],[3.58,19.04,-13.59]]},"animation.krokorok.special@1.1":{"special":[[1.21,22.94,-8.82]]},"animation.krokorok.special@0.15":{"hand_primary":[[-8.75,8.67,-6.41]]},"animation.krokorok.special@0.3":{"hand_secondary":[[8,6.8,-6.98]]},"animation.krokorok.physical@0.1":{"hand_primary":[[-7.85,9.5,-7.9]],"physical":[[-7.85,9.5,-7.9]]},"animation.krokorok.status@1.15":{"mouth":[[-3.81,17.95,-9.92]],"special":[[-3.81,17.95,-9.92]]},"animation.krokorok.status@1.25":{"special":[[-3.51,18.95,-9.54]]},"animation.krokorok.status@1.35":{"eye":[[-5.11,24.23,-7.72],[-0.55,23.99,-9.76]]},"animation.krokorok.sand_recoil@0.3":{"hand_primary":[[-13.9,16.83,-0.48]]},"animation.krokorok.sand_recoil@0.45":{"hand_primary":[[-13.9,16.93,-0.61]]},"animation.krokorok.sand_recoil@0.75":{"hand_primary":[[-13.9,17,-0.73]]}},"krookodile":{"animation.krookodile.special@1.2":{"special":[[0.47,34.12,-16.66]]},"animation.krookodile.special@1.25":{"special":[[0.21,32.15,-19.4]],"mouth":[[0.21,32.15,-19.4]],"hand_primary":[[-16.87,16.57,-10.32]]},"animation.krookodile.special@0.8":{"special":[[0.91,23.85,-20.26]]},"animation.krookodile.special@1.35":{"special":[[0.12,32.07,-19.68]]},"animation.krookodile.special@1.45":{"face":[[0.12,36.73,-15.49]]},"animation.krookodile.special@1.3":{"special":[[0.24,32.09,-19.75]]},"animation.krookodile.special@0.7":{"special":[[0.48,20.67,-20.41]]},"animation.krookodile.special@0.65":{"eye":[[3.75,27.94,-20.43],[-3.2,27.89,-20.85]]},"animation.krookodile.special@1.1":{"special":[[1.11,36.61,-10.85]]},"animation.krookodile.special@0.15":{"hand_primary":[[-12.59,15.47,-12.68]]},"animation.krookodile.special@0.3":{"hand_secondary":[[11.11,15.25,-14.34]]},"animation.krookodile.physical@0.1":{"hand_primary":[[-11.81,15.98,-14.12]],"physical":[[-11.81,15.98,-14.12]]},"animation.krookodile.status@1.15":{"mouth":[[-1.77,23.49,-24.42]],"special":[[-1.77,23.49,-24.42]]},"animation.krookodile.status@1.25":{"special":[[-0.21,28,-24.52]]},"animation.krookodile.status@1.35":{"eye":[[4.2,35.24,-16.47],[-2.77,35.34,-16.32]]},"animation.krookodile.sand_recoil@0.55":{"target":[[0,25,-11]]},"animation.krookodile.sand_recoil@0.6":{"target":[[0,25,-11]]},"animation.krookodile.sand_recoil@0.65":{"target":[[0,25,-11]]},"animation.krookodile.sand_recoil@0.3":{"hand_primary":[[-22.5,28.05,0.24]],"target":[[0,25,-11]]},"animation.krookodile.sand_recoil@0.45":{"hand_primary":[[-22.5,28.33,0.03]],"target":[[0,25,-11]]},"animation.krookodile.sand_recoil@0.75":{"hand_primary":[[-22.5,28.74,-0.22]],"target":[[0,25,-11]]}},"darumaka":{"animation.darumaka.cry@1.25":{"target":[[0,8,-6.5]]},"animation.darumaka.cry@2":{"target":[[0,8,-6.5]]}},"darmanitan":{"animation.darmanitan.cry@1.25":{"target":[[0,19,-13.5]]},"animation.darmanitan.cry@2":{"target":[[0,19,-13.5]]}},"dwebble":{"animation.dwebble.special@1.2":{"special":[[-0.11,4.7,-8.8]]},"animation.dwebble.special@1.25":{"special":[[0,3.38,-8.96]],"mouth":[[0,3.38,-8.96]],"hand_primary":[[-9.61,2.24,-5.93]]},"animation.dwebble.special@0.8":{"special":[[0.04,4.8,-6.21]]},"animation.dwebble.special@1.35":{"special":[[0,3.46,-8.97]]},"animation.dwebble.special@1.45":{"face":[[0,5.7,-9.16]]},"animation.dwebble.special@1.3":{"special":[[0,3.65,-9]]},"animation.dwebble.special@0.7":{"special":[[0,3.91,-6.16]]},"animation.dwebble.special@0.65":{"eye":[[1.14,6.6,-8.99],[-1.1,6.63,-9.02]]},"animation.dwebble.special@1.1":{"special":[[-0.4,9.19,-5.1]]},"animation.dwebble.status@1.15":{"mouth":[[-0.38,17.68,-0.37]],"special":[[-0.38,17.68,-0.37]],"target":[[4.16,12.57,9.51]]},"animation.dwebble.status@1.85":{"target":[[-0.02,-0.46,-11.1]]},"animation.dwebble.status@1.25":{"middle":[[-0.26,19.41,0.7]],"special":[[-0.91,14,-0.41]],"target":[[-3.58,17.11,9.85]]},"animation.dwebble.status@1.3":{"middle":[[-0.22,19.48,0.28]]},"animation.dwebble.status@1.2":{"target":[[-0.36,14.82,10.5]]},"animation.dwebble.status@2.15":{"target":[[0,-1.16,-11.45]]},"animation.dwebble.status@1.35":{"eye":[[-5.12,10.8,-1.23],[-2.09,9.84,-0.39]],"target":[[-8.26,19.62,5.57]]},"animation.dwebble.status@1.65":{"target":[[-5.41,17.11,-8.1]]},"animation.dwebble.status@2.4":{"middle":[[0,5.08,-1.72]]},"animation.dwebble.status@2":{"target":[[-0.31,0.26,-11.31]]},"animation.dwebble.status@2.05":{"target":[[-0.08,0.65,-11.58]]},"animation.dwebble.status@2.2":{"target":[[0,-1.67,-11.36]]},"animation.dwebble.status@1":{"middle":[[1.33,13.47,-1.97]]},"animation.dwebble.recoil@0.3":{"hand_primary":[[-11,3.02,-1.74]]},"animation.dwebble.recoil@0.45":{"hand_primary":[[-11,2.73,-2]]},"animation.dwebble.recoil@0.75":{"hand_primary":[[-10.85,1.76,-2]]},"animation.dwebble.battle_cry@1.25":{"target":[[-3.58,17.11,9.85]]},"animation.dwebble.battle_cry@2":{"target":[[-0.31,0.26,-11.31]]}},"crustle":{"animation.crustle.special@1.2":{"special":[[0.05,1.72,-9.14]]},"animation.crustle.special@1.25":{"special":[[0.03,2.03,-8.82]],"mouth":[[0.03,2.03,-8.82]]},"animation.crustle.special@1.35":{"special":[[-0.01,2.85,-8.87]]},"animation.crustle.special@1.45":{"face":[[-0.05,6.48,-8.97]]},"animation.crustle.special@1.3":{"special":[[0.01,2.81,-8.97]]},"animation.crustle.special@1.1":{"special":[[0.01,1.57,-13.03]]},"animation.crustle.physical@1.25":{"target":[[0,17,-19]],"middle":[[0,15,-4]]},"animation.crustle.physical@1.05":{"target":[[0,19.4,-15.2]]},"animation.crustle.physical@1.2":{"target":[[0,18.6,-19]]},"animation.crustle.physical@1.45":{"target":[[0,17,-19.7]]},"animation.crustle.physical@1.65":{"target":[[0,17,-20.12]]},"animation.crustle.physical@1.3":{"middle":[[0,15.8,-4.14]],"target":[[0,17.8,-19.14]]},"animation.crustle.physical@1.15":{"target":[[0,17.88,-18.6]]},"animation.crustle.physical@1.5":{"target":[[0,17,-20]]},"animation.crustle.physical@1.1":{"target":[[0,19.68,-17.4]]},"animation.crustle.physical@1.35":{"target":[[0,17,-19.1]]},"animation.crustle.physical@0.3":{"target":[[0,17,-12.05]]},"animation.crustle.physical@0.5":{"middle":[[0,15,5.37]]},"animation.crustle.physical@0.8":{"target":[[0,17,-8.46]]},"animation.crustle.physical@0.6":{"target":[[0,17,-9.24]]},"animation.crustle.physical@0.85":{"target":[[0,17,-8.26]]},"animation.crustle.status@1.15":{"mouth":[[0,0.76,-9.19]],"special":[[0,0.76,-9.19]],"target":[[0,14.3,-15]]},"animation.crustle.status@1.85":{"target":[[0,14.3,-15]]},"animation.crustle.status@1.25":{"middle":[[0.55,16.38,-1.1]],"special":[[-0.04,5.12,-14.1]],"target":[[0.57,16.8,-16.23]]},"animation.crustle.status@1.3":{"middle":[[0.44,16.79,-0.95]]},"animation.crustle.status@0.5":{"middle":[[0,16.33,0]],"target":[[0,18.33,-15]]},"animation.crustle.status@2.15":{"target":[[0,14.8,-15]]},"animation.crustle.status@1.35":{"eye":[[2.09,10.51,-14.9],[-1.82,10.63,-14.9]],"target":[[0.36,17.67,-15.9]]},"animation.crustle.status@1.65":{"target":[[-0.27,15.27,-14.67]]},"animation.crustle.status@2":{"target":[[0,14.3,-15]]},"animation.crustle.status@2.05":{"target":[[0,14.3,-15]]},"animation.crustle.status@2.2":{"target":[[0,15.17,-15]]},"animation.crustle.status@1":{"middle":[[0,12.3,0]]},"animation.crustle.battle_cry@1.25":{"target":[[0.57,16.8,-16.23]]},"animation.crustle.battle_cry@2":{"target":[[0,14.3,-15]]}},"jellicent":{"animation.jellicent.special@1.2":{"target":[[0,26.36,-19.58]],"special":[[-12.09,13.89,-9.88]],"middle":[[0,32.58,1.05]]},"animation.jellicent.special@1.25":{"special":[[-9.06,15.16,-12.79]],"target":[[0,24.63,-20]],"mouth":[[0,32.63,-12]],"hand_primary":[[-9.06,15.16,-12.79]]},"animation.jellicent.special@1.85":{"target":[[0,29.67,-15.33]],"middle":[[0,32.22,6.06]]},"animation.jellicent.special@2.15":{"target":[[0,29.67,-16.1]]},"animation.jellicent.special@0.8":{"special":[[-14.18,12.83,6.2]],"target":[[-1.25,31.14,-17.43]]},"animation.jellicent.special@1.35":{"special":[[-8.31,17.16,-13.83]],"target":[[0,24.63,-20]]},"animation.jellicent.special@1.45":{"target":[[0,24.63,-20]],"face":[[0,35.63,-12]]},"animation.jellicent.special@1.95":{"target":[[0,29.67,-15.58]]},"animation.jellicent.special@1.55":{"target":[[0,24.63,-20]]},"animation.jellicent.special@2.4":{"middle":[[0.14,32.38,3.98]]},"animation.jellicent.special@1.3":{"special":[[-8.79,16.21,-13.32]],"target":[[0,24.63,-20]]},"animation.jellicent.special@3.1":{"target":[[-6.21,24.98,-18.93]]},"animation.jellicent.special@2.25":{"target":[[0,29.67,-16.35]]},"animation.jellicent.special@1.5":{"target":[[0,24.63,-20]]},"animation.jellicent.special@1.75":{"target":[[0,27.21,-17.81]]},"animation.jellicent.special@1.65":{"target":[[0,24.63,-20]]},"animation.jellicent.special@2.2":{"target":[[0,29.67,-16.23]]},"animation.jellicent.special@1.6":{"target":[[0,24.63,-20]]},"animation.jellicent.special@2.7":{"middle":[[0.12,32.58,1.83]]},"animation.jellicent.special@0.5":{"middle":[[0.34,32.38,2.42]]},"animation.jellicent.special@1.8":{"middle":[[0,32.37,4.9]]},"animation.jellicent.special@0.4":{"middle":[[0.29,32.48,1.87]]},"animation.jellicent.special@0.7":{"special":[[-14.51,13.36,6.28]],"target":[[-1.92,30.32,-17.84]]},"animation.jellicent.special@2.5":{"target":[[-2.25,27.88,-17.65]]},"animation.jellicent.special@0.55":{"middle":[[0.35,32.32,2.69]]},"animation.jellicent.special@0.65":{"eye":[[-3.08,38.58,-8.41],[3.39,38.44,-8.58]]},"animation.jellicent.special@1.7":{"target":[[0,25.67,-19.16]]},"animation.jellicent.special@2":{"target":[[0,29.67,-15.71]]},"animation.jellicent.special@1":{"middle":[[0,31.51,5.07]]},"animation.jellicent.special@3.3":{"middle":[[0.21,32.55,1.32]]},"animation.jellicent.special@1.1":{"special":[[-15.25,12.49,-2.15]],"target":[[0,29.67,-18.28]]},"animation.jellicent.special@0.15":{"target":[[-5.85,25.45,-18.94]]},"animation.jellicent.special@0.3":{"hand_secondary":[[14.32,13.3,-6.75]],"target":[[-4.76,26.83,-18.84]]},"animation.jellicent.special@3.9":{"target":[[-0.61,31.94,-16.96]]},"animation.jellicent.physical@1.25":{"target":[[0,0.87,-49.04]],"middle":[[0,21.26,-55.98]]},"animation.jellicent.physical@1.05":{"target":[[0,0.63,38]]},"animation.jellicent.physical@1.2":{"target":[[0,0.76,-14.23]]},"animation.jellicent.physical@1.45":{"target":[[0,1.36,-53.88]]},"animation.jellicent.physical@1.65":{"target":[[0,1.98,-58.67]]},"animation.jellicent.physical@0.1":{"middle":[[-0.27,32.62,3.93]],"hand_primary":[[-15.57,13.73,8.74]],"physical":[[-15.57,13.73,8.74]]},"animation.jellicent.physical@1.3":{"middle":[[0,21.51,-56.77]],"target":[[0,0.98,-50.25]]},"animation.jellicent.physical@1.15":{"target":[[0,0.67,20.59]]},"animation.jellicent.physical@1.5":{"target":[[0,1.5,-55.08]]},"animation.jellicent.physical@1.1":{"target":[[0,0.63,38]]},"animation.jellicent.physical@1.35":{"target":[[0,1.1,-51.46]]},"animation.jellicent.physical@0.3":{"target":[[-5.89,30.13,-4.46]]},"animation.jellicent.physical@0.5":{"middle":[[2.76,20.84,32.68]]},"animation.jellicent.physical@0.8":{"target":[[1.7,10.76,51.37]]},"animation.jellicent.physical@0.6":{"target":[[2.63,34.67,39.76]]},"animation.jellicent.physical@0.85":{"target":[[1.01,5.7,49.57]]},"animation.jellicent.status@1.15":{"mouth":[[-3.76,31.06,-13.36]],"special":[[-16.44,18.85,-4.63]],"target":[[-6.62,25.3,-18.87]]},"animation.jellicent.status@1.85":{"target":[[20,43.96,-0.23]]},"animation.jellicent.status@1.25":{"middle":[[0,35.96,0]],"special":[[-5.39,21.52,16.21]],"target":[[-19.16,27.96,5.74]]},"animation.jellicent.status@1.3":{"middle":[[0,37.3,0]]},"animation.jellicent.status@1.2":{"target":[[-17.82,26.63,-9.08]]},"animation.jellicent.status@0.5":{"target":[[-3.68,24.32,-19.72]]},"animation.jellicent.status@2.15":{"target":[[15.65,44.58,-12.47]]},"animation.jellicent.status@0.2":{"target":[[-5.82,24.14,-19.23]]},"animation.jellicent.status@1.35":{"eye":[[2.68,39.87,14.83],[-3.79,39.95,14.51]],"target":[[4.84,30.63,19.41]]},"animation.jellicent.status@1.65":{"target":[[-19.89,38.63,2.09]]},"animation.jellicent.status@2.4":{"middle":[[0,52.63,-0.08]]},"animation.jellicent.status@2":{"target":[[17.36,44.61,-9.94]]},"animation.jellicent.status@2.05":{"target":[[16.83,44.6,-10.81]]},"animation.jellicent.status@2.2":{"target":[[14.99,44.57,-13.26]]},"animation.jellicent.recoil@0.55":{"target":[[0,25.6,-19.13]]},"animation.jellicent.recoil@0.6":{"target":[[0,25.45,-19.35]]},"animation.jellicent.recoil@0.65":{"target":[[0,25.3,-19.57]]},"animation.jellicent.recoil@0.3":{"hand_primary":[[-18,21,1.66]],"target":[[0,25.87,-18.15]]},"animation.jellicent.recoil@0.45":{"hand_primary":[[-18,21,1.11]],"target":[[0,25.87,-18.7]]},"animation.jellicent.recoil@0.75":{"hand_primary":[[-18,21,0]],"target":[[0,25,-20]]}},"galvantula":{"animation.galvantula.cry@1.25":{"target":[[0,7,-14]]},"animation.galvantula.cry@2":{"target":[[0,7,-14]]}},"ferroseed":{"animation.ferroseed.cry@1.25":{"target":[[0,6.08,-7.95]]},"animation.ferroseed.cry@2":{"target":[[0.03,6.6,-7.33]]}},"ferrothorn":{"animation.ferrothorn.cry@1.25":{"target":[[0,7,-18]]},"animation.ferrothorn.cry@2":{"target":[[0,7,-18]]}},"klink":{"animation.klink.special@1.2":{"target":[[0.33,15.65,-10.4]],"special":[[0,16.03,-6.9]],"middle":[[0,16.03,-6.9]]},"animation.klink.special@1.25":{"special":[[0,17,-8]],"target":[[0.34,16.63,-11.5]],"middle":[[0,17,-8]]},"animation.klink.special@1.85":{"target":[[0.34,16.52,-11.56]],"middle":[[0,16.89,-8.06]]},"animation.klink.special@2.15":{"target":[[0.29,15.85,-10.3]]},"animation.klink.special@0.8":{"special":[[0,9.94,-0.9]],"target":[[0.23,9.49,-4.4]]},"animation.klink.special@1.35":{"special":[[0,17.64,-7.63]],"target":[[0.34,17.27,-11.13]]},"animation.klink.special@1.45":{"target":[[0.34,16.1,-11.81]],"middle":[[0,16.47,-8.31]],"face":[[6.38,15.3,-9.27]]},"animation.klink.special@1.95":{"target":[[0.34,16.64,-11.5]]},"animation.klink.special@1.55":{"middle":[[0,17.43,-7.75]],"target":[[0.34,17.06,-11.25]]},"animation.klink.special@2.4":{"middle":[[0,15,-4.8]]},"animation.klink.special@1.3":{"special":[[0,17,-8]],"target":[[0.34,16.63,-11.5]]},"animation.klink.special@3.1":{"target":[[0.03,10.86,-3.42]]},"animation.klink.special@2.25":{"target":[[0.26,15.33,-9.5]]},"animation.klink.special@1.5":{"target":[[0.34,16.63,-11.5]],"middle":[[0,17,-8]]},"animation.klink.special@1.75":{"target":[[0.34,16.85,-11.38]]},"animation.klink.special@1.65":{"target":[[0.34,16.31,-11.68]]},"animation.klink.special@2.2":{"target":[[0.28,15.59,-9.9]]},"animation.klink.special@1.6":{"target":[[0.34,16.63,-11.5]],"middle":[[0,17,-8]]},"animation.klink.special@0":{"special":[[0,12,0]],"middle":[[0,12,0]],"target":[[0,11.5,-3.5]]},"animation.klink.special@2.7":{"middle":[[0,13.5,-2.4]]},"animation.klink.special@0.5":{"middle":[[0,8.81,0.4]]},"animation.klink.special@1.8":{"middle":[[0,17,-8]]},"animation.klink.special@0.4":{"middle":[[0,9.45,0.32]]},"animation.klink.special@0.7":{"special":[[0,8.84,-0.1]],"target":[[0.2,8.38,-3.6]]},"animation.klink.special@2.5":{"target":[[0.18,14.03,-7.5]]},"animation.klink.special@0.55":{"middle":[[0,8.49,0.44]]},"animation.klink.special@0.65":{"eye":[[11.81,8.95,-0.44],[-11.59,13.19,-0.53]]},"animation.klink.special@1.7":{"target":[[0.34,16.63,-11.5]]},"animation.klink.special@2":{"target":[[0.34,16.63,-11.5]]},"animation.klink.special@1":{"middle":[[0,12.14,-2.49]]},"animation.klink.special@3.3":{"middle":[[0,10.08,0.24]]},"animation.klink.special@1.1":{"special":[[0,14.08,-4.69]],"target":[[0.3,13.69,-8.19]]},"animation.klink.special@0.15":{"target":[[0.04,10.54,-3.38]]},"animation.klink.special@0.3":{"target":[[0.09,9.59,-3.26]]},"animation.klink.special@3.9":{"target":[[0.25,10.61,-5.19]]},"animation.klink.physical@1.25":{"target":[[0,15.1,-35.5]],"middle":[[0,15.6,-32]]},"animation.klink.physical@1.05":{"target":[[0,11.59,-20.86]]},"animation.klink.physical@1.2":{"target":[[0,14.05,-31.36]]},"animation.klink.physical@1.45":{"target":[[0,14.64,-36.87]]},"animation.klink.physical@1.65":{"target":[[0,15.58,-34.47]]},"animation.klink.physical@0.1":{"middle":[[0,12,-0.4]],"physical":[[0,12,-0.4]]},"animation.klink.physical@1.3":{"middle":[[0,15.6,-32]],"target":[[0,15.1,-35.5]]},"animation.klink.physical@0":{"physical":[[0,12,0]],"middle":[[0,12,0]]},"animation.klink.physical@1.15":{"target":[[0,13,-27.22]]},"animation.klink.physical@1.5":{"target":[[0,15.1,-35.5]]},"animation.klink.physical@1.1":{"target":[[0,11.95,-23.08]]},"animation.klink.physical@1.35":{"target":[[0,15.9,-33.1]]},"animation.klink.physical@0.3":{"target":[[0,11.5,-6.8]]},"animation.klink.physical@0.5":{"middle":[[0,11.5,-8.67]]},"animation.klink.physical@0.8":{"target":[[0,11.5,-14.97]]},"animation.klink.physical@0.6":{"target":[[0,11.5,-12.39]]},"animation.klink.physical@0.85":{"target":[[0,11.51,-15.82]]},"animation.klink.status@0.1":{"middle":[[0,12.13,0.4]]},"animation.klink.status@1.15":{"special":[[0,16.2,-1]],"target":[[0.14,15.72,-4.5]]},"animation.klink.status@1.85":{"target":[[0.14,16.52,-5.5]]},"animation.klink.status@1.25":{"middle":[[0,17,-2]],"special":[[0,17,-2]],"target":[[0.18,16.53,-5.5]]},"animation.klink.status@1.3":{"middle":[[0,17,-2]]},"animation.klink.status@1.2":{"target":[[0.18,16.13,-5]]},"animation.klink.status@0.5":{"middle":[[0,12.67,2]],"target":[[0.2,12.21,-1.5]]},"animation.klink.status@2.15":{"target":[[0.44,16.44,-5.27]]},"animation.klink.status@0.2":{"target":[[0,11.77,-2.7]]},"animation.klink.status@1.35":{"eye":[[3.14,19.64,-3.1],[-7.01,15.99,-3.1]],"target":[[0.35,16.64,-5.5]]},"animation.klink.status@1.65":{"target":[[0.34,16.63,-5.5]]},"animation.klink.status@2.4":{"middle":[[0,13.53,0.48]]},"animation.klink.status@2":{"target":[[0.36,16.65,-5.5]]},"animation.klink.status@2.05":{"target":[[0.44,16.75,-5.5]]},"animation.klink.status@2.2":{"target":[[0.41,15.76,-4.82]]},"animation.klink.status@1":{"middle":[[0,15,0.5]]},"animation.klink.recoil@0.55":{"target":[[0,12.31,-4.9]]},"animation.klink.recoil@0.6":{"target":[[0,12.38,-4.7]]},"animation.klink.recoil@0.65":{"target":[[0,12.46,-4.51]]},"animation.klink.recoil@0.3":{"target":[[0,14.33,0.29]]},"animation.klink.recoil@0.45":{"target":[[0,13.07,-2.95]]},"animation.klink.recoil@0.75":{"target":[[0,12.6,-4.12]]},"animation.klink.battle_cry@1.25":{"target":[[0.18,16.53,-5.5]]},"animation.klink.battle_cry@2":{"target":[[0.36,16.65,-5.5]]}},"klang":{"animation.klang.special@1.2":{"target":[[-0.4,23.7,-11.94]],"special":[[-0.81,23.41,-10.44]],"middle":[[0,24,-7.44]]},"animation.klang.special@1.25":{"special":[[-0.81,21.91,-12]],"target":[[-0.4,22.2,-13.5]],"middle":[[0,22.5,-9]]},"animation.klang.special@1.85":{"target":[[-0.46,22.58,-13.6]],"middle":[[0,22.38,-9.1]]},"animation.klang.special@2.15":{"target":[[0.48,21.42,-12.15]]},"animation.klang.special@0.8":{"special":[[-0.27,23.22,-2.49]],"target":[[-0.14,23.7,-3.99]]},"animation.klang.special@1.35":{"special":[[0.55,22.49,-11.36]],"target":[[0.27,22.91,-12.86]]},"animation.klang.special@1.45":{"target":[[0.43,22.07,-14.03]],"middle":[[0,21.82,-9.53]],"face":[[0.55,21.98,-12.07]]},"animation.klang.special@1.95":{"target":[[0.11,22.05,-13.47]]},"animation.klang.special@1.55":{"middle":[[0,23.06,-8.56]],"target":[[-0.36,23.4,-13.06]]},"animation.klang.special@2.4":{"middle":[[0,19.3,-5.4]]},"animation.klang.special@1.3":{"special":[[-0.18,21.52,-12]],"target":[[-0.09,22.01,-13.5]]},"animation.klang.special@2.25":{"target":[[0.42,20.77,-11.25]]},"animation.klang.special@1.5":{"target":[[0.14,22.99,-13.49]],"middle":[[0,22.51,-8.99]]},"animation.klang.special@1.75":{"target":[[0.43,23.05,-13.27]]},"animation.klang.special@1.65":{"target":[[-0.06,21.6,-13.81]]},"animation.klang.special@2.2":{"target":[[0.46,21.1,-11.7]]},"animation.klang.special@1.6":{"target":[[-0.47,22.34,-13.49]],"middle":[[0,22.51,-8.99]]},"animation.klang.special@2.7":{"middle":[[0,16.9,-2.7]]},"animation.klang.special@0.5":{"middle":[[0,16.64,1.43]]},"animation.klang.special@1.8":{"middle":[[0,22.52,-8.98]]},"animation.klang.special@0.4":{"middle":[[0,15.61,0.74]]},"animation.klang.special@0.7":{"special":[[-0.02,20.1,-1.8]],"target":[[-0.01,20.6,-3.3]]},"animation.klang.special@2.5":{"target":[[0.43,18.25,-9]]},"animation.klang.special@0.55":{"middle":[[0,17.16,1.77]]},"animation.klang.special@0.65":{"eye":[[-11.95,31.91,0.44]]},"animation.klang.special@1.7":{"target":[[0.42,22.24,-13.49]]},"animation.klang.special@2":{"target":[[0.49,22.38,-13.5]]},"animation.klang.special@1":{"middle":[[0,27.1,-2.28]]},"animation.klang.special@1.1":{"special":[[-0.8,26.4,-7.32]],"target":[[-0.4,26.7,-8.82]]},"animation.klang.special@3.9":{"target":[[-0.26,26.19,-4.96]]},"animation.klang.physical@1.25":{"target":[[-4.15,12.73,-3.61]],"middle":[[0,14.5,-4]]},"animation.klang.physical@1.05":{"target":[[-2.54,15.97,3.21]]},"animation.klang.physical@1.2":{"target":[[-4.37,13.8,-0.82]]},"animation.klang.physical@1.45":{"target":[[-4.15,12.73,-3.61]]},"animation.klang.physical@1.65":{"target":[[-4.15,12.73,-3.61]]},"animation.klang.physical@1.3":{"middle":[[0,14.5,-4]],"target":[[-4.15,12.73,-3.61]]},"animation.klang.physical@1.15":{"target":[[-4.17,13.71,2.21]]},"animation.klang.physical@1.5":{"target":[[-4.15,12.73,-3.61]]},"animation.klang.physical@1.1":{"target":[[-3.37,13.23,3.57]]},"animation.klang.physical@1.35":{"target":[[-4.15,12.73,-3.61]]},"animation.klang.physical@0.3":{"target":[[-0.04,19.17,-4.5]]},"animation.klang.physical@0.5":{"middle":[[0,29.01,1.31]]},"animation.klang.physical@0.8":{"target":[[0.25,35.24,1.82]]},"animation.klang.physical@0.6":{"target":[[0.83,31.96,-1.57]]},"animation.klang.physical@0.85":{"target":[[-0.29,31.22,1.98]]},"animation.klang.status@0.1":{"middle":[[-0.92,13.17,0]]},"animation.klang.status@1.15":{"special":[[5.13,23.57,-3]],"target":[[5.47,23.94,-4.5]]},"animation.klang.status@1.85":{"target":[[4.83,21.24,-4.5]]},"animation.klang.status@1.25":{"middle":[[4.75,18.5,0]],"special":[[4.92,17.52,-3]],"target":[[4.84,18.01,-4.5]]},"animation.klang.status@1.3":{"middle":[[4.75,18.5,0]]},"animation.klang.status@1.2":{"target":[[5.14,20.92,-4.5]]},"animation.klang.status@0.5":{"middle":[[0.31,16.86,0]],"target":[[0.31,16.36,-4.5]]},"animation.klang.status@2.15":{"target":[[2.95,23.65,-4.5]]},"animation.klang.status@0.2":{"target":[[-1.84,11.35,-4.5]]},"animation.klang.status@1.35":{"eye":[[-6.15,25.51,-1.1]],"target":[[4.83,18.01,-4.5]]},"animation.klang.status@1.65":{"target":[[5.4,19.51,-4.5]]},"animation.klang.status@2.4":{"middle":[[-4.71,31.92,0]]},"animation.klang.status@2":{"target":[[3.75,22.43,-4.5]]},"animation.klang.status@2.05":{"target":[[3.75,22.43,-4.5]]},"animation.klang.status@2.2":{"target":[[1.26,26.06,-4.5]]},"animation.klang.status@1":{"middle":[[6.85,30.6,0]]},"animation.klang.recoil@0.55":{"target":[[0,13.31,-5.9]]},"animation.klang.recoil@0.6":{"target":[[0,13.38,-5.7]]},"animation.klang.recoil@0.65":{"target":[[0,13.46,-5.51]]},"animation.klang.recoil@0.3":{"target":[[0,15.33,-0.71]]},"animation.klang.battle_cry@1.25":{"target":[[4.84,18.01,-4.5]]},"animation.klang.battle_cry@2":{"target":[[3.75,22.43,-4.5]]}},"klinklang":{"animation.klinklang.special@1.2":{"target":[[0.2,23,-18.47]],"special":[[-0.26,19.93,-14.61]],"middle":[[0,21.67,-7.76]]},"animation.klinklang.special@1.25":{"special":[[-0.33,21.02,-15.81]],"target":[[0.19,23.99,-19.74]],"middle":[[0,22.9,-9]]},"animation.klinklang.special@1.85":{"target":[[0.19,23.46,-20.49]],"middle":[[0,22.36,-9.75]]},"animation.klinklang.special@2.15":{"target":[[0.19,21.05,-15.42]]},"animation.klinklang.special@1.35":{"special":[[-0.33,21.26,-15.28]],"target":[[0.19,24.23,-19.21]]},"animation.klinklang.special@1.45":{"target":[[0.19,23.7,-20.31]],"middle":[[0,22.61,-9.57]],"face":[[0.02,22.21,-12.14]]},"animation.klinklang.special@1.95":{"target":[[0.19,24.59,-18.94]]},"animation.klinklang.special@1.55":{"middle":[[0,23.25,-8.38]],"target":[[0.19,24.35,-19.12]]},"animation.klinklang.special@2.4":{"middle":[[0,15.58,-0.68]]},"animation.klinklang.special@1.3":{"special":[[-0.33,21.02,-15.81]],"target":[[0.19,23.99,-19.74]]},"animation.klinklang.special@2.25":{"target":[[0.13,19.08,-12.52]]},"animation.klinklang.special@1.5":{"target":[[0.19,23.99,-19.74]],"middle":[[0,22.9,-9]]},"animation.klinklang.special@1.75":{"target":[[0.19,24.47,-19.03]]},"animation.klinklang.special@1.65":{"target":[[0.19,23.58,-20.4]]},"animation.klinklang.special@2.2":{"target":[[0.16,20.06,-13.97]]},"animation.klinklang.special@1.6":{"target":[[0.19,23.99,-19.74]],"middle":[[0,22.9,-9]]},"animation.klinklang.special@0":{"special":[[0,13.5,-7]],"middle":[[0,14.5,0]],"target":[[0,17,-10.5]]},"animation.klinklang.special@2.7":{"middle":[[0,15.04,-0.34]]},"animation.klinklang.special@0.5":{"middle":[[0,14.5,0.64]]},"animation.klinklang.special@1.8":{"middle":[[0,22.9,-9]]},"animation.klinklang.special@0.4":{"middle":[[0,14.62,0.67]]},"animation.klinklang.special@0.7":{"special":[[-0.01,13.48,-6.49]],"target":[[0.03,16.98,-10]]},"animation.klinklang.special@0.55":{"middle":[[0,14.5,0.61]]},"animation.klinklang.special@0.65":{"eye":[[0.93,43.16,1.36]]},"animation.klinklang.special@1.7":{"target":[[0.19,23.99,-19.74]]},"animation.klinklang.special@2":{"target":[[0.19,23.99,-19.74]]},"animation.klinklang.special@1":{"middle":[[0,16.77,-2.8]]},"animation.klinklang.special@3.3":{"middle":[[0,15.34,0.47]]},"animation.klinklang.special@1.1":{"special":[[-0.14,17.76,-12.2]],"target":[[0.17,21,-15.92]]},"animation.klinklang.special@3.9":{"target":[[0.05,18.43,-12.18]]},"animation.klinklang.physical@1.25":{"target":[[0,21,-10.5]],"middle":[[0,18.5,0]]},"animation.klinklang.physical@1.05":{"target":[[0,26.49,-10.5]]},"animation.klinklang.physical@1.2":{"target":[[0,22.37,-10.5]]},"animation.klinklang.physical@1.45":{"target":[[0,21,-10.5]]},"animation.klinklang.physical@1.65":{"target":[[0,21,-10.5]]},"animation.klinklang.physical@0.1":{"middle":[[0,18.1,0]],"physical":[[0,17.1,-7]]},"animation.klinklang.physical@1.3":{"middle":[[0,18.5,0]],"target":[[0,21,-10.5]]},"animation.klinklang.physical@0":{"physical":[[0,13.5,-7]],"middle":[[0,14.5,0]]},"animation.klinklang.physical@1.15":{"target":[[0,23.74,-10.5]]},"animation.klinklang.physical@1.5":{"target":[[0,21,-10.5]]},"animation.klinklang.physical@1.1":{"target":[[0,25.11,-10.5]]},"animation.klinklang.physical@1.35":{"target":[[0,21,-10.5]]},"animation.klinklang.physical@0.3":{"target":[[0,27.8,-10.5]]},"animation.klinklang.physical@0.5":{"middle":[[0,27.76,0]]},"animation.klinklang.physical@0.8":{"target":[[0,30.04,-10.5]]},"animation.klinklang.physical@0.6":{"target":[[0,31.01,-10.5]]},"animation.klinklang.physical@0.85":{"target":[[0,29.71,-10.5]]},"animation.klinklang.status@0.1":{"middle":[[0,14.63,0]]},"animation.klinklang.status@1.15":{"special":[[0.41,16.99,-7]],"target":[[-1.02,20.18,-10.5]]},"animation.klinklang.status@1.85":{"target":[[-1.15,20.72,-10.5]]},"animation.klinklang.status@1.25":{"middle":[[0,18.5,0]],"special":[[0.46,17.61,-7]],"target":[[-1.15,20.72,-10.5]]},"animation.klinklang.status@1.3":{"middle":[[0,18.5,0]]},"animation.klinklang.status@1.2":{"target":[[-1.09,20.45,-10.5]]},"animation.klinklang.status@0.5":{"middle":[[0,15.17,0]]},"animation.klinklang.status@2.15":{"target":[[-0.86,19.8,-10.5]]},"animation.klinklang.status@1.35":{"eye":[[-7.98,19.99,-14.1]],"target":[[-1.15,20.72,-10.5]]},"animation.klinklang.status@1.65":{"target":[[-1.15,20.72,-10.5]]},"animation.klinklang.status@2":{"target":[[-1.15,20.72,-10.5]]},"animation.klinklang.status@2.05":{"target":[[-1.06,20.41,-10.5]]},"animation.klinklang.status@2.2":{"target":[[-0.76,19.48,-10.5]]},"animation.klinklang.recoil@0.55":{"target":[[0,16.8,-10.63]]},"animation.klinklang.recoil@0.6":{"target":[[0,16.47,-11.5]]},"animation.klinklang.recoil@0.65":{"target":[[0,16.35,-11.85]]},"animation.klinklang.recoil@0.3":{"target":[[0,18.48,-6.31]]},"animation.klinklang.recoil@0.45":{"target":[[0,17.48,-8.91]]},"animation.klinklang.recoil@0.75":{"target":[[0,16.55,-11.52]]},"animation.klinklang.battle_cry@1.25":{"target":[[-1.15,20.72,-10.5]]},"animation.klinklang.battle_cry@2":{"target":[[-1.15,20.72,-10.5]]}},"elgyem":{"animation.elgyem.recoil@0.55":{"target":[[0,8.51,-4.8]]},"animation.elgyem.recoil@0.6":{"target":[[0,8.36,-5]]},"animation.elgyem.recoil@0.65":{"target":[[0,8.2,-5.2]]},"animation.elgyem.recoil@0.3":{"hand_primary":[[-6.26,6.39,-2.04]],"target":[[0,9.71,-3.7]]},"animation.elgyem.recoil@0.45":{"hand_primary":[[-6.76,6.46,-1.44]],"target":[[0,8.84,-4.37]]},"animation.elgyem.recoil@0.75":{"hand_primary":[[-7.28,6.69,-1.03]],"target":[[0.08,8.2,-5.47]]},"animation.elgyem.cry@1.25":{"target":[[0,9,-6.02]]},"animation.elgyem.cry@2":{"target":[[0,9.06,-5.73]]}},"beheeyem":{"animation.beheeyem.cry@1.25":{"target":[[0,10,-8]]},"animation.beheeyem.cry@2":{"target":[[0,10,-8]]}},"lampent":{"animation.lampent.cry@1.25":{"target":[[0,12,-10]]},"animation.lampent.cry@2":{"target":[[0,12,-10]]}},"chandelure":{"animation.chandelure.cry@1.25":{"target":[[0,13,-12]]},"animation.chandelure.cry@2":{"target":[[0,13,-12]]}},"axew":{"animation.axew.special@1.2":{"special":[[0.53,10.13,-2.98]]},"animation.axew.special@1.25":{"special":[[0.26,9.62,-3.29]],"target":[[-0.04,7.65,2]],"mouth":[[0.26,9.62,-3.29]],"middle":[[-0.04,7.65,2]],"hand_primary":[[-2.7,5.93,-2.99]]},"animation.axew.special@1.85":{"target":[[-0.04,5.9,4.25]],"middle":[[-0.04,5.9,4.25]]},"animation.axew.special@2.15":{"target":[[-0.04,5.9,4.25]]},"animation.axew.special@1.35":{"special":[[0.32,9.33,-2.07]],"target":[[-0.04,7.85,3.8]]},"animation.axew.special@1.45":{"target":[[-0.04,6.1,4.25]],"middle":[[-0.04,6.1,4.25]],"face":[[0.89,6.82,-7.29]]},"animation.axew.special@1.95":{"target":[[-0.04,5.9,4.25]]},"animation.axew.special@1.55":{"middle":[[-0.04,5.9,4.25]],"target":[[-0.04,5.9,4.25]]},"animation.axew.special@2.4":{"middle":[[-0.04,5.9,4.25]]},"animation.axew.special@1.3":{"special":[[0.28,9.47,-2.68]],"target":[[-0.04,7.75,2.9]]},"animation.axew.special@2.25":{"target":[[-0.04,5.9,4.25]]},"animation.axew.special@1.5":{"target":[[-0.04,5.9,4.25]],"middle":[[-0.04,5.9,4.25]]},"animation.axew.special@1.75":{"target":[[-0.04,5.9,4.25]]},"animation.axew.special@1.65":{"target":[[-0.04,5.9,4.25]]},"animation.axew.special@2.2":{"target":[[-0.04,5.9,4.25]]},"animation.axew.special@1.6":{"target":[[-0.04,5.9,4.25]],"middle":[[-0.04,5.9,4.25]]},"animation.axew.special@2.7":{"middle":[[-0.08,5.9,2.5]]},"animation.axew.special@1.8":{"middle":[[-0.04,5.9,4.25]]},"animation.axew.special@2.5":{"target":[[-0.04,5.9,4.25]]},"animation.axew.special@0.65":{"eye":[[4.4,9.92,-6.91],[-1.58,10.15,-7.24]]},"animation.axew.special@1.7":{"target":[[-0.04,5.9,4.25]]},"animation.axew.special@2":{"target":[[-0.04,5.9,4.25]]},"animation.axew.special@1.1":{"special":[[0.59,9.94,-2.79]]},"animation.axew.special@0.15":{"hand_primary":[[-2.75,5.04,-4.89]]},"animation.axew.physical@1.25":{"target":[[1.88,5.9,-7.03]],"middle":[[1.88,5.9,-7.03]]},"animation.axew.physical@1.05":{"target":[[1.25,5.9,0.25]]},"animation.axew.physical@1.2":{"target":[[1.63,5.9,-4.11]]},"animation.axew.physical@1.45":{"target":[[1.88,5.9,-7.51]]},"animation.axew.physical@1.65":{"target":[[1.88,5.9,-7.99]]},"animation.axew.physical@0.1":{"hand_primary":[[-2.82,4.64,-5.03]],"physical":[[4.7,8.43,-6.24],[-4.27,8.15,-5.52]]},"animation.axew.physical@1.3":{"middle":[[1.88,5.9,-7.15]],"target":[[1.88,5.9,-7.15]]},"animation.axew.physical@0":{"hand_primary":[[-2.69,4.48,-5]],"physical":[[5.76,7.84,-5.61],[-3.22,8.18,-6.1]]},"animation.axew.physical@1.15":{"target":[[1.38,5.9,-1.2]]},"animation.axew.physical@1.5":{"target":[[1.88,5.9,-7.63]]},"animation.axew.physical@1.1":{"target":[[1.25,5.9,0.25]]},"animation.axew.physical@1.35":{"target":[[1.88,5.9,-7.27]]},"animation.axew.physical@0.5":{"middle":[[1.25,5.9,0.25]]},"animation.axew.physical@0.8":{"target":[[1.25,5.9,0.25]]},"animation.axew.physical@0.6":{"target":[[1.25,5.9,0.25]]},"animation.axew.physical@0.85":{"target":[[1.25,5.9,0.25]]},"animation.axew.status@1.85":{"target":[[-0.12,9.5,0.97]]},"animation.axew.status@1.25":{"middle":[[-0.12,8.9,0.97]],"special":[[-0.43,14.05,-1.49]],"target":[[-0.12,8.9,0.97]]},"animation.axew.status@1.3":{"middle":[[-0.12,9,0.97]]},"animation.axew.status@1.2":{"target":[[-0.12,7.1,0.97]]},"animation.axew.status@1.35":{"eye":[[1.77,18.28,-1.24],[-4.03,16.82,-1.71]],"target":[[-0.12,9.1,0.97]]},"animation.axew.status@1.65":{"target":[[-0.12,9.7,0.97]]},"animation.axew.status@2":{"target":[[-0.12,8.9,0.97]]},"animation.axew.status@2.05":{"target":[[-0.12,7.7,0.97]]},"animation.axew.recoil@0.3":{"hand_primary":[[-5.5,6.68,-1.29]]},"animation.axew.recoil@0.45":{"hand_primary":[[-5.5,6.45,-1.57]]},"animation.axew.recoil@0.75":{"hand_primary":[[-5.5,6.37,-1.66]]}},"mienfoo":{"animation.mienfoo.cry@1.25":{"target":[[0,13,-8]]},"animation.mienfoo.cry@1.9":{"root":[[0,0,0]]},"animation.mienfoo.cry@2":{"target":[[0,13,-8]]}},"golurk":{"animation.golurk.special@1.2":{"target":[[0,49.2,29.89]],"special":[[0,17.96,14.73]],"middle":[[0,22.77,28.51]]},"animation.golurk.special@1.25":{"special":[[0,22.42,13.86]],"target":[[0,51.25,33.22]],"middle":[[0,25.27,28.18]],"hand_primary":[[-28.2,-11.8,46.16]]},"animation.golurk.special@1.85":{"target":[[0,54.48,63.1]],"middle":[[0,40.53,40.62]]},"animation.golurk.special@2.15":{"target":[[0,53.38,48.82]]},"animation.golurk.special@0.8":{"special":[[0,38.07,14.44]],"target":[[0,54.96,44.77]]},"animation.golurk.special@1.35":{"special":[[0,43.65,25.22]],"target":[[0,56.35,57.53]]},"animation.golurk.special@1.45":{"target":[[0,54.1,60.08]],"middle":[[0,37.83,39.21]],"face":[[0,18.35,63.09]]},"animation.golurk.special@1.95":{"target":[[0,53.08,56.76]]},"animation.golurk.special@1.55":{"middle":[[0,39.63,40.8]],"target":[[0,54.52,62.67]]},"animation.golurk.special@2.4":{"middle":[[0,26.86,20.92]]},"animation.golurk.special@1.3":{"special":[[0,39.31,26.52]],"target":[[0,55.82,57.06]]},"animation.golurk.special@3.1":{"target":[[0,60.66,-23.16]]},"animation.golurk.special@2.25":{"target":[[0,55.5,46.52]]},"animation.golurk.special@1.5":{"target":[[0,56.68,61.49]],"middle":[[0,41.14,40.07]]},"animation.golurk.special@1.75":{"target":[[0,54.58,64.64]]},"animation.golurk.special@1.65":{"target":[[0,54.44,64.57]]},"animation.golurk.special@2.2":{"target":[[0,55.45,47.99]]},"animation.golurk.special@1.6":{"target":[[0,54.57,63.81]],"middle":[[0,40.34,41.5]]},"animation.golurk.special@2.7":{"middle":[[0,49.86,1.01]]},"animation.golurk.special@0.5":{"middle":[[0,35.63,25.16]]},"animation.golurk.special@1.8":{"middle":[[0,40.8,41.47]]},"animation.golurk.special@0.4":{"middle":[[0,45.53,15.1]]},"animation.golurk.special@0.7":{"special":[[0,33.35,13.75]],"target":[[0,56.64,39.5]]},"animation.golurk.special@2.5":{"target":[[0,54.95,-6.06]]},"animation.golurk.special@0.55":{"middle":[[0,19.41,27.78]]},"animation.golurk.special@0.65":{"eye":[[-2,26.72,58.44],[2,26.72,58.44]]},"animation.golurk.special@1.7":{"target":[[0,54.51,65.03]]},"animation.golurk.special@2":{"target":[[0,50.92,52.11]]},"animation.golurk.special@1":{"middle":[[0,32.78,27.97]]},"animation.golurk.special@3.3":{"middle":[[0,47.5,8.85]]},"animation.golurk.special@1.1":{"special":[[0,28.64,13.75]],"target":[[0,53.46,38.04]]},"animation.golurk.special@0.15":{"hand_primary":[[-26.82,55.98,38.83]],"target":[[0,60.86,-21.78]]},"animation.golurk.special@0.3":{"hand_secondary":[[28.2,66.67,44.69]],"target":[[0,61.52,-13.6]]},"animation.golurk.special@3.9":{"target":[[0,54.42,44.93]]},"animation.golurk.physical@1.25":{"target":[[17.43,54.27,-29.24]],"middle":[[1.5,44.27,-10.63]]},"animation.golurk.physical@1.05":{"target":[[-9.51,59.17,-15.24]]},"animation.golurk.physical@1.2":{"target":[[15.77,54.65,-28.77]]},"animation.golurk.physical@1.45":{"target":[[17.41,53.27,-29.88]]},"animation.golurk.physical@1.65":{"target":[[14.91,52.25,-27.91]]},"animation.golurk.physical@0.1":{"middle":[[0.39,50.2,0.84]],"hand_primary":[[-40,37.94,-12.84]],"physical":[[-40,37.94,-12.84]]},"animation.golurk.physical@1.3":{"middle":[[1.65,43.96,-10.81]],"target":[[17.59,53.96,-29.41]]},"animation.golurk.physical@1.15":{"target":[[5.27,55.38,-24.48]]},"animation.golurk.physical@1.5":{"target":[[16.52,53.29,-29.98]]},"animation.golurk.physical@1.1":{"target":[[-5.15,57.5,-18.94]]},"animation.golurk.physical@1.35":{"target":[[17.76,53.66,-29.57]]},"animation.golurk.physical@0.3":{"target":[[-8.23,60.2,-16.46]]},"animation.golurk.physical@0.5":{"middle":[[3.52,50.2,8.96]]},"animation.golurk.physical@0.8":{"target":[[-12.3,60.2,-8.7]]},"animation.golurk.physical@0.6":{"target":[[-12.55,60.2,-8.88]]},"animation.golurk.physical@0.85":{"target":[[-12.17,60.2,-8.98]]},"animation.golurk.status@0.1":{"middle":[[-1.8,49.88,-0.1]]},"animation.golurk.status@1.15":{"special":[[4.24,33.53,-0.25]],"target":[[4,56.52,-24.6]]},"animation.golurk.status@1.85":{"target":[[4,50.6,-24.59]]},"animation.golurk.status@1.25":{"middle":[[4,43.78,-0.1]],"special":[[4.26,32.75,-0.38]],"target":[[4,53.78,-24.6]]},"animation.golurk.status@1.3":{"middle":[[4,41.58,-0.04]]},"animation.golurk.status@1.2":{"target":[[4,56.1,-24.6]]},"animation.golurk.status@0.5":{"middle":[[-5.85,50.49,-0.1]],"target":[[-5.85,60.49,-24.6]]},"animation.golurk.status@2.15":{"target":[[4,50.55,-24.6]]},"animation.golurk.status@0.2":{"target":[[-3.6,59.61,-24.6]]},"animation.golurk.status@1.35":{"eye":[[8.79,70.06,-2.38],[5.76,70.08,-5]],"target":[[4,51.3,-24.61]]},"animation.golurk.status@1.65":{"target":[[4,51.26,-24.61]]},"animation.golurk.status@2.4":{"middle":[[2.8,42.29,-0.1]]},"animation.golurk.status@2":{"target":[[4,50.98,-24.61]]},"animation.golurk.status@2.05":{"target":[[4,50.41,-24.59]]},"animation.golurk.status@2.2":{"target":[[4,50.73,-24.6]]},"animation.golurk.status@1":{"middle":[[4,43.95,-0.1]]},"animation.golurk.recoil@0.3":{"hand_primary":[[-27.88,31.75,17.79]]},"animation.golurk.recoil@0.45":{"hand_primary":[[-27.83,31.05,15.8]]},"animation.golurk.recoil@0.75":{"hand_primary":[[-23.96,27.87,0.55]]},"animation.golurk.battle_cry@1.25":{"target":[[4,53.78,-24.6]]},"animation.golurk.battle_cry@2":{"target":[[4,50.98,-24.61]]}},"bouffalant":{"animation.bouffalant.physical@1.25":{"target":[[9.41,18.74,-40.62]],"middle":[[4.43,18.74,-10.01]]},"animation.bouffalant.physical@1.05":{"target":[[1.9,17.48,-26.27]]},"animation.bouffalant.physical@1.2":{"target":[[7.53,18.42,-37.04]]},"animation.bouffalant.physical@1.45":{"target":[[10.42,19,-42.41]]},"animation.bouffalant.physical@1.65":{"target":[[9.72,19,-40.89]]},"animation.bouffalant.physical@0.1":{"middle":[[-1.32,18.51,2.11]],"physical":[[23.49,19.17,-16.75],[-15.19,17.42,-18.51]]},"animation.bouffalant.physical@1.3":{"middle":[[5.97,19,-12.94]],"target":[[10.94,19,-43.55]]},"animation.bouffalant.physical@1.15":{"target":[[5.65,18.11,-33.45]]},"animation.bouffalant.physical@1.5":{"target":[[10.24,19,-42.03]]},"animation.bouffalant.physical@1.1":{"target":[[3.78,17.8,-29.86]]},"animation.bouffalant.physical@1.35":{"target":[[10.77,19,-43.17]]},"animation.bouffalant.physical@0.3":{"target":[[1.01,17.54,-24.27]]},"animation.bouffalant.physical@0.5":{"middle":[[-4.95,17.17,7.93]]},"animation.bouffalant.physical@0.8":{"target":[[0.02,17.17,-22.68]]},"animation.bouffalant.physical@0.6":{"target":[[0.02,17.17,-22.68]]},"animation.bouffalant.physical@0.85":{"target":[[0.02,17.17,-22.68]]},"animation.bouffalant.status@1.15":{"mouth":[[5.79,15.51,-22.2]],"special":[[5.79,15.51,-22.2]]},"animation.bouffalant.status@1.25":{"special":[[9.04,22.28,-21.15]]},"animation.bouffalant.status@1.35":{"eye":[[6.04,28.74,-21.11],[-1.31,25.53,-20.48]]}},"larvesta":{"animation.larvesta.special@1.2":{"special":[[0.28,7.03,-14.65]]},"animation.larvesta.special@1.25":{"special":[[0.17,2.01,-15.41]],"hand_primary":[[-4.57,1.63,-12.45]]},"animation.larvesta.special@0.8":{"special":[[0.07,11.14,-5.51]],"target":[[0,7,-10.75]]},"animation.larvesta.special@1.35":{"special":[[0.15,2.05,-15.53]]},"animation.larvesta.special@1.45":{"face":[[0.16,3.47,-14.11]]},"animation.larvesta.special@1.3":{"special":[[0.16,2.03,-15.47]]},"animation.larvesta.special@0.5":{"middle":[[0,8,1.25]]},"animation.larvesta.special@0.7":{"special":[[0.22,9.99,-7.84]],"target":[[0,7,-11.75]]},"animation.larvesta.special@0.55":{"middle":[[0,8,1.75]]},"animation.larvesta.special@0.65":{"eye":[[2.8,10.76,-4.2],[-2.9,10.73,-4.2]]},"animation.larvesta.special@1":{"middle":[[0,8,5]]},"animation.larvesta.special@1.1":{"special":[[-0.01,13.85,-6.09]],"target":[[0,7,-11]]},"animation.larvesta.special@3.9":{"target":[[0,7,-10]]},"animation.larvesta.physical@1.25":{"target":[[1.13,7,-24.95]],"middle":[[-0.17,8,-10.01]]},"animation.larvesta.physical@1.05":{"target":[[-1.26,12.62,-18.43]]},"animation.larvesta.physical@1.2":{"target":[[0.61,8.21,-24.35]]},"animation.larvesta.physical@1.45":{"target":[[1.13,7,-24.95]]},"animation.larvesta.physical@1.65":{"target":[[1.13,7,-24.95]]},"animation.larvesta.physical@1.3":{"middle":[[-0.17,8,-10.01]],"target":[[1.13,7,-24.95]]},"animation.larvesta.physical@1.15":{"target":[[-1.43,13.02,-21.35]]},"animation.larvesta.physical@1.5":{"target":[[1.13,7,-24.95]]},"animation.larvesta.physical@1.1":{"target":[[-1.15,13.98,-20.6]]},"animation.larvesta.physical@1.35":{"target":[[1.13,7,-24.95]]},"animation.larvesta.physical@0.3":{"target":[[-2.16,7,-12.26]]},"animation.larvesta.physical@0.5":{"middle":[[-1.48,8,6.6]]},"animation.larvesta.physical@0.8":{"target":[[-7.97,7,-4.01]]},"animation.larvesta.physical@0.6":{"target":[[-6.57,7,-6.13]]},"animation.larvesta.physical@0.85":{"target":[[-7.97,7,-4.01]]},"animation.larvesta.status@1.15":{"special":[[-0.48,16.35,-6.27]],"target":[[0,14.85,-11.95]]},"animation.larvesta.status@1.85":{"target":[[0,15.07,-9.81]]},"animation.larvesta.status@1.25":{"middle":[[0,14.01,3.38]],"special":[[-0.27,22.25,-4.15]],"target":[[0,21.22,-9.81]]},"animation.larvesta.status@1.3":{"middle":[[0,14.01,3.38]]},"animation.larvesta.status@1.2":{"target":[[0,18.09,-10.93]]},"animation.larvesta.status@0.5":{"target":[[0,9.19,-14.01]]},"animation.larvesta.status@2.15":{"target":[[0,11.35,-12.92]]},"animation.larvesta.status@1.35":{"eye":[[2.83,19.63,-0.66],[-2.88,19.62,-0.68]],"target":[[0,21.22,-9.81]]},"animation.larvesta.status@1.65":{"target":[[0,14.94,-9.81]]},"animation.larvesta.status@2":{"target":[[0,15.22,-9.81]]},"animation.larvesta.status@2.05":{"target":[[0,14.03,-10.93]]},"animation.larvesta.status@2.2":{"target":[[0,9.88,-13.76]]},"animation.larvesta.status@1":{"middle":[[0,7.87,1.92]]},"animation.larvesta.recoil@0.3":{"hand_primary":[[-3.92,6.28,-9.52]]},"animation.larvesta.recoil@0.45":{"hand_primary":[[-3.2,4.68,-10.76]]},"animation.larvesta.battle_cry@1.25":{"target":[[0,21.22,-9.81]]},"animation.larvesta.battle_cry@2":{"target":[[0,15.22,-9.81]]}},"volcarona":{"animation.volcarona.special@1.2":{"special":[[0.56,32.09,-13.6]]},"animation.volcarona.special@1.25":{"special":[[0.57,32.42,-14.68]],"hand_primary":[[-5.53,30.48,-11.73],[-4.85,27.4,-10.16]]},"animation.volcarona.special@0.8":{"special":[[0.27,33.88,-11.01]]},"animation.volcarona.special@1.35":{"special":[[0,29.23,-3.4]]},"animation.volcarona.special@1.45":{"face":[[0,31.34,-2.7]]},"animation.volcarona.special@1.3":{"special":[[0.12,30.28,-8.25]]},"animation.volcarona.special@0":{"special":[[0,31.2,-9.7]]},"animation.volcarona.special@0.7":{"special":[[0.2,34.7,-10.86]]},"animation.volcarona.special@0.65":{"eye":[[2.48,38.06,-11.12],[-2.5,37.83,-11.41]]},"animation.volcarona.special@1.1":{"special":[[0.55,32.96,-13.55]]},"animation.volcarona.special@0.15":{"hand_primary":[[-4.36,29.19,-7.98],[-4.03,26.2,-7.28]]},"animation.volcarona.special@0.3":{"hand_secondary":[[4.23,31.97,-8.54],[4.37,28.67,-7.62]]},"animation.volcarona.physical@0.1":{"hand_primary":[[-4,29.2,-4.65],[-3.98,26.46,-4.03]],"physical":[[-3.85,40.86,-9.21]]},"animation.volcarona.physical@0":{"hand_primary":[[-4.03,28.01,-7.22],[-4,25.2,-7.1]],"physical":[[-3.89,41.97,-9.48]]},"animation.volcarona.status@1.15":{"special":[[9.67,56.43,-2.05]]},"animation.volcarona.status@1.25":{"special":[[2.34,55.1,-11.28]]},"animation.volcarona.status@1.35":{"eye":[[4.15,58.41,-10.07],[-0.8,58.48,-10.8]]},"animation.volcarona.recoil@0.3":{"hand_primary":[[-4,27.26,-5.24],[-4,24.27,-5.48]]},"animation.volcarona.recoil@0.45":{"hand_primary":[[-4,27.18,-6.26],[-4,24.25,-6.9]]},"animation.volcarona.recoil@0.75":{"hand_primary":[[-4,26.01,-7.07],[-4,23.05,-7.55]]}},"braixen":{"animation.braixen.cry@1.25":{"target":[[0,22,-8]]},"animation.braixen.cry@2":{"target":[[0,22,-8]]}},"delphox":{"animation.delphox.special@1.2":{"target":[[-1.02,35.7,-9.82]],"special":[[26.54,30.26,-1.74]],"middle":[[-0.03,35.7,-2.13]]},"animation.delphox.special@1.25":{"special":[[10.66,35.98,-39.39]],"target":[[-1.73,36,-10.81]],"mouth":[[3.67,37.37,-18.36]],"middle":[[-0.05,36,-3.24]],"hand_primary":[[-0.12,27.53,-31.11]]},"animation.delphox.special@1.85":{"target":[[-1.73,36,-10.81]],"middle":[[-0.05,36,-3.24]]},"animation.delphox.special@2.15":{"target":[[-1.73,36,-10.81]]},"animation.delphox.special@0.8":{"special":[[-0.55,46.88,8.16]],"target":[[2.41,34.25,-4.13]]},"animation.delphox.special@1.35":{"special":[[7.12,40.82,-42.81]],"target":[[-1.73,36,-10.81]]},"animation.delphox.special@1.45":{"target":[[-1.73,36,-10.81]],"middle":[[-0.05,36,-3.24]],"face":[[0.16,41.83,-18.05]]},"animation.delphox.special@1.95":{"target":[[-1.73,36,-10.81]]},"animation.delphox.special@1.55":{"middle":[[-0.05,36,-3.24]],"target":[[-1.73,36,-10.81]]},"animation.delphox.special@2.4":{"middle":[[-0.03,35.35,-1.48]]},"animation.delphox.special@1.3":{"special":[[6.5,38.72,-42.99]],"target":[[-1.73,36,-10.81]]},"animation.delphox.special@3.1":{"target":[[0.84,35.4,-6.76]]},"animation.delphox.special@2.25":{"target":[[-1.41,35.77,-10.24]]},"animation.delphox.special@1.5":{"target":[[-1.73,36,-10.81]],"middle":[[-0.05,36,-3.24]]},"animation.delphox.special@1.75":{"target":[[-1.73,36,-10.81]]},"animation.delphox.special@1.65":{"target":[[-1.73,36,-10.81]]},"animation.delphox.special@2.2":{"target":[[-1.6,35.91,-10.58]]},"animation.delphox.special@1.6":{"target":[[-1.73,36,-10.81]],"middle":[[-0.05,36,-3.24]]},"animation.delphox.special@0.5":{"middle":[[0.08,34.25,3.26]]},"animation.delphox.special@1.8":{"middle":[[-0.05,36,-3.24]]},"animation.delphox.special@0.4":{"middle":[[0.08,34.25,3.26]]},"animation.delphox.special@0.7":{"special":[[2.85,47.22,7.85]],"target":[[2.41,34.25,-4.13]]},"animation.delphox.special@2.5":{"target":[[-0.64,35.4,-8.92]]},"animation.delphox.special@0.55":{"middle":[[0.08,34.25,3.26]]},"animation.delphox.special@0.65":{"eye":[[14.25,37.7,-3.33],[11.81,37.25,-7.44]]},"animation.delphox.special@1.7":{"target":[[-1.73,36,-10.81]]},"animation.delphox.special@2":{"target":[[-1.73,36,-10.81]]},"animation.delphox.special@1":{"middle":[[0.06,34.5,2.33]]},"animation.delphox.special@3.3":{"middle":[[0.08,34.25,3.26]]},"animation.delphox.special@1.1":{"special":[[5.67,46.01,3.02]],"target":[[0.41,35.1,-7.65]]},"animation.delphox.special@0.15":{"hand_primary":[[7.89,33.17,-24.3]],"target":[[1.25,35.1,-6.1]]},"animation.delphox.special@0.3":{"hand_secondary":[[13.8,35.13,15.87]],"target":[[2.41,34.25,-4.13]]},"animation.delphox.special@3.9":{"target":[[2.41,34.25,-4.13]]}},"froakie":{"animation.froakie.cry@1.25":{"target":[[0,10,-8]]},"animation.froakie.cry@2":{"target":[[0,10,-8]]}},"frogadier":{"animation.frogadier.cry@1.25":{"target":[[0,20,-7]]},"animation.frogadier.cry@2":{"target":[[0,20,-7]]}},"greninja":{"animation.greninja.special@1.2":{"target":[[0,28.02,-1]],"special":[[-8.13,39.53,-2.76]],"middle":[[0,28.02,9]]},"animation.greninja.special@1.25":{"special":[[1.68,36.24,-3.94]],"target":[[0,23.89,-1]],"mouth":[[0,40.45,6.11]],"middle":[[0,23.89,9]],"hand_primary":[[1.68,36.24,-3.94]]},"animation.greninja.special@1.85":{"target":[[0,26.1,-1]],"middle":[[0,26.1,9]]},"animation.greninja.special@2.15":{"target":[[0,25.73,-1.1]]},"animation.greninja.special@0.8":{"special":[[-2.61,33.55,-3.1]],"target":[[0,25.81,-1]]},"animation.greninja.special@1.35":{"special":[[-1.58,24.98,-4.74]],"target":[[0,25.65,-1]]},"animation.greninja.special@1.45":{"target":[[0,25.65,-1]],"middle":[[0,25.65,9]],"face":[[0,34.84,-2.12]]},"animation.greninja.special@1.95":{"target":[[0,26.2,-1]]},"animation.greninja.special@1.55":{"middle":[[0,25.94,9]],"target":[[0,25.94,-1]]},"animation.greninja.special@2.4":{"middle":[[0,20.71,7.91]]},"animation.greninja.special@1.3":{"special":[[-0.13,24.38,-4.21]],"target":[[0,24.74,-1]]},"animation.greninja.special@3.1":{"target":[[0,21.21,-2.39]]},"animation.greninja.special@2.25":{"target":[[0,25.12,-1.25]]},"animation.greninja.special@1.5":{"target":[[0,26.1,-1]],"middle":[[0,26.1,9]]},"animation.greninja.special@1.75":{"target":[[0,26.08,-1]]},"animation.greninja.special@1.65":{"target":[[0,26.32,-1]]},"animation.greninja.special@2.2":{"target":[[0,25.43,-1.18]]},"animation.greninja.special@1.6":{"target":[[0,26.05,-1]],"middle":[[0,26.05,9]]},"animation.greninja.special@0":{"middle":[[0,15.9,6]],"target":[[0,15.9,-4]]},"animation.greninja.special@2.7":{"middle":[[0,15.58,6.34]]},"animation.greninja.special@0.5":{"middle":[[0,26.22,9]]},"animation.greninja.special@1.8":{"middle":[[0,26.26,9]]},"animation.greninja.special@0.4":{"middle":[[0,26.41,8.99]]},"animation.greninja.special@0.7":{"special":[[-1.34,34.47,-1.72]],"target":[[0,25.81,-1]]},"animation.greninja.special@2.5":{"target":[[0,17.73,-2.75]]},"animation.greninja.special@0.55":{"middle":[[0,26.08,9]]},"animation.greninja.special@0.65":{"eye":[[3.66,41.58,5.2],[-3.66,41.58,5.2]]},"animation.greninja.special@1.7":{"target":[[0,26.07,-1]]},"animation.greninja.special@2":{"target":[[0,26.13,-1]]},"animation.greninja.special@1":{"middle":[[0,26.81,9]]},"animation.greninja.special@3.3":{"middle":[[0,26.07,8.95]]},"animation.greninja.special@1.1":{"special":[[-9.56,36.53,-0.9]],"target":[[0,27.89,-1]]},"animation.greninja.special@0.15":{"hand_primary":[[-13.59,11.03,-7.79]],"target":[[0,23.21,-1.81]]},"animation.greninja.special@0.3":{"hand_secondary":[[14.61,32.67,-7.9]],"target":[[0,26.07,-1.05]]},"animation.greninja.special@3.9":{"target":[[0,25.99,-1]]},"animation.greninja.physical_katana@1.25":{"target":[[0,17.37,-34.22]]},"animation.greninja.physical@1.25":{"target":[[0,12.49,-19.99]],"middle":[[0,12.49,-9.99]]},"animation.greninja.physical@1.05":{"target":[[0,11.43,3.54]]},"animation.greninja.physical@1.2":{"target":[[0,12.64,-0.95]]},"animation.greninja.physical@1.45":{"target":[[0,10.38,-15.98]]},"animation.greninja.physical@1.65":{"target":[[0,11.07,-14.84]]},"animation.greninja.physical@0.1":{"middle":[[0,14.54,4.73]],"hand_primary":[[-8.83,2.64,-5.66]],"physical":[[-8.83,2.64,-5.66]]},"animation.greninja.physical@1.3":{"middle":[[0,11.34,-8.67]],"target":[[0,11.34,-18.67]]},"animation.greninja.physical@0":{"middle":[[0,15.9,6]]},"animation.greninja.physical@1.15":{"target":[[0,11.82,4.11]]},"animation.greninja.physical@1.5":{"target":[[0,10.29,-15.2]]},"animation.greninja.physical@1.1":{"target":[[0,11.62,3.82]]},"animation.greninja.physical@1.35":{"target":[[0,10.55,-17.54]]},"animation.greninja.physical@0.3":{"target":[[0,20.69,-3.64]]},"animation.greninja.physical@0.5":{"middle":[[0,22.6,8.41]]},"animation.greninja.physical@0.8":{"target":[[0,17.39,-0.13]]},"animation.greninja.physical@0.6":{"target":[[0,22.14,-1.1]]},"animation.greninja.physical@0.85":{"target":[[0,14.24,0.41]]},"animation.greninja.physical_tongue@1.25":{"target":[[0,22.43,11.45]]},"animation.greninja.physical_tongue@1.2":{"target":[[0.05,24.68,2.49]]},"animation.greninja.physical_tongue@1.15":{"target":[[-0.35,22.66,3.46]]},"animation.greninja.status@0.1":{"middle":[[-0.5,14.1,5.16]]},"animation.greninja.status@1.15":{"mouth":[[2.9,38.95,-0.49]],"special":[[-2.99,32.23,-6.16]],"target":[[3.64,23.5,-5.76]]},"animation.greninja.status@1.85":{"target":[[-0.21,12.62,-2.79]]},"animation.greninja.status@1.25":{"middle":[[0.91,12.17,6.74]],"special":[[-18.58,15.83,-1.16]],"target":[[0.91,12.17,-3.26]]},"animation.greninja.status@1.3":{"middle":[[-0.09,11.42,7.02]]},"animation.greninja.status@1.2":{"target":[[3.46,18.61,-4.69]]},"animation.greninja.status@0.5":{"middle":[[-2.82,20.96,4.28]],"target":[[-2.82,20.96,-5.72]]},"animation.greninja.status@2.15":{"target":[[0,12.11,-3.38]]},"animation.greninja.status@0.2":{"target":[[-1.16,14.28,-5.54]]},"animation.greninja.status@1.35":{"eye":[[3.76,17.51,-10.92],[-3.56,17.76,-11.12]],"target":[[-0.82,11.06,-2.8]]},"animation.greninja.status@1.65":{"target":[[-0.66,12.68,-2.8]]},"animation.greninja.status@2.4":{"middle":[[0,15.14,6.12]]},"animation.greninja.status@2":{"target":[[-0.04,11.92,-3.03]]},"animation.greninja.status@2.05":{"target":[[0,11.72,-3.13]]},"animation.greninja.status@2.2":{"target":[[0,12.31,-3.5]]},"animation.greninja.status@1":{"middle":[[3.07,25.93,3.86]]},"animation.greninja.recoil@0.55":{"target":[[0,27,-10]]},"animation.greninja.recoil@0.6":{"target":[[0,27,-10]]},"animation.greninja.recoil@0.65":{"target":[[0,27,-10]]},"animation.greninja.recoil@0.3":{"hand_primary":[[-27.5,36.07,-0.1]],"target":[[0,27,-10]]},"animation.greninja.recoil@0.45":{"hand_primary":[[-27.5,36,-0.5]],"target":[[0,27,-10]]},"animation.greninja.recoil@0.75":{"hand_primary":[[-27.43,36.52,1.36]],"target":[[0,27,-10]]},"animation.greninja.physical_tongue@1.3":{"target":[[0,20,14.62]]},"animation.greninja.battle_cry@1.25":{"target":[[0.91,12.17,-3.26]]},"animation.greninja.battle_cry@2":{"target":[[-0.04,11.92,-3.03]]},"animation.greninja.watershuriken_5hit@0.15":{"hand_primary":[[-9.57,8.61,-3.31]],"target":[[5.48,16.8,10.49]]},"animation.greninja.watershuriken_5hit@0.3":{"hand_secondary":[[27.37,19.78,25.41]],"target":[[2.38,16.6,18.49]]}},"skiddo":{"animation.skiddo.special@1.2":{"special":[[0,13.91,-12.76]]},"animation.skiddo.special@1.25":{"special":[[0,8.73,-13.49]],"mouth":[[0,8.73,-13.49]]},"animation.skiddo.special@0.8":{"special":[[-0.01,13.1,-10.74]]},"animation.skiddo.special@1.35":{"special":[[0,9.22,-13.39]]},"animation.skiddo.special@1.3":{"special":[[0,8.87,-13.48]]},"animation.skiddo.special@0.7":{"special":[[0.04,12.39,-11.09]]},"animation.skiddo.special@0.65":{"eye":[[1.7,15.62,-11.41],[-3.37,14.47,-11.54]]},"animation.skiddo.special@1.1":{"special":[[0,19.24,-8.52]]},"animation.skiddo.physical@1.25":{"target":[[0,12,-32]],"middle":[[0,13,-17]]},"animation.skiddo.physical@1.2":{"target":[[0,12,-25.2]]},"animation.skiddo.physical@1.45":{"target":[[0,12,-32]]},"animation.skiddo.physical@1.65":{"target":[[0,12,-32]]},"animation.skiddo.physical@0.1":{"physical":[[0.04,19.06,-9.18]]},"animation.skiddo.physical@1.3":{"middle":[[0,13,-17]],"target":[[0,12,-32]]},"animation.skiddo.physical@1.15":{"target":[[0,12,-18.4]]},"animation.skiddo.physical@1.5":{"target":[[0,12,-32]]},"animation.skiddo.physical@1.35":{"target":[[0,12,-32]]},"animation.skiddo.status@1.15":{"mouth":[[2.65,21.79,-11.37]],"special":[[2.65,21.79,-11.37]],"target":[[2.33,14.8,-16.51]]},"animation.skiddo.status@1.25":{"middle":[[2,27,0]],"special":[[1.57,29.61,-13.01]],"target":[[1.51,26,-14.99]]},"animation.skiddo.status@1.3":{"middle":[[1.2,27,0]]},"animation.skiddo.status@1.2":{"target":[[1.92,20.4,-15.76]]},"animation.skiddo.status@0.5":{"middle":[[-4.61,15.67,-0.8]],"target":[[-7.64,14.67,-15.49]]},"animation.skiddo.status@1.35":{"eye":[[3,27.47,-13.56],[-2.2,27.47,-13.56]],"target":[[0.4,26,-15]]},"animation.skiddo.status@1":{"middle":[[6.25,13,-1]]},"animation.skiddo.battle_cry@1.25":{"target":[[1.51,26,-14.99]]}},"tyrantrum":{"animation.tyrantrum.special@0.65":{"eye":[[-17.63,58.67,-44.49],[-4.08,58.52,-46.04]]},"animation.tyrantrum.status@1.35":{"eye":[[-16.56,75.77,-36.14],[-3.27,74.17,-38.74]]}},"goomy":{"animation.goomy.status@1.35":{"eye":[[1.49,6.5,-4.09],[-2.5,6.5,-4.52]]}},"brionne":{"animation.brionne.cry@1.25":{"target":[[0,16,-6]]},"animation.brionne.cry@2":{"target":[[0,16,-6]]}},"primarina":{"animation.primarina.cry@1.25":{"target":[[0,46,-6]]},"animation.primarina.cry@2":{"target":[[0,46,-6]]}},"gumshoos":{"animation.gumshoos.recoil@0.55":{"target":[[0,13.5,-14]]},"animation.gumshoos.recoil@0.6":{"target":[[0,13.5,-14]]},"animation.gumshoos.recoil@0.65":{"target":[[0,13.5,-14]]},"animation.gumshoos.recoil@0.3":{"hand_primary":[[-4.9,1.05,-8]],"target":[[0,13.5,-14]]},"animation.gumshoos.recoil@0.45":{"hand_primary":[[-4.9,-1.2,-8.9]],"target":[[0,13.5,-14]]},"animation.gumshoos.recoil@0.75":{"hand_primary":[[-4.9,-2.7,-9.5]],"target":[[0,13.5,-14]]},"animation.gumshoos.cry@1.25":{"target":[[0,13.5,-14]]},"animation.gumshoos.cry@2":{"target":[[0,13.5,-14]]}},"grubbin":{"animation.grubbin.physical@1.25":{"target":[[-8.26,3,-7.12]],"middle":[[-1.5,3,0.25]]},"animation.grubbin.physical@1.05":{"target":[[-4.01,3,-10.13]]},"animation.grubbin.physical@1.2":{"target":[[-7.26,3,-7.96]]},"animation.grubbin.physical@1.45":{"target":[[-8.26,3,-7.12]]},"animation.grubbin.physical@1.65":{"target":[[-8.26,3,-7.12]]},"animation.grubbin.physical@0.1":{"physical":[[1.32,4.58,-8.23],[-1.37,4.63,-8.28]]},"animation.grubbin.physical@1.3":{"middle":[[-1.5,3,0.25]],"target":[[-8.26,3,-7.12]]},"animation.grubbin.physical@1.15":{"target":[[-6.21,3,-8.75]]},"animation.grubbin.physical@1.5":{"target":[[-8.26,3,-7.12]]},"animation.grubbin.physical@1.1":{"target":[[-5.13,3,-9.47]]},"animation.grubbin.physical@1.35":{"target":[[-8.26,3,-7.12]]},"animation.grubbin.physical@0.3":{"target":[[-1.92,7.68,-9.14]]},"animation.grubbin.physical@0.5":{"middle":[[-0.79,4.34,-0.05]]},"animation.grubbin.physical@0.8":{"target":[[-3.83,3,-10.24]]},"animation.grubbin.physical@0.6":{"target":[[-3.32,5.94,-9.77]]},"animation.grubbin.physical@0.85":{"target":[[-3.83,3,-10.24]]}},"vikavolt":{"animation.vikavolt.special@1.2":{"target":[[-0.65,22.1,-2.83]],"special":[[-0.65,19.85,-9.58]],"middle":[[-0.65,21.76,8.17]]},"animation.vikavolt.special@1.25":{"special":[[-0.45,16.06,-9.15]],"target":[[-0.45,19.9,-3.15]],"mouth":[[-0.45,18.42,-1.09]],"middle":[[-0.45,22.28,7.59]],"hand_primary":[[-4.34,12.8,3.59]]},"animation.vikavolt.special@1.85":{"target":[[0.05,21.87,-2.28]],"middle":[[0.05,24.53,8.39]]},"animation.vikavolt.special@2.15":{"target":[[0.37,22.47,-1.05]]},"animation.vikavolt.special@0.8":{"special":[[-0.18,20.72,-19.05]],"target":[[-0.18,20.39,-11.94]]},"animation.vikavolt.special@1.35":{"special":[[-0.46,16.54,-10.67]],"target":[[-0.46,20.4,-4.69]]},"animation.vikavolt.special@1.45":{"target":[[-0.52,20.91,-4.04]],"middle":[[-0.52,23.38,6.67]],"face":[[-0.52,20.99,-2.03]]},"animation.vikavolt.special@1.95":{"target":[[0.2,21.98,-1.87]]},"animation.vikavolt.special@1.55":{"middle":[[-0.48,23.59,7.19]],"target":[[-0.48,21.07,-3.51]]},"animation.vikavolt.special@2.4":{"middle":[[0.42,21.49,6.39]]},"animation.vikavolt.special@1.3":{"special":[[-0.45,16.29,-11.01]],"target":[[-0.45,20.14,-5.02]]},"animation.vikavolt.special@3.1":{"target":[[0.16,13.29,-10.9]]},"animation.vikavolt.special@2.25":{"target":[[0.39,22.67,-0.63]]},"animation.vikavolt.special@1.5":{"target":[[-0.55,21.06,-3.72]],"middle":[[-0.55,23.56,6.99]]},"animation.vikavolt.special@1.75":{"target":[[-0.13,21.67,-2.69]]},"animation.vikavolt.special@1.65":{"target":[[-0.31,21.3,-3.1]]},"animation.vikavolt.special@2.2":{"target":[[0.38,22.55,-0.84]]},"animation.vikavolt.special@1.6":{"target":[[-0.4,21.4,-3.31]],"middle":[[-0.4,23.95,7.39]]},"animation.vikavolt.special@0":{"special":[[-0.09,9.61,-17]],"middle":[[0,15.09,0]],"target":[[-0.03,13.18,-10.84]]},"animation.vikavolt.special@2.7":{"middle":[[0.43,14.42,0]]},"animation.vikavolt.special@0.5":{"middle":[[0.92,13.62,0]]},"animation.vikavolt.special@1.8":{"middle":[[-0.04,24.25,8.19]]},"animation.vikavolt.special@0.4":{"middle":[[0.74,13.93,0]]},"animation.vikavolt.special@0.7":{"special":[[0.31,17.7,-18.75]],"target":[[0.31,18.15,-11.65]]},"animation.vikavolt.special@2.5":{"target":[[0.44,16.53,-6.76]]},"animation.vikavolt.special@0.55":{"middle":[[0.96,13.57,-0.06]]},"animation.vikavolt.special@0.65":{"eye":[[-1.96,15.54,-9.86],[3.04,15.54,-9.86]]},"animation.vikavolt.special@1.7":{"target":[[-0.22,21.49,-2.9]]},"animation.vikavolt.special@2":{"target":[[0.26,22.18,-1.66]]},"animation.vikavolt.special@1":{"middle":[[-1.36,18.52,-3.18]]},"animation.vikavolt.special@3.3":{"middle":[[0.55,14.22,0]]},"animation.vikavolt.special@1.1":{"special":[[-2.03,26.26,-20.37]],"target":[[-2.03,25.01,-13.37]]},"animation.vikavolt.special@0.15":{"hand_primary":[[-2.41,4.03,-3.99]],"target":[[0.26,13.34,-10.92]]},"animation.vikavolt.special@0.3":{"hand_secondary":[[3.32,3.64,-4.67]],"target":[[0.55,13.51,-10.98]]},"animation.vikavolt.special@3.9":{"target":[[-0.74,22.62,-12.11]]},"animation.vikavolt.physical@1.25":{"target":[[-0.36,10.28,-40.78]],"middle":[[-0.39,12.5,-30.01]]},"animation.vikavolt.physical@1.05":{"target":[[-0.04,28.44,30.1]]},"animation.vikavolt.physical@1.2":{"target":[[-0.28,23.57,3.49]]},"animation.vikavolt.physical@1.45":{"target":[[-0.52,15.07,-39.47]]},"animation.vikavolt.physical@1.65":{"target":[[-0.43,18.5,-42]]},"animation.vikavolt.physical@0.1":{"middle":[[0.1,16.03,5.06]],"hand_primary":[[-2.67,4.76,1.13]],"physical":[[2.9,9.88,-18],[-2.85,9.97,-18.01]]},"animation.vikavolt.physical@1.3":{"middle":[[-0.44,12.56,-27.07]],"target":[[-0.43,11.42,-38.01]]},"animation.vikavolt.physical@0":{"hand_primary":[[-2.63,4.49,-3.33]],"physical":[[1.89,8.87,-22.96],[-2.11,8.94,-22.96]],"middle":[[0,15.09,0]]},"animation.vikavolt.physical@1.15":{"target":[[-0.21,27.43,20.63]]},"animation.vikavolt.physical@1.5":{"target":[[-0.53,16,-40.9]]},"animation.vikavolt.physical@1.1":{"target":[[-0.13,28.57,27.33]]},"animation.vikavolt.physical@1.35":{"target":[[-0.48,12.78,-36.6]]},"animation.vikavolt.physical@0.3":{"target":[[0.29,16.09,4.33]]},"animation.vikavolt.physical@0.5":{"middle":[[0.5,19.77,25.31]]},"animation.vikavolt.physical@0.8":{"target":[[0.28,24.42,28.1]]},"animation.vikavolt.physical@0.6":{"target":[[0.49,19.74,19.16]]},"animation.vikavolt.physical@0.85":{"target":[[0.23,25.57,30.34]]},"animation.vikavolt.status@0.1":{"middle":[[0.17,15.72,-1.3]]},"animation.vikavolt.status@1.15":{"mouth":[[-0.23,9.71,-4.2]],"special":[[-0.24,9.45,-12.67]],"target":[[-0.26,11.75,-6.11]]},"animation.vikavolt.status@1.85":{"target":[[-0.19,34.63,-13.46]]},"animation.vikavolt.status@1.25":{"middle":[[-0.39,21.95,3.26]],"special":[[-0.17,15.64,-13.22]],"target":[[-0.36,19.57,-7.48]]},"animation.vikavolt.status@1.3":{"middle":[[-0.44,25.51,1.3]]},"animation.vikavolt.status@1.2":{"target":[[-0.32,12.57,-6.2]]},"animation.vikavolt.status@0.5":{"middle":[[0.49,8.74,-3.3]],"target":[[0.49,8.74,-14.3]]},"animation.vikavolt.status@2.15":{"target":[[0.25,33.83,-12.95]]},"animation.vikavolt.status@0.2":{"target":[[0.31,11.89,-13.88]]},"animation.vikavolt.status@1.35":{"eye":[[-2.84,26.52,-9.1],[2.16,26.55,-9.12]],"target":[[-0.48,26.67,-11.25]]},"animation.vikavolt.status@1.65":{"target":[[-0.48,30.18,-13.94]]},"animation.vikavolt.status@2.4":{"middle":[[0.39,26.83,-1.34]]},"animation.vikavolt.status@2":{"target":[[0.03,34.23,-13.21]]},"animation.vikavolt.status@2.05":{"target":[[0.1,34.1,-13.13]]},"animation.vikavolt.status@2.2":{"target":[[0.33,33.7,-12.86]]},"animation.vikavolt.status@1":{"middle":[[-0.03,9.03,3.58]]},"animation.vikavolt.air_recoil@0.55":{"target":[[-0.34,10.25,-6.57]]},"animation.vikavolt.air_recoil@0.6":{"target":[[-0.83,10.04,-7.17]]},"animation.vikavolt.air_recoil@0.65":{"target":[[-1.32,9.84,-7.78]]},"animation.vikavolt.air_recoil@0.3":{"hand_primary":[[-0.83,1.35,-3.02]],"target":[[1.92,10.61,-4.97]]},"animation.vikavolt.air_recoil@0.45":{"hand_primary":[[-2.11,1.39,-3.41]],"target":[[0.64,10.65,-5.36]]},"animation.vikavolt.air_recoil@0.75":{"hand_primary":[[-4.65,0.12,-6.92]],"target":[[-1.9,9.38,-8.87]]},"animation.vikavolt.battle_cry@1.25":{"target":[[-0.36,19.57,-7.48]]},"animation.vikavolt.battle_cry@2":{"target":[[0.03,34.23,-13.21]]}},"cutiefly":{"animation.cutiefly.cry@2":{"target":[[-0.07,17.01,-9.54]]}},"ribombee":{"animation.ribombee.cry@2":{"target":[[0,12.4,-6]]}},"scorbunny":{"animation.scorbunny.cry@1.25":{"target":[[0,9,-7]]},"animation.scorbunny.cry@2":{"target":[[0,9,-7]]}},"cinderace":{"animation.cinderace.special@1.2":{"target":[[0,33.11,-6.5]],"special":[[0,45.11,-3.3]],"middle":[[0,33.11,4.5]]},"animation.cinderace.special@1.25":{"special":[[0,44.03,-12.08]],"target":[[0,32.03,-12.08]],"mouth":[[0,40.24,-8.57]],"middle":[[0,32.03,-1.08]],"hand_primary":[[-5.51,49.78,-5.42]]},"animation.cinderace.special@1.85":{"target":[[0,28.98,-24.46]],"middle":[[0,28.98,-13.46]]},"animation.cinderace.special@2.15":{"target":[[0,28.98,-24.64]]},"animation.cinderace.special@0.8":{"special":[[0,36.54,11.47]],"target":[[0,29.74,8.23]]},"animation.cinderace.special@1.35":{"special":[[0,27.89,-27.24]],"target":[[0,28.98,-16.22]]},"animation.cinderace.special@1.45":{"target":[[0,28.98,-19.5]],"middle":[[0,28.98,-8.5]],"face":[[0,31.57,-23.06]]},"animation.cinderace.special@1.95":{"target":[[0,28.98,-24.52]]},"animation.cinderace.special@1.55":{"middle":[[0,28.98,-10.4]],"target":[[0,28.98,-21.4]]},"animation.cinderace.special@2.4":{"middle":[[0,32.78,-3.72]]},"animation.cinderace.special@1.3":{"special":[[0,34.4,-20.84]],"target":[[0,30.2,-14.24]]},"animation.cinderace.special@3.1":{"target":[[0,34.02,-3.37]]},"animation.cinderace.special@2.25":{"target":[[0,29.34,-25.34]]},"animation.cinderace.special@1.5":{"target":[[0,28.98,-20.52]],"middle":[[0,28.98,-9.52]]},"animation.cinderace.special@1.75":{"target":[[0,28.98,-23.96]]},"animation.cinderace.special@1.65":{"target":[[0,28.98,-23.18]]},"animation.cinderace.special@2.2":{"target":[[0,28.98,-24.67]]},"animation.cinderace.special@1.6":{"target":[[0,28.98,-22.29]],"middle":[[0,28.98,-11.29]]},"animation.cinderace.special@0":{"special":[[0,31.5,-11.75]],"middle":[[0,31.5,2.25]],"target":[[0,31.5,-8.75]]},"animation.cinderace.special@2.7":{"middle":[[0,31.5,2.25]]},"animation.cinderace.special@0.5":{"middle":[[0,30.15,16.6]]},"animation.cinderace.special@1.8":{"middle":[[0,28.98,-13.26]]},"animation.cinderace.special@0.4":{"middle":[[0,30.05,15.88]]},"animation.cinderace.special@0.7":{"special":[[0,35.21,9.12]],"target":[[0,30.01,7.35]]},"animation.cinderace.special@2.5":{"target":[[0,31.85,-9.26]]},"animation.cinderace.special@0.55":{"middle":[[0,30.28,17.05]]},"animation.cinderace.special@0.65":{"eye":[[-2.15,39.39,13.35],[2.15,39.39,13.35]]},"animation.cinderace.special@1.7":{"target":[[0,28.98,-23.67]]},"animation.cinderace.special@2":{"target":[[0,28.98,-24.55]]},"animation.cinderace.special@1":{"middle":[[0,29.11,21.08]]},"animation.cinderace.special@3.3":{"middle":[[0,33.77,15.3]]},"animation.cinderace.special@1.1":{"special":[[0,41.33,18.04]],"target":[[0,29.73,10.4]]},"animation.cinderace.special@0.15":{"hand_primary":[[-6.96,28.02,3.29]],"target":[[0,36.72,0.99]]},"animation.cinderace.special@0.3":{"hand_secondary":[[11.04,27.74,10.79]],"target":[[0,33.77,4.3]]},"animation.cinderace.special@3.9":{"target":[[0,29.39,9.13]]},"animation.cinderace.physical@1.25":{"target":[[2.65,31.39,-15.3]],"middle":[[2.65,31.39,-4.3]]},"animation.cinderace.physical@1.05":{"target":[[2.65,31.74,-3.31]]},"animation.cinderace.physical@1.2":{"target":[[2.65,31.3,-3.59]]},"animation.cinderace.physical@1.45":{"target":[[2.65,33.04,-20.25]]},"animation.cinderace.physical@1.65":{"target":[[2.65,32.01,-20.73]]},"animation.cinderace.physical@0.1":{"middle":[[0,29.3,-2.55]],"hand_primary":[[-6.25,31.96,-5.34]],"physical":[[-4.46,1.75,-8.62]]},"animation.cinderace.physical@1.3":{"middle":[[2.65,32.22,-7.01]],"target":[[2.65,32.22,-18.01]]},"animation.cinderace.physical@0":{"hand_primary":[[-5.12,30.45,-6.81]],"physical":[[-5.34,0.6,1.55]],"middle":[[0,31.5,2.25]]},"animation.cinderace.physical@1.15":{"target":[[2.65,31.64,-2.61]]},"animation.cinderace.physical@1.5":{"target":[[2.65,31.61,-20.54]]},"animation.cinderace.physical@1.1":{"target":[[2.65,31.74,-3.04]]},"animation.cinderace.physical@1.35":{"target":[[2.65,34.25,-19.2]]},"animation.cinderace.physical@0.3":{"target":[[0.27,26.93,-11.53]]},"animation.cinderace.physical@0.5":{"middle":[[1.72,29.77,3.96]]},"animation.cinderace.physical@0.8":{"target":[[2.65,31.56,-4.24]]},"animation.cinderace.physical@0.6":{"target":[[2.34,30.84,-5.74]]},"animation.cinderace.physical@0.85":{"target":[[2.65,31.59,-4.06]]},"animation.cinderace.status@0.1":{"middle":[[0,38.15,5.82]]},"animation.cinderace.status@1.15":{"mouth":[[0.14,25.3,12.54]],"special":[[0,28.96,18.07]],"target":[[0,28.96,21.07]]},"animation.cinderace.status@1.85":{"target":[[0,15.84,-13.66]]},"animation.cinderace.status@1.25":{"middle":[[0,25.46,27.42]],"special":[[0,25.46,13.42]],"target":[[0,25.46,16.42]]},"animation.cinderace.status@1.3":{"middle":[[0,22.58,20.32]]},"animation.cinderace.status@1.2":{"target":[[0,28.16,20.18]]},"animation.cinderace.status@0.5":{"middle":[[0,28.69,25.72]],"target":[[0,28.69,14.72]]},"animation.cinderace.status@2.15":{"target":[[0,15.84,-16.74]]},"animation.cinderace.status@0.2":{"target":[[0,44.49,1.76]]},"animation.cinderace.status@1.35":{"eye":[[-2.59,29.22,8.49],[1.71,29.25,8.42]],"target":[[0,19.65,2.92]]},"animation.cinderace.status@1.65":{"target":[[0,15.84,-10.57]]},"animation.cinderace.status@2.4":{"middle":[[0,15.69,-6.79]]},"animation.cinderace.status@2":{"target":[[0,15.88,-15.52]]},"animation.cinderace.status@2.05":{"target":[[0,15.62,-15.93]]},"animation.cinderace.status@2.2":{"target":[[0,15.74,-17.14]]},"animation.cinderace.status@1":{"middle":[[0,25.36,30.99]]},"animation.cinderace.recoil@0.55":{"target":[[0,32,-11]]},"animation.cinderace.recoil@0.6":{"target":[[0,32,-11]]},"animation.cinderace.recoil@0.65":{"target":[[0,32,-11]]},"animation.cinderace.recoil@0.3":{"hand_primary":[[-19,34.53,0.17]],"target":[[0,32,-11]]},"animation.cinderace.recoil@0.45":{"hand_primary":[[-19,34.07,2.42]],"target":[[0,32,-11]]},"animation.cinderace.recoil@0.75":{"hand_primary":[[-19,34.66,-0.25]],"target":[[0,32,-11]]},"animation.cinderace.battle_cry@1.25":{"target":[[0,25.46,16.42]]},"animation.cinderace.battle_cry@2":{"target":[[0,15.88,-15.52]]},"animation.cinderace.pyroball@2.15":{"target":[[-7.84,61.54,-9.53]]}},"greedent":{"animation.greedent.recoil@0.3":{"hand_primary":[[-11.51,13.39,0.26]],"target":[[0,12.18,-5.44]]},"animation.greedent.recoil@0.45":{"hand_primary":[[-11.51,13.36,0.28]],"target":[[0,12.18,-5.44]]},"animation.greedent.recoil@0.75":{"hand_primary":[[-11.52,12.07,-1.46]]}},"rookidee":{"animation.rookidee.special@1.2":{"target":[[0.02,8.8,-1.75]],"special":[[-0.12,9.51,-2.08]],"middle":[[0,8.8,4.25]]},"animation.rookidee.special@1.25":{"special":[[-0.13,9.02,-1.92]],"target":[[-0.02,8.33,-1.58]],"middle":[[0,8.33,4.42]]},"animation.rookidee.special@1.85":{"target":[[-0.24,6,-0.4]],"middle":[[0,6,5.6]]},"animation.rookidee.special@2.15":{"target":[[-0.26,6,-0.37]]},"animation.rookidee.special@0.8":{"special":[[-0.11,9.93,-5.01]],"target":[[0.11,8.61,-5.25]]},"animation.rookidee.special@1.35":{"special":[[-0.15,7.99,-1.61]],"target":[[-0.1,7.4,-1.25]]},"animation.rookidee.special@1.45":{"target":[[-0.17,6.47,-0.91]],"middle":[[0,6.47,5.08]],"face":[[-0.16,7.43,0.34]]},"animation.rookidee.special@1.95":{"target":[[-0.25,6,-0.29]]},"animation.rookidee.special@1.55":{"middle":[[0,6,5.3]],"target":[[-0.21,6,-0.7]]},"animation.rookidee.special@2.4":{"middle":[[0,6.9,2.6]]},"animation.rookidee.special@1.3":{"special":[[-0.13,8.54,-1.75]],"target":[[-0.06,7.87,-1.42]]},"animation.rookidee.special@2.25":{"target":[[-0.25,6.38,-1.81]]},"animation.rookidee.special@1.5":{"target":[[-0.21,6,-0.75]],"middle":[[0,6,5.25]]},"animation.rookidee.special@1.75":{"target":[[-0.23,6,-0.5]]},"animation.rookidee.special@1.65":{"target":[[-0.22,6,-0.6]]},"animation.rookidee.special@2.2":{"target":[[-0.26,6.1,-1.14]]},"animation.rookidee.special@1.6":{"target":[[-0.22,6,-0.65]],"middle":[[0,6,5.35]]},"animation.rookidee.special@2.7":{"middle":[[0,6.71,0.81]]},"animation.rookidee.special@1.8":{"middle":[[0,6,5.55]]},"animation.rookidee.special@0.7":{"special":[[-0.08,8.05,-5.48]],"target":[[0.04,6.96,-5.69]]},"animation.rookidee.special@2.5":{"target":[[0.24,6,-4]]},"animation.rookidee.special@1.7":{"target":[[-0.23,6,-0.55]]},"animation.rookidee.special@2":{"target":[[-0.26,6,-0.24]]},"animation.rookidee.special@1":{"middle":[[0,9.75,2.84]]},"animation.rookidee.special@1.1":{"special":[[-0.1,10.3,-2.56]],"target":[[0.1,9.55,-2.23]]},"animation.rookidee.special@3.9":{"target":[[0.11,9.73,-4.12]]},"animation.rookidee.physical@1.25":{"target":[[0.82,17.13,-8.68]],"middle":[[0.49,15.97,-2.81]]},"animation.rookidee.physical@1.05":{"target":[[-0.99,18.4,-3.98]]},"animation.rookidee.physical@1.2":{"target":[[0.15,19.42,-7.33]]},"animation.rookidee.physical@1.45":{"target":[[2.31,5.03,-12.16]]},"animation.rookidee.physical@1.65":{"target":[[2.26,6.14,-11.61]]},"animation.rookidee.physical@1.3":{"middle":[[0.89,10.61,-4.05]],"target":[[1.38,11.31,-9.98]]},"animation.rookidee.physical@1.15":{"target":[[-0.14,19.41,-6.17]]},"animation.rookidee.physical@1.5":{"target":[[2.37,5.47,-12.3]]},"animation.rookidee.physical@1.1":{"target":[[-0.52,19.07,-5.05]]},"animation.rookidee.physical@1.35":{"target":[[1.95,7.09,-11.31]]},"animation.rookidee.physical@0.3":{"target":[[-0.66,8.87,-4.17]]},"animation.rookidee.physical@0.5":{"middle":[[-1.23,5.75,3.75]]},"animation.rookidee.physical@0.8":{"target":[[-2.31,13.97,-1.76]]},"animation.rookidee.physical@0.6":{"target":[[-1.6,7.44,-2.11]]},"animation.rookidee.physical@0.85":{"target":[[-2.09,14.92,-2.05]]},"animation.rookidee.status@1.15":{"special":[[-0.21,6.17,-7.82]],"target":[[1.26,6.17,-7.55]]},"animation.rookidee.status@1.25":{"middle":[[0.11,6.49,-1.67]],"special":[[-0.79,7.16,-8]],"target":[[0.11,6.49,-7.67]]},"animation.rookidee.status@1.3":{"middle":[[-0.44,6.7,-1.72]]},"animation.rookidee.status@1.2":{"target":[[0.74,6.19,-7.6]]},"animation.rookidee.status@0.5":{"middle":[[3.08,7,-0.82]],"target":[[3.08,7,-6.82]]},"animation.rookidee.status@0.2":{"target":[[1.45,6.67,-6.38]]},"animation.rookidee.status@1.35":{"eye":[[-3.08,7.97,-5.85],[1.39,8.54,-5.87]],"target":[[-0.67,6.48,-7.72]]},"animation.rookidee.status@1.65":{"target":[[-1,6,-7.72]]},"animation.rookidee.status@1":{"middle":[[2.15,7.75,-1.55]]},"animation.rookidee.battle_cry@1.25":{"target":[[0.11,6.49,-7.67]]}},"thievul":{"animation.thievul.cry@1.25":{"target":[[0,16,-16.5]]},"animation.thievul.cry@2":{"target":[[0,16,-16.5]]}},"cursola":{"animation.cursola.special@1.2":{"special":[[0,19.4,-11.51]]},"animation.cursola.special@1.25":{"special":[[0,21.05,-10.18]],"mouth":[[0,18.22,-4.49]]},"animation.cursola.special@0.8":{"special":[[0,14.1,-14.31]]},"animation.cursola.special@1.35":{"special":[[0,23.75,-6.6]]},"animation.cursola.special@1.45":{"face":[[0,23,-1.07]]},"animation.cursola.special@1.3":{"special":[[0,22.81,-8.06]]},"animation.cursola.special@0.7":{"special":[[0,14.33,-14.12]]},"animation.cursola.special@0.65":{"eye":[[1.64,17.35,-8.83],[-1.64,17.35,-8.83]]},"animation.cursola.special@1.1":{"special":[[0,16.43,-13.49]]},"animation.cursola.recoil@0.3":{"target":[[0,18.65,-6.92]]}},"falinks":{"animation.falinks.physical@0.1":{"physical":[[0,17.93,-41.84]]},"animation.falinks.physical@0":{"physical":[[0,16.46,-43.16]]}},"cufant":{"animation.cufant.special@0.65":{"eye":[[4.59,13.74,-9.92],[-5.4,13.42,-9.75]]},"animation.cufant.status@1.35":{"eye":[[5.51,13.74,-9.82],[-4.48,13.74,-10.35]]}},"copperajah":{"animation.copperajah.special@0.65":{"eye":[[11.5,41.23,-32.15],[-11.5,41.23,-32.15]]},"animation.copperajah.status@1.35":{"eye":[[11.5,58.62,-15.3],[-11.5,58.62,-15.3]]}},"duraludon":{"animation.duraludon.special@1.2":{"target":[[0,20.89,-10.04]],"special":[[0,15.29,-20.46]],"middle":[[0,18.89,-2.04]]},"animation.duraludon.special@1.25":{"special":[[0,12.85,-20.16]],"target":[[0,20.06,-9.44]],"mouth":[[0,12.85,-20.16]],"middle":[[0,18.06,-1.44]],"hand_primary":[[-8.49,-0.67,-13.13]]},"animation.duraludon.special@1.85":{"target":[[0,20.16,-7.33]],"middle":[[0,18.16,0.67]]},"animation.duraludon.special@2.15":{"target":[[0,20.19,-6.82]]},"animation.duraludon.special@0.8":{"special":[[0.76,28.58,-1.86]],"target":[[0.52,20.17,-9.99]]},"animation.duraludon.special@1.35":{"special":[[0,15.34,-19.13]],"target":[[0,20.71,-8.53]]},"animation.duraludon.special@1.45":{"face":[[0,20.65,-22.78]]},"animation.duraludon.special@1.95":{"target":[[0,20.08,-6.98]]},"animation.duraludon.special@2.4":{"middle":[[0,18.27,0.92]]},"animation.duraludon.special@1.3":{"special":[[0,14.4,-19.32]],"target":[[0,20.66,-8.83]]},"animation.duraludon.special@3.1":{"target":[[0.5,21.6,-9.08]]},"animation.duraludon.special@2.25":{"target":[[0,20.28,-6.82]]},"animation.duraludon.special@1.5":{"target":[[0,20.63,-8.12]],"middle":[[0,18.63,-0.12]]},"animation.duraludon.special@2.2":{"target":[[0,20.31,-6.82]]},"animation.duraludon.special@1.6":{"target":[[0,20.64,-8.13]],"middle":[[0,18.64,-0.13]]},"animation.duraludon.special@0.5":{"middle":[[1.33,20.93,-2]]},"animation.duraludon.special@1.8":{"middle":[[0,18.63,0.23]]},"animation.duraludon.special@0.4":{"middle":[[1.27,20.62,-2]]},"animation.duraludon.special@0.7":{"special":[[5.05,31.4,-1.53]],"target":[[2.28,22.59,-9.93]]},"animation.duraludon.special@0.55":{"middle":[[1.34,20.97,-2]]},"animation.duraludon.special@0.65":{"eye":[[6.96,31.83,-4.82],[2.83,32.5,-4.91]]},"animation.duraludon.special@1.7":{"target":[[0,20.66,-8.15]]},"animation.duraludon.special@2":{"target":[[0,20.48,-6.81]]},"animation.duraludon.special@1":{"middle":[[-0.11,18.81,-1.97]]},"animation.duraludon.special@3.3":{"middle":[[1.16,20.14,-1.93]]},"animation.duraludon.special@1.1":{"special":[[-0.03,14.82,-20.57]],"target":[[-0.03,20.85,-9.92]]},"animation.duraludon.special@0.15":{"hand_primary":[[-12.9,13.05,-10.48]],"target":[[0.88,21.71,-9.49]]},"animation.duraludon.special@0.3":{"hand_secondary":[[15.81,13.78,-11.01]],"target":[[1.66,22.14,-9.92]]},"animation.duraludon.special@3.9":{"target":[[-0.15,20.74,-10]]},"animation.duraludon.physical@1.25":{"target":[[-2.61,21.05,-5.91]],"middle":[[-2.15,19.05,2.08]]},"animation.duraludon.physical@1.05":{"target":[[-2.94,21.37,-0.7]]},"animation.duraludon.physical@1.2":{"target":[[-4,21.74,-2.13]]},"animation.duraludon.physical@1.45":{"target":[[1.72,21.67,-7.12]]},"animation.duraludon.physical@1.65":{"target":[[-2.25,22.07,-10.24]]},"animation.duraludon.physical@0.1":{"hand_primary":[[-11.82,14.59,-10.16]],"physical":[[-11.82,14.59,-10.16]]},"animation.duraludon.physical@1.3":{"middle":[[-0.68,19.59,1.65]],"target":[[0.49,21.59,-6.27]]},"animation.duraludon.physical@1.15":{"target":[[-3.36,22.51,0.14]]},"animation.duraludon.physical@1.1":{"target":[[-3.2,21.94,-0.27]]},"animation.duraludon.physical@1.35":{"target":[[1.99,21.86,-6.37]]},"animation.duraludon.physical@0.3":{"target":[[-0.09,21.49,-4.88]]},"animation.duraludon.physical@0.5":{"middle":[[-0.73,19.08,5.37]]},"animation.duraludon.physical@0.8":{"target":[[-2.04,20.51,-1.75]]},"animation.duraludon.physical@0.6":{"target":[[-1.05,20.72,-2.1]]},"animation.duraludon.physical@0.85":{"target":[[-2.35,20.57,-1.59]]},"animation.duraludon.status@1.15":{"mouth":[[0.1,27.91,-1.1]],"special":[[0.1,27.91,-1.1]],"target":[[0.33,20.19,-7.61]]},"animation.duraludon.status@1.25":{"middle":[[0,17.83,0.15]],"special":[[-0.24,28.15,-1.58]],"target":[[0.21,19.83,-7.85]]},"animation.duraludon.status@1.2":{"target":[[0.27,19.68,-7.71]]},"animation.duraludon.status@0.5":{"middle":[[0,18.63,-0.2]],"target":[[0.01,20.63,-8.2]]},"animation.duraludon.status@1.35":{"eye":[[-0.85,29.01,-13.76],[-4.93,29.11,-12.83]]},"animation.duraludon.status@1.65":{"target":[[-1.59,22.13,-7.85]]},"animation.duraludon.status@1":{"middle":[[0,18.6,0.48]]},"animation.duraludon.recoil@0.3":{"hand_primary":[[-18.38,19.03,2.14]]},"animation.duraludon.recoil@0.45":{"hand_primary":[[-18.49,19.22,0.58]]},"animation.duraludon.recoil@0.75":{"hand_primary":[[-18.26,17.72,1.21]]},"animation.duraludon.battle_cry@1.25":{"target":[[0.21,19.83,-7.85]]}},"dragapult":{"animation.dragapult.special@0.65":{"eye":[[10.4,35.66,39.33],[6.08,36.38,39.65],[0.78,34.02,38.68],[-14.98,35.82,37.07],[-10.82,36.67,38.21],[-5.59,34.04,38.13]]}},"kleavor":{"animation.kleavor.special@0.65":{"eye":[[4.15,39.51,-11.91],[-0.21,39.76,-12.44]]},"animation.kleavor.status@1.35":{"eye":[[-3.14,36.77,-23.66],[-7.26,35.94,-22.38]]}},"ursaluna":{"animation.ursaluna.recoil@0.3":{"hand_primary":[[-38,19.5,-7]]},"animation.ursaluna.recoil@0.45":{"hand_primary":[[-38,19.5,-7]]},"animation.ursaluna.recoil@0.75":{"hand_primary":[[-38,19.5,-7]]}},"sneasler":{"animation.sneasler.recoil@0.55":{"target":[[0,27,-6]]},"animation.sneasler.recoil@0.6":{"target":[[0,27,-6]]},"animation.sneasler.recoil@0.65":{"target":[[0,27,-6]]},"animation.sneasler.recoil@0.3":{"hand_primary":[[-18.79,30.45,8.41]],"target":[[0,27,-6]]},"animation.sneasler.recoil@0.45":{"hand_primary":[[-19.16,30.66,6.56]],"target":[[0,27,-6]]},"animation.sneasler.recoil@0.75":{"hand_primary":[[-19.82,29.16,0.63]],"target":[[0,27,-6]]},"animation.sneasler.cry@1.25":{"target":[[0,27,-6]]},"animation.sneasler.cry@2":{"target":[[0,27,-6]]}},"garganacl":{"animation.garganacl.cry@1.25":{"target":[[0,26,-14]]},"animation.garganacl.cry@2":{"target":[[0,26,-14]]}},"armarouge":{"animation.armarouge.special@0.65":{"eye":[[2.71,29.46,-33.62],[-1.79,29.41,-33.48]]},"animation.armarouge.status@1.35":{"eye":[[2.24,35.78,4.26],[-2.26,35.77,4.24]]}},"ceruledge":{"animation.ceruledge.special@0.65":{"eye":[[6.09,27.96,-5.14],[1.49,28.05,-5]]},"animation.ceruledge.status@1.35":{"eye":[[3.73,31.65,-4.79],[-0.77,32.21,-5.57]]}},"tadbulb":{"animation.tadbulb.special@1.2":{"target":[[1.67,31.28,-6.61]],"special":[[1.28,32.58,-4.77]],"middle":[[0.42,33.25,-0.46]]},"animation.tadbulb.special@1.25":{"special":[[1.95,34.99,-4.58]],"target":[[2.53,34.37,-6.42]],"mouth":[[1.95,34.99,-4.58]],"middle":[[0.67,35.78,-0.28]]},"animation.tadbulb.special@1.85":{"target":[[-2.82,40.29,-6.43]],"middle":[[-2,41.15,0.04]]},"animation.tadbulb.special@2.15":{"target":[[-4.25,38.54,-6.41]]},"animation.tadbulb.special@0.8":{"special":[[-3.64,27.74,4.34]],"target":[[-4.03,27.08,6.42]]},"animation.tadbulb.special@1.35":{"special":[[1.25,40.1,-4.33]],"target":[[1.51,39.59,-6.4]]},"animation.tadbulb.special@1.45":{"target":[[0.11,40.85,-6.4]],"middle":[[-0.32,41.6,0.12]],"face":[[0.05,44.42,-3.97]]},"animation.tadbulb.special@1.95":{"target":[[-3.33,40.05,-6.39]]},"animation.tadbulb.special@1.55":{"middle":[[-1.04,41.88,0.09]],"target":[[-0.99,41.07,-6.44]]},"animation.tadbulb.special@2.4":{"middle":[[-4.19,27.44,0.13]]},"animation.tadbulb.special@1.3":{"special":[[2,37.75,-4.43]],"target":[[2.39,37.56,-6.44]]},"animation.tadbulb.special@3.1":{"target":[[0,14.51,-6.55]]},"animation.tadbulb.special@2.25":{"target":[[-4.7,35.93,-6.44]]},"animation.tadbulb.special@1.5":{"target":[[-0.45,39.97,-6.42]],"middle":[[-0.69,40.75,0.1]]},"animation.tadbulb.special@1.75":{"target":[[-2.3,40.64,-6.44]]},"animation.tadbulb.special@1.65":{"target":[[-1.75,40.88,-6.45]]},"animation.tadbulb.special@2.2":{"target":[[-4.47,37.37,-6.43]]},"animation.tadbulb.special@1.6":{"target":[[-1.44,40.42,-6.4]],"middle":[[-1.3,41.12,0.14]]},"animation.tadbulb.special@0":{"special":[[0,16.7,-4.5]],"middle":[[0,17,0]],"target":[[0,16,-6.5]]},"animation.tadbulb.special@2.7":{"middle":[[-1.08,14.39,-0.32]]},"animation.tadbulb.special@0.5":{"middle":[[-1.26,15.6,0]]},"animation.tadbulb.special@1.8":{"middle":[[-1.82,41.42,0.14]]},"animation.tadbulb.special@0.4":{"middle":[[-0.42,13.94,-0.1]]},"animation.tadbulb.special@0.7":{"special":[[-7.39,23.86,1.29]],"target":[[-9.42,23.25,1.91]]},"animation.tadbulb.special@2.5":{"target":[[-3.65,18.88,-6.55]]},"animation.tadbulb.special@0.55":{"middle":[[-1.89,17.53,0]]},"animation.tadbulb.special@0.65":{"eye":[[-7.36,23.43,-2.6],[-7.71,23.43,1.89]]},"animation.tadbulb.special@1.7":{"target":[[-2.03,40.77,-6.37]]},"animation.tadbulb.special@2":{"target":[[-3.56,39.88,-6.39]]},"animation.tadbulb.special@1":{"middle":[[-1.44,33.96,-0.24]]},"animation.tadbulb.special@3.3":{"middle":[[-0.01,13.72,-0.2]]},"animation.tadbulb.special@1.1":{"special":[[1.66,34.04,-4.06]],"target":[[2.73,32.82,-5.79]]},"animation.tadbulb.special@0.15":{"target":[[0,13.64,-6.57]]},"animation.tadbulb.special@0.3":{"target":[[-0.93,12.29,-6.55]]},"animation.tadbulb.special@3.9":{"target":[[2.96,30.38,3.56]]},"animation.tadbulb.physical@1.25":{"target":[[-7.02,8.08,-28.78]],"middle":[[-2.06,11.8,-26.57]]},"animation.tadbulb.physical@1.05":{"target":[[0.92,33.62,31.69]]},"animation.tadbulb.physical@1.2":{"target":[[-9.51,17.22,-0.68]]},"animation.tadbulb.physical@1.45":{"target":[[9.41,8.72,-7.68]]},"animation.tadbulb.physical@1.65":{"target":[[-0.44,20.24,-3.68]]},"animation.tadbulb.physical@0.1":{"middle":[[0,15.74,-0.18]],"physical":[[0.04,22.52,-4.08]]},"animation.tadbulb.physical@1.3":{"middle":[[1.35,11.53,-26.14]],"target":[[1.64,5.87,-29.47]]},"animation.tadbulb.physical@0":{"physical":[[0,24,-3.5]],"middle":[[0,17,0]]},"animation.tadbulb.physical@1.15":{"target":[[-6.02,27.81,22.68]]},"animation.tadbulb.physical@1.5":{"target":[[6.27,14.17,-10.79]]},"animation.tadbulb.physical@1.1":{"target":[[-3.29,33.41,27.37]]},"animation.tadbulb.physical@1.35":{"target":[[8.46,13.05,-17.56]]},"animation.tadbulb.physical@0.3":{"target":[[0.23,13.11,-6.68]]},"animation.tadbulb.physical@0.5":{"middle":[[-4.84,32.41,9.86]]},"animation.tadbulb.physical@0.8":{"target":[[38.35,27.36,16.19]]},"animation.tadbulb.physical@0.6":{"target":[[2.32,42,10.1]]},"animation.tadbulb.physical@0.85":{"target":[[34.46,15.28,20.99]]},"animation.tadbulb.status@0.1":{"middle":[[-3.83,18.51,1.95]]},"animation.tadbulb.status@1.15":{"mouth":[[1.44,32.63,-6.66]],"special":[[1.44,32.63,-6.66]],"target":[[1.61,31.38,-8.52]]},"animation.tadbulb.status@1.85":{"target":[[0.53,56.59,-14.41]]},"animation.tadbulb.status@1.25":{"middle":[[-2.62,34.73,-1.05]],"special":[[-2.91,32.18,-4.93]],"target":[[-3.09,31.4,-6.71]]},"animation.tadbulb.status@1.3":{"middle":[[-5.97,39.13,-2.32]]},"animation.tadbulb.status@1.2":{"target":[[0.2,28.86,-7.87]]},"animation.tadbulb.status@0.5":{"middle":[[-8.44,36.67,3.98]],"target":[[-5.39,36.56,9.81]]},"animation.tadbulb.status@2.15":{"target":[[7.97,51.34,-9.84]]},"animation.tadbulb.status@0.2":{"target":[[-13.01,20.04,0.87]]},"animation.tadbulb.status@1.35":{"eye":[[-12.83,42.01,-5.32],[-12.83,43.78,-1.19]],"target":[[-14.11,41.29,-2.57]]},"animation.tadbulb.status@1.65":{"target":[[-1.01,51.79,-13.2]]},"animation.tadbulb.status@2.4":{"middle":[[5.65,39.17,0.77]]},"animation.tadbulb.status@2":{"target":[[3.99,55.45,-12.4]]},"animation.tadbulb.status@2.05":{"target":[[-0.58,54.72,-6.93]]},"animation.tadbulb.status@2.2":{"target":[[8.99,49.55,-9.02]]},"animation.tadbulb.status@1":{"middle":[[3.73,35.86,-2.47]]},"animation.tadbulb.recoil@0.55":{"target":[[-4.16,16.74,-4.41]]},"animation.tadbulb.recoil@0.6":{"target":[[-2.72,14.96,-7.55]]},"animation.tadbulb.recoil@0.65":{"target":[[-1.83,13.04,-8.78]]},"animation.tadbulb.recoil@0.3":{"target":[[-4.12,7.38,9.35]]},"animation.tadbulb.recoil@0.45":{"target":[[-6.32,14.98,2.64]]},"animation.tadbulb.recoil@0.75":{"target":[[-0.53,11.65,-8.28]]},"animation.tadbulb.battle_cry@1.25":{"target":[[-3.09,31.4,-6.71]]},"animation.tadbulb.battle_cry@2":{"target":[[3.99,55.45,-12.4]]}},"bellibolt":{"animation.bellibolt.special@1.2":{"special":[[0,7.52,-10.48]]},"animation.bellibolt.special@1.25":{"special":[[0,7.24,-10.52]],"mouth":[[0,15.01,-9.96]],"hand_primary":[[-5.61,8.16,-8.97]]},"animation.bellibolt.special@1.85":{"target":[[0,15.26,-12]],"middle":[[0,15.26,0]]},"animation.bellibolt.special@2.15":{"target":[[0,15,-12]]},"animation.bellibolt.special@0.8":{"special":[[0,7.78,-10.32]]},"animation.bellibolt.special@1.35":{"target":[[0,14.87,-12]]},"animation.bellibolt.special@1.45":{"target":[[0,15.15,-12]],"middle":[[0,15.15,0]],"face":[[-0.03,25.59,-4.91]]},"animation.bellibolt.special@1.95":{"target":[[0,15.23,-12]]},"animation.bellibolt.special@1.55":{"middle":[[0,15.23,0]],"target":[[0,15.23,-12]]},"animation.bellibolt.special@1.3":{"special":[[0,8.2,-10.15]]},"animation.bellibolt.special@1.5":{"target":[[0,15.19,-12]],"middle":[[0,15.19,0]]},"animation.bellibolt.special@1.75":{"target":[[0,15.29,-12]]},"animation.bellibolt.special@1.65":{"target":[[0,15.27,-12]]},"animation.bellibolt.special@2.2":{"target":[[0,14.89,-12]]},"animation.bellibolt.special@1.6":{"target":[[0,15.25,-12]],"middle":[[0,15.25,0]]},"animation.bellibolt.special@1.8":{"middle":[[0,15.27,0]]},"animation.bellibolt.special@0.7":{"special":[[0,7.89,-10.24]]},"animation.bellibolt.special@0.65":{"eye":[[2.5,18.03,-9.46],[-2.5,18.03,-9.46]]},"animation.bellibolt.special@1.7":{"target":[[0,15.28,-12]]},"animation.bellibolt.special@2":{"target":[[0,15.2,-12]]},"animation.bellibolt.special@1.1":{"special":[[0,7.73,-10.43]]},"animation.bellibolt.special@0.3":{"hand_secondary":[[6.1,10.24,-9.24]]},"animation.bellibolt.physical@1.25":{"target":[[0,10.27,-26.42]],"middle":[[0,13.58,-14.89]]},"animation.bellibolt.physical@1.05":{"target":[[0,29.98,-21.76]]},"animation.bellibolt.physical@1.2":{"target":[[0,24.32,-23.9]]},"animation.bellibolt.physical@1.45":{"target":[[0,13.48,-26.75]]},"animation.bellibolt.physical@1.65":{"target":[[0,13.53,-26.75]]},"animation.bellibolt.physical@0.1":{"middle":[[0,13.75,1.28]]},"animation.bellibolt.physical@1.3":{"middle":[[0,11.48,-14.75]],"target":[[0,11.48,-26.75]]},"animation.bellibolt.physical@1.15":{"target":[[0,28.47,-23.45]]},"animation.bellibolt.physical@1.5":{"target":[[0,13.53,-26.75]]},"animation.bellibolt.physical@1.1":{"target":[[0,29.71,-22.69]]},"animation.bellibolt.physical@1.35":{"target":[[0,12.76,-26.75]]},"animation.bellibolt.physical@0.3":{"target":[[0,11.77,-8.96]]},"animation.bellibolt.physical@0.5":{"middle":[[0,11.19,3.7]]},"animation.bellibolt.physical@0.8":{"target":[[0,10.19,-8.95]]},"animation.bellibolt.physical@0.6":{"target":[[0,11.35,-8.3]]},"animation.bellibolt.physical@0.85":{"target":[[0,12.1,-11.74]]},"animation.bellibolt.status@1.15":{"mouth":[[0,23.3,-2.1]],"special":[[0,12.83,-8.37]],"target":[[0,15.85,-12]]},"animation.bellibolt.status@1.25":{"middle":[[0,16.18,0]],"special":[[0,12.69,-8.77]],"target":[[0,16.18,-12]]},"animation.bellibolt.status@1.2":{"target":[[0,16,-12]]},"animation.bellibolt.status@1.35":{"eye":[[2.5,18.44,-7.93],[-2.5,18.44,-7.93]]},"animation.bellibolt.status@1":{"middle":[[0,15.57,0]]},"animation.bellibolt.recoil@0.3":{"hand_primary":[[-7.75,16.91,-6.22]]},"animation.bellibolt.recoil@0.45":{"hand_primary":[[-7.75,17.03,-6.97]]},"animation.bellibolt.recoil@0.75":{"hand_primary":[[-7.75,13.07,-9.93]]},"animation.bellibolt.battle_cry@1.25":{"target":[[0,16.18,-12]]}},"kilowattrel":{"animation.kilowattrel.special@0.65":{"eye":[[2.5,46.68,-7.62],[-2.5,46.68,-7.62]]}},"grafaiai":{"animation.grafaiai.cry@1.25":{"target":[[0,9.5,-11]]},"animation.grafaiai.cry@2":{"target":[[0,9.5,-11]]}},"capsakid":{"animation.capsakid.status@1.15":{"mouth":[[-1.54,25.28,-4.28]],"special":[[-1.54,25.28,-4.28]],"target":[[0,23.25,-8]]},"animation.capsakid.status@1.25":{"middle":[[0,25.55,0]],"special":[[2.08,26.31,-4.27]],"target":[[0,24.55,-8]]},"animation.capsakid.status@1.3":{"middle":[[0,26.21,0]]},"animation.capsakid.status@1.2":{"target":[[0,23.9,-8]]},"animation.capsakid.status@1.35":{"eye":[[0.36,30.18,-4.82],[5.88,28.92,-3.56]],"target":[[0,25.36,-8]]},"animation.capsakid.status@1.65":{"target":[[0,14.57,-8]]},"animation.capsakid.status@1":{"middle":[[0,18.26,0]]},"animation.capsakid.recoil@0.3":{"hand_primary":[[-5.13,8.4,-2.43]]},"animation.capsakid.recoil@0.45":{"hand_primary":[[-6.41,8,-0.9]]},"animation.capsakid.recoil@0.75":{"hand_primary":[[-6.5,8,0]]},"animation.capsakid.battle_cry@1.25":{"target":[[0,24.55,-8]]}},"scovillain":{"animation.scovillain.recoil@0.55":{"target":[[0,23,-13]]},"animation.scovillain.recoil@0.6":{"target":[[0,23,-13]]},"animation.scovillain.recoil@0.65":{"target":[[0,23,-13]]},"animation.scovillain.recoil@0.3":{"hand_primary":[[-14.5,24.08,1.04]],"target":[[0,23,-13]]},"animation.scovillain.recoil@0.45":{"hand_primary":[[-14.5,24.25,-0.06]],"target":[[0,23,-13]]},"animation.scovillain.recoil@0.75":{"hand_primary":[[-14.5,24.25,-0.5]],"target":[[0,23,-13]]},"animation.scovillain.cry@1.25":{"target":[[0,23,-13]]},"animation.scovillain.cry@2":{"target":[[0,23,-13]]}},"rellor":{"animation.rellor.special@0.65":{"eye":[[0.85,2.96,1.32],[-2.05,2.92,2.1]]},"animation.rellor.status@1.35":{"eye":[[-3.37,22.93,-13.14],[-0.53,22.92,-12.16]]}},"rabsca":{"animation.rabsca.special@0.65":{"eye":[[-2.1,5.27,-2.55],[2.1,5.27,-2.55],[-1.54,33.68,-2.67],[1.26,33.82,-2.66]]},"animation.rabsca.status@1.35":{"eye":[[-2.13,12.67,2.37],[-0.55,12.53,-1.52],[-1.68,42.15,-2.58],[1.04,41.81,-3.17]]}},"tinkaton":{"animation.tinkaton.special@1.2":{"target":[[-1.14,8.19,5.72]],"special":[[0,7,-8],[-3.81,31.9,34.83]],"middle":[[-4.72,6.5,1.21]]},"animation.tinkaton.special@1.25":{"special":[[0,7,-8],[6.21,12.29,41.7]],"target":[[1.9,6.6,4.53]],"middle":[[-2.81,6.5,0.82]],"hand_primary":[[4.93,6.53,1.06]]},"animation.tinkaton.special@1.85":{"target":[[-3.42,6.6,2.96]],"middle":[[0.51,6.5,-1.58]]},"animation.tinkaton.special@2.15":{"target":[[-4.04,6.63,-3.86]]},"animation.tinkaton.special@0.8":{"special":[[0,7,-8],[37.59,23.29,8.34]],"target":[[3.34,7.75,2.96]]},"animation.tinkaton.special@1.35":{"target":[[-1.88,6.6,-7.93]]},"animation.tinkaton.special@1.45":{"target":[[-3.56,6.6,4.22]],"middle":[[-2.26,6.5,-1.64]],"face":[[3.14,10.38,-3.49]]},"animation.tinkaton.special@1.95":{"target":[[4.88,6.6,-0.69]]},"animation.tinkaton.special@1.55":{"middle":[[-2.03,6.5,1.47]],"target":[[3.96,6.6,1.85]]},"animation.tinkaton.special@2.4":{"middle":[[-1.23,6.53,-1.68]]},"animation.tinkaton.special@1.3":{"special":[[0,7,-8],[37.78,14.34,13.04]],"target":[[4.23,6.6,-3.74]]},"animation.tinkaton.special@3.1":{"target":[[1.36,7.41,-4.29]]},"animation.tinkaton.special@2.25":{"target":[[-4.9,6.65,-4.65]]},"animation.tinkaton.special@1.5":{"target":[[1.09,6.6,4.69]],"middle":[[-2.65,6.5,0]]},"animation.tinkaton.special@1.65":{"target":[[3.77,6.6,-3.03]]},"animation.tinkaton.special@2.2":{"target":[[-4.32,6.65,-4.06]]},"animation.tinkaton.special@1.6":{"target":[[4.58,6.6,-0.54]],"middle":[[-0.73,6.5,2.25]]},"animation.tinkaton.special@0.5":{"middle":[[-0.75,6.5,3.1]]},"animation.tinkaton.special@1.8":{"middle":[[1.46,6.5,-1.06]]},"animation.tinkaton.special@0.4":{"middle":[[-1.35,6.5,3.15]]},"animation.tinkaton.special@0.7":{"special":[[0,7,-8],[35.15,25.98,11.01]],"target":[[3.83,7.08,1.87]]},"animation.tinkaton.special@2.5":{"target":[[-3.9,6.57,-6.68]]},"animation.tinkaton.special@0.55":{"middle":[[-1.03,6.5,3.23]]},"animation.tinkaton.special@0.65":{"eye":[[1.17,12.11,-1.52],[-3.76,11.64,-2.2]]},"animation.tinkaton.special@1.7":{"target":[[1.8,6.6,-4.77]]},"animation.tinkaton.special@2":{"target":[[1.72,6.6,-5.22]]},"animation.tinkaton.special@1":{"middle":[[-4,6.5,3.1]]},"animation.tinkaton.special@3.3":{"middle":[[-1.27,6.5,2.99]]},"animation.tinkaton.special@1.1":{"special":[[0,7,-8],[29.69,25.52,23.17]],"target":[[0.94,8.64,4.34]]},"animation.tinkaton.special@0.15":{"hand_primary":[[-2.37,10.08,-4.47]],"target":[[2.27,7.73,-3.22]]},"animation.tinkaton.special@0.3":{"hand_secondary":[[5.19,7.95,5.49]],"target":[[3.55,8.07,-0.21]]},"animation.tinkaton.special@3.9":{"target":[[2.56,8.06,3.52]]},"animation.tinkaton.physical@1.25":{"target":[[-2.23,7.65,-3.28]],"middle":[[-0.81,7.65,2.55]]},"animation.tinkaton.physical@1.05":{"target":[[-3.19,6.5,2.74]]},"animation.tinkaton.physical@1.2":{"target":[[-2.48,6.92,1.83]]},"animation.tinkaton.physical@1.45":{"target":[[2.7,6.59,-10.93]]},"animation.tinkaton.physical@1.65":{"target":[[2.17,6.5,-11.37]]},"animation.tinkaton.physical@0.1":{"hand_primary":[[-5.27,5.18,-6.81]],"physical":[[24.44,13.79,-33.34]]},"animation.tinkaton.physical@1.3":{"middle":[[-0.89,7.57,-0.43]],"target":[[1.55,7.57,-5.91]]},"animation.tinkaton.physical@1.15":{"target":[[-2.68,6.5,2.99]]},"animation.tinkaton.physical@1.5":{"target":[[2.65,6.5,-11.24]]},"animation.tinkaton.physical@1.1":{"target":[[-3,6.5,2.99]]},"animation.tinkaton.physical@1.35":{"target":[[2.16,7.49,-8.54]]},"animation.tinkaton.physical@0.3":{"target":[[-4.59,6.36,-3.91]]},"animation.tinkaton.physical@0.5":{"middle":[[0.05,6.78,4.4]]},"animation.tinkaton.physical@0.8":{"target":[[-3.35,5.97,0.94]]},"animation.tinkaton.physical@0.6":{"target":[[-1.9,6.8,-0.1]]},"animation.tinkaton.physical@0.85":{"target":[[-3.38,6.38,1.26]]},"animation.tinkaton.status@0.1":{"middle":[[3.07,6.5,0]]},"animation.tinkaton.status@1.15":{"mouth":[[4.69,47.69,-3.17]],"special":[[0,7,-8],[-30,39.06,1.5]],"target":[[6.63,45.03,-5.23]]},"animation.tinkaton.status@1.85":{"target":[[11.03,45.26,-4.87]]},"animation.tinkaton.status@1.25":{"middle":[[6.96,46.13,1.13]],"special":[[0,7,-8],[-29.37,39.53,1.48]],"target":[[6.9,46.13,-4.87]]},"animation.tinkaton.status@1.3":{"middle":[[6.84,46.33,1.13]]},"animation.tinkaton.status@1.2":{"target":[[6.96,45.79,-4.87]]},"animation.tinkaton.status@0.5":{"middle":[[2.58,6.5,0.21]],"target":[[-2.68,6.5,-2.68]]},"animation.tinkaton.status@2.15":{"target":[[18.53,53.51,1.85]]},"animation.tinkaton.status@0.2":{"target":[[-0.95,6.5,-2.62]]},"animation.tinkaton.status@1.35":{"eye":[[8.24,48.64,-7.4],[3.28,48.07,-7.14]],"target":[[6.84,46.33,-4.87]]},"animation.tinkaton.status@1.65":{"target":[[8.07,46.14,-4.87]]},"animation.tinkaton.status@2.4":{"middle":[[1.24,60.14,10.12]]},"animation.tinkaton.status@2":{"target":[[15.09,43.22,-4.87]]},"animation.tinkaton.status@2.05":{"target":[[16.69,41.95,-4.86]]},"animation.tinkaton.status@2.2":{"target":[[14.08,63.08,8.07]]},"animation.tinkaton.status@1":{"middle":[[5.58,42.61,3.6]]},"animation.tinkaton.recoil@0.55":{"target":[[0,7,-6]]},"animation.tinkaton.recoil@0.6":{"target":[[0,7,-6]]},"animation.tinkaton.recoil@0.65":{"target":[[0,7,-6]]},"animation.tinkaton.recoil@0.3":{"hand_primary":[[-9.26,8.24,-0.16]],"target":[[0,7,-6]]},"animation.tinkaton.recoil@0.45":{"hand_primary":[[-9.24,8.26,-0.53]],"target":[[0,7,-6]]},"animation.tinkaton.recoil@0.75":{"hand_primary":[[-9.23,8.26,-0.66]],"target":[[0,7,-6]]},"animation.tinkaton.battle_cry@1.25":{"target":[[6.9,46.13,-4.87]]},"animation.tinkaton.battle_cry@2":{"target":[[15.09,43.22,-4.87]]}},"orthworm":{"animation.orthworm.special@1.2":{"target":[[0,24.79,-7.38]],"special":[[-1.4,46.8,0.79]],"middle":[[0,19.25,2.33]]},"animation.orthworm.special@1.25":{"special":[[-1.33,39.07,-17.55]],"target":[[0,23.88,-13.6]],"mouth":[[-1.33,39.07,-17.55]],"middle":[[0,18.35,-3.88]],"hand_primary":[[8.21,38.61,-11.77],[-10.03,37.11,-10.85]]},"animation.orthworm.special@1.85":{"target":[[-1,23.19,-4.67]],"middle":[[-1,17.65,5.04]]},"animation.orthworm.special@2.15":{"target":[[1,22.91,-4.1]]},"animation.orthworm.special@0.8":{"special":[[4.04,36.88,-12.88]],"target":[[0,23.03,-7.2]]},"animation.orthworm.special@1.35":{"special":[[0.83,37.38,-8.35]],"target":[[1,23.5,-7.19]]},"animation.orthworm.special@1.45":{"target":[[-1,23.43,-6.02]],"middle":[[-1,17.9,3.69]],"face":[[-2.67,36.87,-8.23]]},"animation.orthworm.special@1.95":{"target":[[1,23.1,-4.48]]},"animation.orthworm.special@1.55":{"middle":[[1,17.9,4.33]],"target":[[1,23.43,-5.38]]},"animation.orthworm.special@2.4":{"middle":[[0,14.94,3.58]]},"animation.orthworm.special@1.3":{"special":[[-0.56,36.83,-10.6]],"target":[[0,23.68,-10.03]]},"animation.orthworm.special@3.1":{"target":[[0,16.92,-11.07]]},"animation.orthworm.special@2.25":{"target":[[-1,22.82,-3.92]]},"animation.orthworm.special@1.5":{"target":[[0,23.43,-5.7]],"middle":[[0,17.9,4.01]]},"animation.orthworm.special@1.75":{"target":[[1,23.28,-4.86]]},"animation.orthworm.special@1.65":{"target":[[-1,23.37,-5.04]]},"animation.orthworm.special@2.2":{"target":[[0,22.87,-4.01]]},"animation.orthworm.special@1.6":{"target":[[0,23.42,-5.14]],"middle":[[0,17.88,4.57]]},"animation.orthworm.special@0.5":{"middle":[[0,18.45,5.22]]},"animation.orthworm.special@1.8":{"middle":[[0,17.7,4.95]]},"animation.orthworm.special@0.4":{"middle":[[0,18.27,5.06]]},"animation.orthworm.special@0.7":{"special":[[4.25,42.28,-4.68]],"target":[[0,22.62,-6.24]]},"animation.orthworm.special@2.5":{"target":[[0,19.54,-8.18]]},"animation.orthworm.special@0.55":{"middle":[[0,18.28,5.1]]},"animation.orthworm.special@1.7":{"target":[[0,23.33,-4.95]]},"animation.orthworm.special@2":{"target":[[0,23.05,-4.39]]},"animation.orthworm.special@1":{"middle":[[0,19.71,4.02]]},"animation.orthworm.special@3.3":{"middle":[[0,17.48,4.39]]},"animation.orthworm.special@1.1":{"special":[[-0.9,46.66,0.45]],"target":[[0,25.27,-5.5]]},"animation.orthworm.special@0.15":{"hand_primary":[[3.48,28.2,-17.08],[-11.82,22.04,-10.62]]},"animation.orthworm.special@0.3":{"hand_secondary":[[7.97,33.1,-1.36],[9.35,30.26,3.07],[-9.54,26.91,1.53],[-7.55,24.29,5.85]],"target":[[0,23.02,-5.33]]},"animation.orthworm.special@3.9":{"target":[[0,24.68,-6.32]]},"animation.orthworm.physical@1.25":{"target":[[0,21.94,-23.6]],"middle":[[0,16.4,-13.89]]},"animation.orthworm.physical@1.05":{"target":[[0,25.21,-3.73]]},"animation.orthworm.physical@1.2":{"target":[[0,23.14,-5.61]]},"animation.orthworm.physical@1.45":{"target":[[0,21.94,-21.1]]},"animation.orthworm.physical@1.65":{"target":[[0,21.94,-21.23]]},"animation.orthworm.physical@0.1":{"middle":[[0,12.62,-0.56]],"hand_primary":[[8.95,28.55,-12.41],[-8.86,27.86,-12.92]],"physical":[[8.95,28.55,-12.41]]},"animation.orthworm.physical@1.3":{"middle":[[0,16.4,-11.98]],"target":[[0,21.94,-21.69]]},"animation.orthworm.physical@0":{"hand_primary":[[8.86,31.1,-7.28],[-8.86,31.1,-7.28]],"physical":[[8.86,31.1,-7.28]]},"animation.orthworm.physical@1.15":{"target":[[0,26.02,-2.63]]},"animation.orthworm.physical@1.5":{"target":[[0,21.94,-21.17]]},"animation.orthworm.physical@1.1":{"target":[[0,26.84,-2.87]]},"animation.orthworm.physical@1.35":{"target":[[0,21.94,-20.52]]},"animation.orthworm.physical@0.3":{"target":[[0,26.96,-2.03]]},"animation.orthworm.physical@0.5":{"middle":[[0,23.57,8.37]]},"animation.orthworm.physical@0.8":{"target":[[0,26.86,-2.8]]},"animation.orthworm.physical@0.6":{"target":[[0,28.23,-2.06]]},"animation.orthworm.physical@0.85":{"target":[[0,27.39,-2.99]]},"animation.orthworm.status@0.1":{"middle":[[0,12.16,-0.78]]},"animation.orthworm.status@1.15":{"mouth":[[8.78,23.65,-12.31]],"special":[[8.78,23.65,-12.31]],"target":[[0,16.25,-11.84]]},"animation.orthworm.status@1.85":{"target":[[0,21.68,-6.41]]},"animation.orthworm.status@1.25":{"middle":[[0,12.06,-0.76]],"special":[[2.33,19.97,-16.08]],"target":[[0,17.6,-10.47]]},"animation.orthworm.status@1.3":{"middle":[[0,14.62,1.26]]},"animation.orthworm.status@1.2":{"target":[[0,15.41,-12.2]]},"animation.orthworm.status@2.15":{"target":[[0,21.09,-7.58]]},"animation.orthworm.status@1.35":{"target":[[0,21.05,-7.23]]},"animation.orthworm.status@1.65":{"target":[[0,21.09,-7.58]]},"animation.orthworm.status@2.4":{"middle":[[0,15.91,2.53]]},"animation.orthworm.status@2":{"target":[[0,21.38,-7]]},"animation.orthworm.status@2.05":{"target":[[0,21.86,-6.04]]},"animation.orthworm.status@2.2":{"target":[[0,20.91,-7.95]]},"animation.orthworm.status@1":{"middle":[[0,11.51,-1.22]]},"animation.orthworm.recoil@0.55":{"target":[[0,4.5,-36]]},"animation.orthworm.recoil@0.6":{"target":[[0,3.7,-36]]},"animation.orthworm.recoil@0.65":{"target":[[0,2.81,-36]]},"animation.orthworm.recoil@0.3":{"hand_primary":[[9.53,7.48,-19.4],[-9.53,7.48,-19.4]],"target":[[0,4.5,-36]]},"animation.orthworm.recoil@0.45":{"hand_primary":[[10,4.39,-19.76],[-10,4.39,-19.76]],"target":[[0,4.5,-36]]},"animation.orthworm.recoil@0.75":{"hand_primary":[[9.92,7.98,-19.23],[-9.92,7.98,-19.23]],"target":[[0,4.05,-36]]},"animation.orthworm.cry@1.25":{"target":[[0,4.5,-36]]},"animation.orthworm.cry@2":{"target":[[0,4.5,-36]]}},"glimmet":{"animation.glimmet.cry@1.25":{"target":[[0,13.53,-11.94]]},"animation.glimmet.cry@2":{"target":[[0,18.36,-11.36]]}},"glimmora":{"animation.glimmora.cry@1.25":{"target":[[0,15,-13]]},"animation.glimmora.cry@2":{"target":[[0,19.44,-13.91]]}},"annihilape":{"animation.annihilape.special@1.2":{"target":[[6.16,22.3,-10.51]],"special":[[5.55,14.99,-16.66]],"middle":[[1.79,23.3,-5.03]]},"animation.annihilape.special@1.25":{"special":[[1.56,16.76,-24.92]],"target":[[6.16,21.48,-12.63]],"middle":[[1.79,22.48,-7.16]],"hand_primary":[[1.76,16.84,-25.89]]},"animation.annihilape.special@1.85":{"target":[[6.16,20.18,2.91]],"middle":[[1.8,21.18,8.38]]},"animation.annihilape.special@2.15":{"target":[[6.16,20.74,1.91]]},"animation.annihilape.special@0.8":{"special":[[-6.45,9.93,-14.34]],"target":[[6.89,9.31,-1.32]]},"animation.annihilape.special@1.35":{"special":[[-1.33,17.23,-15.91]],"target":[[6.16,20.22,-1.55]]},"animation.annihilape.special@1.45":{"target":[[6.16,19.73,0.24]],"middle":[[1.79,20.73,5.71]],"face":[[6.05,13.64,-1.15]]},"animation.annihilape.special@1.95":{"target":[[6.16,20.43,2.79]]},"animation.annihilape.special@1.55":{"middle":[[1.79,19.91,6.95]],"target":[[6.16,18.91,1.48]]},"animation.annihilape.special@2.4":{"middle":[[0.65,20.03,1.84]]},"animation.annihilape.special@1.3":{"special":[[0.32,16.58,-17.76]],"target":[[6.16,20.56,-3.25]]},"animation.annihilape.special@3.1":{"target":[[-0.27,12.64,-3.65]]},"animation.annihilape.special@2.25":{"target":[[5.66,20.83,0.46]]},"animation.annihilape.special@1.5":{"target":[[6.16,19.35,0.86]],"middle":[[1.79,20.35,6.33]]},"animation.annihilape.special@1.75":{"target":[[6.16,19.58,2.58]]},"animation.annihilape.special@1.65":{"target":[[6.16,18.86,2.17]]},"animation.annihilape.special@2.2":{"target":[[6.12,20.81,1.39]]},"animation.annihilape.special@1.6":{"target":[[6.16,18.67,1.96]],"middle":[[1.79,19.67,7.44]]},"animation.annihilape.special@0.5":{"middle":[[2.46,11.01,4.21]]},"animation.annihilape.special@1.8":{"middle":[[1.79,20.92,8.26]]},"animation.annihilape.special@0.4":{"middle":[[-0.25,11.81,2.73]]},"animation.annihilape.special@0.7":{"special":[[-4.72,12.86,-10.54]],"target":[[7,9.59,-1.19]]},"animation.annihilape.special@0.55":{"middle":[[2.19,10.84,3.97]]},"animation.annihilape.special@1.7":{"target":[[6.16,19.19,2.38]]},"animation.annihilape.special@2":{"target":[[6.17,20.44,2.73]]},"animation.annihilape.special@1":{"middle":[[1.79,21.91,-3.66]]},"animation.annihilape.special@3.3":{"middle":[[-2.93,12.87,2.06]]},"animation.annihilape.special@1.1":{"special":[[3.28,19.86,-19.25]],"target":[[6.16,22.18,-9.37]]},"animation.annihilape.special@0.15":{"hand_primary":[[-11.56,13.15,-16.48]],"target":[[-0.64,12.24,-4.13]]},"animation.annihilape.special@0.3":{"hand_secondary":[[8.36,4.73,14.66]],"target":[[-0.44,11.87,-4.49]]},"animation.annihilape.special@3.9":{"target":[[6.44,16.87,-6.76]]},"animation.annihilape.physical@1.25":{"target":[[0,7.16,-13.21]],"middle":[[0,6.45,-6.18]]},"animation.annihilape.physical@1.05":{"target":[[0,45.53,-1.64]]},"animation.annihilape.physical@1.2":{"target":[[0,35.53,-9.93]]},"animation.annihilape.physical@1.45":{"target":[[0,11.5,-15.2]]},"animation.annihilape.physical@1.65":{"target":[[0,11.9,-15.2]]},"animation.annihilape.physical@0.1":{"middle":[[0,11.88,-1.33]],"hand_primary":[[-16.19,15.46,-8.79]],"physical":[[-16.19,15.46,-8.79]]},"animation.annihilape.physical@1.3":{"middle":[[0,10.63,-8.2]],"target":[[0,9.63,-15.2]]},"animation.annihilape.physical@1.15":{"target":[[0,42.78,-6.21]]},"animation.annihilape.physical@1.5":{"target":[[0,11.6,-15.2]]},"animation.annihilape.physical@1.1":{"target":[[0,44.99,-3.34]]},"animation.annihilape.physical@1.35":{"target":[[0,10.41,-15.2]]},"animation.annihilape.physical@0.3":{"target":[[0,9.88,-10.86]]},"animation.annihilape.physical@0.5":{"middle":[[0,9.18,-4.03]]},"animation.annihilape.physical@0.8":{"target":[[0,41.23,2.71]]},"animation.annihilape.physical@0.6":{"target":[[0,15.54,-6.86]]},"animation.annihilape.physical@0.85":{"target":[[0,43.46,2.87]]},"animation.annihilape.status@0.1":{"middle":[[0,14.3,-2.59]]},"animation.annihilape.status@1.15":{"special":[[-5.07,11.32,-21.62]],"target":[[1.95,10.18,-11.03]]},"animation.annihilape.status@1.85":{"target":[[0.13,15.2,-10.77]]},"animation.annihilape.status@1.25":{"middle":[[1.05,14.25,-4.06]],"special":[[-5.87,2.57,-19.24]],"target":[[1.05,13.25,-11.06]]},"animation.annihilape.status@1.3":{"middle":[[0.64,14.67,-3.89]]},"animation.annihilape.status@1.2":{"target":[[1.59,11.34,-11.08]]},"animation.annihilape.status@0.5":{"middle":[[-1.45,13.7,-4.97]],"target":[[-1.45,12.7,-11.97]]},"animation.annihilape.status@2.15":{"target":[[0.13,15.27,-10.77]]},"animation.annihilape.status@0.2":{"target":[[0,13.13,-10.98]]},"animation.annihilape.status@1.35":{"target":[[0.33,14.03,-10.77]]},"animation.annihilape.status@1.65":{"target":[[0.12,14.87,-10.77]]},"animation.annihilape.status@2.4":{"middle":[[0.14,16.19,-3.79]]},"animation.annihilape.status@2":{"target":[[0.13,15.24,-10.77]]},"animation.annihilape.status@2.05":{"target":[[0.13,15.25,-10.77]]},"animation.annihilape.status@2.2":{"target":[[0.13,15.29,-10.77]]},"animation.annihilape.status@1":{"middle":[[1.51,11.92,-3.4]]},"animation.annihilape.recoil@0.3":{"hand_primary":[[-22.06,14.54,0.37]]},"animation.annihilape.recoil@0.45":{"hand_primary":[[-18.87,15.6,-7.18]]},"animation.annihilape.recoil@0.75":{"hand_primary":[[-22,14.5,-0.5]]},"animation.annihilape.battle_cry@1.25":{"target":[[1.05,13.25,-11.06]]},"animation.annihilape.battle_cry@2":{"target":[[0.13,15.24,-10.77]]}},"gholdengo":{"animation.gholdengo.cry@1.25":{"target":[[0,21,-8]]},"animation.gholdengo.cry@2":{"target":[[0,21,-8]]}},"archaludon":{"animation.archaludon.special@1.2":{"target":[[0,21.96,-8.4]],"special":[[0,7.3,-34.24]],"middle":[[0,17.96,5.6]]},"animation.archaludon.special@1.25":{"special":[[0.02,7.38,-35.84]],"target":[[0,21.95,-10]],"mouth":[[0.02,7.38,-35.84]],"middle":[[0,17.95,4]],"hand_primary":[[-8.28,0.37,-24.19]]},"animation.archaludon.special@1.85":{"target":[[0,21.79,-6.68]],"middle":[[0,17.79,7.32]]},"animation.archaludon.special@2.15":{"target":[[0,21.73,-6.62]]},"animation.archaludon.special@0.8":{"special":[[-0.21,4.6,-33.59]],"target":[[0,21.04,-8.4]]},"animation.archaludon.special@1.35":{"special":[[-0.01,7.24,-33.81]],"target":[[0,22.01,-8.31]]},"animation.archaludon.special@1.45":{"target":[[0,21.74,-7.8]],"middle":[[0,17.74,6.2]],"face":[[0.01,9.02,-41.49]]},"animation.archaludon.special@1.95":{"target":[[0,21.65,-6.58]]},"animation.archaludon.special@1.55":{"middle":[[0,17.7,6.71]],"target":[[0,21.7,-7.29]]},"animation.archaludon.special@2.4":{"middle":[[0,17.41,5.94]]},"animation.archaludon.special@1.3":{"special":[[-0.01,7.41,-34.51]],"target":[[0,21.85,-9.04]]},"animation.archaludon.special@3.1":{"target":[[0,22,-12.44]]},"animation.archaludon.special@2.25":{"target":[[0,21.61,-6.89]]},"animation.archaludon.special@1.5":{"target":[[0,22.08,-7.54]],"middle":[[0,18.08,6.46]]},"animation.archaludon.special@1.75":{"target":[[0,21.94,-6.85]]},"animation.archaludon.special@1.65":{"target":[[0,21.88,-7.01]]},"animation.archaludon.special@2.2":{"target":[[0,21.72,-6.62]]},"animation.archaludon.special@1.6":{"target":[[0,21.9,-7.09]],"middle":[[0,17.9,6.91]]},"animation.archaludon.special@2.7":{"middle":[[0,18.59,1.31]]},"animation.archaludon.special@0.5":{"middle":[[0,19.07,5.38]]},"animation.archaludon.special@1.8":{"middle":[[0,17.66,7.24]]},"animation.archaludon.special@0.4":{"middle":[[0,18.72,4.97]]},"animation.archaludon.special@0.7":{"special":[[-1.87,21.77,-26.08]],"target":[[0,22.85,-8.4]]},"animation.archaludon.special@2.5":{"target":[[0,21.92,-9.53]]},"animation.archaludon.special@0.55":{"middle":[[0,19.15,5.48]]},"animation.archaludon.special@0.65":{"eye":[[-0.25,28.55,-23.32],[-3.34,28.31,-23.32]]},"animation.archaludon.special@1.7":{"target":[[0,21.67,-6.93]]},"animation.archaludon.special@2":{"target":[[0,21.8,-6.59]]},"animation.archaludon.special@1":{"middle":[[0,18.15,5.6]]},"animation.archaludon.special@3.3":{"middle":[[0,18.24,4.4]]},"animation.archaludon.special@1.1":{"special":[[0,7.61,-34.23]],"target":[[0,22.04,-8.4]]},"animation.archaludon.special@0.15":{"hand_primary":[[-7.99,11.48,-8.71]],"target":[[0,22,-11.66]]},"animation.archaludon.special@0.3":{"hand_secondary":[[6.93,14.64,-5.44]],"target":[[0,22.24,-9.6]]},"animation.archaludon.special@3.9":{"target":[[0,22.08,-8.4]]},"animation.archaludon.physical@1.25":{"target":[[3.99,20.53,-20.63]],"middle":[[-1.09,16.52,-7.58]]},"animation.archaludon.physical@1.05":{"target":[[-3.26,21.5,-7.75]]},"animation.archaludon.physical@1.2":{"target":[[2.69,20,-13.32]]},"animation.archaludon.physical@1.45":{"target":[[3.34,22.21,-18.42]]},"animation.archaludon.physical@1.65":{"target":[[2.85,21.81,-18.94]]},"animation.archaludon.physical@0.1":{"middle":[[0.17,17.63,2.08]],"hand_primary":[[-9.64,12.84,-7.99]],"physical":[[-9.64,12.84,-7.99]]},"animation.archaludon.physical@1.3":{"middle":[[-1.18,17.81,-6.25]],"target":[[4.34,21.81,-19.12]]},"animation.archaludon.physical@1.15":{"target":[[0.1,20.23,-9.99]]},"animation.archaludon.physical@1.5":{"target":[[3.15,22.01,-18.56]]},"animation.archaludon.physical@1.1":{"target":[[-2.31,20.9,-8.59]]},"animation.archaludon.physical@1.35":{"target":[[4.08,22.61,-18.62]]},"animation.archaludon.physical@0.3":{"target":[[-1.79,21.88,-8.92]]},"animation.archaludon.physical@0.5":{"middle":[[0.7,18.9,5.96]]},"animation.archaludon.physical@0.8":{"target":[[-3,23.17,-7.09]]},"animation.archaludon.physical@0.6":{"target":[[-2.8,23.14,-7.35]]},"animation.archaludon.physical@0.85":{"target":[[-3.09,22.96,-7.12]]},"animation.archaludon.status@1.15":{"mouth":[[3.99,32.43,-10.06]],"special":[[3.99,32.43,-10.06]],"target":[[0,23.53,-21]]},"animation.archaludon.status@1.85":{"target":[[0.88,20.18,-21.7]]},"animation.archaludon.status@1.25":{"middle":[[0.55,17.29,-7.37]],"special":[[2.36,27.87,-16.85]],"target":[[0.55,21.29,-21.37]]},"animation.archaludon.status@1.3":{"middle":[[0.76,15.72,-8.02]]},"animation.archaludon.status@1.2":{"target":[[0.16,23.04,-21.02]]},"animation.archaludon.status@0.5":{"middle":[[0,17.53,-3.87]],"target":[[0,21.53,-17.87]]},"animation.archaludon.status@2.15":{"target":[[0.88,20.1,-22.1]]},"animation.archaludon.status@1.35":{"eye":[[-0.26,29.77,-23.43],[-3.35,29.47,-23.43]],"target":[[0.84,19.71,-22.29]]},"animation.archaludon.status@1.65":{"target":[[0.88,21.15,-21.82]]},"animation.archaludon.status@2.4":{"middle":[[0.88,16.64,-8.11]]},"animation.archaludon.status@2":{"target":[[0.88,19.82,-21.92]]},"animation.archaludon.status@2.05":{"target":[[0.88,19.83,-22.02]]},"animation.archaludon.status@2.2":{"target":[[0.88,20.3,-22.11]]},"animation.archaludon.status@1":{"middle":[[0,19.25,-7]]},"animation.archaludon.recoil@0.3":{"hand_primary":[[-4.7,16.56,-13.95]]},"animation.archaludon.recoil@0.45":{"hand_primary":[[-8.14,16.2,-13.17]]},"animation.archaludon.recoil@0.75":{"hand_primary":[[-12.31,16.07,-6.46]]},"animation.archaludon.battle_cry@1.25":{"target":[[0.55,21.29,-21.37]]},"animation.archaludon.battle_cry@2":{"target":[[0.88,19.82,-21.92]]}}}');
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
  // El del mod es `is_badlands` + `is_desert` + `is_savanna`. Sin la sabana,
  // las 98 especies que lo citan no salían allí (o salían donde lo excluyen),
  // y Cobblenav le pondría hierba en vez de arena a lo que sale en ella.
  is_arid: [{ any: ["desert", "mesa", "savanna"] }],
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
  // Los de los multiplicadores de peso (Combee junto a colmenas, Tauros de
  // Paldea junto a lava o agua). Son etiquetas de fluido y de bloque de Java.
  "minecraft:beehives": ["minecraft:beehive", "minecraft:bee_nest"],
  "minecraft:lava": ["minecraft:lava", "minecraft:flowing_lava"],
  "minecraft:water": ["minecraft:water", "minecraft:flowing_water"],
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
      if (!name.endsWith(".json")) continue;
      portBlockIds.add(`cooblemon:${name.replace(/\.json$/, "")}`);
      try {
        const def = JSON.parse(await readFile4(path4.join(blocksDir, name), "utf8"));
        const id = def["minecraft:block"]?.description?.identifier;
        if (id) {
          portBlockIds.delete(`cooblemon:${name.replace(/\.json$/, "")}`);
          portBlockIds.add(id);
        }
      } catch {
      }
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
  if (cond.moonPhase !== void 0 && cond.moonPhase !== null && parseMoonPhases(cond.moonPhase) === null) {
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
  return `${rule.pokeSnack ?? ""}|${(rule.moonPhases ?? []).join(",")}|${rule.timeRange ?? ""}|${rule.thunder ?? ""}|${rule.slimeChunk ?? ""}|${JSON.stringify(rule.coords ?? {})}|` + ruleKey(
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
function parseMoonPhases(raw) {
  if (raw === void 0 || raw === null || raw === "") return null;
  const out = /* @__PURE__ */ new Set();
  for (const part of String(raw).split(",")) {
    const m = /^\s*(\d)\s*(?:-\s*(\d)\s*)?$/.exec(part);
    if (!m) return null;
    const a = Number(m[1]);
    const b = m[2] === void 0 ? a : Number(m[2]);
    if (a > 7 || b > 7 || b < a) return null;
    for (let i = a; i <= b; i++) out.add(i);
  }
  return [...out].sort();
}
var TIME_RANGES = /* @__PURE__ */ new Set(["day", "night", "morning", "noon", "afternoon", "evening", "midnight", "predawn", "dawn", "dusk", "twilight"]);
function biomeTagsOf(raw) {
  const tags = /* @__PURE__ */ new Set();
  for (const { selector } of mapCobblemonSelectors(raw)) {
    for (const tag of selector.any ?? []) tags.add(tag);
    const primary = selectorPrimaryTag(selector);
    if (primary) tags.add(primary);
  }
  return [...tags];
}
function convertWeightMults(entry) {
  const all = [...entry.weightMultiplier ? [entry.weightMultiplier] : [], ...entry.weightMultipliers ?? []];
  const out = [];
  for (const wm of all) {
    const m = Number(wm.multiplier);
    if (!Number.isFinite(m) || m === 1) continue;
    const c = wm.condition ?? {};
    if (c.structures?.length || c.minLureLevel !== void 0 || c.maxLureLevel !== void 0) continue;
    const when = {};
    if (c.timeRange !== void 0) {
      if (!TIME_RANGES.has(c.timeRange)) continue;
      when.time = c.timeRange;
    }
    if (c.isRaining !== void 0) when.rain = c.isRaining;
    if (c.isThundering !== void 0) when.thunder = c.isThundering;
    if (c.moonPhase !== void 0) {
      const moon = parseMoonPhases(c.moonPhase);
      if (!moon) continue;
      when.moon = moon;
    }
    if (c.minLight !== void 0) when.minLight = c.minLight;
    if (c.isPokeSnack !== void 0) when.snack = c.isPokeSnack;
    if (c.biomes?.length) {
      const tags = biomeTagsOf(c.biomes);
      if (tags.length === 0) continue;
      when.biomes = tags;
    }
    if (c.neededNearbyBlocks?.length) {
      const nearby = resolveNearbyBlocks(c.neededNearbyBlocks);
      if (!nearby) continue;
      when.nearby = [...nearby];
    }
    out.push({ m, when });
  }
  return out.length ? out : void 0;
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
      void nightMult;
      const lightVariants = nightOnlyAlolanMeowth && light === "surface" ? [{ light: "night", weight: Math.min(entryWeight, 9) }] : [{ light, weight: entryWeight }];
      const cond = entry.condition ?? {};
      const moonPhases = cond.moonPhase !== void 0 ? parseMoonPhases(cond.moonPhase) ?? void 0 : void 0;
      const timeRange = cond.timeRange && cond.timeRange !== "day" && cond.timeRange !== "night" && cond.timeRange !== "any" && TIME_RANGES.has(cond.timeRange) ? cond.timeRange : void 0;
      const extras = {
        ...moonPhases ? { moonPhases } : {},
        ...timeRange ? { timeRange } : {},
        ...cond.isThundering === true ? { thunder: true } : {},
        ...cond.isPokeSnack !== void 0 ? { pokeSnack: cond.isPokeSnack } : {},
        ...cond.isSlimeChunk === true ? { slimeChunk: true } : {},
        ...(() => {
          const coords = {};
          for (const k of ["minX", "maxX", "minZ", "maxZ"]) {
            if (typeof cond[k] === "number") coords[k] = cond[k];
          }
          return Object.keys(coords).length ? { coords } : {};
        })(),
        ...nightOnlyAlolanMeowth ? {} : (() => {
          const weightMults = convertWeightMults(entry);
          return weightMults ? { weightMults } : {};
        })()
      };
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
              ...entry.id ? { entryId: entry.id } : {},
              ...extras,
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
      ...rule.entryId ? { entryId: rule.entryId } : {},
      ...rule.moonPhases ? { moonPhases: rule.moonPhases } : {},
      ...rule.timeRange ? { timeRange: rule.timeRange } : {},
      ...rule.thunder ? { thunder: true } : {},
      ...rule.pokeSnack !== void 0 ? { pokeSnack: rule.pokeSnack } : {},
      ...rule.slimeChunk ? { slimeChunk: true } : {},
      ...rule.coords ? { coords: rule.coords } : {},
      ...rule.weightMults ? { weightMults: rule.weightMults } : {},
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
      ...rule.entryId ? { entryId: rule.entryId } : {},
      ...rule.moonPhases ? { moonPhases: rule.moonPhases } : {},
      ...rule.timeRange ? { timeRange: rule.timeRange } : {},
      ...rule.thunder ? { thunder: true } : {},
      ...rule.pokeSnack !== void 0 ? { pokeSnack: rule.pokeSnack } : {},
      ...rule.slimeChunk ? { slimeChunk: true } : {},
      ...rule.coords ? { coords: rule.coords } : {},
      ...rule.weightMults ? { weightMults: rule.weightMults } : {},
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
    bundled.entryId = rule.entryId ?? `${id}-${rule.bucket}`;
    if (rule.moonPhases) bundled.moonPhases = [...rule.moonPhases];
    if (rule.timeRange) bundled.timeRange = rule.timeRange;
    if (rule.thunder) bundled.thunder = true;
    if (rule.pokeSnack !== void 0) bundled.pokeSnack = rule.pokeSnack;
    if (rule.slimeChunk) bundled.slimeChunk = true;
    if (rule.coords) bundled.coords = { ...rule.coords };
    if (rule.weightMults) bundled.weightMults = rule.weightMults;
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
  { species: "sinistcha", formId: "masterpiece", wildRate: 0.2, biomeKeywords: ["forest", "mountain", "cherry", "village"] },
  { species: "torterra", formId: "tree_oak", wildRate: 0, biomeKeywords: [] },
  { species: "torterra", formId: "tree_birch", wildRate: 0, biomeKeywords: [] },
  { species: "torterra", formId: "tree_darkoak", wildRate: 0, biomeKeywords: [] },
  { species: "torterra", formId: "tree_acacia", wildRate: 0, biomeKeywords: [] },
  { species: "torterra", formId: "tree_azalea", wildRate: 0, biomeKeywords: [] },
  { species: "torterra", formId: "tree_swamp", wildRate: 0, biomeKeywords: [] },
  { species: "torterra", formId: "tree_jungle", wildRate: 0, biomeKeywords: [] },
  { species: "torterra", formId: "tree_spruce", wildRate: 0, biomeKeywords: [] },
  { species: "torterra", formId: "tree_mangrove", wildRate: 0, biomeKeywords: [] },
  { species: "torterra", formId: "tree_cherry", wildRate: 0, biomeKeywords: [] }
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

// tools/kit/kit.ts
init_anim_sample();

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
  // Carteles de pie y colgantes: llegó por el repositorio público (PR #2,
  // conversión de estructuras del kit). Bedrock no tiene `*_wall_hanging_sign`:
  // el de pared es el colgante con `facing_direction`.
  "minecraft:oak_sign": "minecraft:standing_sign",
  "minecraft:spruce_sign": "minecraft:spruce_standing_sign",
  "minecraft:birch_sign": "minecraft:birch_standing_sign",
  "minecraft:jungle_sign": "minecraft:jungle_standing_sign",
  "minecraft:acacia_sign": "minecraft:acacia_standing_sign",
  "minecraft:dark_oak_sign": "minecraft:darkoak_standing_sign",
  "minecraft:mangrove_sign": "minecraft:mangrove_standing_sign",
  "minecraft:cherry_sign": "minecraft:cherry_standing_sign",
  "minecraft:bamboo_sign": "minecraft:bamboo_standing_sign",
  "minecraft:crimson_sign": "minecraft:crimson_standing_sign",
  "minecraft:pale_oak_sign": "minecraft:pale_oak_standing_sign",
  "minecraft:oak_wall_hanging_sign": "minecraft:oak_hanging_sign",
  "minecraft:spruce_wall_hanging_sign": "minecraft:spruce_hanging_sign",
  "minecraft:birch_wall_hanging_sign": "minecraft:birch_hanging_sign",
  "minecraft:jungle_wall_hanging_sign": "minecraft:jungle_hanging_sign",
  "minecraft:acacia_wall_hanging_sign": "minecraft:acacia_hanging_sign",
  "minecraft:dark_oak_wall_hanging_sign": "minecraft:dark_oak_hanging_sign",
  "minecraft:mangrove_wall_hanging_sign": "minecraft:mangrove_hanging_sign",
  "minecraft:cherry_wall_hanging_sign": "minecraft:cherry_hanging_sign",
  "minecraft:bamboo_wall_hanging_sign": "minecraft:bamboo_hanging_sign",
  "minecraft:crimson_wall_hanging_sign": "minecraft:crimson_hanging_sign",
  "minecraft:warped_wall_hanging_sign": "minecraft:warped_hanging_sign",
  "minecraft:pale_oak_wall_hanging_sign": "minecraft:pale_oak_hanging_sign",
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
var WALL_ATTACH_FACING = { north: 2, south: 3, west: 4, east: 5 };
var HOOK_DIRECTION = { south: 0, west: 1, north: 2, east: 3 };
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
  const isButton = /_button$/.test(name);
  const isCampfire = name === "minecraft:campfire" || name === "minecraft:soul_campfire";
  const isLantern = name === "minecraft:lantern" || name === "minecraft:soul_lantern" || /_lantern$/.test(name) && name.includes("copper");
  const isTripwireHook = name === "minecraft:tripwire_hook";
  const isStandingSign = /_standing_sign$/.test(name) || name === "minecraft:standing_sign";
  const isHangingSign = /_hanging_sign$/.test(name);
  const isWallSign = /_wall_sign$/.test(name) || name === "minecraft:wall_sign";
  const ownStates = isButton || isCampfire || isLantern || isTripwireHook || isStandingSign || isHangingSign || isWallSign;
  if (isTrapdoor) {
    if (p.facing && TRAPDOOR_DIRECTION[p.facing] !== void 0) {
      states["direction"] = TRAPDOOR_DIRECTION[p.facing];
    }
    states["upside_down_bit"] = p.half === "top";
    states["open_bit"] = p.open === "true";
  }
  if (isButton) {
    if (p.face === "floor") states["facing_direction"] = 1;
    else if (p.face === "ceiling") states["facing_direction"] = 0;
    else states["facing_direction"] = (p.facing && WALL_ATTACH_FACING[p.facing]) ?? 1;
    states["button_pressed_bit"] = p.powered === "true";
  }
  if (isCampfire) {
    states["extinguished"] = p.lit === "false";
    if (p.facing && HORIZONTAL.has(p.facing)) states["minecraft:cardinal_direction"] = p.facing;
  }
  if (isLantern) states["hanging"] = p.hanging === "true";
  if (isTripwireHook) {
    if (p.facing && HOOK_DIRECTION[p.facing] !== void 0) states["direction"] = HOOK_DIRECTION[p.facing];
    states["attached_bit"] = p.attached === "true";
    states["powered_bit"] = p.powered === "true";
  }
  const signRotation = () => {
    const rot = Number(p.rotation ?? "0");
    if (Number.isFinite(rot)) states["ground_sign_direction"] = (Math.round(rot) % 16 + 16) % 16;
  };
  if (isStandingSign) signRotation();
  if (isHangingSign) {
    states["hanging"] = true;
    if (/_wall_hanging_sign$/.test(javaName) && p.facing && WALL_ATTACH_FACING[p.facing] !== void 0) {
      states["facing_direction"] = WALL_ATTACH_FACING[p.facing];
      states["attached_bit"] = false;
    } else {
      signRotation();
      states["attached_bit"] = p.attached === "true";
      if (p.facing && WALL_ATTACH_FACING[p.facing] !== void 0) states["facing_direction"] = WALL_ATTACH_FACING[p.facing];
    }
  }
  if (isWallSign && p.facing && WALL_ATTACH_FACING[p.facing] !== void 0) {
    states["facing_direction"] = WALL_ATTACH_FACING[p.facing];
  }
  if (!isDoor && !isBed && !isCarpet && !isTrapdoor && !ownStates) {
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
    if (!ownStates) {
      applyFacing(
        states,
        allowed,
        p.facing,
        isDoor,
        p.half === "upper",
        FACING_IS_WALL_SIDE.has(javaName)
      );
    }
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
