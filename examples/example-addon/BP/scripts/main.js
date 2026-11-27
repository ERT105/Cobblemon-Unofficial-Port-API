/**
 * Example add-on for the Cobblemon Bedrock API.
 *
 * Registers a new species, `ejemplo:pikachu_surf`, with:
 * - a night form with its own entity (`ejemplo:pikachu_surf_night`);
 * - its spawns on beaches (the normal one by day, the night form by night);
 * - its sprites, including the party panel portrait (its own glyphs);
 * - its drops and its battle animations;
 * - a new evolution for Cobblemon Bedrock's Pikachu: with a Water Stone, into this one;
 * - a mega evolution (`ejemplo:pikachu_surf_mega`), triggered by its stone
 *   (`ejemplo:surfite`) with a generic test Key Stone (`ejemplo:key_stone`)
 *   in the offhand;
 * - it listens to Cobblemon Bedrock's events (captures, battles, levels…)
 *   and reports them in chat;
 * - and it has test commands that ask Cobblemon Bedrock to do things
 *   (actions and queries), run with `/scriptevent ejemplo:<command>`:
 *   `altar`, `boss`, `gift`, `heal`, `info`, `mega`, `items` and `npcs`;
 * - its own move, Surf Shock (`ejemplo:surf_shock`), based on Surf;
 * - two items used on a party Pokémon (`ejemplo:surf_soda`, `ejemplo:surf_charm`):
 *   Cobblemon Bedrock picks the Pokémon and this add-on applies the effect;
 * - three NPCs (a trainer, a nurse and a shopkeeper) and a marker block that
 *   turns into them inside a structure (`ejemplo:npc_marker`).
 *
 * Registration and events are handled by the `cobblemon-bedrock-api` library
 * (`cobblemon-bedrock-api.js`, copied from `api/dist/`): this file only holds
 * the data and what to do with each event.
 */

import { ItemStack, system, world } from "@minecraft/server";
import {
  CHEST_EMPTY_NAME,
  closeChestScreen,
  hasOpenChestScreen,
  onCobblemonEvent,
  redrawChestScreen,
  registerAddon,
  registerChestScreen,
} from "./cobblemon-bedrock-api.js";
// Battle animations and model points: Pikachu's, since that's the model this
// species uses.
import { BATTLE_CLIPS, LOCATORS } from "./battleData.js";

// —— This add-on ——

/** Your namespace: the one of your entities and your species. */
const ADDON = "ejemplo";
const VERSION = "1.9.0";

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
      // This add-on's own move (MOVES below).
      { level: 20, move: "ejemplo:surf_shock" },
      { level: 24, move: "spark" },
      { level: 32, move: "surf" },
      { level: 40, move: "thunderbolt" },
    ],
    egg: [],
    tm: ["surf", "thunderbolt", "ejemplo:surf_shock"],
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
    // The mega: a form that only exists in battle. Its types, stats and
    // ability are used after mega evolving, and its entity
    // (`ejemplo:pikachu_surf_mega`) is the model shown. See MEGAS below.
    {
      name: "mega",
      battleOnly: true,
      primaryType: "electric",
      secondaryType: "water",
      baseStats: { hp: 45, attack: 75, defence: 65, specialAttack: 110, specialDefence: 80, speed: 120 },
      abilities: ["drizzle"],
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
    // The first cell of font/glyph_F0.png. Written as an escape: the character
    // itself is invisible and easy to lose when editing.
    glyph: "\uF000",
  },
  "ejemplo:pikachu_surf|night|0": {
    pc: "textures/ejemplo/sprites/pc/pikachu_surf_night",
    face: "textures/ejemplo/sprites/face/pikachu_surf_night",
    dex: "textures/ejemplo/sprites/dex/pikachu_surf_night",
    glyph: "\uF001",
  },
  // The shiny variants (`|1` at the end): without them, the PC, the summary
  // and the party panel show the normal colors for a shiny one.
  "ejemplo:pikachu_surf||1": {
    pc: "textures/ejemplo/sprites/pc/pikachu_surf_shiny",
    face: "textures/ejemplo/sprites/face/pikachu_surf_shiny",
    dex: "textures/ejemplo/sprites/dex/pikachu_surf_shiny",
    glyph: "\uF002",
  },
  "ejemplo:pikachu_surf|night|1": {
    pc: "textures/ejemplo/sprites/pc/pikachu_surf_night_shiny",
    face: "textures/ejemplo/sprites/face/pikachu_surf_night_shiny",
    dex: "textures/ejemplo/sprites/dex/pikachu_surf_night_shiny",
    glyph: "\uF003",
  },
  // The mega form, normal and shiny.
  "ejemplo:pikachu_surf|mega|0": {
    pc: "textures/ejemplo/sprites/pc/pikachu_surf_mega",
    face: "textures/ejemplo/sprites/face/pikachu_surf_mega",
    dex: "textures/ejemplo/sprites/dex/pikachu_surf_mega",
    glyph: "\uF004",
  },
  "ejemplo:pikachu_surf|mega|1": {
    pc: "textures/ejemplo/sprites/pc/pikachu_surf_mega_shiny",
    face: "textures/ejemplo/sprites/face/pikachu_surf_mega_shiny",
    dex: "textures/ejemplo/sprites/dex/pikachu_surf_mega_shiny",
    glyph: "\uF005",
  },
};

