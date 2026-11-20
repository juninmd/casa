import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { Entity } from "../core/types";
import { DeviceCard } from "./DeviceCard";

const plug: Entity = {
  id: "p1:d1",
  name: "Tomada",
  kind: "switch",
  room: "Sala",
  on: false,
  online: true,
  source: "provider",
  controllable: true,
};

describe("DeviceCard busy state", () => {
  test("idle card shows the state and no busy flag", () => {
    const html = renderToStaticMarkup(<DeviceCard entity={plug} onToggle={() => {}} />);
    expect(html).toContain("Desligado");
    expect(html).not.toContain("aria-busy");
  });

  test("pending command is announced and visible instead of a silent no-op tap", () => {
    const html = renderToStaticMarkup(<DeviceCard entity={plug} onToggle={() => {}} busy />);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("Enviando…");
  });
});
