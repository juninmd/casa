// Regenerates src/data/oui-iot.json from the public IEEE OUI CSV, keeping only vendors
// that matter for home automation so the bundle stays small.
// Usage: bun scripts/gen-oui.ts <path-to-oui.csv>
export {};

const KEEP =
  /tp-link|tuya|amazon|intelbras|samsung|lg innotek|lg electronics|espressif|xiaomi|allterco|itead|signify|philips lighting|google|sonos|hikvision|dahua|ubiquiti|raspberry|roku|ezviz|wyze|belkin|lifx|yeelink|broadlink|sjit|samjin|hangzhou huacheng|nest labs|ring llc|aqara|lumi united|sengled|ikea|mikrotik/i;

const src = process.argv[2];
if (!src) throw new Error("usage: bun scripts/gen-oui.ts <oui.csv>");

const lines = (await Bun.file(src).text()).split(/\r?\n/).slice(1);
const out: Record<string, string> = {};
for (const line of lines) {
  const m = line.match(/^[^,]*,([0-9A-F]{6}),("([^"]*)"|[^,]*),/);
  const name = m?.[3] ?? m?.[2];
  if (m?.[1] && name && KEEP.test(name)) out[m[1]] = name.replace(/\s+/g, " ").trim();
}
await Bun.write("src/data/oui-iot.json", JSON.stringify(out));
console.log(`kept ${Object.keys(out).length} of ${lines.length} OUIs`);