/**
 * Mega evolution: holding the Surfite, with a Key Stone in the offhand, the
 * battle shows the Mega button. Cobblemon Bedrock doesn't provide a Key
 * Stone, so this add-on brings a generic one just for testing.
 */
const MEGAS = [{ species: "ejemplo:pikachu_surf", form: "mega", stones: ["ejemplo:surfite"], ability: "drizzle" }];
const MEGA_ACCESSORIES = ["ejemplo:key_stone"];

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

// —— Moves ——
//
// A new move is based on one of Cobblemon Bedrock's: it copies its data and
// its animation, and changes what we set. This one is Surf (the wave, both
// foes, its animation) turned Electric, with a 20% chance to paralyze.
const MOVES = [
  {
    id: "ejemplo:surf_shock",
    basedOn: "surf",
    name: "Surf Shock",
    type: "electric",
    power: 75,
    effect: "paralyze",
    effectChance: 20,
  },
];

// —— Items used on a party Pokémon ——
//
// Cobblemon Bedrock picks the Pokémon (the one you look at, or the party
// selector, with those that can't use it greyed out), spends one and sends
// `item_used`. The effect is ours: below, with `updatePokemon`.
const PARTY_ITEMS = [
  // Only Pokémon missing HP: like a potion.
  { id: "ejemplo:surf_soda", hurt: true },
  // Only this add-on's species.
  { id: "ejemplo:surf_charm", species: ["ejemplo:pikachu_surf"] },
];

