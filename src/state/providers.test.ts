import { describe, expect, mock, test } from "bun:test";
import type { DeviceDto, ProviderView } from "../platform/providers";

const provider: ProviderView = {
  id: "p1",
  kind: "tapo",
  label: "Sala",
  hosts: ["192.168.0.5"],
  allowSelfSigned: false,
  hasCredentials: true,
};
const device: DeviceDto = {
  id: "d1",
  providerId: "p1",
  name: "Lâmpada",
  kind: "light",
  on: true,
  online: true,
  controllable: true,
  detail: null,
};

let providers: ProviderView[] = [provider];
let releaseListing: (() => void) | null = null;

mock.module("../platform/providers", () => ({
  errText: (e: unknown) => String(e),
  listProviders: async () => providers,
  removeProvider: async () => {
    providers = [];
  },
  saveProvider: async () => provider,
  setPower: async () => {},
  // The first poll stays in flight until the test releases it.
  listDevices: () =>
    new Promise((resolve) => {
      releaseListing = () => resolve({ devices: [device], errors: [] });
    }),
}));

const { useProviders } = await import("./providers");
const { useStore } = await import("./store");

describe("providers refresh", () => {
  test("a poll in flight when the last provider is removed cannot bring its devices back", async () => {
    useProviders.setState({ providers: [provider] });
    const inFlight = useProviders.getState().refresh();

    providers = [];
    useProviders.setState({ providers: [] });
    await useProviders.getState().refresh(); // what remove() -> load() ends up doing

    releaseListing?.();
    await inFlight;

    expect(useStore.getState().entities.some((e) => e.source === "provider")).toBe(false);
    expect(useProviders.getState().refreshing).toBe(false);
  });
});
