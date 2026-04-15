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
