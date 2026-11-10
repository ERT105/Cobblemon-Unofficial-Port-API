/**
 * El protocolo con el que los add-ons hablan con Cooblemon
 * (`docs/REFERENCIA.md`). Lo comparten el registro de la base y, más
 * adelante, la librería `cooblemon-api` que usan los creadores: cualquier
 * cambio aquí es un cambio de la API.
 */
/** Versión de la API. Sube solo si un cambio rompe a los add-ons (§7.3). */
export declare const API_VERSION = 1;
export declare const ApiEvents: {
    /** Add-on → base: `{ addon, api, version }`. */
    readonly HELLO: "cooblemon:api.hello";
    /** Add-on → base: un trozo de un paquete de datos (`ApiPart`). */
    readonly PART: "cooblemon:api.part";
    /** Add-on → base: `{ addon }`, terminó de enviar. */
    readonly DONE: "cooblemon:api.done";
    /**
     * Base → add-ons: «quién hay»; cada uno vuelve a presentarse y enviar.
     * `{ api, maxMessage? }`: el mensaje más largo que llega entero, para trocear.
     */
    readonly PING: "cooblemon:api.ping";
    /** Base → add-on: `{ addon, api, ok, errors, warnings }`. */
    readonly ACK: "cooblemon:api.ack";
    /** Base → base: mensajes de prueba para medir el tamaño máximo. Los demás lo ignoran. */
    readonly PROBE: "cooblemon:api.probe";
};
/** Prefijo de los eventos que anuncia la base (§9): `cooblemon:event.captured`… */
export declare const EVENT_PREFIX = "cooblemon:event.";
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
    levels?: Record<string, {
        min: number;
        max: number;
    }>;
}
