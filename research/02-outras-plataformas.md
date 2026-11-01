# 02 — Outras plataformas de automação residencial e dashboards (além do Home Assistant)

Pesquisa feita em 2026-11-01 para o app Tauri + React + Tailwind (desktop + mobile) com descoberta de dispositivos na LAN. Objetivo: catalogar o superconjunto de features e o que cada projeto tem de diferente do Home Assistant (HA).

## Legenda e método

- Fontes: sites oficiais, docs oficiais e GitHub de cada projeto. Cada bullet cita a URL lida. Páginas lidas via WebFetch (resumo por modelo pequeno), então detalhes finos podem ter perdido nuance.
- Stars/licença/linguagem: `api.github.com/repos/<owner>/<repo>` em 2026-11-01. Valores são aproximados e alguns parecem baixos frente ao que eu lembrava (ex.: openhab-addons); tratar como ordem de grandeza.
- `[NC]` = não confirmado nesta pesquisa (página 404/bloqueada, ou a página lida não cobre). Nada marcado `[NC]` deve ser tratado como fato.
- `[PROP]` = proprietário/fechado.
- `[ANÁLISE]` = opinião minha, sem fonte.
- Docs do Jeedom em doc.jeedom.com retornaram 404 ao fetcher; usei `docs/en_US/*.md` do repo jeedom/core (raw.githubusercontent.com), que é a fonte da própria doc.

## Resumo

| Projeto | Stars (~) | Licença | Stack | Diferencial frente ao HA |
|---|---|---|---|---|
| openHAB (core) | 1.2k (addons 2.1k, webui 0.26k) | EPL-2.0 | Java/OSGi, Vue (webui) | Modelo Thing/Channel/Item/Link, semantic model, persistência com extensões |
| Domoticz | 3.8k | GPL-3.0 | C++ | Leve (<50 MB RAM), timers ricos, scenes vs groups, Plans/Floorplans |
| ioBroker | 1.4k (js-controller 0.3k) | MIT | Node.js | Adapters como processos, objects/states DB, enums rooms/functions, multihost |
| Homebridge | 25.5k | Apache-2.0 | TypeScript/Node | Ponte HAP/HomeKit (e Matter v2) para dispositivos não-HomeKit, child bridges |
| Jeedom | 0.4k | GPL-2.0 (segundo API GitHub) | PHP | Scenarios com blocos, Interactions (linguagem natural), Design 2D/3D, Market |
| Gladys Assistant | 3.3k | Apache-2.0 | Node.js + SQLite (DuckDB p/ estados), Preact (front) [NC front] | Privacy-first, scenes por UI, presença/sono/trabalho como eventos, energia FR |
| Node-RED | 23.8k | Apache-2.0 | Node.js | Programação por fluxos; biblioteca com 6.340 nodes; dashboards via FlowFuse |
| Homey / Hubitat | n/a | [PROP] | n/a | Flows/Moods (Homey); processamento local + Rule Machine (Hubitat) |
| AppDaemon / HADashboard | 1.0k | NOASSERTION (API) [NC] | Python | Apps Python event-driven; dashboard .dash para wall tablets |
| Homepage (gethomepage) | 33.5k | GPL-3.0 | JS (Next.js) [NC framework] | YAML estático + Docker label discovery; 164 widgets de serviço |
| Homarr | 5.3k | Apache-2.0 | TypeScript | Boards drag-and-drop, 91+ integrações, OIDC/LDAP, permissões |
| Dashy | 26.9k | MIT | Vue | Status checks, config editor ao vivo, cloud backup cifrado, multi-page |
| Home Panel | 0.2k (arquivado) | MIT | TypeScript (Next.js/Prisma) | Frontend alternativo ao HA; arquivado 2025-03 |
| Dasherr | 0.2k | GPL-3.0 | JavaScript | Dashboard mínimo, 1 arquivo JSON |

Fontes das tabelas: `https://api.github.com/repos/openhab/openhab-core`, `.../domoticz/domoticz`, `.../ioBroker/ioBroker`, `.../homebridge/homebridge`, `.../jeedom/core`, `.../GladysAssistant/Gladys`, `.../node-red/node-red`, `.../AppDaemon/appdaemon`, `.../gethomepage/homepage`, `.../homarr-labs/homarr`, `.../Lissy93/dashy`, `.../timmo001/home-panel`, `.../erohtar/Dasherr`.

---

## 1. openHAB

