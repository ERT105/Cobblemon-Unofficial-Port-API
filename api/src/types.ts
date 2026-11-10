/**
 * Los tipos públicos de la API de Cobblemon Bedrock: lo que un add-on envía y lo que
 * recibe. Son el contrato de `docs/REFERENCIA.md`; cambiarlos
 * de forma incompatible sube la versión mayor de la API.
 */

/** Las seis estadísticas, con los nombres del port (`defence`, no `defense`). */
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

/** Una evolución, en el formato de Cobblemon. `requirements` puede faltar. */
export interface Evolution {
  id?: string;
  /** `item_interact`, `level_up`, `trade`… como en el mod. */
  variant: string;
  /** Especie resultante: `miaddon:especie` o una de la base (`raichu`). */
  result: string;
  requiredContext?: string;
  consumeHeldItem?: boolean;
  learnableMoves?: string[];
  requirements?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

/** Una forma de la especie. Su `name` es su id: el aspecto (`alolan`), en minúsculas y con `_`. */
export interface SpeciesForm {
  name: string;
  aspects?: string[];
  primaryType?: ElementalType;
  secondaryType?: ElementalType | null;
  baseStats?: Stats;
  abilities?: string[];
  evolutions?: Evolution[];
  /** Movimientos por nivel de la forma, como en el mod: `"10:confusion"`. */
  moves?: string[];
  battleOnly?: boolean;
}

/** El botín al derrotarla, en el formato de Cobblemon. */
export interface Drops {
  amount: number;
  entries: Array<{ item: string; percentage?: number; quantityRange?: string; rarity?: "common" | "rare" }>;
}

/** Una especie (§5.4). Su `id` es también el de su entidad: `miaddon:especie`. */
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
  /** Al menos una. La oculta va aparte. */
  abilities: string[];
  hiddenAbility?: string | null;
  /** Proporción de machos (0–1), o `null` si no tiene sexo. */
  maleRatio?: number | null;
  eggGroups?: string[];
  preEvolution?: string | null;
  /** Solo movimientos que el motor de Cobblemon Bedrock conoce; los demás se omiten con aviso. */
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
  /** Animaciones de combate: nombre → `[id de animación, segundos, 1 si va en bucle]`. */
  battleClips?: Record<string, [string, number, number?]>;
  /** Puntos del modelo para las partículas: nombre → lista de `[x, y, z]` en píxeles de modelo. */
  locators?: Record<string, number[][]>;
  /** Monta: estilo (`LAND`, `AIR`, `LIQUID`) → estadística → `[mín, máx]`, y el tipo de cada estilo. */
  riding?: { stats: Record<string, Record<string, [number, number]>>; keys?: Record<string, string> };
  /** Hombro: el clip de cada lado. */
  shoulder?: { left: string | null; right: string | null };
}

/** Una entrada de aparición (§5.4), con las etiquetas de bioma del mod. */
export interface SpawnEntry {
  species: string;
  /** Una forma de la propia especie, por su id (`alolan`). */
  form?: string;
  /** Etiqueta de bioma (`forest`, `beach`, `taiga`…). */
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
  /** Rango de niveles por especie. */
  levels?: Record<string, { min: number; max: number }>;
}

/** Las texturas de UI de una variante (§6.3), rutas del resource pack del add-on. */
export interface SpriteSet {
  pc?: string;
  face?: string;
  dex?: string;
  portrait?: string;
  size?: string;
  /** Retrato del panel del equipo: un carácter de U+F000 a U+F8FF de la página de glifos del add-on. */
  glyph?: string;
}

/** Todo lo que registra un add-on. */
export interface AddonDefinition {
  /** El espacio de nombres del add-on: el de sus entidades y especies. */
  addon: string;
  version?: string;
  species?: Species[];
  spawn?: Spawns;
  /** Por `especie|forma|shiny`: `"miaddon:especie||0"`, `"miaddon:especie|alolan|1"`. */
  sprites?: Record<string, SpriteSet>;
  /** Evoluciones nuevas para especies que no son del add-on: `{ "pikachu": [ … ] }`. */
  evolutions?: Record<string, Evolution[]>;
  /** Qué hacer con la respuesta de Cobblemon Bedrock. Por defecto, al registro de contenido. */
  onAck?: (ack: Ack) => void;
}

/** La respuesta de Cobblemon Bedrock a un registro. */
export interface Ack {
  addon: string;
  api: number;
  ok: boolean;
  errors: string[];
  warnings: string[];
}

// —— Eventos (§9) ——

export interface PlayerRef {
  id: string;
  name: string;
}

/** Un Pokémon en los eventos: un resumen, no la ficha guardada. */
export interface PokemonSummary {
  uuid: string;
  species: string;
  form: string | null;
  level: number;
  shiny: boolean;
  gender: string | null;
  nickname: string | null;
  ball: string | null;
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
