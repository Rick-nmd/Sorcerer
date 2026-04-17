const STORAGE_KEY = "school_console_api_base_url";
const API_KEY_STORAGE_KEY = "school_console_api_key";
const LANGUAGE_STORAGE_KEY = "school_console_language";
const AUDIT_COLLAPSED_KEY = "school_console_audit_collapsed";
const EVENTS_COLLAPSED_KEY = "school_console_events_collapsed";
const TIMELINE_COLLAPSED_KEY = "school_console_timeline_collapsed";

const ui = {
  languageSelect: document.getElementById("languageSelect"),
  pageTitle: document.getElementById("pageTitle"),
  tipLabel: document.getElementById("tipLabel"),
  tipText: document.getElementById("tipText"),
  h2_filters: document.getElementById("h2_filters"),
  label_language: document.getElementById("label_language"),
  label_backend_url: document.getElementById("label_backend_url"),
  label_api_key: document.getElementById("label_api_key"),
  label_risk_tier: document.getElementById("label_risk_tier"),
  label_channel: document.getElementById("label_channel"),
  label_source: document.getElementById("label_source"),
  label_session: document.getElementById("label_session"),
  label_timeline_session: document.getElementById("label_timeline_session"),
  label_from: document.getElementById("label_from"),
  label_to: document.getElementById("label_to"),
  label_auto_refresh: document.getElementById("label_auto_refresh"),
  h2_summary: document.getElementById("h2_summary"),
  summary_total_label: document.getElementById("summary_total_label"),
  summary_risk_label: document.getElementById("summary_risk_label"),
  summary_channel_label: document.getElementById("summary_channel_label"),
  summary_consent_label: document.getElementById("summary_consent_label"),
  summary_source_label: document.getElementById("summary_source_label"),
  eventsSection: document.getElementById("eventsSection"),
  eventsToggleBtn: document.getElementById("eventsToggleBtn"),
  eventsPanel: document.getElementById("eventsPanel"),
  h2_events: document.getElementById("h2_events"),
  th_event_id: document.getElementById("th_event_id"),
  th_timestamp: document.getElementById("th_timestamp"),
  th_session: document.getElementById("th_session"),
  th_risk: document.getElementById("th_risk"),
  th_channel: document.getElementById("th_channel"),
  th_source: document.getElementById("th_source"),
  th_consent: document.getElementById("th_consent"),
  th_why_flagged: document.getElementById("th_why_flagged"),
  th_why_recommended: document.getElementById("th_why_recommended"),
  h2_consent_log: document.getElementById("h2_consent_log"),
  th_consent_id: document.getElementById("th_consent_id"),
  th_consent_ts: document.getElementById("th_consent_ts"),
  th_consent_session: document.getElementById("th_consent_session"),
  th_consent_actor: document.getElementById("th_consent_actor"),
  th_consent_state: document.getElementById("th_consent_state"),
  th_consent_scopes: document.getElementById("th_consent_scopes"),
  th_consent_note: document.getElementById("th_consent_note"),
  h2_consent_snapshot: document.getElementById("h2_consent_snapshot"),
  th_profile_session: document.getElementById("th_profile_session"),
  th_profile_state: document.getElementById("th_profile_state"),
  th_profile_scopes: document.getElementById("th_profile_scopes"),
  th_profile_updated_at: document.getElementById("th_profile_updated_at"),
  th_profile_updated_by: document.getElementById("th_profile_updated_by"),
  th_profile_reason: document.getElementById("th_profile_reason"),
  h2_timeline: document.getElementById("h2_timeline"),
  h2_support: document.getElementById("h2_support"),
  h3_education: document.getElementById("h3_education"),
  h3_wellbeing: document.getElementById("h3_wellbeing"),
  h2_network: document.getElementById("h2_network"),
  th_sig_id: document.getElementById("th_sig_id"),
  th_sig_session: document.getElementById("th_sig_session"),
  th_sig_observed: document.getElementById("th_sig_observed"),
  th_sig_category: document.getElementById("th_sig_category"),
  th_sig_l7: document.getElementById("th_sig_l7"),
  th_sig_conf: document.getElementById("th_sig_conf"),
  h2_audit: document.getElementById("h2_audit"),
  th_audit_id: document.getElementById("th_audit_id"),
  th_audit_ts: document.getElementById("th_audit_ts"),
  th_audit_actor: document.getElementById("th_audit_actor"),
  th_audit_action: document.getElementById("th_audit_action"),
  th_audit_resource: document.getElementById("th_audit_resource"),
  th_audit_chain: document.getElementById("th_audit_chain"),
  apiBaseUrl: document.getElementById("apiBaseUrl"),
  apiKey: document.getElementById("apiKey"),
  riskLevel: document.getElementById("riskLevel"),
  channelType: document.getElementById("channelType"),
  sourceFilter: document.getElementById("sourceFilter"),
  studentSessionId: document.getElementById("studentSessionId"),
  timelineSessionId: document.getElementById("timelineSessionId"),
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
  timelineSection: document.getElementById("timelineSection"),
  timelineToggleBtn: document.getElementById("timelineToggleBtn"),
  timelinePanel: document.getElementById("timelinePanel"),
  supportMeta: document.getElementById("supportMeta"),
  educationResources: document.getElementById("educationResources"),
  wellbeingResources: document.getElementById("wellbeingResources"),
  networkMeta: document.getElementById("networkMeta"),
  networkBody: document.getElementById("networkBody"),
  auditMeta: document.getElementById("auditMeta"),
  auditBody: document.getElementById("auditBody"),
  auditSection: document.getElementById("auditSection"),
  auditToggleBtn: document.getElementById("auditToggleBtn"),
  auditPanel: document.getElementById("auditPanel")
};
let autoRefreshTimer = null;

