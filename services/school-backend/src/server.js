const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

const VALID_LEVELS = ["R1", "R2", "R3"];
const VALID_CONSENT = ["granted", "revoked", "not_granted"];
const VALID_CHANNELS = ["work", "finance", "mixed"];
const VALID_ROLES = ["admin", "school", "integration", "network"];

const dataDir = path.resolve(__dirname, "../data");
const dataPath = path.join(dataDir, "store.json");

function defaultState() {
  return {
    riskEvents: [],
    consentAuditEvents: [],
    financeProviderRegistry: [],
    financeOffers: [],
    networkSignals: [],
    auditEvents: [],
    lastAuditHash: "GENESIS"
  };
}

function loadState() {
  try {
    if (!fs.existsSync(dataPath)) {
      fs.mkdirSync(dataDir, { recursive: true });
      return defaultState();
    }
    const parsed = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    return { ...defaultState(), ...parsed };
  } catch (_error) {
    return defaultState();
  }
}

const state = loadState();

function persistState() {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(dataPath, JSON.stringify(state, null, 2), "utf8");
}

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

function getAuthConfig() {
  return {
    admin: process.env.ADMIN_API_KEY || "",
    school: process.env.SCHOOL_API_KEY || "",
    integration: process.env.INTEGRATION_API_KEY || "",
    network: process.env.NETWORK_API_KEY || ""
  };
}

function isAuthConfigured() {
  const cfg = getAuthConfig();
  return Object.values(cfg).some(Boolean);
}

function resolveRole(req) {
  const key = req.header("x-api-key");
  const cfg = getAuthConfig();
  if (!key) return null;
  for (const role of VALID_ROLES) {
    if (cfg[role] && cfg[role] === key) {
      return role;
    }
  }
  return null;
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!isAuthConfigured()) {
      req.authRole = "demo";
      return next();
    }
    const role = resolveRole(req);
    if (!role) {
      return res.status(401).json(buildEnvelope(false, "Missing or invalid API key", null, "UNAUTHORIZED"));
    }
    if (!roles.includes(role)) {
      return res.status(403).json(buildEnvelope(false, "Role not allowed", null, "FORBIDDEN"));
    }
    req.authRole = role;
    return next();
  };
}

function appendAuditEvent({ actor, action, resource, detail }) {
  const timestamp = new Date().toISOString();
  const payload = {
    audit_event_id: `audit_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    timestamp,
    actor,
    action,
    resource,
    detail,
    previous_hash: state.lastAuditHash
  };
  const hash = crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  const record = { ...payload, hash };
  state.auditEvents.push(record);
  state.lastAuditHash = hash;
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
      term_months: 12,
      eligibility: "Full-time student with valid ID and repayment source.",
      integration_status: "testing",
      institution_verified: true,
      application_url: "https://example.org/regulated-student-credit",
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
      term_months: 12,
      eligibility: "Full-time student, no active delinquency in campus account.",
      integration_status: "demo",
      institution_verified: true,
      application_url: "https://example.org/demo-bank-education-installment",
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

function buildRiskSummary(items) {
  const summary = {
    total_events: items.length,
    by_risk_level: { R1: 0, R2: 0, R3: 0 },
    by_channel_type: { work: 0, finance: 0, mixed: 0 },
    consent: { granted: 0, revoked: 0, not_granted: 0 },
    by_source: { browser: 0, network: 0, integration: 0, demo: 0, unknown: 0 }
  };

  for (const item of items) {
    if (summary.by_risk_level[item.risk_level] !== undefined) summary.by_risk_level[item.risk_level] += 1;
    if (summary.by_channel_type[item.channel_type] !== undefined) summary.by_channel_type[item.channel_type] += 1;
    if (summary.consent[item.consent_state] !== undefined) summary.consent[item.consent_state] += 1;
    const source = item.source || "unknown";
    if (summary.by_source[source] !== undefined) summary.by_source[source] += 1;
    else summary.by_source.unknown += 1;
  }
  return summary;
}

function createDemoEvent({ id, level, channel, consent, reasons, recommendations, offsetMinutes }) {
  return {
    event_id: id,
    timestamp: new Date(Date.now() - offsetMinutes * 60 * 1000).toISOString(),
    risk_level: level,
    why_flagged: reasons,
    recommended_action: "Review alternatives before loan application.",
    consent_state: consent,
    channel_type: channel,
    why_recommended: recommendations,
    source: "demo",
    cost_snapshot: {
      apr: level === "R3" ? 42 : level === "R2" ? 26 : 12,
      principal: 5000,
      months: 12,
      estimated_monthly_payment: level === "R3" ? 521.6 : 477.3
    }
  };
}

function createNetworkRiskEvent(signal) {
  const riskLevel = signal.confidence >= 0.85 ? "R3" : signal.confidence >= 0.6 ? "R2" : "R1";
  return {
    event_id: `net_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    timestamp: signal.observed_at || new Date().toISOString(),
    risk_level: riskLevel,
    why_flagged: [`Network signal: ${signal.l7_signal || "loan-related traffic pattern"}`],
    recommended_action: "Trigger support workflow and notify school support team.",
    consent_state: "not_granted",
    channel_type: "mixed",
    why_recommended: ["Derived from network safety policy signal."],
    source: "network",
    network_signal_id: signal.signal_id
  };
}

