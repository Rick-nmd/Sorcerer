const express = require("express");
const path = require("path");

const app = express();
const port = Number(process.env.A_PLUGIN_PORT || process.env.PORT || 5173);

app.use(express.static(path.resolve(__dirname)));

function listenWithFallback(startPort) {
  const basePort = Number(startPort) || 5173;
  const maxAttempts = 10;

  const server = app.listen(basePort, () => {
    console.log(`student-plugin demo running at http://localhost:${basePort}`);
  });

  server.on("error", (error) => {
    if (error?.code !== "EADDRINUSE") {
      throw error;
    }
    server.close();
    for (let offset = 1; offset <= maxAttempts; offset += 1) {
      const nextPort = basePort + offset;
      try {
        const retry = app.listen(nextPort, () => {
          console.log(`student-plugin port ${basePort} in use, switched to http://localhost:${nextPort}`);
        });
        retry.on("error", (err) => {
          if (err?.code !== "EADDRINUSE") throw err;
        });
        return;
      } catch (_err) {
        // keep scanning
      }
    }
    throw error;
  });
}

listenWithFallback(port);
