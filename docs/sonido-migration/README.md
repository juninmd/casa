# Migração para `@juninmd/sonido@2.5.0`

Casa passou a usar os componentes do Sonido nos pontos em que já existia um primitivo
genérico. O visual da casa foi preservado: o Sonido lê os tokens `--sn-*`, que foram
ligados ao ink, ao vidro, ao âmbar da lâmpada e ao teal de ação do app.

- Dependência: `@juninmd/sonido@^2.5.0` (bun, `bun.lock`).
- Estilos importados uma vez em `src/index.css`; `data-theme="dark"` no `<html>`.
- Nenhuma pasta `legacy/`, nenhum `preview.*` e nenhum harness de screenshot foi commitado.

## Componentes migrados

| Primitivo | Onde | Observação |
| --- | --- | --- |
| `Button` | `HomePage`, `ProvidersPage`, `NetworkPage`, `AutomationsPage`, `ProviderForm` | Ações primárias, secundárias, `link` e ícone usam as variantes do Sonido. |
| `Card` | `HomePage`, `ProvidersPage`, `NetworkPage`, `AutomationsPage`, `EnergyPage`, `RoadmapPage` | `surface="glass"` mantém o vidro da casa. |
| `PageHeader` | as 5 páginas | `titleAs="h1"`, `accent` onde faz sentido; título volta a ter escala de display via ponte CSS. |
| `StatTile` | `EnergyPage` | Hoje, pico e média no `aside` do cabeçalho. |
| `CountUp` | `EnergyPage`, `SkyHero` | Substitui o `CountUp` local (removido). |
| `Switch` | `ProvidersPage`, `AutomationsPage` | Demo e ativação de regra. |
| `TextField` | `ProviderForm`, `NetworkPage`, `RoadmapPage` | Inclui `multiline` para a lista de IPs. |
| `Checkbox` | `ProviderForm` | Certificado autoassinado. |
| `EmptyState` | `HomePage`, `ProvidersPage`, `NetworkPage`, `AutomationsPage` | Estados vazios reais, não decorativos. |
| `Skeleton` | `ProvidersPage` | Enquanto `loaded` é falso. |
| `Spinner` | `HomePage` | Atualização de dispositivos em andamento. |
| `Toast` / `ToastProvider` | `main.tsx`, `ProvidersPage` | Resultado de teste e remoção de provedor. |
| `Dialog` | `ProvidersPage` | O formulário de provedor agora abre em diálogo nativo. |
| `Badge` | `DeviceCard`, `ProvidersPage`, `NetworkPage`, `RoadmapPage` | Credenciais, confiança e status. |
| `ConfirmButton` (`appearance="inline"`) | `ProvidersPage` | Remoção em dois passos, no lugar do estado local. |
| `ProgressBar` | `EnergyPage` | Consumo por dispositivo. |
| `Select` | `RoadmapPage` | Filtro de categoria. |

Arquivos principais: `src/index.css`, `src/main.tsx`, `src/ui/Shell.tsx`,
`src/ui/ProviderForm.tsx`, `src/ui/DeviceCard.tsx`, `src/ui/SkyHero.tsx` e as páginas em
`src/pages/`. `src/ui/PageHeader.tsx` e `src/ui/CountUp.tsx` foram removidos.

## O que ficou local (visual de domínio)

`Ambient`, `SkyHero`, `RadarMap`, `RoomTile`, os chips de fluxo das automações e o anel de
participação do roadmap continuam locais: são visuais específicos da casa, sem equivalente
genérico no Sonido. Nenhum primitivo genérico foi clonado.

## Ponte de identidade

`src/index.css` mapeia `--sn-color-bg/surface/border/text/accent/...`, `--sn-glass*`,
`--sn-font*`, `--sn-radius*` e as sombras para os tokens da casa. Ação = teal, lâmpada =
âmbar, perigo = rose, superfícies = vidro. Dois ajustes de integração, ambos comentados no
CSS: o `h1` do `PageHeader` volta à escala de display da casa, e o `<dialog>` recupera
`margin: auto` (o preflight do Tailwind zera a margem nativa).

## Comandos e resultados

| Comando | Resultado |
| --- | --- |
| `bun add @juninmd/sonido@^2.5.0` | `@juninmd/sonido@2.5.0` instalado |
| `bun run lint` | passa (37 arquivos) |
| `bun test` | 32 pass, 0 fail (6 arquivos, 75 expectativas) |
| `bun run build` | passa (`tsc --noEmit` + Vite) |

### Falha só no Windows em `origin/master`

No checkout Windows de `origin/master`, `bun run lint` falha com 39 erros de formatação:
o Git entrega os arquivos em CRLF (`core.autocrlf=true`) e o Biome espera LF. Os testes
(32) e o build passam no mesmo checkout. Correção neste PR: `.gitattributes` com
`* text=auto eol=lf`, normalizando o working tree sem mudar o conteúdo dos blobs. Em Linux
o lint já passava; a falha era exclusiva do checkout Windows.

## Screenshots

- `antes.png`: harness efêmero com os primitivos antigos + CSS real, a partir de um
  worktree temporário de `origin/master` (porta 5336).
- `depois.png`: o mesmo conteúdo usando Sonido + CSS migrado, na working tree (porta 5326).
- Ambos em 1180×900 @2x, página inteira, via `shot/full.cjs`. Os harnesses foram apagados
  antes do commit; só os PNGs e este README ficam em `docs/sonido-migration/`.

## Ressalvas

- O `sonido.css` completo adiciona ~146 kB de CSS (35 kB gzip) ao bundle; o pacote não
  publica imports por componente.
- Provedores reais continuam exigindo o app Tauri; no navegador a página mostra o modo
  demo. Nenhuma credencial real foi usada nos screenshots.
- `Toast` é usado para testar/remover provedor; o erro persistente de dispositivo em
  `HomePage` continua inline, porque precisa sobreviver à navegação.
- PR em draft com a label `do-not-merge`: não deve ser mesclado.
