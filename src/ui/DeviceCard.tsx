import { useEffect, useRef } from "react";
import type { Entity } from "../core/types";
import { KIND_COLOR, KIND_ICON } from "./kinds";

interface Props {
  entity: Entity;
  onToggle: (id: string) => void;
  index?: number;
}

function statusOf(e: Entity): string {
  if (e.source === "provider" && !e.online) return "Offline";
  if (e.kind === "sensor") return e.detail ?? `${e.value ?? "—"}${e.unit ?? ""}`;
  if (e.kind === "lock") return e.on ? "Trancada" : "Destrancada";
  return e.on ? "Ligado" : "Desligado";
}

function badgeOf(e: Entity): string | null {
  if (e.source === "lan") return "somente leitura";
  if (e.source !== "provider" || e.kind === "sensor") return null;
  if (!e.online) return "offline";
  return e.controllable ? null : "somente leitura";
}

export function DeviceCard({ entity, onToggle, index = 0 }: Props) {
  const Icon = KIND_ICON[entity.kind];
  const color = KIND_COLOR[entity.kind];
  const readOnly =
    entity.source === "lan" ||
    entity.kind === "sensor" ||
    (entity.source === "provider" && (!entity.controllable || !entity.online));
  const lit = entity.on && !readOnly;
  const badge = badgeOf(entity);
  const el = useRef<HTMLButtonElement>(null);
  const prevOn = useRef(entity.on);

  // A pulse that answers a change of state, so the tap is acknowledged even before the card settles.
  useEffect(() => {
    if (prevOn.current === entity.on) return;
    prevOn.current = entity.on;
    const node = el.current;
    if (!node) return;
    node.classList.remove("ripple");
    void node.offsetWidth;
    node.classList.add("ripple");
  }, [entity.on]);

  return (
    <button
      ref={el}
      type="button"
      title={entity.online ? undefined : (entity.detail ?? undefined)}
      {...(readOnly ? { "aria-disabled": true } : { role: "switch", "aria-checked": entity.on })}
      onClick={() => onToggle(entity.id)}
      onAnimationEnd={(e) => e.currentTarget.classList.remove("ripple")}
      style={
        {
          "--glow": `${color}99`,
          "--kind": color,
          "--i": index,
          backgroundImage: lit ? `linear-gradient(150deg, ${color}38, ${color}0d 70%)` : undefined,
          borderColor: lit ? `${color}88` : undefined,
        } as React.CSSProperties
      }
      className={`rise glass spot flex min-h-32 w-full flex-col justify-between rounded-3xl p-4 text-left transition-[transform,border-color,background-image] duration-300 ${
        readOnly ? "cursor-default" : "active:scale-[0.96]"
      } ${entity.online ? "" : "opacity-55"}`}
    >
      <span className="flex items-start justify-between">
        <span
          className={`grid size-12 place-items-center rounded-2xl transition-colors duration-500 ${lit ? "glow-pulse" : ""}`}
          style={
            {
              color: lit ? color : "#a6b0c4",
              background: lit ? `${color}2b` : "rgb(255 255 255 / 0.07)",
              "--glow": color,
            } as React.CSSProperties
          }
        >
          <Icon size={28} weight="duotone" aria-hidden />
        </span>
        {badge ? (
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-mute">
            {badge}
          </span>
        ) : (
          !readOnly && (
            <span
              aria-hidden="true"
              className="relative mt-1 h-6 w-11 rounded-full transition-colors duration-300"
              style={{ background: lit ? color : "rgb(255 255 255 / 0.14)" }}
            >
              <span
                className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform duration-300 ease-[var(--ease-out-expo)]"
                style={{ transform: lit ? "translateX(20px)" : "translateX(0)" }}
              />
            </span>
          )
        )}
      </span>
      <span>
        <span className="block font-display text-[17px] font-semibold leading-tight">
          {entity.name}
        </span>
        <span className="block text-xs text-mute">
          {entity.room} · {statusOf(entity)}
        </span>
      </span>
    </button>
  );
}
