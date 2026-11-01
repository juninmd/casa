import { useState } from "react";
import {
  errText,
  type ProviderConfig,
  type ProviderKind,
  type ProviderView,
  type TestReport,
  testProvider,
} from "../platform/providers";
import { useProviders } from "../state/providers";

interface Props {
  kind: ProviderKind;
  initial?: ProviderView;
  existingIds: string[];
  /** Tapo IPs found by the network scan, offered as a one-click fill. */
  discovered: string[];
  onClose: () => void;
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 28);

function newId(kind: ProviderKind, label: string, taken: string[]): string {
  const base = `${kind === "tapo" ? "tapo" : "ha"}-${slug(label) || "conta"}`;
  let id = base;
  for (let n = 2; taken.includes(id); n++) id = `${base}-${n}`;
  return id;
}

const input =
  "min-h-12 w-full rounded-2xl border border-line bg-white/5 px-4 text-sm placeholder:text-mute/70 focus:border-teal/70";

export function ProviderForm({ kind, initial, existingIds, discovered, onClose }: Props) {
  const save = useProviders((s) => s.save);
  const [label, setLabel] = useState(
    initial?.label ?? (kind === "tapo" ? "Tapo" : "Home Assistant"),
  );
  const [hosts, setHosts] = useState(initial?.hosts.join("\n") ?? "");
  const [baseUrl, setBaseUrl] = useState(initial?.baseUrl ?? "");
  const [selfSigned, setSelfSigned] = useState(initial?.allowSelfSigned ?? false);
  const [username, setUsername] = useState("");
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<TestReport | null>(null);

  const editing = Boolean(initial);
  const hostList = hosts.split(/[\s,;]+/).filter(Boolean);
  // A stored secret may not follow a new destination: the backend refuses it, so ask for it here.
  const sorted = (xs: string[]) => [...xs].sort().join(",");
  const destinationChanged =
    editing &&
    (kind === "tapo"
      ? sorted(hostList) !== sorted(initial?.hosts ?? [])
      : baseUrl.trim().replace(/\/$/, "") !== (initial?.baseUrl ?? ""));
  const needSecret = !initial?.hasCredentials || destinationChanged;
  const secretName =
    kind === "tapo" ? "Senha da conta TP-Link" : "Token de acesso de longa duração";

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setBusy(true);
    setError(null);
    setReport(null);
    const id = initial?.id ?? newId(kind, label, existingIds);
    const config: ProviderConfig = {
      id,
      kind,
      label,
      hosts: kind === "tapo" ? hosts.split(/[\s,;]+/).filter(Boolean) : [],
      baseUrl: kind === "homeassistant" ? baseUrl.trim() : null,
      allowSelfSigned: kind === "homeassistant" && selfSigned,
    };
    try {
      await save(config, username.trim() || null, secret || null);
      // Secrets leave component state the moment they are handed to the backend.
      setSecret("");
      setUsername("");
      setReport(await testProvider(id));
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="glass space-y-4 rounded-3xl border-teal/50 p-5">
      <h2 className="font-display text-xl font-semibold">
        {editing ? "Editar" : "Novo"} provedor {kind === "tapo" ? "Tapo" : "Home Assistant"}
      </h2>

      <label className="block text-sm">
        <span className="mb-1 block text-mute">Nome</span>
        <input
          className={input}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          required
          maxLength={60}
        />
      </label>

      {kind === "tapo" ? (
        <label className="block text-sm">
          <span className="mb-1 block text-mute">IPs dos dispositivos (um por linha)</span>
          <textarea
            className={`${input} min-h-24 py-2 font-mono`}
            value={hosts}
            onChange={(e) => setHosts(e.target.value)}
            placeholder="192.168.1.11"
            required
          />
          {discovered.length > 0 && (
            <button
              type="button"
              onClick={() => setHosts(discovered.join("\n"))}
              className="mt-1 text-xs text-teal underline"
            >
              Usar os {discovered.length} Tapo encontrados na varredura
            </button>
          )}
        </label>
      ) : (
        <>
          <label className="block text-sm">
            <span className="mb-1 block text-mute">URL do Home Assistant</span>
            <input
              className={input}
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="http://homeassistant.local:8123"
              inputMode="url"
              required
            />
          </label>
          {baseUrl.trim().startsWith("https://") && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selfSigned}
                onChange={(e) => setSelfSigned(e.target.checked)}
              />
              Aceitar certificado autoassinado (menos seguro)
            </label>
          )}
        </>
      )}

      {kind === "tapo" && (
        <label className="block text-sm">
          <span className="mb-1 block text-mute">E-mail da conta TP-Link</span>
          <input
            className={input}
            type="email"
            autoComplete="off"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={
              editing && initial?.hasCredentials ? "salvo no cofre (deixe vazio para manter)" : ""
            }
            required={needSecret}
          />
        </label>
      )}

      <label className="block text-sm">
        <span className="mb-1 block text-mute">{secretName}</span>
        <input
          className={input}
          type="password"
          autoComplete="off"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder={
            editing && initial?.hasCredentials ? "salva no cofre (deixe vazio para manter)" : ""
          }
          required={needSecret}
        />
      </label>
      {destinationChanged && (
        <p className="text-xs text-amber">
          O destino mudou: por segurança, digite a credencial de novo.
        </p>
      )}
      <p className="text-xs text-mute">
        A credencial vai direto para o cofre do sistema e nunca volta para esta tela.
      </p>

      {error && (
        <p role="alert" className="rounded-xl bg-rose/15 p-3 text-sm text-rose">
          {error}
        </p>
      )}
      {report && (
        <p
          role="status"
          className={`rounded-xl p-3 text-sm ${report.ok ? "bg-teal/15 text-teal" : "bg-rose/15 text-rose"}`}
        >
          {report.ok ? "Conectado: " : "Salvo, mas a conexão falhou: "}
          {report.message}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={busy}
          className="min-h-12 rounded-2xl bg-teal px-6 text-sm font-semibold text-bg shadow-[0_8px_24px_-8px_#3de0c3] transition-transform active:scale-95 disabled:opacity-50"
        >
          {busy ? "Salvando…" : "Salvar e testar"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="min-h-12 rounded-2xl border border-line px-6 text-sm transition-colors hover:bg-white/8"
        >
          {report?.ok ? "Concluir" : "Cancelar"}
        </button>
      </div>
    </form>
  );
}