app.use("/console", express.static(path.resolve(__dirname, "../../../apps/school-console")));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "school-backend" });
});

app.get("/ready", (_req, res) => {
  res.json({ ok: true, persisted_events: state.riskEvents.length, providers: state.financeProviderRegistry.length });
});

app.get("/metrics", (_req, res) => {
  const summary = buildRiskSummary(state.riskEvents);
  res.type("text/plain").send(
    [
      `risk_events_total ${summary.total_events}`,
      `risk_events_r1 ${summary.by_risk_level.R1}`,
      `risk_events_r2 ${summary.by_risk_level.R2}`,
      `risk_events_r3 ${summary.by_risk_level.R3}`,
      `consent_events_total ${state.consentAuditEvents.length}`,
      `network_signals_total ${state.networkSignals.length}`,
      `finance_offers_total ${state.financeOffers.length}`,
      `audit_events_total ${state.auditEvents.length}`
    ].join("\n")
  );
});

app.post("/api/risk-events", (req, res) => {
  const payload = req.body || {};
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
    source: payload.source || "browser",
    cost_snapshot: payload.cost_snapshot || null
  };

  state.riskEvents.push(normalized);
  appendAuditEvent({
    actor: "student",
    action: "risk_event_uploaded",
    resource: normalized.event_id,
    detail: { risk_level: normalized.risk_level, source: normalized.source }
  });
  persistState();
  return res.status(201).json(buildEnvelope(true, "Event accepted", { event_id: payload.event_id }));
});

