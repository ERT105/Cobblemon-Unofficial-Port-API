/**
 * Public types of the Cobblemon Bedrock API: what an add-on sends and what it
 * receives. They are the contract described in `docs/REFERENCE.md`; changing
 * them incompatibly bumps the API's major version.
 */

import type { RawMessage } from "@minecraft/server";

/** The six stats, with the port's names (`defence`, not `defense`). */
export interface Stats {
  hp: number;
  attack: number;
  defence: number;
  specialAttack: number;
  specialDefence: number;
  speed: number;
}

export type ElementalType =
  | "normal" | "fire" | "water" | "grass" | "electric" | "ice" | "fighting" | "poison" | "ground"
  | "flying" | "psychic" | "bug" | "rock" | "ghost" | "dragon" | "dark" | "steel" | "fairy";

export type ExperienceGroup = "fast" | "medium_fast" | "medium_slow" | "slow" | "erratic" | "fluctuating";

/** An evolution, in Cobblemon's format. `requirements` may be omitted. */
export interface Evolution {
  id?: string;
  /** `item_interact`, `level_up`, `trade`… as in the mod. */
  variant: string;
  /** Resulting species: `myaddon:species` or a Cobblemon Bedrock one (`raichu`). */
  result: string;
  requiredContext?: string;
  consumeHeldItem?: boolean;
  learnableMoves?: string[];
  requirements?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

/** A form of the species. Its `name` is its id: the aspect (`alolan`), lowercase and with `_`. */
export interface SpeciesForm {
  name: string;
  aspects?: string[];
  primaryType?: ElementalType;
  secondaryType?: ElementalType | null;
  baseStats?: Stats;
  abilities?: string[];
  evolutions?: Evolution[];
  /** The form's level-up moves, as in the mod: `"10:confusion"`. */
  moves?: string[];
  battleOnly?: boolean;
}

/** What it drops when defeated, in Cobblemon's format. */
export interface Drops {
  amount: number;
  entries: Array<{ item: string; percentage?: number; quantityRange?: string; rarity?: "common" | "rare" }>;
}

/** A species. Its `id` is also its entity's id: `myaddon:species`. */
export interface Species {
  id: string;
  name: string;
  nationalPokedexNumber: number;
  generation?: number;
  primaryType: ElementalType;
  secondaryType?: ElementalType | null;
  baseStats: Stats;
  evYield?: Stats;
  catchRate: number;
  baseExperienceYield: number;
  experienceGroup: ExperienceGroup;
  /** At least one. The hidden ability goes separately. */
  abilities: string[];
  hiddenAbility?: string | null;
  /** Male ratio (0–1), or `null` if genderless. */
  maleRatio?: number | null;
  eggGroups?: string[];
  preEvolution?: string | null;
  /** Only moves Cobblemon Bedrock's engine knows (or yours, from `moves`); others are skipped with a warning. */
  moves: {
    levelUp: Array<{ level: number; move: string }>;
    egg?: string[];
    tm?: string[];
    tutor?: string[];
  };
  evolutions?: Evolution[];
  forms?: SpeciesForm[];
  baseScale?: number;
  hitbox?: { width: number; height: number };
  height?: number | null;
  weight?: number | null;
  drops?: Drops;
  /** Battle animations: name → `[animation id, seconds, 1 if it loops]`. */
  battleClips?: Record<string, [string, number, number?]>;
  /** Model points for particles: name → list of `[x, y, z]` in model pixels. */
  locators?: Record<string, number[][]>;
  /** Riding: style (`LAND`, `AIR`, `LIQUID`) → stat → `[min, max]`, and each style's kind. */
  riding?: { stats: Record<string, Record<string, [number, number]>>; keys?: Record<string, string> };
  /** Shoulder: the clip for each side. */
  shoulder?: { left: string | null; right: string | null };
}

/**
 * A form you add to a Cobblemon Bedrock species, like Cobblemon's
 * `species_additions` and resolvers.
 *
 * - **A form the species already has** (`hisui_bias` on `cyndaquil`): only its
 *   look changes. Give it `entity`, and from then on that form uses your model
 *   everywhere: spawns, sending it out, evolving. Data fields are ignored.
 * - **A new form**: its data as in `SpeciesForm` (anything missing is taken
 *   from the species), plus `entity` if it has its own model.
 */
export interface AddedForm extends SpeciesForm {
  /** Your entity with this form's model: `myaddon:cyndaquil_hisui_bias`. */
  entity?: string;
  /** Lang key (in your resource pack) for the form's name, shown after the species name. */
  label?: string;
  /** Battle animations of your entity; the species' are used for any it doesn't have. */
  battleClips?: Record<string, [string, number, number?]>;
  /** Model points of your entity, for particles. */
  locators?: Record<string, number[][]>;
}

/** Forms (and looks) for a Cobblemon Bedrock species. */
export interface SpeciesAddition {
  /** The Cobblemon Bedrock species: `cyndaquil`. */
  target: string;
  forms: AddedForm[];
}

/** A spawn entry, using the mod's biome tags. */
export interface SpawnEntry {
  /**
   * One of your species, or a Cobblemon Bedrock one with a `form` you added.
   * In an entry with `zone`, any Cobblemon Bedrock species too.
   */
  species: string;
  /** A form of the same species, by its id (`alolan`). */
  form?: string;
  /**
   * Biome tag (`forest`, `beach`, `taiga`…). Optional in an entry with
   * `zone`: the zone already says where.
   */
  biome?: string;
  /**
   * Only inside these zones of yours (see `zones`): the Pokémon of a village.
   * Outside them the entry doesn't count. Needs Cobblemon Bedrock with API 2.
   */
  zone?: string | string[];
  biomeTag?: string;
  biomeAny?: string[];
  biomeAll?: string[];
  biomeNot?: string[];
  habitat?: "land" | "water" | "beach" | "riverbank" | "beach_water" | "seafloor";
  light?: "surface" | "cave" | "night" | "day";
  dimension?: "overworld" | "nether" | "end";
  weather?: "any" | "clear" | "rain";
  bucket?: "common" | "uncommon" | "rare" | "ultra-rare";
  entryWeight?: number;
  heightMin?: number;
  heightMax?: number;
  baseBlocks?: string[];
  nearbyBlocks?: string[];
}

export interface Spawns {
  entries: SpawnEntry[];
  /** Level range per species. */
  levels?: Record<string, { min: number; max: number }>;
}

/** A variant's UI textures: paths in the add-on's resource pack. */
export interface SpriteSet {
  pc?: string;
  face?: string;
  dex?: string;
  portrait?: string;
  size?: string;
  /** Party panel portrait: a character from U+F000 to U+F8FF in the add-on's glyph page. */
  glyph?: string;
}

/**
 * A mega evolution. The mega itself is a form you register in the species'
 * `forms` (usually with `battleOnly: true`): its types and base stats are used
 * in battle, and its entity (`myaddon:species_<form>`) is the model shown
 * after mega evolving.
 */
export interface MegaDefinition {
  /**
   * One of your species (`myaddon:species`), or a Cobblemon Bedrock one
   * (`pikachu`) whose mega form you added with `additions`.
   */
  species: string;
  /** The form id of the mega: `mega`, `mega_x`… */
  form: string;
  /** Held item ids that trigger it (your mega stone). */
  stones: string[];
  /** Ability while mega evolved. Defaults to the form's first ability. */
  ability?: string;
}

/** Stat changes with Showdown's keys, from -6 to 6: `{ atk: 1, spe: -1 }`. */
export type Boosts = Partial<Record<"atk" | "def" | "spa" | "spd" | "spe" | "accuracy" | "evasion", number>>;

/**
 * A new move, **based on one of Cobblemon Bedrock's**: it copies all of its
 * data (target, flags, secondary effects…) and its animation, and changes
 * what you set here.
 *
 * Some moves also have behavior written in code for their id (Sucker Punch's
 * condition, Counter…); that part isn't copied. Base yours on moves whose
 * effect is data: damage, secondary effects, stat changes, draining, recoil,
 * healing, multi-hit.
 */
export interface MoveDefinition {
  /** Yours: `myaddon:surf_shock`. */
  id: string;
  /** The Cobblemon Bedrock move it copies: `surf`. */
  basedOn: string;
  /** Shown if your RP has no `move.<id>` lang key (and `move.<id>.desc` for its description). */
  name: string;
  type?: ElementalType;
  category?: "physical" | "special" | "status";
  /** 0–250. */
  power?: number;
  /** 0–100. */
  accuracy?: number;
  /** 1–64. */
  pp?: number;
  /** -7 to 5. */
  priority?: number;
  /** A secondary effect a Cobblemon Bedrock move uses (`paralyze`, `burn`, `flinch`…), or `null` for none. */
  effect?: string | null;
  /** 0–100: the chance of `effect`. */
  effectChance?: number;
  /** 0–1: the share of damage dealt that heals the user. */
  drainFraction?: number;
  /** 0–1: the share of damage dealt the user takes as recoil. */
  recoilFraction?: number;
  /** 0–1: the share of max HP it heals (status moves). */
  healFraction?: number;
  /** Extra critical-hit stages, 0–4. */
  critRatio?: number;
  /** Stat changes to the target, or `null` for none. */
  boosts?: Boosts | null;
  /** Stat changes to the user, or `null` for none. */
  selfBoosts?: Boosts | null;
  /** Hits per use: a number, or `[min, max]` (1–10), or `null` for one. */
  multiHit?: number | [number, number] | null;
  /** Showdown flags the engine checks: `contact`, `sound`, `punch`, `bite`… */
  flags?: string[];
}

/** Everything an add-on registers. */
export interface AddonDefinition {
  /** The add-on's namespace: that of its entities and species. */
  addon: string;
  version?: string;
  /** New moves, based on Cobblemon Bedrock's. Your species (and any form) can learn them. */
  moves?: MoveDefinition[];
  species?: Species[];
  /** Forms and looks for Cobblemon Bedrock species. */
  additions?: SpeciesAddition[];
  spawn?: Spawns;
  /**
   * Keyed by `species|form|shiny`: `"myaddon:species||0"`, `"myaddon:species|alolan|1"`.
   * For a form you added to a Cobblemon Bedrock species: `"cyndaquil|hisui_bias|0"`.
   */
  sprites?: Record<string, SpriteSet>;
  /** New evolutions for species that aren't the add-on's: `{ "pikachu": [ … ] }`. */
  evolutions?: Record<string, Evolution[]>;
  /** Mega evolutions for your species, or for Cobblemon Bedrock ones with a mega form you added. */
  megas?: MegaDefinition[];
  /**
   * Item ids that work as a Key Stone (held in the offhand) for your megas.
   * Cobblemon Bedrock doesn't provide one, so your add-on must.
   */
  megaAccessories?: string[];
  /** Items used on a party Pokémon: you get `item_used` and apply the effect. */
  partyItems?: PartyItemDefinition[];
  /**
   * NPCs: trainers, merchants, nurses or people who just talk. Keyed by
   * `"myaddon:name"`. Put them in the world with `spawnNpc` or `npcMarker`.
   * Needs Cobblemon Bedrock with API 2.
   */
  npcs?: Record<string, NpcDefinition>;
  /**
   * Spawn zones: places in the world, like your villages, with their own
   * Pokémon (spawn entries with `zone`). Keyed by `"myaddon:name"`. Mark where
   * each one is with `markZone` or `zoneMarker`. Needs Cobblemon Bedrock with
   * API 2.
   */
  zones?: Record<string, ZoneDefinition>;
  /**
   * Buttons in Cobblemon Bedrock's screens (the party summary and the PC).
   * They show up behind an "Add-ons" button; picking one sends `ui_button`.
   */
  buttons?: UiButtonDefinition[];
  /** What to do with Cobblemon Bedrock's reply. By default, it goes to the content log. */
  onAck?: (ack: Ack) => void;
}

/**
 * An item used on a party Pokémon, like Cobblemon's potions or vitamins.
 * Cobblemon Bedrock picks the Pokémon the same way as with its own items
 * (the one you're looking at, or the party selector) and sends `item_used`.
 */
export interface PartyItemDefinition {
  /** One of your items: `myaddon:super_potion`. */
  id: string;
  /** Spend one when used. Default `true`; with `false`, remove it yourself if you want to. */
  consume?: boolean;
  /** Only these species. Others show greyed out in the selector. */
  species?: string[];
  /** `true`: only fainted Pokémon (revives). `false`: only those that aren't. */
  fainted?: boolean;
  /** Only Pokémon missing HP (potions). */
  hurt?: boolean;
}

/** A screen of Cobblemon Bedrock that can show your buttons. */
export type UiScreen = "summary" | "pc";

/**
 * A button of yours in Cobblemon Bedrock's screens. Those screens can't be
 * edited from another pack, so yours go in a list: an "Add-ons" button shows
 * up when at least one of them fits the Pokémon on screen, and opens it.
 */
export interface UiButtonDefinition {
  /** `myaddon:rename`. It comes back in `ui_button`. */
  id: string;
  /** Where it shows up: the party summary, the PC (with a Pokémon picked), or both. */
  screen: UiScreen | UiScreen[];
  /** A key in your add-on's `.lang`. */
  label: string;
  /** A texture in your resource pack: `textures/myaddon/ui/rename`. */
  icon?: string;
  /** Only for these species. */
  species?: string[];
}

// —— NPCs ——

/** What an NPC does when you talk to it. */
export type NpcRole = "trainer" | "merchant" | "nurse" | "talker";
/** A button in an NPC's dialogue window. */
export type NpcOption = "battle" | "shop" | "heal" | "close";

/** A Pokémon in an NPC's team. Unknown species, items or moves are left out with a warning. */
export interface NpcPokemon {
  /** `milotic` (Cobblemon Bedrock species) or `myaddon:species`. */
  species: string;
  /** 1–100. Without it, the NPC's `level` (or one that adapts to the player). */
  level?: number;
  heldItem?: string;
  /** Up to four. Without them, the ones it learns by level. */
  moves?: string[];
  ability?: string;
  shiny?: boolean;
}

/**
 * A shop category: one page (or more, 12 offers each) in the shop. Prices are
 * in Cobblemon Bedrock's money (the player's wallet). Up to 16 categories
 * and 64 offers per shop.
 */
export interface NpcShopCategory {
  /** A language key from your `.lang`, or plain text. */
  name: string;
  offers: NpcShopOffer[];
}

export interface NpcShopOffer {
  item: string;
  price: number;
  /**
   * Units per in-game day, for all players together. Without it, it never
   * runs out.
   */
  stock?: number;
}

/**
 * Everything an NPC says. Every line is a **language key** from your add-on's
 * `.lang`; one is picked at random. Use `%s` in the text for the player's name.
 */
export interface NpcDialogue {
  /** When the player talks to it. With `greeting` or `options`, a window opens. */
  greeting?: string[];
  /** The window's buttons. Default: the one for its role, and "Goodbye". */
  options?: NpcOption[];
  /** Before a battle. */
  challenge?: string[];
  /** When the player wins. */
  victory?: string[];
  /** When the player loses. */
  defeat?: string[];
  /** When asked to battle again too soon. */
  cooldown?: string[];
  /** If the player has hit it recently: it won't talk. */
  hurt?: string[];
}

export interface NpcDefinition {
  /** Shown above its head and in messages. Plain text (a name doesn't get translated). */
  name: string;
  /** Default `"trainer"`. */
  role?: NpcRole;
  /**
   * A Cobblemon Bedrock trainer skin, by file name: `nurse-joy`, `shop_keeper`,
   * `shop_keeper_2`, `ace_trainer_abel_04a5`… Unknown: one for its role.
   */
  skin?: string;
  /** Only for `role: "trainer"`. Up to six. */
  team?: NpcPokemon[];
  /** Level for the whole team (each Pokémon's own `level` wins). Without any, it adapts to the player. */
  level?: number;
  /** How well it plays, 0 to 1. Without it, the one for its `battle.kind`. */
  skill?: number;
  battle?: {
    format?: "singles" | "doubles";
    /** `"request"` (default): talk to it to battle. `"sight"`: it challenges you when it sees you. */
    start?: "request" | "sight";
    /** `false`: once beaten, it never battles that player again. */
    rematch?: boolean;
    /** Seconds before a rematch. Default: five minutes. */
    cooldown?: number;
    /** Money it pays when beaten. Default: by its level and kind. */
    reward?: number | null;
    kind?: "standard" | "gym_leader" | "elite_four" | "champion";
    /** Items it can use in battle (up to three). */
    items?: string[];
  };
  /** Only for `role: "merchant"`. */
  shop?: NpcShopCategory[];
  dialogue?: NpcDialogue;
  /** Default `"still"`. */
  movement?: "still" | "free";
}

export interface SpawnNpcRequest {
  /** One of your NPCs: `"myaddon:nurse"`. */
  npc: string;
  /** Where. It looks up to two blocks higher for room to stand. */
  at: Place;
  /** Which way it faces, in degrees. */
  yaw?: number;
  /** Follows the NPC: it comes back in `battle_start`/`battle_end` as `npcTag`. */
  tag?: string;
}

/** Options for `npcMarker`. */
export interface NpcMarkerOptions {
  /** The block state with the NPC number. Default `"<addon>:npc"`. */
  state?: string;
  /**
   * A second state for more than 16 NPCs: the number is `group * 16 + npc`.
   * A Bedrock state holds 16 values at most.
   */
  groupState?: string;
  /** The `tag` for every NPC this marker spawns. */
  tag?: string;
}

/** Options for `pokemonMarker`. */
export interface PokemonMarkerOptions {
  /** The block state with the Pokémon number. Default `"<addon>:pokemon"`. */
  state?: string;
  /** A second state for more than 16 Pokémon, as in `npcMarker`. */
  groupState?: string;
}

/**
 * A spawn zone. Cobblemon Bedrock's spawner adds the zone's entries to the
 * spawn attempts that fall within `radius` of a marked center, the way a
 * Habitat block does in natural mode. A Habitat block that replaces spawns
 * still wins: the player placed it.
 */
export interface ZoneDefinition {
  /** Blocks from the center, sideways and up or down. 4 to 128, default 48. */
  radius?: number;
  /** Inside, only the zone's entries spawn (no world spawns). Default `false`. */
  replaceSpawns?: boolean;
}

/** Options for `zoneMarker`. */
export interface ZoneMarkerOptions {
  /** The block state with the zone number. Default `"<addon>:zone"`. */
  state?: string;
  /** A second state for more than 16 zones, as in `npcMarker`. */
  groupState?: string;
}

/** Cobblemon Bedrock's reply to a registration. */
export interface Ack {
  addon: string;
  api: number;
  ok: boolean;
  errors: string[];
  warnings: string[];
}

// —— Events ——

export interface PlayerRef {
  id: string;
  name: string;
}

/** A Pokémon in events: a summary, not the saved record. */
export interface PokemonSummary {
  uuid: string;
  species: string;
  form: string | null;
  level: number;
  shiny: boolean;
  gender: string | null;
  nickname: string | null;
  ball: string | null;
  /** The tag an add-on gave it with `spawn` or `give`, or `null`. */
  tag: string | null;
}

export type BattleKind = "wild" | "trainer" | "raid" | "pvp";

interface BattleInfo {
  api: number;
  kind: BattleKind;
  players: PlayerRef[];
  opponent?: PokemonSummary;
  raidTier?: number;
  trainerName?: string | null;
  /** Against one of your NPCs (or another add-on's): its id and `tag`. */
  npc?: string;
  npcTag?: string | null;
}

export interface CobblemonEvents {
  captured: { api: number; player: PlayerRef; pokemon: PokemonSummary; ball: string | null; source: "wild" | "battle" | "raid"; destination: "party" | "pc" };
  battle_start: BattleInfo;
  battle_end: BattleInfo & { result: "win" | "loss" | "run" | "catch" | "aborted" | "ongoing" };
  level_up: { api: number; player: PlayerRef; from: number; pokemon: PokemonSummary };
  evolved: { api: number; player: PlayerRef; from: string; pokemon: PokemonSummary };
  released: { api: number; player: PlayerRef; pokemon: PokemonSummary; from: "pc" | "party" };
  starter_chosen: { api: number; player: PlayerRef; pokemon: PokemonSummary };
  pokedex_registered: { api: number; player: PlayerRef; species: string; status: "seen" | "caught" };
  /**
   * One of your `partyItems` was used on a party Pokémon. Cobblemon Bedrock
   * already picked the Pokémon (and spent the item, unless `consume: false`):
   * apply the effect with `updatePokemon`.
   */
  item_used: { api: number; player: PlayerRef; item: string; slot: number; pokemon: PartyPokemon };
  /**
   * Something was bought in a merchant's shop. `npc` is your NPC's id, or
   * `null` for Cobblemon Bedrock's own merchants. `wallet` is what the
   * player has left.
   */
  /**
   * One of your `buttons` was picked. The screen is already closed. In the PC
   * the Pokémon may be in a box: `updatePokemon` only works on the party.
   */
  /**
   * API 3. A wild Pokémon was spawned by one of Cobblemon Bedrock's spawners.
   * `player` is the player it spawned around (world spawner) or the one
   * fishing, and `null` for a Poké Snack. Sent two ticks after it appears, once
   * its level and form are set.
   */
  wild_spawned: { api: number; player: PlayerRef | null; pokemon: WildPokemon };
  /**
   * API 3. A player came across a wild Pokémon: a battle with it started, a
   * Poké Ball was thrown at it outside battle, or the Pokédex scanner
   * registered it. Sent **every time**, not only the first (that is
   * `pokedex_registered`): `pokemon.entryId` tells which spawn entry it was.
   */
  pokemon_encountered: { api: number; player: PlayerRef; via: EncounterVia; pokemon: WildPokemon };
  /**
   * API 3. A player's fishing: `cast`, `approach` (a Pokémon or item starts
   * swimming to the bobber; Cobblenav closes its Fishingnav here), `bite`
   * (`pokemon` says which it is) and `end` (`outcome`: `pokemon`, `item`,
   * `nothing`, `escaped` or `cancelled`; `item` with an item).
   */
  fishing: {
    api: number;
    player: PlayerRef;
    stage: "cast" | "approach" | "bite" | "end";
    rod: string | null;
    location?: { x: number; y: number; z: number };
    pokemon?: boolean;
    outcome?: "pokemon" | "item" | "nothing" | "escaped" | "cancelled";
    item?: string;
  };
  ui_button: {
    api: number;
    player: PlayerRef;
    addon: string;
    button: string;
    screen: UiScreen;
    place: { kind: "party"; slot: number } | { kind: "pc"; box: number; slot: number };
    pokemon: PartyPokemon;
  };
  npc_purchase: {
    api: number;
    player: PlayerRef;
    npc: string | null;
    npcTag: string | null;
    merchant: string;
    item: string;
    price: number;
    category: string | null;
    wallet: number;
  };
}

/** A party Pokémon, with what you need to decide an item's effect. */
export interface PartyPokemon extends PokemonSummary {
  hp: number;
  maxHp: number;
  /** Status condition (`poison`, `paralysis`…), or `null`. */
  status: string | null;
}

// —— Actions and queries ——

/** A player: their id, their name, or the `Player` object itself. */
export type PlayerLike = string | { id: string };

/** A point in the world. `dimension` defaults to the overworld. */
export interface Place {
  dimension?: "overworld" | "nether" | "the_end";
  x: number;
  y: number;
  z: number;
}

/**
 * A Pokémon to spawn or give. Only `species` is required: anything left out
 * is decided as usual (random IVs and nature, level-up moves, a level from the
 * species' spawn rules).
 */
export interface PokemonRequest {
  /** `articuno` (Cobblemon Bedrock species) or `myaddon:species`. */
  species: string;
  /** A form id (its aspect): `alolan`, `galarian`… */
  form?: string;
  /** 1–100. */
  level?: number;
  shiny?: boolean;
  alpha?: boolean;
  gender?: "male" | "female" | "genderless";
  nature?: string;
  /** Each 0–31. Stats left out keep their random roll. */
  ivs?: Partial<Stats>;
  /** Each 0–252, 510 in total. */
  evs?: Partial<Stats>;
  ability?: string;
  /** 1 to 4 move ids (Showdown ids, as in the mod). */
  moves?: string[];
  heldItem?: string;
  /** 0–255. */
  friendship?: number;
  nickname?: string;
  /** Up to 64 characters. It travels with the Pokémon and shows up in every event about it. */
  tag?: string;
}

/**
 * Changes for `updatePokemon`. All optional; HP is **not** refilled by the
 * other fields (raising an EV doesn't heal).
 */
export interface PokemonUpdate {
  /** HP to restore, or `"full"`. Also revives a fainted Pokémon. */
  heal?: number | "full";
  /** Removes its status condition. */
  cure?: boolean;
  /** Levels to gain, like a Rare Candy: new moves and evolution included. */
  levels?: number;
  nature?: string;
  /** Each 0–31. Stats left out don't change. */
  ivs?: Partial<Stats>;
  /** Each 0–252, 510 in total. Stats left out don't change. */
  evs?: Partial<Stats>;
  ability?: string;
  /** 1 to 4 move ids: they replace its moves. */
  moves?: string[];
  heldItem?: string;
  /** 0–255. */
  friendship?: number;
  nickname?: string;
  tag?: string;
}

export interface SpawnRequest {
  /** `catchable: false` makes it impossible to catch (an event boss). */
  pokemon: PokemonRequest & { catchable?: boolean };
  /** Where: an exact point… */
  at?: Place;
  /** …or two blocks next to a player. */
  nearPlayer?: PlayerLike;
  /** Start a battle with this player as soon as it spawns. */
  battle?: PlayerLike;
}

export interface SpawnResult {
  /** The entity id, for `startBattle` or to find it later. */
  entityId: string;
  /** Whether the battle requested with `battle` started. */
  battle: boolean;
}

export interface GiveRequest {
  player: PlayerLike;
  /** `ball`: the Poké Ball it was "caught" in (`cooblemon:ultra_ball`…). */
  pokemon: PokemonRequest & { ball?: string };
  /** `party` (default; the PC if the party is full) or `pc`. */
  destination?: "party" | "pc";
}

export interface GiveResult {
  destination: "party" | "pc";
  pokemon: PokemonSummary;
}

export interface NearbyRequest {
  /** Around a player… */
  player?: PlayerLike;
  /** …or around a point. */
  at?: Place;
  /** Blocks, 1–128 (1–64 before API 3). Default 16. */
  radius?: number;
}

/** Which of Cobblemon Bedrock's spawners put a wild Pokémon in the world. */
export type WildSpawnSource = "world" | "snack" | "fishing";

/** A wild Pokémon in the world, as `nearby` and `wild_spawned` report it. */
export interface WildPokemon {
  entityId: string;
  species: string;
  form: string | null;
  level: number;
  shiny: boolean;
  alpha: boolean;
  tag: string | null;
  /**
   * API 3. Which spawner put it there, or `null` if none did: spawned by an
   * add-on with `spawn`, a raid boss, or one from before Cobblemon Bedrock 1.8.14.
   */
  source: WildSpawnSource | null;
  /**
   * API 3. The spawn entry it came from (`bulbasaur-1`, as in `spawnTable`),
   * or `null` when no spawner of Cobblemon Bedrock put it there (see `source`).
   * Fishing entries have ids too (`fishingTable`).
   */
  entryId: string | null;
  /** API 3. Its rarity bucket (`common`, `uncommon`…), or `null`. */
  bucket: string | null;
  dimension: "overworld" | "nether" | "the_end";
  location: { x: number; y: number; z: number };
}

export interface NearbyPokemon extends WildPokemon {
  distance: number;
}

/**
 * Where to look for spawns: around a player, at a point, or what a Poké Snack
 * placed in the world attracts. `bucket` narrows the list to one rarity, which
 * keeps the answer small (a whole biome can have dozens of entries).
 */
export type SpawnTableRequest =
  | ({ player: PlayerLike; area?: boolean | { positions?: number } } & { bucket?: string })
  | (({ at: Place } | { snack: Place }) & { bucket?: string });

/** One thing that can spawn, as Cobblemon Bedrock's spawner sees it. */
export interface SpawnTableEntry {
  /**
   * Stable id of the entry (`bulbasaur-1`), the same in every world and
   * version. Several entries can share a species. `wild_spawned` and `nearby`
   * report it, so you can tell which entries a player has seen.
   */
  id: string;
  species: string;
  form: string | null;
  bucket: string;
  /** Its weight in the draw of its bucket, with the multipliers that apply there and then. */
  weight: number;
  /** The entry's weight without multipliers. */
  baseWeight: number;
  /** Chance within its bucket, 0–1. Multiply by the bucket's chance for the overall one. */
  chance: number;
  levels: { min: number; max: number } | null;
  /** The leader of an alpha herd. */
  alpha: boolean;
  /** Conditions as Cobblemon Bedrock stores them (converted from Cobblemon's). */
  conditions: {
    biome: string;
    light: "surface" | "cave" | "day" | "night";
    dimension: "overworld" | "nether" | "end";
    habitat: string;
    weather: "any" | "clear" | "rain";
    minY?: number;
    maxY?: number;
    baseBlocks?: string[];
    nearbyBlocks?: string[];
    zones?: string[];
    /** Moon phases it needs (0 = full moon … 4 = new moon), as in Cobblemon. */
    moonPhases?: number[];
    /** A finer time range than `light`: `dusk`, `twilight`, `dawn`… (Cobblemon's `TimeRange`). */
    timeRange?: string;
    /** Only during a thunderstorm. */
    thunder?: boolean;
    /** Only from a Poké Snack (`true`), or never from one (`false`). */
    pokeSnack?: boolean;
    /** Only in slime chunks (Bedrock's, which is where this game's slimes spawn). */
    slimeChunk?: boolean;
    /** Coordinate limits (Shellos' east sea form needs `minX: 0`). */
    coords?: { minX?: number; maxX?: number; minZ?: number; maxZ?: number };
  };
  /**
   * Cobblemon's weight multipliers: when everything in `when` holds, the weight
   * is multiplied by `multiplier`; several stack. `weight` already has the
   * ones that apply where you asked.
   */
  weightMultipliers?: Array<{
    multiplier: number;
    when: {
      time?: string;
      rain?: boolean;
      thunder?: boolean;
      moon?: number[];
      minLight?: number;
      biomes?: string[];
      snack?: boolean;
      nearby?: string[];
    };
  }>;
  /**
   * With `area`: in how many of the sampled places it can spawn. `weight` is
   * then the highest it had in any of them (Cobblemon's `highestWeight`).
   */
  positions?: number;
  /**
   * Where it falls: the place it can spawn (with `area`, the first sampled
   * place where it fits). Enough to pick a platform the way Cobblenav does.
   */
  place: SpawnPlace;
}

/** The place a spawn entry falls in. See `SpawnTableEntry.place`. */
export interface SpawnPlace {
  /** Bedrock biome id (`minecraft:savanna`), or `null` if unknown. */
  biome: string | null;
  /** Cobblemon's biome tags for that biome (`cobblemon:is_arid`, `cobblemon:is_overworld`…). */
  biomeTags: string[];
  /** Cobblemon's spawnable position type: `grounded`, `submerged`, `surface` or `seafloor`. */
  positionType: string;
  /** Fluid the entry needs (`water`, `lava`), or `null`. */
  fluid: string | null;
}

export interface SpawnTableResult {
  at: { dimension: string; x: number; y: number; z: number };
  biome: string | null;
  isDay: boolean;
  /**
   * The chance of each bucket being drawn (0–1). Cobblemon draws the bucket
   * first, then an entry within it: a bucket can have a chance and no entries
   * here, and then that attempt spawns nothing.
   */
  buckets: Array<{ bucket: string; chance: number }>;
  /** Sorted from most to least likely. */
  entries: SpawnTableEntry[];
  /**
   * With `area`: how many places were sampled around the player and their
   * biomes. Chances are then the average over those places, which is what the
   * spawner does when it picks places at random.
   */
  area?: { positions: number; biomes: string[] };
}

/**
 * One spawn entry with Cobblemon's own conditions, merged with its presets as
 * Cobblemon does. This is what Cobblenav's detail view shows. Field names and
 * values are Cobblemon's (Java ids and tags); `blocks` in the result
 * translates the block ones to Bedrock.
 */
export interface SpawnDetail {
  id: string;
  /** Cobblemon's Pokémon properties (`vulpix region_bias=alola`). */
  pokemon: string;
  /** `grounded`, `submerged`, `surface`, `seafloor` or `fishing`. */
  positionType: string;
  bucket: string;
  weight: number;
  percentage?: number;
  /** As Cobblemon writes it: `"5-30"`. */
  level?: string;
  presets?: string[];
  /**
   * Cobblemon's conditions: `biomes`, `minSkyLight`/`maxSkyLight`,
   * `minLight`/`maxLight`, `canSeeSky`, `minY`/`maxY`, `minX`…`maxZ`,
   * `timeRange`, `isRaining`, `isThundering`, `moonPhase`, `isSlimeChunk`,
   * `structures`, `neededBaseBlocks`, `neededNearbyBlocks`, `fluid`,
   * `isPokeSnack`, `minLureLevel`…
   */
  conditions: Array<Record<string, unknown>>;
  /** Conditions that must **not** hold. */
  anticonditions?: Array<Record<string, unknown>>;
  /** Cobblemon's raw weight multipliers (`spawnTable` gives them converted). */
  weightMultipliers?: Array<Record<string, unknown>>;
  /** Cobblemon's drop table, when the entry has its own. */
  drops?: unknown;
}

export interface SpawnDetailResult {
  details: SpawnDetail[];
  /** Each block or block tag the details mention, as Bedrock block ids. */
  blocks: Record<string, string[]>;
  /**
   * Icon and name of every Bedrock block id in `blocks`, to draw them as
   * Cobblenav does. Same as `itemInfo` gives.
   */
  blockInfo: Record<string, { icon: string | null; nameKey: string }>;
  /**
   * The ones in `blocks` that are incomplete: they include Java vanilla tags
   * (`#minecraft:dirt`) or blocks that don't exist in Bedrock. Cobblemon's
   * `#cobblemon:natural` (any natural ground) is one; Cobblenav hides it by
   * default.
   */
  partialBlocks: string[];
  /** Ids with no detail (entries Cobblemon Bedrock added by hand). */
  unknown: string[];
}

/** How a player came across a wild Pokémon. */
export type EncounterVia = "battle" | "capture" | "scan";

/**
 * Where a player's fishing is: not fishing, waiting for a bite, a Pokémon
 * swimming to the bobber (`approach`, Cobblemon's fish travel), or bitten.
 */
export type FishingStage = "idle" | "waiting" | "approach" | "bitten";

/** One thing that can bite, as Cobblemon Bedrock's fishing draws it. */
export interface FishingTableEntry {
  /** Stable id of the entry (`magikarp-1`), as in `spawnTable` and `spawnDetail`. */
  id: string;
  species: string;
  form: string | null;
  /** Magikarp Jump pattern (`skelly`, `calico-orange-white`…), or `null`. */
  magikarpJump: string | null;
  bucket: string;
  /** Its weight with every multiplier: lure, time, biome, the bait's bias. */
  weight: number;
  baseWeight: number;
  /** Chance within its bucket, 0–1. */
  chance: number;
  levels: { min: number; max: number } | null;
  conditions: {
    biome: string;
    light: "surface" | "cave" | "day" | "night";
    dimension: "overworld" | "nether" | "end";
    weather: "any" | "clear" | "rain";
    minLureLevel?: number;
    maxLureLevel?: number;
    /** It stops biting from this Lure level up. */
    belowLureLevel?: number;
    /** Only in slime chunks (`true`) or only outside them (`false`). */
    slimeChunk?: boolean;
    /** Only with this rod (`cooblemon:love_rod`). */
    rod?: string;
    /** Only with this bait on the rod. */
    bait?: string;
  };
  lureMultipliers?: Array<{ multiplier: number; minLureLevel: number; maxLureLevel?: number }>;
  weightMultipliers?: SpawnTableEntry["weightMultipliers"];
}

export interface FishingTableResult {
  stage: FishingStage;
  /**
   * The rod: the cast one while fishing, otherwise the one in hand or the first
   * in the inventory. `null` without one (the table then assumes no rod).
   */
  rod: {
    id: string;
    ball: string | null;
    lineColor: string | null;
    /** Texture path of the rod, and its lang key. */
    icon: string | null;
    nameKey: string;
    /** Texture path and lang key of its Poké Ball, as Fishingnav draws it. */
    ballIcon: string | null;
    ballNameKey: string | null;
  } | null;
  bait: { item: string; count: number; seasonings: string[]; icon: string | null; nameKey: string } | null;
  lureLevel: number;
  luckLevel: number;
  /**
   * Chance that a bite is a Pokémon rather than an item (0–1). The overall
   * chance of an entry is `pokemonChance × bucket chance × entry chance`.
   */
  pokemonChance: number;
  /** The bobber while fishing; otherwise the water the player looks at, or where they stand. */
  at: { dimension: string; x: number; y: number; z: number };
  biome: string | null;
  /** Already tilted by the bait and Luck of the Sea, among the buckets present here. */
  buckets: Array<{ bucket: string; chance: number }>;
  entries: FishingTableEntry[];
}

/** How to draw and name an item or block (`itemInfo`). */
export interface ItemInfo {
  id: string;
  /** `item` when it exists as an item, `block` when it's only a block. */
  kind: "item" | "block";
  /** Lang key of its name (`item.cooblemon:poke_ball`, `tile.farmland.name`): use it with `translate`. */
  nameKey: string;
  /**
   * Texture path to draw it (`textures/items/poke_ball`), usable as-is in
   * your UI. Blocks without a flat item drawing give one face of the block;
   * grass, leaves and water are stored grey and tinted by the game.
   */
  icon: string | null;
}

/**
 * What you show on the HUD through `hud`. Cobblemon Bedrock adds it to its own
 * HUD title, so your resource pack reads it the way its party panel does.
 */
export interface HudContent {
  /**
   * Names (a-z, 0-9, `_ . -`, up to 32 characters; up to 64 of them). Each
   * one is in the HUD title as `|<addon>:<name>|`: your JSON UI shows a
   * control when the title contains it.
   */
  marks?: string[];
  /**
   * Up to 12 lines of text (strings or raw text with `translate`). They are in
   * the HUD subtitle from row `firstRow` (24) on: show the subtitle shifted
   * inside a clipping panel so only your line is seen.
   */
  lines?: Array<string | RawMessage>;
}

/** Texture paths you can use as-is in your UI: resource pack textures are shared. */
export interface SpriteInfo {
  species: string;
  form: string | null;
  shiny: boolean;
  /** The PC sprite, or `null` if there is none. */
  sprite: string | null;
  /** The small face icon, or `null`. */
  face: string | null;
}

export interface PokedexResult {
  seen: number;
  caught: number;
  total: number;
  entries: Array<{
    species: string;
    status: "seen" | "caught";
    /**
     * API 3. Per form, like Cobblemon's Pokédex (`null` is the base form):
     * whether it was caught, and which genders and shiny states were seen.
     * Empty when only the species is known (registered before 1.8.14 or by
     * species name).
     */
    forms: Array<{
      form: string | null;
      status: "seen" | "caught";
      genders: Array<"male" | "female" | "genderless">;
      shinies: Array<"normal" | "shiny">;
    }>;
  }>;
}

export interface SpeciesInfo {
  id: string;
  name: string;
  nationalPokedexNumber: number;
  primaryType: ElementalType;
  secondaryType: ElementalType | null;
  baseStats: Stats;
  abilities: string[];
  hiddenAbility: string | null;
  catchRate: number;
  /** API 3. Cobblemon's labels (`gen1`, `starter`, `legendary`…). */
  labels: string[];
  /** API 3. The EVs it gives when defeated. */
  evYield: Stats | null;
  forms: string[];
  /** The add-on that registered it, or `null` for Cobblemon Bedrock's own. */
  addon: string | null;
  entity: string;
}

/**
 * What `registerAddon` returns: ask Cobblemon Bedrock to do or tell you things.
 * Every call returns a promise that resolves a tick later at the earliest, and
 * rejects with the reason if the request is invalid.
 */
export interface CobblemonClient {
  spawn(request: SpawnRequest): Promise<SpawnResult>;
  give(request: GiveRequest): Promise<GiveResult>;
  /** A battle against a wild Pokémon already in the world. */
  startBattle(player: PlayerLike, entityId: string): Promise<{ battle: boolean }>;
  /** Heals the player's whole party, like a healing machine. */
  heal(player: PlayerLike): Promise<void>;
  /**
   * Changes a Pokémon in a player's party (not in battle). Use it to apply
   * an item's effect from `item_used`, or as a reward.
   */
  updatePokemon(player: PlayerLike, uuid: string, changes: PokemonUpdate): Promise<{ pokemon: PartyPokemon; evolved: boolean }>;
  party(player: PlayerLike): Promise<{ pokemon: PokemonSummary[] }>;
  /** The species the player has seen or caught; `species` narrows the list. */
  pokedex(player: PlayerLike, species?: string[]): Promise<PokedexResult>;
  nearby(request: NearbyRequest): Promise<{ pokemon: NearbyPokemon[] }>;
  species(id: string): Promise<SpeciesInfo>;
  /**
   * API 3. What can spawn somewhere and how likely it is, worked out the same
   * way Cobblemon Bedrock's spawner draws. Looks at one spot, not an area:
   * ask for several points if you want one.
   */
  spawnTable(request: SpawnTableRequest): Promise<SpawnTableResult>;
  /** API 3. Cobblemon's own conditions for 1–32 spawn entries (ids from `spawnTable` or `fishingTable`). */
  spawnDetail(ids: string[]): Promise<SpawnDetailResult>;
  /** API 3. What can bite on a player's rod and how likely it is. */
  fishingTable(player: PlayerLike, bucket?: string): Promise<FishingTableResult>;
  /** API 3. Sprite texture paths for 1–64 Pokémon. */
  sprites(pokemon: Array<{ species: string; form?: string; shiny?: boolean }>): Promise<{ sprites: SpriteInfo[] }>;
  /**
   * API 3. Every spawn entry id (world and fishing, as Cobblemon's world
   * spawn pool), or only a species' ones: what Cobblenav's `catalogue grant
   * all` and `grant species` use. The same ids as `spawnTable`,
   * `fishingTable` and `wild_spawned`. A few requests under the hood.
   */
  spawnEntries(species?: string): Promise<{ ids: string[] }>;
  /** API 3. Icon texture path and lang key for 1–64 item or block ids. */
  itemInfo(ids: string[]): Promise<{ items: ItemInfo[] }>;
  /**
   * API 3. Your part of a player's HUD: marks and lines that Cobblemon
   * Bedrock adds to the title it already sends. `null` takes it away. It
   * stays until you change it or the player leaves; it isn't shown while
   * the player scans with the Pokédex.
   */
  hud(player: PlayerLike, content: HudContent | null): Promise<{ firstRow: number }>;
  /** Puts one of your NPCs in the world. Needs Cobblemon Bedrock with API 2. */
  spawnNpc(request: SpawnNpcRequest): Promise<{ entityId: string }>;
  /** Removes one of your NPCs. */
  despawnNpc(entityId: string): Promise<void>;
  /**
   * Makes a block of yours a placeholder for NPCs: when it loads in the world
   * it turns into air and spawns the NPC its state says. Put it in your
   * structures where the NPC should stand.
   *
   * Call it when your script loads (like `registerAddon`), not later: block
   * components can only be registered on startup. The block needs
   * `"minecraft:custom_components": ["<blockId>"]`, a `minecraft:tick`
   * component and the state (`"<addon>:npc"`, 0–15).
   */
  npcMarker(blockId: string, npcs: Record<number, string>, options?: NpcMarkerOptions): void;
  /**
   * The same for Pokémon that stand in your structures (a Chansey in a
   * Pokémon Center): when the block loads, it turns into air and the Pokémon
   * its state says is spawned there. The block needs the component, a tick
   * and the state (`"<addon>:pokemon"`, 0–15).
   */
  pokemonMarker(blockId: string, pokemon: Record<number, SpawnRequest["pokemon"]>, options?: PokemonMarkerOptions): void;
  /**
   * Marks the center of one of your zones. The world keeps it, so the zone
   * works without any block left there. Marking the same zone again within
   * 8 blocks does nothing (`added: false`).
   */
  markZone(zone: string, at: Place): Promise<{ added: boolean }>;
  /**
   * A placeholder block that marks zones: when it loads, it turns into air and
   * marks the zone (or zones) its state says, centered on the block. Put it
   * in the middle piece of your village. The block needs the component, a
   * tick and the state (`"<addon>:zone"`, 0–15).
   */
  zoneMarker(blockId: string, zones: Record<number, string | string[]>, options?: ZoneMarkerOptions): void;
}
