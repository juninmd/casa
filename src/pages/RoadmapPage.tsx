import { Badge, type BadgeTone, Card, PageHeader, Select, TextField } from "@juninmd/sonido";
import { MagnifyingGlass, MapTrifold } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { FEATURES, type Status } from "../data/features";

const STATUS: Record<Status, { label: string; color: string; hint: string; tone: BadgeTone }> = {
  proto: {
    label: "No protótipo",
    color: "#3de0c3",
    hint: "já funciona neste app",
    tone: "success",
  },
  viavel: {
    label: "Viável",
    color: "#ffb547",
    hint: "só software, cabe no Tauri+React",
    tone: "warning",
  },
  depende: {
    label: "Depende",
    color: "#b58cff",
    hint: "precisa de hardware, conta ou nuvem",
    tone: "violet",
  },
  fora: {
    label: "Fora de escopo",
    color: "#ff6b8b",
    hint: "exige servidor ou rádio dedicado",
    tone: "danger",
  },
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
      <PageHeader
        title="Roadmap"
        titleAs="h1"
        icon={<MapTrifold size={22} weight="duotone" />}
        description={`${FEATURES.length} features consolidadas de ~550 itens levantados em Home Assistant, openHAB, Domoticz, ioBroker, Jeedom, Gladys, Homebridge e dashboards de homelab.`}
      />

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

      <div className="flex flex-wrap items-end gap-3">
        <TextField
          label="Buscar feature"
          hideLabel
          placeholder="Buscar feature…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          icon={<MagnifyingGlass size={18} aria-hidden />}
          className="flex-1"
        />
        <Select
          label="Categoria"
          hideLabel
          value={cat}
          onChange={setCat}
          options={cats.map((c) => ({ value: c, label: c }))}
          className="w-48"
        />
      </div>

      <p className="text-xs text-mute">{shown.length} resultado(s)</p>
      <ul className="grid gap-2 md:grid-cols-2">
        {shown.map((f) => (
          <li key={`${f.category}-${f.name}`}>
            <Card surface="glass" padding="sm" className="h-full">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold">{f.name}</p>
                <Badge tone={STATUS[f.status].tone} appearance="soft" className="shrink-0">
                  {STATUS[f.status].label}
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-mute">
                {f.category} · {f.from.join(", ")}
              </p>
              <p className="mt-1 text-xs">{f.note}</p>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
