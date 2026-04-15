const fs = require("fs");
const path = require("path");

const schemaDir = path.resolve(__dirname, "../contracts/schemas");
const requiredFiles = ["risk-event.schema.json", "recommendation.schema.json"];

let hasError = false;

for (const file of requiredFiles) {
  const fullPath = path.join(schemaDir, file);
  if (!fs.existsSync(fullPath)) {
    console.error(`Missing schema: ${file}`);
    hasError = true;
    continue;
  }

  try {
    const text = fs.readFileSync(fullPath, "utf8");
    JSON.parse(text);
    console.log(`OK: ${file}`);
  } catch (error) {
    console.error(`Invalid JSON in ${file}: ${error.message}`);
    hasError = true;
  }
}

if (hasError) {
  process.exit(1);
}

console.log("All schemas are present and valid JSON.");
