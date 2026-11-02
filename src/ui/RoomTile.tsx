import { Bed, CookingPot, Couch, Desk, House, Plant, Plugs } from "@phosphor-icons/react";
import type { ComponentType } from "react";
import type { IconProps } from "./kinds";

type RoomIcon = ComponentType<IconProps & { "aria-hidden"?: boolean }>;

const RULES: [RegExp, RoomIcon][] = [
  [/sala|living/i, Couch],
  [/quarto|suite|bed/i, Bed],
  [/cozinha|kitchen/i, CookingPot],
  [/varanda|quintal|jardim|garden/i, Plant],
  [/escrit|office|estudo/i, Desk],
  [/tapo|home assistant|rede|casa/i, Plugs],
];

export const roomIcon = (name: string): RoomIcon =>
  RULES.find(([re]) => re.test(name))?.[1] ?? House;

/** Stable hue per room name, so each tile keeps its colour across renders and sessions. */
export function hueOf(name: string): number {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}

interface Props {
  name: string;
  active: boolean;
  lit: number;
  total: number;
  onSelect: () => void;
  index: number;
}

export function RoomTile({ name, active, lit, total, onSelect, index }: Props) {
  const hue = name === "Todos" ? 215 : hueOf(name);
  const Icon = name === "Todos" ? House : roomIcon(name);
  const art = `radial-gradient(120% 120% at 100% 0%, hsl(${hue} 85% 62% / 0.55), transparent 60%), radial-gradient(90% 90% at 0% 100%, hsl(${(hue + 50) % 360} 75% 52% / 0.4), transparent 62%)`;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onSelect}
      style={
        {
          backgroundImage: art,
          "--i": index,
          boxShadow: active ? `0 0 26px -6px hsl(${hue} 90% 60% / 0.7)` : undefined,
        } as React.CSSProperties
      }
      className={`rise glass spot relative h-24 w-36 shrink-0 overflow-hidden rounded-3xl p-3 text-left transition-[transform,box-shadow] duration-300 active:scale-[0.97] ${
        active ? "ring-2 ring-white/70" : "opacity-85 hover:opacity-100"
      }`}
    >
      <Icon
        size={76}
        weight="duotone"
        aria-hidden
        className="pointer-events-none absolute -bottom-4 -right-3 text-white/15"
      />
      <span className="relative block font-display text-lg font-semibold leading-tight">
        {name}
      </span>
      <span className="relative mt-1 block text-xs text-white/75">
        {total === 0
          ? "vazio"
          : lit > 0
            ? `${lit} de ${total} ligados`
            : `${total} dispositivo${total === 1 ? "" : "s"}`}
      </span>
    </button>
  );
}
