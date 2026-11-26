/**
 * `cobblemon-bedrock-api`: what an add-on needs to register with Cobblemon
 * Bedrock, listen to its events and ask it to do things (guide in
 * `docs/README.md`, formats in `docs/REFERENCE.md`).
 *
 * ```js
 * import { registerAddon, onCobblemonEvent } from "./cobblemon-bedrock-api.js";
 *
 * const cobblemon = registerAddon({ addon: "myaddon", version: "1.0.0", species: [...], spawn: {...} });
 * onCobblemonEvent("captured", (e) => console.warn(`${e.player.name} caught ${e.pokemon.species}`));
 * await cobblemon.spawn({ pokemon: { species: "articuno", level: 50, shiny: true, tag: "altar" }, nearPlayer: player });
 * ```
 *
 * It's bundled into the add-on's script (nothing else to install in the world
 * besides Cobblemon Bedrock). Its only dependency is `@minecraft/server`.
 */

import { system, world } from "@minecraft/server";
import { API_VERSION, ApiEvents, EVENT_PREFIX } from "./protocol.generated.js";
import type { Ack, AddonDefinition, CobblemonClient, CobblemonEvents, Place, PlayerLike } from "./types.js";

export * from "./types.js";
export * from "./chestScreen.js";
export { API_VERSION };

/** Default chunk size, until Cobblemon Bedrock says how much fits in a message. */
const DEFAULT_CHUNK = 1500;
/** How long a request waits for its answer: 30 seconds. */
const REQUEST_TIMEOUT_TICKS = 600;

function send(id: string, payload: unknown): void {
  system.sendScriptEvent(id, JSON.stringify(payload));
}

function playerId(player: PlayerLike | undefined): string | undefined {
  if (player === undefined) return undefined;
  return typeof player === "string" ? player : player.id;
}

/**
 * Registers the add-on with Cobblemon Bedrock, and returns a client to ask it
 * to do things (`spawn`, `give`…) or tell you things (`party`, `nearby`…).
 *
 * Registration is sent on world load and every time Cobblemon Bedrock asks
 * (`ping`), so it doesn't matter which script starts first. Each packet is
 * split to the message size Cobblemon Bedrock measures and announces. The
 * reply (`ack`), with the validation errors and warnings, goes to the content
 * log unless `onAck` is given.
 *
 * Requests made before Cobblemon Bedrock has accepted the registration wait
 * for it, so you can call the client right away.
 */