app.get("/api/risk-events", requireRole(["admin", "school", "demo"]), (req, res) => {
  const { risk_level, channel_type, from, to, page = "1", page_size = "50", source } = req.query;
  const fromDate = parseDateValue(from);
  const toDate = parseDateValue(to);
  const pageNumber = Math.max(Number(page) || 1, 1);
  const pageSize = Math.min(Math.max(Number(page_size) || 50, 1), 200);

  const filtered = state.riskEvents.filter((event) => {
    if (risk_level && event.risk_level !== risk_level) return false;
    if (channel_type && event.channel_type !== channel_type) return false;
    if (source && event.source !== source) return false;
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

app.get("/api/risk-events/export.csv", requireRole(["admin", "school", "demo"]), (_req, res) => {
  const header = [
    "event_id",
    "timestamp",
    "risk_level",
    "channel_type",
    "consent_state",
    "source",
    "why_flagged",
    "why_recommended"
  ].join(",");
  const rows = state.riskEvents.map((event) =>
    toCsvRow({
      ...event,
      why_flagged: [...(event.why_flagged || []), `source=${event.source || "unknown"}`]
    })
  );
  const csv = [header, ...rows].join("\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="risk-events.csv"');
  return res.status(200).send(csv);
});

app.get("/api/risk-events/summary", requireRole(["admin", "school", "demo"]), (_req, res) => {
  return res.json(buildEnvelope(true, "OK", buildRiskSummary(state.riskEvents)));
});

app.get("/api/channels/work-study", (_req, res) => {
  return res.json(buildEnvelope(true, "OK", buildMockWorkStudyOptions()));
});

app.get("/api/channels/finance", async (_req, res) => {
  const institutionOffers = state.financeOffers
    .filter((offer) => offer.status === "active")
    .map((offer) => ({ ...offer, data_source: offer.data_source || "institution_api" }));
  if (institutionOffers.length > 0) {
    return res.json(buildEnvelope(true, "OK", institutionOffers));
  }
  try {
    const liveOptions = await fetchSemiRealFinanceOptions();
    return res.json(buildEnvelope(true, "OK", liveOptions));
  } catch (error) {
    return res.json(
      buildEnvelope(
        true,
        `Upstream unavailable, fallback to mock: ${error.message}`,
        buildMockFinanceOptions(),
        "UPSTREAM_UNAVAILABLE"
      )
    );
  }
});

app.post("/api/consent-events", (req, res) => {
  const payload = req.body || {};
  const consentState = payload.consent_state;
  if (!consentState || !VALID_CONSENT.includes(consentState)) {
    return res.status(400).json(buildEnvelope(false, "Invalid consent state", null, "INVALID_SCHEMA"));
  }
  const event = {
    consent_event_id: `consent_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    actor: payload.actor || "student",
    consent_state: consentState,
    note: payload.note || ""
  };
  state.consentAuditEvents.push(event);
  appendAuditEvent({
    actor: event.actor,
    action: "consent_state_updated",
    resource: event.consent_event_id,
    detail: { consent_state: event.consent_state }
  });
  persistState();
  return res.status(201).json(buildEnvelope(true, "Consent event recorded", event));
});

app.get("/api/consent-events", requireRole(["admin", "school", "demo"]), (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 500);
  const items = state.consentAuditEvents.slice(-limit).reverse();
  return res.json(buildEnvelope(true, "OK", { items, total: state.consentAuditEvents.length, limit }));
});

app.get("/api/audit-events", requireRole(["admin"]), (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 1000);
  const items = state.auditEvents.slice(-limit).reverse();
  return res.json(buildEnvelope(true, "OK", { items, total: state.auditEvents.length, limit }));
});

app.post("/api/network/signals", requireRole(["admin", "network", "demo"]), (req, res) => {
  const payload = req.body || {};
  if (!payload.session_id || !payload.domain_hash) {
    return res.status(400).json(buildEnvelope(false, "Invalid network signal", null, "INVALID_SCHEMA"));
  }
  const signal = {
    signal_id: `net_sig_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    session_id: payload.session_id,
    observed_at: payload.observed_at || new Date().toISOString(),
    domain_hash: payload.domain_hash,
    category: payload.category || "unknown",
    l7_signal: payload.l7_signal || "unspecified",
    confidence: Number(payload.confidence || 0.5)
  };
  state.networkSignals.push(signal);
  if (signal.category === "loan" || signal.confidence >= 0.6) {
    const networkRiskEvent = createNetworkRiskEvent(signal);
    state.riskEvents.push(networkRiskEvent);
  }
  appendAuditEvent({
    actor: req.authRole || "network",
    action: "network_signal_ingested",
    resource: signal.signal_id,
    detail: { confidence: signal.confidence, category: signal.category }
  });
  persistState();
  return res.status(201).json(buildEnvelope(true, "Network signal ingested", signal));
});

app.get("/api/network/signals", requireRole(["admin", "network", "school", "demo"]), (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 1000);
  const items = state.networkSignals.slice(-limit).reverse();
  return res.json(buildEnvelope(true, "OK", { items, total: state.networkSignals.length, limit }));
});

app.post("/api/integrations/providers/register", requireRole(["admin", "integration", "demo"]), (req, res) => {
  const payload = req.body || {};
  if (!payload.provider_id || !payload.provider_name) {
    return res.status(400).json(buildEnvelope(false, "Missing provider metadata", null, "INVALID_SCHEMA"));
  }
  const provider = {
    provider_id: payload.provider_id,
    provider_name: payload.provider_name,
    status: payload.status || "active",
    signing_status: payload.signing_status || "pending",
    compliance_status: payload.compliance_status || "pending",
    callback_url: payload.callback_url || "",
    updated_at: new Date().toISOString()
  };
  const existingIndex = state.financeProviderRegistry.findIndex((item) => item.provider_id === provider.provider_id);
  if (existingIndex >= 0) state.financeProviderRegistry[existingIndex] = provider;
  else state.financeProviderRegistry.push(provider);

  appendAuditEvent({
    actor: req.authRole || "integration",
    action: "provider_registered",
    resource: provider.provider_id,
    detail: { status: provider.status, compliance_status: provider.compliance_status }
  });
  persistState();
  return res.json(buildEnvelope(true, "Provider registry updated", provider));
});

app.get("/api/integrations/providers", requireRole(["admin", "integration", "school", "demo"]), (_req, res) => {
  return res.json(buildEnvelope(true, "OK", state.financeProviderRegistry));
});

function syncOffersForProvider({ providerId, offers, actor }) {
  const normalized = offers.map((offer, index) => ({
    recommendation_id: offer.recommendation_id || `${providerId}_offer_${index + 1}`,
    title: offer.title || `Provider ${providerId} Offer ${index + 1}`,
    channel_type: "finance",
    apr: Number(offer.apr || 0),
    term_months: Number(offer.term_months || offer.months || 12),
    eligibility: offer.eligibility || "Refer to institution policy.",
    integration_status: offer.integration_status || "signed",
    institution_verified: offer.institution_verified !== undefined ? Boolean(offer.institution_verified) : true,
    application_url: offer.application_url || "",
    provider_name: offer.provider_name || providerId,
    next_action: offer.next_action || "Review institution contract terms.",
    why_recommended: offer.why_recommended || ["Imported from partner institution API."],
    data_source: "institution_api",
    status: offer.status || "active",
    provider_id: providerId,
    synced_at: new Date().toISOString()
  }));
  state.financeOffers = state.financeOffers.filter((offer) => offer.provider_id !== providerId);
  state.financeOffers.push(...normalized);
  appendAuditEvent({
    actor,
    action: "provider_offers_synced",
    resource: providerId,
    detail: { offer_count: normalized.length }
  });
  persistState();
  return normalized.length;
}

app.post("/api/integrations/providers/:providerId/offers/sync", requireRole(["admin", "integration", "demo"]), (req, res) => {
  const providerId = req.params.providerId;
  const payloadOffers = Array.isArray(req.body?.offers) ? req.body.offers : [];
  if (payloadOffers.length === 0) {
    return res.status(400).json(buildEnvelope(false, "Missing offers list", null, "INVALID_SCHEMA"));
  }
  const count = syncOffersForProvider({
    providerId,
    offers: payloadOffers,
    actor: req.authRole || "integration"
  });
  return res.json(buildEnvelope(true, "Provider offers synced", { provider_id: providerId, offers: count }));
});

app.post("/api/integrations/providers/:providerId/webhooks/offers", requireRole(["admin", "integration", "demo"]), (req, res) => {
  const providerId = req.params.providerId;
  const payloadOffers = Array.isArray(req.body?.offers) ? req.body.offers : [];
  if (payloadOffers.length === 0) {
    return res.status(400).json(buildEnvelope(false, "Missing offers list", null, "INVALID_SCHEMA"));
  }
  const count = syncOffersForProvider({
    providerId,
    offers: payloadOffers,
    actor: req.authRole || "integration"
  });
  return res.json(buildEnvelope(true, "Webhook offers processed", { provider_id: providerId, offers: count }));
});

app.post("/api/demo/seed", requireRole(["admin", "school", "demo"]), (_req, res) => {
  state.riskEvents.length = 0;
  state.consentAuditEvents.length = 0;
  state.networkSignals.length = 0;
  state.financeProviderRegistry.length = 0;
  state.financeOffers.length = 0;

  const seededEvents = [
    createDemoEvent({
      id: "demo_r1_001",
      level: "R1",
      channel: "work",
      consent: "granted",
      reasons: ["Browsing low-intensity loan-related page."],
      recommendations: ["Campus work-study listing reduces borrowing pressure."],
      offsetMinutes: 25
    }),
    createDemoEvent({
      id: "demo_r2_001",
      level: "R2",
      channel: "mixed",
      consent: "granted",
      reasons: ["Fill stage reached with marketing-risk phrases."],
      recommendations: ["Work-first approach recommended.", "Use regulated finance option only if needed."],
      offsetMinutes: 18
    }),
    createDemoEvent({
      id: "demo_r3_001",
      level: "R3",
      channel: "mixed",
      consent: "granted",
      reasons: ["Submit stage with high APR and potential scam wording."],
      recommendations: ["Pause immediately.", "Contact support and use regulated channel."],
      offsetMinutes: 10
    })
  ];
  state.riskEvents.push(...seededEvents);

  state.consentAuditEvents.push(
    {
      consent_event_id: `consent_seed_${Date.now()}_1`,
      timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      actor: "student",
      consent_state: "granted",
      note: "Seeded demo consent grant."
    },
    {
      consent_event_id: `consent_seed_${Date.now()}_2`,
      timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      actor: "student",
      consent_state: "revoked",
      note: "Seeded demo consent revoke."
    }
  );
  persistState();
  return res.json(
    buildEnvelope(true, "Demo data seeded", {
      risk_events: state.riskEvents.length,
      consent_events: state.consentAuditEvents.length
    })
  );
});

app.post("/api/demo/reset", requireRole(["admin", "school", "demo"]), (_req, res) => {
  state.riskEvents.length = 0;
  state.consentAuditEvents.length = 0;
  state.networkSignals.length = 0;
  state.financeOffers.length = 0;
  state.financeProviderRegistry.length = 0;
  persistState();
  return res.json(buildEnvelope(true, "Demo data reset", { risk_events: 0, consent_events: 0 }));
});

const port = process.env.PORT || 8787;
app.listen(port, () => {
  console.log(`school-backend listening on :${port}`);
});
