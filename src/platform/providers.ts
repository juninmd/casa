import { invoke, isTauri } from "@tauri-apps/api/core";
import type { Kind } from "../core/types";

export type ProviderKind = "tapo" | "homeassistant";

/** Non-secret settings, as stored by the backend. */
export interface ProviderConfig {
  id: string;
  kind: ProviderKind;
  label: string;
  hosts: string[];
  baseUrl?: string | null;
  allowSelfSigned: boolean;
}

export interface ProviderView extends ProviderConfig {
  /** The webview only ever learns whether a credential exists, never its value. */
  hasCredentials: boolean;
}

export interface DeviceDto {
  id: string;
  providerId: string;
  name: string;
  kind: Kind;
  on: boolean;
  online: boolean;
  controllable: boolean;
  detail: string | null;
}

export interface Listing {
  devices: DeviceDto[];
  errors: { providerId: string; message: string }[];
}

export interface TestReport {
  ok: boolean;
  message: string;
  devices: number;
}

export const providersAvailable = () => isTauri();

const needNative = () =>
  Promise.reject(new Error("Provedores só funcionam no app desktop (Tauri), não no navegador."));

export const listProviders = (): Promise<ProviderView[]> =>
  isTauri() ? invoke("providers_list") : Promise.resolve([]);

export const saveProvider = (
  config: ProviderConfig,
  username: string | null,
  secret: string | null,
): Promise<ProviderView> =>
  isTauri() ? invoke("provider_save", { config, username, secret }) : needNative();

export const removeProvider = (id: string): Promise<void> =>
  isTauri() ? invoke("provider_remove", { id }) : needNative();

export const testProvider = (id: string): Promise<TestReport> =>
  isTauri() ? invoke("provider_test", { id }) : needNative();

export const listDevices = (): Promise<Listing> =>
  isTauri() ? invoke("devices_list") : Promise.resolve({ devices: [], errors: [] });

export const setPower = (providerId: string, deviceId: string, on: boolean): Promise<DeviceDto> =>
  isTauri() ? invoke("device_set_power", { providerId, deviceId, on }) : needNative();

/** Tauri rejects with a plain string; browsers/our code reject with Error. */
export const errText = (e: unknown): string =>
  typeof e === "string" ? e : e instanceof Error ? e.message : String(e);