// NPCs: a trainer, a nurse and a shopkeeper (needs Cobblemon Bedrock with API 2).
// Every line is a language key from this add-on's RP/texts; `%s` is the
// player's name. Put them in the world with `spawnNpc` (`/scriptevent
// ejemplo:npcs`) or with the marker block, `ejemplo:npc_marker`: its state
// `ejemplo:npc` says which one (0 Kai, 1 Marina, 2 Nico; see NPC_MARKER).
const NPCS = {
  "ejemplo:surfer_kai": {
    name: "Kai",
    role: "trainer",
    skin: "ace_trainer_abel_04a5",
    // Each Pokémon with its own level: the strong one closes.
    team: [
      { species: "wingull", level: 18 },
      { species: "ejemplo:pikachu_surf", level: 24, moves: ["ejemplo:surf_shock", "quickattack", "thunderwave"] },
    ],
    skill: 0.9,
    battle: { cooldown: 120, reward: 900 },
    dialogue: {
      greeting: ["ejemplo.npc.kai.greeting"],
      options: ["battle", "close"],
      challenge: ["ejemplo.npc.kai.challenge"],
      victory: ["ejemplo.npc.kai.victory"],
      defeat: ["ejemplo.npc.kai.defeat"],
      cooldown: ["ejemplo.npc.kai.cooldown"],
      hurt: ["ejemplo.npc.hurt"],
    },
  },
  "ejemplo:nurse_marina": {
    name: "Marina",
    role: "nurse",
    skin: "nurse-joy",
    dialogue: { greeting: ["ejemplo.npc.marina.greeting"], hurt: ["ejemplo.npc.hurt"] },
  },
  "ejemplo:shop_nico": {
    name: "Nico",
    role: "merchant",
    skin: "shop_keeper",
    // One page per category; more than 12 offers in one category get more
    // pages. `stock` is per in-game day, for everyone; without it, never runs out.
    shop: [
      {
        name: "ejemplo.npc.nico.category",
        offers: [
          { item: "ejemplo:surf_soda", price: 300 },
          { item: "ejemplo:surf_charm", price: 2500, stock: 1 },
          { item: "cooblemon:dive_ball", price: 1000 },
        ],
      },
      {
        name: "ejemplo.npc.nico.balls",
        offers: [
          { item: "cooblemon:poke_ball", price: 200 },
          { item: "cooblemon:great_ball", price: 600 },
          { item: "cooblemon:ultra_ball", price: 800 },
          { item: "cooblemon:net_ball", price: 1000 },
          { item: "cooblemon:dive_ball", price: 1000 },
          { item: "cooblemon:quick_ball", price: 1000 },
          { item: "cooblemon:dusk_ball", price: 1000 },
          { item: "cooblemon:timer_ball", price: 1000, stock: 5 },
        ],
      },
      {
        name: "ejemplo.npc.nico.medicine",
        offers: [
          { item: "cooblemon:potion", price: 200 },
          { item: "cooblemon:super_potion", price: 700 },
          { item: "cooblemon:hyper_potion", price: 1500 },
          { item: "cooblemon:antidote", price: 200 },
          { item: "cooblemon:paralyze_heal", price: 200 },
          { item: "cooblemon:burn_heal", price: 200 },
          { item: "cooblemon:ice_heal", price: 200 },
          { item: "cooblemon:awakening", price: 200 },
          { item: "cooblemon:full_heal", price: 400 },
          { item: "cooblemon:ether", price: 1200 },
          { item: "cooblemon:revive", price: 2000, stock: 3 },
          { item: "cooblemon:max_potion", price: 2500 },
          { item: "cooblemon:full_restore", price: 3000 },
        ],
      },
    ],
    // No greeting and no options: touching it opens the shop, like any merchant.
  },
};

// —— Buttons in Cobblemon Bedrock's screens ——
//
// They show up behind an "Add-ons" button in the party summary and the PC,
// only when one fits the Pokémon on screen. Picking one closes the screen and
// sends `ui_button`; what it does is ours (below). The icons are textures:
// these two are Cobblemon Bedrock's, but your own RP's work the same.
const BUTTONS = [
  // Party summary only: `updatePokemon` works on the party, not on PC boxes.
  { id: "ejemplo:rest", screen: "summary", label: "ejemplo.button.rest", icon: "textures/items/super_potion" },
  // Both screens, only for Pikachu and our surfing one.
  {
    id: "ejemplo:wave",
    screen: ["summary", "pc"],
    label: "ejemplo.button.wave",
    icon: "textures/items/water_stone",
    species: ["pikachu", "ejemplo:pikachu_surf"],
  },
];

/** The marker block's numbers (its `ejemplo:npc` state). */
const NPC_MARKER = { 0: "ejemplo:surfer_kai", 1: "ejemplo:nurse_marina", 2: "ejemplo:shop_nico" };

// —— Registration ——

// `registerAddon` returns the client for actions and queries (see "Test commands").
const cobblemon = registerAddon({
  addon: ADDON,
  version: VERSION,
  moves: MOVES,
  species: [SPECIES],
  spawn: SPAWN,
  sprites: SPRITES,
  evolutions: EVOLUTIONS,
  megas: MEGAS,
  megaAccessories: MEGA_ACCESSORIES,
  partyItems: PARTY_ITEMS,
  npcs: NPCS,
  buttons: BUTTONS,
});

// The marker block: in a structure, it becomes the NPC when the chunk loads.
// It must be registered now, while the script loads.
cobblemon.npcMarker("ejemplo:npc_marker", NPC_MARKER, { tag: "example_village" });

