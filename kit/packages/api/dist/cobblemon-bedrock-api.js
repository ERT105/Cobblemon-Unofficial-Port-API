// packages/api/src/index.ts
import { system, world } from "@minecraft/server";

// packages/api/src/protocol.generated.ts
var API_VERSION = 2;
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

// packages/api/src/index.ts
var DEFAULT_CHUNK = 1500;
var REQUEST_TIMEOUT_TICKS = 600;
function send(id, payload) {
  system.sendScriptEvent(id, JSON.stringify(payload));
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
    const id = `${system.currentTick}-${++nextId}`;
    const timer = system.runTimeout(() => {
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
  system.afterEvents.scriptEventReceive.subscribe((event) => {
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
      system.clearRun(waiting.timer);
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
  world.afterEvents.worldLoad.subscribe(() => system.run(register));
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
system.beforeEvents.startup.subscribe(() => {
  system.run(() => {
    startupDone = true;
  });
});
function registerMarker(addon, method, blockId, state, groupState, onIndex) {
  if (startupDone) {
    console.warn(`[${addon}] ${method}("${blockId}") was called after startup; call it when your script loads`);
    return;
  }
  system.beforeEvents.startup.subscribe((init) => {
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
  const callback = system.afterEvents.scriptEventReceive.subscribe((event) => {
    if (event.id !== id) return;
    let data;
    try {
      data = JSON.parse(event.message);
    } catch {
      return;
    }
    handler(data);
  });
  return () => system.afterEvents.scriptEventReceive.unsubscribe(callback);
}
export {
  API_VERSION,
  onCobblemonEvent,
  registerAddon
};
