export type Trigger = { type: "state"; entity: string; to: boolean } | { type: "time"; at: string };

export interface Rule {
  id: string;
  name: string;
  enabled: boolean;
  trigger: Trigger;
  /** All must hold (AND) against the state at the moment the trigger fires. */
  conditions: { entity: string; is: boolean }[];
  actions: { entity: string; set: boolean }[];
}

export type AutomationEvent =
  | { type: "state"; entity: string; to: boolean }
  | { type: "time"; at: string };

export type States = Record<string, boolean>;

export interface FireResult {
  states: States;
  log: string[];
}

/** Cascades (rule A flips X, which fires rule B...) stop here so a loop can't hang the UI. */
export const MAX_DEPTH = 5;

function matches(t: Trigger, e: AutomationEvent): boolean {
  if (t.type === "state" && e.type === "state") return t.entity === e.entity && t.to === e.to;
  if (t.type === "time" && e.type === "time") return t.at === e.at;
  return false;
}

/** Pure. `states` must already include the change that produced `event`; applies every rule it (transitively) triggers. */
export function fire(states: States, rules: Rule[], event: AutomationEvent): FireResult {
  const next: States = { ...states };
  const log: string[] = [];
  let queue: AutomationEvent[] = [event];

  for (let depth = 0; queue.length > 0; depth++) {
    if (depth >= MAX_DEPTH) {
      log.push(`limite de ${MAX_DEPTH} cascatas atingido — possível loop`);
      break;
    }
    const following: AutomationEvent[] = [];
    for (const e of queue) {
      for (const rule of rules) {
        if (!rule.enabled || !matches(rule.trigger, e)) continue;
        if (!rule.conditions.every((c) => (next[c.entity] ?? false) === c.is)) {
          log.push(`${rule.name}: condição não satisfeita`);
          continue;
        }
        log.push(`${rule.name}: executada`);
        for (const a of rule.actions) {
          if ((next[a.entity] ?? false) === a.set) continue; // no-op never re-triggers
          next[a.entity] = a.set;
          following.push({ type: "state", entity: a.entity, to: a.set });
        }
      }
    }
    queue = following;
  }
  return { states: next, log };
}
