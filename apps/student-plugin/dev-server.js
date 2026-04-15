const express = require("express");
const path = require("path");

const app = express();
const port = Number(process.env.A_PLUGIN_PORT || process.env.PORT || 5173);

app.use(express.static(path.resolve(__dirname)));

app.listen(port, () => {
  console.log(`student-plugin demo running at http://localhost:${port}`);
});
