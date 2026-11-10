/**
 * Add-on de ejemplo de la API de Cooblemon (fase 1).
 *
 * Registra una especie nueva, `ejemplo:pikachu_surf`, con:
 * - una forma nocturna con su propia entidad (`ejemplo:pikachu_surf_night`);
 * - su aparición en las playas (la normal de día, la nocturna de noche);
 * - sus sprites, también el retrato del panel del equipo (glifos propios);
 * - su botín y sus animaciones de combate;
 * - una evolución nueva para el Pikachu de la base: con Piedra Agua, a este;
 * - y escucha los eventos de Cooblemon (capturas, combates, niveles…) y los
 *   cuenta en el chat.
 *
 * El registro y los eventos los hace la librería `cooblemon-api`
 * (`cooblemon-api.js`, que `npm run example:addon` copia de `packages/api`):
 * aquí solo van los datos y lo que hacer con cada evento.
 */

import { world } from "@minecraft/server";
import { onCooblemonEvent, registerAddon } from "./cooblemon-api.js";
// Animaciones de combate y puntos del modelo: los de Pikachu, que es el modelo
// que usa. Los saca `npm run example:addon` de las tablas de la base.
import { BATTLE_CLIPS, LOCATORS } from "./battleData.js";

// —— Lo de este add-on ——

/** Tu espacio de nombres: el de tus entidades y tus especies. */
const ADDON = "ejemplo";
const VERSION = "1.3.0";

const SPECIES = {
  id: "ejemplo:pikachu_surf",
  name: "Surfing Pikachu",
  // Fuera de la numeración oficial: la Pokédex lo pone al final.
  nationalPokedexNumber: 2001,
  generation: 0,
  primaryType: "electric",
  secondaryType: "water",
  baseStats: { hp: 45, attack: 55, defence: 45, specialAttack: 70, specialDefence: 60, speed: 95 },
  evYield: { hp: 0, attack: 0, defence: 0, specialAttack: 1, specialDefence: 0, speed: 1 },
  catchRate: 150,
  baseExperienceYield: 120,
  experienceGroup: "medium_fast",
  abilities: ["static"],
  hiddenAbility: "lightningrod",
  maleRatio: 0.5,
  eggGroups: ["field", "fairy"],
  preEvolution: "pikachu",
  moves: {
    levelUp: [
      { level: 1, move: "thundershock" },
      { level: 1, move: "tailwhip" },
      { level: 5, move: "quickattack" },
      { level: 8, move: "watergun" },
      { level: 12, move: "thunderwave" },
      { level: 18, move: "bubblebeam" },
      { level: 24, move: "spark" },
      { level: 32, move: "surf" },
      { level: 40, move: "thunderbolt" },
    ],
    egg: [],
    tm: ["surf", "thunderbolt"],
    tutor: [],
  },
  evolutions: [],
  // La forma nocturna: otro tipo y otras estadísticas, y su propia entidad
  // (`ejemplo:pikachu_surf_night`, en el BP de este add-on).
  forms: [
    {
      name: "night",
      primaryType: "electric",
      secondaryType: "dark",
      baseStats: { hp: 45, attack: 70, defence: 45, specialAttack: 60, specialDefence: 55, speed: 100 },
      // Movimientos por nivel propios, en el formato del mod: "nivel:movimiento".
      moves: ["1:thundershock", "1:tailwhip", "5:quickattack", "10:bite", "18:spark", "26:crunch", "36:thunderbolt"],
    },
  ],
  // El botín, en el formato de Cobblemon.
  drops: {
    amount: 2,
    entries: [
      { item: "minecraft:prismarine_shard", percentage: 60, quantityRange: "1-2" },
      { item: "cooblemon:oran_berry", percentage: 40 },
      { item: "cooblemon:water_stone", percentage: 5, rarity: "rare" },
    ],
  },
  battleClips: BATTLE_CLIPS,
  locators: LOCATORS,
  baseScale: 0.5,
  hitbox: { width: 0.7, height: 1.3 },
  height: 4,
  weight: 60,
};

