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
import { parseScenarioText, SAMPLE_SCENARIO_TEXT_EN, SAMPLE_SCENARIO_TEXT_ZH } from "./scenario-parser.js";
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
  pageTitle: document.getElementById("pageTitle"),
  pageSubtitle: document.getElementById("pageSubtitle"),
  h2_settings: document.getElementById("h2_settings"),
  h2_session: document.getElementById("h2_session"),
  h2_scenario: document.getElementById("h2_scenario"),
  h2_intervention: document.getElementById("h2_intervention"),
  h2_consent: document.getElementById("h2_consent"),
  h2_risk: document.getElementById("h2_risk"),
  h2_cost: document.getElementById("h2_cost"),
  h2_explain: document.getElementById("h2_explain"),
  h2_alternatives: document.getElementById("h2_alternatives"),
  h2_finance: document.getElementById("h2_finance"),
  h2_education: document.getElementById("h2_education"),
  h2_wellbeing: document.getElementById("h2_wellbeing"),
  h2_history: document.getElementById("h2_history"),
  h2_upload: document.getElementById("h2_upload"),
  label_language: document.getElementById("label_language"),
  label_api_base_url: document.getElementById("label_api_base_url"),
  label_api_key: document.getElementById("label_api_key"),
  label_consent_note: document.getElementById("label_consent_note"),
  label_page_text: document.getElementById("label_page_text"),
  label_page_url: document.getElementById("label_page_url"),
  label_apr: document.getElementById("label_apr"),
  label_principal: document.getElementById("label_principal"),
  label_months: document.getElementById("label_months"),
  label_stage: document.getElementById("label_stage"),
  label_consent: document.getElementById("label_consent"),
  label_consent_scopes: document.getElementById("label_consent_scopes"),
  label_consent_reason: document.getElementById("label_consent_reason"),
  scopeTelemetryText: document.getElementById("scopeTelemetryText"),
  scopeSchoolSupportText: document.getElementById("scopeSchoolSupportText"),
  scopePartnerOffersText: document.getElementById("scopePartnerOffersText"),
  cooldownLabel: document.getElementById("cooldownLabel"),
  apiBaseUrl: document.getElementById("apiBaseUrl"),
  apiKey: document.getElementById("apiKey"),
  consentNote: document.getElementById("consentNote"),
  saveApiBaseUrl: document.getElementById("saveApiBaseUrl"),
  syncConsentBtn: document.getElementById("syncConsentBtn"),
  sessionMeta: document.getElementById("sessionMeta"),
  scenarioText: document.getElementById("scenarioText"),
  scenarioUrl: document.getElementById("scenarioUrl"),
  fetchFromUrlBtn: document.getElementById("fetchFromUrlBtn"),
  loadScenarioSampleBtn: document.getElementById("loadScenarioSampleBtn"),
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
  historySection: document.getElementById("historySection"),
  historyToggleBtn: document.getElementById("historyToggleBtn"),
  historyPanel: document.getElementById("historyPanel"),
  uploadOutput: document.getElementById("uploadOutput")
};

const HISTORY_COLLAPSED_KEY = "student_plugin_history_collapsed";

let latestAnalysis = null;
let latestRecommendations = [];
let cooldownTimer = null;
let latestRecommendationSource = "local";
const studentSessionId = getOrCreateStudentSessionId();
let currentLang = getLanguage();