function getLanguage() {
  const raw = (localStorage.getItem(LANGUAGE_STORAGE_KEY) || "en").trim();
  return raw === "zh" ? "zh" : "en";
}

function setLanguage(value) {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, value === "zh" ? "zh" : "en");
}

let currentLang = getLanguage();

const I18N = {
  en: {
    title: "LoanShield:Campus Support Console",
    title_brand: "LoanShield",
    title_main: "Campus Support Console",
    tip_label: "Tip:",
    tip_text:
      "use the backend port printed in your terminal (for example from npm run demo). Example: http://localhost:8788/console (the port may differ from 8787).",
    h2_filters: "Query & filters",
    label_language: "Language / 语言",
    label_backend_url: "Backend URL",
    label_api_key: "API key (optional)",
    label_risk_tier: "Risk tier",
    label_channel: "Channel",
    label_source: "Event source",
    label_session: "Student session ID",
    label_from: "From",
    label_to: "To",
    btn_refresh: "Refresh",
    btn_export: "Export events (CSV)",
    btn_load_demo: "Load demo dataset",
    btn_clear_demo: "Clear demo dataset",
    auto_refresh: "Auto refresh every 8 seconds",
    h2_summary: "Summary",
    summary_total: "Total support events",
    summary_risk: "Risk tiers",
    summary_channel: "Channels",
    summary_consent: "Consent states",
    summary_source: "Event sources",
    h2_events: "Support events",
    meta_empty: "No support events loaded yet.",
    th_event_id: "Event ID",
    th_timestamp: "Timestamp",
    th_session: "Session",
    th_risk: "Risk tier",
    th_channel: "Channel",
    th_source: "Source",
    th_consent: "Consent",
    th_why_flagged: "Why flagged",
    th_why_recommended: "Why recommended",
    h2_consent_log: "Consent change log",
    th_consent_id: "Consent record ID",
    th_consent_ts: "Timestamp",
    th_consent_session: "Session",
    th_consent_actor: "Who",
    th_consent_state: "State",
    th_consent_scopes: "Scopes",
    th_consent_note: "Note",
    h2_consent_snapshot: "Consent snapshot",
    th_profile_session: "Session",
    th_profile_state: "State",
    th_profile_scopes: "Scopes",
    th_profile_updated_at: "Updated At",
    th_profile_updated_by: "Updated By",
    th_profile_reason: "Reason",
    h2_timeline: "Student timeline",
    btn_load_timeline: "Load student timeline",
    h2_support: "Student support content",
    h3_education: "Education",
    h3_wellbeing: "Wellbeing",
    h2_network: "Network safety signals",
    th_sig_id: "Signal ID",
    th_sig_session: "Session",
    th_sig_observed: "Observed At",
    th_sig_category: "Category",
    th_sig_l7: "L7 Signal",
    th_sig_conf: "Confidence",
    h2_audit: "Governance audit chain",
    th_audit_id: "Audit ID",
    th_audit_ts: "Timestamp",
    th_audit_actor: "Actor",
    th_audit_action: "Action",
    th_audit_resource: "Resource",
    th_audit_chain: "Hash Chain",
    consent_meta_empty: "No consent events loaded yet.",
    consent_profiles_meta_empty: "No consent profiles loaded yet.",
    support_meta_empty: "No support resources loaded yet.",
    network_meta_empty: "No network signals loaded yet.",
    audit_meta_empty: "No audit events loaded yet.",
    timeline_meta_hint: "Paste a student session ID in the input above, then load the timeline.",
    timeline_empty: "No student timeline loaded yet.",
    meta_loaded_items: "Loaded {loaded} / total {total} item(s).",
    meta_loaded_consent_events: "Loaded {loaded} / total {total} consent event(s).",
    meta_loaded_consent_profiles: "Loaded {loaded} / total {total} consent profile(s).",
    meta_loaded_network_signals: "Loaded {loaded} / total {total} network signal(s).",
    meta_loaded_audit_events: "Loaded {loaded} / total {total} audit event(s).",
    support_meta_counts: "Education {education}, wellbeing {wellbeing} resource(s).",
    empty_events_found: "No events found.",
    empty_consent_events_found: "No consent events found.",
    empty_consent_profiles_found: "No consent profiles found.",
    empty_network_signals_found: "No network signals found.",
    empty_audit_events_found: "No audit events found.",
    empty_education_resources: "No education resources found.",
    empty_wellbeing_resources: "No wellbeing resources found.",
    audit_toggle_collapse: "Collapse",
    audit_toggle_expand: "Expand",
    events_toggle_collapse: "Collapse",
    events_toggle_expand: "Expand",
    timeline_toggle_collapse: "Collapse",
    timeline_toggle_expand: "Expand"
  },
  zh: {
    title: "贷盾：学校支持平台",
    title_brand: "贷盾",
    title_main: "学校支持平台",
    tip_label: "提示：",
    tip_text:
      "请使用终端输出的后端端口（例如通过 npm run demo 启动）。示例：http://localhost:8788/console（端口不一定是 8787）。",
    h2_filters: "查询与筛选",
    label_language: "语言 / Language",
    label_backend_url: "后端地址",
    label_api_key: "API key（可选）",
    label_risk_tier: "风险等级",
    label_channel: "渠道",
    label_source: "事件来源",
    label_session: "学生会话 ID",
    label_from: "开始时间",
    label_to: "结束时间",
    btn_refresh: "刷新",
    btn_export: "导出事件（CSV）",
    btn_load_demo: "加载演示数据",
    btn_clear_demo: "清空演示数据",
    auto_refresh: "每 8 秒自动刷新",
    h2_summary: "汇总",
    summary_total: "支持事件总数",
    summary_risk: "风险等级",
    summary_channel: "渠道分布",
    summary_consent: "同意状态",
    summary_source: "事件来源",
    h2_events: "支持事件",
    meta_empty: "尚未加载支持事件。",
    th_event_id: "事件 ID",
    th_timestamp: "时间",
    th_session: "会话",
    th_risk: "风险等级",
    th_channel: "渠道",
    th_source: "来源",
    th_consent: "同意",
    th_why_flagged: "触发原因",
    th_why_recommended: "推荐理由",
    h2_consent_log: "同意变更记录",
    th_consent_id: "同意记录 ID",
    th_consent_ts: "时间",
    th_consent_session: "会话",
    th_consent_actor: "操作方",
    th_consent_state: "状态",
    th_consent_scopes: "范围",
    th_consent_note: "备注",
    h2_consent_snapshot: "同意画像（最新）",
    th_profile_session: "会话",
    th_profile_state: "状态",
    th_profile_scopes: "范围",
    th_profile_updated_at: "更新时间",
    th_profile_updated_by: "更新人",
    th_profile_reason: "原因",
    h2_timeline: "学生时间线",
    btn_load_timeline: "加载学生时间线",
    h2_support: "学生支持内容",
    h3_education: "安全教育",
    h3_wellbeing: "心理支持",
    h2_network: "网络安全信号",
    th_sig_id: "信号 ID",
    th_sig_session: "会话",
    th_sig_observed: "观测时间",
    th_sig_category: "类别",
    th_sig_l7: "L7 信号",
    th_sig_conf: "置信度",
    h2_audit: "治理审计链",
    th_audit_id: "审计 ID",
    th_audit_ts: "时间",
    th_audit_actor: "操作方",
    th_audit_action: "动作",
    th_audit_resource: "资源",
    th_audit_chain: "哈希链",
    consent_meta_empty: "尚未加载同意变更记录。",
    consent_profiles_meta_empty: "尚未加载最新同意画像。",
    support_meta_empty: "尚未加载支持内容。",
    network_meta_empty: "尚未加载网络信号。",
    audit_meta_empty: "尚未加载审计事件。",
    timeline_meta_hint: "从学生端复制会话 ID，粘贴到上方输入框后加载时间线。",
    timeline_empty: "尚未加载学生时间线。",
    opt_all: "全部",
    channel_work: "勤工俭学",
    channel_finance: "正规金融",
    channel_mixed: "混合",
    source_browser: "浏览器",
    source_network: "网络",
    source_integration: "机构对接",
    source_demo: "演示",
    consent_granted: "已授权",
    consent_revoked: "已撤销",
    consent_not_granted: "未授权",
    err_seed_failed_prefix: "加载演示数据失败：",
    err_clear_failed_prefix: "清空演示数据失败：",
    err_timeline_failed_prefix: "学生时间线加载失败：",
    meta_loaded_items: "已加载 {loaded} / 共 {total} 条。",
    meta_loaded_consent_events: "已加载 {loaded} / 共 {total} 条同意变更记录。",
    meta_loaded_consent_profiles: "已加载 {loaded} / 共 {total} 条同意画像。",
    meta_loaded_network_signals: "已加载 {loaded} / 共 {total} 条网络安全信号。",
    meta_loaded_audit_events: "已加载 {loaded} / 共 {total} 条审计事件。",
    support_meta_counts: "安全教育 {education} 条，心理支持 {wellbeing} 条。",
    empty_events_found: "未找到事件。",
    empty_consent_events_found: "未找到同意变更记录。",
    empty_consent_profiles_found: "未找到同意画像。",
    empty_network_signals_found: "未找到网络安全信号。",
    empty_audit_events_found: "未找到审计事件。",
    empty_education_resources: "暂无安全教育内容。",
    empty_wellbeing_resources: "暂无心理支持内容。",
    scope_label_telemetry: "浏览侧摘要信号",
    scope_label_school_support: "学校支持跟进",
    scope_label_partner_offers: "合作方正规金融信息",
    audit_toggle_collapse: "收起",
    audit_toggle_expand: "展开",
    events_toggle_collapse: "收起",
    events_toggle_expand: "展开",
    timeline_toggle_collapse: "收起",
    timeline_toggle_expand: "展开"
  }
};

