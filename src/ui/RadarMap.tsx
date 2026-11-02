import type { Scanned } from "../state/store";
import { KIND_COLOR } from "./kinds";

interface Props {
  items: Scanned[];
  scanning: boolean;
  hover: string | null;
  onHover: (ip: string | null) => void;
  onPick: (ip: string) => void;
}

const lastOctet = (ip: string) => Number(ip.split(".").pop());

/** Devices are spread evenly around the circle (IPs cluster, so the octet alone would bunch them). */
export function place(s: Scanned, i: number, n: number): { x: number; y: number } {
  const angle = (i / Math.max(1, n)) * Math.PI * 2 - Math.PI / 2;
  const radius = s.c.kind === "router" ? 58 : 108 + ((i * 47) % 78);
  return { x: 200 + Math.cos(angle) * radius, y: 200 + Math.sin(angle) * radius };
}

const SIZE = { alta: 9, média: 7.5, baixa: 6 } as const;

export function RadarMap({ items, scanning, hover, onHover, onPick }: Props) {
  return (
    <svg
      viewBox="0 0 400 400"
      className="mx-auto aspect-square w-full max-w-md"
      aria-label={`Mapa da rede com ${items.length} dispositivos`}
    >
      <title>Mapa de dispositivos da rede</title>
      <defs>
        <radialGradient id="radar-bg" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#3de0c3" stopOpacity="0.16" />
          <stop offset="1" stopColor="#3de0c3" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="beam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3de0c3" stopOpacity="0" />
          <stop offset="1" stopColor="#3de0c3" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <circle cx="200" cy="200" r="190" fill="url(#radar-bg)" />
      {[60, 120, 185].map((r) => (
        <circle key={r} cx="200" cy="200" r={r} fill="none" stroke="white" strokeOpacity="0.12" />
      ))}
      <path d="M200 10V390M10 200H390" stroke="white" strokeOpacity="0.06" />

      {scanning && (
        <g className="sweep">
          <path d="M200 200 L385 200 A185 185 0 0 0 330 70 Z" fill="url(#beam)" />
        </g>
      )}

      <g>
        <circle cx="200" cy="200" r="13" fill="#3de0c3" opacity="0.2" />
        <circle cx="200" cy="200" r="6" fill="#3de0c3" />
        <text x="200" y="228" textAnchor="middle" fontSize="10" fill="#a6b0c4">
          este PC
        </text>
      </g>

      {items.map((s, i) => {
        const { x, y } = place(s, i, items.length);
        const color = KIND_COLOR[s.c.kind];
        const r = SIZE[s.c.confidence];
        const on = hover === s.host.ip;
        return (
          // biome-ignore lint/a11y/useSemanticElements: SVG has no <button>; role, tabIndex and key handler are provided
          <g
            key={s.host.ip}
            tabIndex={0}
            role="button"
            aria-label={`${s.c.label}, ${s.host.ip}. Ver detalhes`}
            onPointerEnter={() => onHover(s.host.ip)}
            onPointerLeave={() => onHover(null)}
            onFocus={() => onHover(s.host.ip)}
            onBlur={() => onHover(null)}
            onClick={() => onPick(s.host.ip)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onPick(s.host.ip)}
            className="pop cursor-pointer outline-none"
            style={{ "--i": i } as React.CSSProperties}
          >
            <line x1="200" y1="200" x2={x} y2={y} stroke={color} strokeOpacity={on ? 0.55 : 0.12} />
            <circle cx={x} cy={y} r={on ? r + 9 : r + 5} fill={color} opacity={on ? 0.3 : 0.14} />
            <circle cx={x} cy={y} r={on ? r + 1.5 : r} fill={color} />
            {on && (
              <text
                x={x}
                y={y - r - 12}
                textAnchor="middle"
                fontSize="11"
                fill="white"
                fontWeight="600"
              >
                {s.c.label} · .{lastOctet(s.host.ip)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
