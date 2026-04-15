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
