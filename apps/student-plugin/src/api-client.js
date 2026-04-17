function buildHeaders(apiKey) {
  const headers = { "Content-Type": "application/json" };
  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }
  return headers;
}

export async function uploadRiskEvent({ apiBaseUrl, eventPayload, apiKey = "" }) {
  const url = `${apiBaseUrl.replace(/\/$/, "")}/api/risk-events`;
  const response = await fetch(url, {
    method: "POST",
    headers: buildHeaders(apiKey),
    body: JSON.stringify(eventPayload)
  });

  const json = await response.json();
  return {
    ok: response.ok,
    status: response.status,
    body: json
  };
}

export async function uploadConsentEvent({ apiBaseUrl, consentPayload, apiKey = "" }) {
  const url = `${apiBaseUrl.replace(/\/$/, "")}/api/consent-events`;
  const response = await fetch(url, {
    method: "POST",
    headers: buildHeaders(apiKey),
    body: JSON.stringify(consentPayload)
  });

  const json = await response.json();
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
  const json = await response.json();
  if (!response.ok || !json.success) {
    const message = json?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }
  return json.data || [];
}

export async function fetchChannelRecommendations({ apiBaseUrl, riskLevel, apiKey = "" }) {
  const baseUrl = apiBaseUrl.replace(/\/$/, "");

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
  const baseUrl = apiBaseUrl.replace(/\/$/, "");
  return getJson(`${baseUrl}/api/student/consent-profile?session_id=${encodeURIComponent(sessionId)}`, apiKey);
}

export async function fetchStudentHistory({ apiBaseUrl, sessionId, limit = 20, apiKey = "" }) {
  const baseUrl = apiBaseUrl.replace(/\/$/, "");
  return getJson(
    `${baseUrl}/api/student/history?session_id=${encodeURIComponent(sessionId)}&limit=${encodeURIComponent(limit)}`,
    apiKey
  );
}

export async function fetchSupportResources({ apiBaseUrl, apiKey = "", lang = "en" }) {
  const baseUrl = apiBaseUrl.replace(/\/$/, "");
  const safeLang = lang === "zh" ? "zh" : "en";
  return getJson(`${baseUrl}/api/support/resources?lang=${safeLang}`, apiKey);
}
