async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const json = await response.json();
  return { response, json };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const baseUrl = process.env.API_BASE_URL || "http://localhost:8787";
  console.log(`[smoke] Base URL: ${baseUrl}`);

  const health = await requestJson(`${baseUrl}/health`);
  assert(health.response.ok && health.json.ok, "Health check failed");
  console.log("[smoke] Health check passed");

  const blockedPayload = {
    event_id: "event_smoke_blocked",
    timestamp: "2026-04-15T19:00:00.000Z",
    risk_level: "R3",
    why_flagged: ["submit_stage"],
    recommended_action: "pause_and_review",
    consent_state: "not_granted",
    channel_type: "mixed"
  };

  const blocked = await requestJson(`${baseUrl}/api/risk-events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(blockedPayload)
  });
  assert(blocked.response.status === 403, `Expected 403, got ${blocked.response.status}`);
  console.log("[smoke] Consent gate check passed");

  const okPayload = {
    event_id: `event_smoke_ok_${Date.now()}`,
    timestamp: new Date().toISOString(),
    risk_level: "R2",
    why_flagged: ["fill_stage"],
    recommended_action: "show_alternatives",
    consent_state: "granted",
    channel_type: "mixed",
    why_recommended: ["income_first", "regulated_channel"]
  };

  const upload = await requestJson(`${baseUrl}/api/risk-events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(okPayload)
  });
  assert(upload.response.ok && upload.json.success, "Upload check failed");
  console.log("[smoke] Upload check passed");

  const query = await requestJson(`${baseUrl}/api/risk-events?risk_level=R2&channel_type=mixed`);
  assert(query.response.ok && query.json.success, "Query check failed");
  console.log("[smoke] Query check passed");

  const csvResponse = await fetch(`${baseUrl}/api/risk-events/export.csv`);
  assert(csvResponse.ok, "CSV export check failed");
  console.log("[smoke] CSV export check passed");

  const work = await requestJson(`${baseUrl}/api/channels/work-study`);
  assert(work.response.ok && work.json.success, "Work-study endpoint failed");
  const finance = await requestJson(`${baseUrl}/api/channels/finance`);
  assert(finance.response.ok && finance.json.success, "Finance endpoint failed");
  console.log("[smoke] Channel endpoint checks passed");

  const consentWrite = await requestJson(`${baseUrl}/api/consent-events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      consent_state: "revoked",
      actor: "student",
      note: "smoke-check"
    })
  });
  assert(consentWrite.response.ok && consentWrite.json.success, "Consent audit write failed");
  const consentRead = await requestJson(`${baseUrl}/api/consent-events?limit=5`);
  assert(consentRead.response.ok && consentRead.json.success, "Consent audit read failed");
  console.log("[smoke] Consent audit endpoint checks passed");

  console.log("[smoke] All checks passed.");
}

main().catch((error) => {
  console.error(`[smoke] Failed: ${error.message}`);
  process.exit(1);
});
