// Regenerates .github/assets/screenshots from the real UI in demo mode (no native backend).
// Zero dependencies: drives a headless Chromium/Edge over CDP. Set CHROME_PATH to override discovery.
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const OUT = ".github/assets/screenshots";
const PORT = 4175;
const CDP = 9335;
const CANDIDATES = [
  process.env.CHROME_PATH,
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
];
const chrome = CANDIDATES.find((p) => p && existsSync(p));
if (!chrome) throw new Error("No Chromium-based browser found; set CHROME_PATH");

// Frozen clock so the sky hero and greeting look the same on every run.
const FREEZE = `(() => {
  const Real = Date;
  const at = () => new Real(2026, 10, 1, 17, 40).getTime();
  globalThis.Date = class extends Real {
    constructor(...a) { a.length ? super(...a) : super(at()); }
    static now() { return at(); }
  };
})();`;

const SHOTS = [
  { name: "home", nav: null, w: 1280, h: 800 },
  { name: "network", nav: "Rede", w: 1280, h: 800, scan: true },
  { name: "automations", nav: "Automações", w: 1280, h: 800 },
  { name: "energy", nav: "Energia", w: 1280, h: 800 },
  { name: "roadmap", nav: "Roadmap", w: 1280, h: 800 },
  { name: "mobile", nav: null, w: 390, h: 844, mobile: true },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function waitFor(url: string, tries = 60) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return r;
    } catch {}
    await sleep(500);
  }
  throw new Error(`timeout waiting for ${url}`);
}

const preview = Bun.spawn(
  [
    process.execPath,
    "node_modules/vite/bin/vite.js",
    "preview",
    "--port",
    String(PORT),
    "--strictPort",
  ],
  {
    stdout: "ignore",
    stderr: "ignore",
  },
);
const browser = Bun.spawn(
  [
    chrome,
    "--headless=new",
    `--remote-debugging-port=${CDP}`,
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    `--user-data-dir=${mkdtempSync(join(tmpdir(), "casa-shots-"))}`,
    "about:blank",
  ],
  { stdout: "ignore", stderr: "ignore" },
);

const stop = () => {
  preview.kill();
  browser.kill();
};

try {
  await waitFor(`http://localhost:${PORT}/`);
  const targets = await (await waitFor(`http://127.0.0.1:${CDP}/json`)).json();
  const page = targets.find((t: { type: string }) => t.type === "page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => {
    ws.onopen = r;
  });

  let seq = 0;
  const waiting = new Map<number, (v: { result?: unknown }) => void>();
  ws.onmessage = (m) => {
    const d = JSON.parse(String(m.data));
    waiting.get(d.id)?.(d);
  };
  const send = (method: string, params: object = {}) =>
    new Promise<{ result?: { result?: { value?: unknown }; data?: string } }>((resolve) => {
      const id = ++seq;
      waiting.set(id, resolve as never);
      ws.send(JSON.stringify({ id, method, params }));
    });
  const run = (expression: string) =>
    send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });

  await send("Page.enable");
  await send("Page.addScriptToEvaluateOnNewDocument", { source: FREEZE });
  mkdirSync(OUT, { recursive: true });

  for (const s of SHOTS) {
    await send("Emulation.setDeviceMetricsOverride", {
      width: s.w,
      height: s.h,
      deviceScaleFactor: s.mobile ? 2 : 1,
      mobile: Boolean(s.mobile),
    });
    await send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-motion", value: "no-preference" }],
    });
    await send("Page.navigate", { url: `http://localhost:${PORT}/` });
    await sleep(2200);
    if (s.nav) {
      await run(
        `[...document.querySelectorAll('nav button')].find(b => b.textContent.trim() === ${JSON.stringify(s.nav)})?.click()`,
      );
      await sleep(1800);
      if (s.scan) {
        await run(
          "[...document.querySelectorAll('button')].find(b => b.textContent.includes('Varrer rede'))?.click()",
        );
        await sleep(4000);
      }
      await run("document.activeElement?.blur()");
    }
    const shot = await send("Page.captureScreenshot", { format: "webp", quality: 92 });
    const data = shot.result?.data;
    if (!data) throw new Error(`no image for ${s.name}`);
    writeFileSync(`${OUT}/${s.name}.webp`, Buffer.from(data, "base64"));
    console.log("wrote", `${OUT}/${s.name}.webp`);
  }
  ws.close();
} finally {
  stop();
}
process.exit(0);
