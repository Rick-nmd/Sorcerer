const STORAGE_KEY = "school_console_api_base_url";
const API_KEY_STORAGE_KEY = "school_console_api_key";

const ui = {
  apiBaseUrl: document.getElementById("apiBaseUrl"),
  apiKey: document.getElementById("apiKey"),
  riskLevel: document.getElementById("riskLevel"),
  channelType: document.getElementById("channelType"),
  fromDate: document.getElementById("fromDate"),
  toDate: document.getElementById("toDate"),
  refreshBtn: document.getElementById("refreshBtn"),
  exportBtn: document.getElementById("exportBtn"),
  seedDemoBtn: document.getElementById("seedDemoBtn"),
  resetDemoBtn: document.getElementById("resetDemoBtn"),
  autoRefresh: document.getElementById("autoRefresh"),
  meta: document.getElementById("meta"),
  eventsBody: document.getElementById("eventsBody"),
  totalEvents: document.getElementById("totalEvents"),
  riskSummary: document.getElementById("riskSummary"),
  channelSummary: document.getElementById("channelSummary"),
  consentSummary: document.getElementById("consentSummary"),
  consentMeta: document.getElementById("consentMeta"),
  consentBody: document.getElementById("consentBody")
};
let autoRefreshTimer = null;

function getApiBaseUrl() {
  return localStorage.getItem(STORAGE_KEY) || "http://localhost:8787";
}

function setApiBaseUrl(value) {
  localStorage.setItem(STORAGE_KEY, value.trim());
}

function getApiKey() {
  return localStorage.getItem(API_KEY_STORAGE_KEY) || "";
}

function setApiKey(value) {
  localStorage.setItem(API_KEY_STORAGE_KEY, value.trim());
}

function authHeaders() {
  const apiKey = ui.apiKey.value.trim();
  if (!apiKey) return {};
  return { "x-api-key": apiKey };
}

function isoFromInput(raw) {
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
}

function buildQueryString() {
  const params = new URLSearchParams();
  if (ui.riskLevel.value) params.set("risk_level", ui.riskLevel.value);
  if (ui.channelType.value) params.set("channel_type", ui.channelType.value);

  const from = isoFromInput(ui.fromDate.value);
  const to = isoFromInput(ui.toDate.value);
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  return params.toString();
}

function renderRows(items) {
  if (!items.length) {
    ui.eventsBody.innerHTML = `<tr><td colspan="7">No events found.</td></tr>`;
    return;
  }

  ui.eventsBody.innerHTML = items
    .map(
      (item) => `
      <tr>
        <td>${item.event_id || "-"}</td>
        <td>${item.timestamp || "-"}</td>
        <td>${item.risk_level || "-"}</td>
        <td>${item.channel_type || "-"}</td>
        <td>${item.consent_state || "-"}</td>
        <td>${(item.why_flagged || []).join("<br/>") || "-"}</td>
        <td>${(item.why_recommended || []).join("<br/>") || "-"}</td>
      </tr>
    `
    )
    .join("");
}

function renderSummary(summary) {
  if (!summary) {
    return;
  }

  ui.totalEvents.textContent = String(summary.total_events ?? 0);
  ui.riskSummary.textContent = `R1:${summary.by_risk_level?.R1 ?? 0} | R2:${summary.by_risk_level?.R2 ?? 0} | R3:${summary.by_risk_level?.R3 ?? 0}`;
  ui.channelSummary.textContent = `work:${summary.by_channel_type?.work ?? 0} | finance:${summary.by_channel_type?.finance ?? 0} | mixed:${summary.by_channel_type?.mixed ?? 0}`;
  ui.consentSummary.textContent = `granted:${summary.consent?.granted ?? 0} | revoked:${summary.consent?.revoked ?? 0} | not_granted:${summary.consent?.not_granted ?? 0}`;
}

function renderConsentRows(items) {
  if (!items.length) {
    ui.consentBody.innerHTML = `<tr><td colspan="5">No consent events found.</td></tr>`;
    return;
  }

  ui.consentBody.innerHTML = items
    .map(
      (item) => `
      <tr>
        <td>${item.consent_event_id || "-"}</td>
        <td>${item.timestamp || "-"}</td>
        <td>${item.actor || "-"}</td>
        <td>${item.consent_state || "-"}</td>
        <td>${item.note || "-"}</td>
      </tr>
    `
    )
    .join("");
}