function t(key) {
  return I18N[currentLang]?.[key] || I18N.en[key] || key;
}

function formatTemplate(key, values) {
  const raw = t(key);
  return Object.entries(values).reduce((acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)), raw);
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

function refreshFilterSelectLabels() {
  setSelectOptions(ui.riskLevel, [
    { value: "", label: currentLang === "zh" ? t("opt_all") : "All" },
    { value: "R1", label: "R1" },
    { value: "R2", label: "R2" },
    { value: "R3", label: "R3" }
  ]);

  setSelectOptions(ui.channelType, [
    { value: "", label: currentLang === "zh" ? t("opt_all") : "All" },
    { value: "work", label: currentLang === "zh" ? t("channel_work") : "work" },
    { value: "finance", label: currentLang === "zh" ? t("channel_finance") : "finance" },
    { value: "mixed", label: currentLang === "zh" ? t("channel_mixed") : "mixed" }
  ]);

  setSelectOptions(ui.sourceFilter, [
    { value: "", label: currentLang === "zh" ? t("opt_all") : "All" },
    { value: "browser", label: currentLang === "zh" ? t("source_browser") : "browser" },
    { value: "network", label: currentLang === "zh" ? t("source_network") : "network" },
    { value: "integration", label: currentLang === "zh" ? t("source_integration") : "integration" },
    { value: "demo", label: currentLang === "zh" ? t("source_demo") : "demo" }
  ]);
}

