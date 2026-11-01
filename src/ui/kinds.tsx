import {
  DeviceMobile,
  Lightbulb,
  LockKey,
  Network,
  Plug,
  Question,
  SpeakerHigh,
  Television,
  Thermometer,
  VideoCamera,
} from "@phosphor-icons/react";
import type { ComponentType } from "react";
import type { Kind } from "../core/types";

export type IconProps = {
  size?: number;
  weight?: "duotone" | "fill" | "regular";
  className?: string;
};
type Icon = ComponentType<IconProps & { "aria-hidden"?: boolean }>;

export const KIND_ICON: Record<Kind, Icon> = {
  light: Lightbulb,
  switch: Plug,
  camera: VideoCamera,
  speaker: SpeakerHigh,
  media: Television,
  sensor: Thermometer,
  lock: LockKey,
  router: Network,
  phone: DeviceMobile,
  unknown: Question,
};

/** Each kind owns a hue, so a glance at the grid tells lamps from cameras from locks. */
export const KIND_COLOR: Record<Kind, string> = {
  light: "#ffb547",
  switch: "#3de0c3",
  camera: "#b58cff",
  speaker: "#ff7fb0",
  media: "#6f9bff",
  sensor: "#5ad7f5",
  lock: "#7ee787",
  router: "#6f9bff",
  phone: "#a6b0c4",
  unknown: "#a6b0c4",
};

export const KIND_LABEL: Record<Kind, string> = {
  light: "Luz",
  switch: "Tomada",
  camera: "Câmera",
  speaker: "Som",
  media: "Mídia",
  sensor: "Sensor",
  lock: "Fechadura",
  router: "Roteador",
  phone: "Celular",
  unknown: "Outro",
};
