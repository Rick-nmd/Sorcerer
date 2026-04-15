const API_BASE_URL = window.API_BASE_URL || "http://localhost:8787";
const riskLevelSelect = document.getElementById("risk-level");
const refreshBtn = document.getElementById("refresh-btn");
const exportBtn = document.getElementById("export-btn");
const eventsBody = document.getElementById("events-body");
const statusText = document.getElementById("status-text");
const apiBaseLabel = document.getElementById("api-base-label");

apiBaseLabel.textContent = API_BASE_URL;

function normalizeReason(value) {
  if (Array.isArray(value) && value.length > 0) {
    return value.join("; ");
  }
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  return "-";
}

function renderRows(events) {
  eventsBody.innerHTML = "";
  if (!events.length) {
    eventsBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty">No events found.</td>
      </tr>
    `;
    return;
  }

  events.forEach((event) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${event.event_id || "-"}</td>
      <td>${event.timestamp || "-"}</td>
      <td>${event.risk_level || "-"}</td>
      <td>${event.channel_type || "-"}</td>
      <td>${event.consent_state || "-"}</td>
      <td>${normalizeReason(event.why_flagged)}</td>
      <td>${normalizeReason(event.why_recommended)}</td>
    `;
    eventsBody.appendChild(row);
  });
}

function buildQuery() {
  const params = new URLSearchParams();
  if (riskLevelSelect.value) {
    params.set("risk_level", riskLevelSelect.value);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

async function fetchRiskEvents() {
  statusText.textContent = "Loading...";
  try {
    const response = await fetch(`${API_BASE_URL}/api/risk-events${buildQuery()}`);
    const payload = await response.json();
    if (!payload.success) {
      throw new Error(payload.message || "Failed to load events");
    }
    const events = Array.isArray(payload.data) ? payload.data : [];
    renderRows(events);
    statusText.textContent = `Loaded ${events.length} event(s).`;
  } catch (error) {
    renderRows([]);
    statusText.textContent = `Load failed: ${error.message}`;
  }
}

function exportCsv() {
  window.open(`${API_BASE_URL}/api/risk-events/export.csv${buildQuery()}`, "_blank");
}

refreshBtn.addEventListener("click", fetchRiskEvents);
riskLevelSelect.addEventListener("change", fetchRiskEvents);
exportBtn.addEventListener("click", exportCsv);

fetchRiskEvents();
