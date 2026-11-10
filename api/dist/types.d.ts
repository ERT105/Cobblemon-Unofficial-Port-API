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
export type ElementalType = "normal" | "fire" | "water" | "grass" | "electric" | "ice" | "fighting" | "poison" | "ground" | "flying" | "psychic" | "bug" | "rock" | "ghost" | "dragon" | "dark" | "steel" | "fairy";
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
    entries: Array<{
        item: string;
        percentage?: number;
        quantityRange?: string;
        rarity?: "common" | "rare";
    }>;
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
        levelUp: Array<{
            level: number;
            move: string;
        }>;
        egg?: string[];
        tm?: string[];
        tutor?: string[];
    };
    evolutions?: Evolution[];
    forms?: SpeciesForm[];
    baseScale?: number;
    hitbox?: {
        width: number;
        height: number;
    };
    height?: number | null;
    weight?: number | null;
    drops?: Drops;
    /** Battle animations: name → `[animation id, seconds, 1 if it loops]`. */
    battleClips?: Record<string, [string, number, number?]>;
    /** Model points for particles: name → list of `[x, y, z]` in model pixels. */
    locators?: Record<string, number[][]>;
    /** Riding: style (`LAND`, `AIR`, `LIQUID`) → stat → `[min, max]`, and each style's kind. */
    riding?: {
        stats: Record<string, Record<string, [number, number]>>;
        keys?: Record<string, string>;
    };
    /** Shoulder: the clip for each side. */
    shoulder?: {
        left: string | null;
        right: string | null;
    };
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
    levels?: Record<string, {
        min: number;
        max: number;
    }>;
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
    captured: {
        api: number;
        player: PlayerRef;
        pokemon: PokemonSummary;
        ball: string | null;
        source: "wild" | "battle" | "raid";
        destination: "party" | "pc";
    };
    battle_start: BattleInfo;
    battle_end: BattleInfo & {
        result: "win" | "loss" | "run" | "catch" | "aborted" | "ongoing";
    };
    level_up: {
        api: number;
        player: PlayerRef;
        from: number;
        pokemon: PokemonSummary;
    };
    evolved: {
        api: number;
        player: PlayerRef;
        from: string;
        pokemon: PokemonSummary;
    };
    released: {
        api: number;
        player: PlayerRef;
        pokemon: PokemonSummary;
        from: "pc" | "party";
    };
    starter_chosen: {
        api: number;
        player: PlayerRef;
        pokemon: PokemonSummary;
    };
    pokedex_registered: {
        api: number;
        player: PlayerRef;
        species: string;
        status: "seen" | "caught";
    };
}
export {};
