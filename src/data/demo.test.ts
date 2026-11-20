import { describe, expect, test } from "bun:test";
import { availableScenes, DEMO_ENTITIES, SCENES } from "./demo";

describe("availableScenes", () => {
  test("with the demo devices visible every scene is offered", () => {
    expect(availableScenes(DEMO_ENTITIES)).toEqual(SCENES);
  });

  test("with only real devices (demo hidden) no scene is offered, since none would change anything", () => {
    expect(availableScenes([{ id: "tapo-1:abc" }])).toEqual([]);
  });

  test("a scene stays while any of its devices is visible", () => {
    expect(availableScenes([{ id: "sala-tv" }]).map((s) => s.id)).toEqual(["cinema"]);
  });
});
