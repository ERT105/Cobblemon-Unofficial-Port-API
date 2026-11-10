/**
 * `cooblemon-api`: lo que un add-on necesita para registrarse en Cooblemon y
 * escuchar sus eventos (guía en `docs/README.md`, formatos en `docs/REFERENCIA.md`).
 *
 * ```js
 * import { registerAddon, onCooblemonEvent } from "./cooblemon-api.js";
 *
 * registerAddon({ addon: "miaddon", version: "1.0.0", species: [...], spawn: {...} });
 * onCooblemonEvent("captured", (e) => console.warn(`${e.player.name} capturó ${e.pokemon.species}`));
 * ```
 *
 * Se incluye en el script del add-on (no hay nada que instalar en el mundo
 * aparte de Cooblemon). Solo depende de `@minecraft/server`.
 */
import { API_VERSION } from "./protocol.generated.js";
import type { AddonDefinition, CooblemonEvents } from "./types.js";
export * from "./types.js";
export { API_VERSION };
/**
 * Registra el add-on en Cooblemon.
 *
 * Envía al cargar el mundo y cada vez que Cooblemon pregunta (`ping`), así da
 * igual qué script arranque antes. Cada paquete se parte al tamaño de mensaje
 * que Cooblemon mide y anuncia. La respuesta (`ack`), con los errores y avisos
 * de la validación, va al registro de contenido salvo que se pase `onAck`.
 */
export declare function registerAddon(def: AddonDefinition): void;
/**
 * Escucha un evento de Cooblemon (§9). Devuelve una función que deja de
 * escucharlo.
 *
 * Los datos son un resumen, no la ficha guardada. Si los pones en un mensaje
 * del chat, cada parámetro de un `rawtext` tiene que ser un objeto: un número
 * suelto (el nivel) va como `{ text: "10" }`.
 */
export declare function onCooblemonEvent<K extends keyof CooblemonEvents>(name: K, handler: (event: CooblemonEvents[K]) => void): () => void;
