/**
 * Generated from the Cobblemon Bedrock protocol: do not edit here.
 * Message ids and API version shared by Cobblemon Bedrock and this library
 * (`docs/REFERENCE.md`).
 */
export declare const API_VERSION = 1;
export declare const ApiEvents: {
    readonly HELLO: "cooblemon:api.hello";
    readonly PART: "cooblemon:api.part";
    readonly DONE: "cooblemon:api.done";
    readonly PING: "cooblemon:api.ping";
    readonly ACK: "cooblemon:api.ack";
    readonly PROBE: "cooblemon:api.probe";
};
export declare const EVENT_PREFIX = "cooblemon:event.";
export type ApiKind = "species" | "spawn" | "sprites" | "evolutions";
export interface ApiHello {
    addon: string;
    api: number;
    version?: string;
}
export interface ApiPart {
    addon: string;
    kind: ApiKind;
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
export interface ApiSpawnPacket {
    entries: unknown[];
    levels?: Record<string, {
        min: number;
        max: number;
    }>;
}
