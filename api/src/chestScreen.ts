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

import {
  Block,
  Container,
  Entity,
  EntityInventoryComponent,
  ItemStack,
  Player,
  system,
  Vector3,
  world,
} from "@minecraft/server";
import { EVENT_PREFIX } from "./protocol.generated.js";

/** The invisible 54-slot entity Cobblemon Bedrock provides for add-on screens. */
export const ADDON_SCREEN_ENTITY = "cooblemon:addon_screen";
/** Slot item that draws something: its name is the texture path or text. */
export const CHEST_SLOT_ITEM = "cooblemon:ui_slot";
/** Slot item that draws nothing. */
export const CHEST_EMPTY_ITEM = "cooblemon:ui_empty";
/** Name of a slot that draws nothing (what `names` can return for "empty"). */
export const CHEST_EMPTY_NAME = "~v~";

const UI_ITEMS = new Set<string>([CHEST_SLOT_ITEM, CHEST_EMPTY_ITEM]);
const HELD_DISTANCE = 1.6;
const REACH = 5;
const PARK_TICKS = 20 * 10;
const PARK_HEIGHT = 20;
const REFRESH_EVERY = 20;
const MAX_IDLE_TICKS = 20 * 600;
const MIN_FRONT = 0.35;
const FRONT_MARGIN = 0.5;

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

type Def = ChestScreenDefinition<unknown> & { entity: string };
type Target = { def: Def; block: Block | null; pos: Vector3 };
interface Anchor {
  entity: Entity;
  def: Def;
  block: Block | null;
  parkedSince?: number;
}
interface Session {
  def: Def;
  state: unknown;
  drawn: Map<number, string>;
  position: Vector3;
  view: Vector3;
  since: number;
}

const screens: Def[] = [];
const anchors = new Map<string, Anchor>();
const sessions = new Map<string, Session>();
/** Players in a Cobblemon battle: their battle screen has the front of the camera. */
const battling = new Set<string>();
let started = false;

/** The tag on every entity this engine owns: other engines leave them alone. */
const ownTag = (def: Def) => `cobblemon_api_screen:${def.addon}`;

/** Registers a chest screen. Call it when your script loads. */
export function registerChestScreen<S>(def: ChestScreenDefinition<S>): void {
  if (!def.items?.length && !def.blocks?.length) {
    throw new Error("cobblemon-bedrock-api: a chest screen needs `items` or `blocks` to open it");
  }
  screens.push({ ...(def as ChestScreenDefinition<unknown>), entity: def.entity ?? ADDON_SCREEN_ENTITY });
  start();
}

/** Whether the player has one of your chest screens open. */
export function hasOpenChestScreen(player: Player): boolean {
  return sessions.has(player.id);
}

/** Closes the player's screen: removing the entity is the only way to close a container. */
export function closeChestScreen(player: Player): void {
  endSession(player);
  removeAnchor(player.id);
}

/** Redraws the player's open screen, for changes made from outside it. */
export function redrawChestScreen(player: Player): void {
  const session = sessions.get(player.id);
  const container = containerOf(anchors.get(player.id)?.entity);
  if (session && container) draw(container, session, player);
}

// —— Drawing ——

function containerOf(entity: Entity | undefined): Container | undefined {
  try {
    return (entity?.getComponent(EntityInventoryComponent.componentId) as EntityInventoryComponent | undefined)?.container;
  } catch {
    return undefined;
  }
}

function stackFor(name: string): ItemStack {
  if (!name || name === CHEST_EMPTY_NAME) return new ItemStack(CHEST_EMPTY_ITEM, 1);
  const stack = new ItemStack(CHEST_SLOT_ITEM, 1);
  stack.nameTag = name.slice(0, 250);
  return stack;
}

function holds(container: Container, slot: number, name: string): boolean {
  const item = container.getItem(slot);
  if (!item) return false;
  if (!name || name === CHEST_EMPTY_NAME) return item.typeId === CHEST_EMPTY_ITEM;
  return item.typeId === CHEST_SLOT_ITEM && item.nameTag === name.slice(0, 250);
}

