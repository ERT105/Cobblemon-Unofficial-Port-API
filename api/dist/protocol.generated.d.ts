/**
 * Generated from the Cobblemon Bedrock protocol: do not edit here.
 * Message ids and API version shared by Cobblemon Bedrock and this library
 * (`docs/REFERENCE.md`).
 */
export declare const API_VERSION = 2;
export declare const ApiEvents: {
    readonly HELLO: "cooblemon:api.hello";
    readonly PART: "cooblemon:api.part";
    readonly DONE: "cooblemon:api.done";
    readonly PING: "cooblemon:api.ping";
    readonly ACK: "cooblemon:api.ack";
    readonly PROBE: "cooblemon:api.probe";
    readonly ACTION: "cooblemon:api.action";
    readonly QUERY: "cooblemon:api.query";
    readonly RESULT: "cooblemon:api.result";
};
export interface ApiRequest {
    addon: string;
    id: string;
    action?: string;
    query?: string;
    [field: string]: unknown;
}
export interface ApiResult {
    addon: string;
    id: string;
    ok: boolean;
    error?: string;
    data?: unknown;
}
export declare const EVENT_PREFIX = "cooblemon:event.";
export type ApiKind = "moves" | "species" | "additions" | "spawn" | "sprites" | "evolutions" | "megas" | "party_items" | "npcs" | "zones" | "ui";
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