// Battles against our NPCs come with their id and tag.
onCobblemonEvent("battle_end", (e) => {
  if (e.npc?.startsWith(`${ADDON}:`)) console.warn(`[${ADDON}] battle against ${e.npc} (${e.npcTag ?? "no tag"}): ${e.result}`);
});

// The effect of each item: what to change in the Pokémon, and what to say.
const ITEM_EFFECTS = {
  "ejemplo:surf_soda": { changes: { heal: 40 }, say: (before, after) => ["ejemplo.item.healed", [String(after.hp - before.hp)]] },
  "ejemplo:surf_charm": { changes: { levels: 1 }, say: (_before, after) => ["ejemplo.item.level", [String(after.level)]] },
};

// Every purchase in a shop, ours or Cobblemon Bedrock's (`npc: null`).
onCobblemonEvent("npc_purchase", (e) => {
  if (e.npc?.startsWith(`${ADDON}:`)) console.warn(`[${ADDON}] ${e.player.name} bought ${e.item} from ${e.npc} for ${e.price} (${e.category ?? "no category"})`);
});

onCobblemonEvent("item_used", (e) => {
  const effect = ITEM_EFFECTS[e.item];
  if (!effect) return;
  cobblemon
    .updatePokemon(e.player.id, e.pokemon.uuid, effect.changes)
    .then(({ pokemon }) => {
      const player = world.getAllPlayers().find((p) => p.id === e.player.id);
      if (!player) return;
      const [key, params] = effect.say(e.pokemon, pokemon);
      say(player, key, [speciesName(pokemon.species), ...params]);
    })
    .catch((err) => console.warn(`[${ADDON}] item ${e.item}: ${err.message}`));
});

// What each button does. `ui_button` reaches every add-on: keep only yours.
onCobblemonEvent("ui_button", (e) => {
  if (e.addon !== ADDON) return;
  const player = world.getAllPlayers().find((p) => p.id === e.player.id);
  if (!player) return;
  if (e.button === "ejemplo:rest") {
    cobblemon
      .updatePokemon(e.player.id, e.pokemon.uuid, { heal: "full", cure: true })
      .then(({ pokemon }) => say(player, "ejemplo.button.rested", [speciesName(pokemon.species)]))
      .catch((err) => console.warn(`[${ADDON}] button ${e.button}: ${err.message}`));
  } else if (e.button === "ejemplo:wave") {
    // Where it is: a party slot, or a PC box (both counted from 1 for players).
    const where =
      e.place.kind === "party"
        ? { translate: "ejemplo.button.in_party", with: { rawtext: [{ text: String(e.place.slot + 1) }] } }
        : { translate: "ejemplo.button.in_box", with: { rawtext: [{ text: String(e.place.box + 1) }, { text: String(e.place.slot + 1) }] } };
    say(player, "ejemplo.button.waved", [speciesName(e.pokemon.species), where]);
  }
});

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
    // A Pokémon this add-on spawned or gave carries its tag in every event.
    const tag = data.pokemon?.tag;
    const tagged = tag ? [{ text: " " }, { translate: "ejemplo.event.tagged", with: { rawtext: [{ text: tag }] } }] : [];
    // To the players involved: the party owner, or both sides of a duel.
    const ids = new Set([data.player?.id, ...(data.players ?? []).map((p) => p.id)].filter(Boolean));
    for (const player of world.getAllPlayers()) {
      if (!ids.has(player.id)) continue;
      player.sendMessage({ rawtext: [{ text: "§b[Example]§r " }, { translate: key, with: { rawtext: params } }, ...tagged] });
    }
  });
}

