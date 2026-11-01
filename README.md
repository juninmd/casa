# Casa

Protótipo de home assistant em **Tauri 2 + React 19 + Tailwind 4**, um código para desktop e mobile.

## O que já funciona
- **Descoberta de LAN** (ping/TCP/ARP + banner HTTP) com classificação explicável por vendor, portas e banner.
- **Painel** responsivo: sidebar no desktop, tab bar com safe-area no mobile; cômodos, cenas e cartões acessíveis.
- **Motor de automação** local: gatilho (estado/horário) → condições → ações, com cascata limitada a 5 níveis.
- **Roadmap** com 110 features consolidadas de ~550 levantadas (`research/`), cada uma com viabilidade.
- Dispositivos de demo são virtuais; os descobertos entram como somente leitura (sem integração real ainda).

## Rodar
```sh
bun install
bun run dev                 # navegador, usa snapshot da rede (modo demo)
bun run tauri dev           # desktop, varredura nativa
bun run tauri android dev   # mobile (exige Android SDK/NDK)
```

## Verificar
```sh
bun run lint && bun run build && bun test
cd src-tauri && cargo test --lib
CASA_TEST_PREFIX=192.168.1 cargo test --lib -- --ignored --nocapture   # varredura real
```

## Mobile
Sem `arp` nem ICMP em Android/iOS: o scan degrada para TCP apenas (hosts que recusam conexão ainda aparecem). A build mobile **não foi testada** neste protótipo (sem SDK instalado); ícones Android/iOS já estão gerados.

## Estrutura
`src/core` lógica pura testada (classificador, automação) · `src/state` store · `src/pages` telas · `src-tauri/src/scan.rs` scanner · `research/` pesquisa e mapa da rede · `scripts/` scan de referência e gerador de OUI.
