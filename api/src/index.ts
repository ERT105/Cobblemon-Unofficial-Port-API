/**
 * `cobblemon-bedrock-api`: what an add-on needs to register with Cobblemon
 * Bedrock and listen to its events (guide in `docs/README.md`, formats in
 * `docs/REFERENCE.md`).
 *
 * ```js
 * import { registerAddon, onCobblemonEvent } from "./cobblemon-bedrock-api.js";
 *
 * registerAddon({ addon: "myaddon", version: "1.0.0", species: [...], spawn: {...} });
 * onCobblemonEvent("captured", (e) => console.warn(`${e.player.name} caught ${e.pokemon.species}`));
 * ```
 *
 * It's bundled into the add-on's script (nothing else to install in the world
 * besides Cobblemon Bedrock). Its only dependency is `@minecraft/server`.
 */

import { system, world } from "@minecraft/server";
import { API_VERSION, ApiEvents, EVENT_PREFIX } from "./protocol.generated.js";
import type { Ack, AddonDefinition, CobblemonEvents } from "./types.js";

export * from "./types.js";
export { API_VERSION };

/** Default chunk size, until Cobblemon Bedrock says how much fits in a message. */
const DEFAULT_CHUNK = 1500;

function send(id: string, payload: unknown): void {
  system.sendScriptEvent(id, JSON.stringify(payload));
}

/**
 * Registers the add-on with Cobblemon Bedrock.
 *
 * Sends on world load and every time Cobblemon Bedrock asks (`ping`), so it
 * doesn't matter which script starts first. Each packet is split to the
 * message size Cobblemon Bedrock measures and announces. The reply (`ack`),
 * with the validation errors and warnings, goes to the content log unless
 * `onAck` is given.
 */
export function registerAddon(def: AddonDefinition): void {
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
    // Species before their spawns and evolutions: Cobblemon Bedrock checks that they exist.
    for (const species of def.species ?? []) sendPacket("species", species.id, species);
    if (def.spawn?.entries.length) sendPacket("spawn", "spawn", def.spawn);
    if (def.sprites && Object.keys(def.sprites).length) sendPacket("sprites", "sprites", def.sprites);
    if (def.evolutions && Object.keys(def.evolutions).length) sendPacket("evolutions", "evolutions", def.evolutions);
    send(ApiEvents.DONE, { addon: def.addon });
  };

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
    if (event.id === ApiEvents.ACK) {
      let ack: Ack;
      try {
        ack = JSON.parse(event.message) as Ack;
      } catch {
        return;
      }
      if (ack.addon !== def.addon) return;
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
