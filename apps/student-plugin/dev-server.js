const express = require("express");
const path = require("path");
const http = require("http");
const { URL } = require("url");

const app = express();
const port = Number(process.env.A_PLUGIN_PORT || process.env.PORT || 5173);

/** Same-origin proxy: browser calls /api/* and /proxy/* on :5173 → real backend (avoids flaky cross-origin in some environments). */
const BACKEND_PROXY_TARGET = process.env.BACKEND_PROXY_TARGET || "http://127.0.0.1:8787";

function proxyToBackend(clientReq, clientRes) {
  let backend;
  try {
    backend = new URL(BACKEND_PROXY_TARGET);
  } catch (_e) {
    clientRes.status(502).send("Invalid BACKEND_PROXY_TARGET");
    return;
  }

  const isHttps = backend.protocol === "https:";
  const lib = isHttps ? require("https") : http;
  const defaultPort = isHttps ? 443 : 80;
  const portNum = backend.port ? Number(backend.port) : defaultPort;

  const headers = { ...clientReq.headers };
  headers.host = backend.host;

  const proxyReq = lib.request(
    {
      hostname: backend.hostname,
      port: portNum,
      path: clientReq.originalUrl || clientReq.url,
      method: clientReq.method,
      headers
    },
    (proxyRes) => {
      clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(clientRes);
    }
  );

  proxyReq.on("error", (err) => {
    if (!clientRes.headersSent) {
      clientRes.status(502).type("text/plain").send(`Proxy error: ${err.message}`);
    }
  });

  clientReq.pipe(proxyReq);
}

app.use((req, res, next) => {
  const pathOnly = req.originalUrl || req.url || "";
  if (pathOnly.startsWith("/api") || pathOnly.startsWith("/proxy")) {
    return proxyToBackend(req, res);
  }
  return next();
});

app.use(express.static(path.resolve(__dirname)));

function listenWithFallback(startPort, maxAttempts = 20) {
  const basePort = Number(startPort) || 5173;

  const tryListen = (offset) => {
    const candidate = basePort + offset;
    const server = app.listen(candidate);

    server.on("listening", () => {
      const switched = offset > 0;
      if (switched) {
        console.log(`student-plugin port ${basePort} in use, switched to http://localhost:${candidate}`);
      } else {
        console.log(`student-plugin demo running at http://localhost:${candidate}`);
      }
      console.log(`[proxy] /api and /proxy -> ${BACKEND_PROXY_TARGET}`);
    });

    server.on("error", (err) => {
      if (err?.code === "EADDRINUSE" && offset < maxAttempts) {
        tryListen(offset + 1);
        return;
      }
      throw err;
    });
  };

  tryListen(0);
}

listenWithFallback(port);