const I18N = {
  en: {
    page_title_brand: "LoanShield",
    page_title: "LoanShield:Cooling-Off & Support Companion",
    page_title_main: "Cooling-Off & Support Companion",
    page_subtitle:
      "Before borrowing, take a pause:\nlocal detection keeps it private, records stay transparent, plus cooling-off, campus alternatives, and support access.",
    h2_settings: "Settings",
    h2_session: "Student session",
    h2_scenario: "Page check",
    h2_intervention: "Cooling-off",
    h2_consent: "Consent & data sharing",
    h2_risk: "Safety check result",
    h2_cost: "Cost transparency",
    h2_explain: "Why this guidance",
    h2_alternatives: "Campus alternatives",
    h2_finance: "Verified finance options",
    h2_education: "Safety education",
    h2_wellbeing: "Wellbeing support",
    h2_history: "My activity summary",
    h2_upload: "Status",
    label_language: "Language / 语言",
    label_api_base_url: "Backend URL",
    label_api_key: "API Key (optional)",
    label_consent_note: "Consent note (optional)",
    label_page_text: "Page text",
    label_page_url: "Page URL (optional)",
    label_apr: "APR (%)",
    label_principal: "Principal (CNY)",
    label_months: "Repayment months",
    label_stage: "User stage",
    label_consent: "Consent state",
    label_consent_scopes: "Consent scopes",
    label_consent_reason: "Consent change reason",
    scope_telemetry: "Browser telemetry for risk detection",
    scope_school_support: "School support follow-up for high risk",
    scope_partner_offers: "Receive verified partner finance offers",
    btn_save_settings: "Save settings",
    btn_update_consent: "Update consent",
    btn_run_check: "Run safety check",
    btn_send_summary: "Send summary to school",
    btn_save_consent_prefs: "Save consent preferences",
    btn_refresh_history: "Refresh my activity",
    btn_fetch_page_url: "Fetch page text",
    btn_load_scenario_sample: "Load demo text",
    msg_fetch_page_ok: "Page text loaded from URL.",
    msg_url_fetch_fail_prefix: "URL fetch failed:",
    placeholder_api_base: "http://localhost:8787 or https://your-api.onrender.com",
    placeholder_api_key: "x-api-key value",
    placeholder_consent_note: "Optional note for this consent update",
    placeholder_page_text: "Paste page text, CTA, and marketing copy...",
    placeholder_consent_reason: "Explain why you granted, limited, or revoked consent...",
    intervention_idle:
      "Run a safety check to see guidance and a cooling-off timer when needed.",
    cooldown_label: "Cooling-off timer:",
    q1: "Q1: What is the primary purpose of this loan?",
    q2: "Q2: What is the expected loan amount range?",
    q3: "Q3: How do you plan to repay this loan?",
    intervention_r3: "High-risk scenario. Pause application and prioritize safe alternatives.",
    intervention_r2: "Medium-risk scenario. Review repayment pressure before any submit action.",
    intervention_r1: "Low-risk scenario. Continue with educational reminders and support resources.",
    reflection_prefix: "Cooling-off reflection",
    reflection_q1: "Purpose",
    reflection_q2: "Amount range",
    reflection_q3: "Repayment plan",
    session_meta_title: "Student session ID:",
    session_meta_purpose: "Purpose:",
    session_meta_body:
      "Links consent updates, safety checks, and your activity summary in this demo environment.",
    summary_consent_state: "Consent state:",
    summary_granted_scopes: "Granted scopes:",
    summary_session: "Session:",
    scope_label_telemetry: "telemetry",
    scope_label_school_support: "school support",
    scope_label_partner_offers: "partner offers",
    none: "none",
    empty_risk: "Run a safety check to see results.",
    empty_cost: "Run a safety check to estimate repayment costs.",
    empty_explain: "Run a safety check to see why this guidance applies.",
    empty_recommendations: "No alternatives yet. Run a safety check first.",
    empty_finance: "No verified finance options in this scenario yet.",
    empty_consent_summary: "No consent summary yet.",
    empty_history: "No activity yet.",
    history_toggle_collapse: "Collapse",
    history_toggle_expand: "Expand",
    empty_upload: "No status yet.",
    no_recommendation: "No recommendation generated.",
    education_empty: "No education content available.",
    wellbeing_empty: "No wellbeing support content available.",
    education_error_prefix: "Education resources unavailable:",
    wellbeing_error_prefix: "Wellbeing resources unavailable:",
    history_error_prefix: "History load failed:",
    explain_title: "Why this guidance:",
    cost_monthly: "Estimated monthly payment:",
    cost_total: "Estimated total repayment:",
    cost_interest: "Total interest cost:",
    cost_overdue: "Overdue (1 month) extra cost (est.):",
    currency: "CNY",
    rec_channel: "Channel",
    rec_provider: "Provider",
    rec_next_action: "Next action",
    rec_why: "Why recommended",
    rec_source: "Data source",
    finance_apr: "APR",
    finance_term: "Term",
    finance_eligibility: "Eligibility",
    finance_integration: "Integration status",
    finance_verified: "Verified",
    finance_verified_yes: "Yes",
    finance_verified_pending: "Pending verification",
    finance_open_link: "Open official application link",
    finance_link_unavailable: "Official application link unavailable in current environment.",
    resource_next_steps: "Next steps",
    open_resource: "Open resource",
    stage_browse: "Browse only",
    stage_fill: "Fill form",
    stage_submit: "Submit application",
    consent_granted: "Granted",
    consent_not_granted: "Not granted",
    consent_revoked: "Revoked",
    purpose_daily: "Daily expenses (food, shopping)",
    purpose_electronics: "Electronics (phone, laptop)",
    purpose_education: "Education & training (certificates, courses)",
    purpose_entertainment: "Entertainment & social (travel, gatherings)",
    purpose_medical: "Medical emergency",
    purpose_other: "Other",
    amount_below_1000: "Below ¥1000",
    amount_1000_5000: "¥1000 - ¥5000",
    amount_5000_10000: "¥5000 - ¥10000",
    amount_10000_50000: "¥10000 - ¥50000",
    amount_above_50000: "Above ¥50000",
    repay_parents: "Allowance from parents",
    repay_work_study: "Part-time job / work-study income",
    repay_scholarship: "Scholarship or financial aid",
    repay_other_loans: "Other loan channels (debt rollover)",
    repay_no_plan: "No clear plan yet",
    msg_saved_settings_prefix: "Saved backend URL:",
    msg_lang_switched_en: "Language switched to English.",
    msg_lang_switched_zh: "已切换语言为中文。",
    msg_consent_sync_prefix: "Consent update result:",
    msg_consent_sync_fail_prefix: "Consent update failed:",
    msg_consent_saved: "Consent preferences saved locally and synced to the backend.",
    default_consent_note_saved_prefs: "Saved consent preferences from the student UI.",
    msg_consent_saved_partial_prefix: "Preferences saved locally, but sync failed:",
    msg_need_check_first: "Please run a safety check before sending a summary.",
    msg_upload_fail_prefix: "Send failed:",
    msg_rec_source_prefix: "Recommendation source:"
  },
  zh: {
    page_title_brand: "贷盾",
    page_title: "贷盾：冷静借·帮一把",
    page_title_main: "冷静借·帮一把",
    page_subtitle:
      "借钱前，先帮你缓一缓：\n全程本地检测保隐私，操作透明可查，附带冷静期、校内替代方案和求助渠道。",
    h2_settings: "设置",
    h2_session: "学生会话",
    h2_scenario: "页面检测",
    h2_intervention: "冷静期",
    h2_consent: "同意与数据共享",
    h2_risk: "安全检测结果",
    h2_cost: "成本透明化展示",
    h2_explain: "为什么给出这些建议",
    h2_alternatives: "校园替代方案",
    h2_finance: "正规金融选项（已验证）",
    h2_education: "安全教育",
    h2_wellbeing: "心理支持",
    h2_history: "我的活动摘要",
    h2_upload: "状态",
    label_language: "语言 / Language",
    label_api_base_url: "后端地址",
    label_api_key: "API Key（可选）",
    label_consent_note: "同意备注（可选）",
    label_page_text: "页面文本",
    label_page_url: "页面网址（可选）",
    label_apr: "年化利率 APR（%）",
    label_principal: "本金（人民币）",
    label_months: "还款期数（月）",
    label_stage: "用户阶段",
    label_consent: "同意状态",
    label_consent_scopes: "同意范围",
    label_consent_reason: "同意变更原因",
    scope_telemetry: "用于风险检测的浏览侧摘要信号",
    scope_school_support: "高风险场景下学校支持团队跟进",
    scope_partner_offers: "接收合作方已验证的正规金融产品信息",
    btn_save_settings: "保存设置",
    btn_update_consent: "更新同意",
    btn_run_check: "开始安全检测",
    btn_send_summary: "发送摘要给学校",
    btn_save_consent_prefs: "保存同意偏好",
    btn_refresh_history: "刷新我的记录",
    btn_fetch_page_url: "抓取页面文本",
    btn_load_scenario_sample: "插入演示文案",
    msg_fetch_page_ok: "已从网址加载页面文本。",
    msg_url_fetch_fail_prefix: "网址抓取失败：",
    placeholder_api_base: "http://localhost:8787 或 https://your-api.onrender.com",
    placeholder_api_key: "x-api-key 值",
    placeholder_consent_note: "可选：本次同意变更备注",
    placeholder_page_text: "粘贴页面文案、按钮文案、营销话术…",
    placeholder_consent_reason: "说明你为什么授权、限制或撤销同意…",
    intervention_idle: "先进行安全检测；在需要时会显示冷静期倒计时与建议。",
    cooldown_label: "冷静倒计时：",
    q1: "问题一：您此次借贷的主要用途是？",
    q2: "问题二：您预计的借贷金额范围是？",
    q3: "问题三：您计划如何偿还这笔借款？",
    intervention_r3: "高风险场景。建议暂停提交，先查看更安全的替代方案。",
    intervention_r2: "中风险场景。建议先评估还款压力，再做提交决定。",
    intervention_r1: "低风险场景。建议继续关注科普与支持资源，保持谨慎决策。",
    reflection_prefix: "降温反思",
    reflection_q1: "用途",
    reflection_q2: "金额范围",
    reflection_q3: "还款来源",
    session_meta_title: "学生会话 ID：",
    session_meta_purpose: "用途：",
    session_meta_body: "在本演示环境中，用于关联同意更新、安全检测与活动摘要。",
    summary_consent_state: "同意状态：",
    summary_granted_scopes: "已授权范围：",
    summary_session: "会话：",
    scope_label_telemetry: "浏览侧摘要信号",
    scope_label_school_support: "学校支持跟进",
    scope_label_partner_offers: "合作方正规金融信息",
    none: "无",
    empty_risk: "先进行安全检测即可看到结果。",
    empty_cost: "先进行安全检测即可估算还款成本。",
    empty_explain: "先进行安全检测即可看到解释说明。",
    empty_recommendations: "暂无替代方案，请先进行安全检测。",
    empty_finance: "该场景下暂无可用正规金融选项。",
    empty_consent_summary: "暂无同意摘要。",
    empty_history: "暂无活动记录。",
    history_toggle_collapse: "收起",
    history_toggle_expand: "展开",
    empty_upload: "暂无状态。",
    no_recommendation: "暂无推荐。",
    education_empty: "暂无安全教育内容。",
    wellbeing_empty: "暂无心理支持内容。",
    education_error_prefix: "安全教育资源不可用：",
    wellbeing_error_prefix: "心理支持资源不可用：",
    history_error_prefix: "历史记录加载失败：",
    explain_title: "为什么给出这些建议：",
    cost_monthly: "预计月供：",
    cost_total: "预计总还款：",
    cost_interest: "预计利息总额：",
    cost_overdue: "逾期 1 个月额外成本（估算）：",
    currency: "人民币",
    rec_channel: "渠道",
    rec_provider: "提供方",
    rec_next_action: "下一步",
    rec_why: "推荐理由",
    rec_source: "数据来源",
    finance_apr: "年化利率",
    finance_term: "期限",
    finance_eligibility: "资质要求",
    finance_integration: "对接状态",
    finance_verified: "是否已验证",
    finance_verified_yes: "是",
    finance_verified_pending: "待验证",
    finance_open_link: "打开官方申请链接",
    finance_link_unavailable: "当前环境暂无可用官方申请链接。",
    resource_next_steps: "下一步建议",
    open_resource: "打开资源",
    stage_browse: "仅浏览",
    stage_fill: "填写表单",
    stage_submit: "提交申请",
    consent_granted: "已授权",
    consent_not_granted: "未授权",
    consent_revoked: "已撤销",
    purpose_daily: "日常消费（餐饮、购物）",
    purpose_electronics: "电子产品（手机、电脑）",
    purpose_education: "教育培训（考证、课程）",
    purpose_entertainment: "娱乐社交（旅游、聚会）",
    purpose_medical: "医疗应急",
    purpose_other: "其他",
    amount_below_1000: "1000 元以下",
    amount_1000_5000: "1000 - 5000 元",
    amount_5000_10000: "5000 - 10000 元",
    amount_10000_50000: "10000 - 50000 元",
    amount_above_50000: "50000 元以上",
    repay_parents: "父母给予的生活费",
    repay_work_study: "勤工俭学 / 兼职收入",
    repay_scholarship: "奖学金或助学金",
    repay_other_loans: "其他借贷渠道（以贷养贷）",
    repay_no_plan: "暂时没有明确计划",
    msg_saved_settings_prefix: "已保存后端地址：",
    msg_lang_switched_en: "Language switched to English.",
    msg_lang_switched_zh: "已切换语言为中文。",
    msg_consent_sync_prefix: "同意更新结果：",
    msg_consent_sync_fail_prefix: "同意更新失败：",
    msg_consent_saved: "同意偏好已保存，并已同步到后端。",
    default_consent_note_saved_prefs: "已在学生端保存同意偏好。",
    msg_consent_saved_partial_prefix: "偏好已保存在本地，但同步失败：",
    msg_need_check_first: "请先进行安全检测，再发送摘要。",
    msg_upload_fail_prefix: "发送失败：",
    msg_rec_source_prefix: "推荐来源："
  }
};

