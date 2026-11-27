import {
  Badge,
  type BadgeTone,
  Button,
  Card,
  EmptyState,
  PageHeader,
  TextField,
} from "@juninmd/sonido";
import { Broadcast, Check, Plus } from "@phosphor-icons/react";
import { useState } from "react";
import { isPrivatePrefix } from "../platform/scan";
import { useStore } from "../state/store";
import { KIND_COLOR, KIND_ICON, KIND_LABEL } from "../ui/kinds";
import { RadarMap } from "../ui/RadarMap";

const CONF_TONE: Record<string, BadgeTone> = {
  alta: "success",
  média: "warning",
  baixa: "neutral",
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

  const startScan = () => {
    if (valid) void scan(prefix);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rede"
        titleAs="h1"
        accent
        icon={<Broadcast size={22} weight="duotone" />}
        description="Varredura somente leitura: conexão TCP em portas comuns, tabela ARP e banner HTTP. Nada é autenticado nem alterado."
      />

      <Card surface="glass" padding="sm">
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(ev) => {
            ev.preventDefault();
            startScan();
          }}
        >
          <TextField
            label="Sub-rede (/24)"
            value={prefix}
            onChange={(ev) => setPrefix(ev.target.value.trim())}
            inputMode="decimal"
            error={valid ? undefined : "Use uma rede privada, ex.: 192.168.1"}
            className="w-56"
          />
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={!valid}
            loading={scanning}
            iconStart={<Broadcast size={20} weight="duotone" aria-hidden />}
          >
            {scanning ? "Varrendo…" : "Varrer rede"}
          </Button>
        </form>
      </Card>

      {scanError && (
        <p role="alert" className="text-sm text-rose">
          {scanError}
        </p>
      )}
      {scanMode === "demo" && (
        <Card surface="glass" padding="sm" className="text-sm text-mute">
          <span>
            Modo demo: o navegador não tem acesso à rede, então mostro uma rede de exemplo
            (endereços e MACs fictícios). No app Tauri a varredura é nativa.
          </span>
        </Card>
      )}

      {scanned.length === 0 ? (
        <Card surface="glass" padding="md">
          <RadarMap
            items={[]}
            scanning={scanning}
            hover={null}
            onHover={() => {}}
            onPick={() => {}}
          />
          <EmptyState
            title="Nenhum dispositivo mapeado"
            description="Toque em “Varrer rede” para mapear seus dispositivos."
          />
        </Card>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
          <Card surface="glass" padding="md" className="lg:sticky lg:top-0">
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
          </Card>

          <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
            {scanned.map(({ host, c }, i) => {
              const Icon = KIND_ICON[c.kind];
              const color = KIND_COLOR[c.kind];
              const imported = entities.some((e) => e.id === `lan-${host.ip}`);
              return (
                <li key={host.ip}>
                  <Card
                    id={`host-${host.ip}`}
                    tabIndex={-1}
                    surface="glass"
                    padding="md"
                    onPointerEnter={() => setHover(host.ip)}
                    onPointerLeave={() => setHover(null)}
                    style={
                      {
                        "--i": i,
                        borderColor: hover === host.ip ? `${color}aa` : undefined,
                      } as React.CSSProperties
                    }
                    className="spot rise h-full outline-none transition-colors"
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
                      <Badge tone={CONF_TONE[c.confidence] ?? "neutral"} appearance="soft">
                        {c.confidence}
                      </Badge>
                    </div>
                    <ul className="mt-3 space-y-0.5 text-xs text-mute">
                      {c.reasons.map((r) => (
                        <li key={r}>• {r}</li>
                      ))}
                      {c.integration && <li className="text-ink">→ integração: {c.integration}</li>}
                    </ul>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={imported}
                      onClick={() => importHost({ host, c })}
                      iconStart={
                        imported ? <Check size={16} aria-hidden /> : <Plus size={16} aria-hidden />
                      }
                    >
                      {imported ? "Adicionado" : "Adicionar ao painel"}
                    </Button>
                  </Card>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
