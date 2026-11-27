import {
  Badge,
  Button,
  Card,
  ConfirmButton,
  Dialog,
  EmptyState,
  PageHeader,
  Skeleton,
  Switch,
  useToast,
} from "@juninmd/sonido";
import { House, Key, Plug, Plugs, Plus } from "@phosphor-icons/react";
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
import { ProviderForm } from "../ui/ProviderForm";

type Editing = { kind: ProviderKind; initial?: ProviderView } | null;

const KIND = {
  tapo: { name: "Tapo (TP-Link)", color: "#3de0c3", Icon: Plug },
  homeassistant: { name: "Home Assistant", color: "#6f9bff", Icon: House },
} as const;

export function ProvidersPage() {
  const { providers, errors, loaded, showDemo, setShowDemo, remove, refresh } = useProviders();
  const scanned = useStore((s) => s.scanned);
  const [editing, setEditing] = useState<Editing>(null);
  const [results, setResults] = useState<Record<string, TestReport | string>>({});
  const toast = useToast();
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
      toast({
        title: rep.ok ? "Conexão confirmada" : "A conexão falhou",
        description: rep.message,
        tone: rep.ok ? "success" : "danger",
      });
      void refresh();
    } catch (e) {
      const message = errText(e);
      setResults((r) => ({ ...r, [id]: message }));
      toast({ title: "Não deu para testar", description: message, tone: "danger" });
    }
  }

  async function drop(p: ProviderView) {
    try {
      await remove(p.id);
      toast({ title: "Provedor removido", description: p.label, tone: "success" });
    } catch (e) {
      toast({ title: "Não deu para remover", description: errText(e), tone: "danger" });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Provedores"
        titleAs="h1"
        accent
        icon={<Plugs size={22} weight="duotone" />}
        description={
          <span className="flex items-start gap-2">
            <Key size={18} weight="duotone" aria-hidden className="mt-0.5 shrink-0 text-amber" />
            Credenciais ficam no cofre do sistema (Gerenciador de Credenciais do Windows, Keychain
            ou Secret Service). O app só escreve nelas; nunca as exibe.
          </span>
        }
      />

      {!native && (
        <Card surface="glass" padding="sm" className="text-sm text-mute">
          <span>
            Modo navegador: provedores reais só funcionam no app desktop (
            <code>bun run tauri dev</code>).
          </span>
        </Card>
      )}

      <div className="flex flex-wrap gap-3">
        {(["tapo", "homeassistant"] as const).map((k) => {
          const { name, color, Icon } = KIND[k];
          return (
            <Button
              key={k}
              variant="secondary"
              size="lg"
              disabled={!native}
              onClick={() => setEditing({ kind: k })}
              iconStart={
                <span
                  className="grid size-9 place-items-center rounded-xl"
                  style={{ background: `${color}26`, color }}
                >
                  <Icon size={22} weight="duotone" aria-hidden />
                </span>
              }
              className="spot"
            >
              <span className="flex items-center gap-1.5">
                <Plus size={14} aria-hidden /> {name}
              </span>
            </Button>
          );
        })}
      </div>

      {editing && (
        <Dialog
          open
          onClose={() => setEditing(null)}
          title={`${editing.initial ? "Editar" : "Novo"} provedor ${KIND[editing.kind].name}`}
          description="A credencial vai direto para o cofre do sistema e nunca volta para esta tela."
        >
          <ProviderForm
            key={editing.initial?.id ?? editing.kind}
            kind={editing.kind}
            initial={editing.initial}
            existingIds={providers.map((p) => p.id)}
            discovered={discovered}
            onClose={() => setEditing(null)}
          />
        </Dialog>
      )}

      {!loaded ? (
        <Skeleton label="Carregando provedores" rows={3} media />
      ) : providers.length === 0 ? (
        <EmptyState
          icon={<Plug size={26} weight="duotone" />}
          title="Nenhum provedor conectado"
          description="Conecte uma conta Tapo ou um Home Assistant para trazer seus dispositivos para a casa."
        />
      ) : (
        <ul className="space-y-3">
          {providers.map((p, i) => {
            const res = results[p.id];
            const { color, Icon } = KIND[p.kind];
            return (
              <li key={p.id} style={{ "--i": i } as React.CSSProperties} className="rise">
                <Card surface="glass" padding="md" className="spot">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className="grid size-12 shrink-0 place-items-center rounded-2xl"
                        style={{ background: `${color}26`, color }}
                      >
                        <Icon size={28} weight="duotone" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="font-display text-lg font-semibold leading-tight">
                          {p.label}
                        </p>
                        <p className="truncate text-xs text-mute">
                          {p.kind === "tapo" ? `${p.hosts.length} dispositivo(s)` : p.baseUrl}
                        </p>
                      </div>
                    </div>
                    <Badge
                      tone={p.hasCredentials ? "success" : "danger"}
                      appearance="soft"
                      dot
                      className="shrink-0"
                    >
                      {p.hasCredentials ? "credenciais no cofre" : "sem credenciais"}
                    </Badge>
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
                    <Button variant="secondary" onClick={() => void test(p.id)}>
                      Testar
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setEditing({ kind: p.kind, initial: p })}
                    >
                      Editar
                    </Button>
                    <ConfirmButton
                      appearance="inline"
                      ask="Remover este provedor?"
                      confirmLabel="Remover"
                      cancelLabel="Cancelar"
                      onConfirm={() => void drop(p)}
                      className="min-h-11 rounded-xl border border-line px-4 text-sm text-rose transition-colors hover:bg-white/8"
                    >
                      Remover
                    </ConfirmButton>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <Card surface="glass" padding="sm">
        <Switch
          checked={showDemo}
          onChange={setShowDemo}
          label="Mostrar dispositivos de demonstração"
          description="Amostra local para navegar pelo app sem contas reais."
        />
      </Card>
    </div>
  );
}