function draw(container: Container, session: Session, player: Player, all = false): void {
  if (all) session.drawn.clear();
  let names: string[];
  try {
    names = session.def.names(player, session.state);
  } catch (err) {
    console.warn(`[${session.def.addon}] chest screen: ${String(err)}`);
    return;
  }
  for (let i = 0; i < container.size; i++) {
    const name = names[i] || CHEST_EMPTY_NAME;
    // Check the item actually there, not just what was written: two quick taps
    // can swap two buttons without emptying either.
    if (!all && session.drawn.get(i) === name && holds(container, i, name)) continue;
    container.setItem(i, stackFor(name));
    session.drawn.set(i, name);
  }
}

/** Takes back the UI items a tap left in the player's inventory or cursor. */
function cleanPlayer(player: Player): void {
  try {
    const inv = (player.getComponent(EntityInventoryComponent.componentId) as EntityInventoryComponent | undefined)?.container;
    if (inv) {
      for (let i = 0; i < inv.size; i++) {
        const id = inv.getItem(i)?.typeId;
        if (id && UI_ITEMS.has(id)) inv.setItem(i, undefined);
      }
    }
  } catch {
    // ignore
  }
  try {
    const cursor = player.getComponent("minecraft:cursor_inventory") as { item?: ItemStack; clear(): void } | undefined;
    if (cursor?.item && UI_ITEMS.has(cursor.item.typeId)) cursor.clear();
  } catch {
    // ignore
  }
}

// —— Keeping the entity in front ——

function heldItemId(player: Player): string | undefined {
  try {
    return (player.getComponent(EntityInventoryComponent.componentId) as EntityInventoryComponent | undefined)?.container?.getItem(
      player.selectedSlotIndex
    )?.typeId;
  } catch {
    return undefined;
  }
}

function frontOfView(player: Player): Vector3 {
  const o = player.getHeadLocation();
  const v = player.getViewDirection();
  let d = HELD_DISTANCE;
  try {
    // In front of the first thing in the way, or the tap would hit it.
    for (const hit of player.getEntitiesFromViewDirection({ maxDistance: HELD_DISTANCE + FRONT_MARGIN })) {
      if (hit.entity.id === player.id || screens.some((s) => s.entity === hit.entity.typeId)) continue;
      d = Math.min(d, hit.distance - FRONT_MARGIN);
    }
  } catch {
    // ignore
  }
  d = Math.max(MIN_FRONT, d);
  return { x: o.x + v.x * d, y: o.y + v.y * d - 0.4, z: o.z + v.z * d };
}

function heldTarget(player: Player): Target | null {
  if (player.isSneaking || battling.has(player.id)) return null;
  const id = heldItemId(player);
  if (!id) return null;
  const def = screens.find((s) => s.items?.includes(id));
  if (!def || (def.enabledFor && !def.enabledFor(player))) return null;
  return { def, block: null, pos: frontOfView(player) };
}

function aimedBlock(player: Player): Target | null {
  if (player.isSneaking || battling.has(player.id)) return null;
  let hit;
  let typeId: string | undefined;
  try {
    hit = player.getBlockFromViewDirection({ maxDistance: REACH });
    typeId = hit?.block.typeId;
  } catch {
    return null;
  }
  const def = typeId ? screens.find((s) => s.blocks?.includes(typeId!)) : undefined;
  if (!def || !hit) return null;
  if (def.enabledFor && !def.enabledFor(player)) return null;
  const v = player.getViewDirection();
  const f = hit.faceLocation;
  const b = hit.block.location;
  return { def, block: hit.block, pos: { x: b.x + f.x - v.x * 0.45, y: b.y + f.y - v.y * 0.45 - 0.4, z: b.z + f.z - v.z * 0.45 } };
}

