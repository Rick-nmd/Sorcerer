import { getApiBaseUrl, setApiBaseUrl } from "./config.js";
import { analyzeRisk } from "./risk-engine.js";
import { buildRecommendations } from "./recommendation-engine.js";
import { uploadRiskEvent } from "./api-client.js";

const ui = {
  apiBaseUrl: document.getElementById("apiBaseUrl"),
  saveApiBaseUrl: document.getElementById("saveApiBaseUrl"),
  scenarioText: document.getElementById("scenarioText"),
  apr: document.getElementById("apr"),
  stage: document.getElementById("stage"),
  consent: document.getElementById("consent"),
  analyzeBtn: document.getElementById("analyzeBtn"),
  uploadBtn: document.getElementById("uploadBtn"),
  interventionBanner: document.getElementById("interventionBanner"),
  cooldownPanel: document.getElementById("cooldownPanel"),
  cooldownSeconds: document.getElementById("cooldownSeconds"),
  riskOutput: document.getElementById("riskOutput"),
  recommendationOutput: document.getElementById("recommendationOutput"),
  uploadOutput: document.getElementById("uploadOutput")
};

let latestAnalysis = null;
let latestRecommendations = [];
let cooldownTimer = null;

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
    stage: ui.stage.value,
    consent_state: ui.consent.value
  };
}

function buildEventPayload() {
  if (!latestAnalysis) {
    return null;
  }

  return {
    event_id: createEventId(),
    timestamp: new Date().toISOString(),
    risk_level: latestAnalysis.risk_level,
    why_flagged: latestAnalysis.why_flagged,
    recommended_action: latestAnalysis.recommended_action,
    consent_state: ui.consent.value,
    channel_type: latestAnalysis.channel_type,
    why_recommended: latestRecommendations.flatMap((item) => item.why_recommended),
    cost_snapshot: {
      apr: Number(ui.apr.value),
      principal: 5000,
      months: 12,
      estimated_monthly_payment: Number((5000 / 12).toFixed(2))
    }
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

  ui.saveApiBaseUrl.addEventListener("click", () => {
    setApiBaseUrl(ui.apiBaseUrl.value);
    ui.uploadOutput.textContent = `Saved API base URL: ${getApiBaseUrl()}`;
  });

  ui.analyzeBtn.addEventListener("click", () => {
    const scenario = getScenarioInput();
    latestAnalysis = analyzeRisk(scenario);
    latestRecommendations = buildRecommendations({
      riskLevel: latestAnalysis.risk_level,
      apr: scenario.apr
    });

    ui.riskOutput.textContent = JSON.stringify(latestAnalysis, null, 2);
    renderRecommendations(latestRecommendations);
    updateInterventionBanner(latestAnalysis.risk_level);
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
        eventPayload: payload
      });
      ui.uploadOutput.textContent = JSON.stringify(result, null, 2);
    } catch (error) {
      ui.uploadOutput.textContent = `Upload failed: ${error.message}`;
    }
  });
}

initialize();
