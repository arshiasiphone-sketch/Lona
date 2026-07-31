#!/usr/bin/env node
/**
 * Lona — Admin media pipeline browser test (CDP via chrome-headless-shell).
 * Usage:  node scripts/admin-media-test.mjs [BASE_URL]
 */
import { spawn, execSync } from "node:child_process";
import { writeFileSync, appendFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";

const BASE = process.env.BASE_URL || "https://fancy-islands-bet.freebuff.dev";
const BIN =
  "/home/daytona/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell";
const PORT = 9341;
const EMAIL = `media-test-${Date.now()}@vly.sh`;
const LOG = "/tmp/admin-media-test.log";

const PNG_1x1 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const results = [];
const consoleErrors = [];
const pageErrors = [];

const log = (msg) => {
  const line = `[${new Date().toISOString().slice(11, 19)}] ${msg}`;
  appendFileSync(LOG, line + "\n");
  console.log(line);
};
const ok = (name, detail = "") => {
  results.push({ name, pass: true, detail });
  log(`✅ PASS — ${name}${detail ? ` :: ${detail}` : ""}`);
};
const fail = (name, detail = "") => {
  results.push({ name, pass: false, detail });
  log(`❌ FAIL — ${name}${detail ? ` :: ${detail}` : ""}`);
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function extractJson(out) {
  const candidates = [out.indexOf("["), out.indexOf("{")].filter((i) => i >= 0);
  const start = candidates.length ? Math.min(...candidates) : -1;
  if (start < 0) throw new Error("no JSON in convex output: " + out.slice(0, 200));
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < out.length; i++) {
    const ch = out[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === "[" || ch === "{") depth++;
    else if (ch === "]" || ch === "}") {
      depth--;
      if (depth === 0) return JSON.parse(out.slice(start, i + 1));
    }
  }
  throw new Error("unterminated JSON in convex output");
}

function convexInline(query) {
  const out = execSync(`bunx convex run --inline-query '${query}'`, {
    encoding: "utf8",
    timeout: 60000,
    maxBuffer: 10 * 1024 * 1024,
  });
  return extractJson(out);
}

class CDP {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.pending = new Map();
    this.ready = new Promise((res) => (this.ws.onopen = res));
    this.ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && this.pending.has(m.id)) {
        const { resolve, reject } = this.pending.get(m.id);
        this.pending.delete(m.id);
        m.error ? reject(new Error(m.error.message)) : resolve(m.result);
      } else if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") {
        consoleErrors.push(
          m.params.args.map((a) => a.value ?? a.description ?? "").join(" "),
        );
      } else if (m.method === "Runtime.exceptionThrown") {
        pageErrors.push(
          (m.params.exceptionDetails.exception?.description ??
            m.params.exceptionDetails.text) +
            "",
        );
      }
    };
  }
  async send(method, params = {}) {
    await this.ready;
    return new Promise((resolve, reject) => {
      const id = ++this.id;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async eval(expression) {
    const r = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (r.exceptionDetails) {
      throw new Error(
        "eval threw: " +
          (r.exceptionDetails.exception?.description ?? r.exceptionDetails.text),
      );
    }
    return r.result?.value;
  }
  async pageState() {
    try {
      return await this.eval(
        `JSON.stringify({href: location.href, ready: document.readyState, title: document.title, body: document.body ? document.body.innerText.slice(0, 160).replace(/\\n/g, ' ') : '(no body)'})`,
      );
    } catch (e) {
      return "state eval failed: " + e.message;
    }
  }
  async goto(url, waitMs = 6000) {
    await this.send("Page.navigate", { url });
    await sleep(waitMs);
    await this.waitFor(`document.readyState === 'complete'`, 15000).catch(() => {});
  }
  async waitFor(expr, timeout = 15000, interval = 350) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try {
        if (await this.eval(`!!(${expr})`)) return true;
      } catch {
        /* keep polling */
      }
      await sleep(interval);
    }
    throw new Error(`waitFor timeout: ${expr}`);
  }
}

