import type { Entity } from "../core/types";
import { errText, setPower } from "../platform/providers";

export interface SyncHooks {
  patch: (id: string, patch: Partial<Entity>) => void;
  notify: (message: string) => void;
  /** Marks an entity as having a command in flight (blocks re-toggle, shields it from polling). */
  busy: (id: string, on: boolean) => void;
  /** Called after a failure so the UI re-reads the truth instead of guessing it. */
  refresh: () => void;
}

/**
 * Sends to the real providers every provider entity whose `on` differs between `prev` and `next`.
 * `next` is already applied optimistically; on failure the entity goes back to its previous known
 * state and a refresh is requested. Callers diff whole lists, so rule cascades are covered.
 */
export async function syncReal(prev: Entity[], next: Entity[], hooks: SyncHooks): Promise<void> {
  const before = new Map(prev.map((e) => [e.id, e.on]));
  const jobs = next.filter(
    (e) => e.source === "provider" && e.controllable && before.get(e.id) !== e.on,
  );
  await Promise.all(
    jobs.map(async (e) => {
      if (!e.providerId || !e.deviceId) return;
      hooks.busy(e.id, true);
      try {
        const d = await setPower(e.providerId, e.deviceId, e.on);
        hooks.patch(e.id, { on: d.on, online: d.online, detail: d.detail ?? undefined });
      } catch (err) {
        hooks.patch(e.id, { on: before.get(e.id) ?? !e.on });
        hooks.notify(`${e.name}: ${errText(err)}`);
        hooks.refresh();
      } finally {
        hooks.busy(e.id, false);
      }
    }),
  );
}
