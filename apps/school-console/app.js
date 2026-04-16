const STORAGE_KEY = "school_console_api_base_url";
const API_KEY_STORAGE_KEY = "school_console_api_key";

const ui = {
  apiBaseUrl: document.getElementById("apiBaseUrl"),
  apiKey: document.getElementById("apiKey"),
  riskLevel: document.getElementById("riskLevel"),
  channelType: document.getElementById("channelType"),
  sourceFilter: document.getElementById("sourceFilter"),
  studentSessionId: document.getElementById("studentSessionId"),
  fromDate: document.getElementById("fromDate"),
  toDate: document.getElementById("toDate"),
  refreshBtn: document.getElementById("refreshBtn"),
  exportBtn: document.getElementById("exportBtn"),
  seedDemoBtn: document.getElementById("seedDemoBtn"),
  resetDemoBtn: document.getElementById("resetDemoBtn"),
  loadStudentHistoryBtn: document.getElementById("loadStudentHistoryBtn"),
  autoRefresh: document.getElementById("autoRefresh"),
  meta: document.getElementById("meta"),
  eventsBody: document.getElementById("eventsBody"),
  totalEvents: document.getElementById("totalEvents"),
  riskSummary: document.getElementById("riskSummary"),
  channelSummary: document.getElementById("channelSummary"),
  consentSummary: document.getElementById("consentSummary"),
  sourceSummary: document.getElementById("sourceSummary"),
  consentMeta: document.getElementById("consentMeta"),
  consentBody: document.getElementById("consentBody"),
  consentProfileMeta: document.getElementById("consentProfileMeta"),
  consentProfilesBody: document.getElementById("consentProfilesBody"),
  studentHistoryMeta: document.getElementById("studentHistoryMeta"),
  studentHistoryOutput: document.getElementById("studentHistoryOutput"),
  supportMeta: document.getElementById("supportMeta"),
  educationResources: document.getElementById("educationResources"),
  wellbeingResources: document.getElementById("wellbeingResources"),
  networkMeta: document.getElementById("networkMeta"),
  networkBody: document.getElementById("networkBody"),
  auditMeta: document.getElementById("auditMeta"),
  auditBody: document.getElementById("auditBody")
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
  if (ui.sourceFilter.value) params.set("source", ui.sourceFilter.value);

  const from = isoFromInput(ui.fromDate.value);
  const to = isoFromInput(ui.toDate.value);
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  return params.toString();
}

