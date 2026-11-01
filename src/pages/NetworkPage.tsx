import { Broadcast, Check, Plus } from "@phosphor-icons/react";
import { useState } from "react";
import { isPrivatePrefix } from "../platform/scan";
import { useStore } from "../state/store";
import { KIND_COLOR, KIND_ICON, KIND_LABEL } from "../ui/kinds";
import { PageHeader } from "../ui/PageHeader";
import { RadarMap } from "../ui/RadarMap";

const CONF_STYLE = {
  alta: "bg-teal/20 text-teal",
  média: "bg-amber/20 text-amber",
  baixa: "bg-white/10 text-mute",
};

export function NetworkPage() {
  const { scanned, scanning, scanMode, scanError, scan, importHost, entities } = useStore();
  const [prefix, setPrefix] = useState("192.168.1");
  const [hover, setHover] = useState<string | null>(null);
  const valid = isPrivatePrefix(prefix);

  const pick = (ip: string) => {
    const el = document.getElementById(`host-${ip}`);
    el?.scrollIntoView({
      block: "center",
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
    el?.focus({ preventScroll: true });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Rede">
        Varredura somente leitura: conexão TCP em portas comuns, tabela ARP e banner HTTP. Nada é
        autenticado nem alterado.
      </PageHeader>

      <form
        className="glass flex flex-wrap items-end gap-3 rounded-3xl p-4"
        onSubmit={(ev) => {
          ev.preventDefault();
          if (valid) void scan(prefix);
        }}
      >
        <label className="text-sm">
          <span className="mb-1 block text-mute">Sub-rede (/24)</span>
          <input
            value={prefix}
            onChange={(ev) => setPrefix(ev.target.value.trim())}
            inputMode="decimal"
            aria-invalid={!valid}
            className="min-h-12 w-44 rounded-2xl border border-line bg-white/5 px-4 text-ink aria-[invalid=true]:border-rose"
          />
        </label>
        <button
          type="submit"
          disabled={!valid || scanning}
          className="flex min-h-12 items-center gap-2 rounded-2xl bg-teal px-5 text-sm font-semibold text-bg shadow-[0_8px_24px_-8px_#3de0c3] transition-transform active:scale-95 disabled:opacity-50"
        >
          <Broadcast size={20} weight="duotone" aria-hidden />{" "}
          {scanning ? "Varrendo…" : "Varrer rede"}
        </button>
        {!valid && <p className="text-sm text-rose">Use uma rede privada, ex.: 192.168.1</p>}
      </form>

      {scanError && (
        <p role="alert" className="text-sm text-rose">
          {scanError}
        </p>
      )}
      {scanMode === "demo" && (
        <p className="glass rounded-2xl p-3 text-sm text-mute">
          Modo demo: o navegador não tem acesso à rede, então mostro uma rede de exemplo (endereços
          e MACs fictícios). No app Tauri a varredura é nativa.
        </p>
      )}

      {scanned.length === 0 ? (
        <div className="glass rounded-3xl p-6">
          <RadarMap
            items={[]}
            scanning={scanning}
            hover={null}
            onHover={() => {}}
            onPick={() => {}}
          />
          <p className="text-center text-sm text-mute">
            Toque em “Varrer rede” para mapear seus dispositivos.
          </p>
        </div>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
          <div className="glass rounded-3xl p-4 lg:sticky lg:top-0">
            <RadarMap
              items={scanned}
              scanning={scanning}
              hover={hover}
              onHover={setHover}
              onPick={pick}
            />
            <p className="mt-2 text-center text-sm text-mute">
              {scanned.length} dispositivos encontrados
            </p>
          </div>

          <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
            {scanned.map(({ host, c }, i) => {
              const Icon = KIND_ICON[c.kind];
              const color = KIND_COLOR[c.kind];
              const imported = entities.some((e) => e.id === `lan-${host.ip}`);
              return (
                <li
                  key={host.ip}
                  id={`host-${host.ip}`}
                  tabIndex={-1}
                  onPointerEnter={() => setHover(host.ip)}
                  onPointerLeave={() => setHover(null)}
                  style={
                    {
                      "--i": i,
                      borderColor: hover === host.ip ? `${color}aa` : undefined,
                    } as React.CSSProperties
                  }
                  className="rise glass spot rounded-3xl p-4 outline-none transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="grid size-11 place-items-center rounded-2xl"
                        style={{ background: `${color}26`, color }}
                      >
                        <Icon size={26} weight="duotone" aria-hidden />
                      </span>
                      <div>
                        <p className="font-display text-base font-semibold leading-tight">
                          {c.label}
                        </p>
                        <p className="text-xs text-mute">
                          {host.ip} · {KIND_LABEL[c.kind]}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${CONF_STYLE[c.confidence]}`}
                    >
                      {c.confidence}
                    </span>
                  </div>
                  <ul className="mt-3 space-y-0.5 text-xs text-mute">
                    {c.reasons.map((r) => (
                      <li key={r}>• {r}</li>
                    ))}
                    {c.integration && <li className="text-ink">→ integração: {c.integration}</li>}
                  </ul>
                  <button
                    type="button"
                    disabled={imported}
                    onClick={() => importHost({ host, c })}
                    className="mt-3 flex min-h-10 items-center gap-1.5 rounded-xl border border-line px-3 text-sm transition-colors hover:bg-white/8 disabled:opacity-60"
                  >
                    {imported ? <Check size={16} aria-hidden /> : <Plus size={16} aria-hidden />}
                    {imported ? "Adicionado" : "Adicionar ao painel"}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
