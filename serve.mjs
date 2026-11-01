/**
 * serve.mjs — static server for the built SPA (dist/) with SPA fallback.
 *
 * Why this file exists: this project is a Vite SPA — on Vercel/Netlify the
 * build output is served statically and no Node process is needed. Some
 * hosting panels instead run `npm install && npm start`, so this script is
 * the `start` entrypoint. It needs no dependencies.
 *
 * Behaviour:
 *  - Serves `dist/` on 0.0.0.0:$PORT (fallback 3000).
 *  - Extensionless paths (/shop, /account, /admin/...) fall through to
 *    index.html so React Router handles the route.
 *  - Paths WITH an extension return a real 404 when missing — never HTML —
 *    so /75440596.txt (Enamad verification) can't be faked or misread.
 *  - Hashed /assets/* are immutable-cached; HTML is always revalidated.
 *  - Brotli/gzip on the fly for text responses (no build step needed).
 *  - If dist/index.html is missing (the panel skipped the build step), it
 *    runs `npm run build:frontend` once, then serves.
 */

import { createServer } from "node:http";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, "dist");
const PORT = Number(process.env.PORT ?? process.env.port ?? 3000);
const HOST = "0.0.0.0";
const INDEX = path.join(DIST, "index.html");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".pdf": "application/pdf",
};

/** Run the production build once if the output folder is absent. */
function ensureBuild() {
  if (existsSync(INDEX)) return;
  console.log("[serve] dist/index.html missing — running npm run build:frontend …");
  const result = spawnSync("npm", ["run", "build:frontend"], {
    cwd: ROOT,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0 || !existsSync(INDEX)) {
    console.error(
      "[serve] Build failed — nothing to serve. " +
        "Check that devDependencies were installed and Node is >= 20.19 (Vite 7)."
    );
    process.exit(1);
  }
  console.log("[serve] build finished.");
}

function isCompressible(type) {
  return (
    type.startsWith("text/") ||
    type.includes("json") ||
    type.includes("javascript") ||
    type.includes("svg") ||
    type.includes("xml")
  );
}

function cacheFor(type, urlPath) {
  if (type.startsWith("text/html")) return "no-cache"; // always revalidate HTML
  if (urlPath.startsWith("/assets/")) return "public, max-age=31536000, immutable"; // hashed filenames
  return "public, max-age=3600";
}

function send(req, res, status, body, type, cache) {
  const headers = {
    "Content-Type": type,
    "Cache-Control": cache,
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Vary": "Accept-Encoding",
  };

  let payload = body;
  const encoding = req.headers["accept-encoding"] || "";
  if (isCompressible(type) && body.length > 1024) {
    if (/\bbr\b/.test(encoding)) {
      payload = zlib.brotliCompressSync(body);
      headers["Content-Encoding"] = "br";
    } else if (/\bgzip\b/.test(encoding)) {
      payload = zlib.gzipSync(body, { level: 6 });
      headers["Content-Encoding"] = "gzip";
    }
  }
  headers["Content-Length"] = payload.length;

  res.writeHead(status, headers);
  if (req.method === "HEAD") res.end();
  else res.end(payload);
}

function serveFile(req, res, filePath, urlPath) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || "application/octet-stream";
  let body;
  try {
    body = readFileSync(filePath);
  } catch {
    return notFound(req, res, urlPath);
  }
  send(req, res, 200, body, type, cacheFor(type, urlPath));
}

function notFound(req, res, urlPath) {
  console.warn(`[serve] 404 ${req.method} ${urlPath}`);
  send(req, res, 404, Buffer.from("404 Not Found\n"), "text/plain; charset=utf-8", "no-store");
}

function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" });
    return res.end();
  }

  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, "http://placeholder").pathname);
  } catch {
    res.writeHead(400);
    return res.end("Bad Request");
  }
  if (urlPath.includes("\0")) {
    res.writeHead(400);
    return res.end("Bad Request");
  }

  const resolved = path.normalize(path.join(DIST, urlPath));
  if (resolved !== DIST && !resolved.startsWith(DIST + path.sep)) {
    return notFound(req, res, urlPath);
  }

  let target = resolved;
  try {
    if (statSync(target).isDirectory()) target = path.join(target, "index.html");
  } catch {
    // not on disk — fall through to SPA handling below
  }

  if (existsSync(target) && statSync(target).isFile()) {
    return serveFile(req, res, target, urlPath);
  }

  // Real assets with an extension must 404 (never return HTML for a .txt/.js
  // — the Enamad /75440596.txt check depends on this being honest).
  if (path.extname(urlPath) !== "") {
    return notFound(req, res, urlPath);
  }

  // Extensionless path → SPA fallback: React Router owns the route.
  return serveFile(req, res, INDEX, urlPath);
}

ensureBuild();

const server = createServer(handler);
server.on("error", (err) => {
  console.error(`[serve] failed to start: ${err.message}`);
  process.exit(1);
});
server.listen(PORT, HOST, () => {
  console.log(`[serve] serving ${DIST} on http://${HOST}:${PORT}`);
});
