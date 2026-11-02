import { ArrowRight, Clock, Lightning, Play, ToggleLeft } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import type { Rule } from "../core/automation";
import { useStore } from "../state/store";
import { PageHeader } from "../ui/PageHeader";

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
      <PageHeader title="Automações">
        Gatilho, condições e ações executados localmente. Cascatas param em 5 níveis.
      </PageHeader>

      <ul className="space-y-3">
        {rules.map((r, i) => (
          <li
            key={r.id}
            style={{ "--i": i } as React.CSSProperties}
            className="rise glass spot flex items-start justify-between gap-4 rounded-3xl p-4"
          >
            <div className="min-w-0">
              <p className="font-display text-base font-semibold">{r.name}</p>
              {flow(r)}
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={r.enabled}
              aria-label={`Ativar ${r.name}`}
              onClick={() => toggleRule(r.id)}
              className="relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors duration-300"
              style={{ background: r.enabled ? "#3de0c3" : "rgb(255 255 255 / 0.16)" }}
            >
              <span
                className="absolute left-0.5 top-0.5 size-6 rounded-full bg-white shadow transition-transform duration-300 ease-[var(--ease-out-expo)]"
                style={{ transform: r.enabled ? "translateX(20px)" : "translateX(0)" }}
              />
            </button>
          </li>
        ))}
      </ul>

      <section className="glass flex flex-wrap items-center justify-between gap-3 rounded-3xl p-4">
        <div>
          <h2 className="text-base font-semibold">Simular relógio</h2>
          <p className="text-xs text-mute">
            Dispara as regras de horário sem esperar o dia passar.
          </p>
        </div>
        <button
          type="button"
          onClick={() => fireTime("22:00")}
          className="flex min-h-12 items-center gap-2 rounded-2xl bg-white/10 px-5 text-sm font-medium transition-transform hover:bg-white/15 active:scale-95"
        >
          <Play size={18} weight="fill" aria-hidden /> Disparar 22:00
        </button>
      </section>

      <section aria-label="Registro" className="glass rounded-3xl p-4">
        <h2 className="mb-2 text-base font-semibold">Registro</h2>
        {log.length === 0 ? (
          <p className="text-sm text-mute">
            Nada executado ainda. Ligue a TV na aba Início para ver a regra Cinema.
          </p>
        ) : (
          <ul className="space-y-1 font-mono text-xs text-mute">
            {log.map((l, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: append-only log, order is the identity
              <li key={`${i}-${l}`}>{l}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