function t(key) {
  return I18N[currentLang]?.[key] || I18N.en[key] || key;
}

function setSelectOptions(selectEl, options) {
  const previous = selectEl.value;
  selectEl.innerHTML = "";
  for (const option of options) {
    const el = document.createElement("option");
    el.value = option.value;
    el.textContent = option.label;
    selectEl.appendChild(el);
  }
  const stillExists = Array.from(selectEl.options).some((opt) => opt.value === previous);
  selectEl.value = stillExists ? previous : options[0]?.value || "";
}

function buildCoolingOffOptions() {
  return {
    loanPurpose: [
      { value: "daily_expenses", label: t("purpose_daily") },
      { value: "electronics", label: t("purpose_electronics") },
      { value: "education_training", label: t("purpose_education") },
      { value: "entertainment_social", label: t("purpose_entertainment") },
      { value: "medical_emergency", label: t("purpose_medical") },
      { value: "other", label: t("purpose_other") }
    ],
    loanAmountRange: [
      { value: "below_1000", label: t("amount_below_1000") },
      { value: "1000_5000", label: t("amount_1000_5000") },
      { value: "5000_10000", label: t("amount_5000_10000") },
      { value: "10000_50000", label: t("amount_10000_50000") },
      { value: "above_50000", label: t("amount_above_50000") }
    ],
    repaymentSource: [
      { value: "parents_allowance", label: t("repay_parents") },
      { value: "work_study_income", label: t("repay_work_study") },
      { value: "scholarship_aid", label: t("repay_scholarship") },
      { value: "other_loans_rollover", label: t("repay_other_loans") },
      { value: "no_clear_plan", label: t("repay_no_plan") }
    ]
  };
}

