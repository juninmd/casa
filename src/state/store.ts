import { create } from "zustand";
import { fire, type Rule, type States } from "../core/automation";
import { classify } from "../core/classify";
import type { Classification, Entity, Host } from "../core/types";
import { DEMO_ENTITIES, DEMO_RULES, SCENES } from "../data/demo";
import { type ScanMode, scanLan } from "../platform/scan";
import { syncReal } from "./realSync";

export interface Scanned {
  host: Host;
  c: Classification;
}

interface Store {
  entities: Entity[];
  rules: Rule[];
  log: string[];
  scanned: Scanned[];
  scanning: boolean;
  scanMode: ScanMode | null;
  scanError: string | null;
  /** Last failure of a real command (device refused, offline...). */
  notice: string | null;
  /** Entities with a command in flight: not togglable and not overwritten by polling. */
  pending: Record<string, true>;
  /** Set by the providers store so a failed command can trigger a re-read. */
  refresher: () => void;
  setRefresher: (fn: () => void) => void;
  setNotice: (m: string | null) => void;
  setProviderEntities: (es: Entity[]) => void;
  sendReal: (prev: Entity[], next: Entity[]) => Promise<void>;
  toggle: (id: string) => void;
  applyScene: (id: string) => void;
  fireTime: (at: string) => void;
  toggleRule: (id: string) => void;
  scan: (prefix: string) => Promise<void>;
  importHost: (s: Scanned) => void;
}

const statesOf = (es: Entity[]): States => Object.fromEntries(es.map((e) => [e.id, e.on]));
const withStates = (es: Entity[], s: States): Entity[] =>
  es.map((e) => ({ ...e, on: s[e.id] ?? e.on }));
const keep = (log: string[], more: string[]) => [...more, ...log].slice(0, 30);
const canToggle = (e: Entity) =>
  e.kind !== "sensor" &&
  (e.source === "demo" || (e.source === "provider" && !!e.controllable && e.online));

export const useStore = create<Store>((set, get) => ({
  entities: DEMO_ENTITIES,
  rules: DEMO_RULES,
  log: [],
  scanned: [],
  scanning: false,
  scanMode: null,
  scanError: null,
  notice: null,
  pending: {},
  refresher: () => {},
  setRefresher: (refresher) => set({ refresher }),

  setNotice: (notice) => set({ notice }),

  setProviderEntities: (es) => {
    const { entities, pending } = get();
    const current = new Map(entities.map((e) => [e.id, e]));
    // A device being commanded keeps its optimistic state; the next poll will confirm it.
    const merged = es.map((e) => (pending[e.id] ? (current.get(e.id) ?? e) : e));
    set({ entities: [...entities.filter((e) => e.source !== "provider"), ...merged] });
  },

  toggle: (id) => {
    const { entities, rules, log } = get();
    const target = entities.find((e) => e.id === id);
    // LAN-imported entities have no integration yet, so they are read-only.
    if (!target || !canToggle(target) || get().pending[id]) return;
    const to = !target.on;
    const changed = entities.map((e) => (e.id === id ? { ...e, on: to } : e));
    const r = fire(statesOf(changed), rules, { type: "state", entity: id, to });
    const next = withStates(changed, r.states);
    set({ entities: next, log: keep(log, r.log), notice: null });
    void get().sendReal(entities, next);
  },

  applyScene: (id) => {
    const scene = SCENES.find((s) => s.id === id);
    if (!scene) return;
    const { entities, log } = get();
    const next = entities.map((e) =>
      e.id in scene.set ? { ...e, on: scene.set[e.id] ?? e.on } : e,
    );
    set({ entities: next, log: keep(log, [`Cena “${scene.name}” aplicada`]) });
    void get().sendReal(entities, next);
  },

  fireTime: (at) => {
    const { entities, rules, log } = get();
    const r = fire(statesOf(entities), rules, { type: "time", at });
    const next = withStates(entities, r.states);
    set({ entities: next, log: keep(log, [`Relógio simulado: ${at}`, ...r.log]) });
    void get().sendReal(entities, next);
  },

  sendReal: (prev, next) =>
    syncReal(prev, next, {
      patch: (id, patch) =>
        set({ entities: get().entities.map((e) => (e.id === id ? { ...e, ...patch } : e)) }),
      notify: (notice) => set({ notice }),
      busy: (id, on) => {
        const pending = { ...get().pending };
        if (on) pending[id] = true;
        else delete pending[id];
        set({ pending });
      },
      refresh: () => get().refresher(),
    }),

  toggleRule: (id) =>
    set({ rules: get().rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)) }),

  scan: async (prefix) => {
    set({ scanning: true, scanError: null });
    try {
      const { hosts, mode } = await scanLan(prefix);
      set({ scanned: hosts.map((host) => ({ host, c: classify(host) })), scanMode: mode });
    } catch (err) {
      set({ scanError: err instanceof Error ? err.message : String(err) });
    } finally {
      set({ scanning: false });
    }
  },

  importHost: ({ host, c }) => {
    const id = `lan-${host.ip}`;
    const { entities } = get();
    if (entities.some((e) => e.id === id)) return;
    const entity: Entity = {
      id,
      name: `${c.label} (${host.ip.split(".").pop()})`,
      kind: c.kind,
      room: "Rede",
      on: false,
      online: true,
      source: "lan",
      ip: host.ip,
    };
    set({ entities: [...entities, entity] });
  },
}));
