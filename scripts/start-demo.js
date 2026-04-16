const { spawn } = require("child_process");
const net = require("net");

function runNode(scriptPath, env = {}) {
  const child = spawn(process.execPath, [scriptPath], {
    stdio: "inherit",
    env: { ...process.env, ...env }
  });
  child.on("exit", (code) => {
    if (code && code !== 0) {
      process.exitCode = code;
    }
  });
  return child;
}

function probePort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on("error", () => resolve(false));
    server.listen({ port, host: "127.0.0.1" }, () => {
      server.close(() => resolve(true));
    });
  });
}

async function findFreePort(preferredPort, maxAttempts = 20) {
  const base = Number(preferredPort);
  if (!Number.isFinite(base)) {
    throw new Error(`Invalid port: ${preferredPort}`);
  }
  for (let offset = 0; offset <= maxAttempts; offset += 1) {
    const candidate = base + offset;
    const ok = await probePort(candidate);
    if (ok) return String(candidate);
  }
  throw new Error(`No free port found near ${base}`);
}

async function main() {
  const desiredBackendPort = process.env.PORT || "8787";
  const desiredPluginPort = process.env.A_PLUGIN_PORT || "5173";
  const backendPort = await findFreePort(desiredBackendPort);
  const pluginPort = await findFreePort(desiredPluginPort);

  console.log("[demo] starting backend + student plugin...");
  console.log(`[demo] backend port: ${backendPort}`);
  console.log(`[demo] student plugin port: ${pluginPort}`);
  console.log(`[demo] API_BASE_URL: http://localhost:${backendPort}`);
  console.log(`[demo] school console: http://localhost:${backendPort}/console`);
  console.log(`[demo] student plugin: http://localhost:${pluginPort}`);

  runNode("services/school-backend/src/server.js", { PORT: backendPort });
  runNode("apps/student-plugin/dev-server.js", { A_PLUGIN_PORT: pluginPort });
}

main().catch((error) => {
  console.error(`[demo] failed: ${error.message}`);
  process.exit(1);
});