function refreshScenarioSelectLabels() {
  setSelectOptions(ui.stage, [
    { value: "browse", label: t("stage_browse") },
    { value: "fill", label: t("stage_fill") },
    { value: "submit", label: t("stage_submit") }
  ]);
  setSelectOptions(ui.consent, [
    { value: "granted", label: t("consent_granted") },
    { value: "not_granted", label: t("consent_not_granted") },
    { value: "revoked", label: t("consent_revoked") }
  ]);
  const cooling = buildCoolingOffOptions();
  setSelectOptions(ui.loanPurpose, cooling.loanPurpose);
  setSelectOptions(ui.loanAmountRange, cooling.loanAmountRange);
  setSelectOptions(ui.repaymentSource, cooling.repaymentSource);
}

function applyStaticUiCopy() {
  document.documentElement.lang = currentLang === "zh" ? "zh-CN" : "en";
  document.title = t("page_title");

  ui.pageTitle.innerHTML = `${t("page_title_brand")}<br>${t("page_title_main")}`;
  ui.pageSubtitle.textContent = t("page_subtitle");

  ui.h2_settings.textContent = t("h2_settings");
  ui.h2_session.textContent = t("h2_session");
  ui.h2_scenario.textContent = t("h2_scenario");
  ui.h2_intervention.textContent = t("h2_intervention");
  ui.h2_consent.textContent = t("h2_consent");
  ui.h2_risk.textContent = t("h2_risk");
  ui.h2_cost.textContent = t("h2_cost");
  ui.h2_explain.textContent = t("h2_explain");
  ui.h2_alternatives.textContent = t("h2_alternatives");
  ui.h2_finance.textContent = t("h2_finance");
  ui.h2_education.textContent = t("h2_education");
  ui.h2_wellbeing.textContent = t("h2_wellbeing");
  ui.h2_history.textContent = t("h2_history");
  ui.h2_upload.textContent = t("h2_upload");

  ui.label_language.textContent = t("label_language");
  ui.label_api_base_url.textContent = t("label_api_base_url");
  ui.label_api_key.textContent = t("label_api_key");
  ui.label_consent_note.textContent = t("label_consent_note");
  ui.label_page_text.textContent = t("label_page_text");
  if (ui.label_page_url) {
    ui.label_page_url.textContent = t("label_page_url");
  }
  ui.label_apr.textContent = t("label_apr");
  ui.label_principal.textContent = t("label_principal");
  ui.label_months.textContent = t("label_months");
  ui.label_stage.textContent = t("label_stage");
  ui.label_consent.textContent = t("label_consent");
  ui.label_consent_scopes.textContent = t("label_consent_scopes");
  ui.label_consent_reason.textContent = t("label_consent_reason");

  ui.scopeTelemetryText.textContent = t("scope_telemetry");
  ui.scopeSchoolSupportText.textContent = t("scope_school_support");
  ui.scopePartnerOffersText.textContent = t("scope_partner_offers");

  ui.saveApiBaseUrl.textContent = t("btn_save_settings");
  ui.syncConsentBtn.textContent = t("btn_update_consent");
  ui.analyzeBtn.textContent = t("btn_run_check");
  ui.uploadBtn.textContent = t("btn_send_summary");
  ui.saveConsentPrefsBtn.textContent = t("btn_save_consent_prefs");
  ui.refreshHistoryBtn.textContent = t("btn_refresh_history");
  if (ui.fetchFromUrlBtn) {
    ui.fetchFromUrlBtn.textContent = t("btn_fetch_page_url");
  }
  if (ui.loadScenarioSampleBtn) {
    ui.loadScenarioSampleBtn.textContent = t("btn_load_scenario_sample");
  }

  ui.apiBaseUrl.placeholder = t("placeholder_api_base");
  ui.apiKey.placeholder = t("placeholder_api_key");
  ui.consentNote.placeholder = t("placeholder_consent_note");
  ui.scenarioText.placeholder = t("placeholder_page_text");
  ui.consentReason.placeholder = t("placeholder_consent_reason");

  ui.cooldownLabel.textContent = t("cooldown_label");

  ui.interventionBanner.textContent = t("intervention_idle");
  ui.riskOutput.textContent = t("empty_risk");
  ui.costOutput.textContent = t("empty_cost");
  ui.explainOutput.textContent = t("empty_explain");
  ui.recommendationOutput.textContent = t("empty_recommendations");
  ui.regularChannelOutput.textContent = t("empty_finance");
  ui.consentSummaryOutput.textContent = t("empty_consent_summary");
  ui.historyOutput.textContent = t("empty_history");
  ui.uploadOutput.textContent = t("empty_upload");
  ui.educationOutput.textContent = t("education_empty");
  ui.wellbeingOutput.textContent = t("wellbeing_empty");

  refreshScenarioSelectLabels();
  syncHistoryToggleLabel();
}

