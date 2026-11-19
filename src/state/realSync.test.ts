import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { Entity } from "../core/types";
import type { DeviceDto } from "../platform/providers";

const calls: string[] = [];
let failFor = "";
let polls: Array<(r: { devices: DeviceDto[]; errors: [] }) => void> = [];

mock.module("../platform/providers", () => ({
  errText: (e: unknown) => (e instanceof Error ? e.message : String(e)),
  // Each poll stays on the wire until the test resolves it, to reproduce overlapping reads.
  listDevices: () => new Promise((resolve) => polls.push(resolve as never)),
  listProviders: async () => [],
  saveProvider: async () => ({}),
  removeProvider: async () => {},
  setPower: async (providerId: string, deviceId: string, on: boolean) => {
    calls.push(`${providerId}/${deviceId}=${on}`);
    if (deviceId === failFor) throw new Error("recusado");
    return { id: deviceId, on, online: true, detail: "P110" };
  },
}));

const { syncReal } = await import("./realSync");
const { useProviders } = await import("./providers");
const { useStore } = await import("./store");

const ent = (id: string, over: Partial<Entity> = {}): Entity => ({
  id,
  name: id,
  kind: "switch",
  room: "r",
  on: false,
  online: true,
  source: "provider",
  providerId: "p",
  deviceId: id,
  controllable: true,
  ...over,
});

function hooks() {
  const log = {
    patches: {} as Record<string, Partial<Entity>>,
    notes: [] as string[],
    busy: [] as string[],
    refreshed: 0,
  };
  return {
    log,
    h: {
      patch: (id: string, p: Partial<Entity>) => {
        log.patches[id] = p;
      },
      notify: (m: string) => log.notes.push(m),
      busy: (id: string, on: boolean) => log.busy.push(`${id}:${on}`),
      refresh: () => {
        log.refreshed++;
      },
    },
  };
}

describe("syncReal", () => {
  beforeEach(() => {
    calls.length = 0;
    failFor = "";
  });

  test("sends only provider entities that actually changed", async () => {
    const prev = [
      ent("a"),
      ent("b"),
      ent("d", { source: "demo" }),
      ent("ro", { controllable: false }),
    ];
    const next = [
      ent("a", { on: true }),
      ent("b"),
      ent("d", { source: "demo", on: true }),
      ent("ro", { controllable: false, on: true }),
    ];
    await syncReal(prev, next, hooks().h);
    expect(calls).toEqual(["p/a=true"]);
  });

  test("a rule cascade that flips two real devices sends two commands", async () => {
    const { h, log } = hooks();
    await syncReal([ent("a"), ent("b")], [ent("a", { on: true }), ent("b", { on: true })], h);
    expect(calls.sort()).toEqual(["p/a=true", "p/b=true"]);
    expect(log.patches.a?.on).toBe(true);
    expect(log.patches.b?.on).toBe(true);
  });

  test("a refused command restores the previous state, explains why and asks for a re-read", async () => {
    failFor = "a";
    const { h, log } = hooks();
    await syncReal([ent("a", { on: false })], [ent("a", { on: true })], h);
    expect(log.patches.a).toEqual({ on: false });
    expect(log.notes).toEqual(["a: recusado"]);
    expect(log.refreshed).toBe(1);
  });

  test("busy is raised before the call and always released, even on failure", async () => {
    failFor = "a";
    const { h, log } = hooks();
    await syncReal([ent("a"), ent("b")], [ent("a", { on: true }), ent("b", { on: true })], h);
    expect(log.busy.filter((x) => x.startsWith("a:"))).toEqual(["a:true", "a:false"]);
    expect(log.busy.filter((x) => x.startsWith("b:"))).toEqual(["b:true", "b:false"]);
  });

  test("one device failing does not undo the others", async () => {
    failFor = "a";
    const { h, log } = hooks();
    await syncReal([ent("a"), ent("b")], [ent("a", { on: true }), ent("b", { on: true })], h);
    expect(log.patches.a?.on).toBe(false);
    expect(log.patches.b?.on).toBe(true);
  });
});

describe("refresh racing with commands", () => {
  const dto = (on: boolean): DeviceDto => ({
    id: "d1",
    providerId: "p1",
    name: "Plug",
    kind: "switch",
    on,
    online: true,
    controllable: true,
    detail: null,
  });
  const plugOn = () => useStore.getState().entities.find((e) => e.id === "p1:d1")?.on;

  beforeEach(() => {
    polls = [];
    useStore.setState({ entities: [ent("p1:d1", { on: true })], pending: {}, commandEpoch: 0 });
    useProviders.setState({
      providers: [
        {
          id: "p1",
          kind: "tapo",
          label: "Casa",
          hosts: [],
          allowSelfSigned: false,
          hasCredentials: true,
        },
      ],
      refreshing: false,
    });
  });

  test("applies the snapshot when nothing raced with it", async () => {
    const p = useProviders.getState().refresh();
    polls[0]?.({ devices: [dto(false)], errors: [] });
    await p;
    expect(plugOn()).toBe(false);
  });

  test("discards a snapshot read while a command started and finished", async () => {
    const p = useProviders.getState().refresh();
    useStore.setState({ commandEpoch: useStore.getState().commandEpoch + 2 });
    polls[0]?.({ devices: [dto(false)], errors: [] });
    await p;
    expect(plugOn()).toBe(true); // stale read must not flip the toggled device back
  });

  test("an older poll never overwrites a newer one", async () => {
    const older = useProviders.getState().refresh();
    const newer = useProviders.getState().refresh();
    polls[1]?.({ devices: [dto(false)], errors: [] });
    await newer;
    polls[0]?.({ devices: [dto(true)], errors: [] });
    await older;
    expect(plugOn()).toBe(false);
    expect(useProviders.getState().refreshing).toBe(false);
  });
});
