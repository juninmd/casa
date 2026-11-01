import { describe, expect, test } from "bun:test";
import { fire, MAX_DEPTH, type Rule } from "./automation";

const rule = (over: Partial<Rule>): Rule => ({
  id: "r",
  name: "r",
  enabled: true,
  trigger: { type: "state", entity: "a", to: true },
  conditions: [],
  actions: [{ entity: "b", set: true }],
  ...over,
});

describe("automation engine", () => {
  test("matching trigger runs actions", () => {
    const r = fire({ a: true, b: false }, [rule({})], { type: "state", entity: "a", to: true });
    expect(r.states.b).toBe(true);
  });
  test("disabled rule and non-matching trigger do nothing", () => {
    const ev = { type: "state", entity: "a", to: true } as const;
    expect(fire({ b: false }, [rule({ enabled: false })], ev).states.b).toBe(false);
    expect(fire({ b: false }, [rule({})], { type: "state", entity: "a", to: false }).states.b).toBe(
      false,
    );
  });
  test("failing condition blocks the action and says why", () => {
    const r = fire(
      { b: false, door: false },
      [rule({ conditions: [{ entity: "door", is: true }] })],
      {
        type: "state",
        entity: "a",
        to: true,
      },
    );
    expect(r.states.b).toBe(false);
    expect(r.log.join()).toContain("condição não satisfeita");
  });
  test("time trigger fires on matching HH:MM only", () => {
    const t = rule({ trigger: { type: "time", at: "22:00" } });
    expect(fire({ b: false }, [t], { type: "time", at: "22:00" }).states.b).toBe(true);
    expect(fire({ b: false }, [t], { type: "time", at: "22:01" }).states.b).toBe(false);
  });
  test("cascade: A flips B, B flips C", () => {
    const rules = [
      rule({}),
      rule({
        id: "2",
        name: "2",
        trigger: { type: "state", entity: "b", to: true },
        actions: [{ entity: "c", set: true }],
      }),
    ];
    expect(fire({}, rules, { type: "state", entity: "a", to: true }).states.c).toBe(true);
  });
  test("ping-pong loop terminates at MAX_DEPTH instead of hanging", () => {
    const on = rule({
      trigger: { type: "state", entity: "a", to: true },
      actions: [{ entity: "a", set: false }],
    });
    const off = rule({
      id: "2",
      name: "off",
      trigger: { type: "state", entity: "a", to: false },
      actions: [{ entity: "a", set: true }],
    });
    const r = fire({ a: true }, [on, off], { type: "state", entity: "a", to: true });
    expect(r.log.join()).toContain(`limite de ${MAX_DEPTH}`);
  });
  test("does not mutate the input state", () => {
    const s = { a: true, b: false };
    fire(s, [rule({})], { type: "state", entity: "a", to: true });
    expect(s.b).toBe(false);
  });
});