// —— Test commands: actions and queries ——
//
// `/scriptevent ejemplo:altar`  A shiny Articuno with perfect IVs, tagged "altar", and a battle right away.
// `/scriptevent ejemplo:boss`   A Surfing Pikachu that can't be caught, tagged "boss".
// `/scriptevent ejemplo:gift`   A shiny Surfing Pikachu in an Ultra Ball, nicknamed and tagged "gift".
// `/scriptevent ejemplo:heal`   Heals your party.
// `/scriptevent ejemplo:info`   Your party, your Pokédex and the wild Pokémon around you.
// `/scriptevent ejemplo:mega`   The test Key Stone, a Surfite, and a Surfing Pikachu already holding one.
// `/scriptevent ejemplo:items`  Surf Sodas and Surf Charms, items used on a party Pokémon.
// `/scriptevent ejemplo:npcs`   Kai, Marina and Nico in a row in front of you.
// `/scriptevent ejemplo:spawns` What can spawn where you stand (API 3), bucket by bucket.
// `/scriptevent ejemplo:fishing` What can bite on your rod (API 3), bucket by bucket.
// `/scriptevent ejemplo:radar`  The Spawn Radar: hold it and tap to open a chest screen (API 3).
// `/scriptevent ejemplo:hud`    Turns a small HUD box with your coordinates on and off (API 3).
// `/scriptevent ejemplo:entries` How many spawn entries there are, all and Pikachu's (API 3).

/** Sends a chat line to one player with this example's prefix. */
function say(player, key, params = []) {
  const rawtext = params.map((p) => (typeof p === "string" ? { text: p } : p));
  // No `with` when there are no parameters: an empty list makes the game
  // reject the whole message ("Failed to resolve raw message").
  const line = rawtext.length ? { translate: key, with: { rawtext } } : { translate: key };
  player.sendMessage({ rawtext: [{ text: "§b[Example]§r " }, line] });
}

// —— HUD (API 3) ——
//
// Cobblemon Bedrock adds our marks and lines to the HUD title it already
// sends (its party panel uses it), so we never send titles ourselves.
// `RP/ui/hud_screen.json` adds `RP/ui/ejemplo_hud.json` to the HUD: it shows
// the box while the title contains `|ejemplo:hud|`, and title rows 0 and 1 (our two lines).

const hudTimers = new Map();

async function sendHud(player) {
  const { x, y, z } = player.location;
  await cobblemon.hud(player, {
    marks: ["hud"],
    lines: [`${Math.floor(x)} ${Math.floor(y)} ${Math.floor(z)}`, { translate: "ejemplo.hud.title" }],
  });
}

