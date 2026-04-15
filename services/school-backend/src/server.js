const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const riskEvents = [];
const VALID_LEVELS = ["R1", "R2", "R3"];
const VALID_CONSENT = ["granted", "revoked", "not_granted"];
const VALID_CHANNELS = ["work", "finance", "mixed"];

function buildEnvelope(success, message, data, errorCode = null) {
  return {
    trace_id: `trace_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    success,
    message,
    data,
    error_code: errorCode
  };
}

function parseDateValue(raw) {
  if (!raw) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function isInvalidPayload(payload) {
  if (!payload.event_id || !payload.timestamp || !payload.risk_level) {
    return true;
  }

  if (!VALID_LEVELS.includes(payload.risk_level)) {
    return true;
  }

  if (payload.consent_state && !VALID_CONSENT.includes(payload.consent_state)) {
    return true;
  }

  if (payload.channel_type && !VALID_CHANNELS.includes(payload.channel_type)) {
    return true;
  }

  return parseDateValue(payload.timestamp) === null;
}

function toCsvRow(event) {
  return [
    event.event_id || "",
    event.timestamp || "",
    event.risk_level || "",
    event.channel_type || "",
    event.consent_state || "",
    (event.why_flagged || []).join(" | "),
    (event.why_recommended || []).join(" | ")
  ]
    .map((value) => `"${String(value).replaceAll('"', '""')}"`)
    .join(",");
}

async function fetchSemiRealFinanceOptions() {
  const endpoint = "https://api.frankfurter.app/latest?from=CNY&to=USD";
  const response = await fetch(endpoint, { method: "GET" });
  if (!response.ok) {
    throw new Error(`Upstream status ${response.status}`);
  }

  const data = await response.json();
  const rate = data?.rates?.USD;
  if (typeof rate !== "number") {
    throw new Error("Upstream response missing USD rate");
  }

  return [
    {
      recommendation_id: "finance_live_001",
      title: "Regulated Education Credit (Live Indexed)",
      channel_type: "finance",
      apr: Number((7.5 + Math.min(rate, 1) * 2).toFixed(2)),
      provider_name: "Partnered Regulated Institution",
      next_action: "Compare APR and full repayment schedule before approval.",
      why_recommended: [
        "Live market data path confirmed from public API.",
        "Regulated channel with transparent repayment terms."
      ],
      data_source: "live"
    }
  ];
}

function buildMockFinanceOptions() {
  return [
    {
      recommendation_id: "finance_mock_001",
      title: "Bank Education Installment (Demo)",
      channel_type: "finance",
      apr: 8.5,
      provider_name: "Demo Bank",
      next_action: "Bring student ID and apply via official portal.",
      why_recommended: [
        "Lower APR than typical predatory products.",
        "Regulated provider with clear contract terms."
      ],
      data_source: "mock"
    }
  ];
}

function buildMockWorkStudyOptions() {
  return [
    {
      recommendation_id: "work_001",
      channel_type: "work",
      title: "Library Assistant (Campus)",
      provider_name: "Campus Library",
      next_action: "Submit availability and student ID to apply.",
      why_recommended: [
        "Stable part-time income can reduce borrowing urgency.",
        "Campus role has transparent hourly payment."
      ],
      data_source: "mock"
    },
    {
      recommendation_id: "work_002",
      channel_type: "work",
      title: "Teaching Support Assistant",
      provider_name: "Academic Affairs Office",
      next_action: "Apply through campus work-study portal.",
      why_recommended: [
        "Short shifts fit class schedule.",
        "Lower financial risk than emergency lending."
      ],
      data_source: "mock"
    }
  ];
}

app.use("/console", express.static(path.resolve(__dirname, "../../../apps/school-console")));

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
<<<<<<< HEAD
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
=======
  if (isInvalidPayload(payload)) {
    return res.status(400).json(buildEnvelope(false, "Invalid payload", null, "INVALID_SCHEMA"));
  }

  const consentState = payload.consent_state || "not_granted";
  if ((payload.risk_level === "R2" || payload.risk_level === "R3") && consentState !== "granted") {
    return res
      .status(403)
      .json(buildEnvelope(false, "Consent is required for R2/R3 upload", null, "CONSENT_REQUIRED"));
  }

  const normalized = {
    event_id: payload.event_id,
    timestamp: payload.timestamp,
    risk_level: payload.risk_level,
    why_flagged: payload.why_flagged || [],
    recommended_action: payload.recommended_action || "",
    consent_state: consentState,
    channel_type: payload.channel_type || "work",
    why_recommended: payload.why_recommended || [],
    cost_snapshot: payload.cost_snapshot || null
  };

  riskEvents.push(normalized);
  return res.status(201).json(buildEnvelope(true, "Event accepted", { event_id: payload.event_id }));
});

app.get("/api/risk-events", (req, res) => {
  const { risk_level, channel_type, from, to, page = "1", page_size = "50" } = req.query;
  const fromDate = parseDateValue(from);
  const toDate = parseDateValue(to);
  const pageNumber = Math.max(Number(page) || 1, 1);
  const pageSize = Math.min(Math.max(Number(page_size) || 50, 1), 200);

  const filtered = riskEvents.filter((event) => {
    if (risk_level && event.risk_level !== risk_level) return false;
    if (channel_type && event.channel_type !== channel_type) return false;

    const eventDate = parseDateValue(event.timestamp);
    if (fromDate && eventDate && eventDate < fromDate) return false;
    if (toDate && eventDate && eventDate > toDate) return false;
    return true;
  });

  const start = (pageNumber - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  return res.json(
    buildEnvelope(true, "OK", {
      items: paged,
      total: filtered.length,
      page: pageNumber,
      page_size: pageSize
    })
  );
});

app.get("/api/risk-events/export.csv", (_req, res) => {
  const header = [
    "event_id",
    "timestamp",
    "risk_level",
    "channel_type",
    "consent_state",
    "why_flagged",
    "why_recommended"
  ].join(",");
  const rows = riskEvents.map(toCsvRow);
  const csv = [header, ...rows].join("\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="risk-events.csv"');
  return res.status(200).send(csv);
});

app.get("/api/channels/work-study", (_req, res) => {
  return res.json(buildEnvelope(true, "OK", buildMockWorkStudyOptions()));
});

app.get("/api/channels/finance", async (_req, res) => {
  try {
    const liveOptions = await fetchSemiRealFinanceOptions();
    return res.json(buildEnvelope(true, "OK", liveOptions));
  } catch (error) {
    return res.json(
      buildEnvelope(
        true,
        `Upstream unavailable, fallback to mock: ${error.message}`,
        buildMockFinanceOptions(),
>>>>>>> a3a06c2fdb10a320b8f63a37ede0481e42074734
        "UPSTREAM_UNAVAILABLE"
      )
    );
  }
});

const port = process.env.PORT || 8787;
app.listen(port, () => {
  console.log(`school-backend listening on :${port}`);
});
