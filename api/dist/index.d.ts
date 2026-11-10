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
import { API_VERSION } from "./protocol.generated.js";
import type { AddonDefinition, CobblemonEvents } from "./types.js";
export * from "./types.js";
export { API_VERSION };
/**
 * Registers the add-on with Cobblemon Bedrock.
 *
 * Sends on world load and every time Cobblemon Bedrock asks (`ping`), so it
 * doesn't matter which script starts first. Each packet is split to the
 * message size Cobblemon Bedrock measures and announces. The reply (`ack`),
 * with the validation errors and warnings, goes to the content log unless
 * `onAck` is given.
 */
export declare function registerAddon(def: AddonDefinition): void;
/**
 * Listens to a Cobblemon Bedrock event. Returns a function that stops
 * listening.
 *
 * The data is a summary, not the saved Pokémon record. If you put it in a chat
 * message, every parameter of a `rawtext` must be an object: a bare number
 * (the level) goes as `{ text: "10" }`.
 */
export declare function onCobblemonEvent<K extends keyof CobblemonEvents>(name: K, handler: (event: CobblemonEvents[K]) => void): () => void;