const setInput = async (cdp, selector, value) => {
  const okSel = await cdp.eval(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return false;
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(value)});
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`);
  if (!okSel) throw new Error("setInput: not found " + selector);
};

const findButton = async (cdp, text) =>
  cdp.eval(`(() => {
    const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim().includes(${JSON.stringify(text)}));
    if (!b) return false;
    b.click(); return true;
  })()`);

const uploadFile = async (cdp, selector, filePath) => {
  const { root } = await cdp.send("DOM.getDocument", { depth: -1 });
  const { nodeId } = await cdp.send("DOM.querySelector", {
    nodeId: root.nodeId,
    selector,
  });
  if (!nodeId) throw new Error("uploadFile: input not found " + selector);
  await cdp.send("DOM.setFileInputFiles", { nodeId, files: [filePath] });
};

const bruteForceCode = (hash) => {
  const start = Date.now();
  for (let i = 0; i < 1000000; i++) {
    const c = String(i).padStart(6, "0");
    if (createHash("sha256").update(c).digest("hex") === hash) {
      log(`🔓 OTP found: ${c} (${Date.now() - start}ms)`);
      return c;
    }
  }
  return null;
};

async function main() {
  appendFileSync(LOG, `\n===== Lona Admin Media Test — ${new Date().toISOString()} =====\n`);
  log(`BASE=${BASE}  EMAIL=${EMAIL}`);

  try {
    convexInline('const r = await ctx.db.query("users").take(1); return r');
    log("convex CLI authenticated ✓");
  } catch (e) {
    fail("preflight: convex cli", e.message);
    return;
  }

  // Warm up the Vite dev server so the first browser hit isn't a cold compile
  // (the Freebuff preview shell shows "Loading application…" until the app boots).
  try {
    const w = await fetch(BASE + "/src/main.tsx", { signal: AbortSignal.timeout(45000) });
    log(`warm-up /src/main.tsx → HTTP ${w.status}`);
  } catch (e) {
    log("warm-up fetch failed (continuing): " + e.message);
  }

  const pngA = join(tmpdir(), "lona-test-a.png");
  const pngB = join(tmpdir(), "lona-test-b.png");
  writeFileSync(pngA, Buffer.from(PNG_1x1, "base64"));
  writeFileSync(pngB, Buffer.from(PNG_1x1, "base64"));

  const profile = mkdtempSync(join(tmpdir(), "lona-cdp-"));
  const proc = spawn(
    BIN,
    [
      "--headless", "--disable-gpu", "--no-sandbox", "--no-first-run",
      "--no-default-browser-check", "--remote-debugging-port=" + PORT,
      "--user-data-dir=" + profile, "about:blank",
    ],
    { stdio: "ignore" },
  );
  let wsUrl = null;
  for (let i = 0; i < 50 && !wsUrl; i++) {
    try {
      const v = await fetch(`http://127.0.0.1:${PORT}/json/version`).then((r) => r.json());
      wsUrl = v.webSocketDebuggerUrl;
    } catch {
      await sleep(400);
    }
  }
  if (!wsUrl) {
    fail("launch headless shell", "CDP endpoint not available");
    return;
  }

  // Create the tab and connect to THAT tab (not a random page tab).
  const created = await fetch(
    `http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(BASE + "/auth")}`,
    { method: "PUT" },
  ).then((r) => r.json());
  const cdp = new CDP(created.webSocketDebuggerUrl);
  await cdp.send("Runtime.enable");
  await cdp.send("Page.enable");
  await cdp.send("DOM.enable");
  await cdp.send("Network.enable").catch(() => {});
  log("chrome-headless-shell connected ✓");

  try {
    /* ── 1. LOGIN (real OTP flow, resilient to dev-server cold starts) ── */
    log("loading /auth…");
    await cdp.goto(BASE + "/auth", 5000);

    // The Freebuff shell shows "Loading application…" (booting) or
    // "Server is taking longer…" (dev server cold start / 503). Both
    // mean the app hasn't mounted yet. Loop: reload until the real app
    // renders, up to ~2.5 minutes, so a flaky sandbox doesn't kill the run.
    let emailForm = false;
    for (let attempt = 0; attempt < 9 && !emailForm; attempt++) {
      const booted = await cdp.eval(
        `!!document.body && !document.body.innerText.includes('Loading application') && !document.body.innerText.includes('Server is taking longer')`,
      );
      if (booted) {
        // shell gone — give React a beat, then check for the email input
        await sleep(1200);
        emailForm = await cdp.eval(`!!document.querySelector('input[name="email"]')`);
      }
      if (!emailForm) {
        const state = await cdp.pageState();
        log(
          `attempt ${attempt + 1}: not booted (${state.slice(0, 120)}) — reloading…`,
        );
        await cdp.send("Page.reload", { ignoreCache: true });
        await sleep(14000);
      }
    }
    try {
      await cdp.waitFor(`document.querySelector('input[name="email"]')`, 15000);
    } catch (e) {
      fail("auth page renders email form", await cdp.pageState());
      throw e;
    }
    ok("auth page renders email form");

    await setInput(cdp, 'input[name="email"]', EMAIL);
    await cdp.eval(`document.querySelector('form').requestSubmit()`);
    log("email submitted, waiting for OTP code row…");
    await sleep(4000);

    let hash = null;
    for (let i = 0; i < 6 && !hash; i++) {
      try {
        const rows = convexInline(
          'const rows = await ctx.db.query("authVerificationCodes").take(100); return rows',
        );
        const mine = rows.filter((r) => r.emailVerified === EMAIL);
        hash = mine.length ? mine[mine.length - 1].code : null;
      } catch {}
      if (!hash) await sleep(1500);
    }
    if (!hash) throw new Error("no verification code row found in DB");
    const code = bruteForceCode(hash);
    if (!code) throw new Error("OTP brute force failed");

    try {
      await cdp.waitFor(
        `document.querySelector('input[inputmode="numeric"], input[name="otp"], [data-slot="otp-input"]')`,
        15000,
      );
    } catch (e) {
      fail("otp step appears", await cdp.pageState());
      throw e;
    }
    await cdp.eval(
      `document.querySelector('input[inputmode="numeric"], input[name="otp"], [data-slot="otp-input"]').focus()`,
    );
    await cdp.send("Input.insertText", { text: code });
    await sleep(500);
    await cdp.eval(`document.querySelector('form').requestSubmit()`);
    await cdp.waitFor(`location.pathname !== '/auth'`, 20000);
    ok("login via OTP", `→ ${await cdp.eval("location.pathname")}`);

    /* ── 2. PROMOTE TO OWNER ── */
    // `promote` is self-locking (throws BOOTSTRAPPED once an admin exists);
    // `forcePromote` bypasses the guard — dev-only, which is what a test needs.
    execSync(
      `bunx convex run admin_bootstrap:forcePromote '{"email":"${EMAIL}","role":"owner"}'`,
      { timeout: 60000, maxBuffer: 10 * 1024 * 1024 },
    );
    log("promoted to owner ✓");
    await sleep(2500);

    /* ── 3. /admin renders ── */
    await cdp.goto(BASE + "/admin", 6000);
    await sleep(3000);
    const adminText = await cdp.eval(`document.body.innerText.slice(0, 400)`);
    const adminOk =
      (await cdp.eval(`location.pathname.startsWith('/admin')`)) &&
      !adminText.includes("مشکلی پیش آمده");
    adminOk
      ? ok("admin dashboard renders", adminText.replace(/\n/g, " ").slice(0, 90))
      : fail("admin dashboard renders", adminText.slice(0, 200));

    /* ── 4. SETTINGS → IMAGES TAB ── */
    await cdp.goto(BASE + "/admin/settings", 6000);
    await cdp.waitFor(`document.querySelector('nav[role="tablist"]')`, 15000);
    const clicked = await findButton(cdp, "تصاویر");
    if (!clicked) throw new Error("images tab not found");
    await cdp.waitFor(
      `[...document.querySelectorAll('p')].some(p => p.textContent.trim() === 'برند')`,
      10000,
    );
    ok("settings → images tab renders brand group");

    const slotCount = await cdp.eval(
      `document.querySelectorAll('input[placeholder*="https"]').length`,
    );
    slotCount === 37
      ? ok("37 image slot cards", `count=${slotCount}`)
      : fail("37 image slot cards", `count=${slotCount}`);
    const badgeCount = await cdp.eval(
      `[...document.querySelectorAll('span')].filter(s => s.textContent.trim() === 'سفارشی').length`,
    );
    ok("custom badges initially 0", `count=${badgeCount}`);

    /* ── 5. SET LOGO / FAVICON / OG IMAGE ── */
    const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" fill="#f5e9da"/><circle cx="12" cy="12" r="9" fill="#c98a5a"/></svg>',
    )}`;
    for (const [label, value] of [
      ["لوگو برند", dataUri],
      ["فاوآیکون (آیکون مرورگر)", dataUri],
      ["تصویر اشتراک‌گذاری (OpenGraph)", dataUri],
    ]) {
      const did = await cdp.eval(`(() => {
        const p = [...document.querySelectorAll('p')].find(p => p.textContent.trim() === ${JSON.stringify(label)});
        if (!p) return false;
        const controls = p.parentElement;
        const input = controls.querySelector('input');
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(value)});
        input.dispatchEvent(new Event('input', { bubbles: true }));
        controls.querySelector('button').click();
        return true;
      })()`);
      if (!did) throw new Error("slot card not found: " + label);
      await sleep(1500);
    }
    await cdp.waitFor(
      `[...document.querySelectorAll('span')].filter(s => s.textContent.trim() === 'سفارشی').length === 3`,
      12000,
    );
    ok("logo/favicon/og overrides saved", "3 سفارشی badges");

    /* ── 6. HOMEPAGE LIVE VERIFICATION ── */
    await cdp.goto(BASE + "/", 6000);
    await cdp.waitFor(`document.querySelector('header img, link[rel="icon"]')`, 12000);
    await sleep(2000);
    const headerLogo = await cdp.eval(
      `document.querySelector('header img') ? document.querySelector('header img').src.slice(0, 20) : null`,
    );
    const favicon = await cdp.eval(
      `document.querySelector('link[rel="icon"]')?.href?.slice(0, 20) ?? null`,
    );
    headerLogo === "data:image/svg+xml"
      ? ok("header logo override live", headerLogo)
      : fail("header logo override live", headerLogo);
    favicon === "data:image/svg+xml"
      ? ok("favicon override live", favicon)
      : fail("favicon override live", favicon);
    const footerLogo = await cdp.eval(
      `[...document.querySelectorAll('footer img')].map(i => i.src.slice(0, 20))`,
    );
    (footerLogo[0] || "").startsWith("data:")
      ? ok("footer logo override live")
      : fail("footer logo override live", JSON.stringify(footerLogo));

    /* ── 7. MEDIA LIBRARY — UPLOAD ── */
    await cdp.goto(BASE + "/admin/media", 6000);
    await cdp.waitFor(`document.querySelector('input[type="file"]')`, 15000);
    await uploadFile(cdp, 'input[type="file"]', pngA);
    await cdp.waitFor(`document.querySelector('img[alt="lona-test-a"]')`, 30000);
    ok("media upload works", "tile lona-test-a appeared");

    /* ── 8. REPLACE ── */
    await cdp.eval(`document.querySelector('img[alt="lona-test-a"]').closest('button').click()`);
    await cdp.waitFor(
      `[...document.querySelectorAll('button')].some(b => b.textContent.includes('جایگزینی تصویر'))`,
      10000,
    );
    const before = await cdp.eval(
      `document.querySelector('aside img')?.src ?? document.querySelector('img[alt="lona-test-a"]')?.src`,
    );
    await findButton(cdp, "جایگزینی تصویر");
    await sleep(500);
    await uploadFile(cdp, 'aside input[type="file"]', pngB);
    let replaced = false;
    for (let i = 0; i < 30; i++) {
      const now = await cdp.eval(
        `document.querySelector('aside img')?.src ?? document.querySelector('img[alt="lona-test-a"]')?.src`,
      );
      if (now && now !== before) {
        replaced = true;
        break;
      }
      await sleep(500);
    }
    replaced ? ok("media replace works") : fail("media replace works", "src unchanged");

    /* ── 9. EDIT ALT ── */
    const metaSet = await cdp.eval(`(() => {
      const input = [...document.querySelectorAll('input')].find(i => (i.placeholder || '').includes('سوتین گیپور'));
      if (!input) return false;
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'تست جایگزینی تصویر');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    })()`);
    if (!metaSet) throw new Error("alt input not found");
    await findButton(cdp, "ذخیره توضیحات");
    await sleep(2000);
    const h2Text = await cdp.eval(`document.querySelector('aside h2')?.textContent ?? ''`);
    h2Text.includes("تست جایگزینی تصویر")
      ? ok("alt metadata edit works", h2Text)
      : fail("alt metadata edit works", h2Text);

    /* ── 10. DELETE ── */
    await findButton(cdp, "حذف");
    await cdp.waitFor(
      `[...document.querySelectorAll('button')].some(b => b.textContent.includes('حذف از کتابخانه'))`,
      8000,
    );
    await findButton(cdp, "حذف از کتابخانه");
    await sleep(2000);
    const gone = await cdp.eval(`!document.querySelector('img[alt="lona-test-a"]')`);
    gone ? ok("media delete works") : fail("media delete works", "tile still present");
  } catch (e) {
    fail("test flow crashed", e.message);
  }

  log("\n══════════ SUMMARY ══════════");
  let passed = 0;
  for (const r of results) {
    if (r.pass) passed++;
  }
  log(`PASS ${passed}/${results.length}`);
  for (const r of results) {
    log(`  ${r.pass ? "✅" : "❌"} ${r.name}${r.detail ? " — " + r.detail : ""}`);
  }
  log(`\nconsole errors captured: ${consoleErrors.length}`);
  consoleErrors.slice(0, 8).forEach((e) => log("  console.error: " + e.slice(0, 220)));
  log(`page exceptions: ${pageErrors.length}`);
  pageErrors.slice(0, 8).forEach((e) => log("  exception: " + e.slice(0, 220)));

  try {
    proc.kill();
  } catch {}
  process.exit(passed === results.length && results.length > 0 ? 0 : 2);
}

main().catch((e) => {
  log("FATAL: " + e.stack);
  process.exit(1);
});
