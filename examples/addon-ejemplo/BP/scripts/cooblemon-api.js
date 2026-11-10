// packages/api/src/index.ts
import { system, world } from "@minecraft/server";

// packages/api/src/protocol.generated.ts
var API_VERSION = 1;
var ApiEvents = {
  /** Add-on → base: `{ addon, api, version }`. */
  HELLO: "cooblemon:api.hello",
  /** Add-on → base: un trozo de un paquete de datos (`ApiPart`). */
  PART: "cooblemon:api.part",
  /** Add-on → base: `{ addon }`, terminó de enviar. */
  DONE: "cooblemon:api.done",
  /**
   * Base → add-ons: «quién hay»; cada uno vuelve a presentarse y enviar.
   * `{ api, maxMessage? }`: el mensaje más largo que llega entero, para trocear.
   */
  PING: "cooblemon:api.ping",
  /** Base → add-on: `{ addon, api, ok, errors, warnings }`. */
  ACK: "cooblemon:api.ack",
  /** Base → base: mensajes de prueba para medir el tamaño máximo. Los demás lo ignoran. */
  PROBE: "cooblemon:api.probe"
};
var EVENT_PREFIX = "cooblemon:event.";

// packages/api/src/index.ts
var DEFAULT_CHUNK = 1500;
function send(id, payload) {
  system.sendScriptEvent(id, JSON.stringify(payload));
}
function registerAddon(def) {
  if (!/^[a-z0-9_]+$/.test(def.addon) || def.addon === "cooblemon" || def.addon === "minecraft") {
    throw new Error(`cooblemon-api: \xAB${def.addon}\xBB no vale como espacio de nombres (min\xFAsculas, cifras y _)`);
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
    for (const species of def.species ?? []) sendPacket("species", species.id, species);
    if (def.spawn?.entries.length) sendPacket("spawn", "spawn", def.spawn);
    if (def.sprites && Object.keys(def.sprites).length) sendPacket("sprites", "sprites", def.sprites);
    if (def.evolutions && Object.keys(def.evolutions).length) sendPacket("evolutions", "evolutions", def.evolutions);
    send(ApiEvents.DONE, { addon: def.addon });
  };
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
    if (event.id === ApiEvents.ACK) {
      let ack;
      try {
        ack = JSON.parse(event.message);
      } catch {
        return;
      }
      if (ack.addon !== def.addon) return;
      if (def.onAck) {
        def.onAck(ack);
        return;
      }
      if (ack.ok) console.warn(`[${def.addon}] registrado en Cooblemon (API ${ack.api}): ${def.species?.length ?? 0} especies`);
      for (const e of ack.errors) console.warn(`[${def.addon}] error: ${e}`);
      for (const w of ack.warnings) console.warn(`[${def.addon}] aviso: ${w}`);
    }
  });
  world.afterEvents.worldLoad.subscribe(() => system.run(register));
}
function onCooblemonEvent(name, handler) {
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
  onCooblemonEvent,
  registerAddon
};
