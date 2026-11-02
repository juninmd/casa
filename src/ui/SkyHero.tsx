import { useEffect, useRef, useState } from "react";
import { CountUp } from "./CountUp";

interface Props {
  lightsOn: number;
  lights: number;
  online: number;
  total: number;
}

type Phase = { name: string; a: string; b: string };

// Sky colours per part of the day; the registered --sky-a/--sky-b properties ease between them.
function phaseOf(h: number): Phase {
  if (h >= 5 && h < 8) return { name: "dawn", a: "#3b3a8c", b: "#ff9d70" };
  if (h >= 8 && h < 17) return { name: "day", a: "#2f6bff", b: "#7cc8ff" };
  if (h >= 17 && h < 20) return { name: "dusk", a: "#40307a", b: "#ff7a5c" };
  return { name: "night", a: "#0a0e2a", b: "#222a66" };
}

export function greeting(h: number): string {
  if (h < 5) return "Boa madrugada";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

/** 0..1 along the visible arc; the sun crosses 06-18h, the moon 18-06h. */
export function arcPosition(h: number): { t: number; sun: boolean } {
  const sun = h >= 6 && h < 18;
  const t = sun ? (h - 6) / 12 : ((h - 18 + 24) % 24) / 12;
  return { t, sun };
}

const fmt = (h: number) => {
  const hh = Math.floor(h);
  const mm = Math.round(((h - hh) * 60) / 15) * 15;
  return `${String(mm === 60 ? hh + 1 : hh).padStart(2, "0")}:${String(mm % 60).padStart(2, "0")}`;
};

const STARS: [number, number][] = [
  [12, 8],
  [24, 20],
  [38, 6],
  [55, 14],
  [68, 5],
  [82, 18],
  [90, 9],
  [47, 24],
];

function nowHour() {
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
}

export function SkyHero({ lightsOn, lights, online, total }: Props) {
  const [real, setReal] = useState(nowHour);
  const [preview, setPreview] = useState<number | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setReal(nowHour()), 60_000);
    return () => clearInterval(t);
  }, []);

  const hour = preview ?? real;
  const phase = phaseOf(hour);
  const { t, sun } = arcPosition(hour);
  const x = 8 + 84 * t;
  const y = 34 - 26 * Math.sin(Math.PI * t);

  function scrub(e: React.PointerEvent) {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    setPreview(Math.min(23.99, Math.max(0, ((e.clientX - r.left) / r.width) * 24)));
  }

  return (
    <div
      ref={box}
      onPointerMove={scrub}
      onPointerLeave={() => setPreview(null)}
      onPointerCancel={() => setPreview(null)}
      style={
        { "--sky-a": phase.a, "--sky-b": phase.b, touchAction: "pan-y" } as React.CSSProperties
      }
      className="sky glass relative overflow-hidden rounded-[32px] p-5 md:p-7"
    >
      {/* Arc is stretched on purpose; the sun, moon and stars are HTML so they never distort. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[72%]" aria-hidden="true">
        <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="absolute inset-0 size-full">
          <title>Trajetória do sol e da lua</title>
          <path
            d="M8 34 Q50 -18 92 34"
            fill="none"
            stroke="white"
            strokeOpacity="0.2"
            strokeWidth="1"
            strokeDasharray="3 4"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {phase.name === "night" &&
          STARS.map(([sx, sy], i) => (
            <span
              key={`${sx}-${sy}`}
              className="twinkle absolute size-[3px] rounded-full bg-white"
              style={{ left: `${sx}%`, top: `${sy * 2.5}%`, animationDelay: `${i * 0.45}s` }}
            />
          ))}
        <span
          className="absolute -translate-x-1/2 -translate-y-1/2 transition-[left,top] duration-500 ease-[var(--ease-out-expo)]"
          style={{ left: `${x}%`, top: `${(y / 40) * 100}%` }}
        >
          {sun ? (
            <span className="block size-10 rounded-full bg-[#ffe3a3] shadow-[0_0_46px_14px_rgb(255_210_122/0.55)]" />
          ) : (
            <span className="relative block size-9 rounded-full bg-[#e8ecff] shadow-[0_0_38px_8px_rgb(207_216_255/0.35)]">
              <span
                className="absolute -right-1.5 -top-1 size-8 rounded-full"
                style={{ background: phase.b }}
              />
            </span>
          )}
        </span>
      </div>

      <div className="relative flex min-h-44 flex-col justify-end gap-5 md:min-h-52">
        <div>
          <p className="font-display text-4xl font-semibold leading-none md:text-5xl">
            {greeting(hour)}
          </p>
          <p className="mt-2 text-sm text-white/75">
            {preview === null ? "Sua casa agora" : `Prévia das ${fmt(hour)}`}
            {preview === null && (
              <span className="text-white/50">
                <span className="hidden md:inline"> · passe o cursor para ver o dia passar</span>
                <span className="md:hidden"> · deslize para ver o dia passar</span>
              </span>
            )}
          </p>
        </div>

        <dl className="grid grid-cols-3 gap-2 md:max-w-xl md:gap-3">
          {[
            { label: "luzes acesas", value: lightsOn, of: lights },
            { label: "online", value: online, of: total },
            { label: "dispositivos", value: total, of: null },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-black/25 px-3 py-2.5 backdrop-blur-md">
              <dd className="font-display text-2xl font-semibold leading-none md:text-3xl">
                <CountUp value={s.value} />
                {s.of !== null && (
                  <span className="text-sm font-normal text-white/55"> / {s.of}</span>
                )}
              </dd>
              <dt className="mt-1 text-xs text-white/70">{s.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
