/**
 * `cobblemon-bedrock-api`: lo que un add-on necesita para registrarse en Cobblemon Bedrock y
 * escuchar sus eventos (guía en `docs/README.md`, formatos en `docs/REFERENCIA.md`).
 *
 * ```js
 * import { registerAddon, onCobblemonEvent } from "./cobblemon-bedrock-api.js";
 *
 * registerAddon({ addon: "miaddon", version: "1.0.0", species: [...], spawn: {...} });
 * onCobblemonEvent("captured", (e) => console.warn(`${e.player.name} capturó ${e.pokemon.species}`));
 * ```
 *
 * Se incluye en el script del add-on (no hay nada que instalar en el mundo
 * aparte de Cobblemon Bedrock). Solo depende de `@minecraft/server`.
 */

import { system, world } from "@minecraft/server";
import { API_VERSION, ApiEvents, EVENT_PREFIX } from "./protocol.generated.js";
import type { Ack, AddonDefinition, CobblemonEvents } from "./types.js";

export * from "./types.js";
export { API_VERSION };

/** Trozo por defecto, hasta que Cobblemon Bedrock diga cuánto cabe en un mensaje. */
const DEFAULT_CHUNK = 1500;

function send(id: string, payload: unknown): void {
  system.sendScriptEvent(id, JSON.stringify(payload));
}

/**
 * Registra el add-on en Cobblemon Bedrock.
 *
 * Envía al cargar el mundo y cada vez que Cobblemon Bedrock pregunta (`ping`), así da
 * igual qué script arranque antes. Cada paquete se parte al tamaño de mensaje
 * que Cobblemon Bedrock mide y anuncia. La respuesta (`ack`), con los errores y avisos
 * de la validación, va al registro de contenido salvo que se pase `onAck`.
 */
export function registerAddon(def: AddonDefinition): void {
  if (!/^[a-z0-9_]+$/.test(def.addon) || def.addon === "cooblemon" || def.addon === "minecraft") {
    throw new Error(`cobblemon-bedrock-api: «${def.addon}» no vale como espacio de nombres (minúsculas, cifras y _)`);
  }
  let chunk = DEFAULT_CHUNK;

  /**
   * Parte un paquete. El trozo va como texto dentro de otro JSON, que escapa
   * comillas y barras: con la mitad del máximo por trozo siempre cabe.
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
    // Las especies antes que sus apariciones y evoluciones: Cobblemon Bedrock comprueba que existan.
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
        // Sin medida: el trozo por defecto.
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
      if (ack.ok) console.warn(`[${def.addon}] registrado en Cobblemon Bedrock (API ${ack.api}): ${def.species?.length ?? 0} especies`);
      for (const e of ack.errors) console.warn(`[${def.addon}] error: ${e}`);
      for (const w of ack.warnings) console.warn(`[${def.addon}] aviso: ${w}`);
    }
  });

  // Por si Cobblemon Bedrock ya estaba escuchando cuando arrancamos.
  world.afterEvents.worldLoad.subscribe(() => system.run(register));
}

/**
 * Escucha un evento de Cobblemon Bedrock (§9). Devuelve una función que deja de
 * escucharlo.
 *
 * Los datos son un resumen, no la ficha guardada. Si los pones en un mensaje
 * del chat, cada parámetro de un `rawtext` tiene que ser un objeto: un número
 * suelto (el nivel) va como `{ text: "10" }`.
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
