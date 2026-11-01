export type Kind =
  | "light"
  | "switch"
  | "camera"
  | "speaker"
  | "media"
  | "sensor"
  | "lock"
  | "router"
  | "phone"
  | "unknown";

export type Confidence = "alta" | "média" | "baixa";

/** Raw result of one LAN probe (what the Rust `scan_lan` command returns). */
export interface Host {
  ip: string;
  mac: string | null;
  ports: number[];
  hostname?: string | null;
  server?: string | null;
}

export interface Classification {
  kind: Kind;
  label: string;
  vendor: string;
  /** Integration a real implementation would need (null = nothing actionable). */
  integration: string | null;
  confidence: Confidence;
  reasons: string[];
}

export interface Entity {
  id: string;
  name: string;
  kind: Kind;
  room: string;
  on: boolean;
  online: boolean;
  source: "demo" | "lan" | "provider";
  ip?: string;
  /** Set for source "provider": which account owns the device and its id inside it. */
  providerId?: string;
  deviceId?: string;
  /** Provider devices only: false means read-only (sensors, locks, offline). */
  controllable?: boolean;
  /** Model, reading or offline reason. */
  detail?: string;
  /** Sensor reading, when the entity has one. */
  value?: number;
  unit?: string;
}
