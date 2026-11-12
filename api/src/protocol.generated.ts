/**
 * Generated from the Cobblemon Bedrock protocol: do not edit here.
 * Message ids and API version shared by Cobblemon Bedrock and this library
 * (`docs/REFERENCE.md`).
 */

export const API_VERSION = 1;

export const ApiEvents = {
    HELLO: "cooblemon:api.hello",
    PART: "cooblemon:api.part",
    DONE: "cooblemon:api.done",
    PING: "cooblemon:api.ping",
    ACK: "cooblemon:api.ack",
    PROBE: "cooblemon:api.probe",
    ACTION: "cooblemon:api.action",
    QUERY: "cooblemon:api.query",
    RESULT: "cooblemon:api.result",
} as const;

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

export const EVENT_PREFIX = "cooblemon:event.";

export type ApiKind = "moves" | "species" | "additions" | "spawn" | "sprites" | "evolutions" | "megas" | "party_items";

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
  levels?: Record<string, { min: number; max: number }>;
}
