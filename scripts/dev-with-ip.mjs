import { networkInterfaces } from "os";
import { spawn, execSync } from "child_process";
import { createRequire } from "module";
import http from "http";
import fs from "fs";
import path from "path";

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");

const reset = "\x1b[0m";
const bold = "\x1b[1m";
const dim = "\x1b[2m";
const green = "\x1b[32m";
const cyan = "\x1b[36m";
const yellow = "\x1b[33m";
const magenta = "\x1b[35m";
const red = "\x1b[31m";

const DEV_LOCK = path.join(process.cwd(), ".next", "dev", "lock");

function loadEnvFile(filename) {
  const filePath = path.join(process.cwd(), filename);
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const PROXY_PREFIX = "/soco-api";
const API_BACKEND_URL = (
  process.env.API_BACKEND_URL ?? "http://124.43.216.136:3852/SocoApi/api"
).replace(/\/+$/, "");
const publicPort = Number(process.env.PORT || 3000);
const nextPort = Number(process.env.NEXT_INTERNAL_PORT || publicPort + 1);

function getNetworkIP() {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return null;
}

function isPortInUse(port) {
  return new Promise((resolve) => {
    const tester = http.createServer();
    tester.once("error", () => resolve(true));
    tester.once("listening", () => tester.close(() => resolve(false)));
    tester.listen(port, "127.0.0.1");
  });
}

function getPidsOnPort(port) {
  if (process.platform === "win32") {
    try {
      const out = execSync(`netstat -ano | findstr ":${port}"`, { encoding: "utf8" });
      const pids = new Set();
      for (const line of out.split("\n")) {
        if (!/LISTENING/i.test(line)) continue;
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && /^\d+$/.test(pid) && pid !== "0") pids.add(pid);
      }
      return [...pids];
    } catch {
      return [];
    }
  }

  try {
    const out = execSync(`lsof -ti :${port}`, { encoding: "utf8" });
    return out
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function killPid(pid) {
  if (!pid || String(pid) === String(process.pid)) return;
  try {
    if (process.platform === "win32") {
      execSync(`taskkill /PID ${pid} /T /F`, { stdio: "ignore" });
    } else {
      process.kill(Number(pid), "SIGTERM");
    }
  } catch {
    // Process may already be gone.
  }
}

function killPort(port) {
  const pids = getPidsOnPort(port);
  for (const pid of pids) killPid(pid);
  return pids.length > 0;
}

function removeDevLock() {
  if (!fs.existsSync(DEV_LOCK)) return false;
  try {
    fs.unlinkSync(DEV_LOCK);
    return true;
  } catch {
    return false;
  }
}

function clearTurbopackCache() {
  const cacheDir = path.join(process.cwd(), ".next", "cache", "turbopack");
  if (!fs.existsSync(cacheDir)) return false;
  try {
    fs.rmSync(cacheDir, { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
}

async function prepareDevEnvironment() {
  const cleanedPorts = [];
  const notes = [];

  if (await isPortInUse(nextPort)) {
    if (killPort(nextPort)) cleanedPorts.push(nextPort);
    await new Promise((r) => setTimeout(r, 400));
  }

  if (await isPortInUse(publicPort)) {
    if (killPort(publicPort)) cleanedPorts.push(publicPort);
    await new Promise((r) => setTimeout(r, 400));
  }

  if (removeDevLock()) notes.push("stale lock removed");
  if (clearTurbopackCache()) notes.push("turbopack cache cleared");

  if (cleanedPorts.length > 0 || notes.length > 0) {
    const parts = [];
    if (cleanedPorts.length) parts.push(`freed port(s) ${cleanedPorts.join(", ")}`);
    if (notes.length) parts.push(notes.join(", "));
    console.log(`${yellow}Cleaned up previous dev session — ${parts.join("; ")}.${reset}\n`);
  }
}

function logApiCall(method, prefixedPath, status, startedAt) {
  const ms = Date.now() - startedAt;
  const statusColor =
    status >= 500 ? red : status >= 400 ? yellow : status >= 300 ? cyan : green;
  const tag = `${magenta}API${reset}`;
  console.log(
    `  ${tag} ${dim}${String(method).padEnd(6)}${reset} ${prefixedPath} ${statusColor}${status}${reset} ${dim}${ms}ms${reset}`,
  );
}

function proxyToBackend(req, res) {
  const startedAt = Date.now();
  const incoming = req.url ?? "/";
  const suffix = incoming.startsWith(PROXY_PREFIX)
    ? incoming.slice(PROXY_PREFIX.length)
    : incoming;
  const targetPath = suffix.startsWith("/") ? suffix : `/${suffix}`;
  const target = new URL(`${API_BACKEND_URL}${targetPath}`);

  const headers = { ...req.headers, host: target.host };
  delete headers.connection;

  const proxyReq = http.request(
    {
      protocol: target.protocol,
      hostname: target.hostname,
      port: target.port,
      path: `${target.pathname}${target.search}`,
      method: req.method,
      headers,
    },
    (proxyRes) => {
      const status = proxyRes.statusCode ?? 502;
      logApiCall(req.method, `${PROXY_PREFIX}${targetPath}`, status, startedAt);
      res.writeHead(status, proxyRes.headers);
      proxyRes.pipe(res);
    },
  );

  proxyReq.on("error", (err) => {
    console.log(
      `  ${magenta}API${reset} ${dim}${String(req.method).padEnd(6)}${reset} ${PROXY_PREFIX}${targetPath} ${red}ERR${reset} ${dim}${err.message}${reset}`,
    );
    if (!res.headersSent) {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "API proxy error", message: err.message }));
    }
  });

  req.pipe(proxyReq);
}

function proxyToNext(req, res) {
  const proxyReq = http.request(
    {
      hostname: "127.0.0.1",
      port: nextPort,
      path: req.url,
      method: req.method,
      headers: req.headers,
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
      proxyRes.pipe(res);
    },
  );

  proxyReq.on("error", (err) => {
    if (!res.headersSent) {
      res.writeHead(502, { "Content-Type": "text/plain" });
      res.end(`Next.js proxy error: ${err.message}`);
    }
  });

  req.pipe(proxyReq);
}

function shouldHideNextLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return true;
  return (
    /^▲ Next\.js/i.test(trimmed) ||
    /^\(Turbopack\)/i.test(trimmed) ||
    /^- Local:/i.test(trimmed) ||
    /^- Network:/i.test(trimmed) ||
    /^- Environments:/i.test(trimmed) ||
    /^✓ Starting/i.test(trimmed) ||
    /^✓ Ready in/i.test(trimmed) ||
    /^○ Compiling/i.test(trimmed) ||
    /^thread '/i.test(trimmed) ||
    /^panicked at/i.test(trimmed) ||
    /^note: run with/i.test(trimmed) ||
    /TaskId \d+/.test(trimmed) ||
    /inner_of_upper_lost_followers/i.test(trimmed)
  );
}

function formatRequestLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^(GET|POST|PUT|DELETE|PATCH)\s+(\S+)\s+(\d{3})\s+in\s+(\d+ms)/i);
  if (!match) return null;

  const [, method, route, status, time] = match;
  const statusNum = Number(status);
  const statusColor =
    statusNum >= 500 ? red : statusNum >= 400 ? yellow : statusNum >= 300 ? cyan : green;

  return `  ${dim}${method.padEnd(6)}${reset} ${route} ${statusColor}${status}${reset} ${dim}${time}${reset}`;
}