async function refreshEvents() {
  const baseUrl = ui.apiBaseUrl.value.trim() || "http://localhost:8787";
  setApiBaseUrl(baseUrl);
  setApiKey(ui.apiKey.value);

  const query = buildQueryString();
  const url = `${baseUrl.replace(/\/$/, "")}/api/risk-events${query ? `?${query}` : ""}`;

  const [eventsCall, summaryCall, consentCall] = await Promise.allSettled([
    fetch(url, { headers: authHeaders() }).then((resp) => resp.json()),
    fetch(`${baseUrl.replace(/\/$/, "")}/api/risk-events/summary`, { headers: authHeaders() }).then((resp) =>
      resp.json()
    ),
    fetch(`${baseUrl.replace(/\/$/, "")}/api/consent-events?limit=20`, { headers: authHeaders() }).then((resp) =>
      resp.json()
    )
  ]);

  if (eventsCall.status === "fulfilled") {
    const result = eventsCall.value;
    const items = result?.data?.items || [];
    renderRows(items);
    ui.meta.textContent = `Loaded ${items.length} / total ${result?.data?.total ?? 0} item(s).`;
  } else {
    ui.meta.textContent = `Event request failed: ${eventsCall.reason?.message || "unknown error"}`;
    ui.eventsBody.innerHTML = `<tr><td colspan="7">Unable to load events.</td></tr>`;
  }

  if (summaryCall.status === "fulfilled") {
    renderSummary(summaryCall.value?.data);
  } else {
    ui.totalEvents.textContent = "-";
    ui.riskSummary.textContent = "unavailable";
    ui.channelSummary.textContent = "unavailable";
    ui.consentSummary.textContent = "unavailable";
  }

  if (consentCall.status === "fulfilled") {
    const consentResult = consentCall.value;
    const consentItems = consentResult?.data?.items || [];
    renderConsentRows(consentItems);
    ui.consentMeta.textContent = `Loaded ${consentItems.length} / total ${consentResult?.data?.total ?? 0} consent event(s).`;
  } else {
    ui.consentMeta.textContent = `Consent request failed: ${consentCall.reason?.message || "unknown error"}`;
    ui.consentBody.innerHTML = `<tr><td colspan="5">Unable to load consent events.</td></tr>`;
  }
}

function exportCsv() {
  const baseUrl = ui.apiBaseUrl.value.trim() || "http://localhost:8787";
  setApiBaseUrl(baseUrl);
  setApiKey(ui.apiKey.value);
  const url = `${baseUrl.replace(/\/$/, "")}/api/risk-events/export.csv`;
  fetch(url, { headers: authHeaders() })
    .then((resp) => resp.text())
    .then((text) => {
      const blob = new Blob([text], { type: "text/csv" });
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, "_blank");
      setTimeout(() => URL.revokeObjectURL(objectUrl), 15000);
    })
    .catch((error) => {
      ui.meta.textContent = `CSV export failed: ${error.message}`;
    });
}

async function postJson(url) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders()
    }
  });
  return response.json();
}

async function seedDemoData() {
  const baseUrl = ui.apiBaseUrl.value.trim() || "http://localhost:8787";
  setApiBaseUrl(baseUrl);
  const result = await postJson(`${baseUrl.replace(/\/$/, "")}/api/demo/seed`);
  ui.meta.textContent = `Seeded demo data: ${result?.data?.risk_events ?? 0} risk events`;
  await refreshEvents();
}

async function resetDemoData() {
  const baseUrl = ui.apiBaseUrl.value.trim() || "http://localhost:8787";
  setApiBaseUrl(baseUrl);
  const result = await postJson(`${baseUrl.replace(/\/$/, "")}/api/demo/reset`);
  ui.meta.textContent = `Reset demo data: ${result?.data?.risk_events ?? 0} risk events`;
  await refreshEvents();
}

function setAutoRefresh(enabled) {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
  }

  if (enabled) {
    autoRefreshTimer = setInterval(() => {
      refreshEvents().catch(() => {
        // keep timer alive even if one cycle fails
      });
    }, 8000);
  }
}

function init() {
  ui.apiBaseUrl.value = getApiBaseUrl();
  ui.apiKey.value = getApiKey();
  ui.refreshBtn.addEventListener("click", refreshEvents);
  ui.exportBtn.addEventListener("click", exportCsv);
  ui.seedDemoBtn.addEventListener("click", () => {
    seedDemoData().catch((error) => {
      ui.meta.textContent = `Seed failed: ${error.message}`;
    });
  });
  ui.resetDemoBtn.addEventListener("click", () => {
    resetDemoData().catch((error) => {
      ui.meta.textContent = `Reset failed: ${error.message}`;
    });
  });
  ui.autoRefresh.addEventListener("change", () => {
    setAutoRefresh(ui.autoRefresh.checked);
  });
  refreshEvents();
}

init();
