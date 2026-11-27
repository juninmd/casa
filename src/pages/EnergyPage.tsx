import { Card, CountUp, PageHeader, ProgressBar, StatTile } from "@juninmd/sonido";
import { ChartLineUp } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

// Deterministic pseudo-series so the demo is stable; real data comes from Tapo P110 / Shelly meters.
const HOURS = Array.from({ length: 24 }, (_, h) => {
  const base = 0.18 + 0.1 * Math.sin((h - 6) / 3.8);
  const peak = h >= 18 && h <= 22 ? 0.45 : 0;
  return Math.max(0.05, +(base + peak).toFixed(2));
});

const DEVICES = [
  { name: "Tomada do PC", kwh: 3.2 },
  { name: "TV", kwh: 1.1 },
  { name: "Luzes", kwh: 0.9 },
  { name: "Echo", kwh: 0.3 },
];
const TOP_DEVICE = 3.2;

const W = 600;
const H = 200;
const max = Math.max(...HOURS);
const pts = HOURS.map((v, i): [number, number] => [(i / 23) * W, H - 14 - (v / max) * (H - 36)]);

/** Catmull-Rom to cubic Bézier: a smooth line through every hourly sample. */
export function smooth(p: [number, number][]): string {
  let d = `M${p[0]?.[0]},${p[0]?.[1]}`;
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i - 1] ?? p[i];
    const b = p[i];
    const c = p[i + 1];
    const e = p[i + 2] ?? c;
    if (!a || !b || !c || !e) continue;
    const t = 0.18;
    d += ` C${b[0] + (c[0] - a[0]) * t},${b[1] + (c[1] - a[1]) * t} ${c[0] - (e[0] - b[0]) * t},${c[1] - (e[1] - b[1]) * t} ${c[0]},${c[1]}`;
  }
  return d;
}

export function EnergyPage() {
  const total = HOURS.reduce((a, b) => a + b, 0);
  const [at, setAt] = useState<number | null>(null);
  const [grown, setGrown] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const line = smooth(pts);
  const peakHour = HOURS.indexOf(max);

  useEffect(() => {
    const t = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(t);
  }, []);

  function track(e: React.PointerEvent) {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    setAt(Math.round(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * 23));
  }

  const idx = at ?? peakHour;
  const px = (idx / 23) * 100;
  const py = ((pts[idx]?.[1] ?? 0) / H) * 100;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Energia"
        titleAs="h1"
        icon={<ChartLineUp size={22} weight="duotone" />}
        description="Dados simulados: medidores reais (Tapo P110, Shelly) entram na próxima fase."
        aside={
          <div className="grid grid-cols-3 gap-2">
            <StatTile
              label="Hoje"
              value={<CountUp value={total} format={(n) => n.toFixed(1)} />}
              hint="kWh nas 24 h"
              tone="accent"
            />
            <StatTile
              label="Pico"
              value={<CountUp value={max} format={(n) => n.toFixed(2)} />}
              hint={`às ${String(peakHour).padStart(2, "0")}h`}
              tone="warning"
            />
            <StatTile
              label="Média"
              value={<CountUp value={total / 24} format={(n) => n.toFixed(2)} />}
              hint="kWh por hora"
            />
          </div>
        }
      />

      <Card surface="glass" padding="md">
        <p className="font-display text-5xl font-semibold">
          <CountUp value={total} format={(n) => n.toFixed(1)} />{" "}
          <span className="text-base font-normal text-mute">kWh hoje</span>
        </p>

        <div
          ref={box}
          onPointerMove={track}
          onPointerLeave={() => setAt(null)}
          style={{ touchAction: "pan-y" }}
          className="relative mt-4 h-52 cursor-crosshair"
        >
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            role="img"
            aria-label="Consumo por hora nas últimas 24 horas"
            className="size-full overflow-visible"
          >
            <defs>
              <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#ffb547" stopOpacity="0.45" />
                <stop offset="1" stopColor="#ffb547" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map((g) => (
              <line
                key={g}
                x1="0"
                x2={W}
                y1={H * g}
                y2={H * g}
                stroke="white"
                strokeOpacity="0.07"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            <path
              d={`${line} L${W},${H} L0,${H} Z`}
              fill="url(#area)"
              style={{ opacity: grown ? 1 : 0, transition: "opacity 1.2s ease 0.4s" }}
            />
            <path
              d={line}
              pathLength={1}
              fill="none"
              stroke="#ffb547"
              strokeWidth="2.5"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              className="draw"
            />
          </svg>

          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-0 h-full w-px bg-white/25"
            style={{ left: `${px}%` }}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-amber shadow-[0_0_18px_4px_rgb(255_181_71/0.6)]"
            style={{ left: `${px}%`, top: `${py}%` }}
          />
          <span
            className="glass pointer-events-none absolute -top-1 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-xl px-3 py-1.5 text-xs"
            style={{ left: `${Math.min(88, Math.max(12, px))}%` }}
          >
            <b className="font-display text-sm">{String(idx).padStart(2, "0")}h</b> ·{" "}
            {HOURS[idx]?.toFixed(2)} kWh
            {at === null && <span className="text-mute"> (pico)</span>}
          </span>
        </div>
        <div className="mt-1 flex justify-between text-xs text-mute">
          <span>00h</span>
          <span>12h</span>
          <span>23h</span>
        </div>
      </Card>

      <Card surface="glass" padding="md">
        <h2 className="text-lg font-semibold">Por dispositivo</h2>
        {DEVICES.map((d) => (
          <div key={d.name} className="grid gap-1">
            <div className="flex justify-between text-sm">
              <span>{d.name}</span>
              <span className="text-mute tabular-nums">{d.kwh} kWh</span>
            </div>
            <ProgressBar
              label={`${d.name}: ${d.kwh} kWh`}
              value={d.kwh / TOP_DEVICE}
              tone="accent"
            />
          </div>
        ))}
      </Card>
    </div>
  );
}