function pipeNextOutput(data) {
  const text = data.toString();
  for (const line of text.split("\n")) {
    if (shouldHideNextLine(line)) continue;
    const formatted = formatRequestLine(line);
    if (formatted) {
      console.log(formatted);
      continue;
    }
    if (line.trim()) {
      console.log(`  ${dim}${line.trim()}${reset}`);
    }
  }
}

function waitForNextReady(child, timeoutMs = 120000) {
  return new Promise((resolve, reject) => {
    let combined = "";

    const handleChunk = (data) => {
      const text = data.toString();
      combined += text;

      if (/Unable to acquire lock/i.test(text)) {
        cleanup();
        reject(new Error("NEXT_LOCK"));
        return;
      }

      if (
        /✓ Ready in/i.test(text) ||
        /Ready in \d+ms/i.test(text) ||
        /started server on/i.test(text)
      ) {
        cleanup();
        resolve();
      }
    };

    const onExit = (code) => {
      cleanup();
      reject(new Error(`Next.js exited before ready (code ${code ?? "unknown"})`));
    };

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Timed out waiting for Next.js to become ready"));
    }, timeoutMs);

    function cleanup() {
      clearTimeout(timer);
      child.stdout?.off("data", handleChunk);
      child.stderr?.off("data", handleChunk);
      child.off("exit", onExit);
    }

    child.stdout.on("data", handleChunk);
    child.stderr.on("data", handleChunk);
    child.on("exit", onExit);
  });
}

