// Generado a partir del protocolo de Cobblemon Bedrock — no editar aquí.

/**
 * El protocolo con el que los add-ons hablan con Cobblemon Bedrock
 * (`docs/REFERENCIA.md`). Lo comparten el registro de la base y, más
 * adelante, la librería `cobblemon-bedrock-api` que usan los creadores: cualquier
 * cambio aquí es un cambio de la API.
 */

/** Versión de la API. Sube solo si un cambio rompe a los add-ons (§7.3). */
export const API_VERSION = 1;

export const ApiEvents = {
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
  PROBE: "cooblemon:api.probe",
} as const;

/** Prefijo de los eventos que anuncia la base (§9): `cooblemon:event.captured`… */
export const EVENT_PREFIX = "cooblemon:event.";

/** Qué se puede registrar en la fase 1 (§5.4). */
export type ApiKind = "species" | "spawn" | "sprites" | "evolutions";

export interface ApiHello {
  addon: string;
  api: number;
  version?: string;
}

/**
 * Un trozo. Los mensajes de `scriptevent` son cortos, así que cada paquete se
 * parte en `of` trozos de texto JSON que la base vuelve a juntar.
 */
export interface ApiPart {
  addon: string;
  kind: ApiKind;
  /** Lo que identifica el paquete dentro de su clase: el id de la especie, `spawn`… */
  key: string;
  seq: number;
  of: number;
  data: string;
}

export interface ApiAck {
  addon: string;
  api: number;
  ok: boolean;
  errors: string[];
  warnings: string[];
}

/** Paquete `spawn`: entradas del pool y rango de niveles por especie. */
export interface ApiSpawnPacket {
  entries: unknown[];
  levels?: Record<string, { min: number; max: number }>;
}
