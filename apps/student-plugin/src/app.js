import { getApiBaseUrl, getApiKey, setApiBaseUrl, setApiKey } from "./config.js";
import { analyzeRisk } from "./risk-engine.js";
import { buildRecommendations, normalizeRemoteRecommendations } from "./recommendation-engine.js";
import { fetchChannelRecommendations, uploadConsentEvent, uploadRiskEvent } from "./api-client.js";

const ui = {
  apiBaseUrl: document.getElementById("apiBaseUrl"),
  apiKey: document.getElementById("apiKey"),
  consentNote: document.getElementById("consentNote"),
  saveApiBaseUrl: document.getElementById("saveApiBaseUrl"),
  syncConsentBtn: document.getElementById("syncConsentBtn"),
  scenarioText: document.getElementById("scenarioText"),
  apr: document.getElementById("apr"),
  principal: document.getElementById("principal"),
  months: document.getElementById("months"),
  stage: document.getElementById("stage"),
  consent: document.getElementById("consent"),
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
  uploadOutput: document.getElementById("uploadOutput")
};

let latestAnalysis = null;
let latestRecommendations = [];
let cooldownTimer = null;
let latestRecommendationSource = "local";

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

  return {
    event_id: createEventId(),
    timestamp: new Date().toISOString(),
    risk_level: latestAnalysis.risk_level,
    why_flagged: [...latestAnalysis.why_flagged, ...selfCheckNotes],
    recommended_action: latestAnalysis.recommended_action,
    consent_state: ui.consent.value,
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
  ui.apiBaseUrl.value = getApiBaseUrl();
  ui.apiKey.value = getApiKey();

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
          consent_state: ui.consent.value,
          actor: "student",
          note: ui.consentNote.value || ""
        },
        apiKey: getApiKey()
      });
      ui.uploadOutput.textContent = `Consent sync result:\n${JSON.stringify(result, null, 2)}`;
    } catch (error) {
      ui.uploadOutput.textContent = `Consent sync failed: ${error.message}`;
    }
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
    updateInterventionBanner(latestAnalysis.risk_level);
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
      ui.uploadOutput.textContent = `${JSON.stringify(result, null, 2)}\n\nRecommendation source: ${latestRecommendationSource}`;
    } catch (error) {
      ui.uploadOutput.textContent = `Upload failed: ${error.message}`;
    }
  });
}

initialize();
