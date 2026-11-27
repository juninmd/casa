import { Button, Checkbox, TextField } from "@juninmd/sonido";
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
    <form onSubmit={submit} className="space-y-4">
      <TextField
        label="Nome"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        required
        maxLength={60}
      />

      {kind === "tapo" ? (
        <div>
          <TextField
            multiline
            rows={4}
            label="IPs dos dispositivos (um por linha)"
            value={hosts}
            onChange={(e) => setHosts(e.target.value)}
            placeholder="192.168.1.11"
            style={{ fontFamily: "var(--sn-font-mono)" }}
            required
          />
          {discovered.length > 0 && (
            <Button
              variant="link"
              size="sm"
              className="mt-1"
              onClick={() => setHosts(discovered.join("\n"))}
            >
              Usar os {discovered.length} Tapo encontrados na varredura
            </Button>
          )}
        </div>
      ) : (
        <>
          <TextField
            label="URL do Home Assistant"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="http://homeassistant.local:8123"
            inputMode="url"
            required
          />
          {baseUrl.trim().startsWith("https://") && (
            <Checkbox
              checked={selfSigned}
              onChange={setSelfSigned}
              label="Aceitar certificado autoassinado"
              description="Menos seguro: só use em uma rede em que você confia."
            />
          )}
        </>
      )}

      {kind === "tapo" && (
        <TextField
          label="E-mail da conta TP-Link"
          type="email"
          autoComplete="off"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={
            editing && initial?.hasCredentials ? "salvo no cofre (deixe vazio para manter)" : ""
          }
          required={needSecret}
        />
      )}

      <TextField
        label={secretName}
        type="password"
        autoComplete="off"
        value={secret}
        onChange={(e) => setSecret(e.target.value)}
        placeholder={
          editing && initial?.hasCredentials ? "salva no cofre (deixe vazio para manter)" : ""
        }
        hint="A credencial vai direto para o cofre do sistema e nunca volta para esta tela."
        required={needSecret}
      />
      {destinationChanged && (
        <p className="text-xs text-amber">
          O destino mudou: por segurança, digite a credencial de novo.
        </p>
      )}

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
        <Button type="submit" variant="primary" size="lg" loading={busy}>
          {busy ? "Salvando…" : "Salvar e testar"}
        </Button>
        <Button variant="secondary" size="lg" onClick={onClose}>
          {report?.ok ? "Concluir" : "Cancelar"}
        </Button>
      </div>
    </form>
  );
}
