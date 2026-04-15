const STORAGE_KEY = "school_console_api_base_url";

const ui = {
  apiBaseUrl: document.getElementById("apiBaseUrl"),
  riskLevel: document.getElementById("riskLevel"),
  channelType: document.getElementById("channelType"),
  fromDate: document.getElementById("fromDate"),
  toDate: document.getElementById("toDate"),
  refreshBtn: document.getElementById("refreshBtn"),
  exportBtn: document.getElementById("exportBtn"),
  meta: document.getElementById("meta"),
  eventsBody: document.getElementById("eventsBody")
};

function getApiBaseUrl() {
  return localStorage.getItem(STORAGE_KEY) || "http://localhost:8787";
}

function setApiBaseUrl(value) {
  localStorage.setItem(STORAGE_KEY, value.trim());
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

async function refreshEvents() {
  const baseUrl = ui.apiBaseUrl.value.trim() || "http://localhost:8787";
  setApiBaseUrl(baseUrl);

  const query = buildQueryString();
  const url = `${baseUrl.replace(/\/$/, "")}/api/risk-events${query ? `?${query}` : ""}`;

  try {
    const response = await fetch(url);
    const result = await response.json();
    const items = result?.data?.items || [];
    renderRows(items);
    ui.meta.textContent = `Loaded ${items.length} / total ${result?.data?.total ?? 0} item(s).`;
  } catch (error) {
    ui.meta.textContent = `Request failed: ${error.message}`;
    ui.eventsBody.innerHTML = `<tr><td colspan="7">Unable to load events.</td></tr>`;
  }
}

function exportCsv() {
  const baseUrl = ui.apiBaseUrl.value.trim() || "http://localhost:8787";
  setApiBaseUrl(baseUrl);
  const url = `${baseUrl.replace(/\/$/, "")}/api/risk-events/export.csv`;
  window.open(url, "_blank");
}

function init() {
  ui.apiBaseUrl.value = getApiBaseUrl();
  ui.refreshBtn.addEventListener("click", refreshEvents);
  ui.exportBtn.addEventListener("click", exportCsv);
  refreshEvents();
}

init();