function printReadyBanner({ ip, readyMs }) {
  const localUrl = `http://localhost:${publicPort}`;
  const networkUrl = ip ? `http://${ip}:${publicPort}` : null;
  const line = "─".repeat(52);

  console.log("");
  console.log(`  ${dim}${line}${reset}`);
  console.log(`  ${bold}${magenta}SOCO${reset} ${dim}dev server ready${readyMs ? ` in ${readyMs}` : ""}${reset}`);
  console.log(`  ${dim}${line}${reset}`);
  console.log("");
  console.log(`  ${bold}${green}Open in browser${reset}`);
  console.log(`  ${cyan}${bold}${localUrl}${reset}  ${dim}← use this on your PC${reset}`);
  if (networkUrl) {
    console.log(`  ${cyan}${networkUrl}${reset}  ${dim}← use on phone / other device${reset}`);
  }
  console.log("");
  console.log(`  ${dim}Do not open port ${nextPort} — that is internal only.${reset}`);
  console.log(`  ${dim}API calls go through ${PROXY_PREFIX} on port ${publicPort}.${reset}`);
  console.log("");
  console.log(`  ${dim}Press Ctrl+C to stop${reset}`);
  console.log(`  ${dim}${line}${reset}`);
  console.log("");
}

let nextChild = null;
let proxyServer = null;
let shuttingDown = false;

function killNextChild() {
  if (!nextChild || nextChild.killed) return;
  try {
    if (process.platform === "win32" && nextChild.pid) {
      execSync(`taskkill /PID ${nextChild.pid} /T /F`, { stdio: "ignore" });
    } else {
      nextChild.kill("SIGTERM");
    }
  } catch {
    try {
      nextChild.kill("SIGKILL");
    } catch {
      // ignore
    }
  }
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  if (proxyServer) {
    try {
      proxyServer.close();
    } catch {
      // ignore
    }
  }

  killNextChild();
  removeDevLock();
  process.exit(code);
}

async function startDevServer() {
  await prepareDevEnvironment();

  const envLocalPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envLocalPath)) {
    console.log(
      `${yellow}Warning: .env.local not found. Copy .env.example to .env.local before first run.${reset}`,
    );
    console.log(`${dim}  cp .env.example .env.local${reset}\n`);
  }

  const ip = getNetworkIP();
  const startedAt = Date.now();

  console.log(`${dim}Starting SOCO dev server...${reset}`);

  // Webpack is more stable than Turbopack on Windows (avoids tokio panics).
  const spawnNext = () =>
    spawn(
      process.execPath,
      [nextBin, "dev", "--webpack", "-H", "127.0.0.1", "-p", String(nextPort)],
      { stdio: ["inherit", "pipe", "pipe"] },
    );

  nextChild = spawnNext();

  try {
    await waitForNextReady(nextChild);
  } catch (err) {
    if (err.message === "NEXT_LOCK") {
      console.log(`${yellow}Retrying after clearing stale Next.js lock...${reset}`);
      killNextChild();
      removeDevLock();
      await new Promise((r) => setTimeout(r, 500));
      nextChild = spawnNext();
      await waitForNextReady(nextChild);
    } else {
      console.error(`${red}Failed to start Next.js: ${err.message}${reset}`);
      shutdown(1);
      return;
    }
  }

  proxyServer = http.createServer((req, res) => {
    const url = req.url ?? "/";
    if (url === PROXY_PREFIX || url.startsWith(`${PROXY_PREFIX}/`)) {
      proxyToBackend(req, res);
      return;
    }
    proxyToNext(req, res);
  });

  await new Promise((resolve, reject) => {
    proxyServer.listen(publicPort, "0.0.0.0", resolve);
    proxyServer.on("error", reject);
  });

  const readyMs = `${Date.now() - startedAt}ms`;
  printReadyBanner({ ip, readyMs });

  nextChild.stdout.on("data", pipeNextOutput);
  nextChild.stderr.on("data", pipeNextOutput);

  nextChild.on("exit", (code) => {
    if (!shuttingDown) {
      console.log(`\n${yellow}Next.js stopped — shutting down.${reset}`);
      shutdown(code ?? 1);
    }
  });
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

startDevServer().catch((err) => {
  console.error(`${red}Dev server failed: ${err.message}${reset}`);
  shutdown(1);
});