function renderRows(items) {
  if (!items.length) {
    ui.eventsBody.innerHTML = `<tr><td colspan="9">No events found.</td></tr>`;
    return;
  }

  ui.eventsBody.innerHTML = items
    .map(
      (item) => `
      <tr>
        <td>${item.event_id || "-"}</td>
        <td>${item.timestamp || "-"}</td>
        <td>${item.session_id || "-"}</td>
        <td>${item.risk_level || "-"}</td>
        <td>${item.channel_type || "-"}</td>
        <td>${item.source || "-"}</td>
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
  ui.sourceSummary.textContent = `browser:${summary.by_source?.browser ?? 0} | network:${summary.by_source?.network ?? 0} | integration:${summary.by_source?.integration ?? 0} | demo:${summary.by_source?.demo ?? 0}`;
}

function formatScopes(scopes) {
  if (!scopes) return "-";
  const enabled = Object.entries(scopes)
    .filter(([, value]) => Boolean(value))
    .map(([key]) => key.replaceAll("_", " "));
  return enabled.length ? enabled.join(", ") : "none";
}

function renderConsentRows(items) {
  if (!items.length) {
    ui.consentBody.innerHTML = `<tr><td colspan="6">No consent events found.</td></tr>`;
    return;
  }

  ui.consentBody.innerHTML = items
    .map(
      (item) => `
      <tr>
        <td>${item.consent_event_id || "-"}</td>
        <td>${item.timestamp || "-"}</td>
        <td>${item.session_id || "-"}</td>
        <td>${item.actor || "-"}</td>
        <td>${item.consent_state || "-"}</td>
        <td>${formatScopes(item.scopes)}</td>
        <td>${item.note || "-"}</td>
      </tr>
    `
    )
    .join("");
}

function renderConsentProfiles(items) {
  if (!items.length) {
    ui.consentProfilesBody.innerHTML = `<tr><td colspan="6">No consent profiles found.</td></tr>`;
    return;
  }

  ui.consentProfilesBody.innerHTML = items
    .map(
      (item) => `
      <tr>
        <td>${item.session_id || "-"}</td>
        <td>${item.consent_state || "-"}</td>
        <td>${formatScopes(item.scopes)}</td>
        <td>${item.updated_at || "-"}</td>
        <td>${item.updated_by || "-"}</td>
        <td>${item.reason || item.note || "-"}</td>
      </tr>
    `
    )
    .join("");
}

function renderResourceList(target, items, emptyMessage) {
  if (!items.length) {
    target.textContent = emptyMessage;
    return;
  }

  target.innerHTML = items
    .map(
      (item) => `
      <article class="resource-item">
        <strong>${item.title || "-"}</strong>
        <p>${item.description || "-"}</p>
        <p><strong>Steps:</strong> ${(item.steps || []).join("; ") || "-"}</p>
      </article>
    `
    )
    .join("");
}

function renderNetworkRows(items) {
  if (!items.length) {
    ui.networkBody.innerHTML = `<tr><td colspan="6">No network signals found.</td></tr>`;
    return;
  }

  ui.networkBody.innerHTML = items
    .map(
      (item) => `
      <tr>
        <td>${item.signal_id || "-"}</td>
        <td>${item.session_id || "-"}</td>
        <td>${item.observed_at || "-"}</td>
        <td>${item.category || "-"}</td>
        <td>${item.l7_signal || "-"}</td>
        <td>${item.confidence ?? "-"}</td>
      </tr>
    `
    )
    .join("");
}

function shortHash(value) {
  if (!value) return "-";
  return `${value.slice(0, 10)}...`;
}

function renderAuditRows(items) {
  if (!items.length) {
    ui.auditBody.innerHTML = `<tr><td colspan="6">No audit events found.</td></tr>`;
    return;
  }

  ui.auditBody.innerHTML = items
    .map(
      (item) => `
      <tr>
        <td>${item.audit_event_id || "-"}</td>
        <td>${item.timestamp || "-"}</td>
        <td>${item.actor || "-"}</td>
        <td>${item.action || "-"}</td>
        <td>${item.resource || "-"}</td>
        <td>${shortHash(item.previous_hash)} -> ${shortHash(item.hash)}</td>
      </tr>
    `
    )
    .join("");
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: authHeaders() });
  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json?.message || `Request failed with status ${response.status}`);
  }
  return json;
}

async function loadStudentHistory() {
  const baseUrl = ui.apiBaseUrl.value.trim() || "http://localhost:8787";
  const sessionId = ui.studentSessionId.value.trim();
  if (!sessionId) {
    ui.studentHistoryMeta.textContent = "Enter a student session ID first.";
    ui.studentHistoryOutput.textContent = "No student history loaded yet.";
    return;
  }

  try {
    const result = await fetchJson(
      `${baseUrl.replace(/\/$/, "")}/api/student/history?session_id=${encodeURIComponent(sessionId)}&limit=20`
    );
    ui.studentHistoryMeta.textContent = `Loaded history for ${sessionId}.`;
    ui.studentHistoryOutput.textContent = JSON.stringify(result.data, null, 2);
  } catch (error) {
    ui.studentHistoryMeta.textContent = `Student history request failed: ${error.message}`;
    ui.studentHistoryOutput.textContent = "Unable to load student history.";
  }
}

async function refreshEvents() {
  const baseUrl = ui.apiBaseUrl.value.trim() || "http://localhost:8787";
  setApiBaseUrl(baseUrl);
  setApiKey(ui.apiKey.value);

  const query = buildQueryString();
  const url = `${baseUrl.replace(/\/$/, "")}/api/risk-events${query ? `?${query}` : ""}`;

  const [eventsCall, summaryCall, consentCall, consentProfilesCall, supportCall, networkCall, auditCall] = await Promise.allSettled([
    fetchJson(url),
    fetchJson(`${baseUrl.replace(/\/$/, "")}/api/risk-events/summary`),
    fetchJson(`${baseUrl.replace(/\/$/, "")}/api/consent-events?limit=20`),
    fetchJson(`${baseUrl.replace(/\/$/, "")}/api/consent-profiles?limit=20`),
    fetchJson(`${baseUrl.replace(/\/$/, "")}/api/support/resources`),
    fetchJson(`${baseUrl.replace(/\/$/, "")}/api/network/signals?limit=20`),
    fetchJson(`${baseUrl.replace(/\/$/, "")}/api/audit-events?limit=20`)
  ]);

  if (eventsCall.status === "fulfilled") {
    const result = eventsCall.value;
    const items = result?.data?.items || [];
    renderRows(items);
    ui.meta.textContent = `Loaded ${items.length} / total ${result?.data?.total ?? 0} item(s).`;
  } else {
    ui.meta.textContent = `Event request failed: ${eventsCall.reason?.message || "unknown error"}`;
    ui.eventsBody.innerHTML = `<tr><td colspan="9">Unable to load events.</td></tr>`;
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
    ui.consentBody.innerHTML = `<tr><td colspan="6">Unable to load consent events.</td></tr>`;
  }

  if (consentProfilesCall.status === "fulfilled") {
    const profileResult = consentProfilesCall.value;
    const profileItems = profileResult?.data?.items || [];
    renderConsentProfiles(profileItems);
    ui.consentProfileMeta.textContent = `Loaded ${profileItems.length} / total ${profileResult?.data?.total ?? 0} consent profile(s).`;
  } else {
    ui.consentProfileMeta.textContent = `Consent profile request failed: ${consentProfilesCall.reason?.message || "unknown error"}`;
    ui.consentProfilesBody.innerHTML = `<tr><td colspan="6">Unable to load consent profiles.</td></tr>`;
  }

  if (supportCall.status === "fulfilled") {
    const supportData = supportCall.value?.data || {};
    renderResourceList(ui.educationResources, supportData.education || [], "No education resources found.");
    renderResourceList(ui.wellbeingResources, supportData.wellbeing || [], "No wellbeing resources found.");
    ui.supportMeta.textContent = `Education ${supportData.education?.length ?? 0}, wellbeing ${supportData.wellbeing?.length ?? 0} resource(s).`;
  } else {
    ui.supportMeta.textContent = `Support resource request failed: ${supportCall.reason?.message || "unknown error"}`;
    ui.educationResources.textContent = "Unable to load education resources.";
    ui.wellbeingResources.textContent = "Unable to load wellbeing resources.";
  }

  if (networkCall.status === "fulfilled") {
    const networkResult = networkCall.value;
    const networkItems = networkResult?.data?.items || [];
    renderNetworkRows(networkItems);
    ui.networkMeta.textContent = `Loaded ${networkItems.length} / total ${networkResult?.data?.total ?? 0} network signal(s).`;
  } else {
    ui.networkMeta.textContent = `Network request failed: ${networkCall.reason?.message || "unknown error"}`;
    ui.networkBody.innerHTML = `<tr><td colspan="6">Unable to load network signals.</td></tr>`;
  }

  if (auditCall.status === "fulfilled") {
    const auditResult = auditCall.value;
    const auditItems = auditResult?.data?.items || [];
    renderAuditRows(auditItems);
    ui.auditMeta.textContent = `Loaded ${auditItems.length} / total ${auditResult?.data?.total ?? 0} audit event(s).`;
  } else {
    ui.auditMeta.textContent = `Audit request failed: ${auditCall.reason?.message || "unknown error"}`;
    ui.auditBody.innerHTML = `<tr><td colspan="6">Unable to load audit events.</td></tr>`;
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
  ui.loadStudentHistoryBtn.addEventListener("click", () => {
    loadStudentHistory().catch((error) => {
      ui.studentHistoryMeta.textContent = `Student history request failed: ${error.message}`;
    });
  });
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