const COMMANDS = {
  async entries(player) {
    const all = await cobblemon.spawnEntries();
    const pikachu = await cobblemon.spawnEntries("pikachu");
    say(player, "ejemplo.cmd.entries", [String(all.ids.length), String(pikachu.ids.length), pikachu.ids.join(", ")]);
  },
  async hud(player) {
    const timer = hudTimers.get(player.id);
    if (timer !== undefined) {
      system.clearRun(timer);
      hudTimers.delete(player.id);
      await cobblemon.hud(player, null);
      say(player, "ejemplo.cmd.hud_off");
      return;
    }
    let last = "";
    // Only when the block changes: every call sends the HUD title again.
    const id = system.runInterval(() => {
      if (!player.isValid) {
        system.clearRun(id);
        hudTimers.delete(player.id);
        return;
      }
      const { x, y, z } = player.location;
      const key = `${Math.floor(x)} ${Math.floor(y)} ${Math.floor(z)}`;
      if (key === last) return;
      last = key;
      sendHud(player).catch(() => {});
    }, 5);
    hudTimers.set(player.id, id);
    say(player, "ejemplo.cmd.hud_on");
  },
  async altar(player) {
    const result = await cobblemon.spawn({
      pokemon: {
        species: "articuno",
        level: 50,
        shiny: true,
        ivs: { hp: 31, attack: 31, defence: 31, specialAttack: 31, specialDefence: 31, speed: 31 },
        nature: "modest",
        moves: ["icebeam", "hurricane", "roost", "freezedry"],
        tag: "altar",
      },
      nearPlayer: player,
      battle: player,
    });
    say(player, "ejemplo.cmd.spawned", [speciesName("articuno"), result.entityId]);
  },
  async boss(player) {
    const result = await cobblemon.spawn({
      pokemon: { species: "ejemplo:pikachu_surf", level: 30, catchable: false, tag: "boss" },
      nearPlayer: player,
    });
    say(player, "ejemplo.cmd.spawned", [speciesName("ejemplo:pikachu_surf"), result.entityId]);
  },
  async gift(player) {
    const result = await cobblemon.give({
      player,
      pokemon: { species: "ejemplo:pikachu_surf", level: 15, shiny: true, nickname: "Wave", ball: "cooblemon:ultra_ball", tag: "gift" },
    });
    say(player, `ejemplo.cmd.gift_${result.destination}`, [speciesName(result.pokemon.species)]);
  },
  async heal(player) {
    await cobblemon.heal(player);
    say(player, "ejemplo.cmd.healed");
  },
  async info(player) {
    const party = await cobblemon.party(player);
    const list = party.pokemon.map((p) => `${p.species} ${p.level}${p.shiny ? "★" : ""}${p.tag ? ` [${p.tag}]` : ""}`).join(", ");
    say(player, "ejemplo.cmd.party", [list || "-"]);
    const dex = await cobblemon.pokedex(player);
    say(player, "ejemplo.cmd.pokedex", [String(dex.seen), String(dex.caught), String(dex.total)]);
    const nearby = await cobblemon.nearby({ player, radius: 32 });
    const wild = nearby.pokemon.slice(0, 5).map((p) => `${p.species} ${p.level} (${p.distance}m)${p.tag ? ` [${p.tag}]` : ""}`).join(", ");
    say(player, "ejemplo.cmd.nearby", [wild || "-"]);
  },
  async mega(player) {
    // The items are plain Bedrock: the add-on gives them itself.
    const inventory = player.getComponent("minecraft:inventory")?.container;
    for (const id of ["ejemplo:key_stone", "ejemplo:surfite"]) inventory?.addItem(new ItemStack(id, 1));
    // A Surfing Pikachu already holding its stone, so it's ready to battle.
    const result = await cobblemon.give({
      player,
      pokemon: { species: "ejemplo:pikachu_surf", level: 30, heldItem: "ejemplo:surfite", tag: "mega" },
    });
    say(player, `ejemplo.cmd.gift_${result.destination}`, [speciesName(result.pokemon.species)]);
    say(player, "ejemplo.cmd.mega");
  },
  async items(player) {
    // The items used on a party Pokémon (PARTY_ITEMS): use one while looking
    // at your Pokémon, or anywhere else to choose it from your party.
    const inventory = player.getComponent("minecraft:inventory")?.container;
    inventory?.addItem(new ItemStack("ejemplo:surf_soda", 5));
    inventory?.addItem(new ItemStack("ejemplo:surf_charm", 5));
    say(player, "ejemplo.cmd.items");
  },
  async spawns(player) {
    const table = await cobblemon.spawnTable({ player });
    say(player, "ejemplo.cmd.spawns", [table.biome ?? "?", table.isDay ? "day" : "night"]);
    for (const { bucket, chance } of table.buckets) {
      // The percent sign goes in the .lang file, as a single `%` that is never
      // the last character: chat messages don't turn `%%` into `%`, and a `%`
      // at the end of a parameter is dropped.
      const top = [];
      table.entries
        .filter((e) => e.bucket === bucket)
        .slice(0, 6)
        .forEach((e, i) => {
          if (i > 0) top.push({ text: ", " });
          top.push({
            translate: "ejemplo.cmd.spawns_item",
            with: { rawtext: [{ text: `${e.species}${e.form ? ` (${e.form})` : ""}` }, { text: String(Math.round(e.chance * 100)) }] },
          });
        });
      say(player, "ejemplo.cmd.spawns_bucket", [bucket, String(Math.round(chance * 1000) / 10), top.length ? { rawtext: top } : "-"]);
    }
  },
  async fishing(player) {
    const table = await cobblemon.fishingTable(player);
    say(player, "ejemplo.cmd.fishing", [
      table.rod?.id ?? "-",
      table.bait?.item ?? "-",
      String(table.lureLevel),
      String(table.luckLevel),
      String(Math.round(table.pokemonChance * 100)),
    ]);
    // An empty table says where it looked, so a wrong spot is easy to tell apart.
    if (table.entries.length === 0) {
      say(player, "ejemplo.cmd.fishing_empty", [table.biome ?? "-", String(table.at.x), String(table.at.y), String(table.at.z)]);
      return;
    }
    for (const { bucket, chance } of table.buckets) {
      const top = [];
      table.entries
        .filter((e) => e.bucket === bucket)
        .slice(0, 6)
        .forEach((e, i) => {
          if (i > 0) top.push({ text: ", " });
          top.push({
            translate: "ejemplo.cmd.spawns_item",
            with: { rawtext: [{ text: e.species }, { text: String(Math.round(e.chance * 100)) }] },
          });
        });
      say(player, "ejemplo.cmd.spawns_bucket", [bucket, String(Math.round(chance * 1000) / 10), top.length ? { rawtext: top } : "-"]);
    }
  },
  async radar(player) {
    player.getComponent("minecraft:inventory")?.container?.addItem(new ItemStack("ejemplo:spawn_radar", 1));
    say(player, "ejemplo.cmd.radar");
  },
  async npcs(player) {
    // In a row, three blocks in front of the player, facing them.
    const yaw = player.getRotation().y;
    const rad = (yaw * Math.PI) / 180;
    const ahead = { x: -Math.sin(rad), z: Math.cos(rad) };
    const side = { x: ahead.z, z: -ahead.x };
    const ids = Object.keys(NPCS);
    for (const [i, npc] of ids.entries()) {
      const offset = (i - (ids.length - 1) / 2) * 2;
      const at = {
        dimension: player.dimension.id.replace("minecraft:", ""),
        x: Math.floor(player.location.x + ahead.x * 3 + side.x * offset),
        y: Math.floor(player.location.y),
        z: Math.floor(player.location.z + ahead.z * 3 + side.z * offset),
      };
      const result = await cobblemon.spawnNpc({ npc, at, yaw: yaw + 180, tag: "test" });
      say(player, "ejemplo.cmd.npc", [npc, result.entityId]);
    }
  },
};