const SPAWN = {
  entries: [
    {
      species: "ejemplo:pikachu_surf",
      // Etiqueta de bioma, como en el mod: `beach` es cualquier playa.
      biome: "beach",
      biomeTag: "is_beach",
      habitat: "land",
      light: "day",
      dimension: "overworld",
      bucket: "common",
      entryWeight: 10,
    },
    {
      species: "ejemplo:pikachu_surf",
      form: "night",
      biome: "beach",
      biomeTag: "is_beach",
      habitat: "land",
      light: "night",
      dimension: "overworld",
      bucket: "common",
      entryWeight: 10,
    },
  ],
  levels: { "ejemplo:pikachu_surf": { min: 5, max: 30 } },
};

/**
 * Rutas en el resource pack de este add-on (las genera `npm run example:addon`).
 * `glyph`: el retrato del panel del equipo, un carácter de nuestra página de
 * glifos `font/glyph_F0.png` (U+F000 en adelante).
 */
const SPRITES = {
  "ejemplo:pikachu_surf||0": {
    pc: "textures/ejemplo/sprites/pc/pikachu_surf",
    face: "textures/ejemplo/sprites/face/pikachu_surf",
    dex: "textures/ejemplo/sprites/dex/pikachu_surf",
    glyph: "",
  },
  "ejemplo:pikachu_surf|night|0": {
    pc: "textures/ejemplo/sprites/pc/pikachu_surf_night",
    face: "textures/ejemplo/sprites/face/pikachu_surf_night",
    dex: "textures/ejemplo/sprites/dex/pikachu_surf_night",
    glyph: "",
  },
};

/** Pikachu de la base evoluciona a este con una Piedra Agua. */
const EVOLUTIONS = {
  pikachu: [
    {
      id: "pikachu_pikachusurf",
      variant: "item_interact",
      result: "ejemplo:pikachu_surf",
      requiredContext: "cobblemon:water_stone",
      consumeHeldItem: false,
      learnableMoves: [],
      requirements: [],
    },
  ],
};

// —— Registro ——

registerAddon({ addon: ADDON, version: VERSION, species: [SPECIES], spawn: SPAWN, sprites: SPRITES, evolutions: EVOLUTIONS });

// —— Eventos de Cooblemon (ver «Eventos» en la referencia) ——

/** Nombre de una especie como clave de idioma: la de la base o la de un add-on. */
function speciesName(species) {
  const id = String(species).toLowerCase();
  return { translate: id.includes(":") ? `entity.${id}.name` : `entity.cooblemon:${id}.name` };
}

/** Lo que este ejemplo cuenta en el chat de cada evento. */
const ON_EVENT = {
  captured: (e) => ["ejemplo.event.captured", [speciesName(e.pokemon.species), String(e.pokemon.level)]],
  level_up: (e) => ["ejemplo.event.level_up", [speciesName(e.pokemon.species), String(e.pokemon.level)]],
  evolved: (e) => ["ejemplo.event.evolved", [speciesName(e.from), speciesName(e.pokemon.species)]],
  released: (e) => ["ejemplo.event.released", [speciesName(e.pokemon.species)]],
  starter_chosen: (e) => ["ejemplo.event.starter_chosen", [speciesName(e.pokemon.species)]],
  pokedex_registered: (e) => [`ejemplo.event.pokedex_${e.status}`, [speciesName(e.species)]],
  battle_start: (e) => ["ejemplo.event.battle_start", [{ translate: `ejemplo.battle.${e.kind}` }]],
  battle_end: (e) => ["ejemplo.event.battle_end", [{ translate: `ejemplo.battle.${e.kind}` }, { translate: `ejemplo.result.${e.result}` }]],
};

for (const [name, describe] of Object.entries(ON_EVENT)) {
  onCooblemonEvent(name, (data) => {
    console.warn(`[${ADDON}] evento ${name}: ${JSON.stringify(data).slice(0, 200)}`);
    const [key, raw] = describe(data);
    // Cada parámetro de un `rawtext` tiene que ser un objeto: un texto suelto
    // (el nivel, "10") hace fallar `sendMessage` con «Native variant type
    // conversion failed». Lo que ya es `{ translate }` pasa tal cual.
    const params = raw.map((p) => (typeof p === "string" ? { text: p } : p));
    // A los jugadores del evento: el del equipo o los dos de un duelo.
    const ids = new Set([data.player?.id, ...(data.players ?? []).map((p) => p.id)].filter(Boolean));
    for (const player of world.getAllPlayers()) {
      if (!ids.has(player.id)) continue;
      player.sendMessage({ rawtext: [{ text: "§b[Ejemplo]§r " }, { translate: key, with: { rawtext: params } }] });
    }
  });
}
