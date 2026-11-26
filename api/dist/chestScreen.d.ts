/**
 * Chest screens for add-ons (API 3): menus drawn inside a chest's inventory
 * screen, the technique Cobblemon Bedrock uses for its PC, Pokédex and battle
 * screens. Unlike a form, the screen updates live: no closing and reopening on
 * every tap, which is what makes menus feel slow on phones.
 *
 * How it works (the same engine as Cobblemon Bedrock's, `docs/CHEST_SCREENS.md`):
 * - A script can't open a container. Only a player tapping an entity with an
 *   inventory can. So while the player holds your item (or looks at your
 *   block), an invisible entity (`cooblemon:addon_screen`, 54 slots) is kept
 *   between them and what they look at: the tap lands on it and the game opens
 *   its inventory.
 * - Each slot is a piece of your screen. The item in it is named with what to
 *   draw: a texture path or a translation key. Your resource pack's UI reads
 *   that name (`#hover_text`) and draws it.
 * - Tapping a button takes the item out of its slot. Every two ticks the engine
 *   checks which slot was emptied, calls your `action`, and rewrites only the
 *   slots that changed.
 * - There's no close event: with the screen open the player can't walk or turn,
 *   so if they do, they closed it.
 *
 * Several add-ons (and Cobblemon Bedrock itself) can use this at once: each
 * engine only handles the entities it tagged.
 */
import { Block, Player } from "@minecraft/server";
/** The invisible 54-slot entity Cobblemon Bedrock provides for add-on screens. */
export declare const ADDON_SCREEN_ENTITY = "cooblemon:addon_screen";
/** Slot item that draws something: its name is the texture path or text. */
export declare const CHEST_SLOT_ITEM = "cooblemon:ui_slot";
/** Slot item that draws nothing. */
export declare const CHEST_EMPTY_ITEM = "cooblemon:ui_empty";
/** Name of a slot that draws nothing (what `names` can return for "empty"). */
export declare const CHEST_EMPTY_NAME = "~v~";
export interface ChestScreenDefinition<S> {
    /** Your add-on's namespace: the engine tags its entities with it. */
    addon: string;
    /**
     * The name given to the entity. Your `chest_screen.json` variant recognizes
     * the screen by it: use an invisible mark unique to your add-on and screen
     * (for example `§c§n§1`).
     */
    title: string;
    /** Entity with the inventory. Default `cooblemon:addon_screen` (54 slots). */
    entity?: string;
    /** Items that open it while held in the main hand. */
    items?: string[];
    /** Blocks that open it while looked at (within 5 blocks). */
    blocks?: string[];
    /** Whether this player can use it right now (default: yes). */
    enabledFor?(player: Player): boolean;
    /** Fresh state when the screen is about to open. `block` is the block looked at, if any. */
    newState(player: Player, block: Block | null): S;
    onOpen?(player: Player, state: S): void;
    onClose?(player: Player, state: S): void;
    /** The name of every slot: a texture path, a translation key, or `CHEST_EMPTY_NAME`. */
    names(player: Player, state: S): string[];
    /** Slots that are buttons. */
    touchable(state: S): number[];
    /** A button was tapped. Return `"close"` to close the screen. */
    action(player: Player, state: S, slot: number): "close" | void;
}
/** Registers a chest screen. Call it when your script loads. */
export declare function registerChestScreen<S>(def: ChestScreenDefinition<S>): void;
/** Whether the player has one of your chest screens open. */
export declare function hasOpenChestScreen(player: Player): boolean;
/** Closes the player's screen: removing the entity is the only way to close a container. */
export declare function closeChestScreen(player: Player): void;
/** Redraws the player's open screen, for changes made from outside it. */
export declare function redrawChestScreen(player: Player): void;
