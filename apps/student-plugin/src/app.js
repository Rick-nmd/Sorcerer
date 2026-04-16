import {
  getApiBaseUrl,
  getApiKey,
  getConsentPreferences,
  getLanguage,
  getOrCreateStudentSessionId,
  setApiBaseUrl,
  setApiKey,
  setConsentPreferences,
  setLanguage
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
  languageSelect: document.getElementById("languageSelect"),
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
  q1Label: document.getElementById("q1Label"),
  q2Label: document.getElementById("q2Label"),
  q3Label: document.getElementById("q3Label"),
  loanPurpose: document.getElementById("loanPurpose"),
  loanAmountRange: document.getElementById("loanAmountRange"),
  repaymentSource: document.getElementById("repaymentSource"),
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
let currentLang = getLanguage();

const I18N = {
  en: {
    q1: "Q1: What is the primary purpose of this loan?",
    q2: "Q2: What is the expected loan amount range?",
    q3: "Q3: How do you plan to repay this loan?",
    intervention_r3: "High-risk scenario. Pause application and prioritize safe alternatives.",
    intervention_r2: "Medium-risk scenario. Review repayment pressure before any submit action.",
    intervention_r1: "Low-risk scenario. Continue with educational reminders and support resources.",
    reflection_prefix: "Cooling-off reflection",
    reflection_q1: "Purpose",
    reflection_q2: "Amount range",
    reflection_q3: "Repayment plan"
  },
  zh: {
    q1: "问题一：您此次借贷的主要用途是？",
    q2: "问题二：您预计的借贷金额范围是？",
    q3: "问题三：您计划如何偿还这笔借款？",
    intervention_r3: "高风险场景。建议暂停提交，先查看更安全的替代方案。",
    intervention_r2: "中风险场景。建议先评估还款压力，再做提交决定。",
    intervention_r1: "低风险场景。建议继续关注科普与支持资源，保持谨慎决策。",
    reflection_prefix: "降温反思",
    reflection_q1: "用途",
    reflection_q2: "金额范围",
    reflection_q3: "还款来源"
  }
};

function t(key) {
  return I18N[currentLang]?.[key] || I18N.en[key] || key;
}

function setUiLanguage(lang) {
  currentLang = lang === "zh" ? "zh" : "en";
  ui.q1Label.textContent = t("q1");
  ui.q2Label.textContent = t("q2");
  ui.q3Label.textContent = t("q3");
}

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
    cooling_off: {
      loan_purpose: ui.loanPurpose.value,
      loan_amount_range: ui.loanAmountRange.value,
      repayment_source: ui.repaymentSource.value
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

function getSelfCheckRiskNotes(coolingOff) {
  const notes = [];
  const purpose = coolingOff.loan_purpose;
  const amountRange = coolingOff.loan_amount_range;
  const repay = coolingOff.repayment_source;

  // Impulse Control / Cognitive Awakening / Decision Delay framing
  if (purpose === "daily_expenses" || purpose === "electronics" || purpose === "entertainment_social") {
    notes.push(
      currentLang === "zh"
        ? "用途偏日常/消费型支出，建议先降温并延迟决策。"
        : "Purpose leans toward consumption; consider a cooling-off pause and decision delay."
    );
  }
  if (repay === "other_loans_rollover" || repay === "no_clear_plan") {
    notes.push(
      currentLang === "zh"
        ? "还款计划不清晰或可能以贷养贷，风险显著上升。"
        : "Repayment plan is unclear or involves debt rollover; risk increases substantially."
    );
  }
  if (amountRange === "above_50000") {
    notes.push(
      currentLang === "zh"
        ? "金额范围较高，建议先评估总成本与替代支持。"
        : "Higher amount range selected; review total cost and alternatives first."
    );
  }

  notes.push(
    `${t("reflection_prefix")}: ${t("reflection_q1")}=${purpose}; ${t("reflection_q2")}=${amountRange}; ${t(
      "reflection_q3"
    )}=${repay}`
  );
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
  const selfCheckNotes = getSelfCheckRiskNotes(scenario.cooling_off);
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
    cost_snapshot: costSnapshot,
    cooling_off: scenario.cooling_off
  };
}

function updateInterventionBanner(riskLevel) {
  if (riskLevel === "R3") {
    ui.interventionBanner.textContent = t("intervention_r3");
    startCooldown(15);
    return;
  }

  if (riskLevel === "R2") {
    ui.interventionBanner.textContent = t("intervention_r2");
    startCooldown(15);
    return;
  }

  ui.interventionBanner.textContent = t("intervention_r1");
}

function initialize() {
  const storedScopes = getConsentPreferences();
  ui.languageSelect.value = currentLang;
  ui.apiBaseUrl.value = getApiBaseUrl();
  ui.apiKey.value = getApiKey();
  applyConsentScopes(storedScopes);
  setUiLanguage(currentLang);
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

  ui.languageSelect.addEventListener("change", () => {
    setLanguage(ui.languageSelect.value);
    setUiLanguage(ui.languageSelect.value);
    ui.uploadOutput.textContent =
      ui.languageSelect.value === "zh" ? "已切换语言为中文。" : "Language switched to English.";
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
    const selfCheckNotes = getSelfCheckRiskNotes(scenario.cooling_off);

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
