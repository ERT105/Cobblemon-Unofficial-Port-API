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
  /** Only moves Cobblemon Bedrock's engine knows; others are skipped with a warning. */
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

/** A spawn entry, using the mod's biome tags. */
export interface SpawnEntry {
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

/** Everything an add-on registers. */
export interface AddonDefinition {
  /** The add-on's namespace: that of its entities and species. */
  addon: string;
  version?: string;
  species?: Species[];
  spawn?: Spawns;
  /** Keyed by `species|form|shiny`: `"myaddon:species||0"`, `"myaddon:species|alolan|1"`. */
  sprites?: Record<string, SpriteSet>;
  /** New evolutions for species that aren't the add-on's: `{ "pikachu": [ … ] }`. */
  evolutions?: Record<string, Evolution[]>;
  /** What to do with Cobblemon Bedrock's reply. By default, it goes to the content log. */
  onAck?: (ack: Ack) => void;
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
  party(player: PlayerLike): Promise<{ pokemon: PokemonSummary[] }>;
  /** The species the player has seen or caught; `species` narrows the list. */
  pokedex(player: PlayerLike, species?: string[]): Promise<PokedexResult>;
  nearby(request: NearbyRequest): Promise<{ pokemon: NearbyPokemon[] }>;
  species(id: string): Promise<SpeciesInfo>;
}
