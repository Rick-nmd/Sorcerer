import {
  getApiBaseUrl,
  getApiKey,
  getConsentPreferences,
  getOrCreateStudentSessionId,
  setApiBaseUrl,
  setApiKey,
  setConsentPreferences
} from "./config.js";
import { analyzeRisk } from "./risk-engine.js";
import { buildRecommendations, normalizeRemoteRecommendations } from "./recommendation-engine.js";
import {
  fetchChannelRecommendations,
  fetchStudentConsentProfile,
  fetchStudentHistory,
  fetchSupportResources,
  uploadConsentEvent,
  uploadRiskEvent
} from "./api-client.js";

const ui = {
  apiBaseUrl: document.getElementById("apiBaseUrl"),
  apiKey: document.getElementById("apiKey"),
  consentNote: document.getElementById("consentNote"),
  saveApiBaseUrl: document.getElementById("saveApiBaseUrl"),
  syncConsentBtn: document.getElementById("syncConsentBtn"),
  sessionMeta: document.getElementById("sessionMeta"),
  scenarioText: document.getElementById("scenarioText"),
  apr: document.getElementById("apr"),
  principal: document.getElementById("principal"),
  months: document.getElementById("months"),
  stage: document.getElementById("stage"),
  consent: document.getElementById("consent"),
  scopeTelemetry: document.getElementById("scopeTelemetry"),
  scopeSchoolSupport: document.getElementById("scopeSchoolSupport"),
  scopePartnerOffers: document.getElementById("scopePartnerOffers"),
  consentReason: document.getElementById("consentReason"),
  saveConsentPrefsBtn: document.getElementById("saveConsentPrefsBtn"),
  refreshHistoryBtn: document.getElementById("refreshHistoryBtn"),
  consentSummaryOutput: document.getElementById("consentSummaryOutput"),
  selfCheckNeed: document.getElementById("selfCheckNeed"),
  selfCheckRepay: document.getElementById("selfCheckRepay"),
  selfCheckAlt: document.getElementById("selfCheckAlt"),
  analyzeBtn: document.getElementById("analyzeBtn"),
  uploadBtn: document.getElementById("uploadBtn"),
  interventionBanner: document.getElementById("interventionBanner"),
  cooldownPanel: document.getElementById("cooldownPanel"),
  cooldownSeconds: document.getElementById("cooldownSeconds"),
  riskOutput: document.getElementById("riskOutput"),
  costOutput: document.getElementById("costOutput"),
  explainOutput: document.getElementById("explainOutput"),
  recommendationOutput: document.getElementById("recommendationOutput"),
  regularChannelOutput: document.getElementById("regularChannelOutput"),
  educationOutput: document.getElementById("educationOutput"),
  wellbeingOutput: document.getElementById("wellbeingOutput"),
  historyOutput: document.getElementById("historyOutput"),
  uploadOutput: document.getElementById("uploadOutput")
};

let latestAnalysis = null;
let latestRecommendations = [];
let cooldownTimer = null;
let latestRecommendationSource = "local";
const studentSessionId = getOrCreateStudentSessionId();

