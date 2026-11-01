import { House, Key, Plug, Plus } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import {
  errText,
  type ProviderKind,
  type ProviderView,
  providersAvailable,
  type TestReport,
  testProvider,
} from "../platform/providers";
import { useProviders } from "../state/providers";
import { useStore } from "../state/store";
import { PageHeader } from "../ui/PageHeader";
import { ProviderForm } from "../ui/ProviderForm";

type Editing = { kind: ProviderKind; initial?: ProviderView } | null;

const KIND = {
  tapo: { name: "Tapo (TP-Link)", color: "#3de0c3", Icon: Plug },
  homeassistant: { name: "Home Assistant", color: "#6f9bff", Icon: House },
} as const;

const btn =
  "min-h-11 rounded-xl border border-line px-4 text-sm transition-colors hover:bg-white/8 active:scale-95";

export function ProvidersPage() {
  const { providers, errors, showDemo, setShowDemo, remove, refresh } = useProviders();
  const scanned = useStore((s) => s.scanned);
  const [editing, setEditing] = useState<Editing>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, TestReport | string>>({});
  const native = providersAvailable();

  const discovered = useMemo(
    () =>
      scanned
        .filter((s) => s.c.integration?.startsWith("tapo") && s.host.ports.includes(80))
        .map((s) => s.host.ip),
    [scanned],
  );

  async function test(id: string) {
    try {
      setResults((r) => ({ ...r, [id]: "Testando…" }));
      const rep = await testProvider(id);
      setResults((r) => ({ ...r, [id]: rep }));
      void refresh();
    } catch (e) {
      setResults((r) => ({ ...r, [id]: errText(e) }));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Provedores">
        <span className="flex items-start gap-2">
          <Key size={18} weight="duotone" aria-hidden className="mt-0.5 shrink-0 text-amber" />
          Credenciais ficam no cofre do sistema (Gerenciador de Credenciais do Windows, Keychain ou
          Secret Service). O app só escreve nelas; nunca as exibe.
        </span>
      </PageHeader>

      {!native && (
        <p className="glass rounded-2xl p-3 text-sm text-mute">
          Modo navegador: provedores reais só funcionam no app desktop (
          <code>bun run tauri dev</code>).
        </p>
      )}

      {editing ? (
        <ProviderForm
          key={editing.initial?.id ?? editing.kind}
          kind={editing.kind}
          initial={editing.initial}
          existingIds={providers.map((p) => p.id)}
          discovered={discovered}
          onClose={() => setEditing(null)}
        />
      ) : (
        <div className="flex flex-wrap gap-3">
          {(["tapo", "homeassistant"] as const).map((k) => {
            const { name, color, Icon } = KIND[k];
            return (
              <button
                key={k}
                type="button"
                disabled={!native}
                onClick={() => setEditing({ kind: k })}
                className="glass spot flex min-h-14 items-center gap-3 rounded-2xl px-4 text-sm font-medium transition-transform active:scale-95 disabled:opacity-50"
              >
                <span
                  className="grid size-9 place-items-center rounded-xl"
                  style={{ background: `${color}26`, color }}
                >
                  <Icon size={22} weight="duotone" aria-hidden />
                </span>
                <span className="flex items-center gap-1.5">
                  <Plus size={14} aria-hidden /> {name}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <ul className="space-y-3">
        {providers.map((p, i) => {
          const res = results[p.id];
          const { color, Icon } = KIND[p.kind];
          return (
            <li
              key={p.id}
              style={{ "--i": i } as React.CSSProperties}
              className="rise glass spot rounded-3xl p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="grid size-12 shrink-0 place-items-center rounded-2xl"
                    style={{ background: `${color}26`, color }}
                  >
                    <Icon size={28} weight="duotone" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="font-display text-lg font-semibold leading-tight">{p.label}</p>
                    <p className="truncate text-xs text-mute">
                      {p.kind === "tapo" ? `${p.hosts.length} dispositivo(s)` : p.baseUrl}
                    </p>
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${p.hasCredentials ? "bg-teal/20 text-teal" : "bg-rose/15 text-rose"}`}
                >
                  {p.hasCredentials ? "credenciais no cofre" : "sem credenciais"}
                </span>
              </div>
              {errors[p.id] && <p className="mt-3 text-xs text-rose">{errors[p.id]}</p>}
              {res && (
                <p
                  role="status"
                  className={`mt-3 text-xs ${typeof res === "string" ? "text-mute" : res.ok ? "text-teal" : "text-rose"}`}
                >
                  {typeof res === "string" ? res : res.message}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => void test(p.id)} className={btn}>
                  Testar
                </button>
                <button
                  type="button"
                  onClick={() => setEditing({ kind: p.kind, initial: p })}
                  className={btn}
                >
                  Editar
                </button>
                {confirming === p.id ? (
                  <button
                    type="button"
                    onClick={() => {
                      setConfirming(null);
                      void remove(p.id);
                    }}
                    className="min-h-11 rounded-xl bg-rose px-4 text-sm font-semibold text-bg"
                  >
                    Confirmar remoção
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirming(p.id)}
                    className={`${btn} text-rose`}
                  >
                    Remover
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <label className="glass flex min-h-12 items-center gap-3 rounded-2xl px-4 text-sm">
        <input
          type="checkbox"
          checked={showDemo}
          onChange={(e) => setShowDemo(e.target.checked)}
          className="size-4 accent-[#3de0c3]"
        />
        Mostrar dispositivos de demonstração
      </label>
    </div>
  );
}
