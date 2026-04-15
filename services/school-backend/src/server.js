const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const riskEvents = [];

const mockWorkStudyJobs = [
  {
    job_id: "ws_001",
    title: "Library Assistant (Part-time)",
    channel_type: "work",
    provider_name: "Campus Library",
    hourly_rate: 18,
    next_action: "Submit resume at campus portal"
  },
  {
    job_id: "ws_002",
    title: "Student IT Helpdesk",
    channel_type: "work",
    provider_name: "Campus IT Office",
    hourly_rate: 20,
    next_action: "Book a 15-minute interview slot"
  }
];

const mockFinanceOptions = [
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
];

function makeEnvelope(success, message, data, errorCode) {
  return {
    trace_id: `trace_${Date.now()}`,
    success,
    message,
    data,
    error_code: errorCode
  };
}

function isValidRiskLevel(value) {
  return value === "R1" || value === "R2" || value === "R3";
}

function escapeCsv(value) {
  const text = value == null ? "" : String(value);
  const escaped = text.replace(/"/g, "\"\"");
  return `"${escaped}"`;
}

function filterEvents(events, query) {
  const { risk_level, channel_type, from, to } = query;
  const fromMs = from ? Date.parse(String(from)) : null;
  const toMs = to ? Date.parse(String(to)) : null;

  return events.filter((event) => {
    if (risk_level && event.risk_level !== risk_level) {
      return false;
    }
    if (channel_type && event.channel_type !== channel_type) {
      return false;
    }

    const eventTs = Date.parse(event.timestamp);
    if (fromMs && !Number.isNaN(eventTs) && eventTs < fromMs) {
      return false;
    }
    if (toMs && !Number.isNaN(eventTs) && eventTs > toMs) {
      return false;
    }
    return true;
  });
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "school-backend" });
});

app.post("/api/risk-events", (req, res) => {
  const payload = req.body || {};
  const parsedTime = Date.parse(payload.timestamp);
  if (
    !payload.event_id ||
    !payload.risk_level ||
    !payload.timestamp ||
    Number.isNaN(parsedTime) ||
    !isValidRiskLevel(payload.risk_level)
  ) {
    return res.status(400).json(makeEnvelope(false, "Invalid payload", null, "INVALID_SCHEMA"));
  }

  if ((payload.risk_level === "R2" || payload.risk_level === "R3") && payload.consent_state !== "granted") {
    return res
      .status(403)
      .json(makeEnvelope(false, "Consent required for high-risk event processing", null, "CONSENT_REQUIRED"));
  }

  riskEvents.push(payload);
  return res.status(201).json(makeEnvelope(true, "Event accepted", { event_id: payload.event_id }, null));
});

app.get("/api/risk-events", (req, res) => {
  const filtered = filterEvents(riskEvents, req.query);
  res.json(makeEnvelope(true, "OK", filtered, null));
});

app.get("/api/risk-events/export.csv", (req, res) => {
  const rows = filterEvents(riskEvents, req.query);
  const header = ["event_id", "timestamp", "risk_level", "channel_type", "consent_state"];
  const lines = [
    header.join(","),
    ...rows.map((event) =>
      [
        escapeCsv(event.event_id),
        escapeCsv(event.timestamp),
        escapeCsv(event.risk_level),
        escapeCsv(event.channel_type),
        escapeCsv(event.consent_state)
      ].join(",")
    )
  ];

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=\"risk-events.csv\"");
  res.send(lines.join("\n"));
});

app.get("/api/channels/work-study", (_req, res) => {
  res.json(makeEnvelope(true, "OK", mockWorkStudyJobs, null));
});

app.get("/api/channels/finance", async (_req, res) => {
  const upstreamUrl = process.env.FINANCE_UPSTREAM_URL;
  if (!upstreamUrl) {
    return res.json(
      makeEnvelope(
        true,
        "Finance upstream not configured; fallback to mock",
        mockFinanceOptions,
        "UPSTREAM_UNAVAILABLE"
      )
    );
  }

  try {
    const upstreamResp = await fetch(upstreamUrl);
    if (!upstreamResp.ok) {
      throw new Error(`upstream status ${upstreamResp.status}`);
    }

    const upstreamData = await upstreamResp.json();
    const normalized = Array.isArray(upstreamData)
      ? upstreamData
      : Array.isArray(upstreamData.data)
        ? upstreamData.data
        : [];

    const withSource = normalized.map((item) => ({
      ...item,
      data_source: item.data_source || "upstream"
    }));

    return res.json(makeEnvelope(true, "OK", withSource, null));
  } catch (_error) {
    return res.json(
      makeEnvelope(
        true,
        "Upstream unavailable; fallback to mock",
        mockFinanceOptions,
        "UPSTREAM_UNAVAILABLE"
      )
    );
  }
});

const port = process.env.PORT || 8787;
app.listen(port, () => {
  console.log(`school-backend listening on :${port}`);
});
