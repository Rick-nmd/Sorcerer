function buildWorkStudyRecommendation(riskLevel) {
  return {
    recommendation_id: `work_${Date.now()}`,
    risk_level: riskLevel,
    channel_type: "work",
    title: "Campus Work-Study Priority",
    provider_name: "Campus Career Center",
    apr: null,
    next_action: "Open school job board and shortlist 2 stable hourly positions.",
    why_recommended: [
      "Income-based solution reduces debt pressure.",
      "Lower financial risk compared with unsecured borrowing."
    ]
  };
}

function buildFinanceRecommendation(riskLevel, apr) {
  return {
    recommendation_id: `finance_${Date.now()}`,
    risk_level: riskLevel,
    channel_type: "finance",
    title: "Licensed Education Finance Option",
    provider_name: "Regulated Bank Channel",
    apr: Number(apr) || null,
    term_months: 12,
    eligibility: "Full-time student with valid enrollment proof.",
    integration_status: "local_demo",
    institution_verified: false,
    application_url: "",
    next_action: "Compare contract APR and total payment before any approval step.",
    why_recommended: [
      "Regulated institution with transparent contract terms.",
      "Supports explainable comparison with risky offers."
    ]
  };
}

export function buildRecommendations({ riskLevel, apr }) {
  if (riskLevel === "R1") {
    return [buildWorkStudyRecommendation(riskLevel)];
  }

  return [
    buildWorkStudyRecommendation(riskLevel),
    buildFinanceRecommendation(riskLevel, apr)
  ];
}

export function normalizeRemoteRecommendations({ riskLevel, recommendations }) {
  return (recommendations || []).map((item, index) => ({
    recommendation_id: item.recommendation_id || `remote_${riskLevel}_${index}`,
    risk_level: item.risk_level || riskLevel,
    channel_type: item.channel_type || "mixed",
    title: item.title || "Recommendation",
    provider_name: item.provider_name || "Unknown provider",
    apr: typeof item.apr === "number" ? item.apr : null,
    term_months: Number(item.term_months || item.months || 12),
    eligibility: item.eligibility || "See provider requirements.",
    integration_status: item.integration_status || "unknown",
    institution_verified: Boolean(item.institution_verified),
    application_url: item.application_url || "",
    next_action: item.next_action || "Review details before proceeding.",
    why_recommended:
      item.why_recommended && item.why_recommended.length
        ? item.why_recommended
        : ["Recommended by backend channel policy."],
    data_source: item.data_source || "live"
  }));
}