export function registerAddon(def: AddonDefinition): CobblemonClient {
  if (!/^[a-z0-9_]+$/.test(def.addon) || def.addon === "cooblemon" || def.addon === "minecraft") {
    throw new Error(`cobblemon-bedrock-api: "${def.addon}" is not a valid namespace (lowercase letters, digits and _)`);
  }
  let chunk = DEFAULT_CHUNK;

  /**
   * Splits a packet. The chunk travels as text inside another JSON, which
   * escapes quotes and backslashes: half the maximum per chunk always fits.
   */
  const sendPacket = (kind: string, key: string, data: unknown) => {
    const text = JSON.stringify(data);
    const of = Math.max(1, Math.ceil(text.length / chunk));
    for (let seq = 0; seq < of; seq++) {
      send(ApiEvents.PART, { addon: def.addon, kind, key, seq, of, data: text.slice(seq * chunk, (seq + 1) * chunk) });
    }
  };

  const register = () => {
    send(ApiEvents.HELLO, { addon: def.addon, api: API_VERSION, version: def.version });
    // Moves first: species can learn them. Then species before their spawns and
    // evolutions: Cobblemon Bedrock checks that they exist.
    if (def.moves?.length) sendPacket("moves", "moves", { moves: def.moves });
    for (const species of def.species ?? []) sendPacket("species", species.id, species);
    // Additions before spawns, sprites and megas: those can refer to the forms they add.
    for (const addition of def.additions ?? []) sendPacket("additions", addition.target, addition);
    // Zones before spawns: entries with `zone` are checked against them.
    if (def.zones && Object.keys(def.zones).length) sendPacket("zones", "zones", def.zones);
    if (def.spawn?.entries.length) sendPacket("spawn", "spawn", def.spawn);
    if (def.sprites && Object.keys(def.sprites).length) sendPacket("sprites", "sprites", def.sprites);
    if (def.evolutions && Object.keys(def.evolutions).length) sendPacket("evolutions", "evolutions", def.evolutions);
    if (def.megas?.length) sendPacket("megas", "megas", { entries: def.megas, accessories: def.megaAccessories ?? [] });
    if (def.partyItems?.length) sendPacket("party_items", "party_items", { items: def.partyItems });
    // NPCs last: their teams can use the species and moves sent above.
    if (def.npcs && Object.keys(def.npcs).length) sendPacket("npcs", "npcs", def.npcs);
    if (def.buttons?.length) sendPacket("ui", "ui", { buttons: def.buttons });
    send(ApiEvents.DONE, { addon: def.addon });
  };

  // —— Requests: one id per request, answered by `result` ——
  let registered = false;
  const queued: Array<() => void> = [];
  const pending = new Map<string, { resolve: (data: unknown) => void; reject: (err: Error) => void; timer: number }>();
  let nextId = 0;

  const request = <T>(channel: string, field: "action" | "query", name: string, body: Record<string, unknown>): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      const id = `${system.currentTick}-${++nextId}`;
      const timer = system.runTimeout(() => {
        pending.delete(id);
        reject(new Error(`cobblemon-bedrock-api: no answer to ${field} "${name}" (is Cobblemon Bedrock installed?)`));
      }, REQUEST_TIMEOUT_TICKS);
      pending.set(id, { resolve: resolve as (data: unknown) => void, reject, timer });
      const go = () => send(channel, { addon: def.addon, id, [field]: name, ...body });
      if (registered) go();
      else queued.push(go);
    });
  const action = <T>(name: string, body: Record<string, unknown>) => request<T>(ApiEvents.ACTION, "action", name, body);
  const query = <T>(name: string, body: Record<string, unknown>) => request<T>(ApiEvents.QUERY, "query", name, body);

  system.afterEvents.scriptEventReceive.subscribe((event) => {
    if (event.id === ApiEvents.PING) {
      try {
        const ping = JSON.parse(event.message) as { maxMessage?: number };
        if (typeof ping.maxMessage === "number") {
          chunk = Math.max(500, Math.min(15000, Math.floor((ping.maxMessage - 300) / 2)));
        }
      } catch {
        // No measurement: keep the default chunk.
      }
      register();
      return;
    }
    if (event.id === ApiEvents.RESULT) {
      let result: { addon?: string; id?: string; ok?: boolean; error?: string; data?: unknown };
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
      let ack: Ack;
      try {
        ack = JSON.parse(event.message) as Ack;
      } catch {
        return;
      }
      if (ack.addon !== def.addon) return;
      // Registered: requests that were waiting can go now.
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

  // In case Cobblemon Bedrock was already listening when we started.
  world.afterEvents.worldLoad.subscribe(() => system.run(register));

  return {
    spawn: (req) =>
      action("spawn", { pokemon: req.pokemon, at: req.at, nearPlayer: playerId(req.nearPlayer), battle: playerId(req.battle) }),
    give: (req) => action("give", { player: playerId(req.player), pokemon: req.pokemon, destination: req.destination }),
    startBattle: (player, entityId) => action("start_battle", { player: playerId(player), entity: entityId }),
    heal: (player) => action<undefined>("heal", { player: playerId(player) }).then(() => undefined),
    updatePokemon: (player, uuid, changes) => action("update_pokemon", { ...changes, player: playerId(player), uuid }),
    party: (player) => query("party", { player: playerId(player) }),
    pokedex: (player, species) => query("pokedex", { player: playerId(player), species }),
    nearby: (req) => query("nearby", { player: playerId(req.player), at: req.at, radius: req.radius }),
    species: (id) => query("species", { species: id }),
    spawnTable: (req) => {
      const r = req as { player?: PlayerLike; at?: Place; snack?: Place; bucket?: string; area?: boolean | { positions?: number } };
      return query("spawn_table", { player: playerId(r.player), at: r.at, snack: r.snack, bucket: r.bucket, area: r.area });
    },
    spawnDetail: (ids) => query("spawn_detail", { ids }),
    fishingTable: (player, bucket) => query("fishing_table", { player: playerId(player), bucket }),
    sprites: (pokemon) => query("sprites", { pokemon }),
    itemInfo: (ids) => query("item_info", { ids }),
    spawnEntries: async (species) => {
      // Por páginas: la lista entera no cabe en un mensaje.
      const ids: string[] = [];
      let offset: number | null = 0;
      while (offset !== null) {
        const page: { ids: string[]; next: number | null } = await query("spawn_entries", { species, offset });
        ids.push(...page.ids);
        offset = page.next;
      }
      return { ids };
    },
    hud: (player, content) => action("hud", { player: playerId(player), content: content ?? null }),
    spawnNpc: (req) => action("spawn_npc", { npc: req.npc, at: req.at, yaw: req.yaw, tag: req.tag }),
    despawnNpc: (entityId) => action<undefined>("despawn_npc", { entity: entityId }).then(() => undefined),
    npcMarker: (blockId, npcs, options) =>
      registerMarker(def.addon, "npcMarker", blockId, options?.state ?? `${def.addon}:npc`, options?.groupState, (index, at) => {
        const npc = npcs[index];
        return npc ? action<{ entityId: string }>("spawn_npc", { npc, at, tag: options?.tag }) : null;
      }),
    pokemonMarker: (blockId, pokemon, options) =>
      registerMarker(def.addon, "pokemonMarker", blockId, options?.state ?? `${def.addon}:pokemon`, options?.groupState, (index, at) => {
        const request = pokemon[index];
        return request ? action("spawn", { pokemon: request, at }) : null;
      }),
    markZone: (zone, at) => action("mark_zone", { zone, at }),
    zoneMarker: (blockId, zones, options) =>
      registerMarker(def.addon, "zoneMarker", blockId, options?.state ?? `${def.addon}:zone`, options?.groupState, (index, at) => {
        const entry = zones[index];
        if (!entry) return null;
        const list = Array.isArray(entry) ? entry : [entry];
        return Promise.all(list.map((zone) => action("mark_zone", { zone, at })));
      }),
  };
}

/** Startup has passed: block components can't be registered any more. */
let startupDone = false;
system.beforeEvents.startup.subscribe(() => {
  system.run(() => {
    startupDone = true;
  });
});

/**
 * A placeholder block (`npcMarker`, `pokemonMarker`, `zoneMarker`). When it ticks in the
 * world, it becomes air and calls `onIndex` with the number its states say.
 *
 * Air first, request after: a marker that stayed would ask again on every
 * tick, and if the NPC can't spawn there (no room), trying again won't help.
 */
function registerMarker(
  addon: string,
  method: string,
  blockId: string,
  state: string,
  groupState: string | undefined,
  onIndex: (index: number, at: Place) => Promise<unknown> | null
): void {
  if (startupDone) {
    console.warn(`[${addon}] ${method}("${blockId}") was called after startup; call it when your script loads`);
    return;
  }
  system.beforeEvents.startup.subscribe((init) => {
    init.blockComponentRegistry.registerCustomComponent(blockId, {
      onTick(event) {
        const block = event.block;
        let index: number;
        try {
          const states = block.permutation.getAllStates();
          const own = Number(states[state] ?? 0);
          const group = groupState ? Number(states[groupState] ?? 0) : 0;
          index = group * 16 + own;
          // A marker inside a pond stays water, not an air pocket.
          block.setType(block.isWaterlogged ? "minecraft:water" : "minecraft:air");
        } catch {
          return;
        }
        const { x, y, z } = block.location;
        const dimension = block.dimension.id.replace(/^minecraft:/, "") as Place["dimension"];
        const pending = onIndex(index, { dimension, x, y, z });
        if (!pending) {
          console.warn(`[${addon}] ${blockId}: nothing for number ${index}`);
          return;
        }
        pending.catch((err: unknown) => console.warn(`[${addon}] ${blockId}: ${String(err)}`));
      },
    });
  });
}

/**
 * Listens to a Cobblemon Bedrock event. Returns a function that stops
 * listening.
 *
 * The data is a summary, not the saved Pokémon record. If you put it in a chat
 * message, every parameter of a `rawtext` must be an object: a bare number
 * (the level) goes as `{ text: "10" }`.
 */
export function onCobblemonEvent<K extends keyof CobblemonEvents>(
  name: K,
  handler: (event: CobblemonEvents[K]) => void
): () => void {
  const id = `${EVENT_PREFIX}${name}`;
  const callback = system.afterEvents.scriptEventReceive.subscribe((event) => {
    if (event.id !== id) return;
    let data: CobblemonEvents[K];
    try {
      data = JSON.parse(event.message) as CobblemonEvents[K];
    } catch {
      return;
    }
    handler(data);
  });
  return () => system.afterEvents.scriptEventReceive.unsubscribe(callback);
}