function isHistoryCollapsed() {
  return Boolean(ui.historySection?.classList.contains("history-collapsed"));
}

function syncHistoryToggleLabel() {
  if (!ui.historyToggleBtn) return;
  const collapsed = isHistoryCollapsed();
  ui.historyToggleBtn.textContent = collapsed ? t("history_toggle_expand") : t("history_toggle_collapse");
  ui.historyToggleBtn.setAttribute("aria-expanded", collapsed ? "false" : "true");
}

function setHistoryCollapsed(collapsed) {
  if (!ui.historySection) return;
  ui.historySection.classList.toggle("history-collapsed", collapsed);
  try {
    localStorage.setItem(HISTORY_COLLAPSED_KEY, collapsed ? "1" : "0");
  } catch (_e) {
    // ignore storage failures
  }
  syncHistoryToggleLabel();
}

function setUiLanguage(lang) {
  currentLang = lang === "zh" ? "zh" : "en";
  applyStaticUiCopy();
  ui.q1Label.textContent = t("q1");
  ui.q2Label.textContent = t("q2");
  ui.q3Label.textContent = t("q3");
  refreshSupportResources().catch(() => {
    // keep UI responsive even if resources fail once
  });
}

function labelForCoolingValue(kind, value) {
  const cooling = buildCoolingOffOptions();
  const list =
    kind === "purpose" ? cooling.loanPurpose : kind === "amount" ? cooling.loanAmountRange : cooling.repaymentSource;
  const found = list.find((item) => item.value === value);
  return found?.label || value;
}

