import oui from "../data/oui-iot.json";
import type { Classification, Host } from "./types";

const OUI = oui as Record<string, string>;

export function normalizeMac(mac: string): string {
  return mac.replace(/[^0-9a-f]/gi, "").toUpperCase();
}

export function vendorOf(mac: string | null): string {
  if (!mac) return "";
  return OUI[normalizeMac(mac).slice(0, 6)] ?? "";
}

/** Bit 1 of the first octet = locally administered (phones randomize their MAC per network). */
export function isPrivateMac(mac: string | null): boolean {
  if (!mac) return false;
  const first = Number.parseInt(normalizeMac(mac).slice(0, 2), 16);
  return Number.isFinite(first) && (first & 0b10) !== 0;
}

const has = (v: string, re: RegExp) => re.test(v);

/**
 * Heuristic fingerprint from MAC vendor + open ports + HTTP Server header.
 * It never authenticates to anything; every result is a hypothesis with its reasons.
 */
export function classify(host: Host): Classification {
  const vendor = vendorOf(host.mac);
  const reasons: string[] = [];
  const ports = new Set(host.ports);
  const base = { vendor, reasons };
  const done = (c: Omit<Classification, "vendor" | "reasons">): Classification => ({
    ...c,
    ...base,
  });

  if (vendor) reasons.push(`OUI: ${vendor}`);
  if (host.ports.length) reasons.push(`portas abertas: ${host.ports.join(", ")}`);

  if (isPrivateMac(host.mac) && !vendor) {
    reasons.push("MAC aleatório (privacidade do Wi-Fi)");
    return done({
      kind: "phone",
      label: "Celular/notebook",
      integration: null,
      confidence: "média",
    });
  }
  if (host.ip.endsWith(".1") && (ports.has(80) || ports.has(443) || ports.has(1900))) {
    reasons.push("gateway da sub-rede");
    return done({ kind: "router", label: "Roteador/ONT", integration: "upnp", confidence: "alta" });
  }
  if (has(vendor, /tuya/i) || ports.has(6668)) {
    if (ports.has(6668)) reasons.push("6668 = protocolo local Tuya");
    return done({
      kind: "switch",
      label: "Dispositivo Tuya",
      integration: "tuya-local (precisa da local key)",
      confidence: has(vendor, /tuya/i) && ports.has(6668) ? "alta" : "média",
    });
  }
  if (host.server && /SHIP 2\.0/i.test(host.server)) {
    reasons.push("Server: SHIP 2.0 (assinatura Tapo/Kasa)");
    return done({
      kind: "switch",
      label: "Tomada/lâmpada TP-Link",
      integration: "tapo (KLAP, conta TP-Link)",
      confidence: has(vendor, /tp-link/i) ? "alta" : "média",
    });
  }
  if (ports.has(554)) {
    reasons.push("554 = RTSP (stream de vídeo)");
    return done({
      kind: "camera",
      label: has(vendor, /intelbras/i) ? "Câmera Intelbras" : "Câmera IP",
      integration: "rtsp/onvif",
      confidence: vendor ? "alta" : "média",
    });
  }
  if (has(vendor, /amazon/i)) {
    if (ports.has(55443) || ports.has(8888)) {
      return done({
        kind: "speaker",
        label: "Echo / Alexa",
        integration: "alexa (nuvem)",
        confidence: "média",
      });
    }
    return done({
      kind: "media",
      label: "Dispositivo Amazon",
      integration: null,
      confidence: "baixa",
    });
  }
  if (has(vendor, /espressif/i)) {
    return done({
      kind: "sensor",
      label: "ESP32/ESP8266",
      integration: "esphome / mqtt",
      confidence: "média",
    });
  }
  if (has(vendor, /tp-link/i)) {
    return done({
      kind: "unknown",
      label: "Dispositivo TP-Link",
      integration: "tapo / omada",
      confidence: "baixa",
    });
  }
  if (has(vendor, /samsung|lg /i)) {
    return done({
      kind: "media",
      label: "TV/eletro (Samsung/LG)",
      integration: "smartthings / webos",
      confidence: "baixa",
    });
  }
  return done({ kind: "unknown", label: "Desconhecido", integration: null, confidence: "baixa" });
}