system.afterEvents.scriptEventReceive.subscribe((event) => {
  if (!event.id.startsWith(`${ADDON}:`)) return;
  const player = event.sourceEntity;
  if (player?.typeId !== "minecraft:player") return;
  const command = COMMANDS[event.id.slice(ADDON.length + 1)];
  if (!command) return;
  // A failed request rejects with the reason: show it, so it's easy to see what went wrong.
  command(player).catch((err) => say(player, "ejemplo.cmd.error", [String(err?.message ?? err)]));
});

// —— Chest screen (API 3): the Spawn Radar ——
//
// A small Cobblenav-style screen: the top row picks the rarity bucket, the
// rest shows what can spawn here as sprites. Tap one to get its chance in
// chat. The screen is the inventory of `cooblemon:addon_screen`; each slot's
// item is named with what to draw (a texture path or a translation key), and
// `RP/ui/ejemplo_radar.json` draws it.

const BUCKETS = ["common", "uncommon", "rare", "ultra-rare"];
const CLOSE_SLOT = 8;
const FIRST_ENTRY = 9;

/** Fetches the table and the sprites for the open screen, then redraws it. */
async function loadRadar(player, state) {
  state.loading = true;
  try {
    // `area`: the places around the player where wild Pokémon really spawn,
    // not just the block they stand on. Takes a few ticks.
    const table = await cobblemon.spawnTable({ player, bucket: state.bucket, area: true });
    state.places = table.area?.positions ?? 1;
    const entries = table.entries.slice(0, 54 - FIRST_ENTRY);
    const sprites = entries.length
      ? (await cobblemon.sprites(entries.map((e) => ({ species: e.species, form: e.form ?? undefined })))).sprites
      : [];
    state.entries = entries.map((e, i) => ({ ...e, sprite: sprites[i]?.sprite ?? null }));
  } catch (err) {
    say(player, "ejemplo.cmd.error", [String(err?.message ?? err)]);
    state.entries = [];
  }
  state.loading = false;
  if (player.isValid) redrawChestScreen(player);
}

