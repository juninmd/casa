// Consolidated from research/01-home-assistant.md (299 items) and 02-outras-plataformas.md (253 items).
// Statuses are our own feasibility triage for a Tauri 2 + React app, not claims from the sources.
export type Status = "proto" | "viavel" | "depende" | "fora";

export interface Feature {
  category: string;
  name: string;
  status: Status;
  from: string[];
  note: string;
}

type Row = [name: string, status: Status, from: string, note: string];

const group = (category: string, rows: Row[]): Feature[] =>
  rows.map(([name, status, from, note]) => ({
    category,
    name,
    status,
    from: from.split(","),
    note,
  }));

const HA = "Home Assistant";
const OH = "openHAB";
const DZ = "Domoticz";
const IO = "ioBroker";

export const FEATURES: Feature[] = [
  ...group("Descoberta", [
    [
      "Varredura de LAN (ping/TCP/ARP)",
      "proto",
      `${DZ},${OH}`,
      "Comando Rust scan_lan, só redes privadas; fallback demo no navegador",
    ],
    [
      "Classificação por OUI + portas + banner",
      "proto",
      HA,
      "Explica o porquê (reasons) e dá grau de confiança",
    ],
    ["Inbox: adicionar ao painel", "proto", OH, "Importa host como entidade somente leitura"],
    ["Aprovar/ignorar com auto-ignore de duplicata", "viavel", OH, "Falta persistir decisões"],
    ["mDNS / Zeroconf", "viavel", HA, "Crate mdns-sd no backend Rust"],
    [
      "SSDP / UPnP",
      "viavel",
      `${HA},${OH}`,
      "M-SEARCH em UDP 1900; já validado no scan de PowerShell",
    ],
    [
      "Descoberta por DHCP / ARP passivo",
      "depende",
      HA,
      "Escutar DHCP exige privilégio e não existe no mobile",
    ],
    ["Bluetooth LE", "depende", HA, "btleplug em desktop; mobile via plugin nativo"],
    [
      "Monitor de serviço (ping/HTTP, latência)",
      "viavel",
      "Homepage,Dashy,Homarr",
      "reqwest + ICMP; histórico em SQLite",
    ],
    ["Docker/K8s label discovery", "viavel", "Homepage,Homarr", "Só útil se houver Docker na LAN"],
  ]),
  ...group("Protocolos e integrações", [
    [
      "TP-Link Tapo (tomadas e lâmpadas)",
      "proto",
      HA,
      "Protocolo local AES passthrough, validado contra a fonte do python-kasa; as 4 tomadas da rede o falam. Câmeras/hubs Tapo usam outro protocolo",
    ],
    [
      "Tapo KLAP (firmware mais novo)",
      "viavel",
      HA,
      "As tomadas atuais recusaram KLAP (403); só vale se algum firmware migrar",
    ],
    ["Tuya (protocolo local 6668)", "depende", HA, "Precisa da local key obtida na nuvem Tuya"],
    [
      "RTSP / ONVIF (câmeras)",
      "viavel",
      `${HA},Frigate`,
      "Stream via go2rtc/WebRTC; ONVIF para PTZ e eventos",
    ],
    [
      "MQTT + discovery",
      "viavel",
      `${HA},${OH},${IO}`,
      "Cliente MQTT em Rust; base para Zigbee2MQTT e Tasmota",
    ],
    ["ESPHome (API nativa)", "viavel", HA, "Protocolo protobuf sobre TCP 6053"],
    [
      "Alexa / Google (exposição de entidades)",
      "depende",
      `${HA},${IO}`,
      "Exige nuvem, skill ou conta de desenvolvedor",
    ],
    ["Chromecast / Google Cast", "viavel", HA, "Porta 8009 já aparece no scan"],
    ["Philips Hue", "depende", HA, "Bridge local com pareamento por botão"],
    ["Shelly (HTTP/RPC local)", "viavel", HA, "API local aberta, sem conta"],
    ["Samsung / LG webOS TV", "depende", HA, "Pareamento na TV, protocolos proprietários"],
    ["Sonos", "viavel", HA, "UPnP/SOAP local na porta 1400"],
    [
      "Zigbee (ZHA / Zigbee2MQTT)",
      "fora",
      `${HA},${IO}`,
      "Exige coordenador de rádio USB; via Z2M só consumir MQTT",
    ],
    ["Z-Wave JS", "fora", HA, "Exige controlador USB e servidor Z-Wave JS"],
    ["Matter / Thread", "depende", HA, "Commissioning via BLE e border router"],
    ["HomeKit (HAP bridge)", "fora", "Homebridge", "Implementar HAP é projeto à parte"],
    [
      "Integração via Webhooks/REST genérica",
      "viavel",
      `${HA},Node-RED`,
      "Chamar APIs HTTP como ação de automação",
    ],
  ]),
  ...group("Conexão com Home Assistant", [
    [
      "Cliente WebSocket (auth, get_states)",
      "viavel",
      HA,
      "auth_required → auth com Long-Lived Token; ids crescentes",
    ],
    ["subscribe_events / subscribe_entities", "viavel", HA, "Estado ao vivo sem polling"],
    [
      "call_service (ligar, desligar, cenas)",
      "proto",
      HA,
      "turn_on/turn_off por REST em luz, switch, fan, input_boolean, media_player; fechaduras ficam somente leitura",
    ],
    [
      "REST API (/api/states, /api/services)",
      "proto",
      HA,
      "Listagem e comandos com token Bearer; testado contra um HA simulado",
    ],
    [
      "Token guardado no cofre do SO",
      "proto",
      HA,
      "Credential Manager/Keychain/Secret Service; canal só de escrita, nunca volta ao webview. Android ainda sem cofre",
    ],
    [
      "OAuth / login flow do HA",
      "viavel",
      HA,
      "client_id precisa ser uma URL https hospedada; sem site próprio, usar token",
    ],
  ]),
  ...group("Dashboard e UI", [
    [
      "Layout responsivo desktop/mobile",
      "proto",
      "Homarr,Lovelace",
      "Sidebar no desktop, tab bar com safe-area no mobile",
    ],
    [
      "Cartões de dispositivo com toggle acessível",
      "proto",
      HA,
      "role=switch, alvo de toque ≥ 44px",
    ],
    ["Filtro por cômodo", "proto", `${HA},${IO}`, "Áreas; falta andares e labels"],
    ["Cenas rápidas", "proto", HA, "Dormir, Cinema, Sair"],
    [
      "Tema claro/escuro e dinâmico",
      "viavel",
      `${HA},Homepage`,
      "Hoje só escuro; tokens já estão em @theme",
    ],
    [
      "Edição de dashboard por arrastar e soltar",
      "viavel",
      `${HA},Homarr`,
      "dnd-kit + grid; layouts por breakpoint",
    ],
    [
      "Seções / cards customizados (gráfico, mapa, calendário)",
      "viavel",
      HA,
      "Registro de widgets em React",
    ],
    [
      "Modo kiosk / wall panel",
      "viavel",
      `HADashboard,${OH}`,
      "Janela fullscreen, retorno automático por inatividade",
    ],
    ["Planta baixa interativa", "viavel", `${OH},${DZ},Jeedom`, "SVG com entidades posicionadas"],
    ["Busca global / paleta de comandos", "viavel", HA, "Ctrl+K sobre entidades, páginas e ações"],
    ["Badges e status de relance", "viavel", HA, "Contagem de luzes acesas e câmeras já existe"],
    ["Internacionalização", "viavel", "Homarr,Dashy", "UI hoje fixa em pt-BR"],
    ["Mapa com zonas e pessoas", "viavel", HA, "Leaflet/MapLibre"],
    [
      "Widgets de tela inicial (Android/iOS)",
      "fora",
      `${HA},${OH}`,
      "Código nativo; fora do Tauri puro",
    ],
    ["Apple Watch / Wear OS / Android Auto", "fora", HA, "Apps nativos separados"],
  ]),
  ...group("Entidades e domínios", [
    ["Luz (liga/desliga)", "proto", HA, "Demo local; real via integração"],
    ["Luz com brilho, cor e temperatura", "viavel", HA, "Depende do protocolo do dispositivo"],
    ["Interruptor / tomada", "proto", HA, "Demo local"],
    [
      "Sensor numérico com unidade",
      "proto",
      HA,
      "Temperatura no demo; histórico é a próxima etapa",
    ],
    ["Fechadura e porta", "proto", HA, "Demo local"],
    ["Câmera (lista e status)", "proto", HA, "Sem vídeo ainda"],
    ["Climate / termostato", "viavel", HA, "Modelo com setpoint, modo e umidade"],
    ["Cover / cortina / portão", "viavel", HA, "Posição 0-100 e comandos open/close/stop"],
    ["Media player", "viavel", HA, "Play, volume, fonte; Cast e Sonos"],
    ["Alarm panel", "viavel", `${HA},${DZ}`, "Estados armado/desarmado com código"],
    ["Aspirador, ventilador, umidificador", "viavel", HA, "Mesmo modelo de entidade com atributos"],
    ["Binary sensor com device_class", "viavel", HA, "Porta, movimento, fumaça, presença"],
    ["Update / reparos / saúde do sistema", "viavel", HA, "Tela de diagnóstico"],
    [
      "Pessoas e presença",
      "viavel",
      `${HA},Gladys`,
      "Por ping/ARP do celular; geofence só no mobile",
    ],
    ["Calendário e lista de tarefas", "viavel", HA, "ICS local e CalDAV"],
    ["Clima / previsão do tempo", "viavel", HA, "Open-Meteo sem chave"],
  ]),
  ...group("Automação", [
    ["Gatilho por estado", "proto", HA, "state → ligado/desligado"],
    ["Gatilho por horário", "proto", HA, "HH:MM; scheduler real é a próxima etapa"],
    ["Condições (AND)", "proto", HA, "Avaliadas no momento do gatilho"],
    ["Ações em múltiplas entidades", "proto", HA, "set liga/desliga"],
    [
      "Proteção contra loop de cascata",
      "proto",
      "Node-RED",
      "Limite de 5 níveis, coberto por teste",
    ],
    [
      "Registro de execução (trace simplificado)",
      "proto",
      HA,
      "Mostra quais regras rodaram ou foram bloqueadas",
    ],
    ["Liga/desliga regra", "proto", HA, "Switch por automação"],
    ["Persistência das regras", "viavel", HA, "SQLite local; hoje em memória"],
    ["Gatilho por sol (nascer/pôr)", "viavel", `${HA},${DZ}`, "Cálculo astronômico puro"],
    ["Gatilho numérico (threshold) e janela de tempo", "viavel", HA, "Acima/abaixo, por N minutos"],
    ["OR, NOT, choose, repeat, delay, wait", "viavel", HA, "Estender o motor para árvore de ações"],
    ["Editor visual de regras", "viavel", `${HA},Node-RED`, "Formulário primeiro, grafo depois"],
    [
      "Blueprints / templates de regra",
      "viavel",
      `${HA},Jeedom`,
      "Regra parametrizada exportável em JSON",
    ],
    ["Helpers: contador, timer, input_*", "viavel", HA, "Entidades virtuais"],
    ["Timers ricos (aleatório, sol, semanas)", "viavel", DZ, "Puro cálculo"],
    ["Templates (Jinja-like)", "viavel", HA, "Mini linguagem de expressão segura, sem eval"],
    ["Scripting (Blockly / JS)", "viavel", `${OH},${IO}`, "Sandbox obrigatório; depois do motor"],
    ["Cenas com snapshot do estado atual", "viavel", HA, "Capturar e restaurar"],
  ]),
  ...group("Voz e IA", [
    [
      "Interpretador de frases por templates",
      "viavel",
      "Jeedom,Assist",
      "Intents locais sem STT pesado",
    ],
    ["Assist do HA como backend de conversa", "viavel", HA, "conversation/process via WebSocket"],
    [
      "LLM com ferramentas sobre as entidades",
      "viavel",
      HA,
      "Gateway LiteLLM do cluster; só entidades expostas",
    ],
    ["STT / TTS local (Whisper / Piper)", "depende", HA, "Modelos pesados; GPU ajuda"],
    ["Wake word", "depende", HA, "openWakeWord; microfone sempre ligado no mobile é restrito"],
    ["Siri Shortcuts / Google Assistant", "fora", `${HA},Homey`, "Integrações da plataforma"],
  ]),
  ...group("Energia", [
    ["Painel de consumo diário", "proto", HA, "Série simulada, marcada como tal"],
    ["Consumo por dispositivo", "proto", HA, "Barras simuladas"],
    ["Medição real (Tapo P110, Shelly)", "depende", HA, "Precisa do hardware com medidor"],
    ["Tarifas e custo em R$", "viavel", HA, "Bandeira tarifária da ANEEL; tabela editável"],
    ["Solar, bateria, rede, gás, água", "depende", HA, "Depende de inversor e medidores"],
    ["Estatísticas de longo prazo", "viavel", `${HA},${OH}`, "Agregação horária em SQLite"],
  ]),
  ...group("Dados e histórico", [
    ["Histórico de estados e logbook", "viavel", HA, "Tabela de eventos com retenção configurável"],
    ["Gráficos por sensor", "viavel", `${OH},${DZ},Jeedom`, "SVG próprio ou uPlot"],
    [
      "Notificações push",
      "depende",
      `${HA},${OH}`,
      "ntfy/Telegram são locais-first; FCM/APNs exigem conta",
    ],
    ["Geofencing", "depende", `${HA},Gladys`, "Permissão de localização no mobile"],
    ["Sensores do celular (bateria, Wi-Fi)", "depende", HA, "Plugin nativo no Tauri mobile"],
    ["NFC / QR tags", "depende", HA, "Plugin NFC do Tauri mobile"],
  ]),
  ...group("Sistema e segurança", [
    [
      "Cofre de credenciais write-only",
      "proto",
      "—",
      "Segredos nunca em disco nem no estado do front; provado por teste e por E2E",
    ],
    [
      "Provedores configuráveis (Tapo, Home Assistant)",
      "proto",
      HA,
      "Cadastro, teste de conexão, edição e remoção; cooldown de 30 s após falha de login",
    ],
    [
      "Guarda de rede privada na varredura",
      "proto",
      "—",
      "Rust recusa faixas públicas; coberto por teste",
    ],
    [
      "Multiusuário e perfis (admin/morador/convidado)",
      "viavel",
      "Jeedom,Gladys,Homarr",
      "Perfis limitados por entidade",
    ],
    ["2FA / TOTP", "viavel", DZ, "Só faz sentido com servidor próprio"],
    [
      "Backup e restauração cifrados",
      "viavel",
      "Dashy,Jeedom,Homebridge",
      "Exportar JSON + AES-GCM",
    ],
    [
      "Export/import de configuração versionável",
      "viavel",
      "Homepage,Node-RED",
      "YAML/JSON em Git",
    ],
    [
      "Acesso remoto sem abrir portas",
      "depende",
      "openHAB Cloud,Gladys Plus",
      "Tailscale/Cloudflare Tunnel",
    ],
    ["Atualização automática do app", "viavel", "—", "Plugin updater do Tauri com assinatura"],
    [
      "Add-ons / Supervisor (containers)",
      "fora",
      HA,
      "Gerência de containers é papel de um servidor",
    ],
    ["Marketplace de integrações (HACS)", "fora", HA, "Exige modelo de plugins e revisão"],
    [
      "Modo offline / local-first",
      "viavel",
      `Jeedom,${DZ}`,
      "Estado local; sincronizar ao reconectar",
    ],
    [
      "Acessibilidade (teclado, leitor, contraste)",
      "proto",
      "Dashy",
      "Foco visível, aria, reduced-motion",
    ],
  ]),
];
