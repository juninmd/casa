import { useEffect } from "react";
import { useVisibleEntities } from "../state/providers";

/** Share of lights that are on (0..1); a house with no lights keeps a faint ember. */
export function warmth(lights: { on: boolean; online: boolean }[]): number {
  const usable = lights.filter((l) => l.online);
  if (usable.length === 0) return 0.25;
  return Math.max(0.12, usable.filter((l) => l.on).length / usable.length);
}

export function Ambient() {
  const entities = useVisibleEntities();
  const warm = warmth(entities.filter((e) => e.kind === "light"));

  useEffect(() => {
    document.documentElement.style.setProperty("--warm", String(warm));
  }, [warm]);

  return (
    <div className="ambient" aria-hidden="true">
      <span className="blob b-sky" />
      <span className="blob b-violet" />
      <span className="blob b-lamp" />
      <span className="grain" />
    </div>
  );
}
