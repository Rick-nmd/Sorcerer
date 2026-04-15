const express = require("express");
const path = require("path");

const app = express();
const port = process.env.A_PLUGIN_PORT || 5173;

app.use(express.static(path.resolve(__dirname)));

app.listen(port, () => {
  console.log(`student-plugin demo running at http://localhost:${port}`);
});
