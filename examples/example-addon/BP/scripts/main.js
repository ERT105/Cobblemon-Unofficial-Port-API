/**
 * Example add-on for the Cobblemon Bedrock API.
 *
 * Registers a new species, `ejemplo:pikachu_surf`, with:
 * - a night form with its own entity (`ejemplo:pikachu_surf_night`);
 * - its spawns on beaches (the normal one by day, the night form by night);
 * - its sprites, including the party panel portrait (its own glyphs);
 * - its drops and its battle animations;
 * - a new evolution for Cobblemon Bedrock's Pikachu: with a Water Stone, into this one;
 * - and it listens to Cobblemon Bedrock's events (captures, battles, levels…)
 *   and reports them in chat.
 *
 * Registration and events are handled by the `cobblemon-bedrock-api` library
 * (`cobblemon-bedrock-api.js`, copied from `api/dist/`): this file only holds
 * the data and what to do with each event.
 */

import { world } from "@minecraft/server";
import { onCobblemonEvent, registerAddon } from "./cobblemon-bedrock-api.js";
// Battle animations and model points: Pikachu's, since that's the model this
// species uses.
import { BATTLE_CLIPS, LOCATORS } from "./battleData.js";

// —— This add-on ——

/** Your namespace: the one of your entities and your species. */
const ADDON = "ejemplo";
const VERSION = "1.3.1";

const SPECIES = {
  id: "ejemplo:pikachu_surf",
  name: "Surfing Pikachu",
  // Outside the official numbering: the Pokédex puts it at the end.
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
  // The night form: different type and stats, and its own entity
  // (`ejemplo:pikachu_surf_night`, in this add-on's BP).
  forms: [
    {
      name: "night",
      primaryType: "electric",
      secondaryType: "dark",
      baseStats: { hp: 45, attack: 70, defence: 45, specialAttack: 60, specialDefence: 55, speed: 100 },
      // Its own level-up moves, in the mod's format: "level:move".
      moves: ["1:thundershock", "1:tailwhip", "5:quickattack", "10:bite", "18:spark", "26:crunch", "36:thunderbolt"],
    },
  ],
  // Drops, in Cobblemon's format.
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
      // Biome tag, as in the mod: `beach` is any beach.
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
 * Paths in this add-on's resource pack.
 * `glyph`: the party panel portrait, a character from our glyph page
 * `font/glyph_F0.png` (U+F000 onwards).
 */
const SPRITES = {
  "ejemplo:pikachu_surf||0": {
    pc: "textures/ejemplo/sprites/pc/pikachu_surf",
    face: "textures/ejemplo/sprites/face/pikachu_surf",
    dex: "textures/ejemplo/sprites/dex/pikachu_surf",
    glyph: "",
  },
  "ejemplo:pikachu_surf|night|0": {
    pc: "textures/ejemplo/sprites/pc/pikachu_surf_night",
    face: "textures/ejemplo/sprites/face/pikachu_surf_night",
    dex: "textures/ejemplo/sprites/dex/pikachu_surf_night",
    glyph: "",
  },
};

/** Cobblemon Bedrock's Pikachu evolves into this one with a Water Stone. */
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

// —— Registration ——

registerAddon({ addon: ADDON, version: VERSION, species: [SPECIES], spawn: SPAWN, sprites: SPRITES, evolutions: EVOLUTIONS });

// —— Cobblemon Bedrock events (see "Events" in the reference) ——

/** A species name as a language key: Cobblemon Bedrock's or an add-on's. */
function speciesName(species) {
  const id = String(species).toLowerCase();
  return { translate: id.includes(":") ? `entity.${id}.name` : `entity.cooblemon:${id}.name` };
}

/** What this example reports in chat for each event. */
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
  onCobblemonEvent(name, (data) => {
    console.warn(`[${ADDON}] event ${name}: ${JSON.stringify(data).slice(0, 200)}`);
    const [key, raw] = describe(data);
    // Every parameter of a `rawtext` must be an object: a bare string
    // (the level, "10") makes `sendMessage` fail with "Native variant type
    // conversion failed". Anything already `{ translate }` passes as is.
    const params = raw.map((p) => (typeof p === "string" ? { text: p } : p));
    // To the players involved: the party owner, or both sides of a duel.
    const ids = new Set([data.player?.id, ...(data.players ?? []).map((p) => p.id)].filter(Boolean));
    for (const player of world.getAllPlayers()) {
      if (!ids.has(player.id)) continue;
      player.sendMessage({ rawtext: [{ text: "§b[Example]§r " }, { translate: key, with: { rawtext: params } }] });
    }
  });
}
