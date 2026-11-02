import type { Rule } from "../core/automation";
import type { Entity } from "../core/types";

export const ROOMS = ["Sala", "Quarto", "Cozinha", "Varanda", "Escritório"] as const;

const e = (
  id: string,
  name: string,
  kind: Entity["kind"],
  room: string,
  on: boolean,
  extra: Partial<Entity> = {},
): Entity => ({ id, name, kind, room, on, online: true, source: "demo", ...extra });

export const DEMO_ENTITIES: Entity[] = [
  e("sala-luz", "Luz da sala", "light", "Sala", true),
  e("sala-tv", "TV", "media", "Sala", false),
  e("sala-echo", "Echo", "speaker", "Sala", true),
  e("quarto-luz", "Luz do quarto", "light", "Quarto", false),
  e("quarto-abajur", "Abajur (tomada)", "switch", "Quarto", false),
  e("cozinha-luz", "Luz da cozinha", "light", "Cozinha", true),
  e("cozinha-temp", "Temperatura", "sensor", "Cozinha", true, { value: 27.4, unit: "°C" }),
  e("varanda-cam", "Câmera da varanda", "camera", "Varanda", true),
  e("varanda-luz", "Luz da varanda", "light", "Varanda", false),
  e("porta", "Porta de entrada", "lock", "Sala", true),
  e("office-pc", "Tomada do PC", "switch", "Escritório", true),
  e("office-luz", "Luz do escritório", "light", "Escritório", true),
];

export const DEMO_RULES: Rule[] = [
  {
    id: "cinema",
    name: "Cinema: TV liga → apaga luz da sala",
    enabled: true,
    trigger: { type: "state", entity: "sala-tv", to: true },
    conditions: [],
    actions: [{ entity: "sala-luz", set: false }],
  },
  {
    id: "boa-noite",
    name: "22:00 → apaga cozinha e escritório",
    enabled: true,
    trigger: { type: "time", at: "22:00" },
    conditions: [],
    actions: [
      { entity: "cozinha-luz", set: false },
      { entity: "office-luz", set: false },
    ],
  },
  {
    id: "seguranca",
    name: "Porta destrancada à noite → acende varanda",
    enabled: false,
    trigger: { type: "state", entity: "porta", to: false },
    conditions: [{ entity: "sala-luz", is: false }],
    actions: [{ entity: "varanda-luz", set: true }],
  },
];

export interface Scene {
  id: string;
  name: string;
  set: Record<string, boolean>;
}

export const SCENES: Scene[] = [
  {
    id: "dormir",
    name: "Dormir",
    set: { "sala-luz": false, "cozinha-luz": false, "quarto-luz": false, porta: true },
  },
  { id: "cinema", name: "Cinema", set: { "sala-luz": false, "sala-tv": true } },
  {
    id: "sair",
    name: "Sair",
    set: { "sala-luz": false, "cozinha-luz": false, "office-luz": false, porta: true },
  },
];
