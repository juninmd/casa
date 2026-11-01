import { useMemo } from "react";
import { create } from "zustand";
import type { Entity } from "../core/types";
import {
  type DeviceDto,
  errText,
  listDevices,
  listProviders,
  type ProviderConfig,
  type ProviderView,
  removeProvider,
  saveProvider,
} from "../platform/providers";
import { useStore } from "./store";

const PREF = "casa.showDemo";

function readPref(): boolean | null {
  try {
    const v = localStorage.getItem(PREF);
    return v === null ? null : v === "1";
  } catch {
    return null; // storage can be blocked; the UI must work without it
  }
}

interface ProvidersStore {
  providers: ProviderView[];
  errors: Record<string, string>;
  loaded: boolean;
  refreshing: boolean;
  showDemo: boolean;
  load: () => Promise<void>;
  refresh: () => Promise<void>;
  save: (c: ProviderConfig, username: string | null, secret: string | null) => Promise<void>;
  remove: (id: string) => Promise<void>;
  setShowDemo: (v: boolean) => void;
}

export function toEntity(d: DeviceDto, room: string): Entity {
  return {
    id: `${d.providerId}:${d.id}`,
    name: d.name,
    kind: d.kind,
    room,
    on: d.on,
    online: d.online,
    source: "provider",
    providerId: d.providerId,
    deviceId: d.id,
    controllable: d.controllable,
    detail: d.detail ?? undefined,
  };
}

export const useProviders = create<ProvidersStore>((set, get) => ({
  providers: [],
  errors: {},
  loaded: false,
  refreshing: false,
  showDemo: readPref() ?? true,

  load: async () => {
    try {
      const providers = await listProviders();
      // First run with real accounts: hide the demo devices unless the user chose otherwise.
      const showDemo = readPref() ?? providers.length === 0;
      set({ providers, loaded: true, showDemo });
      await get().refresh();
    } catch (e) {
      set({ loaded: true, errors: { _: errText(e) } });
    }
  },

  refresh: async () => {
    if (get().providers.length === 0) {
      useStore.getState().setProviderEntities([]);
      set({ errors: {} });
      return;
    }
    set({ refreshing: true });
    try {
      const { devices, errors } = await listDevices();
      const labels = new Map(get().providers.map((p) => [p.id, p.label]));
      useStore
        .getState()
        .setProviderEntities(devices.map((d) => toEntity(d, labels.get(d.providerId) ?? "Casa")));
      set({ errors: Object.fromEntries(errors.map((x) => [x.providerId, x.message])) });
    } catch (e) {
      set({ errors: { _: errText(e) } });
    } finally {
      set({ refreshing: false });
    }
  },

  save: async (config, username, secret) => {
    await saveProvider(config, username, secret);
    await get().load();
  },

  remove: async (id) => {
    await removeProvider(id);
    await get().load();
  },

  setShowDemo: (showDemo) => {
    try {
      localStorage.setItem(PREF, showDemo ? "1" : "0");
    } catch {
      /* preference is a convenience only */
    }
    set({ showDemo });
  },
}));

export function useVisibleEntities(): Entity[] {
  const entities = useStore((s) => s.entities);
  const showDemo = useProviders((s) => s.showDemo);
  return useMemo(
    () => entities.filter((e) => showDemo || e.source !== "demo"),
    [entities, showDemo],
  );
}

// A failed command asks for a fresh read instead of guessing the device state.
useStore.getState().setRefresher(() => void useProviders.getState().refresh());
