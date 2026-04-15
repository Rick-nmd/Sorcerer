const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const riskEvents = [];

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "school-backend" });
});

app.post("/api/risk-events", (req, res) => {
  const payload = req.body || {};
  if (!payload.event_id || !payload.risk_level || !payload.timestamp) {
    return res.status(400).json({
      trace_id: `trace_${Date.now()}`,
      success: false,
      message: "Invalid payload",
      data: null,
      error_code: "INVALID_SCHEMA"
    });
  }

  riskEvents.push(payload);
  return res.status(201).json({
    trace_id: `trace_${Date.now()}`,
    success: true,
    message: "Event accepted",
    data: { event_id: payload.event_id },
    error_code: null
  });
});

app.get("/api/risk-events", (req, res) => {
  const { risk_level } = req.query;
  const filtered = risk_level
    ? riskEvents.filter((event) => event.risk_level === risk_level)
    : riskEvents;

  res.json({
    trace_id: `trace_${Date.now()}`,
    success: true,
    message: "OK",
    data: filtered,
    error_code: null
  });
});

app.get("/api/channels/finance", (_req, res) => {
  res.json({
    trace_id: `trace_${Date.now()}`,
    success: true,
    message: "OK",
    data: [
      {
        recommendation_id: "finance_mock_001",
        title: "Bank Education Installment (Demo)",
        channel_type: "finance",
        apr: 8.5,
        provider_name: "Demo Bank",
        next_action: "Bring student ID and apply via official portal",
        why_recommended: [
          "Lower APR than typical predatory products",
          "Regulated provider with clear contract terms"
        ],
        data_source: "mock"
      }
    ],
    error_code: null
  });
});

const port = process.env.PORT || 8787;
app.listen(port, () => {
  console.log(`school-backend listening on :${port}`);
});
