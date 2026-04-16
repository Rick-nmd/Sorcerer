async function requestJson(url, options = {}) {
  const apiKey = process.env.API_KEY || "";
  const mergedHeaders = { ...(options.headers || {}) };
  if (apiKey) {
    mergedHeaders["x-api-key"] = apiKey;
  }
  const response = await fetch(url, { ...options, headers: mergedHeaders });
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
  const studentSessionId = `smoke_student_${Date.now()}`;
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
    session_id: studentSessionId,
    timestamp: new Date().toISOString(),
    risk_level: "R2",
    why_flagged: ["fill_stage"],
    recommended_action: "show_alternatives",
    consent_state: "granted",
    channel_type: "mixed",
    why_recommended: ["income_first", "regulated_channel"],
    consent_scopes: {
      telemetry: true,
      school_support: true,
      partner_offers: false
    }
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

  const summary = await requestJson(`${baseUrl}/api/risk-events/summary`);
  assert(summary.response.ok && summary.json.success, "Summary check failed");
  console.log("[smoke] Summary check passed");

  const csvResponse = await fetch(`${baseUrl}/api/risk-events/export.csv`, {
    headers: process.env.API_KEY ? { "x-api-key": process.env.API_KEY } : {}
  });
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
      session_id: studentSessionId,
      consent_state: "revoked",
      actor: "student",
      note: "smoke-check",
      reason: "Testing layered consent",
      scopes: {
        telemetry: false,
        school_support: false,
        partner_offers: false
      }
    })
  });
  assert(consentWrite.response.ok && consentWrite.json.success, "Consent audit write failed");
  const consentRead = await requestJson(`${baseUrl}/api/consent-events?limit=5`);
  assert(consentRead.response.ok && consentRead.json.success, "Consent audit read failed");
  const consentProfiles = await requestJson(`${baseUrl}/api/consent-profiles?limit=5`);
  assert(consentProfiles.response.ok && consentProfiles.json.success, "Consent profile read failed");
  console.log("[smoke] Consent audit endpoint checks passed");

  const studentProfile = await requestJson(
    `${baseUrl}/api/student/consent-profile?session_id=${encodeURIComponent(studentSessionId)}`
  );
  assert(studentProfile.response.ok && studentProfile.json.success, "Student consent profile read failed");
  const studentHistory = await requestJson(
    `${baseUrl}/api/student/history?session_id=${encodeURIComponent(studentSessionId)}&limit=5`
  );
  assert(studentHistory.response.ok && studentHistory.json.success, "Student history read failed");
  const supportResources = await requestJson(`${baseUrl}/api/support/resources`);
  assert(supportResources.response.ok && supportResources.json.success, "Support resources read failed");
  console.log("[smoke] Student self-service and support endpoints passed");

  const networkWrite = await requestJson(`${baseUrl}/api/network/signals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: studentSessionId,
      domain_hash: "demo_hash_001",
      category: "loan",
      l7_signal: "urgent-loan-traffic",
      confidence: 0.91
    })
  });
  assert(networkWrite.response.ok && networkWrite.json.success, "Network signal write failed");
  const networkRead = await requestJson(`${baseUrl}/api/network/signals?limit=5`);
  assert(networkRead.response.ok && networkRead.json.success, "Network signal read failed");
  const auditRead = await requestJson(`${baseUrl}/api/audit-events?limit=5`);
  assert(auditRead.response.ok && auditRead.json.success, "Audit trail read failed");
  console.log("[smoke] Governance endpoint checks passed");

  const seed = await requestJson(`${baseUrl}/api/demo/seed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });
  assert(seed.response.ok && seed.json.success, "Demo seed endpoint failed");
  const reset = await requestJson(`${baseUrl}/api/demo/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });
  assert(reset.response.ok && reset.json.success, "Demo reset endpoint failed");
  console.log("[smoke] Demo seed/reset endpoint checks passed");

  console.log("[smoke] All checks passed.");
}

main().catch((error) => {
  console.error(`[smoke] Failed: ${error.message}`);
  process.exit(1);
});