function displayChannel(value) {
  if (currentLang !== "zh") return value || "-";
  if (value === "work") return t("channel_work");
  if (value === "finance") return t("channel_finance");
  if (value === "mixed") return t("channel_mixed");
  return value || "-";
}

function displaySource(value) {
  if (currentLang !== "zh") return value || "-";
  if (value === "browser") return t("source_browser");
  if (value === "network") return t("source_network");
  if (value === "integration") return t("source_integration");
  if (value === "demo") return t("source_demo");
  return value || "-";
}

function displayConsent(value) {
  if (currentLang !== "zh") return value || "-";
  if (value === "granted") return t("consent_granted");
  if (value === "revoked") return t("consent_revoked");
  if (value === "not_granted") return t("consent_not_granted");
  return value || "-";
}

function isEmptyCopy(text) {
  return (
    text === I18N.en.meta_empty ||
    text === I18N.zh.meta_empty ||
    text === I18N.en.consent_meta_empty ||
    text === I18N.zh.consent_meta_empty ||
    text === I18N.en.consent_profiles_meta_empty ||
    text === I18N.zh.consent_profiles_meta_empty ||
    text === I18N.en.support_meta_empty ||
    text === I18N.zh.support_meta_empty ||
    text === I18N.en.network_meta_empty ||
    text === I18N.zh.network_meta_empty ||
    text === I18N.en.audit_meta_empty ||
    text === I18N.zh.audit_meta_empty ||
    text === I18N.en.timeline_meta_hint ||
    text === I18N.zh.timeline_meta_hint ||
    text === I18N.en.timeline_empty ||
    text === I18N.zh.timeline_empty
  );
}

function isAuditCollapsed() {
  return Boolean(ui.auditSection?.classList.contains("audit-collapsed"));
}

function syncAuditToggleLabel() {
  if (!ui.auditToggleBtn) return;
  const collapsed = isAuditCollapsed();
  ui.auditToggleBtn.textContent = collapsed ? t("audit_toggle_expand") : t("audit_toggle_collapse");
  ui.auditToggleBtn.setAttribute("aria-expanded", collapsed ? "false" : "true");
}

function setAuditCollapsed(collapsed) {
  if (!ui.auditSection) return;
  ui.auditSection.classList.toggle("audit-collapsed", collapsed);
  try {
    localStorage.setItem(AUDIT_COLLAPSED_KEY, collapsed ? "1" : "0");
  } catch (_e) {
    // ignore
  }
  syncAuditToggleLabel();
}

function isEventsCollapsed() {
  return Boolean(ui.eventsSection?.classList.contains("events-collapsed"));
}

function syncEventsToggleLabel() {
  if (!ui.eventsToggleBtn) return;
  const collapsed = isEventsCollapsed();
  ui.eventsToggleBtn.textContent = collapsed ? t("events_toggle_expand") : t("events_toggle_collapse");
  ui.eventsToggleBtn.setAttribute("aria-expanded", collapsed ? "false" : "true");
}

