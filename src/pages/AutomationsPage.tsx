import { Button, Card, EmptyState, PageHeader, Switch } from "@juninmd/sonido";
import { ArrowRight, Clock, Lightning, Play, ToggleLeft } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import type { Rule } from "../core/automation";
import { useStore } from "../state/store";

function Chip({ tone, icon, children }: { tone: string; icon: ReactNode; children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs"
      style={{ background: `${tone}22`, color: tone }}
    >
      {icon}
      <span className="text-ink">{children}</span>
    </span>
  );
}

export function AutomationsPage() {
  const { rules, toggleRule, fireTime, log, entities } = useStore();
  const name = (id: string) => entities.find((e) => e.id === id)?.name ?? id;
  const state = (on: boolean) => (on ? "ligado" : "desligado");

  const flow = (r: Rule) => (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <Chip
        tone="#6f9bff"
        icon={
          r.trigger.type === "time" ? (
            <Clock size={16} weight="duotone" />
          ) : (
            <Lightning size={16} weight="duotone" />
          )
        }
      >
        {r.trigger.type === "time"
          ? `às ${r.trigger.at}`
          : `${name(r.trigger.entity)} ${state(r.trigger.to)}`}
      </Chip>
      {r.conditions.map((c) => (
        <Chip key={c.entity} tone="#b58cff" icon={<ToggleLeft size={16} weight="duotone" />}>
          se {name(c.entity)} {state(c.is)}
        </Chip>
      ))}
      <ArrowRight size={16} className="text-mute" aria-hidden />
      {r.actions.map((a) => (
        <Chip key={a.entity} tone="#ffb547" icon={<Lightning size={16} weight="fill" />}>
          {a.set ? "liga" : "desliga"} {name(a.entity)}
        </Chip>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Automações"
        titleAs="h1"
        icon={<Lightning size={22} weight="duotone" />}
        description="Gatilho, condições e ações executados localmente. Cascatas param em 5 níveis."
      />

      <ul className="space-y-3">
        {rules.map((r, i) => (
          <li key={r.id} style={{ "--i": i } as React.CSSProperties} className="rise">
            <Card surface="glass" padding="md" className="spot">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-display text-base font-semibold">{r.name}</p>
                  {flow(r)}
                </div>
                <Switch
                  checked={r.enabled}
                  onChange={() => toggleRule(r.id)}
                  label="Ativa"
                  className="mt-0.5 shrink-0"
                />
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <Card surface="glass" padding="md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Simular relógio</h2>
            <p className="text-xs text-mute">
              Dispara as regras de horário sem esperar o dia passar.
            </p>
          </div>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => fireTime("22:00")}
            iconStart={<Play size={18} weight="fill" aria-hidden />}
          >
            Disparar 22:00
          </Button>
        </div>
      </Card>

      <Card surface="glass" padding="md" aria-label="Registro">
        <h2 className="text-base font-semibold">Registro</h2>
        {log.length === 0 ? (
          <EmptyState
            title="Nada executado ainda"
            description="Ligue a TV na aba Início para ver a regra Cinema."
            titleAs="p"
          />
        ) : (
          <ul className="space-y-1 font-mono text-xs text-mute">
            {log.map((l, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: append-only log, order is the identity
              <li key={`${i}-${l}`}>{l}</li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