- **Licença/stack** — EPL-2.0; core em Java (OSGi), webui em Vue; ~429 bindings listados (fonte: https://www.openhab.org/addons/)
- **Modelo Thing / Channel / Item / Link** — Things são entidades adicionáveis (dispositivo físico ou web service), expõem Channels; Items têm estado e recebem comandos; Link liga 1 Channel a 1 Item (N:N permitido); Bindings escondem o protocolo (fonte: https://www.openhab.org/docs/concepts/)
- **Inbox de descoberta** — resultados de discovery viram sugestões com TTL; aprovar cria Thing, ignorar esconde; background discovery por serviço; auto-ignore de duplicatas; `autoApprove` opcional (fonte: https://www.openhab.org/docs/concepts/discovery.html)
- **Tipos de Item** — Switch, Dimmer, Color, Rollershutter, Player, Contact, String, Number, `Number:<Dimension>` (com unidades), Location, DateTime, Image, Call, Group (fonte: https://www.openhab.org/docs/configuration/items.html)
- **Groups com agregação** — estado derivado de membros: EQUALITY, AND/OR/NAND/NOR/XOR, SUM/AVG/MEDIAN/MIN/MAX, COUNT, LATEST/EARLIEST; comando em Group vai para todos os membros (fonte: https://www.openhab.org/docs/configuration/items.html)
- **Tags e metadata** — tags em Items alimentam semantic model e assistentes de voz; metadata arbitrária (ex.: `expire`, `voiceSystem`) (fonte: https://www.openhab.org/docs/configuration/items.html)
- **Unidades de medida** — `Number:Temperature` etc. com conversão de unidade; no semantic model permite persistência/médias coerentes (fonte: https://www.openhab.org/docs/tutorial/model.html)
- **expire** — Item volta a UNDEF (ou estado/comando definido) após duração sem update; timer reinicia a cada update (fonte: https://www.openhab.org/docs/configuration/items.html)
- **autoupdate** — openHAB prevê o estado resultante de um comando; pode ser forçado/desligado por Item (fonte: https://www.openhab.org/docs/configuration/items.html)
- **Semantic model (Location > Equipment > Point + Property)** — hierarquia via Group Items e tags; Location (prédio/andar/cômodo), Equipment (dispositivo), Point (sensor/controle), Property (o que mede); cada elemento tem 1 só pai (fonte: https://www.openhab.org/docs/tutorial/model.html)
- **Páginas automáticas a partir do modelo** — Main UI gera abas Location/Equipment/Properties com cards e badges (ex.: abertura, média de temperatura) (fonte: https://www.openhab.org/docs/tutorial/model.html)
- **Semantics Actions em regras** — achar Location/Equipment de um Item para regras genéricas ("apagar luzes da cozinha") (fonte: https://www.openhab.org/docs/tutorial/model.html)
- **Editor de modelo na UI** — Settings > Model; "Create Equipment from Thing" gera Points a partir dos Channels (fonte: https://www.openhab.org/docs/tutorial/model.html)
- **Persistência multi-serviço** — vários serviços ao mesmo tempo (rrd4j, InfluxDB, JDBC citados); um serviço default alimenta gráficos e regras; config por `.persist` ou UI (fonte: https://www.openhab.org/docs/configuration/persistence.html)
- **Estratégias de persistência** — `everyChange`, `everyUpdate`, `restoreOnStartup`, `forecast`, mais cron (Quartz) nomeadas (fonte: https://www.openhab.org/docs/configuration/persistence.html)
- **Filtros de persistência** — equals/not-equals, threshold (relativo ou absoluto), faixas include/exclude, filtro de tempo mínimo entre valores, aliases (fonte: https://www.openhab.org/docs/configuration/persistence.html)
- **Extensões de consulta em regras** — `persistedState`, `lastChange`, `averageSince`, `maximumSince`, `countStateChanges`, `riemannSum` (LEFT/RIGHT/TRAPEZOIDAL/MIDPOINT), variância, desvio (fonte: https://www.openhab.org/docs/configuration/persistence.html)
- **Gráficos/Charts de persistência** — página Chart na Main UI: séries, agregados, heatmap, calendário, seleção de período; resultados do Analyzer salvos como página (fonte: https://www.openhab.org/docs/ui/)
- **Rules DSL** — linguagem Xbase/Xtend interpretada, sem compilar; triggers de Item (comando/update/change), Group, tempo (cron, horários nomeados), sistema (startup), Thing status, Channel trigger (fonte: https://www.openhab.org/docs/configuration/rules-dsl.html)
- **Timers e locks em regras** — timers agendados/reagendáveis, locks de concorrência, caches compartilhados/privados (fonte: https://www.openhab.org/docs/configuration/rules-dsl.html)
- **Scripting multi-linguagem (JSR223)** — JS (GraalJS, ES2024+), JRuby, Groovy, Python 3 (GraalVM); legados Nashorn e Jython; arquivos em `automation/jsr223/`, hot-reload, start level por nome de arquivo; lib `openhab-js` (fonte: https://www.openhab.org/docs/configuration/jsr223.html)
- **Blockly** — editor visual, >50 blocos específicos, gera JS (requer JS Scripting); categorias: Items/Things, Timers, Voz, Unidades, Datas, Ephemeris (feriados), Notificações, Persistência, Value Storage, HTTP, Run, Log; blocos de comunidade (fonte: https://www.openhab.org/docs/configuration/blockly/)
- **Regras/Scenes/Scripts na UI** — Script Actions/Conditions usados em regras da UI; docs específicas da UI de rules retornaram 404 `[NC]` detalhes de scenes/templates (fonte: https://www.openhab.org/docs/configuration/jsr223.html)
- **Actions** — HTTP (GET/PUT/POST/DELETE, setImage), Exec, event bus (sendCommand/postUpdate, store/restore), logging, Semantics, Timers, Thing status, cores (HSB/RGB/xy), Ephemeris, notificações cloud (fonte: https://www.openhab.org/docs/configuration/actions.html)
- **Transformations** — MAP, JSONPATH, JS (+ DSL/PY/RB/GROOVY via script) em labels, regras, profiles de link e bindings (fonte: https://www.openhab.org/docs/configuration/transformations.html)
- **Profiles de link** — transformação aplicada entre Channel e Item (ex.: `profile="transform:JS"`) (fonte: https://www.openhab.org/docs/configuration/transformations.html)
- **Main UI: tipos de página** — Layout (responsivo ou grid fixo), Map (marcadores em mapa), Floorplan (imagem própria), Chart, Tabs; designer com abas Design/Code (YAML), preview Run (Ctrl+R) (fonte: https://www.openhab.org/docs/ui/)
- **Sitemaps** — hierarquia de páginas com controles simples em `.sitemap` ou UI; renderizadas por Basic UI e apps nativos (não pela Main UI) (fonte: https://www.openhab.org/docs/ui/)
- **Widgets e bibliotecas pessoais** — widgets embutidos ou da biblioteca pessoal; `pageStyle`/`modalStyle` CSS; `visibleTo` por role (`user`, `administrator`) ou usuário, explicitamente "não é controle de segurança" (fonte: https://www.openhab.org/docs/ui/)
- **HABPanel** — dashboard de widgets/kiosk antigo; página oficial retornou 404 e a doc de UI não informa deprecação `[NC]` status (fonte: https://www.openhab.org/docs/ui/)
- **Voz: pipeline completo** — audio source (javasound/PulseAudio), keyword spotter (Porcupine), STT (Vosk), interpreters (built-in EN/DE/FR/ES, rule-based, LLM multi-turn com tools), TTS (VoiceRSS), audio sink (speaker, webaudio, Sonos); dialog processor combina tudo; comandos `startdialog`, `listenandanswer` (fonte: https://www.openhab.org/docs/configuration/multimedia.html)
- **Permissão de voz por Item** — `NO_ACCESS`/`READ_ONLY`/`READ_WRITE` via metadata `voiceSystem`, herdada de Groups (fonte: https://www.openhab.org/docs/configuration/multimedia.html)
- **openHAB Cloud / myopenHAB** — acesso remoto sem abrir portas, push via FCM (título, imagem, até botões de ação), OAuth2 para Alexa/Google Home, IFTTT em instância privada (fonte: https://www.openhab.org/addons/integrations/openhabcloud/)
- **App Android** — controla servidor/cloud/myopenHAB, notificações, NFC tags, voz, envio de alarm clock, tablets de parede, plugin Tasker, sitemaps; build "foss" sem FCM (fonte: https://github.com/openhab/openhab-android)
- **App iOS** — companion Apple Watch (escolhe sitemap), push com mídia e até 3 botões, ações do Shortcuts (get/set de estado, trocar de "home"), `device:tts`; target de widget existe mas não documentado `[NC]` (fonte: https://github.com/openhab/openhab-ios)
- **openHABian** — imagem pronta p/ Raspberry Pi: Samba, ZRAM (reduz desgaste de SD), setup headless, hotspot Wi-Fi fallback (comitup), Tailscale, relay SMTP, Amanda backup; opcionais Grafana+InfluxDB, Node-RED, Mosquitto, ESPHome, deCONZ, KNXd (fonte: https://www.openhab.org/docs/installation/openhabian.html)
- **Catálogo de add-ons por categoria** — bindings, system integrations, automation, persistence, transformation, voice, UI (fonte: https://www.openhab.org/addons/)
- **Multiusuário/RBAC, backup CLI, REST API, OIDC** — existem na minha memória (roles administrator/user, `openhab-cli backup`) mas as páginas lidas retornaram 404 `[NC]` (fonte: tentativas em https://www.openhab.org/docs/administration/)

**O que openHAB tem de diferente do HA**
- Separação formal Thing (dispositivo) / Channel (capacidade) / Item (abstração de UI+regras) com Link N:N, em vez de entidade única.
- Semantic model hierárquico (Location/Equipment/Point/Property) como cidadão de primeira classe, que gera UI sozinho; HA tem Areas/Floors/Labels (mais plano).
- Persistência plugável e múltipla, com API de consulta em regras (médias, integrais, contagem de mudanças) e filtros na gravação.
- Scripting em várias linguagens + Blockly gerando JS; apps nativos (Android/iOS) próprios com NFC, Watch, Tasker.

---

## 2. Domoticz

- **Licença/stack** — GPL-3.0, C++, HTML5 web frontend responsivo; Linux, Windows, macOS, FreeBSD, Raspberry Pi/ARM, Docker; <50 MB de RAM (fonte: https://github.com/domoticz/domoticz e https://www.domoticz.com/)
- **Hardware/protocolos** — >150 tipos: Z-Wave, Zigbee, MQTT, RFXCOM, Philips Hue, 1-Wire, EnOcean, P1 smart meter, YouLess, contadores de pulso; sensores de temperatura, chuva, vento, UV, energia, gás, água (fonte: https://github.com/domoticz/domoticz)
- **Auto-aprendizado de sensores/switches** — dispositivos novos aparecem sozinhos; também criação manual de códigos de switch e compartilhamento de dispositivos externos (fonte: https://github.com/domoticz/domoticz)
- **Dashboard dinâmico + gráficos** — gráficos de temperatura/sensores, timers por switch (fonte: https://www.domoticz.com/)
- **Timers por dispositivo** — em switch, group, scene ou termostato; múltiplos por device; tipos incluem "x minutos após o pôr do sol", mensal, dias específicos, diário em hora fixa (fonte: https://wiki.domoticz.com/Automation)
- **Timers: campos no código** — `bUseRandomness` (aleatoriedade), bitmask de dias (`Days`), `MDay`/`Month`/`Occurence`, ajuste por nascer/pôr do sol, `Temperature` para setpoint, `bIsScene`/`bIsThermostat` (fonte: https://raw.githubusercontent.com/domoticz/domoticz/development/main/Scheduler.h); lista exata de tipos (ex.: semanas pares/ímpares) `[NC]`; existe add-on de comunidade para plano semanal em 2 semanas (fonte: https://github.com/syrhus/domoticz-weekly-planning)
- **Timer Plans** — agrupar timers em planos para trocar de agenda (ex.: férias) (fonte: https://wiki.domoticz.com/Automation)
- **Scenes vs Groups** — group liga/desliga junto, cada device mantém dim/cor; scene só é ativada (não "desliga"), exige outra scene/group para apagar (fonte: https://wiki.domoticz.com/Automation)
- **Eventos/automação** — scripts em Blockly, dzVents (Lua), Lua, Python; triggers: Device, Security, Time (a cada minuto), User Variable; editor na UI guarda scripts no DB; aba "Device current states" (fonte: https://wiki.domoticz.com/Events)
- **dzVents wizard** — "automation wizard" sem código adicionado na versão 2026.2 (fonte: https://wiki.domoticz.com/Events)
- **commandArray** — comandos temporizados `On FOR 10`, `On RANDOM 30`, `On AFTER 10`; prefixos `Scene:`/`Group:`; `SendNotification`, `OpenURL`, `Variable:` (fonte: https://wiki.domoticz.com/Events)
- **Scripts em arquivo fora do backup** — Lua/dzVents/Python em disco não entram no Backup & Restore padrão (fonte: https://wiki.domoticz.com/Automation)
- **Device On/Off Action** — executa URL ou script ao ligar/desligar um device (fonte: https://wiki.domoticz.com/Automation)
- **Room Plans** — agrupam devices por cômodo (Setup > More options > Plans) (fonte: https://wiki.domoticz.com/Floorplans)
- **Floor Plans** — upload de imagem da planta, desenhar área de cada cômodo, arrastar devices, controlar switch direto na planta; devices podem aparecer só na planta; vários andares; habilitar por usuário (fonte: https://wiki.domoticz.com/Floorplans)
- **Notificações** — 13 serviços: Prowl, IFTTT, NMA, PushBullet, Pushsafer, Pushover, Pushalot, Clickatell SMS, Custom HTTP/Action, Kodi, Logitech Media Server, Google Cloud Messaging, Telegram; configuradas por device com intervalo mínimo (fonte: https://wiki.domoticz.com/Notifications)
- **Plugins Python** — framework de plugins (hardware/integrações), gerenciadores PP-Manager/PyPluginStore; reinício obrigatório após instalar (fonte: https://wiki.domoticz.com/Plugins)
- **Dummy hardware** — switches/sensores virtuais (fonte: https://wiki.domoticz.com/Main_Page)
- **Energy dashboard** — fluxos de energia (P1/Grid mínimo), devices custom (boiler, EV), custo em tempo real com preço dinâmico, linhas de fluxo e ícones custom (fonte: https://wiki.domoticz.com/Energy_dashboard)
- **2FA TOTP por usuário** — Authy/FreeOTP/Google Authenticator (fonte: https://wiki.domoticz.com/MyProfile)
- **Apps móveis** — Domoticz App Android/iOS; lista de Mobile Devices com mensagem de teste; geofencing e widgets não documentados `[NC]` (fonte: https://wiki.domoticz.com/Mobile_devices)
- **Câmeras** — setup de câmera (fonte: https://wiki.domoticz.com/Main_Page)
- **Docker provisioning** — admin via `DOMOTICZ_ADMIN_PASSWORD`; senão wizard no primeiro uso (fonte: https://github.com/domoticz/domoticz)
- **Perfis de usuário (admin/user/viewer), user variables, security panel** — não confirmados nas páginas lidas `[NC]`

**Diferente do HA**
- Timers nativos por device com aleatoriedade, nascer/pôr do sol, setpoint e Timer Plans, editados na UI do próprio device.
- Dualidade Scene (estado alvo, só ativa) vs Group (liga/desliga junto).
- Plans (cômodos) + Floorplans nativos com devices posicionados na planta.
- Footprint mínimo (C++, <50 MB), mas ecossistema de UI/UX e integrações bem menor.

---

## 3. ioBroker

- **Licença/stack** — MIT, Node.js (cada adapter instance = processo próprio, ~10–60 MB), instalação via `npx @iobroker/install` (fonte: https://github.com/ioBroker/ioBroker)
- **Adapters (>800)** — Zigbee, KNX, Modbus, nuvens de fabricantes; instalados sob demanda (fonte: https://www.iobroker.com/)
- **Arquitetura objects + states** — dois bancos: objects (metadados/config) e states (valores); em memória com persistência periódica ou Redis (pub/sub) (fonte: https://github.com/ioBroker/ioBroker)
- **DB padrão e Redis** — DB JS em memória salva em JSON a cada 15 s; Redis recomendado acima de ~10 mil objetos; Redis Sentinel para HA (fonte: https://github.com/ioBroker/ioBroker.js-controller)
- **Multihost** — hosts compartilham os mesmos bancos; host master escuta, os demais conectam (fonte: https://github.com/ioBroker/ioBroker.js-controller)
- **Instâncias e modos de execução** — N instâncias por adapter; modos `daemon`, `schedule`, `once`, `none`; compact mode roda adapters dentro do controller (fonte: https://github.com/ioBroker/ioBroker.js-controller)
- **Notificações do sistema** — escopos/categorias, regex, `registerNotification`; ex.: pouco disco (fonte: https://github.com/ioBroker/ioBroker.js-controller)
- **Plugins do controller** — via `io-package.json`; Sentry por padrão (fonte: https://github.com/ioBroker/ioBroker.js-controller)
- **Hierarquia Directory/Device/Channel/State + roles** — role (ex.: `switch.lock`, `indicator.alarm`) diz às UIs o que o data point é; ack=false indica comando não confirmado (fonte: https://github.com/ioBroker/ioBroker.docs/blob/master/docs/en/admin/objects.md)
- **Enums: rooms e functions** — duas dimensões ortogonais (cômodo e função, ex.: luz/aquecimento) criadas na aba Categories; base para auto-criação em UIs e smart names (fonte: https://github.com/ioBroker/ioBroker.docs/blob/master/docs/en/admin/objects.md)
- **Namespaces protegidos** — sem expert mode só `0_userdata.0` e `alias.0` aceitam objetos custom; alias.0 mapeia states (fonte: https://github.com/ioBroker/ioBroker.docs/blob/master/docs/en/admin/objects.md)
- **Admin web** — instalação de adapters por repositórios, diálogos de instância, Users, SSO por usuário, limite de acesso por instância, device manager, certificados Let's Encrypt (`acme`), assistente de IA (fonte: https://github.com/ioBroker/ioBroker.admin)
- **Adapter javascript** — scripts JS/TS, Blockly, regras form-based sem código, auto-completar, npm modules; chat de IA com contexto do script (fonte: https://github.com/ioBroker/ioBroker.javascript e https://www.iobroker.com/)
- **API de script** — `on/once/subscribe`, `schedule` (cron + `astro`: sunrise/sunset/nadir com `shift`), `setStateDelayed`, `createState`, `createAlias`, `getEnums`, `sendTo`, `httpGet/httpPost`, arquivos, `getHistory` (fonte: https://github.com/ioBroker/ioBroker.javascript/blob/master/docs/en/javascript.md)
- **Adapter scenes** — virtual entries (grupos que aceitam qualquer tipo, agregação any/min/max/avg/sum), scenes com estados alvo, delays por membro, "stop" cancela pendentes, triggers (fonte: https://github.com/ioBroker/ioBroker.scenes)
- **Histórico** — adapter history (duas etapas, relog, estatísticas por datapoint, navegador/edição de dados, agregação avg/min/max/percentil); alternativas SQL/Influx existem mas não confirmadas `[NC]` (fonte: https://github.com/ioBroker/ioBroker.history)
- **vis-2 (visualização)** — editor web com touch/undo, widgets (cards, floorplan, chart, termostato, RGB, relógio), binding de qualquer atributo a object ID com fórmulas, filtros, views por resolução/orientação, retorno a view inicial por inatividade, comandos de controle (alert, popup, som, trocar view) (fonte: https://github.com/ioBroker/ioBroker.vis-2)
- **vis-2: permissões por usuário** — leitura/escrita por projeto, view e widget (fonte: https://github.com/ioBroker/ioBroker.vis-2)
- **vis-2: licença restritiva** — código CC BY-NC e licença de uso (Community grátis p/ privado, pagas p/ offline/comercial); relevante se for referência de design (fonte: https://github.com/ioBroker/ioBroker.vis-2)
- **iQontrol** — UI de tiles com roles (Switch, Light, Fan, Thermostat, Window, Blind, Garage, Alarm, Media...), auto-create de views a partir de enums, atalho de home screen (sem dizer PWA), parâmetros `noToolbar`/`returnAfterTime` para wall tablet, popups, ícones/fontes/imagens upload, 10 idiomas, passphrase (fonte: https://github.com/iobroker-community-adapters/ioBroker.iqontrol; MIT, ~63 stars)
- **Alexa / Google Home / Yandex Alisa (adapter iot)** — descobre devices de enums + roles; smart names de "cômodo + função"; custom skills via `smart.lastCommand`; IFTTT; Apple Home via adapter Matter (fonte: https://github.com/ioBroker/ioBroker.iot e https://www.iobroker.com/)
- **Acesso remoto** — VPN ou ioBroker.pro sem abrir portas (fonte: https://www.iobroker.com/)
- **Backup (adapter backitup)** — backup/restore de ioBroker e outros sistemas (DB, Zigbee, scripts); destinos cloud/NAS sugeridos pelos topics `[NC]` detalhes (fonte: https://github.com/simatec/ioBroker.backitup)
- **Segurança** — pensado para rede confiável; HTTPS+VPN/reverse proxy se exposto (fonte: https://github.com/ioBroker/ioBroker)
- **Nós de integração** — adapters dedicados: scenes, scheduler, smartcontrol, Node-RED (fonte: https://www.iobroker.com/)

**Diferente do HA**
- Plataforma "bus de dados" genérica: adapters são processos independentes, ligados por object/state DB com publish/subscribe (Redis opcional) e multihost.
- Rooms/Functions como enums ortogonais reutilizados por UIs, Alexa/Google e scripts.
- Ecossistema de UIs concorrentes (vis, vis-2, iQontrol, Jarvis...) ao invés de uma UI oficial única.
- Roles padronizados nos states dão semântica sem schema rígido.

---

## 4. Homebridge

- **Licença/stack** — Apache-2.0, TypeScript/Node.js; emula HAP (HomeKit Accessory Protocol), base HAP-NodeJS (fonte: https://github.com/homebridge/homebridge)
- **Ponte HomeKit** — expõe dispositivos sem suporte nativo ao Apple Home/Siri via plugins npm (keyword `homebridge-plugin`) (fonte: https://github.com/homebridge/homebridge)
- **Matter (v2, opt-in)** — via matter.js, por bridge com bloco `matter`; Apple Home, Google Home, Alexa, SmartThings; não certificado CSA (avisos no pareamento) (fonte: https://github.com/homebridge/homebridge)
- **Child bridges** — plugin roda em processo isolado: protege de crash, isola dependências, respostas concorrentes, contorna limite de ~149–150 acessórios por bridge, múltiplas instâncias do mesmo plugin, Matter seletivo; ~20–30 MB por child; cada um precisa de username/porta e pareamento próprios (fonte: https://github.com/homebridge/homebridge/wiki/Child-Bridges)
- **Limitações HAP** — 150 acessórios por bridge; renomear no Homebridge não sincroniza com o app Home; advertisers Bonjour HAP vs Ciao mDNS (fonte: https://github.com/homebridge/homebridge)
- **Homebridge UI (config-ui-x)** — instalar/configurar/atualizar/remover plugins, editor gráfico por schema ou JSON, editor de `config.json` com validação, backup automático do config a cada mudança (fonte: https://github.com/homebridge/homebridge-config-ui-x)
- **UI: dashboard** — widgets customizáveis, vários temas, logs ao vivo, controle de acessórios inclusive no navegador mobile, reiniciar (fonte: https://github.com/homebridge/homebridge-config-ui-x)
- **UI: backup/restore da instância** — e suporte a múltiplas instâncias do Homebridge; `hb-service` como serviço em Linux/macOS/FreeBSD/Windows (fonte: https://github.com/homebridge/homebridge-config-ui-x)
- **Plataformas** — Raspberry Pi, Linux, macOS, Windows 10/11, Docker, Synology (fonte: https://github.com/homebridge/homebridge)
- **Tipos de plugin (accessory vs platform, dynamic platform), config.schema.json, plugins verificados** — conhecimento prévio, páginas de dev.homebridge.io e homebridge.io não renderizaram `[NC]` (fonte: https://developers.homebridge.io/)
- **Terminal embutido, 2FA, widgets de status de bridge** — não confirmados nas páginas lidas `[NC]`
- **Stars** — core ~25.5k; UI ~2.8k, MIT (fonte: https://api.github.com/repos/homebridge/homebridge-config-ui-x)

**Diferente do HA**
- Não é plataforma de automação: é adaptador para o ecossistema Apple (e agora Matter). Regras ficam no Apple Home.
- Limite arquitetural de 150 acessórios por bridge contornado por child bridges isoladas.
- Distribuição de plugins 100% via npm (comunidade), sem loja própria.

---

## 5. Jeedom

- **Licença/stack** — GPL-2.0 segundo API do GitHub (verificar), PHP; roda local sem servidor externo; instalação em Debian 64-bit (fonte: https://github.com/jeedom/core)
- **Plugins + Market** — core é o motor; plugins por categoria (protocolo, energia, monitoramento, segurança, programação), Market oficial (fonte: https://github.com/jeedom/core)
- **Scenarios: modos** — por agendamento, por trigger ou ambos; multi-launch; modo síncrono (rápido, arriscado) (fonte: https://raw.githubusercontent.com/jeedom/core/master/docs/en_US/scenario.md)
- **Scenarios: triggers** — comandos com condição, e especiais: startup, backup/update/restore, login de usuário, mudança de variável, mudança de generic type, novo equipamento, HTTP API; limite 15 triggers, 28 com schedules (fonte: https://raw.githubusercontent.com/jeedom/core/master/docs/en_US/scenario.md)
- **Scenarios: schedule** — Cron com helper, formato `915`, cálculo com tags (ex.: offset de pôr do sol) (fonte: https://raw.githubusercontent.com/jeedom/core/master/docs/en_US/scenario.md)
- **Scenarios: blocos** — If/Then/Else, Action, Loop, In (atraso em background), At (hora em background), Code (PHP), Comment; releases recentes adicionam bloco While e proteções em for/wait/sleep (fonte: .../scenario.md e https://github.com/jeedom/core/releases/tag/4.6.0)
- **Scenarios: tags e variáveis** — tags de data/hora, de trigger, de localização/solar; variáveis persistentes (`variable(name, default)`) (fonte: .../scenario.md)
- **Scenarios: templates** — salvar como template, baixar JSON, compartilhar no Market; ao aplicar mapeia comandos para os do seu sistema (fonte: .../scenario.md)
- **Scenarios: log e timeline** — nível de log por scenario, timeline, timeout, wait máximo 2 h (fonte: .../scenario.md)
- **Interactions** — comandos por texto/voz via SMS, Telegram/Slack, assistentes ou URL; frase-modelo gera variações com tags `#commande#`, `#equipement#`, `#objet#`; sinônimos, filtros, exclusão por regex, resposta com `#valeur#`, usuários autorizados (fonte: https://raw.githubusercontent.com/jeedom/core/master/docs/en_US/interact.md)
- **Synthesis (visão geral)** — página de objetos com imagem de fundo e summaries (temperatura, umidade, alerta, movimento), pode ser home padrão em desktop/mobile (fonte: https://raw.githubusercontent.com/jeedom/core/master/docs/en_US/overview.md)
- **Design 2D** — editor de plantas: gráficos, texto/HTML, scenario, equipamento, comando, summary, link, imagem/câmera, área clicável (macro simples/binária/hover); grids, magnetização, código de acesso por design (fonte: https://raw.githubusercontent.com/jeedom/core/master/docs/en_US/design.md)
- **Design 3D** — importa modelo OBJ zipado (SweetHome3D recomendado, até 150 MB); elementos Luz, Texto, Porta/Janela (animação), Persiana, cor condicional (fonte: https://raw.githubusercontent.com/jeedom/core/master/docs/en_US/design3d.md)
- **Widgets/Views** — widgets controlam exibição de comandos; CSS/JS custom (fonte: https://github.com/jeedom/core)
- **História** — gráficos por clique/long-press, agrupamento (soma horária), linha/área/barra, curvas sobrepostas, cálculos salvos, comparação de períodos; arquivamento noturno (dados >2 h viram pacotes de 1 h por média/min/max); purge e edição de ponto (fonte: https://raw.githubusercontent.com/jeedom/core/master/docs/en_US/history.md)
- **Usuários** — perfis Administrator / User / Limited; direitos por equipamento e scenario (None, Visualization, Visualization+execution); flag "Local" (só LAN); API key por usuário; 2FA; sessões e dispositivos registrados com revogação (fonte: https://raw.githubusercontent.com/jeedom/core/master/docs/en_US/user.md)
- **Backup** — local diário com retenção por dias/tamanho, Market cloud (assinatura, últimos 6), Samba; restore das três origens; não inclui host, add-ons externos nem inclusão Z-Wave (fonte: https://raw.githubusercontent.com/jeedom/core/master/docs/en_US/backup.md)
- **Outras páginas de docs existentes** — api_http, jsonrpc_api, cron, eqAnalyse, health, massedit, replace, report, timeline, update, shortcuts, types (generic types) (fonte: https://api.github.com/repos/jeedom/core/contents/docs/en_US); conteúdo não lido `[NC]`
- **Linhas de produto** — Framework Jeedom, Box (gateway), Hypervision Pro (fonte: https://www.jeedom.com/en/)

**Diferente do HA**
- Interactions: geração de linguagem natural a partir de modelo de frase + tags + sinônimos, sem LLM.
- Design 3D de casa importando OBJ com estados reativos.
- Direitos por equipamento/scenario com perfil "Limited" e restrição "Local".
- Backup com destino Market cloud/Samba e templates de scenario compartilháveis com remapeamento de comandos.

---

## 6. Gladys Assistant

- **Licença/stack** — Apache-2.0; Node.js (`server`, `front`); SQLite (e DuckDB para estados, via constantes de migração); Docker v5, host network, privileged (fonte: https://github.com/GladysAssistant/Gladys e constants.js em https://raw.githubusercontent.com/GladysAssistant/Gladys/master/server/utils/constants.js)
- **Dashboard** — temperatura, câmeras, presença; light/dark/sistema (fonte: https://gladysassistant.com/en/)
- **Tipos de box (widgets)** — ALARM, WEATHER, TEMPERATURE_IN_ROOM, HUMIDITY_IN_ROOM, USER_PRESENCE, CAMERA, DEVICES_IN_ROOM, DEVICES, CHART, ECOWATT, EDF_TEMPO, CLOCK, SCENE, MUSIC, GAUGE, ENERGY_CONSUMPTION, ENERGY_PRICE, VOICE_ASSISTANT, LINK, PHOTO, SUN, CHIPS, HOUSE_VIEW, ACTIONS, EXTERNAL_WIDGET, THERMOSTAT (fonte: constants.js)
- **Scenes: ~41 ações** — luz/switch (on/off/toggle/blink), `DEVICE.SET_VALUE/GET_VALUE`, delay, iniciar outra scene, mensagem (com imagem de câmera), IA (`AI.ASK`), HTTP request, MQTT/Zigbee2MQTT send, música (TTS, mídia), SMS (Free Mobile), alarme, termostato (schedule), calendário, variável, ação de integração externa (fonte: https://raw.githubusercontent.com/GladysAssistant/Gladys/master/server/lib/scene/scene.actions.js)
- **Scenes: condições/controle de fluxo** — `ONLY_CONTINUE_IF`, `CHECK_TIME`, `IF_THEN_ELSE`, `WHILE` (com limite), `IN_TIME_RANGE`, casa vazia/não vazia, checar presença, modo do alarme (fonte: scene.actions.js)
- **Scenes: triggers** — tempo (inclui nascer/pôr do sol), mudança de estado de device, luz on/off/brilho, temperatura/umidade, presença (saiu/voltou de casa), sono, trabalho, alarme, calendário (evento próximo), MQTT recebido, webhook, área (usuário entrou/saiu), alerta de clima, mudança de preço de energia (fonte: constants.js)
- **Presença e geofencing** — eventos `USER_PRESENCE` e `AREA.USER_ENTERED/LEFT`; mensagens de localização OwnTracks entram como evento do gateway (fonte: constants.js)
- **Papéis de usuário** — ADMIN, HABITANT, GUEST (fonte: constants.js)
- **Modelo de dispositivo** — ~100 categorias (luz, switch, sensor temperatura, câmera, fechadura, termostato, aspirador, EV, bateria, etc.) e tipos de feature por categoria (fonte: constants.js)
- **Energia** — monitoramento de consumo, produção solar, bateria doméstica, EV; contrato de energia (preço atual), integrações francesas EDF Tempo e Ecowatt, teleinformação (fonte: https://gladysassistant.com/en/ e constants.js)
- **Assistente de voz/mensagem + IA** — comandos por voz no assistente embutido ou por mensagem; Gladys Plus adiciona IA (fonte: https://gladysassistant.com/en/)
- **Integrações nativas** — Zigbee2MQTT, Matter, MQTT, Node-RED, AirPlay, Apple HomeKit, Alexa, IA; Philips Hue, SmartThings, Shelly, Sonos, Reolink (fonte: https://gladysassistant.com/en/ e https://gladysassistant.com/en/integrations/)
- **Integrações externas de comunidade** — "997 integrations" no catálogo, instalação em 1 clique; a lista visível parece derivada de outro catálogo (inclui nomes típicos do HA), então tratar a contagem como `[NC]` (fonte: https://gladysassistant.com/en/integrations/)
- **Gladys Plus (assinatura)** — acesso remoto cifrado, apps iOS/Android, Google Home e Alexa, backups, IA (fonte: https://gladysassistant.com/en/)
- **Backup** — jobs `GLADYS_GATEWAY_BACKUP`, backups de Zigbee2MQTT, Node-RED e Matter; progresso por WebSocket (fonte: constants.js)
- **Upgrade automático de containers** — eventos `SYSTEM.UPGRADE_CONTAINERS` (Watchtower) com códigos de erro (fonte: constants.js)
- **Instalação guiada** — pendrive ou Docker; guias mini-PC, Raspberry Pi, Proxmox, Synology, Unraid, Freebox (fonte: https://gladysassistant.com/docs/)
- **Privacidade** — self-hosted sem nuvem obrigatória, sem tracking (fonte: https://gladysassistant.com/en/)

**Diferente do HA**
- Ciclo de vida humano modelado como evento: sono, ida/volta do trabalho, presença, "casa vazia".
- Scenes 100% via UI com ~41 tipos de ação e WHILE/IF; sem YAML.
- Foco em energia (Tempo/Ecowatt, preço do contrato) e em privacidade; roles Admin/Habitant/Guest.
- Menos escala que o HA (catálogo de integrações e comunidade bem menores).

---

## 7. Node-RED

- **Licença/stack** — Apache-2.0, Node.js, OpenJS Foundation; editor em `localhost:1880` (fonte: https://github.com/node-red/node-red)
- **Programação por fluxos** — "low-code para aplicações event-driven"; editor visual, wires, mensagens (`msg`) (fonte: https://github.com/node-red/node-red)
- **Biblioteca de nodes** — 6.340 nodes, 3.153 flows, 1.210 coleções; categoria "Home Automation" (fonte: https://flows.nodered.org/)
- **Core nodes** — Inject, Debug, Function, Change, Switch, Template confirmados (fonte: https://nodered.org/docs/user-guide/nodes); demais (MQTT, HTTP, WebSocket, TCP/UDP, Delay, Trigger, Join/Split, File, JSON/CSV/XML parsers) são conhecimento prévio `[NC]`
- **Contexto (node/flow/global)** — com stores persistentes configuráveis; página não carregou `[NC]` (fonte: https://nodered.org/docs/user-guide/ — apenas listada em "Working with context")
- **Projects com Git** — repositório por projeto, diff/stage/commit no editor, branches, push/pull com remotes HTTP(S)/SSH, credenciais cifradas por chave fora do repo (fonte: https://nodered.org/docs/user-guide/projects/)
- **Guia do usuário** — settings file, securing Node-RED, logging, variáveis de ambiente, tratamento de erro, command-line admin, embutir em outra app (fonte: https://nodered.org/docs/user-guide/)
- **Dashboard v1 (node-red-dashboard)** — widgets: audio out/TTS, button, chart (line/bar/pie), color picker, date picker, dropdown, form, gauge, notification, numeric, slider, switch, template (HTML/JS), text, text input, ui-control; layout em grid; temas light/dark/custom; ícones Material/FontAwesome/Weather/Iconify; `httpNodeAuth`; sem multiusuário; deprecado em 2024-06-27 (fonte: https://github.com/node-red/node-red-dashboard; ~1.4k stars)
- **Dashboard 2.0 (FlowFuse)** — 22 widgets core (ui-button, ui-chart, ui-gauge, ui-table, ui-form, ui-notification, ui-template, ui-markdown, ui-audio...); 4 layouts: Grid, Fixed, Notebook, Tabs; responsivo com breakpoints; instalável como app no celular/tablet; roteamento por cliente (multiusuário) e autenticação (fonte: https://dashboard.flowfuse.com/ e https://dashboard.flowfuse.com/nodes/widgets.html; ~359 stars, Apache-2.0)
- **Nodes de home automation** — `node-red-contrib-home-assistant-websocket` (~603 stars) para integrar com HA; nodes para Zigbee/MQTT/Hue/HomeKit existem na biblioteca mas não detalhados `[NC]` (fonte: https://github.com/zachowj/node-red-contrib-home-assistant-websocket)
- **Integração com outras plataformas** — instalável via openHABian, adapter no ioBroker, integração nativa no Gladys (fonte: https://www.openhab.org/docs/installation/openhabian.html, https://www.iobroker.com/, https://gladysassistant.com/en/integrations/)
- **Instalação** — `npm i -g node-red` ou fonte; Docker/Pi packages `[NC]` (fonte: https://github.com/node-red/node-red)

**Diferente do HA**
- Paradigma: fluxo de dados visual (wire) em vez de entidades+automações declarativas; qualquer API/protocolo vira node.
- Não tem modelo de dispositivo/entidade nem descoberta: é motor de automação plugável em cima de outros hubs.
- Projects com Git integrado e dashboards como pacote separado.

---

## 8. Homey e Hubitat (proprietários, só features distintas)

### Homey `[PROP]`
- **Flows** — triggers + conditions + actions simples (fonte: https://homey.app/en-us/)
- **Advanced Flow** — automações em canvas infinito com mais controle (fonte: https://homey.app/en-us/)
- **Moods** — presets de luz criáveis/selecionáveis (fonte: https://homey.app/en-us/)
- **Insights** — séries temporais de dados dos devices em gráficos (fonte: https://homey.app/en-us/)
- **Energy** — consumo via plugs inteligentes e aproximações (fonte: https://homey.app/en-us/)
- **Dashboards** — widgets customizados (fonte: https://homey.app/en-us/)
- **Apps (750+)** — extensões por marca/serviço; Homey Pro suporta apps da comunidade (fonte: https://homey.app/en-us/)
- **Modelos** — Homey Pro (compra única, local), Homey Cloud (grátis até 5 devices, depois assinatura), Self-Hosted Server (fonte: https://homey.app/en-us/)
- **HomeyScript** — scripting para a casa (fonte: https://homey.app/en-us/)
- **Voz** — Google Assistant, Alexa, Siri Shortcuts; flows de presença (fonte: https://homey.app/en-us/)
- **Zones, geofencing, Web API** — não confirmados na página `[NC]`

### Hubitat `[PROP]`
- **Processamento 100% local** — automações no hub, sem depender de cloud (fonte: https://hubitat.com/)
- **Zigbee, Z-Wave, Matter, Wi-Fi** — antenas externas (fonte: https://hubitat.com/)
- **Dashboard** — seção de dashboards fáceis (fonte: https://hubitat.com/)
- **App móvel** — acesso remoto, push, automações por geofence (fonte: https://hubitat.com/)
- **Rule Machine, Maker API, drivers/apps Groovy, HSM, Hub Mesh, HPM, Mode Manager** — conhecimento prévio, não presentes na página `[NC]` (fonte: https://hubitat.com/)
- **Repo GitHub público** — org `hubitat` retornou 404 pela API `[NC]`

---

## 9. AppDaemon / HADashboard

- **Licença/stack** — Python, ~1.0k stars; licença NOASSERTION na API do GitHub `[NC]` (fonte: https://api.github.com/repos/AppDaemon/appdaemon)
- **Apps Python** — ambiente Python sandboxed, multi-thread, loosely coupled; HASS plugin e MQTT nativos (fonte: https://appdaemon.readthedocs.io/en/latest/)
- **Listeners** — `listen_state`, `listen_event`, `listen_log` (fonte: https://appdaemon.readthedocs.io/en/latest/APPGUIDE.html)
- **Scheduler** — `run_once/in/at/daily`, nascer/pôr do sol, offsets aleatórios (fonte: .../APPGUIDE.html)
- **Constraints** — janelas de tempo, dias da semana, presença/input_boolean/input_select/person (fonte: .../APPGUIDE.html)
- **Dependências e prioridade de apps**, **services custom entre apps**, **threading com pinning**, **async**, **REST API com API key**, **handler de Alexa**, **time-travel para testes** (fonte: .../APPGUIDE.html)
- **HADashboard** — dashboard para wall tablets, distância de visualização; ativado em `appdaemon.yaml` (fonte: https://appdaemon.readthedocs.io/en/latest/DASHBOARD_INSTALL.html)
- **Arquivos `.dash` em YAML** — grid com `columns`, `widget_size`, `widget_dimensions`, layout por linhas `(WxH)`, `spacer`, `empty`, includes aninhados (até 10) (fonte: https://appdaemon.readthedocs.io/en/latest/DASHBOARD_CREATION.html)
- **Widgets (~40)** — alarm, binary_sensor, camera, climate, clock, cover, device_tracker, fan, gauge, group, icon, iframe, input_*, javascript, label, light, lock, media_player, navigate, person, radial, rss, scene, script, sensor, sequence, switch, weather... (fonte: .../DASHBOARD_CREATION.html)
- **Navegação remota** — widget `navigate` com `timeout`/`return`/`sticky`; evento `ad_dashboard` com `command: navigate` e `deviceid` para trocar dashboard em tablet específico (fonte: .../DASHBOARD_CREATION.html)
- **Skins** — default, obsidian, zen, simplyred, glassic; custom skin em `custom_css/<skin>/` com `variables.yaml`; seleção por `?skin=` (fonte: .../DASHBOARD_CREATION.html)
- **Widgets custom** — Base Widget (HTML+CSS+JS, Knockout) + Derived Widget (YAML) em `custom_widgets/` (fonte: https://appdaemon.readthedocs.io/en/latest/WIDGETDEV.html)
- **Recompilação automática** — dashboards precompilados, `recompile=1`, `compile_on_start`; `disable_apps` para só dashboard (fonte: .../DASHBOARD_INSTALL.html)
- **Kiosk, touch, responsivo** — a doc de instalação não cobre `[NC]` (fonte: .../DASHBOARD_INSTALL.html)

---

## 10. Homepage (gethomepage)

- **Licença/stack** — GPL-3.0, JavaScript, ~33.5k stars (fonte: https://api.github.com/repos/gethomepage/homepage)
- **Config estática em YAML** — services, bookmarks, widgets, settings, docker; sem DB (fonte: https://gethomepage.dev/)
- **Descoberta por Docker labels** — containers com labels `homepage.*` entram automaticamente; `server`/`container` inferidos; instâncias múltiplas; Swarm (`swarm: true`) (fonte: https://gethomepage.dev/configs/docker/)
- **Conexão Docker** — IP:porta, TLS, socket proxy somente leitura, socket direto; status do container + stats (CPU/mem/rede) ao clicar (fonte: https://gethomepage.dev/configs/docker/)
- **Descoberta por Kubernetes** — anotações `gethomepage.dev/` em ingress, widget Kubernetes (fonte: https://gethomepage.dev/configs/services/)
- **Ping (ICMP)** — IPv4 apenas; indicador por serviço (fonte: https://gethomepage.dev/configs/services/)
- **siteMonitor** — HTTP HEAD (fallback GET) com tempo de resposta; `statusStyle` (fonte: https://gethomepage.dev/configs/services/)
- **Widgets de serviço (164)** — Home Assistant, Homebridge, ESPHome, Plex, Jellyfin, Sonarr, Radarr, Grafana, Uptime Kuma, Pi-hole, Traefik, OPNsense, Tailscale etc.; `fields`, `highlight` por regra (fonte: https://gethomepage.dev/widgets/)
- **Info widgets (13)** — Custom API, Date & Time, Glances, Greeting, Kubernetes, Logo, Longhorn, Open-Meteo, OpenWeatherMap, Resources, Search, Stocks, Unifi Controller (fonte: https://gethomepage.dev/widgets/)
- **Providers** — chaves compartilhadas entre widgets (fonte: https://gethomepage.dev/configs/settings/)
- **Temas e layout** — `theme` light/dark, `color` por paleta, background com blur/saturação/brilho, `headerStyle` (4 estilos), layout por grupo (row/column, colunas, tab, iconsOnly, colapsável), `cardStyle`, `blockStyle` (fonte: https://gethomepage.dev/configs/settings/)
- **Quick Launch** — busca por teclado com provedores de busca, sugestões, botão mobile (fonte: https://gethomepage.dev/configs/settings/)
- **PWA** — `pwa.icons` e `shortcuts`, modo standalone (fonte: https://gethomepage.dev/configs/settings/)
- **i18n** — ~17 idiomas (fonte: https://gethomepage.dev/configs/settings/)
- **Custom CSS/JS, Proxmox, bookmarks, MCP (Model Context Protocol)** — páginas de configuração dedicadas (fonte: https://gethomepage.dev/)
- **Proxy no servidor** — chamadas às APIs passam pelo backend, chaves não vão ao navegador (fonte: https://gethomepage.dev/)
- **Sem login embutido** — não confirmado; assumir protegido por reverse proxy `[NC]`

---

## 11. Homarr

- **Licença/stack** — Apache-2.0, TypeScript, ~5.3k stars (repo `homarr-labs/homarr`) (fonte: https://api.github.com/repos/homarr-labs/homarr)
- **Boards drag-and-drop** — múltiplos boards; layouts Mobile/Base + breakpoints custom; containers colapsáveis; rails fixos laterais; edição por mouse, toque, teclado e coordenadas exatas (fonte: https://homarr.dev/docs/management/boards/)
- **Acesso por board** — público, usuário, grupo ou global com níveis View/Modify/Full; home board por desktop/mobile, por usuário/grupo/servidor (fonte: https://homarr.dev/docs/management/boards/)
- **Config por board** — título, logo, favicon, background, aparência, CSS custom, comportamento (fonte: https://homarr.dev/docs/management/boards/)
- **Streaming de dados** — queries de widgets iniciam no servidor e chegam por stream; cache mostrado enquanto atualiza (fonte: https://homarr.dev/docs/management/boards/)
- **Autenticação** — credenciais, OIDC, LDAP; permissões por usuário/grupo (fonte: https://homarr.dev/)
- **Integrações (93)** — mídia (Plex, Jellyfin, *arr, downloads), monitoramento (Uptime Kuma, Prometheus, Beszel, Glances), infra (Docker, Kubernetes, Proxmox, Unraid, TrueNAS), rede/DNS (Pi-hole, AdGuard, UniFi, OPNsense), Smart home/câmeras/energia (Home Assistant, Frigate, PeaNUT, iCal), notificações (Ntfy, Gotify) (fonte: https://homarr.dev/docs/integrations/)
- **Widgets (66)** — sem integração: Air Quality & UV, App, Bookmarks, Countdowns, Custom API, Date and time, Docker stats, iFrame, Notebook, RSS, Stock, Timer/Pomodoro, Timetable, Video Stream, Weather; com integração: Calendar, Download Client, **Entity State**, **Execute Automation** (HA), Network Status, System Resources, UPS, Uptime Kuma, VPN etc. (fonte: https://homarr.dev/docs/widgets/)
- **Docker** — status de containers (running/healthy/falha) no dashboard (fonte: https://homarr.dev/)
- **Ícones** — milhares embutidos de repositórios de ícones (fonte: https://homarr.dev/)
- **26 idiomas** (fonte: https://homarr.dev/)
- **Backup/restore** — página dedicada; import/export de board não confirmado `[NC]` (fonte: https://homarr.dev/docs/management/boards/)
- **Docs também em Markdown/LLM** (fonte: https://homarr.dev/)
- **PWA / busca no dashboard** — não confirmados `[NC]` (fonte: https://homarr.dev/)

---

## 12. Dashy

- **Licença/stack** — MIT, Vue, ~26.9k stars (fonte: https://api.github.com/repos/Lissy93/dashy)
- **Multi-page** — páginas extras a partir de YAML local/remoto (fonte: https://github.com/Lissy93/dashy/blob/master/README.md)
- **Status checks** — HTTP por item e ping por host; ao carregar ou com polling (`statusCheckInterval`, <5 s pode pesar); URL alternativa, códigos aceitos, headers custom, bloqueio de requisição insegura sob HTTPS, formas (círculo/quadrado...) para acessibilidade (fonte: https://raw.githubusercontent.com/Lissy93/dashy/master/docs/status-indicators.md)
- **Config editor ao vivo** — edição visual com preview ou YAML bruto com validação por schema; exportar, backup, reset (fonte: README)
- **Cloud backup/sync cifrado** — AES no navegador, enviado a Cloudflare Worker/KV (24 MB por usuário), ID de backup + senha; self-host do backend possível; desligado = nenhuma requisição externa (fonte: https://raw.githubusercontent.com/Lissy93/dashy/master/docs/backup-restore.md)
- **Auth** — usuários embutidos (hash SHA256, tipos admin), Keycloak/OIDC genérico (Authentik, Authelia, Zitadel, Pocket ID), header auth por proxy, modo convidado read-only (`enableGuestAccess`) (fonte: https://raw.githubusercontent.com/Lissy93/dashy/master/docs/authentication.md)
- **Widgets (~100)** — gerais (clock, weather, RSS, calendar, crypto, feriados, NASA APOD), self-hosted (Pi-hole, AdGuard, Nextcloud, Proxmox, Uptime Kuma, Synology, Ntfy, Filebrowser), monitoramento de recursos (CPU, memória, disco, rede, temperatura, GPU), dinâmicos (iframe, HTML, API Response, Prometheus, Data Feed) (fonte: https://raw.githubusercontent.com/Lissy93/dashy/master/docs/widgets.md)
- **Temas** — temas prontos, editor de cores na UI, CSS custom (fonte: README)
- **Busca e atalhos** — busca por nome/domínio/tag, hotkeys numéricas, web search com bangs (fonte: README)
- **Views alternativas** — minimal (startpage) e workspace (vários apps em simultâneo) (fonte: README)
- **Métodos de abertura** — nova aba, mesma aba, janela, modal, workspace, clipboard (fonte: README)
- **PWA com offline básico** (fonte: README)
- **30+ idiomas com detecção automática; ícones favicon/pack/emoji/imagem** (fonte: README)
- **Docker, bare metal, one-click cloud** (fonte: README)

---

## 13. Home Panel e Dasherr

### Home Panel (timmo001) — arquivado em 2025-03-22
- **Frontend alternativo ao HA** — suporta entidades do HA, câmeras, feeds de notícia, iframes (fonte: https://github.com/timmo001/home-panel)
- **Config UI completa dentro do app** e **temas customizados** (fonte: https://raw.githubusercontent.com/timmo001/home-panel/master/README.md)
- **Stack inferida** — TypeScript/Next.js/Prisma/WebSocket/Material Design (inferida pelos arquivos do repo, não declarada) (fonte: https://github.com/timmo001/home-panel)
- **Kiosk, PWA, usuários** — o README não afirma `[NC]`; repositório arquivado, sem sucessor nomeado

### Dasherr (erohtar)
- **Dashboard mínimo** — Bootstrap, config em um único arquivo JSON com editor embutido, configs alternativas via parâmetro de URL `s` (fonte: https://www.Github.com/erohtar/Dasherr)
- **Stats de sistema via Glances API** (temperatura, CPU, memória; refresh 5 s) (fonte: https://raw.githubusercontent.com/erohtar/Dasherr/main/README.md)
- **Status só no load/refresh** — para evitar atividade de fundo (fonte: README)
- **Temas editáveis, wallpapers, FontAwesome ou imagens próprias** (fonte: README)
- **Stars/licença** — ~215, GPL-3.0; último push 2025-05 (fonte: https://api.github.com/repos/erohtar/Dasherr)

---

## 14. Features transversais de UX

Formato: o que aparece, em quais projetos (com fonte).

- **Kiosk / wall panel** — HADashboard (feito para wall tablets; `timeout`/`return` em navigate) (https://appdaemon.readthedocs.io/en/latest/DASHBOARD_CREATION.html); iQontrol (`noToolbar`, `returnAfterTime`) (https://github.com/iobroker-community-adapters/ioBroker.iqontrol); vis-2 (retorno à view inicial por inatividade) (https://github.com/ioBroker/ioBroker.vis-2); app Android openHAB (tablets de parede) (https://github.com/openhab/openhab-android); Dashy (view minimal) (README); HABPanel `[NC]`
- **Navegação remota de tablets** — HADashboard via evento `ad_dashboard` com `deviceid`; vis-2 `control.command` (alert, popup, trocar view, som) (fontes acima)
- **PWA** — Homepage (`pwa` com icons/shortcuts) (https://gethomepage.dev/configs/settings/); Dashy (offline básico) (README); FlowFuse Dashboard (instalável) (https://dashboard.flowfuse.com/); iQontrol (atalho de home screen, sem usar "PWA") (iqontrol); Homarr `[NC]`
- **Widgets/cards** — Gladys boxes (26 tipos), Homarr (66), Homepage (164 service + 13 info), Dashy (~100), HADashboard (~40), Node-RED Dashboard 2.0 (22), openHAB widgets personalizados, Jeedom widgets/Design (fontes nas seções)
- **Widgets de OS/Home Screen** — openHAB iOS (target de widget, não documentado) `[NC]`; Android openHAB (screenshot de widget) `[NC]` (fontes: repos GitHub)
- **Voz** — openHAB (pipeline completo + LLM) (https://www.openhab.org/docs/configuration/multimedia.html); Jeedom Interactions (https://raw.githubusercontent.com/jeedom/core/master/docs/en_US/interact.md); Gladys (assistente embutido + mensagem) (https://gladysassistant.com/en/); ioBroker (Alexa/Google via iot, text2command) (https://github.com/ioBroker/ioBroker.iot); Homey (Google/Alexa/Siri Shortcuts); Homebridge (Siri via HomeKit)
- **Geofencing / presença** — Gladys (OwnTracks, áreas, presença como trigger) (constants.js); Hubitat (geofence no app) (https://hubitat.com/); Homey (flows de presença) (https://homey.app/en-us/); openHAB iOS/Android (Location Item existe; geofence do app `[NC]`); Domoticz `[NC]`
- **Notificações push** — openHAB Cloud/FCM com ações (https://www.openhab.org/addons/integrations/openhabcloud/); Domoticz (13 serviços) (https://wiki.domoticz.com/Notifications); Gladys (mensagens/Telegram, Plus); Hubitat app; Homarr widget Notifications (Ntfy/Gotify) (https://homarr.dev/docs/integrations/); ioBroker backitup (Telegram, Pushover etc.)
- **Multiusuário / RBAC** — Jeedom (Administrator/User/Limited, direitos por equipamento+scenario, flag Local) (user.md); Gladys (Admin/Habitant/Guest); Homarr (user/grupo/permissões por board, OIDC/LDAP) (https://homarr.dev/docs/management/boards/); Dashy (usuários, OIDC, guest) (authentication.md); vis-2 (permissão por projeto/view/widget) ; openHAB `visibleTo` (não segurança); FlowFuse Dashboard (multi-user routing)
- **2FA** — Domoticz (TOTP) (https://wiki.domoticz.com/MyProfile); Jeedom (flag mostra estado; ativação `[NC]`)
- **Backup / restore** — Jeedom (local, Market, Samba) (backup.md); Dashy (cloud cifrado) (backup-restore.md); Homebridge UI (backup/restore + auto-backup do config) (https://github.com/homebridge/homebridge-config-ui-x); Gladys (gateway/Zigbee2MQTT/Node-RED/Matter); ioBroker backitup; Domoticz (Backup & Restore, scripts de arquivo fora); openHABian (Amanda)
- **Modo offline / local-first** — Jeedom (sem servidor externo), ioBroker (automações locais), Domoticz (sem cloud), Hubitat (local), Gladys (privacy-first), Dashy PWA (offline básico)
- **Importação/exportação de config** — Jeedom (scenario template JSON/Market), Dashy (export/backup/reset YAML), Homepage/Dasherr (arquivos YAML/JSON versionáveis), Node-RED (Projects + Git), openHAB (sitemaps/things/items em arquivos + JSON DB para UI), Homarr `[NC]`
- **Acesso remoto sem abrir portas** — openHAB Cloud (https://www.openhab.org/addons/integrations/openhabcloud/), Gladys Plus, ioBroker.pro, openHABian com Tailscale
- **Descoberta** — openHAB Inbox (background + aprovar/ignorar + auto-ignore de duplicata) (https://www.openhab.org/docs/concepts/discovery.html); Domoticz aprende sensores automaticamente; Homepage/Homarr descobrem serviços via Docker labels/Kubernetes; protocolos mDNS/UPnP do openHAB `[NC]` na página lida
- **Monitoramento de serviços (ping/uptime)** — Homepage (ICMP + HTTP com latência), Dashy (HTTP + ping + intervalos + formas acessíveis), Dasherr (só no load), Homarr (Uptime Kuma, Gatus etc.)
- **Gráficos históricos** — openHAB Chart pages + persistência; Jeedom History (agrupar, comparar, arquivar); ioBroker history/vis charts; Domoticz gráficos por sensor; Gladys CHART box; Homey Insights
- **Plantas / mapas** — openHAB Floorplan e Map; Domoticz Floor Plans; Jeedom Design 2D e 3D; vis-2 floorplan; iQontrol; Gladys HOUSE_VIEW
- **Temas / acessibilidade** — Dashy (formas de status), Homepage (paletas, light/dark), Node-RED Dashboard (temas), HADashboard (skins)
- **Internacionalização** — Homarr 26, Dashy 30+, Homepage ~17, iQontrol 10, Gladys (multi) `[NC]` contagem

---

## 15. Triagem de implementabilidade no app Tauri + React + Tailwind `[ANÁLISE]`

Classificação minha, sem fonte externa. "LAN" = depende da descoberta/estado dos dispositivos da rede.

| Feature | Viabilidade | Observação |
|---|---|---|
| Inbox de descoberta (aprovar/ignorar, TTL, auto-ignore de duplicata) | Alta | mDNS/SSDP/ping sweep a partir do backend Rust; modelo de UX copiável do openHAB |
| Ping ICMP + HTTP siteMonitor com latência e polling configurável | Alta | Rust (surge-ping/reqwest); formas acessíveis do Dashy |
| Docker label/K8s discovery | Média | só útil se houver Docker na LAN; opcional |
| Modelo Thing/Channel/Item ou Entity+Area | Alta | decisão de arquitetura; semantic model Location>Equipment>Point é boa referência para UI gerada |
| Rooms/Functions ortogonais (ioBroker) + Areas | Alta | dois eixos de agrupamento barato de implementar |
| Dashboard de widgets arrastáveis, layouts por breakpoint | Alta | React + grid; Homarr é referência |
| Modo kiosk / wall panel (retorno automático, sem chrome) | Alta | janela Tauri fullscreen; no mobile é só rota |
| PWA | N/A em Tauri | Tauri já é app; manter PWA só se houver cliente web |
| Scenes + regras (IF/WHILE/delay/trigger por tempo e sol) | Alta | motor em Rust/TS; ações do Gladys são bom checklist |
| Timers ricos (aleatório, sol, semanas, Timer Plans) | Alta | puro cálculo |
| Persistência + gráficos históricos (SQLite/DuckDB) | Alta | Gladys usa SQLite/DuckDB; filtros de threshold/janela do openHAB reduzem volume |
| Presença/geofencing | Média | desktop sem GPS; mobile exige permissão de localização; alternativa: presença por ping/ARP do celular (Gladys faz via "devices vistos") |
| Push notifications | Média | exige serviço externo (FCM/APNs) ou ntfy/Gotify/Telegram; local-first sugere ntfy/Telegram |
| Voz | Baixa/Média | STT/TTS local pesado; começar por interpretador de frases com templates (Jeedom Interactions) |
| Multiusuário/RBAC com perfis limitados | Média | modelo do Jeedom (None/View/View+Exec) é simples e suficiente |
| Backup/restore e export de config | Alta | exportar JSON/YAML + cifrar (AES) como o Dashy |
| Integração Matter/Zigbee/MQTT | Média | MQTT fácil; Zigbee via Zigbee2MQTT; Matter exige commissioning |
| Homebridge/HAP bridge | Baixa | fora de escopo inicial |
| Blockly/scripting multilíngue | Baixa | depois do motor de regras; Blockly gerando JS é viável |
| Design 3D (OBJ) | Baixa | nicho |

---

## 16. Lacunas de confiança (resumo)

1. Docs do Jeedom (doc.jeedom.com) bloqueadas; usei `docs/en_US` do repo. Não li dashboard, view, widgets, API, market.
2. openHAB: autenticação/roles, backup CLI, UoM, HABPanel, rules/scenes UI e mDNS/UPnP não confirmados (404 ou fora da página lida).
3. Domoticz: wiki de Timers/Scenes retornou 404; tipos exatos de timer, perfis de usuário (admin/user/viewer), user variables, security panel, geofencing/push do app não confirmados.
4. Homebridge dev docs (tipos de plugin, verified plugins, config schema) e Homey/Hubitat (features só pela landing page) rasos.
5. Números de stars vêm do resumo do fetcher sobre a API do GitHub e alguns parecem baixos; o catálogo "997 integrações" do Gladys parece misturar nomes de outro catálogo; Homarr (PWA, import/export), Node-RED core nodes/contexto/dashboard multiusuário e kiosk do HABPanel também ficam `[NC]`.
