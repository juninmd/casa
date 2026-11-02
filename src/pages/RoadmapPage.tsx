import { MagnifyingGlass } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { FEATURES, type Status } from "../data/features";
import { PageHeader } from "../ui/PageHeader";

const STATUS: Record<Status, { label: string; color: string; hint: string }> = {
  proto: { label: "No protótipo", color: "#3de0c3", hint: "já funciona neste app" },
  viavel: { label: "Viável", color: "#ffb547", hint: "só software, cabe no Tauri+React" },
  depende: { label: "Depende", color: "#b58cff", hint: "precisa de hardware, conta ou nuvem" },
  fora: { label: "Fora de escopo", color: "#ff6b8b", hint: "exige servidor ou rádio dedicado" },
};

/** Share of all features as an arc that grows in on mount. */
function Ring({ value, color, grown }: { value: number; color: string; grown: boolean }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 56 56" className="size-14 shrink-0 -rotate-90" aria-hidden="true">
      <title>Participação no total</title>
      <circle
        cx="28"
        cy="28"
        r={r}
        fill="none"
        stroke="white"
        strokeOpacity="0.1"
        strokeWidth="6"
      />
      <circle
        cx="28"
        cy="28"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={grown ? c * (1 - value) : c}
        style={{
          transition: "stroke-dashoffset 1.1s var(--ease-out-expo)",
          filter: `drop-shadow(0 0 5px ${color})`,
        }}
      />
    </svg>
  );
}

export function RoadmapPage() {
  const [status, setStatus] = useState<Status | "todos">("todos");
  const [cat, setCat] = useState("Todas");
  const [q, setQ] = useState("");
  const [grown, setGrown] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const cats = useMemo(() => ["Todas", ...new Set(FEATURES.map((f) => f.category))], []);
  const counts = useMemo(() => {
    const c = { proto: 0, viavel: 0, depende: 0, fora: 0 } satisfies Record<Status, number>;
    for (const f of FEATURES) c[f.status]++;
    return c;
  }, []);
  const shown = FEATURES.filter(
    (f) =>
      (status === "todos" || f.status === status) &&
      (cat === "Todas" || f.category === cat) &&
      `${f.name} ${f.note}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Roadmap">
        {FEATURES.length} features consolidadas de ~550 itens levantados em Home Assistant, openHAB,
        Domoticz, ioBroker, Jeedom, Gladys, Homebridge e dashboards de homelab.
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {(Object.keys(STATUS) as Status[]).map((s, i) => (
          <button
            key={s}
            type="button"
            aria-pressed={status === s}
            onClick={() => setStatus(status === s ? "todos" : s)}
            style={
              {
                "--i": i,
                borderColor: status === s ? STATUS[s].color : undefined,
              } as React.CSSProperties
            }
            className="rise glass spot flex items-center gap-3 rounded-3xl p-4 text-left transition-transform active:scale-[0.97]"
          >
            <Ring value={counts[s] / FEATURES.length} color={STATUS[s].color} grown={grown} />
            <span>
              <span className="block font-display text-3xl font-semibold leading-none">
                {counts[s]}
              </span>
              <span className="block text-sm">{STATUS[s].label}</span>
              <span className="block text-xs text-mute">{STATUS[s].hint}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <label className="glass flex min-h-12 flex-1 items-center gap-2 rounded-2xl px-4">
          <MagnifyingGlass size={18} aria-hidden className="text-mute" />
          <input
            aria-label="Buscar feature"
            placeholder="Buscar feature…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full bg-transparent text-sm outline-none placeholder:text-mute"
          />
        </label>
        <select
          aria-label="Categoria"
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className="glass min-h-12 rounded-2xl px-4 text-sm"
        >
          {cats.map((c) => (
            <option key={c} className="bg-[#10142b]">
              {c}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs text-mute">{shown.length} resultado(s)</p>
      <ul className="grid gap-2 md:grid-cols-2">
        {shown.map((f) => (
          <li key={`${f.category}-${f.name}`} className="glass rounded-2xl p-3.5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold">{f.name}</p>
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-xs"
                style={{ background: `${STATUS[f.status].color}26`, color: STATUS[f.status].color }}
              >
                {STATUS[f.status].label}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-mute">
              {f.category} · {f.from.join(", ")}
            </p>
            <p className="mt-1 text-xs">{f.note}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