function createEventId() {
  return `event_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

const RECOMMENDATION_ZH_TEXT_MAP = {
  "Library Assistant (Campus)": "图书馆助理（校内）",
  "Teaching Support Assistant": "教学支持助理",
  "Regulated Education Credit (Live Indexed)": "正规教育信贷（实时索引）",
  "Bank Education Installment (Demo)": "银行教育分期（演示）",
  "Campus Work-Study Priority": "优先校内勤工助学",
  "Licensed Education Finance Option": "持牌教育金融方案",
  "Campus Library": "校园图书馆",
  "Academic Affairs Office": "教务处",
  "Partnered Regulated Institution": "合作持牌机构",
  "Regulated Bank Channel": "持牌银行渠道",
  "Demo Bank": "演示银行",
  "Submit availability and student ID to apply.": "提交可上岗时间与学生证信息后申请。",
  "Apply through campus work-study portal.": "通过校内勤工助学平台提交申请。",
  "Compare APR and full repayment schedule before approval.": "审批前请对比年化利率与完整还款计划。",
  "Bring student ID and apply via official portal.": "携带学生证并通过官方入口申请。",
  "Open school job board and shortlist 2 stable hourly positions.": "打开校内岗位板块，筛选 2 个稳定时薪岗位。",
  "Compare contract APR and total payment before any approval step.": "在任何审批前，对比合同 APR 与总还款金额。",
  "Stable part-time income can reduce borrowing urgency.": "稳定的兼职收入可降低借款紧迫性。",
  "Campus role has transparent hourly payment.": "校内岗位时薪透明、可核验。",
  "Short shifts fit class schedule.": "短时班次更适配课程安排。",
  "Lower financial risk than emergency lending.": "相较应急借贷，财务风险更低。",
  "Live market data path confirmed from public API.": "已通过公开 API 验证实时市场数据链路。",
  "Regulated channel with transparent repayment terms.": "持牌机构渠道，还款条款透明。",
  "Income-based solution reduces debt pressure.": "以收入补充为主，能缓解债务压力。",
  "Lower financial risk compared with unsecured borrowing.": "相较无担保借贷，整体风险更低。",
  "Regulated institution with transparent contract terms.": "持牌机构，合同条款更透明。",
  "Supports explainable comparison with risky offers.": "支持对高风险方案进行可解释对比。",
  "Full-time student with valid ID and repayment source.": "全日制在读学生，具备有效证件与还款来源。",
  "Full-time student, no active delinquency in campus account.": "全日制在读学生，校内账户无在途逾期。",
  "Full-time student with valid enrollment proof.": "全日制在读学生，具备有效在读证明。",
  "See provider requirements.": "请以机构资质要求为准。",
  "Review details before proceeding.": "继续前请先核对详情。",
  "Recommended by backend channel policy.": "由后端渠道策略推荐。"
};

const RECOMMENDATION_ZH_SOURCE_MAP = {
  mock: "模拟",
  live: "实时",
  local: "本地",
  local_fallback: "本地兜底",
  backend: "后端",
  institution_api: "机构接口",
  unknown: "未知"
};

const RECOMMENDATION_ZH_INTEGRATION_MAP = {
  testing: "测试中",
  demo: "演示",
  signed: "已签约",
  local_demo: "本地演示",
  unknown: "未知"
};

function toZhRecommendationText(value) {
  if (typeof value !== "string") return value;
  return RECOMMENDATION_ZH_TEXT_MAP[value] || value;
}

function localizeRecommendationItem(item) {
  if (currentLang !== "zh" || !item) {
    return item;
  }

  const source = String(item.data_source || "unknown").toLowerCase();
  const integration = String(item.integration_status || "unknown").toLowerCase();
  const channelRaw = String(item.channel_type || "");
  let channelLabel = channelRaw;
  if (channelRaw === "work") {
    channelLabel = "勤工助学";
  } else if (channelRaw === "finance") {
    channelLabel = "正规金融";
  } else if (channelRaw === "mixed") {
    channelLabel = "混合渠道";
  }

  return {
    ...item,
    channel_type: channelLabel,
    title: toZhRecommendationText(item.title),
    provider_name: toZhRecommendationText(item.provider_name),
    next_action: toZhRecommendationText(item.next_action),
    eligibility: toZhRecommendationText(item.eligibility),
    integration_status: RECOMMENDATION_ZH_INTEGRATION_MAP[integration] || toZhRecommendationText(item.integration_status),
    data_source: RECOMMENDATION_ZH_SOURCE_MAP[source] || source,
    why_recommended: (item.why_recommended || []).map((entry) => toZhRecommendationText(entry))
  };
}

function renderRecommendations(recommendations) {
  // "Campus alternatives" should avoid duplicating items shown in
  // the dedicated "Verified finance options" section.
  const campusOnly = (recommendations || []).filter((item) => item.channel_type !== "finance");

  if (campusOnly.length === 0) {
    ui.recommendationOutput.textContent = t("no_recommendation");
    return;
  }

  ui.recommendationOutput.innerHTML = campusOnly
    .map((item) => localizeRecommendationItem(item))
    .map(
      (item) => `
      <article class="recommendation">
        <h3>${item.title}</h3>
        <p><strong>${t("rec_channel")}:</strong> ${item.channel_type}</p>
        <p><strong>${t("rec_provider")}:</strong> ${item.provider_name}</p>
        <p><strong>${t("rec_next_action")}:</strong> ${item.next_action}</p>
        <p><strong>${t("rec_why")}:</strong> ${item.why_recommended.join("; ")}</p>
        <p><strong>${t("rec_source")}:</strong> ${item.data_source || "local"}</p>
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

function escapeHtml(value) {
  if (value == null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderRegularChannels(recommendations) {
  const regular = (recommendations || []).filter((item) => item.channel_type === "finance");
  if (!regular.length) {
    ui.regularChannelOutput.textContent = t("empty_finance");
    return;
  }

  ui.regularChannelOutput.innerHTML = regular
    .map((item) => localizeRecommendationItem(item))
    .map((item) => {
      const appUrl = safeUrl(item.application_url);
      const termSuffix = currentLang === "zh" ? "个月" : "months";
      return `
      <article class="recommendation">
        <h3>${item.title}</h3>
        <p><strong>${t("rec_provider")}:</strong> ${item.provider_name}</p>
        <p><strong>${t("finance_apr")}:</strong> ${item.apr ?? "-"}%</p>
        <p><strong>${t("finance_term")}:</strong> ${item.term_months || "-"} ${termSuffix}</p>
        <p><strong>${t("finance_eligibility")}:</strong> ${item.eligibility || "-"}</p>
        <p><strong>${t("finance_integration")}:</strong> ${item.integration_status || "-"}</p>
        <p><strong>${t("finance_verified")}:</strong> ${
          item.institution_verified ? t("finance_verified_yes") : t("finance_verified_pending")
        }</p>
        <p><strong>${t("rec_source")}:</strong> ${item.data_source || "unknown"}</p>
        ${appUrl ? `<a href="${appUrl}" target="_blank" rel="noopener noreferrer">${t("finance_open_link")}</a>` : `<p><em>${t("finance_link_unavailable")}</em></p>`}
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
    .map(([key]) => {
      if (key === "telemetry") return t("scope_label_telemetry");
      if (key === "school_support") return t("scope_label_school_support");
      if (key === "partner_offers") return t("scope_label_partner_offers");
      return key.replaceAll("_", " ");
    });
  const summary = enabled.length ? enabled.join(", ") : t("none");
  ui.consentSummaryOutput.innerHTML = `
    <strong>${t("summary_consent_state")}</strong> ${consentState}<br/>
    <strong>${t("summary_granted_scopes")}</strong> ${summary}<br/>
    <strong>${t("summary_session")}</strong> ${studentSessionId}
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
      const safeSteps = Array.isArray(item.steps) ? item.steps.map((x) => escapeHtml(x)).join("; ") : "";
      return `
        <article class="resource-card">
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.description)}</p>
          ${safeSteps ? `<p><strong>${t("resource_next_steps")}:</strong> ${safeSteps}</p>` : ""}
          ${safeLink ? `<a href="${safeLink}" target="_blank" rel="noopener noreferrer">${t("open_resource")}</a>` : ""}
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
    ui.historyOutput.textContent = `${t("history_error_prefix")} ${error.message}`;
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
      apiKey: getApiKey(),
      lang: currentLang
    });
    renderResourceList(
      ui.educationOutput,
      payload.education || [],
      t("education_empty")
    );
    renderResourceList(
      ui.wellbeingOutput,
      payload.wellbeing || [],
      t("wellbeing_empty")
    );
  } catch (error) {
    ui.educationOutput.textContent = `${t("education_error_prefix")} ${error.message}`;
    ui.wellbeingOutput.textContent = `${t("wellbeing_error_prefix")} ${error.message}`;
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

function extractFinancialConcepts(text) {
  const concepts = [];
  if (!text) return concepts;
  const lower = text.toLowerCase();

  if (/(必下|稳下|秒批|100%通过|guaranteed approval|zero review|no review|no credit check)/i.test(lower)) {
    concepts.push({
      id: "CONCEPT_GUARANTEED_APPROVAL",
      label_zh: "保证通过 / 零审核",
      label_en: "Guaranteed approval / no review",
      severity: "high"
    });
  }

  if (/(先(交|付).*(手续费|保证金|会费)|transfer fee first|upfront fee|front fee)/i.test(lower)) {
    concepts.push({
      id: "CONCEPT_FRONT_FEE",
      label_zh: "前置收费 / 砍头息",
      label_en: "Upfront fee / front-loaded cost",
      severity: "high"
    });
  }

  if (/(0首付|零首付|zero down payment)/i.test(lower)) {
    concepts.push({
      id: "CONCEPT_ZERO_DOWN",
      label_zh: "零首付营销",
      label_en: "Zero down payment marketing",
      severity: "medium"
    });
  }

  if (/(日利率|日息|daily rate)/i.test(lower)) {
    concepts.push({
      id: "CONCEPT_DAILY_RATE_MARKETING",
      label_zh: "用日利率淡化真实年化成本",
      label_en: "Daily rate framing that hides true annual cost",
      severity: "medium"
    });
  }

  if (/(以贷养贷|以贷还贷|roll over debt|debt rollover)/i.test(lower)) {
    concepts.push({
      id: "CONCEPT_DEBT_ROLLOVER",
      label_zh: "以贷养贷 / 债务滚动",
      label_en: "Debt rollover / borrowing to repay debt",
      severity: "high"
    });
  }

  return concepts;
}

function debounce(fn, delayMs) {
  let timer = null;
  return (...args) => {
    if (timer) {
      window.clearTimeout(timer);
    }
    timer = window.setTimeout(() => {
      timer = null;
      fn(...args);
    }, delayMs);
  };
}

/**
 * Auto-fill from page text: APR (always when parsed), principal, months, stage, consent, Q2 range, optional URL.
 * Q1 (purpose) and Q3 (repayment) are never set here.
 */
function applyScenarioAutoFillFromPageText() {
  const text = ui.scenarioText.value;
  const parsed = parseScenarioText(text);
  if (parsed.apr != null) {
    ui.apr.value = String(parsed.apr);
  }
  if (parsed.principal != null) {
    ui.principal.value = String(Math.round(parsed.principal));
  }
  if (parsed.months != null) {
    ui.months.value = String(parsed.months);
  }
  if (parsed.stage != null) {
    ui.stage.value = parsed.stage;
  }
  if (parsed.consent != null) {
    ui.consent.value = parsed.consent;
  }
  if (parsed.loanAmountRange != null) {
    ui.loanAmountRange.value = parsed.loanAmountRange;
  }
  if (parsed.scenarioUrl && !ui.scenarioUrl.value.trim()) {
    ui.scenarioUrl.value = parsed.scenarioUrl;
  }

  // Keep the APR field consistent with the final recommendation logic:
  // if cash-flow info is sufficient, display effective APR immediately.
  const preview = analyzeRisk({
    apr: Number(ui.apr.value) || parsed.apr || 0,
    pageText: text,
    principal: Number(ui.principal.value) || parsed.principal || 0,
    months: Number(ui.months.value) || parsed.months || 12
  });
  if (Number.isFinite(preview.effective_apr) && preview.effective_apr > 0) {
    ui.apr.value = String(Number(preview.effective_apr.toFixed(2)));
  }
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
    `${t("reflection_prefix")}: ${t("reflection_q1")}=${labelForCoolingValue("purpose", purpose)}; ${t(
      "reflection_q2"
    )}=${labelForCoolingValue("amount", amountRange)}; ${t("reflection_q3")}=${labelForCoolingValue(
      "repay",
      repay
    )}`
  );
  return notes;
}

function renderCostOutput(costSnapshot) {
  ui.costOutput.innerHTML = `
    <strong>${t("cost_monthly")}</strong> ${t("currency")} ${costSnapshot.estimated_monthly_payment}<br/>
    <strong>${t("cost_total")}</strong> ${t("currency")} ${costSnapshot.estimated_total_repayment}<br/>
    <strong>${t("cost_interest")}</strong> ${t("currency")} ${costSnapshot.estimated_total_interest}<br/>
    <strong>${t("cost_overdue")}</strong> ${t("currency")} ${costSnapshot.overdue_one_month_extra}
  `;
}

function renderExplainability({ analysis, selfCheckNotes, costSnapshot }) {
  if (currentLang === "zh") {
    const contract = analysis?.contract_amount ?? costSnapshot.principal ?? 0;
    const upfront = analysis?.upfront_fee_amount ?? 0;
    const disbursed = analysis?.disbursed_amount ?? Math.max(Number(contract) - Number(upfront), 0);
    const monthly = analysis?.monthly_repayment ?? costSnapshot.estimated_monthly_payment ?? 0;
    const periods = analysis?.periods ?? costSnapshot.months ?? 0;
    const effectiveApr = analysis?.effective_apr ?? costSnapshot.apr ?? 0;

    const sentence = `根据你提供的借贷信息，合同金额为 ${contract} 元，扣除前置费用 ${upfront} 元后实际到手 ${disbursed} 元，每月还款 ${monthly} 元，共 ${periods} 期，通过真实现金流计算得出实际年化利率为 ${effectiveApr}%；该借款通过宣传低息、隐藏前置服务费的方式模糊真实成本，属于典型的套路借贷话术，建议谨慎使用，避免因隐藏成本导致实际还款成本过高。`;
    ui.explainOutput.innerHTML = `<strong>${t("explain_title")}</strong><p>${sentence}</p>`;
    return;
  }

  const notes = [
    ...analysis.why_flagged,
    ...selfCheckNotes,
    `At ${costSnapshot.apr}% APR and ${costSnapshot.months} months repayment, estimated total repayment is ${t("currency")} ${costSnapshot.estimated_total_repayment}.`
  ];
  ui.explainOutput.innerHTML = `<strong>${t("explain_title")}</strong><ul>${notes
    .map((note) => `<li>${note}</li>`)
    .join("")}</ul>`;
}

function buildEventPayload() {
  if (!latestAnalysis) {
    return null;
  }

  const scenario = getScenarioInput();
  const scenarioForCost = {
    ...scenario,
    apr: Number.isFinite(latestAnalysis.effective_apr) ? latestAnalysis.effective_apr : scenario.apr
  };
  const costSnapshot = calculateCostSnapshot(scenarioForCost);
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
  try {
    const saved = localStorage.getItem(HISTORY_COLLAPSED_KEY);
    if (saved === "1") {
      setHistoryCollapsed(true);
    } else {
      syncHistoryToggleLabel();
    }
  } catch (_e) {
    syncHistoryToggleLabel();
  }

  ui.historyToggleBtn?.addEventListener("click", () => {
    setHistoryCollapsed(!isHistoryCollapsed());
  });

  ui.sessionMeta.innerHTML = `
    <strong>${t("session_meta_title")}</strong> ${studentSessionId}<br/>
    <strong>${t("session_meta_purpose")}</strong> ${t("session_meta_body")}
  `;
  summarizeConsent(storedScopes, ui.consent.value);

  ui.saveApiBaseUrl.addEventListener("click", () => {
    setApiBaseUrl(ui.apiBaseUrl.value);
    setApiKey(ui.apiKey.value);
    ui.uploadOutput.textContent = `${t("msg_saved_settings_prefix")} ${getApiBaseUrl()}`;
  });

  ui.languageSelect.addEventListener("change", () => {
    setLanguage(ui.languageSelect.value);
    setUiLanguage(ui.languageSelect.value);
    ui.uploadOutput.textContent =
      ui.languageSelect.value === "zh" ? t("msg_lang_switched_zh") : t("msg_lang_switched_en");
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
      ui.uploadOutput.textContent = `${t("msg_consent_sync_prefix")}\n${JSON.stringify(result, null, 2)}`;
    } catch (error) {
      ui.uploadOutput.textContent = `${t("msg_consent_sync_fail_prefix")} ${error.message}`;
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
          note: ui.consentNote.value || t("default_consent_note_saved_prefs"),
          reason: ui.consentReason.value || "",
          scopes
        },
        apiKey: getApiKey()
      });
      await refreshStudentHistory();
      ui.uploadOutput.textContent = t("msg_consent_saved");
    } catch (error) {
      ui.uploadOutput.textContent = `${t("msg_consent_saved_partial_prefix")} ${error.message}`;
    }
  });

  ui.refreshHistoryBtn.addEventListener("click", async () => {
    await refreshStudentHistory();
  });

  const debouncedScenarioAutoFill = debounce(() => applyScenarioAutoFillFromPageText(), 300);
  ui.scenarioText.addEventListener("input", () => {
    debouncedScenarioAutoFill();
  });

  ui.analyzeBtn.addEventListener("click", async () => {
    applyScenarioAutoFillFromPageText();
    const scenario = getScenarioInput();
    latestAnalysis = analyzeRisk(scenario);
    const scenarioForCost = {
      ...scenario,
      apr: Number.isFinite(latestAnalysis.effective_apr) ? latestAnalysis.effective_apr : scenario.apr
    };
    // Keep the visible APR field aligned with the APR used in downstream cost/recommendation logic.
    if (Number.isFinite(scenarioForCost.apr) && scenarioForCost.apr > 0) {
      ui.apr.value = String(Number(scenarioForCost.apr.toFixed(2)));
    }
    const costSnapshot = calculateCostSnapshot(scenarioForCost);
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
        apr: scenarioForCost.apr
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
    ui.uploadOutput.textContent = `${t("msg_rec_source_prefix")} ${latestRecommendationSource}`;
  });

  ui.loadScenarioSampleBtn?.addEventListener("click", () => {
    ui.scenarioText.value = currentLang === "zh" ? SAMPLE_SCENARIO_TEXT_ZH : SAMPLE_SCENARIO_TEXT_EN;
    applyScenarioAutoFillFromPageText();
  });

  ui.fetchFromUrlBtn?.addEventListener("click", async () => {
    const rawUrl = ui.scenarioUrl.value.trim();
    if (!rawUrl) {
      return;
    }
    try {
      const resp = await fetch(
        `${getApiBaseUrl().replace(/\/$/, "")}/proxy/fetch?url=${encodeURIComponent(rawUrl)}`,
        getApiKey()
          ? { headers: { "x-api-key": getApiKey() } }
          : undefined
      );
      const envelope = await resp.json();
      if (!resp.ok || envelope.success === false) {
        throw new Error(envelope?.message || `HTTP ${resp.status}`);
      }
      const text = envelope?.data?.text ?? envelope?.text ?? "";
      ui.scenarioText.value = text;
      applyScenarioAutoFillFromPageText();
      ui.uploadOutput.textContent = t("msg_fetch_page_ok");
    } catch (error) {
      ui.uploadOutput.textContent = `${t("msg_url_fetch_fail_prefix")} ${error.message}`;
    }
  });

  ui.uploadBtn.addEventListener("click", async () => {
    const payload = buildEventPayload();
    if (!payload) {
      ui.uploadOutput.textContent = t("msg_need_check_first");
      return;
    }

    try {
      const result = await uploadRiskEvent({
        apiBaseUrl: getApiBaseUrl(),
        eventPayload: payload,
        apiKey: getApiKey()
      });
      await refreshStudentHistory();
      ui.uploadOutput.textContent = `${JSON.stringify(result, null, 2)}\n\n${t("msg_rec_source_prefix")} ${
        latestRecommendationSource
      }`;
    } catch (error) {
      ui.uploadOutput.textContent = `${t("msg_upload_fail_prefix")} ${error.message}`;
    }
  });

  refreshConsentProfile();
  refreshStudentHistory();
  refreshSupportResources();
}

initialize();