function removeAnchor(playerId: string): void {
  const anchor = anchors.get(playerId);
  anchors.delete(playerId);
  try {
    if (anchor?.entity.isValid) anchor.entity.remove();
  } catch {
    // ignore
  }
}

const moved = (a: Vector3, b: Vector3, limit: number): boolean =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z) > limit;

/** Moves the entity out of the way instead of removing it: respawning it is slow to reach the client. */
function parkAnchor(player: Player, anchor: Anchor): void {
  if (anchor.parkedSince !== undefined) {
    if (system.currentTick - anchor.parkedSince > PARK_TICKS) removeAnchor(player.id);
    return;
  }
  anchor.parkedSince = system.currentTick;
  const { x, y, z } = player.location;
  let parkY = y + PARK_HEIGHT;
  try {
    if (parkY > player.dimension.heightRange.max - 2) parkY = y - PARK_HEIGHT;
    anchor.entity.teleport({ x, y: parkY, z });
  } catch {
    removeAnchor(player.id);
  }
}

function placeAnchor(player: Player, target: Target): void {
  let anchor = anchors.get(player.id);
  let sameDimension = true;
  try {
    sameDimension = !anchor || anchor.entity.dimension.id === player.dimension.id;
  } catch {
    sameDimension = false;
  }
  if (anchor && (anchor.def !== target.def || !anchor.entity.isValid || !sameDimension)) {
    removeAnchor(player.id);
    anchor = undefined;
  }
  if (!anchor) {
    let entity: Entity;
    try {
      entity = player.dimension.spawnEntity(target.def.entity, target.pos);
    } catch {
      return;
    }
    try {
      // With the name already set, the client knows the title when it opens.
      entity.nameTag = target.def.title;
      entity.addTag(ownTag(target.def));
      entity.addEffect("invisibility", 20000000, { showParticles: false });
    } catch {
      // ignore
    }
    anchor = { entity, def: target.def, block: target.block };
    anchors.set(player.id, anchor);
    const container = containerOf(entity);
    if (container) {
      draw(
        container,
        {
          def: target.def,
          state: target.def.newState(player, target.block),
          drawn: new Map(),
          position: player.location,
          view: player.getViewDirection(),
          since: system.currentTick,
        },
        player,
        true
      );
    }
  }
  anchor.block = target.block;
  anchor.parkedSince = undefined;
  try {
    if (moved(anchor.entity.location, target.pos, 0.002)) anchor.entity.teleport(target.pos);
  } catch {
    // ignore
  }
}

function endSession(player: Player): void {
  const session = sessions.get(player.id);
  if (!session) return;
  sessions.delete(player.id);
  cleanPlayer(player);
  try {
    session.def.onClose?.(player, session.state);
  } catch (err) {
    console.warn(`[${session.def.addon}] chest screen: ${String(err)}`);
  }
}

// —— Loop ——