function setEventsCollapsed(collapsed) {
  if (!ui.eventsSection) return;
  ui.eventsSection.classList.toggle("events-collapsed", collapsed);
  try {
    localStorage.setItem(EVENTS_COLLAPSED_KEY, collapsed ? "1" : "0");
  } catch (_e) {
    // ignore
  }
  syncEventsToggleLabel();
}

function isTimelineCollapsed() {
  return Boolean(ui.timelineSection?.classList.contains("timeline-collapsed"));
}

function syncTimelineToggleLabel() {
  if (!ui.timelineToggleBtn) return;
  const collapsed = isTimelineCollapsed();
  ui.timelineToggleBtn.textContent = collapsed ? t("timeline_toggle_expand") : t("timeline_toggle_collapse");
  ui.timelineToggleBtn.setAttribute("aria-expanded", collapsed ? "false" : "true");
}

function setTimelineCollapsed(collapsed) {
  if (!ui.timelineSection) return;
  ui.timelineSection.classList.toggle("timeline-collapsed", collapsed);
  try {
    localStorage.setItem(TIMELINE_COLLAPSED_KEY, collapsed ? "1" : "0");
  } catch (_e) {
    // ignore
  }
  syncTimelineToggleLabel();
}

function applyLanguage() {
  document.documentElement.lang = currentLang === "zh" ? "zh-CN" : "en";
  document.title = t("title");
  if (ui.pageTitle) ui.pageTitle.innerHTML = `${t("title_brand")}<br>${t("title_main")}`;
  if (ui.tipLabel) ui.tipLabel.textContent = t("tip_label");
  if (ui.tipText) ui.tipText.textContent = t("tip_text");

  ui.h2_filters.textContent = t("h2_filters");
  ui.label_language.textContent = t("label_language");
  ui.label_backend_url.textContent = t("label_backend_url");
  ui.label_api_key.textContent = t("label_api_key");
  ui.label_risk_tier.textContent = t("label_risk_tier");
  ui.label_channel.textContent = t("label_channel");
  ui.label_source.textContent = t("label_source");
  ui.label_session.textContent = t("label_session");
  if (ui.label_timeline_session) ui.label_timeline_session.textContent = t("label_session");
  ui.label_from.textContent = t("label_from");
  ui.label_to.textContent = t("label_to");

  ui.refreshBtn.textContent = t("btn_refresh");
  ui.exportBtn.textContent = t("btn_export");
  ui.seedDemoBtn.textContent = t("btn_load_demo");
  ui.resetDemoBtn.textContent = t("btn_clear_demo");
  ui.label_auto_refresh.lastChild.textContent = ` ${t("auto_refresh")}`;

  ui.h2_summary.textContent = t("h2_summary");
  ui.summary_total_label.textContent = t("summary_total");
  ui.summary_risk_label.textContent = t("summary_risk");
  ui.summary_channel_label.textContent = t("summary_channel");
  ui.summary_consent_label.textContent = t("summary_consent");
  ui.summary_source_label.textContent = t("summary_source");

  ui.h2_events.textContent = t("h2_events");
  ui.th_event_id.textContent = t("th_event_id");
  ui.th_timestamp.textContent = t("th_timestamp");
  ui.th_session.textContent = t("th_session");
  ui.th_risk.textContent = t("th_risk");
  ui.th_channel.textContent = t("th_channel");
  ui.th_source.textContent = t("th_source");
  ui.th_consent.textContent = t("th_consent");
  ui.th_why_flagged.textContent = t("th_why_flagged");
  ui.th_why_recommended.textContent = t("th_why_recommended");

  refreshFilterSelectLabels();

  ui.h2_consent_log.textContent = t("h2_consent_log");
  ui.th_consent_id.textContent = t("th_consent_id");
  ui.th_consent_ts.textContent = t("th_consent_ts");
  ui.th_consent_session.textContent = t("th_consent_session");
  ui.th_consent_actor.textContent = t("th_consent_actor");
  ui.th_consent_state.textContent = t("th_consent_state");
  ui.th_consent_scopes.textContent = t("th_consent_scopes");
  ui.th_consent_note.textContent = t("th_consent_note");
  ui.h2_consent_snapshot.textContent = t("h2_consent_snapshot");
  ui.th_profile_session.textContent = t("th_profile_session");
  ui.th_profile_state.textContent = t("th_profile_state");
  ui.th_profile_scopes.textContent = t("th_profile_scopes");
  ui.th_profile_updated_at.textContent = t("th_profile_updated_at");
  ui.th_profile_updated_by.textContent = t("th_profile_updated_by");
  ui.th_profile_reason.textContent = t("th_profile_reason");
  ui.h2_timeline.textContent = t("h2_timeline");
  ui.loadStudentHistoryBtn.textContent = t("btn_load_timeline");
  ui.h2_support.textContent = t("h2_support");
  ui.h3_education.textContent = t("h3_education");
  ui.h3_wellbeing.textContent = t("h3_wellbeing");
  ui.h2_network.textContent = t("h2_network");
  ui.th_sig_id.textContent = t("th_sig_id");
  ui.th_sig_session.textContent = t("th_sig_session");
  ui.th_sig_observed.textContent = t("th_sig_observed");
  ui.th_sig_category.textContent = t("th_sig_category");
  ui.th_sig_l7.textContent = t("th_sig_l7");
  ui.th_sig_conf.textContent = t("th_sig_conf");
  ui.h2_audit.textContent = t("h2_audit");
  ui.th_audit_id.textContent = t("th_audit_id");
  ui.th_audit_ts.textContent = t("th_audit_ts");
  ui.th_audit_actor.textContent = t("th_audit_actor");
  ui.th_audit_action.textContent = t("th_audit_action");
  ui.th_audit_resource.textContent = t("th_audit_resource");
  ui.th_audit_chain.textContent = t("th_audit_chain");

  if (isEmptyCopy(ui.meta.textContent)) ui.meta.textContent = t("meta_empty");
  if (isEmptyCopy(ui.consentMeta.textContent)) ui.consentMeta.textContent = t("consent_meta_empty");
  if (isEmptyCopy(ui.consentProfileMeta.textContent)) ui.consentProfileMeta.textContent = t("consent_profiles_meta_empty");
  if (isEmptyCopy(ui.supportMeta.textContent)) ui.supportMeta.textContent = t("support_meta_empty");
  if (isEmptyCopy(ui.networkMeta.textContent)) ui.networkMeta.textContent = t("network_meta_empty");
  if (isEmptyCopy(ui.auditMeta.textContent)) ui.auditMeta.textContent = t("audit_meta_empty");
  if (isEmptyCopy(ui.studentHistoryMeta.textContent)) ui.studentHistoryMeta.textContent = t("timeline_meta_hint");
  if (isEmptyCopy(ui.studentHistoryOutput.textContent)) ui.studentHistoryOutput.textContent = t("timeline_empty");
  syncAuditToggleLabel();
  syncEventsToggleLabel();
  syncTimelineToggleLabel();
}

