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
import { API_VERSION } from "./protocol.generated.js";
import type { AddonDefinition, CobblemonEvents } from "./types.js";
export * from "./types.js";
export { API_VERSION };
/**
 * Registra el add-on en Cobblemon Bedrock.
 *
 * Envía al cargar el mundo y cada vez que Cobblemon Bedrock pregunta (`ping`), así da
 * igual qué script arranque antes. Cada paquete se parte al tamaño de mensaje
 * que Cobblemon Bedrock mide y anuncia. La respuesta (`ack`), con los errores y avisos
 * de la validación, va al registro de contenido salvo que se pase `onAck`.
 */
export declare function registerAddon(def: AddonDefinition): void;
/**
 * Escucha un evento de Cobblemon Bedrock (§9). Devuelve una función que deja de
 * escucharlo.
 *
 * Los datos son un resumen, no la ficha guardada. Si los pones en un mensaje
 * del chat, cada parámetro de un `rawtext` tiene que ser un objeto: un número
 * suelto (el nivel) va como `{ text: "10" }`.
 */
export declare function onCobblemonEvent<K extends keyof CobblemonEvents>(name: K, handler: (event: CobblemonEvents[K]) => void): () => void;
