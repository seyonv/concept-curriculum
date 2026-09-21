#!/usr/bin/env node
// Verification gate for a concept-curriculum card set.
// Usage: node verify.mjs <dir> [--shots <outdir>] [--only a.html,b.html] [--allow-missing]
// --allow-missing: links to cards not written yet (and index gaps) are not failures; use while writers run in parallel.
// Launches its own headless Chrome with a throwaway profile, so parallel runs never share a browser.
import { readdirSync, readFileSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";

const args = process.argv.slice(2);
const dir = resolve(args[0] || ".");
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const shots = opt("--shots");
const only = opt("--only")?.split(",");
const allowMissing = args.includes("--allow-missing");

const CHROME = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
].find((p) => p && existsSync(p));

const problems = [];
const bad = (file, msg) => problems.push(`${file}: ${msg}`);

// ---------- static checks ----------
const all = readdirSync(dir).filter((f) => f.endsWith(".html")).sort();
const pages = only ? all.filter((f) => only.includes(f)) : all;
const cards = all.filter((f) => f !== "index.html");

for (const f of pages) {
  const html = readFileSync(join(dir, f), "utf8");
  for (const [, href] of html.matchAll(/href="([^"#:?]+\.html)(?:#[^"]*)?"/g))
    if (!existsSync(join(dir, href)) && !allowMissing) bad(f, `broken link -> ${href}`);
  if (!/<title>[^<]+<\/title>/.test(html)) bad(f, "missing <title>");
  if (f === "index.html") continue;
  if (/<script[\s>]/i.test(html)) bad(f, "cards must not contain <script>");
  if (/<(link|img|script)[^>]+(src|href)="https?:/i.test(html)) bad(f, "external resource request");
  // Colours only via variables: hex codes are allowed inside :root{...} blocks only.
  const css = (html.match(/<style>([\s\S]*?)<\/style>/) || [, ""])[1].replace(/:root(\[[^\]]*\])?(:not\([^)]*\))?\s*\{[^}]*\}/g, "");
  const hex = [...css.matchAll(/#[0-9a-fA-F]{3,8}\b/g), ...html.replace(/<style>[\s\S]*?<\/style>/, "").matchAll(/style="[^"]*#[0-9a-fA-F]{3,8}\b/g)];
  if (hex.length) bad(f, `hard-coded colour outside :root (${hex.slice(0, 3).map((m) => m[0].slice(-9)).join(", ")})`);
}

// Index: every entry exists, every card is listed.
if (allowMissing) {
  // index is checked in the final full run
} else if (existsSync(join(dir, "index.html"))) {
  const idx = readFileSync(join(dir, "index.html"), "utf8");
  const listed = [...idx.matchAll(/\["([^"]+\.html)"/g)].map((m) => m[1]);
  const linked = [...idx.matchAll(/href="([^"#:]+\.html)"/g)].map((m) => m[1]);
  const entries = new Set([...listed, ...linked]);
  for (const e of entries) if (!existsSync(join(dir, e))) bad("index.html", `entry missing on disk: ${e}`);
  for (const c of cards) if (!entries.has(c)) bad("index.html", `card not listed: ${c}`);
} else bad(dir, "no index.html");

// ---------- rendered checks ----------
async function render() {
  if (!CHROME) { bad("verify", "no Chrome found (set CHROME_PATH); rendered checks skipped"); return; }
  const profile = mkdtempSync(join(tmpdir(), "cc-verify-"));
  const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
    "--allow-file-access-from-files", `--user-data-dir=${profile}`, "--remote-debugging-port=0", "about:blank"], { stdio: "ignore" });
  try {
    const portFile = join(profile, "DevToolsActivePort");
    for (let i = 0; i < 100 && !existsSync(portFile); i++) await sleep(100);
    const port = readFileSync(portFile, "utf8").split("\n")[0];
    for (const f of pages) await checkPage(port, f);
  } finally {
    chrome.kill();
    await sleep(300);
    rmSync(profile, { recursive: true, force: true });
  }
}

async function checkPage(port, f) {
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  let id = 0; const waiting = new Map(); const errors = []; let loaded;
  ws.addEventListener("message", (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); }
    if (m.method === "Runtime.exceptionThrown") errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errors.push(m.params.args.map((a) => a.value ?? a.description).join(" "));
    if (m.method === "Log.entryAdded" && m.params.entry.level === "error") errors.push(m.params.entry.text + " " + (m.params.entry.url || ""));
    if (m.method === "Page.loadEventFired") loaded?.();
  });
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; waiting.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const evaluate = async (expr) => (await send("Runtime.evaluate", { expression: expr, returnByValue: true })).result?.result?.value;

  await send("Runtime.enable"); await send("Log.enable"); await send("Page.enable");
  for (const [w, label] of [[1300, "desktop"], [400, "phone"]]) {
    await send("Emulation.setDeviceMetricsOverride", { width: w, height: 1000, deviceScaleFactor: 1, mobile: w < 600 });
    const done = new Promise((r) => (loaded = r));
    await send("Page.navigate", { url: "file://" + join(dir, f) });
    await Promise.race([done, sleep(8000)]);
    await sleep(f === "index.html" ? 1500 : 300);
    const r = await evaluate(`(() => {
      const over = [...document.querySelectorAll('.formula,.mathbox,pre')]
        .filter(e => getComputedStyle(e).overflowX !== 'auto' || e.classList.contains('formula'))
        .filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent.trim().slice(0, 40));
      return { over, sideways: document.documentElement.scrollWidth > innerWidth + 1 };
    })()`);
    if (label === "desktop" && r?.over?.length) bad(f, `formula overflows: ${r.over.map((t) => JSON.stringify(t)).join(", ")}`);
    if (r?.sideways) bad(f, `page scrolls sideways at ${w}px`);
    if (shots && label === "desktop") {
      mkdirSync(shots, { recursive: true });
      for (const scheme of ["light", "dark"]) {
        await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: scheme }] });
        await sleep(150);
        const png = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
        writeFileSync(join(shots, f.replace(".html", `.${scheme}.png`)), Buffer.from(png.result.data, "base64"));
      }
      await send("Emulation.setEmulatedMedia", { features: [] });
    }
  }
  for (const e of new Set(errors)) bad(f, `console error: ${e}`);
  ws.close();
  await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`).catch(() => {});
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await render();
if (problems.length) {
  console.log(`FAIL: ${problems.length} problem(s) in ${pages.length} page(s)\n` + problems.map((p) => "  - " + p).join("\n"));
  process.exit(1);
}
console.log(`PASS: ${pages.length} page(s), ${cards.length} card(s) listed in index` + (shots ? `, screenshots in ${shots}` : ""));
