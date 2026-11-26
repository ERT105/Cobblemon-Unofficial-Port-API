// packages/api/src/index.ts
import { system as system2, world as world2 } from "@minecraft/server";

// packages/api/src/protocol.generated.ts
var API_VERSION = 3;
var ApiEvents = {
  HELLO: "cooblemon:api.hello",
  PART: "cooblemon:api.part",
  DONE: "cooblemon:api.done",
  PING: "cooblemon:api.ping",
  ACK: "cooblemon:api.ack",
  PROBE: "cooblemon:api.probe",
  ACTION: "cooblemon:api.action",
  QUERY: "cooblemon:api.query",
  RESULT: "cooblemon:api.result"
};
var EVENT_PREFIX = "cooblemon:event.";

// packages/api/src/chestScreen.ts
import {
  EntityInventoryComponent,
  ItemStack,
  system,
  world
} from "@minecraft/server";
var ADDON_SCREEN_ENTITY = "cooblemon:addon_screen";
var CHEST_SLOT_ITEM = "cooblemon:ui_slot";
var CHEST_EMPTY_ITEM = "cooblemon:ui_empty";
var CHEST_EMPTY_NAME = "~v~";
var UI_ITEMS = /* @__PURE__ */ new Set([CHEST_SLOT_ITEM, CHEST_EMPTY_ITEM]);
var HELD_DISTANCE = 1.6;
var REACH = 5;
var PARK_TICKS = 20 * 10;
var PARK_HEIGHT = 20;
var REFRESH_EVERY = 20;
var MAX_IDLE_TICKS = 20 * 600;
var MIN_FRONT = 0.35;
var FRONT_MARGIN = 0.5;
var screens = [];
var anchors = /* @__PURE__ */ new Map();
var sessions = /* @__PURE__ */ new Map();
var battling = /* @__PURE__ */ new Set();
var started = false;
var ownTag = (def) => `cobblemon_api_screen:${def.addon}`;
function registerChestScreen(def) {
  if (!def.items?.length && !def.blocks?.length) {
    throw new Error("cobblemon-bedrock-api: a chest screen needs `items` or `blocks` to open it");
  }
  screens.push({ ...def, entity: def.entity ?? ADDON_SCREEN_ENTITY });
  start();
}
function hasOpenChestScreen(player) {
  return sessions.has(player.id);
}
function closeChestScreen(player) {
  endSession(player);
  removeAnchor(player.id);
}
function redrawChestScreen(player) {
  const session = sessions.get(player.id);
  const container = containerOf(anchors.get(player.id)?.entity);
  if (session && container) draw(container, session, player);
}
function containerOf(entity) {
  try {
    return entity?.getComponent(EntityInventoryComponent.componentId)?.container;
  } catch {
    return void 0;
  }
}
function stackFor(name) {
  if (!name || name === CHEST_EMPTY_NAME) return new ItemStack(CHEST_EMPTY_ITEM, 1);
  const stack = new ItemStack(CHEST_SLOT_ITEM, 1);
  stack.nameTag = name.slice(0, 250);
  return stack;
}
function holds(container, slot, name) {
  const item = container.getItem(slot);
  if (!item) return false;
  if (!name || name === CHEST_EMPTY_NAME) return item.typeId === CHEST_EMPTY_ITEM;
  return item.typeId === CHEST_SLOT_ITEM && item.nameTag === name.slice(0, 250);
}
function draw(container, session, player, all = false) {
  if (all) session.drawn.clear();
  let names;
  try {
    names = session.def.names(player, session.state);
  } catch (err) {
    console.warn(`[${session.def.addon}] chest screen: ${String(err)}`);
    return;
  }
  for (let i = 0; i < container.size; i++) {
    const name = names[i] || CHEST_EMPTY_NAME;
    if (!all && session.drawn.get(i) === name && holds(container, i, name)) continue;
    container.setItem(i, stackFor(name));
    session.drawn.set(i, name);
  }
}
function cleanPlayer(player) {
  try {
    const inv = player.getComponent(EntityInventoryComponent.componentId)?.container;
    if (inv) {
      for (let i = 0; i < inv.size; i++) {
        const id = inv.getItem(i)?.typeId;
        if (id && UI_ITEMS.has(id)) inv.setItem(i, void 0);
      }
    }
  } catch {
  }
  try {
    const cursor = player.getComponent("minecraft:cursor_inventory");
    if (cursor?.item && UI_ITEMS.has(cursor.item.typeId)) cursor.clear();
  } catch {
  }
}
function heldItemId(player) {
  try {
    return player.getComponent(EntityInventoryComponent.componentId)?.container?.getItem(
      player.selectedSlotIndex
    )?.typeId;
  } catch {
    return void 0;
  }
}
function frontOfView(player) {
  const o = player.getHeadLocation();
  const v = player.getViewDirection();
  let d = HELD_DISTANCE;
  try {
    for (const hit of player.getEntitiesFromViewDirection({ maxDistance: HELD_DISTANCE + FRONT_MARGIN })) {
      if (hit.entity.id === player.id || screens.some((s) => s.entity === hit.entity.typeId)) continue;
      d = Math.min(d, hit.distance - FRONT_MARGIN);
    }
  } catch {
  }
  d = Math.max(MIN_FRONT, d);
  return { x: o.x + v.x * d, y: o.y + v.y * d - 0.4, z: o.z + v.z * d };
}
function heldTarget(player) {
  if (player.isSneaking || battling.has(player.id)) return null;
  const id = heldItemId(player);
  if (!id) return null;
  const def = screens.find((s) => s.items?.includes(id));
  if (!def || def.enabledFor && !def.enabledFor(player)) return null;
  return { def, block: null, pos: frontOfView(player) };
}
function aimedBlock(player) {
  if (player.isSneaking || battling.has(player.id)) return null;
  let hit;
  let typeId;
  try {
    hit = player.getBlockFromViewDirection({ maxDistance: REACH });
    typeId = hit?.block.typeId;
  } catch {
    return null;
  }
  const def = typeId ? screens.find((s) => s.blocks?.includes(typeId)) : void 0;
  if (!def || !hit) return null;
  if (def.enabledFor && !def.enabledFor(player)) return null;
  const v = player.getViewDirection();
  const f = hit.faceLocation;
  const b = hit.block.location;
  return { def, block: hit.block, pos: { x: b.x + f.x - v.x * 0.45, y: b.y + f.y - v.y * 0.45 - 0.4, z: b.z + f.z - v.z * 0.45 } };
}
function removeAnchor(playerId2) {
  const anchor = anchors.get(playerId2);
  anchors.delete(playerId2);
  try {
    if (anchor?.entity.isValid) anchor.entity.remove();
  } catch {
  }
}
var moved = (a, b, limit) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z) > limit;
function parkAnchor(player, anchor) {
  if (anchor.parkedSince !== void 0) {
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
function placeAnchor(player, target) {
  let anchor = anchors.get(player.id);
  let sameDimension = true;
  try {
    sameDimension = !anchor || anchor.entity.dimension.id === player.dimension.id;
  } catch {
    sameDimension = false;
  }
  if (anchor && (anchor.def !== target.def || !anchor.entity.isValid || !sameDimension)) {
    removeAnchor(player.id);
    anchor = void 0;
  }
  if (!anchor) {
    let entity;
    try {
      entity = player.dimension.spawnEntity(target.def.entity, target.pos);
    } catch {
      return;
    }
    try {
      entity.nameTag = target.def.title;
      entity.addTag(ownTag(target.def));
      entity.addEffect("invisibility", 2e7, { showParticles: false });
    } catch {
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
          drawn: /* @__PURE__ */ new Map(),
          position: player.location,
          view: player.getViewDirection(),
          since: system.currentTick
        },
        player,
        true
      );
    }
  }
  anchor.block = target.block;
  anchor.parkedSince = void 0;
  try {
    if (moved(anchor.entity.location, target.pos, 2e-3)) anchor.entity.teleport(target.pos);
  } catch {
  }
}
function endSession(player) {
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
function tickPlayer(player) {
  const session = sessions.get(player.id);
  if (!session) {
    const target = heldTarget(player) ?? aimedBlock(player);
    const anchor = anchors.get(player.id);
    if (target) placeAnchor(player, target);
    else if (anchor) parkAnchor(player, anchor);
    return;
  }
  const v = player.getViewDirection();
  const turned = v.x * session.view.x + v.y * session.view.y + v.z * session.view.z < 0.97;
  if (moved(player.location, session.position, 0.6) || turned || battling.has(player.id)) {
    endSession(player);
    return;
  }
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
  const touched = session.def.touchable(session.state).find((i) => {
    const id = container.getItem(i)?.typeId;
    return !id || !UI_ITEMS.has(id);
  });
  if (touched !== void 0) {
    cleanPlayer(player);
    session.since = system.currentTick;
    let result = void 0;
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
function start() {
  if (started) return;
  started = true;
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
        drawn: /* @__PURE__ */ new Map(),
        position: player.location,
        view: player.getViewDirection(),
        since: system.currentTick
      };
      sessions.set(player.id, session);
      try {
        anchor.def.onOpen?.(player, session.state);
      } catch {
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
  system.afterEvents.scriptEventReceive.subscribe((event) => {
    if (event.id !== `${EVENT_PREFIX}battle_start` && event.id !== `${EVENT_PREFIX}battle_end`) return;
    try {
      const data = JSON.parse(event.message);
      for (const p of data.players ?? []) {
        if (event.id.endsWith("battle_start")) battling.add(p.id);
        else battling.delete(p.id);
      }
    } catch {
    }
  });
  world.afterEvents.playerLeave.subscribe(({ playerId: playerId2 }) => {
    sessions.delete(playerId2);
    battling.delete(playerId2);
    removeAnchor(playerId2);
  });
  world.afterEvents.worldLoad.subscribe(() => {
    for (const dim of ["overworld", "nether", "the_end"]) {
      try {
        for (const def of screens) {
          for (const e of world.getDimension(dim).getEntities({ type: def.entity, tags: [ownTag(def)] })) e.remove();
        }
      } catch {
      }
    }
  });
}

// packages/api/src/index.ts
var DEFAULT_CHUNK = 1500;
var REQUEST_TIMEOUT_TICKS = 600;
function send(id, payload) {
  system2.sendScriptEvent(id, JSON.stringify(payload));
}
function playerId(player) {
  if (player === void 0) return void 0;
  return typeof player === "string" ? player : player.id;
}
function registerAddon(def) {
  if (!/^[a-z0-9_]+$/.test(def.addon) || def.addon === "cooblemon" || def.addon === "minecraft") {
    throw new Error(`cobblemon-bedrock-api: "${def.addon}" is not a valid namespace (lowercase letters, digits and _)`);
  }
  let chunk = DEFAULT_CHUNK;
  const sendPacket = (kind, key, data) => {
    const text = JSON.stringify(data);
    const of = Math.max(1, Math.ceil(text.length / chunk));
    for (let seq = 0; seq < of; seq++) {
      send(ApiEvents.PART, { addon: def.addon, kind, key, seq, of, data: text.slice(seq * chunk, (seq + 1) * chunk) });
    }
  };
  const register = () => {
    send(ApiEvents.HELLO, { addon: def.addon, api: API_VERSION, version: def.version });
    if (def.moves?.length) sendPacket("moves", "moves", { moves: def.moves });
    for (const species of def.species ?? []) sendPacket("species", species.id, species);
    for (const addition of def.additions ?? []) sendPacket("additions", addition.target, addition);
    if (def.zones && Object.keys(def.zones).length) sendPacket("zones", "zones", def.zones);
    if (def.spawn?.entries.length) sendPacket("spawn", "spawn", def.spawn);
    if (def.sprites && Object.keys(def.sprites).length) sendPacket("sprites", "sprites", def.sprites);
    if (def.evolutions && Object.keys(def.evolutions).length) sendPacket("evolutions", "evolutions", def.evolutions);
    if (def.megas?.length) sendPacket("megas", "megas", { entries: def.megas, accessories: def.megaAccessories ?? [] });
    if (def.partyItems?.length) sendPacket("party_items", "party_items", { items: def.partyItems });
    if (def.npcs && Object.keys(def.npcs).length) sendPacket("npcs", "npcs", def.npcs);
    if (def.buttons?.length) sendPacket("ui", "ui", { buttons: def.buttons });
    send(ApiEvents.DONE, { addon: def.addon });
  };
  let registered = false;
  const queued = [];
  const pending = /* @__PURE__ */ new Map();
  let nextId = 0;
  const request = (channel, field, name, body) => new Promise((resolve, reject) => {
    const id = `${system2.currentTick}-${++nextId}`;
    const timer = system2.runTimeout(() => {
      pending.delete(id);
      reject(new Error(`cobblemon-bedrock-api: no answer to ${field} "${name}" (is Cobblemon Bedrock installed?)`));
    }, REQUEST_TIMEOUT_TICKS);
    pending.set(id, { resolve, reject, timer });
    const go = () => send(channel, { addon: def.addon, id, [field]: name, ...body });
    if (registered) go();
    else queued.push(go);
  });
  const action = (name, body) => request(ApiEvents.ACTION, "action", name, body);
  const query = (name, body) => request(ApiEvents.QUERY, "query", name, body);
  system2.afterEvents.scriptEventReceive.subscribe((event) => {
    if (event.id === ApiEvents.PING) {
      try {
        const ping = JSON.parse(event.message);
        if (typeof ping.maxMessage === "number") {
          chunk = Math.max(500, Math.min(15e3, Math.floor((ping.maxMessage - 300) / 2)));
        }
      } catch {
      }
      register();
      return;
    }
    if (event.id === ApiEvents.RESULT) {
      let result;
      try {
        result = JSON.parse(event.message);
      } catch {
        return;
      }
      if (result.addon !== def.addon || typeof result.id !== "string") return;
      const waiting = pending.get(result.id);
      if (!waiting) return;
      pending.delete(result.id);
      system2.clearRun(waiting.timer);
      if (result.ok) waiting.resolve(result.data);
      else waiting.reject(new Error(`cobblemon-bedrock-api: ${result.error ?? "request failed"}`));
      return;
    }
    if (event.id === ApiEvents.ACK) {
      let ack;
      try {
        ack = JSON.parse(event.message);
      } catch {
        return;
      }
      if (ack.addon !== def.addon) return;
      if (!registered) {
        registered = true;
        for (const go of queued.splice(0)) go();
      }
      if (def.onAck) {
        def.onAck(ack);
        return;
      }
      if (ack.ok) console.warn(`[${def.addon}] registered in Cobblemon Bedrock (API ${ack.api}): ${def.species?.length ?? 0} species`);
      for (const e of ack.errors) console.warn(`[${def.addon}] error: ${e}`);
      for (const w of ack.warnings) console.warn(`[${def.addon}] warning: ${w}`);
    }
  });
  world2.afterEvents.worldLoad.subscribe(() => system2.run(register));
  return {
    spawn: (req) => action("spawn", { pokemon: req.pokemon, at: req.at, nearPlayer: playerId(req.nearPlayer), battle: playerId(req.battle) }),
    give: (req) => action("give", { player: playerId(req.player), pokemon: req.pokemon, destination: req.destination }),
    startBattle: (player, entityId) => action("start_battle", { player: playerId(player), entity: entityId }),
    heal: (player) => action("heal", { player: playerId(player) }).then(() => void 0),
    updatePokemon: (player, uuid, changes) => action("update_pokemon", { ...changes, player: playerId(player), uuid }),
    party: (player) => query("party", { player: playerId(player) }),
    pokedex: (player, species) => query("pokedex", { player: playerId(player), species }),
    nearby: (req) => query("nearby", { player: playerId(req.player), at: req.at, radius: req.radius }),
    species: (id) => query("species", { species: id }),
    spawnTable: (req) => {
      const r = req;
      return query("spawn_table", { player: playerId(r.player), at: r.at, snack: r.snack, bucket: r.bucket, area: r.area });
    },
    spawnDetail: (ids) => query("spawn_detail", { ids }),
    fishingTable: (player, bucket) => query("fishing_table", { player: playerId(player), bucket }),
    sprites: (pokemon) => query("sprites", { pokemon }),
    itemInfo: (ids) => query("item_info", { ids }),
    spawnEntries: async (species) => {
      const ids = [];
      let offset = 0;
      while (offset !== null) {
        const page = await query("spawn_entries", { species, offset });
        ids.push(...page.ids);
        offset = page.next;
      }
      return { ids };
    },
    hud: (player, content) => action("hud", { player: playerId(player), content: content ?? null }),
    spawnNpc: (req) => action("spawn_npc", { npc: req.npc, at: req.at, yaw: req.yaw, tag: req.tag }),
    despawnNpc: (entityId) => action("despawn_npc", { entity: entityId }).then(() => void 0),
    npcMarker: (blockId, npcs, options) => registerMarker(def.addon, "npcMarker", blockId, options?.state ?? `${def.addon}:npc`, options?.groupState, (index, at) => {
      const npc = npcs[index];
      return npc ? action("spawn_npc", { npc, at, tag: options?.tag }) : null;
    }),
    pokemonMarker: (blockId, pokemon, options) => registerMarker(def.addon, "pokemonMarker", blockId, options?.state ?? `${def.addon}:pokemon`, options?.groupState, (index, at) => {
      const request2 = pokemon[index];
      return request2 ? action("spawn", { pokemon: request2, at }) : null;
    }),
    markZone: (zone, at) => action("mark_zone", { zone, at }),
    zoneMarker: (blockId, zones, options) => registerMarker(def.addon, "zoneMarker", blockId, options?.state ?? `${def.addon}:zone`, options?.groupState, (index, at) => {
      const entry = zones[index];
      if (!entry) return null;
      const list = Array.isArray(entry) ? entry : [entry];
      return Promise.all(list.map((zone) => action("mark_zone", { zone, at })));
    })
  };
}
var startupDone = false;
system2.beforeEvents.startup.subscribe(() => {
  system2.run(() => {
    startupDone = true;
  });
});
function registerMarker(addon, method, blockId, state, groupState, onIndex) {
  if (startupDone) {
    console.warn(`[${addon}] ${method}("${blockId}") was called after startup; call it when your script loads`);
    return;
  }
  system2.beforeEvents.startup.subscribe((init) => {
    init.blockComponentRegistry.registerCustomComponent(blockId, {
      onTick(event) {
        const block = event.block;
        let index;
        try {
          const states = block.permutation.getAllStates();
          const own = Number(states[state] ?? 0);
          const group = groupState ? Number(states[groupState] ?? 0) : 0;
          index = group * 16 + own;
          block.setType(block.isWaterlogged ? "minecraft:water" : "minecraft:air");
        } catch {
          return;
        }
        const { x, y, z } = block.location;
        const dimension = block.dimension.id.replace(/^minecraft:/, "");
        const pending = onIndex(index, { dimension, x, y, z });
        if (!pending) {
          console.warn(`[${addon}] ${blockId}: nothing for number ${index}`);
          return;
        }
        pending.catch((err) => console.warn(`[${addon}] ${blockId}: ${String(err)}`));
      }
    });
  });
}
function onCobblemonEvent(name, handler) {
  const id = `${EVENT_PREFIX}${name}`;
  const callback = system2.afterEvents.scriptEventReceive.subscribe((event) => {
    if (event.id !== id) return;
    let data;
    try {
      data = JSON.parse(event.message);
    } catch {
      return;
    }
    handler(data);
  });
  return () => system2.afterEvents.scriptEventReceive.unsubscribe(callback);
}
export {
  ADDON_SCREEN_ENTITY,
  API_VERSION,
  CHEST_EMPTY_ITEM,
  CHEST_EMPTY_NAME,
  CHEST_SLOT_ITEM,
  closeChestScreen,
  hasOpenChestScreen,
  onCobblemonEvent,
  redrawChestScreen,
  registerAddon,
  registerChestScreen
};
