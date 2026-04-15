export async function uploadRiskEvent({ apiBaseUrl, eventPayload }) {
  const url = `${apiBaseUrl.replace(/\/$/, "")}/api/risk-events`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(eventPayload)
  });

  const json = await response.json();
  return {
    ok: response.ok,
    status: response.status,
    body: json
  };
}

export async function uploadConsentEvent({ apiBaseUrl, consentPayload }) {
  const url = `${apiBaseUrl.replace(/\/$/, "")}/api/consent-events`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(consentPayload)
  });

  const json = await response.json();
  return {
    ok: response.ok,
    status: response.status,
    body: json
  };
}

async function getJson(url) {
  const response = await fetch(url);
  const json = await response.json();
  if (!response.ok || !json.success) {
    const message = json?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }
  return json.data || [];
}

export async function fetchChannelRecommendations({ apiBaseUrl, riskLevel }) {
  const baseUrl = apiBaseUrl.replace(/\/$/, "");

  if (riskLevel === "R1") {
    const work = await getJson(`${baseUrl}/api/channels/work-study`);
    return work;
  }

  const [work, finance] = await Promise.all([
    getJson(`${baseUrl}/api/channels/work-study`),
    getJson(`${baseUrl}/api/channels/finance`)
  ]);
  return [...work, ...finance];
}