function createEventId() {
  return `event_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

function renderRecommendations(recommendations) {
  if (recommendations.length === 0) {
    ui.recommendationOutput.textContent = "No recommendation generated.";
    return;
  }

  ui.recommendationOutput.innerHTML = recommendations
    .map(
      (item) => `
      <article class="recommendation">
        <h3>${item.title}</h3>
        <p><strong>Channel:</strong> ${item.channel_type}</p>
        <p><strong>Provider:</strong> ${item.provider_name}</p>
        <p><strong>Next Action:</strong> ${item.next_action}</p>
        <p><strong>Why Recommended:</strong> ${item.why_recommended.join("; ")}</p>
        <p><strong>Data Source:</strong> ${item.data_source || "local"}</p>
      </article>
    `
    )
    .join("");
}

function safeUrl(raw) {
  if (!raw) return "";
  try {
    const parsed = new URL(raw);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return parsed.toString();
    }
    return "";
  } catch (_error) {
    return "";
  }
}

function renderRegularChannels(recommendations) {
  const regular = (recommendations || []).filter((item) => item.channel_type === "finance");
  if (!regular.length) {
    ui.regularChannelOutput.textContent = "No regular finance channel available in this scenario.";
    return;
  }

  ui.regularChannelOutput.innerHTML = regular
    .map((item) => {
      const appUrl = safeUrl(item.application_url);
      return `
      <article class="recommendation">
        <h3>${item.title}</h3>
        <p><strong>Provider:</strong> ${item.provider_name}</p>
        <p><strong>APR:</strong> ${item.apr ?? "-"}%</p>
        <p><strong>Term:</strong> ${item.term_months || "-"} months</p>
        <p><strong>Eligibility:</strong> ${item.eligibility || "-"}</p>
        <p><strong>Integration Status:</strong> ${item.integration_status || "-"}</p>
        <p><strong>Verified:</strong> ${item.institution_verified ? "yes" : "pending verification"}</p>
        <p><strong>Source:</strong> ${item.data_source || "unknown"}</p>
        ${appUrl ? `<a href="${appUrl}" target="_blank" rel="noopener noreferrer">Open official application link</a>` : "<p><em>Official application link unavailable in current environment.</em></p>"}
      </article>
    `;
    })
    .join("");
}

function getConsentScopes() {
  return {
    telemetry: ui.scopeTelemetry.checked,
    school_support: ui.scopeSchoolSupport.checked,
    partner_offers: ui.scopePartnerOffers.checked
  };
}

function applyConsentScopes(scopes) {
  ui.scopeTelemetry.checked = Boolean(scopes.telemetry);
  ui.scopeSchoolSupport.checked = Boolean(scopes.school_support);
  ui.scopePartnerOffers.checked = Boolean(scopes.partner_offers);
}

function summarizeConsent(scopes, consentState) {
  const enabled = Object.entries(scopes)
    .filter(([, isEnabled]) => isEnabled)
    .map(([key]) => key.replaceAll("_", " "));
  const summary = enabled.length ? enabled.join(", ") : "none";
  ui.consentSummaryOutput.innerHTML = `
    <strong>Consent state:</strong> ${consentState}<br/>
    <strong>Granted scopes:</strong> ${summary}<br/>
    <strong>Session:</strong> ${studentSessionId}
  `;
}

function startCooldown(seconds) {
  if (cooldownTimer) {
    window.clearInterval(cooldownTimer);
  }

  let remaining = seconds;
  ui.cooldownSeconds.textContent = String(remaining);
  ui.cooldownPanel.classList.remove("hidden");

  cooldownTimer = window.setInterval(() => {
    remaining -= 1;
    ui.cooldownSeconds.textContent = String(remaining);
    if (remaining <= 0) {
      window.clearInterval(cooldownTimer);
      cooldownTimer = null;
      ui.cooldownPanel.classList.add("hidden");
    }
  }, 1000);
}

function getScenarioInput() {
  return {
    pageText: ui.scenarioText.value,
    apr: Number(ui.apr.value),
    principal: Number(ui.principal.value),
    months: Number(ui.months.value),
    stage: ui.stage.value,
    self_check: {
      urgent_need: ui.selfCheckNeed.value,
      stable_repay_source: ui.selfCheckRepay.value,
      tried_alternatives: ui.selfCheckAlt.value
    },
    consent_state: ui.consent.value
  };
}

function renderResourceList(target, items, emptyMessage) {
  if (!items.length) {
    target.textContent = emptyMessage;
    return;
  }

  target.innerHTML = items
    .map((item) => {
      const safeLink = safeUrl(item.url);
      return `
        <article class="resource-card">
          <h3>${item.title}</h3>
          <p>${item.description}</p>
          ${item.steps?.length ? `<p><strong>Next Steps:</strong> ${item.steps.join("; ")}</p>` : ""}
          ${safeLink ? `<a href="${safeLink}" target="_blank" rel="noopener noreferrer">Open resource</a>` : ""}
        </article>
      `;
    })
    .join("");
}

function renderStudentHistory(history) {
  ui.historyOutput.textContent = JSON.stringify(history, null, 2);
}

async function refreshStudentHistory() {
  try {
    const history = await fetchStudentHistory({
      apiBaseUrl: getApiBaseUrl(),
      sessionId: studentSessionId,
      apiKey: getApiKey()
    });
    renderStudentHistory(history);
  } catch (error) {
    ui.historyOutput.textContent = `History load failed: ${error.message}`;
  }
}

async function refreshConsentProfile() {
  try {
    const profile = await fetchStudentConsentProfile({
      apiBaseUrl: getApiBaseUrl(),
      sessionId: studentSessionId,
      apiKey: getApiKey()
    });
    if (profile?.scopes) {
      applyConsentScopes(profile.scopes);
    }
    if (profile?.consent_state) {
      ui.consent.value = profile.consent_state;
    }
    summarizeConsent(getConsentScopes(), ui.consent.value);
  } catch (_error) {
    summarizeConsent(getConsentScopes(), ui.consent.value);
  }
}

async function refreshSupportResources() {
  try {
    const payload = await fetchSupportResources({
      apiBaseUrl: getApiBaseUrl(),
      apiKey: getApiKey()
    });
    renderResourceList(
      ui.educationOutput,
      payload.education || [],
      "No anti-fraud education content available."
    );
    renderResourceList(
      ui.wellbeingOutput,
      payload.wellbeing || [],
      "No wellbeing support content available."
    );
  } catch (error) {
    ui.educationOutput.textContent = `Education resources unavailable: ${error.message}`;
    ui.wellbeingOutput.textContent = `Wellbeing resources unavailable: ${error.message}`;
  }
}

function calculateCostSnapshot({ apr, principal, months }) {
  const monthRate = apr / 100 / 12;
  const safePrincipal = Math.max(principal || 0, 0);
  const safeMonths = Math.max(months || 1, 1);
  let monthlyPayment = safePrincipal / safeMonths;

  if (monthRate > 0) {
    const factor = Math.pow(1 + monthRate, safeMonths);
    monthlyPayment = (safePrincipal * monthRate * factor) / (factor - 1);
  }

  const totalRepayment = monthlyPayment * safeMonths;
  const totalInterest = totalRepayment - safePrincipal;
  const overdueOneMonthCost = monthlyPayment * 0.15;

  return {
    apr: Number(apr.toFixed(2)),
    principal: safePrincipal,
    months: safeMonths,
    estimated_monthly_payment: Number(monthlyPayment.toFixed(2)),
    estimated_total_repayment: Number(totalRepayment.toFixed(2)),
    estimated_total_interest: Number(totalInterest.toFixed(2)),
    overdue_one_month_extra: Number(overdueOneMonthCost.toFixed(2))
  };
}

function getSelfCheckRiskNotes(selfCheck) {
  const notes = [];
  if (selfCheck.urgent_need === "yes") {
    notes.push("User reports urgent need, impulsive borrowing risk may increase.");
  }
  if (selfCheck.stable_repay_source === "no") {
    notes.push("No stable repayment source reported.");
  }
  if (selfCheck.tried_alternatives === "no") {
    notes.push("Alternative options not tried yet.");
  }
  return notes;
}

function renderCostOutput(costSnapshot) {
  ui.costOutput.innerHTML = `
    <strong>Estimated Monthly Payment:</strong> CNY ${costSnapshot.estimated_monthly_payment}<br/>
    <strong>Estimated Total Repayment:</strong> CNY ${costSnapshot.estimated_total_repayment}<br/>
    <strong>Total Interest Cost:</strong> CNY ${costSnapshot.estimated_total_interest}<br/>
    <strong>Overdue (1 month) Extra Cost (est.):</strong> CNY ${costSnapshot.overdue_one_month_extra}
  `;
}

function renderExplainability({ analysis, selfCheckNotes, costSnapshot }) {
  const notes = [
    ...analysis.why_flagged,
    ...selfCheckNotes,
    `APR ${costSnapshot.apr}% with ${costSnapshot.months} months repayment creates total repayment CNY ${costSnapshot.estimated_total_repayment}.`
  ];

  ui.explainOutput.innerHTML = `
    <strong>Why this risk level:</strong>
    <ul>${notes.map((note) => `<li>${note}</li>`).join("")}</ul>
  `;
}

function buildEventPayload() {
  if (!latestAnalysis) {
    return null;
  }

  const scenario = getScenarioInput();
  const costSnapshot = calculateCostSnapshot(scenario);
  const selfCheckNotes = getSelfCheckRiskNotes(scenario.self_check);
  const consentScopes = getConsentScopes();

  return {
    event_id: createEventId(),
    session_id: studentSessionId,
    timestamp: new Date().toISOString(),
    risk_level: latestAnalysis.risk_level,
    why_flagged: [...latestAnalysis.why_flagged, ...selfCheckNotes],
    recommended_action: latestAnalysis.recommended_action,
    consent_state: ui.consent.value,
    consent_scopes: consentScopes,
    channel_type: latestAnalysis.channel_type,
    why_recommended: latestRecommendations.flatMap((item) => item.why_recommended),
    cost_snapshot: costSnapshot
  };
}

function updateInterventionBanner(riskLevel) {
  if (riskLevel === "R3") {
    ui.interventionBanner.textContent =
      "High-risk scenario. Pause application and prioritize safe alternatives.";
    startCooldown(15);
    return;
  }

  if (riskLevel === "R2") {
    ui.interventionBanner.textContent =
      "Medium-risk scenario. Review repayment pressure before any submit action.";
    startCooldown(15);
    return;
  }

  ui.interventionBanner.textContent =
    "Low-risk scenario. Continue with educational reminders and support resources.";
}

function initialize() {
  const storedScopes = getConsentPreferences();
  ui.apiBaseUrl.value = getApiBaseUrl();
  ui.apiKey.value = getApiKey();
  applyConsentScopes(storedScopes);
  ui.sessionMeta.innerHTML = `
    <strong>Student Session ID:</strong> ${studentSessionId}<br/>
    <strong>Purpose:</strong> links consent changes, analysis uploads, and student history in demo mode.
  `;
  summarizeConsent(storedScopes, ui.consent.value);

  ui.saveApiBaseUrl.addEventListener("click", () => {
    setApiBaseUrl(ui.apiBaseUrl.value);
    setApiKey(ui.apiKey.value);
    ui.uploadOutput.textContent = `Saved API base URL: ${getApiBaseUrl()}`;
  });

  ui.syncConsentBtn.addEventListener("click", async () => {
    try {
      const result = await uploadConsentEvent({
        apiBaseUrl: getApiBaseUrl(),
        consentPayload: {
          session_id: studentSessionId,
          consent_state: ui.consent.value,
          actor: "student",
          note: ui.consentNote.value || "",
          reason: ui.consentReason.value || "",
          scopes: getConsentScopes()
        },
        apiKey: getApiKey()
      });
      summarizeConsent(getConsentScopes(), ui.consent.value);
      await refreshStudentHistory();
      ui.uploadOutput.textContent = `Consent sync result:\n${JSON.stringify(result, null, 2)}`;
    } catch (error) {
      ui.uploadOutput.textContent = `Consent sync failed: ${error.message}`;
    }
  });

  ui.saveConsentPrefsBtn.addEventListener("click", async () => {
    const scopes = getConsentScopes();
    setConsentPreferences(scopes);
    summarizeConsent(scopes, ui.consent.value);
    try {
      await uploadConsentEvent({
        apiBaseUrl: getApiBaseUrl(),
        consentPayload: {
          session_id: studentSessionId,
          consent_state: ui.consent.value,
          actor: "student",
          note: ui.consentNote.value || "Saved layered consent preferences from plugin UI.",
          reason: ui.consentReason.value || "",
          scopes
        },
        apiKey: getApiKey()
      });
      await refreshStudentHistory();
      ui.uploadOutput.textContent = "Layered consent preferences saved locally and synced to backend.";
    } catch (error) {
      ui.uploadOutput.textContent = `Preferences saved locally, but sync failed: ${error.message}`;
    }
  });

  ui.refreshHistoryBtn.addEventListener("click", async () => {
    await refreshStudentHistory();
  });

  ui.analyzeBtn.addEventListener("click", async () => {
    const scenario = getScenarioInput();
    latestAnalysis = analyzeRisk(scenario);
    const costSnapshot = calculateCostSnapshot(scenario);
    const selfCheckNotes = getSelfCheckRiskNotes(scenario.self_check);

    try {
      const remoteRecommendations = await fetchChannelRecommendations({
        apiBaseUrl: getApiBaseUrl(),
        riskLevel: latestAnalysis.risk_level,
        apiKey: getApiKey()
      });
      latestRecommendations = normalizeRemoteRecommendations({
        riskLevel: latestAnalysis.risk_level,
        recommendations: remoteRecommendations
      });
      latestRecommendationSource = "backend";
    } catch (_error) {
      latestRecommendations = buildRecommendations({
        riskLevel: latestAnalysis.risk_level,
        apr: scenario.apr
      }).map((item) => ({ ...item, data_source: "local" }));
      latestRecommendationSource = "local_fallback";
    }

    ui.riskOutput.textContent = JSON.stringify(latestAnalysis, null, 2);
    renderCostOutput(costSnapshot);
    renderExplainability({ analysis: latestAnalysis, selfCheckNotes, costSnapshot });
    renderRecommendations(latestRecommendations);
    renderRegularChannels(latestRecommendations);
    updateInterventionBanner(latestAnalysis.risk_level);
    summarizeConsent(getConsentScopes(), ui.consent.value);
    ui.uploadOutput.textContent = `Recommendation source: ${latestRecommendationSource}`;
  });

  ui.uploadBtn.addEventListener("click", async () => {
    const payload = buildEventPayload();
    if (!payload) {
      ui.uploadOutput.textContent = "Please run Analyze Risk before upload.";
      return;
    }

    try {
      const result = await uploadRiskEvent({
        apiBaseUrl: getApiBaseUrl(),
        eventPayload: payload,
        apiKey: getApiKey()
      });
      await refreshStudentHistory();
      ui.uploadOutput.textContent = `${JSON.stringify(result, null, 2)}\n\nRecommendation source: ${latestRecommendationSource}`;
    } catch (error) {
      ui.uploadOutput.textContent = `Upload failed: ${error.message}`;
    }
  });

  refreshConsentProfile();
  refreshStudentHistory();
  refreshSupportResources();
}

initialize();
