/**
 * Public types of the Cobblemon Bedrock API: what an add-on sends and what it
 * receives. They are the contract described in `docs/REFERENCE.md`; changing
 * them incompatibly bumps the API's major version.
 */

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
  /** One of your species, or a Cobblemon Bedrock one with a `form` you added. */
  species: string;
  /** A form of the same species, by its id (`alolan`). */
  form?: string;
  /** Biome tag (`forest`, `beach`, `taiga`…). */
  biome: string;
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
  /** Blocks, 1–64. Default 16. */
  radius?: number;
}

export interface NearbyPokemon {
  entityId: string;
  species: string;
  form: string | null;
  level: number;
  shiny: boolean;
  alpha: boolean;
  tag: string | null;
  location: { x: number; y: number; z: number };
  distance: number;
}

export interface PokedexResult {
  seen: number;
  caught: number;
  total: number;
  entries: Array<{ species: string; status: "seen" | "caught" }>;
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
}