function getApiBaseUrl() {
  const stored = (localStorage.getItem(STORAGE_KEY) || "").trim();
  const fallback = "http://localhost:8787";

  if (typeof window !== "undefined" && window.location) {
    const { protocol, origin, pathname, hostname } = window.location;
    const isHttpPage = protocol === "http:" || protocol === "https:";
    const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1";
    const onConsolePath = pathname.startsWith("/console");

    // If opened from backend /console, same-origin is the safest default.
    if (isHttpPage && onConsolePath) {
      const staleLocalDefaults = new Set(["http://localhost:8787", "http://127.0.0.1:8787"]);
      const isStoredLocal = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(stored);
      if (!stored || (isLocalHost && isStoredLocal && stored !== origin) || (isLocalHost && staleLocalDefaults.has(stored))) {
        return origin;
      }
    }
  }

  return stored || fallback;
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
    ui.eventsBody.innerHTML = `<tr><td colspan="9">${t("empty_events_found")}</td></tr>`;
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
        <td>${displayChannel(item.channel_type)}</td>
        <td>${displaySource(item.source)}</td>
        <td>${displayConsent(item.consent_state)}</td>
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
  if (currentLang === "zh") {
    ui.channelSummary.textContent = `${t("channel_work")}:${summary.by_channel_type?.work ?? 0} | ${t("channel_finance")}:${
      summary.by_channel_type?.finance ?? 0
    } | ${t("channel_mixed")}:${summary.by_channel_type?.mixed ?? 0}`;
    ui.consentSummary.textContent = `${t("consent_granted")}:${summary.consent?.granted ?? 0} | ${t("consent_revoked")}:${
      summary.consent?.revoked ?? 0
    } | ${t("consent_not_granted")}:${summary.consent?.not_granted ?? 0}`;
    ui.sourceSummary.textContent = `${t("source_browser")}:${summary.by_source?.browser ?? 0} | ${t("source_network")}:${
      summary.by_source?.network ?? 0
    } | ${t("source_integration")}:${summary.by_source?.integration ?? 0} | ${t("source_demo")}:${
      summary.by_source?.demo ?? 0
    }`;
    return;
  }
  ui.channelSummary.textContent = `work:${summary.by_channel_type?.work ?? 0} | finance:${summary.by_channel_type?.finance ?? 0} | mixed:${summary.by_channel_type?.mixed ?? 0}`;
  ui.consentSummary.textContent = `granted:${summary.consent?.granted ?? 0} | revoked:${summary.consent?.revoked ?? 0} | not_granted:${summary.consent?.not_granted ?? 0}`;
  ui.sourceSummary.textContent = `browser:${summary.by_source?.browser ?? 0} | network:${summary.by_source?.network ?? 0} | integration:${summary.by_source?.integration ?? 0} | demo:${summary.by_source?.demo ?? 0}`;
}

function formatScopes(scopes) {
  if (!scopes) return "-";
  const enabled = Object.entries(scopes)
    .filter(([, value]) => Boolean(value))
    .map(([key]) => {
      if (currentLang !== "zh") return key.replaceAll("_", " ");
      if (key === "telemetry") return t("scope_label_telemetry");
      if (key === "school_support") return t("scope_label_school_support");
      if (key === "partner_offers") return t("scope_label_partner_offers");
      return key.replaceAll("_", " ");
    });
  return enabled.length ? enabled.join(", ") : currentLang === "zh" ? "无" : "none";
}

