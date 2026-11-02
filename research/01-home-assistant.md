# Inventário de features do ecossistema Home Assistant

Pesquisa feita em 2026-11-01 sobre fontes primárias: home-assistant.io (docs + blog), companion.home-assistant.io, contributors.home-assistant.io (ex-developers.home-assistant.io, redireciona 301), código-fonte em `github.com/home-assistant/core` (branch `dev`), e sites oficiais dos projetos relacionados.

Convenções:
- Cada feature: `- **Feature** — o que faz (fonte: URL)`.
- `[NÃO CONFIRMADO]` = não consegui verificar na fonte (página 404, página sem o detalhe, ou só inferido). Nada marcado assim deve ser tratado como fato.
- Versão estável mais recente nas notas de release: **2026.10** (2026-10-07). Existem patches 2026.10.1 a 2026.10.4.

Mudanças de nomenclatura recentes que afetam o app (verificadas):
- **Add-ons agora se chamam "Apps"** (rename na 2026.2). Disponíveis só no Home Assistant OS (fonte: https://www.home-assistant.io/addons/ e https://www.home-assistant.io/blog/2026/02/04/release-20262/).
- **Logbook agora se chama "Activity"** na UI (2026.7) (fonte: https://www.home-assistant.io/blog/2026/07/01/release-20267/).
- **"Developer Tools" virou "Tools"** (2026.8) (fonte: https://www.home-assistant.io/blog/2026/08/05/release-20268/).
- **Home Assistant Cloud (Nabu Casa) será renomeado "Home Assistant Link"** em 2026-12-02 (fonte: https://www.home-assistant.io/cloud/ e https://www.home-assistant.io/blog/2026/10/07/release-202610/).
- **"Advanced mode" foi removido** na 2026.6; features ficam disponíveis a todos (fonte: https://www.home-assistant.io/blog/2026/06/03/release-20266/).
- Chaves de triggers/conditions "purpose-specific" foram renomeadas na 2026.7 (ex.: `battery.low` virou `battery.became_low`) (fonte: https://www.home-assistant.io/blog/2026/07/01/release-20267/).

---

## 1. UI e dashboards

### 1.1 Tipos de dashboard e views

- **Dashboards auto-gerados** — Home, Activity, History, Energy, Map, To-do lists, Lights, Security, Climate, Maintenance; atualizam sozinhos até o usuário "tomar controle"; não podem ser deletados (fonte: https://www.home-assistant.io/dashboards/dashboards/)
- **Dashboard em storage mode** — criado/editado na UI (Settings > Dashboards), guardado no servidor (fonte: https://www.home-assistant.io/dashboards/dashboards/)
- **Dashboard em YAML mode** — arquivo próprio declarado em `lovelace: dashboards:` (fonte: https://www.home-assistant.io/dashboards/dashboards/)
- **Múltiplos dashboards** — vários na sidebar, default por usuário ou global, `show_in_sidebar`, `require_admin` (fonte: https://www.home-assistant.io/dashboards/dashboards/)
- **Resources de dashboard** — JS/CSS carregados via `resources:` (modo YAML) para custom cards (fonte: https://www.home-assistant.io/dashboards/dashboards/)
- **View Sections (padrão)** — grid de seções com drag-and-drop, headings por seção, colunas máximas, fundo colorido com opacidade, visibilidade por condição, footer cards (2026.3), badges no topo/rodapé (fonte: https://www.home-assistant.io/dashboards/sections/)
- **View Masonry** — layout em colunas empilhadas (legado) (fonte: https://www.home-assistant.io/dashboards/masonry/)
- **View Panel** — um único card em tela cheia (fonte: https://www.home-assistant.io/dashboards/panel/)
- **View Sidebar** — view com barra lateral (fonte: https://www.home-assistant.io/dashboards/sidebar/)
- **Dashboard strategies** — dashboards gerados por código; desenvolvedores podem registrar estratégias customizadas (2026.5). Detalhe do protocolo [NÃO CONFIRMADO] (fonte: https://www.home-assistant.io/blog/2026/05/06/release-20265/)
- **Home dashboard como Overview padrão** — cards-resumo (luzes, clima, segurança, mídia, clima/weather, energia), favoritos, áreas, página de Devices sem área (2026.1/2026.2) (fonte: https://www.home-assistant.io/blog/2026/01/07/release-20261/ e https://www.home-assistant.io/blog/2026/02/04/release-20262/)
- **Security dashboard** — alertas ativos (Alert/Warning), favoritos, log de Activity de 24h, covers automáticos de janela (fonte: https://www.home-assistant.io/blog/2026/09/02/release-20269/ e https://www.home-assistant.io/blog/2026/05/06/release-20265/)
- **Maintenance dashboard** — agrupa entidades de bateria por área e destaca as baixas (2026.5) (fonte: https://www.home-assistant.io/blog/2026/05/06/release-20265/)
- **Map dashboard** — abas People/Devices/Zones, tiles vetoriais OSM servidos pela instância, marcadores com foto da pessoa (2026.10) (fonte: https://www.home-assistant.io/blog/2026/10/07/release-202610/)
- **Edição visual drag-and-drop** — editor sem código, undo/redo, picker de cards com preview usando dados reais e favoritos (2026.6/2026.8) (fonte: https://www.home-assistant.io/dashboards/ e https://www.home-assistant.io/blog/2026/06/03/release-20266/)
- **Visibility conditions** — cards, seções e badges com condições (state, numeric_state, screen, user, and/or, atributos, entidade do próprio card; mesmo conjunto de conditions de automação em 2026.10) (fonte: https://www.home-assistant.io/dashboards/badges/ e https://www.home-assistant.io/blog/2026/10/07/release-202610/)

### 1.2 Cards nativos (lista da doc oficial)

- **Activity** — timeline de eventos de entidades (fonte: https://www.home-assistant.io/dashboards/logbook/)
- **Alarm panel** — keypad e modos do alarm_control_panel (fonte: https://www.home-assistant.io/dashboards/alarm-panel/)
- **Area** — resumo de uma área, escolha de entidades individuais (2026.2) (fonte: https://www.home-assistant.io/dashboards/area/)
- **Button** — botão com tap/hold/double-tap (fonte: https://www.home-assistant.io/dashboards/button/)
- **Calendar** — vista de calendários, botão de adicionar evento (2026.10) (fonte: https://www.home-assistant.io/dashboards/calendar/)
- **Clock** — relógio, pode mostrar data (2026.8) (fonte: https://www.home-assistant.io/dashboards/clock/)
- **Conditional** — mostra card conforme condição (fonte: https://www.home-assistant.io/dashboards/conditional/)
- **Distribution** — proporção entre entidades, novo na 2026.2 (fonte: https://www.home-assistant.io/dashboards/distribution/)
- **Entities** — lista de entidades com rows (fonte: https://www.home-assistant.io/dashboards/entities/)
- **Entity** / **Entity filter** — card de uma entidade; lista filtrada por estado (fonte: https://www.home-assistant.io/dashboards/entity/)
- **Gauge** — medidor, redesenhado na 2026.4 (fonte: https://www.home-assistant.io/dashboards/gauge/)
- **Glance** — grade compacta de estados (fonte: https://www.home-assistant.io/dashboards/glance/)
- **Grid / Horizontal stack / Vertical stack** — containers de layout (fonte: https://www.home-assistant.io/dashboards/grid/)
- **Heading** — títulos de seção com badges/botões (fonte: https://www.home-assistant.io/dashboards/heading/)
- **History graph / Statistics graph / Statistic** — gráficos de histórico e de long-term statistics (período "Year" na 2026.3, cores por entidade na 2026.6) (fonte: https://www.home-assistant.io/dashboards/statistics-graph/)
- **Humidifier / Light / Thermostat / Media control / Plant status / Sensor** — cards específicos por domínio (fonte: https://www.home-assistant.io/dashboards/)
- **Map** — mapa de entidades/zonas (fonte: https://www.home-assistant.io/dashboards/map/)
- **Markdown** — texto com Jinja templates, ações de tap/hold (2026.4) (fonte: https://www.home-assistant.io/dashboards/markdown/)
- **Picture / Picture entity / Picture glance / Picture elements** — imagens, câmeras e elementos posicionados sobre planta (fonte: https://www.home-assistant.io/dashboards/picture-elements/)
- **Shortcut** — abre dashboards, áreas, URLs ou Assist, ou executa uma ação; existe também como badge (2026.5) (fonte: https://www.home-assistant.io/dashboards/shortcut/)
- **Tile** — card principal moderno, com card features embutidas, slider para input_select/select (2026.10), forecasts de weather (2026.6), mute/shuffle/repeat em media player (fonte: https://www.home-assistant.io/dashboards/tile/)
- **To-do list** — itens do todo (fonte: https://www.home-assistant.io/dashboards/todo-list/)
- **Weather forecast** — previsão (fonte: https://www.home-assistant.io/dashboards/weather-forecast/)
- **Webpage (iframe)** — embute uma URL (fonte: https://www.home-assistant.io/dashboards/iframe/)

### 1.3 Card features, ações, badges, headers

- **Card features (lista completa verificada)** — controles embutidos no tile: `alarm-modes`, `bar-gauge`, `button`, `climate-fan-modes`, `climate-hvac-modes`, `climate-preset-modes`, `climate-swing-modes`, `climate-swing-horizontal-modes`, `counter-actions`, `cover-open-close`, `cover-position`, `cover-position-favorite`, `cover-tilt`, `cover-tilt-favorite`, `cover-tilt-position`, `date-set`, `fan-direction`, `fan-oscillate`, `fan-preset-modes`, `fan-speed`, `humidifier-modes`, `humidifier-toggle`, `lawn-mower-commands`, `light-brightness`, `light-color-favorites`, `light-color-temp`, `light-effect`, `lock-commands`, `lock-open-door`, `media-player-playback`, `media-player-sound-mode`, `media-player-source`, `media-player-volume-buttons`, `media-player-volume-slider`, `numeric-input`, `select-options`, `target-humidity`, `target-temperature`, `timer-actions`, `timer-presets`, `toggle`, `trend-graph`, `update-actions`, `vacuum-commands`, `vacuum-fan-speed`, `valve-open-close`, `valve-position`, `valve-position-favorite`, `water-heater-operation-modes`, `area-controls`, `temperature-forecast`, `precipitation-forecast` (fonte: https://www.home-assistant.io/dashboards/features/)
- **Ações de dashboard** — `more-info`, `toggle`, `perform-action`, `navigate`, `url`, `assist`, `none`; defaults: tap=toggle, hold/double-tap=more-info (fonte: https://www.home-assistant.io/dashboards/actions/)
- **Badges** — `entity`, `shortcut`, `entity-filter`; com `state_content`, `time_format`, visibilidade (fonte: https://www.home-assistant.io/dashboards/badges/)
- **Headers e footers de card** — texto/botões acima e abaixo de cards (fonte: https://www.home-assistant.io/dashboards/header-footer/)
- **Layout de card** — editor de layout com opção "auto height" (2026.4) (fonte: https://www.home-assistant.io/blog/2026/04/01/release-20264/)
- **Custom cards** — API para cards de terceiros; podem optar por aparecer em seção "Community" do picker (2026.6) (fonte: https://contributors.home-assistant.io/frontend/custom-ui/card/ e https://www.home-assistant.io/blog/2026/06/03/release-20266/)

### 1.4 Organização, busca, temas, perfil

- **Áreas** — agrupam devices/entidades por cômodo; usadas como target em automações e para gerar cards (fonte: https://www.home-assistant.io/docs/organizing/)
- **Andares (floors)** — agrupam áreas; targetáveis em automações/scripts (fonte: https://www.home-assistant.io/docs/organizing/)
- **Labels** — tags aplicáveis a áreas, devices, entidades, automações, cenas, scripts, helpers; usáveis como target e como filtro (fonte: https://www.home-assistant.io/docs/organizing/labels/)
- **Categorias** — agrupam itens dentro de tabelas (automações, scripts, helpers) (fonte: https://www.home-assistant.io/docs/organizing/)
- **Aliases** — nomes alternativos de entidades, áreas e andares para voz (fonte: https://www.home-assistant.io/voice_control/aliases/)
- **Quick search** — Ctrl/Cmd+K, filtros por navegação/comandos/entidades/devices/áreas; pode iniciar comando do Assist (2026.2/2026.8) (fonte: https://www.home-assistant.io/blog/2026/02/04/release-20262/)
- **Search relacionados** — `search/related` retorna itens relacionados (scenes, scripts, groups, labels etc.) para um item (fonte: https://raw.githubusercontent.com/home-assistant/core/dev/homeassistant/components/search/__init__.py)
- **Temas** — CSS variables definidas em `frontend: themes:`, variantes `modes` light/dark, escolha por usuário; ações `frontend.set_theme` e `frontend.reload_themes` (fonte: https://www.home-assistant.io/integrations/frontend/)
- **Tema por card** — temas aplicáveis por card (fonte: https://www.home-assistant.io/dashboards/)
- **Perfil do usuário** — seções Appearance, Localization, This browser/mobile app, Security; usuário edita nome e foto (2026.10) (fonte: https://www.home-assistant.io/blog/2026/10/07/release-202610/)
- **Sidebar customizável** — reordenar itens no perfil (fonte: https://www.home-assistant.io/dashboards/dashboards/)
- **Acessibilidade em gráficos** — charts navegáveis por teclado, anúncios para screen reader, tons de áudio, atalho H (2026.9) (fonte: https://www.home-assistant.io/blog/2026/09/02/release-20269/)
- **Template editor (Tools)** — preview Jinja com split view redimensionável (2026.8) (fonte: https://www.home-assistant.io/blog/2026/08/05/release-20268/)
- **Editor YAML com lint inline** (2026.6) (fonte: https://www.home-assistant.io/blog/2026/06/03/release-20266/)

---

## 2. App Companion (iOS/Android/macOS/Wear/Auto)

- **Plataformas** — iOS 16.4+, watchOS 9+, Android 6+, Home Assistant 0.104+; também Apple Watch, Wear OS, CarPlay, Android Auto/Automotive, Meta Quest (fonte: https://companion.home-assistant.io/docs/getting_started/ e https://companion.home-assistant.io/)
- **Múltiplos servidores** — conectar mais de uma instância (fonte: https://companion.home-assistant.io/docs/getting_started/)
- **TLS client auth / níveis de segurança de conexão / redes confiáveis (SSID)** — mTLS no Android, Wear exige PKCS12 (fonte: https://companion.home-assistant.io/docs/getting_started/)
- **Notificações básicas** — `notify.mobile_app_<device>`; `message`, `title`, `group`, `tag` (replace), `clear_notification`; apps agora expõem entidades notify (2026.5) (fonte: https://companion.home-assistant.io/docs/notifications/notifications-basic/)
- **Notificações Android-only** — `channel`, `importance`, `color`, `icon_url`, `sticky`, `timeout`, `persistent`, `alert_once`, `vibrationPattern`, `ledColor`, TTS (`tts_text`), `chronometer`, `progress`, `live_update` (Android 16+), HTML na mensagem (fonte: https://companion.home-assistant.io/docs/notifications/notifications-basic/)
- **Notificações iOS-only** — `subtitle`, `push.sound`, `push.badge`, `interruption-level` (passive/active/time-sensitive/critical), `presentation_options`, Live Activity (iOS 17.2+), communication notifications com avatar (fonte: https://companion.home-assistant.io/docs/notifications/notifications-basic/)
- **Notificações críticas** (fonte: https://companion.home-assistant.io/docs/notifications/critical-notifications)
- **Anexos de imagem/vídeo e conteúdo dinâmico** (fonte: https://companion.home-assistant.io/docs/notifications/notification-attachments)
- **Notificações acionáveis** — array `actions` (Android 3, iOS ~10), evento `mobile_app_notification_action`, ações `URI`, `REPLY`/`textInput` com `reply_text`, evento `mobile_app_notification_cleared` (Android) (fonte: https://companion.home-assistant.io/docs/notifications/actionable-notifications)
- **Notification commands** — ex.: pedir atualização imediata de localização (fonte: https://companion.home-assistant.io/docs/notifications/notification-commands#request-location-updates)
- **Local push** (fonte: https://companion.home-assistant.io/docs/notifications/notification-local)
- **Sensores do celular (Android)** — bateria (nível, estado, saúde, temperatura, ciclos, potência), Wi-Fi (SSID, BSSID, sinal, IP), dados móveis, SIM, Bluetooth, brilho/orientação de tela, DND, ringer, volumes por stream, próximo alarme, notificações (última/contagem), mídia ativa, steps, luz, pressão, proximidade, IP público, tráfego, storage, Doze, Power Save, Interactive, keyguard, Android Auto e dados de carro (fonte: https://companion.home-assistant.io/docs/core/sensors/)
- **Sensores do celular (iOS/macOS)** — bateria, SSID/BSSID, tipo de conexão, geocoded location, Focus, storage, atividade, steps, distância, andares, pressão, SIM, relógio (bateria do Watch); macOS: app em primeiro plano, câmera/microfone em uso, displays (fonte: https://companion.home-assistant.io/docs/core/sensors/)
- **Apple Health (iOS)** — passos, energia, FC, VFC, pressão arterial, SpO2, sono em fases, peso, glicose, temperatura etc. (fonte: https://companion.home-assistant.io/docs/core/sensors/)
- **Health Connect (Android)** — sensores `health_connect_*` (passos, FC, sono, peso, VO2 max etc.) (fonte: https://companion.home-assistant.io/docs/core/sensors/)
- **Localização em background** — Android usa Fused Location (1-3 min); iOS usa significant location change (fonte: https://companion.home-assistant.io/docs/core/location/)
- **Geofencing por zonas** — iOS cria geofences de todas as zonas; Android até 100 zonas; iBeacon no iOS para eventos de entrada (fonte: https://companion.home-assistant.io/docs/core/location/)
- **High accuracy mode (Android)** — GPS a cada poucos segundos, custo de bateria (fonte: https://companion.home-assistant.io/docs/core/location/)
- **Widgets Android** — Action button, Entity State, Media Player, Picture (câmera/imagem), Template, To-do list; temas dynamic color/light-dark/transparent (fonte: https://companion.home-assistant.io/docs/integrations/android-widgets)
- **Widgets iOS** — [NÃO CONFIRMADO] (a página de widgets iOS não foi encontrada: companion.home-assistant.io/docs/core/widgets retornou 404)
- **Quick Settings tiles (Android)** — até 40 tiles, toggle de switch/light/cover/fan/lock, press de button, scenes e scripts (fonte: https://companion.home-assistant.io/docs/integrations/android-quick-settings)
- **Device Controls / Shortcuts / WebView (Android)** — listados no índice; conteúdo não lido [NÃO CONFIRMADO] (fonte: https://companion.home-assistant.io/docs/core)
- **Siri Shortcuts (iOS), Haptics, Sharing, Theming, App Events** — listados no índice; conteúdo não lido [NÃO CONFIRMADO] (fonte: https://companion.home-assistant.io/docs/core)
- **URL handler** — `homeassistant://navigate` (Android/iOS/macOS); `call_service`, `fire_event`, `send_location` (iOS/macOS) (fonte: https://companion.home-assistant.io/docs/integrations/url-handler)
- **Universal links para NFC** — `https://www.home-assistant.io/ios/nfc/?url=<URL>` gravado em tag NDEF (fonte: https://companion.home-assistant.io/docs/integrations/universal-links/)
- **Tags NFC/QR** — evento `tag_scanned` com `tag_id`, `name`, `device_id`; trigger `tag`; entidade `tag` com último scan; apps gravam tags; QR via `https://www.home-assistant.io/tag/<id>` (fonte: https://www.home-assistant.io/integrations/tag/ e https://companion.home-assistant.io/docs/integrations/universal-links/)
- **Wake word no Android (experimental)** — 3 wake words on-device, sem áudio na nuvem (2026.3) (fonte: https://www.home-assistant.io/blog/2026/03/04/release-20263/)
- **Assist no app** — voz e texto (fonte: https://www.home-assistant.io/voice_control/android/ e https://www.home-assistant.io/voice_control/apple/)
- **Protocolo mobile_app** — registro via OAuth2 e webhook ID como credencial, encriptação libsodium opcional, push via WebSocket ou cloud. Os tipos de request de webhook (`update_location`, `register_sensor` etc.) [NÃO CONFIRMADO]: a página só linka subpáginas que não li (fonte: https://contributors.home-assistant.io/companion/mobile-app-api/)

---

## 3. Entidades e domínios

### 3.1 Controle físico

- **light** — estados on/off; ações `turn_on` (brightness 0-255, cor, color temp, effect, transition, flash, profile), `turn_off`, `toggle`; color modes `onoff`, `brightness`, `color_temp`, `hs`, `xy`, `rgb`, `rgbw`, `rgbww`, `white`; features `EFFECT`, `FLASH`, `TRANSITION`; atributos `supported_color_modes`, `color_temp_kelvin`, `min/max_color_temp_kelvin`, `effect_list` (fonte: https://www.home-assistant.io/integrations/light/ e https://raw.githubusercontent.com/home-assistant/core/dev/homeassistant/components/light/const.py)
- **switch** — on/off genérico; também usado para "mudar tipo de device" via helper (fonte: https://www.home-assistant.io/docs/configuration/helpers/)
- **climate** — HVAC modes `off/heat/cool/heat_cool/auto/dry/fan_only`; `hvac_action` (cooling, defrosting, drying, fan, heating, idle, off, preheating); ações set_hvac_mode, set_temperature, set_humidity, set_fan_mode, set_preset_mode, set_swing_mode, set_swing_horizontal_mode, turn_on/off/toggle; features target temp (e range), humidity, fan, preset, swing, swing horizontal; presets padrão none/eco/away/boost/comfort/home/sleep/activity (fonte: https://www.home-assistant.io/integrations/climate/ e https://raw.githubusercontent.com/home-assistant/core/dev/homeassistant/components/climate/const.py)
- **cover** — estados opening/open/closing/closed; ações open/close/stop/set_position/toggle e equivalentes `_tilt`; device classes awning, blind, curtain, damper, door, garage, gate, shade, shutter, window; ação aceita `speed` opcional (2026.9) (fonte: https://www.home-assistant.io/integrations/cover/ e https://www.home-assistant.io/blog/2026/09/02/release-20269/)
- **media_player** — estados off/on/idle/playing/paused/buffering; ações play/pause/stop/next/previous/seek/play_media/volume_set/up/down/mute/select_source/select_sound_mode/shuffle_set/repeat_set/clear_playlist/join/unjoin/browse_media/search_media; device classes tv, speaker, receiver, projector (fonte: https://www.home-assistant.io/integrations/media_player/)
- **media_player features (bitmask)** — PAUSE, SEEK, VOLUME_SET, VOLUME_MUTE, PREVIOUS/NEXT_TRACK, TURN_ON/OFF, PLAY_MEDIA, VOLUME_STEP, SELECT_SOURCE, STOP, CLEAR_PLAYLIST, PLAY, SHUFFLE_SET, SELECT_SOUND_MODE, BROWSE_MEDIA, REPEAT_SET, GROUPING, MEDIA_ANNOUNCE, MEDIA_ENQUEUE, SEARCH_MEDIA (fonte: https://raw.githubusercontent.com/home-assistant/core/dev/homeassistant/components/media_player/const.py)
- **camera** — estados recording/streaming/idle; ações snapshot, record, play_stream, enable/disable_motion_detection, turn_on/off; stream via integração `stream` (HLS) e WebRTC (fonte: https://www.home-assistant.io/integrations/camera/)
- **lock** — estados locked/locking/unlocked/unlocking/open/opening/jammed; ações lock, unlock, open (fonte: https://www.home-assistant.io/integrations/lock/)
- **alarm_control_panel** — estados disarmed, armed_home/away/night/vacation/custom_bypass, arming, pending, triggered, disarming; ações arm_*, disarm, trigger com `code` (fonte: https://www.home-assistant.io/integrations/alarm_control_panel/)
- **vacuum** — estados cleaning/docked/error/idle/paused/returning; ações start, pause, stop, return_to_base, clean_spot, clean_area (por segmentos mapeados a áreas do HA), locate, set_fan_speed, send_command (fonte: https://www.home-assistant.io/integrations/vacuum/)
- **fan** — on/off, percentage de velocidade, preset modes, oscilação, direção, increase/decrease_speed (fonte: https://www.home-assistant.io/integrations/fan/)
- **humidifier** — on/off; set_humidity, set_mode; device classes humidifier/dehumidifier (fonte: https://www.home-assistant.io/integrations/humidifier/)
- **water_heater** — estados off, eco, electric, performance, high_demand, heat_pump, gas; set_temperature, set_operation_mode, set_away_mode (fonte: https://www.home-assistant.io/integrations/water_heater/)
- **lawn_mower** — estados mowing/docked/paused/idle/returning/error; ações start_mowing, pause, dock; `stop` e estado idle adicionados na 2026.10 (fonte: https://www.home-assistant.io/integrations/lawn_mower/ e https://www.home-assistant.io/blog/2026/10/07/release-202610/)
- **valve** — open/opening/closed/closing; open, close, stop, set_position, toggle; device classes water e gas (fonte: https://www.home-assistant.io/integrations/valve/)
- **siren** — on/off; turn_on, turn_off, toggle; parâmetros tone/duration/volume [NÃO CONFIRMADO] na página do domínio (fonte: https://www.home-assistant.io/integrations/siren/)

### 3.2 Sensores e estado

- **sensor (device classes)** — absolute_humidity, apparent_power, aqi, area, atmospheric_pressure, battery, blood_glucose_concentration, carbon_dioxide, carbon_monoxide, conductivity, current, data_rate, data_size, date, distance, duration, energy, energy_distance, energy_storage, enum, frequency, gas, humidity, illuminance, irradiance, moisture, monetary, nitrogen_dioxide, nitrogen_monoxide, nitrous_oxide, ozone, ph, pm1, pm25, pm4, pm10, power_factor, power, precipitation, precipitation_intensity, pressure, radon, reactive_energy, reactive_power, signal_strength, sound_pressure, speed, sulphur_dioxide, temperature, temperature_delta, timestamp, uptime, volatile_organic_compounds(_parts), voltage, volume, volume_flow_rate, volume_storage, water, weight, wind_direction, wind_speed (fonte: https://www.home-assistant.io/integrations/sensor/)
- **sensor state classes** — `measurement`, `measurement_angle`, `total`, `total_increasing` (necessárias para long-term statistics) (fonte: https://www.home-assistant.io/integrations/sensor/)
- **binary_sensor (device classes)** — battery, battery_charging, carbon_monoxide, cold, connectivity, door, garage_door, gas, glass_break, heat, light, lock, moisture, motion, moving, occupancy, opening, plug, power, presence, problem, running, safety, smoke, sound, tamper, update, vibration, window, com labels on/off específicas (fonte: https://www.home-assistant.io/integrations/binary_sensor/)
- **update** — on = update disponível; ações install, skip, clear_skipped; atributos installed_version, latest_version, release_summary, release_url, skipped_version, title; progresso/backup antes de instalar [NÃO CONFIRMADO] na página do domínio; install/skip exigem admin desde 2026.9 (fonte: https://www.home-assistant.io/integrations/update/ e https://www.home-assistant.io/blog/2026/09/02/release-20269/)
- **event** — estado = timestamp do último evento; device classes button, doorbell, motion; trigger `event.received`; nomes dos atributos `event_type`/`event_types` [NÃO CONFIRMADO] na doc (fonte: https://www.home-assistant.io/integrations/event/)
- **weather** — condições clear-night, cloudy, fog, hail, lightning, lightning-rainy, partlycloudy, pouring, rainy, snowy, snowy-rainy, sunny, windy, windy-variant, exceptional; atributos de temperatura, humidade, pressão, vento, UV, visibilidade, cloud coverage, dew point; previsão via ação `weather.get_forecasts` e WS `weather/subscribe_forecast` (daily/hourly/twice_daily) (fonte: https://www.home-assistant.io/integrations/weather/ e https://raw.githubusercontent.com/home-assistant/core/dev/homeassistant/components/weather/websocket_api.py)
- **sun** — `sun.sun` above/below_horizon, elevation, azimuth, next_rising/setting/dawn/dusk/noon/midnight; golden/blue hour, midnight sun, polar night como triggers/conditions (2026.9) (fonte: https://www.home-assistant.io/integrations/sun/)

### 3.3 Pessoas e presença

- **person** — vincula device_trackers a uma pessoa e opcionalmente a um usuário de login; estado home/not_home/zona; atributos latitude/longitude/gps_accuracy/in_zones (fonte: https://www.home-assistant.io/integrations/person/)
- **zone** — região com raio (default 100 m) e `passive`; `zone.home` não removível; estado = número de pessoas; triggers entered/left/occupancy (fonte: https://www.home-assistant.io/integrations/zone/)
- **device_tracker** — trackers de posição (GPS) e de conexão (router/Bluetooth); estado = zona; atributos in_zones, gps_accuracy, tracking_type (fonte: https://www.home-assistant.io/integrations/device_tracker/)
- **Zona editor com mapa vetorial** (2026.10) (fonte: https://www.home-assistant.io/blog/2026/10/07/release-202610/)

### 3.4 Entradas, helpers de controle e conteúdo

- **number** — ação `number.set_value`; modos box/slider [NÃO CONFIRMADO] na doc do domínio (fonte: https://www.home-assistant.io/integrations/number/)
- **select** — `select_option`, `select_first/last/next/previous` (fonte: https://www.home-assistant.io/integrations/select/)
- **button** — push-style; device classes identify, restart, update; ação `press` (fonte: https://www.home-assistant.io/integrations/button/)
- **text** — `text.set_value`; modos text/password e `pattern` [NÃO CONFIRMADO] (fonte: https://www.home-assistant.io/integrations/text/)
- **date / time / datetime** — entidades de data/hora; páginas dos domínios não lidas [NÃO CONFIRMADO] (existem card feature `date-set` e helper "Date and/or time") (fonte: https://www.home-assistant.io/dashboards/features/)
- **todo** — estado = itens incompletos; ações add_item, update_item, remove_item, get_items, remove_completed_items; WS `todo/item/list`, `todo/item/subscribe`, `todo/item/move` (fonte: https://www.home-assistant.io/integrations/todo/ e https://raw.githubusercontent.com/home-assistant/core/dev/homeassistant/components/todo/__init__.py)
- **calendar** — on/off conforme evento ativo; ações `create_event`, `get_events`; triggers event_started/event_ended com offset; WS `calendar/event/create|update|delete|subscribe`; REST `/api/calendars` (fonte: https://www.home-assistant.io/integrations/calendar/ e https://raw.githubusercontent.com/home-assistant/core/dev/homeassistant/components/calendar/__init__.py)
- **image** — building block para imagens estáticas; ação `image.snapshot`; introduzido na 2023.7 (fonte: https://www.home-assistant.io/integrations/image/)
- **scene** — ações turn_on (com transition), apply, create (snapshot), delete, reload; editor de cenas na UI (fonte: https://www.home-assistant.io/integrations/scene/)
- **script** — entidade `script.*` (on enquanto roda); modos single/restart/queued/parallel; `fields` com selectors, `variables`, `sequence`; ações turn_on/turn_off/toggle/reload (fonte: https://www.home-assistant.io/integrations/script/)
- **notify** — `notify.send_message` (entidade), `notify.persistent_notification`, `notify.notify`; groups de notify; celulares do Companion aparecem como entidades notify (fonte: https://www.home-assistant.io/integrations/notify/)
- **tts** — ações `tts.speak`, `tts.say` (legado), `tts.clear_cache`; cache em disco; transcodificação via FFmpeg (fonte: https://www.home-assistant.io/integrations/tts/)
- **stt** — entidade de speech-to-text; estado = último uso (fonte: https://www.home-assistant.io/integrations/stt/)
- **wake_word** — entidade de detecção; estado = timestamp da última detecção; introduzido na 2023.9 (fonte: https://www.home-assistant.io/integrations/wake_word/)
- **assist_satellite** — estados idle/listening/processing/responding; ações announce, ask_question, start_conversation; triggers e conditions por estado; introduzido na 2024.10 (fonte: https://www.home-assistant.io/integrations/assist_satellite/)
- **ai_task** — ações `generate_data` (texto/estruturado, com schema de campos) e `generate_image`; aceita anexos (ex.: snapshot de câmera) (fonte: https://www.home-assistant.io/integrations/ai_task/)
- **conversation** — ações `conversation.process` e `conversation.reload`; triggers de sentença (fonte: https://www.home-assistant.io/integrations/conversation/)
- **remote, infrared, radio_frequency** — entidades `remote` e novos paineis/plataformas de IR (2026.4) e RF (2026.5) com receptores/transmissores via ESPHome (fonte: https://www.home-assistant.io/blog/2026/04/01/release-20264/ e https://www.home-assistant.io/blog/2026/05/06/release-20265/)
- **Registry de entidades** — nome, área, labels, categorias, aliases, hidden/disabled; WS `config/entity_registry/*` (fonte: https://raw.githubusercontent.com/home-assistant/core/dev/homeassistant/components/config/entity_registry.py)
- **Conceitos** — integrations, devices (agrupam entidades), entities (estado + atributos), areas, floors, automations, scripts, scenes, apps (fonte: https://www.home-assistant.io/getting-started/concepts-terminology/)

---

## 4. Automação

### 4.1 Triggers (lista oficial por integração)

- **Triggers gerais** — `event`, `homeassistant`, `numeric_state`, `state`, `template`, `time`, `time_pattern` (fonte: https://www.home-assistant.io/triggers/)
- **Triggers de integração** — `mqtt`, `webhook`, `tag`, `conversation` (sentence), `geo_location`, `persistent_notification`, `device`, `zwave_js.event`, `zwave_js.value_updated`, `samsungtv.turn_on`, `webostv.turn_on`, `lg_netcast.turn_on` (fonte: https://www.home-assistant.io/triggers/)
- **Triggers purpose-specific por domínio (padrão desde 2026.7)** — ex.: `light.turned_on`, `lock.locked`, `door.opened`, `motion.detected`, `temperature.crossed_threshold`, `battery.became_low`, `climate.started_heating`, `cover.blind_opened`, `media_player.started_playing`, `vacuum.returned_to_dock`, `lawn_mower.errored`, `update.became_available`, `alarm_control_panel.armed_away`, `timer.finished`, `todo.item_added`, `schedule.block_started`, `scene.activated`, `doorbell.rang`, `zone.entered`, `sun.sunrise`, `moon.phase_changed`, `assist_satellite.listening` e dezenas de outros (fonte: https://www.home-assistant.io/triggers/)
- **Duração em triggers purpose-specific** — exigir estado por X tempo (Labs em 2026.5, default em 2026.7) (fonte: https://www.home-assistant.io/blog/2026/05/06/release-20265/)
- **Triggers que tratam unknown/unavailable e event entities** (fonte: https://www.home-assistant.io/blog/2026/07/01/release-20267/)
- **Targets por área/andar/label** — automações seguem devices adicionados/removidos do cômodo (fonte: https://www.home-assistant.io/blog/2026/07/01/release-20267/)

### 4.2 Conditions

- **Conditions gerais** — `and`, `or`, `not`, `state`, `numeric_state`, `template`, `time`, `trigger`, `device` (fonte: https://www.home-assistant.io/docs/scripts/conditions/)
- **Conditions purpose-specific** — ex.: `light.is_on`, `lock.is_locked`, `door.is_open`, `climate.is_heating`, `media_player.is_playing`, `vacuum.is_docked`, `sun.is_golden_hour`, `moon.is_waxing`, `schedule.is_on`, `timer.is_active`, `todo.incomplete`, `zone.in_zone`, `update.is_available`, `zwave_js.node_status` e muitas outras (fonte: https://www.home-assistant.io/docs/scripts/conditions/)
- **Live condition testing** — editor mostra se cada condition passa agora, inclusive dentro de actions (2026.6/2026.7) (fonte: https://www.home-assistant.io/blog/2026/07/01/release-20267/)
- **"Triggered by" condition** — seleciona triggers por lista (2026.10) (fonte: https://www.home-assistant.io/blog/2026/10/07/release-202610/)

### 4.3 Actions e fluxo

- **Call action** — chave `action:` com `target` (entity_id, device_id, area_id, floor_id, label_id) e `data`; `response_variable` (fonte: https://www.home-assistant.io/docs/automation/action/ e https://contributors.home-assistant.io/core/internals/websocket-api/)
- **Building blocks verificados** — `parallel`, `variables`, `stop` (retorna response), `event` (fire manual event), `set_conversation_response`, `condition`, `delay`, `continue_on_error`, `enabled`, `alias` (fonte: https://www.home-assistant.io/docs/automation/action/ e https://www.home-assistant.io/docs/scripts/)
- **choose / if-then-else / repeat / wait_template / wait_for_trigger / sequence** — existem no editor, mas a doc consultada não os detalhou [NÃO CONFIRMADO na fonte lida] (fonte: https://www.home-assistant.io/docs/scripts/)
- **Modos de execução** — `single`, `restart`, `queued`, `parallel`; `max` (default 10, mín. 2) e `max_exceeded` (fonte: https://www.home-assistant.io/docs/automation/modes/)
- **Notes em passos** (2026.6) (fonte: https://www.home-assistant.io/blog/2026/06/03/release-20266/)
- **Continue on error no editor visual** (2026.3) (fonte: https://www.home-assistant.io/blog/2026/03/04/release-20263/)
- **Run actions / simulated triggers** — testar ações sem trigger/condition (fonte: https://www.home-assistant.io/docs/automation/troubleshooting/)

### 4.4 Editor, traces, blueprints, templates

- **Editor visual + YAML** — alternância, "Migrate" para YAML-only, "Take control" em blueprints, toggle enable/disable (fonte: https://www.home-assistant.io/docs/automation/troubleshooting/)
- **Traces** — lista cada execução, passo a passo com erros; redesenhadas na 2026.10; mostram entidades/devices/áreas alvo de cada passo (2026.9); erros de template sempre incluídos (2026.7). Quantidade armazenada [NÃO CONFIRMADO] (fonte: https://www.home-assistant.io/docs/automation/troubleshooting/ e https://www.home-assistant.io/blog/2026/09/02/release-20269/)
- **Blueprints** — configurações reutilizáveis de automation/script/template com inputs; atualizações propagam ao reload. Import por URL, `!input` e Blueprint Exchange [NÃO CONFIRMADO] nesta página (fonte: https://www.home-assistant.io/docs/blueprint/)
- **Templates Jinja** — categorias: estados, tipos, datas/horas, loops/condições, métodos Python; novos `state_attr_translated`, `entity_name` (2026.4), `timedelta_string` (2026.10); engine até 40% mais rápido (2026.7/2026.8). Lista de funções de áreas/labels/floors [NÃO CONFIRMADO] aqui (fonte: https://www.home-assistant.io/docs/configuration/templating/)
- **Selectors** — tipos para campos de script/blueprint; lista completa [NÃO CONFIRMADO] (URL /docs/scripts/selectors/ retornou 404). `choose` selector novo na 2026.1 (fonte: https://www.home-assistant.io/blog/2026/01/07/release-20261/)
- **Validação via WS** — `validate_config`, `test_condition`, `subscribe_trigger`, `execute_script`, `subscribe_condition`, `get_triggers_for_target` etc. (fonte: https://raw.githubusercontent.com/home-assistant/core/dev/homeassistant/components/websocket_api/commands.py)

### 4.5 Helpers

- **Toggle** (input_boolean) — liga/desliga manual (fonte: https://www.home-assistant.io/docs/configuration/helpers/)
- **Number** (input_number) — slider ou caixa (fonte: https://www.home-assistant.io/docs/configuration/helpers/)
- **Dropdown** (input_select) — lista definida pelo usuário (fonte: https://www.home-assistant.io/docs/configuration/helpers/)
- **Text** (input_text) (fonte: https://www.home-assistant.io/docs/configuration/helpers/)
- **Date and/or time** (input_datetime) (fonte: https://www.home-assistant.io/docs/configuration/helpers/)
- **Button** (input_button) (fonte: https://www.home-assistant.io/docs/configuration/helpers/)
- **Counter** — incrementa/decrementa/reseta; triggers incremented/decremented/maximum_reached/minimum_reached/reset (fonte: https://www.home-assistant.io/triggers/)
- **Timer** — start/pause/cancel/finish/change; duração editável rodando (2026.7); presets e botões no tile (2026.10) (fonte: https://www.home-assistant.io/blog/2026/07/01/release-20267/)
- **Schedule** — on/off por blocos semanais; triggers block_started/ended (fonte: https://www.home-assistant.io/docs/configuration/helpers/)
- **Min/max/mean/sum de sensores** (helper "Combine the state of several sensors") (fonte: https://www.home-assistant.io/docs/configuration/helpers/)
- **Derivative** — taxa de variação (fonte: https://www.home-assistant.io/docs/configuration/helpers/)
- **Integral (Riemann sum)** — total no tempo, ex.: energia a partir de potência (fonte: https://www.home-assistant.io/docs/configuration/helpers/)
- **Utility Meter** — consumo por período e por tarifa (fonte: https://www.home-assistant.io/docs/configuration/helpers/)
- **History Stats** — quanto tempo/quantas vezes uma entidade esteve num estado (fonte: https://www.home-assistant.io/docs/configuration/helpers/)
- **Threshold** — acima/abaixo de limite (fonte: https://www.home-assistant.io/docs/configuration/helpers/)
- **Template helper** — entidade a partir de template; suporta climate e delays em binary_sensor (2026.10) (fonte: https://www.home-assistant.io/blog/2026/10/07/release-202610/)
- **Generic thermostat** — controla aquecedor/resfriador a partir de sensor (fonte: https://www.home-assistant.io/docs/configuration/helpers/)
- **Group** — agrupa entidades (fonte: https://www.home-assistant.io/docs/configuration/helpers/)
- **Change device type of a switch** — apresenta switch como outro tipo (ex.: light) (fonte: https://www.home-assistant.io/docs/configuration/helpers/)
- **Statistics helper (sensor `statistics`)** — [NÃO CONFIRMADO] como helper UI nesta página; não está na lista consultada

---

## 5. Assist, voz e LLM

- **Assist (conversation default agent)** — frases da comunidade em muitos idiomas (~80 idiomas listados na página de voz; contagem exata não declarada) (fonte: https://www.home-assistant.io/voice_control/)
- **Pipelines de Assist** — estágios `wake_word`, `stt`, `intent`, `tts`; WS `assist_pipeline/run` com `start_stage`/`end_stage` (fonte: https://contributors.home-assistant.io/core/internals/assist-pipelines/)
- **Eventos do pipeline** — `run-start`, `wake_word-start/end`, `stt-start`, `stt-vad-start/end`, `stt-end`, `intent-start`, `intent-progress` (agents com streaming), `intent-end`, `tts-start`, `tts-end`, `run-end`, `error` (fonte: https://contributors.home-assistant.io/core/internals/assist-pipelines/)
- **Áudio binário no pipeline** — PCM 16 kHz 16-bit mono; chunk vazio encerra o stream (fonte: https://raw.githubusercontent.com/home-assistant/core/dev/homeassistant/components/assist_pipeline/websocket_api.py)
- **Debug de pipeline** — `assist_pipeline/pipeline_debug/list|get`, captura de áudio do device (admin) (fonte: https://raw.githubusercontent.com/home-assistant/core/dev/homeassistant/components/assist_pipeline/websocket_api.py)
- **Expor entidades ao Assist** — controle do que voz/LLM enxerga (fonte: https://www.home-assistant.io/voice_control/voice_remote_expose_devices/)
- **Custom sentences** — templates próprios; intents custom via `intent_script` (fonte: https://www.home-assistant.io/integrations/conversation/ e https://www.home-assistant.io/voice_control/custom_sentences/)
- **Sentence trigger** — automação disparada por frase; resposta via `set_conversation_response` (fonte: https://www.home-assistant.io/integrations/conversation/)
- **Intents built-in** — `HassTurnOn`, `HassTurnOff` etc. A página `/integrations/intent/` retornou 404; lista completa [NÃO CONFIRMADO]
- **Voz: vacuum por área, fan modes do clima, to-do remove item** (2026.3/2026.4/2026.10) (fonte: https://www.home-assistant.io/blog/2026/04/01/release-20264/)
- **Wyoming protocol** — protocolo leve para STT/TTS/wake word externos; autodescoberta (fonte: https://www.home-assistant.io/integrations/wyoming/)
- **Whisper / Speech-to-Phrase (STT local)** (fonte: https://www.home-assistant.io/integrations/wyoming/)
- **Piper (TTS local)** (fonte: https://www.home-assistant.io/integrations/wyoming/)
- **openWakeWord** — roda no servidor, só inglês (fonte: https://www.home-assistant.io/voice_control/about_wake_word/)
- **microWakeWord** — on-device em ESP32-S3 e Android; modelos "okay nabu", "hey jarvis", "alexa" (fonte: https://www.home-assistant.io/voice_control/about_wake_word/)
- **Voice Preview Edition** — hardware ESP32-S3 + XMOS, mic duplo, LED ring, wake words "Okay Nabu"/"Hey Jarvis"/"Hey Mycroft" (fonte: https://www.home-assistant.io/voice-pe/)
- **ESPHome voice assistant / satélites** — ESP32-S3-BOX, Linux Voice Assistant (experimental), app Assist Satellite (fonte: https://www.home-assistant.io/voice_control/)
- **STT em nuvem** — Home Assistant Cloud; novo STT Nabu Casa (Soniox) em Labs (2026.9) (fonte: https://www.home-assistant.io/blog/2026/09/02/release-20269/)
- **Ollama** — agent local; opção experimental "Control Home Assistant" (tool calling; recomendado <25 entidades expostas); contexto default 8k; keep_alive (fonte: https://www.home-assistant.io/integrations/ollama/)
- **OpenAI Conversation** — conversation, AI Task, STT e TTS; web search; só endpoint oficial OpenAI (fonte: https://www.home-assistant.io/integrations/openai_conversation/)
- **Anthropic** — conversation e AI Task; extended thinking visível, web search/fetch, tool search, PDF, structured outputs, prompt caching (fonte: https://www.home-assistant.io/integrations/anthropic/)
- **Outros agents (2026)** — LiteLLM, llama.cpp (2026.8), OVHcloud AI Endpoints (2026.6), Google Gemini (thinking budget), Fish Audio (TTS) (fonte: https://www.home-assistant.io/blog/2026/08/05/release-20268/ e https://www.home-assistant.io/blog/2026/06/03/release-20266/)
- **MCP Server do HA** — endpoint `/api/mcp`, OAuth 2.0 com PKCE, só admin por padrão, tools vêm das LLM APIs; página de AI em Settings > System > AI (fonte: https://www.home-assistant.io/integrations/mcp_server/)
- **Discovery de MCP servers de apps** (2026.10) (fonte: https://www.home-assistant.io/blog/2026/10/07/release-202610/)
- **LLM tool names com prefixo de domínio** — breaking change na 2026.9 (fonte: https://www.home-assistant.io/blog/2026/09/02/release-20269/)
- **Assist mostra raciocínio e tool calls** — seção "Show details" (web desktop; não nos apps móveis ainda) (2026.4) (fonte: https://www.home-assistant.io/blog/2026/04/01/release-20264/)
- **Assist no dashboard** — ação de card `assist` e card Shortcut (fonte: https://www.home-assistant.io/dashboards/actions/)

---

## 6. Energia

- **Energy dashboard** — seções Overview, Electricity, Gas, Water e Now; cards ocultáveis em "Customize cards" (fonte: https://www.home-assistant.io/docs/energy/)
- **Grid** — estatística de consumo e opcionalmente de retorno à rede; aceita sensor de energia ou de potência (fonte: https://www.home-assistant.io/docs/energy/electricity-grid/)
- **Tarifas múltiplas** — dividir consumo por tarifa com `utility_meter` (fonte: https://www.home-assistant.io/docs/energy/faq/)
- **Compensação por exportação** — opção "Export compensation" na conexão de rede (fonte: https://www.home-assistant.io/docs/energy/faq/)
- **Opções de custo (preço estático, entidade de preço, entidade de custo total)** — [NÃO CONFIRMADO]: a documentação lida não descreve as três opções
- **Solar** — produção via inversor/CT clamp; previsão via integração `forecast_solar` (Solcast/Met.no não mencionados na página lida) (fonte: https://www.home-assistant.io/docs/energy/solar-panels/)
- **Bateria** — energia entrando/saindo; SoC combinado com peso por capacidade (2026.8); descarga por bateria (2026.10); badge/sensor de SoC (2026.6) (fonte: https://www.home-assistant.io/docs/energy/battery/ e https://www.home-assistant.io/blog/2026/08/05/release-20268/)
- **Gás** — consumo por P1, AI-on-the-edge, magnetômetro, rtlamr etc.; custo não descrito na página (fonte: https://www.home-assistant.io/docs/energy/gas/)
- **Água** — sensor de consumo, `total_increasing`; Sankey de água e de fluxo (2026.3) (fonte: https://www.home-assistant.io/docs/energy/water/)
- **Dispositivos individuais** — energia/água por device; hierarquia "upstream device" evita dupla contagem (fonte: https://www.home-assistant.io/docs/energy/individual-devices/)
- **Fontes por potência** — sensores de potência instantânea e formatos mais flexíveis (inversor invertido, carga/descarga separados) (2026.2) (fonte: https://www.home-assistant.io/blog/2026/02/04/release-20262/)
- **Nomes customizados de fontes** (grid/solar/bateria/gás/água) (2026.6) (fonte: https://www.home-assistant.io/blog/2026/06/03/release-20266/)
- **Cards de energia (types)** — `energy-date-selection`, `energy-compare-card`, `energy-usage-graph`, `energy-solar-graph`, `energy-gas-graph`, `energy-water-graph`, `water-sankey`, `water-flow-sankey`, `energy-distribution`, `energy-sources-table`, `energy-grid-neutrality-gauge`, `energy-grid-balance`, `energy-solar-consumed-gauge`, `energy-carbon-consumed-gauge`, `energy-self-sufficiency-gauge`, `energy-devices-graph`, `energy-devices-detail-graph`, `energy-sankey`, `power-sankey`, `power-sources-graph`, badges `power-total`, `gas-total`, `water-total` (fonte: https://www.home-assistant.io/dashboards/energy/)
- **WS de energia** — `energy/get_prefs`, `energy/save_prefs` (admin), `energy/info`, `energy/validate`, `energy/solar_forecast`, `energy/fossil_energy_consumption` (fonte: https://raw.githubusercontent.com/home-assistant/core/dev/homeassistant/components/energy/websocket_api.py)
- **Preços dinâmicos e hardware** — integrações como Green Planet Energy, Zonneplan, SlimmeLezer/Glow (P1/pulso) (fonte: https://www.home-assistant.io/blog/2026/10/07/release-202610/ e https://www.home-assistant.io/energy/)
- **Inversores/EV/baterias** — SolarEdge, Fronius, Sunsynk, Tesla Powerwall 3, Wallbox, Peblar, OpenEVSE, Tesla Wall Connector, Teslemetry, Solarman e dezenas de outros (fonte: https://www.home-assistant.io/blog/2026/10/07/release-202610/)

---

## 7. Descoberta e protocolos

- **Qualidade/IoT class** — filtros no catálogo: Local Push/Polling, Cloud Push/Polling, Assumed State, Calculated, Configurable; Quality Scale Bronze a Platinum; total exato de integrações não declarado (fonte: https://www.home-assistant.io/integrations/)
- **Zeroconf/mDNS** — descobre dispositivos e anuncia o HA (fonte: https://www.home-assistant.io/integrations/zeroconf/)
- **SSDP/UPnP** — descoberta + navegador SSDP (fonte: https://www.home-assistant.io/integrations/ssdp/)
- **DHCP discovery** — monitora requests DHCP, ARP, PTR; navegador DHCP (fonte: https://www.home-assistant.io/integrations/dhcp/)
- **Bluetooth (BLE)** — adaptador local ou ESPHome Bluetooth proxy; scan Auto/Active/Passive; monitores de advertisement e conexão (fonte: https://www.home-assistant.io/integrations/bluetooth/)
- **ZHA (Zigbee)** — rádios EZSP/TI/deCONZ (ZBT-2 recomendado), mapa de rede com RSSI/LQI, grupos, binding, OTA como update entity, quirks, backup automático (fonte: https://www.home-assistant.io/integrations/zha/)
- **Zigbee2MQTT** — bridge Zigbee-para-MQTT, GPL 3; mais de 2000 devices no catálogo Zigbee (blakadder lista 2693, que é um catálogo geral de devices Zigbee, não só Z2M) (fonte: https://www.zigbee2mqtt.io/ e https://zigbee.blakadder.com/)
- **Z-Wave JS** — via zwave-js-server (app Z-Wave JS ou Z-Wave JS UI), Long Range, S2, SmartStart (QR), update de firmware, mapa de rede (com vizinhos desde 2026.10), ações set_config_parameter/set_value/refresh_value, gestão de credenciais de fechaduras (2026.6) (fonte: https://www.home-assistant.io/integrations/zwave_js/)
- **Matter** — Matter Server app, comissionamento por QR/código (via app companion + Bluetooth), multi-admin com Google/Apple, OTA, diagnóstico, lock manager (usuários/PIN), mapa de rede Thread/Wi-Fi (2026.9) (fonte: https://www.home-assistant.io/integrations/matter/ e https://www.home-assistant.io/blog/2026/09/02/release-20269/)
- **Thread** — armazena credenciais, OTBR como border router com Yellow/ZBT-1/ZBT-2, compartilha credenciais com celular (fonte: https://www.home-assistant.io/integrations/thread/)
- **MQTT** — broker (app Mosquitto), discovery em `homeassistant/<component>/[<node_id>/]<object_id>/config`, device discovery com `device` e `origin`, birth/will em `homeassistant/status`, ações `mqtt.publish`/`dump`/`reload`, painel MQTT com broker status (2026.9) (fonte: https://www.home-assistant.io/integrations/mqtt/)
- **ESPHome** — API nativa com conexão persistente, noise PSK, descoberta mDNS/DHCP, proxies Bluetooth/IR/RF/serial, Voice PE (fonte: https://www.home-assistant.io/integrations/esphome/)
- **HomeKit Bridge** — expõe entidades do HA ao Apple Home/Siri; câmeras, fechaduras e TVs em accessory mode; filtros include/exclude (fonte: https://www.home-assistant.io/integrations/homekit/)
- **HomeKit Device (controller)** — importa acessórios HomeKit por IP, BLE e Thread (fonte: https://www.home-assistant.io/integrations/homekit_controller/)
- **Google Cast** — mDNS, `play_media`, Home Assistant Cast (dashboard em Cast devices, exige HTTPS) (fonte: https://www.home-assistant.io/integrations/cast/)
- **DLNA DMR** — controle de renderers DLNA, play_media, browse (fonte: https://www.home-assistant.io/integrations/dlna_dmr/)
- **DLNA DMS (media server)** — [NÃO CONFIRMADO] nesta fonte
- **Tuya** — cloud push via Smart Life/Tuya app (QR); quase todas as plataformas exceto lock e remote (fonte: https://www.home-assistant.io/integrations/tuya/)
- **Xiaomi Home (xiaomi_miio)** — gateways, purificadores, aspiradores, tomadas; tokens via conta Xiaomi (fonte: https://www.home-assistant.io/integrations/xiaomi_miio/)
- **Xiaomi BLE** — [NÃO CONFIRMADO] (não aparece na página lida)
- **Philips Hue** — bridge local V2 com push; luzes, sensores de movimento, remotes (evento `hue_event`), salas/zonas, scenes importadas (fonte: https://www.home-assistant.io/integrations/hue/)
- **Shelly** — Gen1/Gen2+/BLU TRV, local push (CoIoT/RPC), cover, light, switch, sensores, scripts, Bluetooth proxy, OTA, `shelly.click` (fonte: https://www.home-assistant.io/integrations/shelly/)
- **Tasmota** — MQTT discovery nativa (`SetOption19 0`), Tasmota 9.2+ (fonte: https://www.home-assistant.io/integrations/tasmota/)
- **Sonoff** — integração oficial/eWeLink: URLs `/integrations/sonoff/` e `/ewelink/` retornaram 404 [NÃO CONFIRMADO]; Sonoff via Zigbee/Tasmota é indireto
- **TP-Link Kasa/Tapo** — local polling (~5s), credenciais cloud para devices novos, câmeras Tapo, hubs, aspiradores, energia (fonte: https://www.home-assistant.io/integrations/tplink/)
- **Roku** — media player, remote, selects de app/canal, sensores (fonte: https://www.home-assistant.io/integrations/roku/)
- **LG webOS TV** — media player, Wake-on-LAN/trigger, notificações, comandos (fonte: https://www.home-assistant.io/integrations/webostv/)
- **Samsung Smart TV** — Tizen 2016+, WoL, remote, trigger `samsungtv.turn_on` (fonte: https://www.home-assistant.io/integrations/samsungtv/)
- **Sonos** — local push UPnP (porta 1400), alarmes, snapshot/restore, play queue, favoritos, library search (fonte: https://www.home-assistant.io/integrations/sonos/)
- **Spotify** — media_player + browse; exige Premium e credenciais de app Spotify (fonte: https://www.home-assistant.io/integrations/spotify/)
- **Exposição ao Google Assistant** — via Cloud (assinatura) ou manual (projeto Google, HomeGraph); `report_state`, PIN para seguros (fonte: https://www.home-assistant.io/integrations/google_assistant/)
- **Exposição à Alexa** — Smart Home Skill (via Cloud), Custom Skill, Flash Briefing, Emulated Hue (fonte: https://www.home-assistant.io/integrations/alexa/)
- **Alexa Devices** — controla Echo/Fire TV: sensores, media player, botões de rotina, DND, to-do, notify Speak/Announce (fonte: https://www.home-assistant.io/integrations/alexa_devices/)
- **Infrared / RF** — proxies IR via ESPHome e plataformas para LG, Samsung, Dyson, Gree etc. (2026.4+) (fonte: https://www.home-assistant.io/blog/2026/04/01/release-20264/)
- **Modbus** — nova abordagem UI por dispositivo (2026.9) (fonte: https://www.home-assistant.io/blog/2026/09/02/release-20269/)
- **KNX** — config UI de buttons, notify, dialog "Send telegram" (2026.8) (fonte: https://www.home-assistant.io/blog/2026/08/05/release-20268/)
- **Painel Settings > Connectivity** — agrupa Matter, Zigbee, Z-Wave, KNX, MQTT, Thread, Bluetooth, Serial, Infrared, RF, Insteon, Tags (2026.9) (fonte: https://www.home-assistant.io/blog/2026/09/02/release-20269/)

---

## 8. Sistema

- **Apps (ex-add-ons) e Supervisor** — apps rodam ao lado do core, só em HAOS; loja com repositórios da comunidade; ingress; WS `supervisor/api` (admin) e `hassio/update/*` (fonte: https://www.home-assistant.io/addons/ e https://raw.githubusercontent.com/home-assistant/core/dev/homeassistant/components/hassio/websocket_api.py)
- **Apps oficiais citados** — File editor, Samba share, Mosquitto, Z-Wave JS, Matter Server, OpenThread Border Router, Piper, Whisper, openWakeWord, Assist Satellite (fonte: https://www.home-assistant.io/addons/ e https://www.home-assistant.io/integrations/wyoming/); lista completa [NÃO CONFIRMADO]
- **Backups** — automáticos configuráveis na UI, sensores de último/próximo backup, ações `backup.create` e `create_automatic`, entidade event de status, agents de destino (Cloud, Dropbox 2026.7, OneDrive for Business, Cloudflare R2, rede) (fonte: https://www.home-assistant.io/integrations/backup/ e https://www.home-assistant.io/blog/2026/03/04/release-20263/)
- **WS de backup** — `backup/info`, `details`, `delete`, `generate`, `restore`, `config/info`, `config/update` (retenção copies/days, schedule), `agents/info`, `can_decrypt_on_download`, `subscribe_events` (fonte: https://raw.githubusercontent.com/home-assistant/core/dev/homeassistant/components/backup/websocket.py)
- **Recorder** — SQLite padrão (`home-assistant_v2.db`), MariaDB/MySQL/PostgreSQL via `db_url`, `purge_keep_days` 10, `commit_interval` 5s, include/exclude; ações purge, purge_entities, enable, disable, get_statistics (fonte: https://www.home-assistant.io/integrations/recorder/)
- **History** — fontes por floor/area/device/entity/label, CSV, >10 dias vem de estatísticas; REST e WS `history/stream` (fonte: https://www.home-assistant.io/integrations/history/)
- **Activity (logbook)** — filtros por area/device/entity/label/tipo/integração, CSV, `logbook.log`, WS `logbook/event_stream`; painel de fontes compartilhado (2026.9) (fonte: https://www.home-assistant.io/integrations/logbook/)
- **Long-term statistics** — short-term a cada 5 min (purgadas com estados), long-term por hora (nunca purgadas); `measurement` guarda mean/min/max, `total*` guarda state/sum/last_reset (fonte: https://contributors.home-assistant.io/data/reference/statistics/)
- **Repairs** — lista de problemas em Settings > System > Repairs; alguns com fix flow (fonte: https://www.home-assistant.io/integrations/repairs/)
- **System health** — info de arquitetura, OS, install type, versões (fonte: https://www.home-assistant.io/integrations/system_health/)
- **Updates** — entidades `update` agrupadas, botão "Update all" (2026.7), firmware EEPROM do Raspberry Pi, indicação de reboot (fonte: https://www.home-assistant.io/blog/2026/07/01/release-20267/)
- **Usuários e auth** — login por usuário/senha, MFA por conta, refresh token por dispositivo (remoção após 90 dias sem uso), long-lived tokens, IP bans (parcial). Papéis admin/não-admin, trusted networks, provider de linha de comando [NÃO CONFIRMADO] na página lida (fonte: https://www.home-assistant.io/docs/authentication/)
- **Labs** — features experimentais em Settings > System > Labs (fonte: https://www.home-assistant.io/blog/2026/05/06/release-20265/)
- **Web server na UI** — porta, rede, trusted proxies; revert em 5 min se não confirmado (2026.8) (fonte: https://www.home-assistant.io/blog/2026/08/05/release-20268/)
- **Webhooks** — `/api/webhook/<id>` (POST/PUT/HEAD/GET), `local_only` por padrão (fonte: https://www.home-assistant.io/integrations/webhook/)
- **Serial/Bluetooth/Network mounts** — painel Serial, mounts com barra de uso (2026.9) (fonte: https://www.home-assistant.io/blog/2026/09/02/release-20269/)
- **Python 3.14 e imagens zstd** — Docker 23+ / containerd 1.5+ (2026.3) (fonte: https://www.home-assistant.io/blog/2026/03/04/release-20263/)
- **HACS** — loja da comunidade: integrations, dashboard plugins, themes, AppDaemon apps, Python scripts, templates. A página de docs afirma que a partir da **2026.11 o HACS vira built-in com o nome "Marketplace"**; as notas de release da 2026.11 ainda não existem (404), então isso é [NÃO CONFIRMADO] além dessa frase (fonte: https://www.hacs.xyz/docs/use/)
- **Config entries** — HTTP `/api/config/config_entries/{entry,flow,flow_handlers,options/flow,subentries/flow}` e WS `config_entries/get|subscribe|update|disable|ignore_flow|flow/progress|subentries/*` (fonte: https://raw.githubusercontent.com/home-assistant/core/dev/homeassistant/components/config/config_entries.py)
- **Registries via WS** — `config/area_registry/*`, `config/floor_registry/*`, `config/label_registry/*`, `config/device_registry/*` (list/update/remove), `config/entity_registry/*` (fonte: URLs raw em `homeassistant/components/config/`)
- **Frontend via WS** — `get_panels`, `frontend/get_themes`, `frontend/get_translations`, `frontend/get_icons`, `frontend/get_version`, `frontend/update_panel` (fonte: https://raw.githubusercontent.com/home-assistant/core/dev/homeassistant/components/frontend/__init__.py)
- **Dashboards via WS** — `lovelace/info`, `lovelace/config`, `lovelace/config/save`, `lovelace/config/delete`, `lovelace/resources`; `lovelace/dashboards/list|create|update|delete` plausíveis, nome exato [NÃO CONFIRMADO] (fonte: https://raw.githubusercontent.com/home-assistant/core/dev/homeassistant/components/lovelace/websocket.py)
- **Home Assistant Cloud / Link** — acesso remoto, integração com Google/Alexa, STT/TTS em nuvem; renomeado "Link" em 2026-12-02 (fonte: https://www.home-assistant.io/cloud/)

---

## 9. APIs que o app vai consumir

### 9.1 WebSocket API (`/api/websocket`)

Fonte principal: https://contributors.home-assistant.io/core/internals/websocket-api/ e https://raw.githubusercontent.com/home-assistant/core/dev/homeassistant/components/websocket_api/commands.py

Handshake de autenticação:

```json
S->C {"type": "auth_required", "ha_version": "2026.10.0"}
C->S {"type": "auth", "access_token": "ABCDEFGH"}
S->C {"type": "auth_ok", "ha_version": "2026.10.0"}
// token inválido:
S->C {"type": "auth_invalid", "message": "..."}   // e o servidor desconecta
```

Regras do protocolo (verificadas):
- Endpoint: `/api/websocket` (`ws://host:8123/api/websocket`, ou `wss://` atrás de TLS).
- Toda mensagem do cliente na fase de comandos tem `id` numérico crescente; o servidor repete o mesmo `id` em resultados, pongs e eventos de subscription. Reuso de id gera erro `id_reuse`.
- Resultado: `{"id": 6, "type": "result", "success": true, "result": null}`; erro: `{"id": 12, "type": "result", "success": false, "error": {"code": "invalid_format", "message": "..."}}`.
- Códigos de erro: `invalid_format`, `not_found`, `not_allowed`, `not_supported`, `unauthorized`, `unknown_command`, `id_reuse`, `home_assistant_error`, `service_validation_error`, `template_error`, `timeout`, `unknown_error`. Erros de `HomeAssistantError` podem trazer `translation_domain`, `translation_key`, `translation_placeholders`.
- Feature negotiation: logo após autenticar, `{"id":1,"type":"supported_features","features":{"coalesce_messages":1}}`; com isso o servidor pode agrupar mensagens em uma lista JSON.
- Ping: `{"id":19,"type":"ping"}` responde `{"id":19,"type":"pong"}`.
- Token: Long-Lived Access Token (válido por 10 anos, criado no perfil > Security) ou access token OAuth (expira em `expires_in`, exemplo 1800 s) renovado com refresh token.

Comandos principais (todos verificados em `commands.py` salvo indicação):

- `get_states` — todos os estados legíveis pelo usuário
- `get_config` — config do core (unidades, localização, versão, componentes)
- `get_services` — descrição de todas as actions (schema para montar UI)
- `subscribe_events` — `{"id":18,"type":"subscribe_events","event_type":"state_changed"}`; sem `event_type` = todos (a maioria exige admin); eventos chegam como `{"id":18,"type":"event","event":{event_type,data,origin,time_fired,context}}`
- `unsubscribe_events` — `{"id":19,"type":"unsubscribe_events","subscription":18}`
- `subscribe_entities` — stream compacto de estados, com filtro opcional por ids/include/exclude. Payload inicial `{"a": {entity_id: estado_comprimido}}`; atualizações: `{"a":{...}}` (adicionadas), `{"c":{entity_id:{"+":{"s":state,"lc":..,"lu":..,"c":ctx,"a":{attrs alterados}},"-":{"a":[attrs removidos]}}}}` (alteradas), `{"r":[entity_ids]}` (removidas). Significado das chaves lido do código de `messages.py`; o formato exato dos literais não aparece no trecho (fonte: https://raw.githubusercontent.com/home-assistant/core/dev/homeassistant/components/websocket_api/messages.py)
- `call_service` — `{"id":24,"type":"call_service","domain":"light","service":"turn_on","service_data":{"brightness":255},"target":{"entity_id":"light.kitchen"}}`; `target` aceita `entity_id`, `device_id`, `area_id`, `floor_id`, `label_id`; `"return_response": true` devolve `response` no result junto de `context`
- `fire_event` (admin) — `{"type":"fire_event","event_type":"...","event_data":{}}`
- `render_template` — renderiza Jinja, opcionalmente acompanhando mudanças de entidades (formato de request/response não detalhado na doc; só confirmado como comando em `commands.py`)
- `subscribe_trigger` (admin) — `{"type":"subscribe_trigger","trigger":{"trigger":"state","entity_id":"binary_sensor.motion","to":"on"}}`, mesmo formato dos triggers de automação
- `test_condition` (admin), `subscribe_condition`, `execute_script` (admin), `validate_config` — avaliar/validar partes de automação sem criá-la
- `extract_from_target` — resolve target em entidades/devices/áreas/andares/labels referenciados e `missing_*`; `expand_group` default false
- `get_triggers_for_target`, `get_conditions_for_target`, `get_services_for_target` — o que se aplica a um target
- `entity/source`, `manifest/get|list`, `integration/setup_info`, `integration/descriptions` (admin), `subscribe_bootstrap_integrations`, `subscribe_system_state` (admin), `slugify`, `trigger_platforms/subscribe`, `condition_platforms/subscribe`
- Auth: `auth/current_user`, `auth/long_lived_access_token` (`client_name`, `lifespan` em dias, `client_icon`), `auth/refresh_tokens`, `auth/delete_refresh_token`, `auth/sign_path` (`path`, `expires` default 30 s), `auth/delete_all_refresh_tokens`, `auth/refresh_token_set_expiry` (fonte: https://raw.githubusercontent.com/home-assistant/core/dev/homeassistant/components/auth/__init__.py)
- Registries: `config/{entity,device,area,floor,label}_registry/list` (+ create/update/delete/reorder conforme registry); `config/entity_registry/list_for_display` (versão compacta)
- Histórico: `history/history_during_period` e `history/stream` (params: `start_time`, `end_time`, `entity_ids`, `include_start_time_state`, `significant_changes_only`, `minimal_response`, `no_attributes`); `logbook/get_events` e `logbook/event_stream`
- Estatísticas: `recorder/statistics_during_period` (`statistic_ids`, `period` 5minute/hour/day/week/month/year, `types`), `recorder/statistic_during_period`, `recorder/list_statistic_ids`, `recorder/get_statistics_metadata`, `recorder/validate_statistics` (fonte: https://raw.githubusercontent.com/home-assistant/core/dev/homeassistant/components/recorder/websocket_api.py)
- Energia: `energy/get_prefs`, `energy/info`, `energy/validate`, `energy/solar_forecast`, `energy/fossil_energy_consumption`, `energy/save_prefs` (admin)
- Dashboards: `lovelace/config` (params `url_path`, `force`), `lovelace/config/save` (admin), `lovelace/resources`
- Câmera: `camera/stream` (`format` default `hls`, devolve URL), `camera/capabilities`, `camera/get_prefs`, `camera/update_prefs` (admin), `camera/webrtc/get_client_config`, `camera/webrtc/offer` (SDP; eventos `session`, `answer`, `candidate` na mesma subscription), `camera/webrtc/candidate` (fonte: https://raw.githubusercontent.com/home-assistant/core/dev/homeassistant/components/camera/webrtc.py)
- Mídia: `media_player/browse_media`, `media_player/search_media` (fonte: https://raw.githubusercontent.com/home-assistant/core/dev/homeassistant/components/media_player/__init__.py)
- Previsão: `weather/subscribe_forecast` (`entity_id`, `forecast_type`)
- Calendário: `calendar/event/create|update|delete|subscribe`
- To-do: `todo/item/list|subscribe|move`
- Busca relacional: `search/related` (`item_type`, `item_id`)
- Assist: `assist_pipeline/run`, `assist_pipeline/language/list` (+ admin debug)
- Config entries: `config_entries/get|subscribe|...`
- Backup: ver seção 8
- Frontend: `get_panels`, `frontend/get_themes`, `frontend/get_translations`, `frontend/get_icons`
- Observação: a doc não informa em qual versão do HA cada comando surgiu (só `ha_version` nas mensagens de auth).

Padrão de uso sugerido pela própria API (inferência, não texto literal da doc): após `auth_ok`, enviar `supported_features`, depois `subscribe_entities` para estado em tempo real, `get_services` e registries (`config/*_registry/list`) para montar UI, e `call_service` para comandos.

### 9.2 REST API (`/api/...`, header `Authorization: Bearer TOKEN`)

Fonte: https://contributors.home-assistant.io/core/internals/rest-api/

- `GET /api/` — health simples (barra final obrigatória)
- `GET /api/config` — config do core
- `GET /api/core/state` — estado do core e migração de DB (health check rápido)
- `GET /api/components` — componentes carregados
- `POST /api/config/core/check_config` (admin) — valida configuration.yaml
- `GET /api/states` e `GET /api/states/<entity_id>` — estados
- `POST /api/states/<entity_id>` (admin) — cria/atualiza estado (não controla o device); `force_update`
- `DELETE /api/states/<entity_id>` (admin)
- `GET /api/services` — actions por domínio
- `POST /api/services/<domain>/<service>` — chama action e espera concluir; `?return_response` devolve resposta (400 se action não suporta)
- `GET /api/events` e `POST /api/events/<event_type>` (admin)
- `GET /api/stream` (admin) — SSE; `?restrict=` filtra tipos; a doc recomenda WebSocket para código novo
- `POST /api/template` (admin) — renderiza template
- `GET /api/history/period/<timestamp>` — params `filter_entity_id` (obrigatório), `end_time`, `minimal_response`, `no_attributes`, `significant_changes_only=0`, `skip_initial_state`
- `GET /api/logbook/<timestamp>` — params `entity`, `end_time`, `period`, `context_id`
- `GET /api/error_log` (admin) — log em texto
- `GET /api/camera_proxy/<entity_id>` — snapshot (`width`/`height` best-effort); `GET /api/camera_proxy_stream/<entity_id>` — MJPEG (`interval`); autorização por Bearer ou `token` de acesso da câmera
- `GET /api/calendars`, `GET /api/calendars/<entity_id>?start=&end=`
- `POST /api/intent/handle`, `POST /api/conversation/process`
- `GET /api/media_player_proxy/<entity_id>` — artwork com `token` da entidade
- Códigos: 200, 201, 400, 401, 404, 405, 500, 503 (HA desligando)
- Porta padrão 8123 (80 com Supervisor); JSON in/out.

### 9.3 Autenticação para apps (OAuth2 estilo IndieAuth)

Fonte: https://contributors.home-assistant.io/core/internals/auth-api/

- `client_id` = URL do site do app; `redirect_uri` precisa ter o mesmo host, ou ser declarado via `<link rel="redirect_uri">` ou documento JSON com `redirect_uris` (esquemas custom como `hass://auth` precisam disso). Isso é relevante para um app Tauri: sem site próprio no `client_id`, o fluxo OAuth precisa de um `client_id` https hospedado, ou usar Long-Lived Access Token.
- `GET /auth/authorize` com `client_id`, `redirect_uri`, `state`, PKCE `code_challenge` (só `S256`)
- `POST /auth/token` (form-urlencoded): `authorization_code` (+ `code_verifier`) ou `refresh_token`; retorna `access_token`, `expires_in`, `refresh_token`, `token_type`, `ha_auth_provider`
- `POST /auth/revoke` com `token`
- Refresh token expira após 90 dias sem uso
- Long-lived token: criado no perfil ou via WS `auth/long_lived_access_token` (10 anos, não é guardado pelo HA)
- Endpoints `/auth/login_flow` e `/auth/providers`: [NÃO CONFIRMADO] (não documentados nas páginas lidas)

---

## 10. Ecossistema relacionado

- **ESPHome** — firmware para ESP32 e outros via YAML/Device Builder, OTA por Wi-Fi, centenas de componentes, local, integra por API nativa; também Bluetooth proxy e voz (fonte: https://esphome.io/ e https://www.home-assistant.io/integrations/esphome/)
- **Frigate (NVR)** — detecção de objetos local, zonas, face recognition, license plate recognition, busca semântica, GenAI, go2rtc, re-stream RTSP, retenção por objeto detectado; integração HA via HACS + MQTT cria camera, image, sensor, switch, binary_sensor e Media Browser (fonte: https://docs.frigate.video/ e https://docs.frigate.video/integrations/home-assistant/)
- **Node-RED** — low-code event-driven em Node.js; integração `node-red-contrib-home-assistant-websocket` (requer Node 20+, Node-RED 3.1.1+, HA 2024.3+); lista de nodes e método de conexão [NÃO CONFIRMADO] (fonte: https://nodered.org/ e https://github.com/zachowj/node-red-contrib-home-assistant-websocket)
- **Music Assistant** — biblioteca unificada (Spotify, TIDAL, Qobuz, Apple Music, arquivos locais, rádio, podcasts, audiobooks); players Sonos, AirPlay, Cast, HEOS, Bluesound, Squeezelite, DLNA; fila no servidor; sync multi-room; anúncios que pausam e retomam (fonte: https://music-assistant.io/)
- **Zigbee2MQTT** — bridge para MQTT, frontend web, OTA, grupos/cenas, binding, integração HA por MQTT discovery (itens listados na navegação; detalhes [NÃO CONFIRMADO]) (fonte: https://www.zigbee2mqtt.io/guide/getting-started/)
- **go2rtc** — entradas RTSP/RTMP/ONVIF/WebRTC/MJPEG/HomeKit/FFmpeg; saídas WebRTC/RTSP/HLS/MSE/MJPEG; H.264/H.265/AAC/Opus; áudio bidirecional; API HTTP+WS; embutido no HA desde 2024.11 como proxy WebRTC (`default_config`) (fonte: https://github.com/AlexxIT/go2rtc e https://www.home-assistant.io/integrations/go2rtc/)
- **Mushroom cards (HACS)** — cards Alarm, Chips, Climate, Cover, Entity, Fan, Humidifier, Light, Lock, Media, Number, Person, Select, Template, Title, Update, Vacuum + template badge; editor visual; sem dependências (fonte: https://github.com/piitaya/lovelace-mushroom)
- **button-card (HACS)** — templates JavaScript, estilos por estado, tap/hold/double-click (none, toggle, more-info, navigate, url, assist, call-service), confirmação, PIN, CSS custom (fonte: https://github.com/custom-cards/button-card)
- **mini-graph-card (HACS)** — gráfico linha/barra de sensor e binary_sensor; várias entidades, eixo Y secundário, `hours_to_show`, `points_per_hour`, `group_by`, funções avg/median/min/max/sum/delta, `color_thresholds`, `state_map` (fonte: https://github.com/kalkih/mini-graph-card)
- **apexcharts-card (HACS)** — gráficos line/scatter/pie/donut/radialBar com séries line/area/column; `data_generator` em JS; `statistics` (long-term); `graph_span`/`offset`/`group_by` (fonte: https://github.com/RomRider/apexcharts-card)
- **Catálogos de custom cards** — github.com/custom-cards e home-assistant-cards.bessarabov.com (fonte: https://www.home-assistant.io/dashboards/)
- **Works with Home Assistant** — programa de certificação; parceiros recentes LEDVANCE e Everything Smart Home (fonte: https://www.home-assistant.io/blog/)

---

## 11. Lacunas de confiança (não confirmado)

1. Existência e o escopo do HACS "Marketplace" embutido na 2026.11: só uma frase em hacs.xyz; as release notes da 2026.11 não existem ainda (404) e o blog não menciona.
2. Webhook API do `mobile_app` (tipos de request, registro, push): a página de visão geral não lista os request types; pouco verificado para um app que queira se registrar como companion.
3. Detalhes de automação: lista completa de `choose`/`repeat`/`wait_*`/selectors/funções de template, import de blueprint e opções de custo da Energy (preço estático, entidade de preço, custo total) não foram lidos (páginas 404 ou sem o detalhe).
4. Nomes exatos de comandos WS de `lovelace/dashboards/*`, request/response de `render_template`, `test_condition`, `execute_script` e os literais das chaves de `subscribe_entities` (só inferidos do código de `messages.py`); e a doc não indica versão de introdução de cada comando.
5. Integrações de protocolo específicas: Sonoff/eWeLink (404), Xiaomi BLE, DLNA DMS, intents built-in (404), nodes do Node-RED e recursos de Zigbee2MQTT além da navegação do site, widgets iOS, Device Controls/Shortcuts Android, Siri Shortcuts.
