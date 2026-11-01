import type { Host } from "../core/types";

// Synthetic /24 snapshot: example addresses and placeholder MAC suffixes (vendor OUI only).
// Used by the browser/demo build, where there is no native `scan_lan` command.
export const LAN_FIXTURE: Host[] = [
  { ip: "192.168.1.1", mac: "A8-29-48-00-00-01", ports: [21, 22, 23, 80, 443, 1900] },
  { ip: "192.168.1.2", mac: "E0-85-4D-00-00-02", ports: [] },
  { ip: "192.168.1.3", mac: "A8-31-62-00-00-03", ports: [] },
  { ip: "192.168.1.4", mac: "7A-D1-5C-00-00-04", ports: [] },
  { ip: "192.168.1.5", mac: "B8-B4-09-00-00-05", ports: [] },
  { ip: "192.168.1.6", mac: "A4-57-A0-00-00-06", ports: [] },
  { ip: "192.168.1.7", mac: "3C-64-CF-00-00-07", ports: [443, 8443] },
  { ip: "192.168.1.8", mac: "98-03-8E-00-00-08", ports: [443, 554] },
  { ip: "192.168.1.11", mac: "20-E1-5D-00-00-11", ports: [80], server: "SHIP 2.0" },
  { ip: "192.168.1.12", mac: "20-E1-5D-00-00-12", ports: [80], server: "SHIP 2.0" },
  { ip: "192.168.1.13", mac: "28-6B-B4-00-00-13", ports: [] },
  { ip: "192.168.1.14", mac: "98-CC-F3-00-00-14", ports: [8888, 55443] },
  { ip: "192.168.1.15", mac: "3C-64-CF-00-00-15", ports: [443] },
  { ip: "192.168.1.16", mac: "20-E1-5D-00-00-16", ports: [80], server: "SHIP 2.0" },
  { ip: "192.168.1.17", mac: "98-E5-5B-00-00-17", ports: [80, 554] },
  { ip: "192.168.1.18", mac: "48-78-5E-00-00-18", ports: [8888, 55443] },
  { ip: "192.168.1.19", mac: "20-E1-5D-00-00-19", ports: [80], server: "SHIP 2.0" },
  { ip: "192.168.1.21", mac: "70-89-76-00-00-21", ports: [6668] },
  { ip: "192.168.1.22", mac: "10-BF-67-00-00-22", ports: [8009, 55443] },
];