registerChestScreen({
  addon: ADDON,
  // Invisible mark that `RP/ui/chest_screen.json` recognizes. Unique to this add-on.
  title: "§e§j§r",
  items: ["ejemplo:spawn_radar"],
  newState: () => ({ bucket: "common", entries: [], loading: false, places: 1 }),
  onOpen: (player, state) => void loadRadar(player, state),
  names(_player, state) {
    const names = new Array(54).fill(CHEST_EMPTY_NAME);
    BUCKETS.forEach((bucket, i) => {
      names[i] = `ejemplo.radar.bucket.${bucket}${state.bucket === bucket ? ".on" : ""}`;
    });
    names[CLOSE_SLOT] = "ejemplo.radar.close";
    if (state.loading) names[FIRST_ENTRY] = "ejemplo.radar.loading";
    else if (state.entries.length === 0) names[FIRST_ENTRY] = "ejemplo.radar.nothing";
    else state.entries.forEach((e, i) => {
      names[FIRST_ENTRY + i] = e.sprite ?? `entity.cooblemon:${e.species}.name`;
    });
    return names;
  },
  touchable: (state) => [0, 1, 2, 3, CLOSE_SLOT, ...state.entries.map((_, i) => FIRST_ENTRY + i)],
  action(player, state, slot) {
    if (slot === CLOSE_SLOT) return "close";
    if (slot < BUCKETS.length) {
      state.bucket = BUCKETS[slot];
      state.entries = [];
      void loadRadar(player, state);
      return;
    }
    const entry = state.entries[slot - FIRST_ENTRY];
    if (!entry) return;
    say(player, "ejemplo.radar.entry", [
      speciesName(entry.species),
      String(Math.round(entry.chance * 1000) / 10),
      entry.id,
      entry.levels ? `${entry.levels.min}-${entry.levels.max}` : "?",
    ]);
    // Cobblemon's own conditions for that entry, as Cobblenav's detail shows them.
    void cobblemon
      .spawnDetail([entry.id])
      .then(({ details }) => {
        const detail = details[0];
        if (!detail || !player.isValid) return;
        const condition = detail.conditions[0] ?? {};
        const keys = Object.keys(condition).filter((k) => k !== "biomes");
        say(player, "ejemplo.radar.detail", [
          detail.positionType,
          `${entry.positions ?? 1}/${state.places}`,
          keys.join(", ") || "-",
        ]);
      })
      .catch(() => {});
  },
});

// While holding the radar, a spawn entry that appears around you for the
// first time is announced: a Cobblenav-style catalogue. Only the first time
// (per player, until the world is reloaded): the spawner keeps replacing
// Pokémon that despawn, so announcing every spawn floods the chat. A real
// catalogue would keep the set with dynamic properties.
const catalogue = new Map();
onCobblemonEvent("wild_spawned", (e) => {
  if (!e.player || !e.pokemon.entryId) return;
  const player = world.getAllPlayers().find((p) => p.id === e.player.id);
  const held = player?.getComponent("minecraft:inventory")?.container?.getItem(player.selectedSlotIndex);
  if (held?.typeId !== "ejemplo:spawn_radar") return;
  const seen = catalogue.get(player.id) ?? new Set();
  catalogue.set(player.id, seen);
  if (seen.has(e.pokemon.entryId)) return;
  seen.add(e.pokemon.entryId);
  say(player, "ejemplo.radar.spawned", [speciesName(e.pokemon.species), e.pokemon.entryId, e.pokemon.bucket ?? "-"]);
});

// Like Cobblenav's Fishingnav: once something starts swimming to the bobber,
// the radar's screen closes, so it can't be used to peek at the bite.
onCobblemonEvent("fishing", (e) => {
  if (e.stage !== "approach") return;
  const player = world.getAllPlayers().find((p) => p.id === e.player.id);
  if (player && hasOpenChestScreen(player)) closeChestScreen(player);
});

// And each one you come across (battle, Poké Ball or Pokédex scanner): the
// other way Cobblenav's catalogue learns an entry.
onCobblemonEvent("pokemon_encountered", (e) => {
  const player = world.getAllPlayers().find((p) => p.id === e.player.id);
  const held = player?.getComponent("minecraft:inventory")?.container?.getItem(player.selectedSlotIndex);
  if (held?.typeId !== "ejemplo:spawn_radar") return;
  say(player, "ejemplo.radar.encountered", [speciesName(e.pokemon.species), e.pokemon.entryId ?? "-", e.via]);
});
