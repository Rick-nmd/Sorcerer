function buildHeaders(apiKey) {
  const headers = { "Content-Type": "application/json" };
  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }
  return headers;
}

function assertApiBaseUrl(apiBaseUrl) {
  const base = String(apiBaseUrl || "").trim();
  if (!base) {
    throw new Error("Backend URL is required. Set an HTTPS API root in Settings.");
  }
  return base.replace(/\/$/, "");
}

async function readJsonResponse(response) {
  try {
    return await response.json();
  } catch (_error) {
    throw new Error(`Invalid API response (HTTP ${response.status}). Check Backend URL.`);
  }
}

export async function uploadRiskEvent({ apiBaseUrl, eventPayload, apiKey = "" }) {
  const baseUrl = assertApiBaseUrl(apiBaseUrl);
  const url = `${baseUrl}/api/risk-events`;
  const response = await fetch(url, {
    method: "POST",
    headers: buildHeaders(apiKey),
    body: JSON.stringify(eventPayload)
  });

  const json = await readJsonResponse(response);
  return {
    ok: response.ok,
    status: response.status,
    body: json
  };
}

export async function uploadConsentEvent({ apiBaseUrl, consentPayload, apiKey = "" }) {
  const baseUrl = assertApiBaseUrl(apiBaseUrl);
  const url = `${baseUrl}/api/consent-events`;
  const response = await fetch(url, {
    method: "POST",
    headers: buildHeaders(apiKey),
    body: JSON.stringify(consentPayload)
  });

  const json = await readJsonResponse(response);
  return {
    ok: response.ok,
    status: response.status,
    body: json
  };
}

async function getJson(url, apiKey = "") {
  const response = await fetch(url, {
    headers: apiKey ? { "x-api-key": apiKey } : {}
  });
  const json = await readJsonResponse(response);
  if (!response.ok || !json.success) {
    const message = json?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }
  return json.data || [];
}

export async function fetchChannelRecommendations({ apiBaseUrl, riskLevel, apiKey = "" }) {
  const baseUrl = assertApiBaseUrl(apiBaseUrl);

  if (riskLevel === "R1") {
    const work = await getJson(`${baseUrl}/api/channels/work-study`, apiKey);
    return work;
  }

  const [work, finance] = await Promise.all([
    getJson(`${baseUrl}/api/channels/work-study`, apiKey),
    getJson(`${baseUrl}/api/channels/finance`, apiKey)
  ]);
  return [...work, ...finance];
}

export async function fetchStudentConsentProfile({ apiBaseUrl, sessionId, apiKey = "" }) {
  const baseUrl = assertApiBaseUrl(apiBaseUrl);
  return getJson(`${baseUrl}/api/student/consent-profile?session_id=${encodeURIComponent(sessionId)}`, apiKey);
}

export async function fetchStudentHistory({ apiBaseUrl, sessionId, limit = 20, apiKey = "" }) {
  const baseUrl = assertApiBaseUrl(apiBaseUrl);
  return getJson(
    `${baseUrl}/api/student/history?session_id=${encodeURIComponent(sessionId)}&limit=${encodeURIComponent(limit)}`,
    apiKey
  );
}

export async function fetchSupportResources({ apiBaseUrl, apiKey = "", lang = "en" }) {
  const baseUrl = assertApiBaseUrl(apiBaseUrl);
  const safeLang = lang === "zh" ? "zh" : "en";
  return getJson(`${baseUrl}/api/support/resources?lang=${safeLang}`, apiKey);
}
