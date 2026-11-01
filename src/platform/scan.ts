import { invoke, isTauri } from "@tauri-apps/api/core";
import type { Host } from "../core/types";
import { LAN_FIXTURE } from "../data/lan-fixture";

export type ScanMode = "native" | "demo";

/** Matches the Rust-side guard: only RFC1918 /24 prefixes ("192.168.1"). */
export function isPrivatePrefix(p: string): boolean {
  const m = p.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const [a, b, c] = m.slice(1).map(Number) as [number, number, number];
  if ([a, b, c].some((n) => n > 255)) return false;
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

export async function scanLan(prefix: string): Promise<{ hosts: Host[]; mode: ScanMode }> {
  if (!isPrivatePrefix(prefix))
    throw new Error("Prefixo inválido: use uma rede privada /24, ex.: 192.168.1");
  if (!isTauri()) return { hosts: LAN_FIXTURE, mode: "demo" };
  return { hosts: await invoke<Host[]>("scan_lan", { prefix }), mode: "native" };
}