function renderConsentRows(items) {
  if (!items.length) {
    ui.consentBody.innerHTML = `<tr><td colspan="7">${t("empty_consent_events_found")}</td></tr>`;
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
    ui.consentProfilesBody.innerHTML = `<tr><td colspan="6">${t("empty_consent_profiles_found")}</td></tr>`;
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
        <p><strong>${currentLang === "zh" ? "下一步建议" : "Steps"}:</strong> ${(item.steps || []).join("; ") || "-"}</p>
      </article>
    `
    )
    .join("");
}

function renderNetworkRows(items) {
  if (!items.length) {
    ui.networkBody.innerHTML = `<tr><td colspan="6">${t("empty_network_signals_found")}</td></tr>`;
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
    ui.auditBody.innerHTML = `<tr><td colspan="6">${t("empty_audit_events_found")}</td></tr>`;
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
  const sessionId = (ui.timelineSessionId?.value || ui.studentSessionId.value || "").trim();
  if (!sessionId) {
    ui.studentHistoryMeta.textContent =
      currentLang === "zh" ? "请先在上方输入学生会话 ID。" : "Paste a student session ID in the input above first.";
    ui.studentHistoryOutput.textContent = t("timeline_empty");
    return;
  }

  try {
    const result = await fetchJson(
      `${baseUrl.replace(/\/$/, "")}/api/student/history?session_id=${encodeURIComponent(sessionId)}&limit=20`
    );
    ui.studentHistoryMeta.textContent =
      currentLang === "zh" ? `已加载会话 ${sessionId} 的时间线。` : `Loaded timeline for ${sessionId}.`;
    ui.studentHistoryOutput.textContent = JSON.stringify(result.data, null, 2);
  } catch (error) {
    ui.studentHistoryMeta.textContent =
      currentLang === "zh"
        ? `${t("err_timeline_failed_prefix")} ${error.message}`
        : `Student timeline request failed: ${error.message}`;
    ui.studentHistoryOutput.textContent = currentLang === "zh" ? "无法加载学生时间线。" : "Unable to load student timeline.";
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
    fetchJson(`${baseUrl.replace(/\/$/, "")}/api/support/resources?lang=${currentLang}`),
    fetchJson(`${baseUrl.replace(/\/$/, "")}/api/network/signals?limit=20`),
    fetchJson(`${baseUrl.replace(/\/$/, "")}/api/audit-events?limit=20`)
  ]);

  if (eventsCall.status === "fulfilled") {
    const result = eventsCall.value;
    const items = result?.data?.items || [];
    renderRows(items);
    ui.meta.textContent = formatTemplate("meta_loaded_items", { loaded: items.length, total: result?.data?.total ?? 0 });
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
    ui.consentMeta.textContent = formatTemplate("meta_loaded_consent_events", {
      loaded: consentItems.length,
      total: consentResult?.data?.total ?? 0
    });
  } else {
    ui.consentMeta.textContent = `Consent request failed: ${consentCall.reason?.message || "unknown error"}`;
    ui.consentBody.innerHTML = `<tr><td colspan="6">Unable to load consent events.</td></tr>`;
  }

  if (consentProfilesCall.status === "fulfilled") {
    const profileResult = consentProfilesCall.value;
    const profileItems = profileResult?.data?.items || [];
    renderConsentProfiles(profileItems);
    ui.consentProfileMeta.textContent = formatTemplate("meta_loaded_consent_profiles", {
      loaded: profileItems.length,
      total: profileResult?.data?.total ?? 0
    });
  } else {
    ui.consentProfileMeta.textContent = `Consent profile request failed: ${consentProfilesCall.reason?.message || "unknown error"}`;
    ui.consentProfilesBody.innerHTML = `<tr><td colspan="6">Unable to load consent profiles.</td></tr>`;
  }

  if (supportCall.status === "fulfilled") {
    const supportData = supportCall.value?.data || {};
    renderResourceList(ui.educationResources, supportData.education || [], t("empty_education_resources"));
    renderResourceList(ui.wellbeingResources, supportData.wellbeing || [], t("empty_wellbeing_resources"));
    ui.supportMeta.textContent = formatTemplate("support_meta_counts", {
      education: supportData.education?.length ?? 0,
      wellbeing: supportData.wellbeing?.length ?? 0
    });
  } else {
    ui.supportMeta.textContent = `Support resource request failed: ${supportCall.reason?.message || "unknown error"}`;
    ui.educationResources.textContent = "Unable to load education resources.";
    ui.wellbeingResources.textContent = "Unable to load wellbeing resources.";
  }

  if (networkCall.status === "fulfilled") {
    const networkResult = networkCall.value;
    const networkItems = networkResult?.data?.items || [];
    renderNetworkRows(networkItems);
    ui.networkMeta.textContent = formatTemplate("meta_loaded_network_signals", {
      loaded: networkItems.length,
      total: networkResult?.data?.total ?? 0
    });
  } else {
    ui.networkMeta.textContent = `Network request failed: ${networkCall.reason?.message || "unknown error"}`;
    ui.networkBody.innerHTML = `<tr><td colspan="6">Unable to load network signals.</td></tr>`;
  }

  if (auditCall.status === "fulfilled") {
    const auditResult = auditCall.value;
    const auditItems = auditResult?.data?.items || [];
    renderAuditRows(auditItems);
    ui.auditMeta.textContent = formatTemplate("meta_loaded_audit_events", {
      loaded: auditItems.length,
      total: auditResult?.data?.total ?? 0
    });
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
  ui.meta.textContent =
    currentLang === "zh"
      ? `已加载演示数据：${result?.data?.risk_events ?? 0} 条支持事件`
      : `Loaded demo dataset: ${result?.data?.risk_events ?? 0} support events`;
  await refreshEvents();
}

async function resetDemoData() {
  const baseUrl = ui.apiBaseUrl.value.trim() || "http://localhost:8787";
  setApiBaseUrl(baseUrl);
  const result = await postJson(`${baseUrl.replace(/\/$/, "")}/api/demo/reset`);
  ui.meta.textContent =
    currentLang === "zh"
      ? `已清空演示数据：${result?.data?.risk_events ?? 0} 条支持事件`
      : `Cleared demo dataset: ${result?.data?.risk_events ?? 0} support events`;
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
  currentLang = getLanguage();
  if (ui.languageSelect) {
    ui.languageSelect.value = currentLang;
    ui.languageSelect.addEventListener("change", () => {
      currentLang = ui.languageSelect.value === "zh" ? "zh" : "en";
      setLanguage(currentLang);
      applyLanguage();
      refreshEvents().catch(() => {
        // ignore refresh failures for language toggle
      });
    });
  }
  applyLanguage();
  try {
    const savedAudit = localStorage.getItem(AUDIT_COLLAPSED_KEY);
    if (savedAudit === "1") {
      setAuditCollapsed(true);
    } else {
      syncAuditToggleLabel();
    }
  } catch (_e) {
    syncAuditToggleLabel();
  }
  ui.auditToggleBtn?.addEventListener("click", () => {
    setAuditCollapsed(!isAuditCollapsed());
  });
  ui.eventsToggleBtn?.addEventListener("click", () => {
    setEventsCollapsed(!isEventsCollapsed());
  });
  ui.timelineToggleBtn?.addEventListener("click", () => {
    setTimelineCollapsed(!isTimelineCollapsed());
  });
  try {
    const savedEvents = localStorage.getItem(EVENTS_COLLAPSED_KEY);
    if (savedEvents === "1") {
      setEventsCollapsed(true);
    } else {
      syncEventsToggleLabel();
    }
  } catch (_e) {
    syncEventsToggleLabel();
  }
  try {
    const savedTimeline = localStorage.getItem(TIMELINE_COLLAPSED_KEY);
    if (savedTimeline === "1") {
      setTimelineCollapsed(true);
    } else {
      syncTimelineToggleLabel();
    }
  } catch (_e) {
    syncTimelineToggleLabel();
  }

  const resolvedApiBase = getApiBaseUrl();
  ui.apiBaseUrl.value = resolvedApiBase;
  setApiBaseUrl(resolvedApiBase);
  ui.apiKey.value = getApiKey();
  if (ui.timelineSessionId) {
    ui.timelineSessionId.value = ui.studentSessionId.value || "";
    ui.timelineSessionId.addEventListener("input", () => {
      ui.studentSessionId.value = ui.timelineSessionId.value;
    });
    ui.studentSessionId.addEventListener("input", () => {
      ui.timelineSessionId.value = ui.studentSessionId.value;
    });
  }
  ui.refreshBtn.addEventListener("click", refreshEvents);
  ui.exportBtn.addEventListener("click", exportCsv);
  ui.loadStudentHistoryBtn.addEventListener("click", () => {
    loadStudentHistory().catch((error) => {
      ui.studentHistoryMeta.textContent =
        currentLang === "zh"
          ? `${t("err_timeline_failed_prefix")} ${error.message}`
          : `Student timeline request failed: ${error.message}`;
    });
  });
  ui.seedDemoBtn.addEventListener("click", () => {
    seedDemoData().catch((error) => {
      ui.meta.textContent =
        currentLang === "zh" ? `${t("err_seed_failed_prefix")} ${error.message}` : `Seed failed: ${error.message}`;
    });
  });
  ui.resetDemoBtn.addEventListener("click", () => {
    resetDemoData().catch((error) => {
      ui.meta.textContent =
        currentLang === "zh" ? `${t("err_clear_failed_prefix")} ${error.message}` : `Reset failed: ${error.message}`;
    });
  });
  ui.autoRefresh.addEventListener("change", () => {
    setAutoRefresh(ui.autoRefresh.checked);
  });
  refreshEvents();
}

init();