function tickPlayer(player: Player): void {
  const session = sessions.get(player.id);
  if (!session) {
    // A held item wins over the block looked at: it's held for that.
    const target = heldTarget(player) ?? aimedBlock(player);
    const anchor = anchors.get(player.id);
    if (target) placeAnchor(player, target);
    else if (anchor) parkAnchor(player, anchor);
    return;
  }

  // With the screen open the player can't walk or turn: if they did, they closed it.
  const v = player.getViewDirection();
  const turned = v.x * session.view.x + v.y * session.view.y + v.z * session.view.z < 0.97;
  if (moved(player.location, session.position, 0.6) || turned || battling.has(player.id)) {
    endSession(player);
    return;
  }
  // Item screens: without the item in hand, closed. Otherwise after Esc the
  // entity would stay in front of the camera and catch the next tap.
  if (session.def.items?.length && !session.def.blocks?.length) {
    const held = heldItemId(player);
    if (!held || !session.def.items.includes(held)) {
      closeChestScreen(player);
      return;
    }
  }

  const container = containerOf(anchors.get(player.id)?.entity);
  if (!container) {
    endSession(player);
    return;
  }

  // Which button was tapped? The one that lost its item.
  const touched = session.def.touchable(session.state).find((i) => {
    const id = container.getItem(i)?.typeId;
    return !id || !UI_ITEMS.has(id);
  });
  if (touched !== undefined) {
    cleanPlayer(player);
    session.since = system.currentTick;
    let result: "close" | void = undefined;
    try {
      result = session.def.action(player, session.state, touched);
    } catch (err) {
      console.warn(`[${session.def.addon}] chest screen: ${String(err)}`);
    }
    if (result === "close") {
      closeChestScreen(player);
      return;
    }
    session.drawn.delete(touched);
    draw(container, session, player);
    return;
  }

  // A decoration slot was dragged away: put it back.
  for (let i = 0; i < container.size; i++) {
    const id = container.getItem(i)?.typeId;
    if (!id || !UI_ITEMS.has(id)) {
      cleanPlayer(player);
      draw(container, session, player);
      return;
    }
  }

  const idle = system.currentTick - session.since;
  if (idle <= MAX_IDLE_TICKS && idle >= REFRESH_EVERY && idle % REFRESH_EVERY < 2) draw(container, session, player);
}

function start(): void {
  if (started) return;
  started = true;

  // Only the player's own entity opens. Someone else's would let them press
  // another player's buttons. Entities of other engines aren't ours to judge.
  world.beforeEvents.playerInteractWithEntity.subscribe((event) => {
    const def = screens.find((s) => event.target.typeId === s.entity && event.target.hasTag(ownTag(s)));
    if (!def) return;
    if (anchors.get(event.player.id)?.entity.id !== event.target.id) event.cancel = true;
  });

  world.afterEvents.playerInteractWithEntity.subscribe(({ player, target }) => {
    const anchor = anchors.get(player.id);
    if (!anchor || anchor.entity.id !== target.id) return;
    const container = containerOf(target);
    if (!container) return;
    let session = sessions.get(player.id);
    if (!session || session.def !== anchor.def) {
      session = {
        def: anchor.def,
        state: anchor.def.newState(player, anchor.block),
        drawn: new Map(),
        position: player.location,
        view: player.getViewDirection(),
        since: system.currentTick,
      };
      sessions.set(player.id, session);
      try {
        anchor.def.onOpen?.(player, session.state);
      } catch {
        // ignore
      }
    }
    session.position = player.location;
    session.view = player.getViewDirection();
    session.since = system.currentTick;
    draw(container, session, player, true);
  });

  system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
      try {
        tickPlayer(player);
      } catch (err) {
        console.warn(`cobblemon-bedrock-api chest screen: ${String(err)}`);
      }
    }
  }, 2);

  // Cobblemon Bedrock's battle screen takes the front of the camera.
  system.afterEvents.scriptEventReceive.subscribe((event) => {
    if (event.id !== `${EVENT_PREFIX}battle_start` && event.id !== `${EVENT_PREFIX}battle_end`) return;
    try {
      const data = JSON.parse(event.message) as { players?: Array<{ id: string }> };
      for (const p of data.players ?? []) {
        if (event.id.endsWith("battle_start")) battling.add(p.id);
        else battling.delete(p.id);
      }
    } catch {
      // ignore
    }
  });

  world.afterEvents.playerLeave.subscribe(({ playerId }) => {
    sessions.delete(playerId);
    battling.delete(playerId);
    removeAnchor(playerId);
  });

  // Entities left over from a world closed with a screen open.
  world.afterEvents.worldLoad.subscribe(() => {
    for (const dim of ["overworld", "nether", "the_end"]) {
      try {
        for (const def of screens) {
          for (const e of world.getDimension(dim).getEntities({ type: def.entity, tags: [ownTag(def)] })) e.remove();
        }
      } catch {
        // ignore
      }
    }
  });
}
