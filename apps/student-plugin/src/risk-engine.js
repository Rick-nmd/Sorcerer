const LOAN_KEYWORDS = [
  "loan",
  "borrow",
  "cash now",
  "instant credit",
  "0 threshold",
  "zero threshold",
  "student loan quick"
];

const MISLEADING_PATTERNS = [
  "low interest",
  "zero paperwork",
  "apply in 1 minute",
  "no review",
  "pay later"
];

const SCAM_PATTERNS = ["transfer fee first", "guaranteed approval", "no contract"];

function includesPattern(text, pattern) {
  return text.toLowerCase().includes(pattern.toLowerCase());
}

function countMatches(text, patterns) {
  return patterns.filter((pattern) => includesPattern(text, pattern)).length;
}

export function analyzeRisk({ pageText, apr, stage }) {
  const text = pageText || "";
  const keywordHits = countMatches(text, LOAN_KEYWORDS);
  const misleadingHits = countMatches(text, MISLEADING_PATTERNS);
  const scamHits = countMatches(text, SCAM_PATTERNS);

  const whyFlagged = [];
  const normalizedApr = Number(apr) || 0;

  if (keywordHits > 0) {
    whyFlagged.push(`Detected ${keywordHits} lending-related keyword(s).`);
  }
  if (misleadingHits > 0) {
    whyFlagged.push(`Detected ${misleadingHits} high-risk marketing phrase(s).`);
  }
  if (normalizedApr >= 24) {
    whyFlagged.push(`APR is elevated (${normalizedApr}%).`);
  }
  if (scamHits > 0) {
    whyFlagged.push("Potential scam-like wording detected.");
  }
  if (stage === "fill" || stage === "submit") {
    whyFlagged.push(`User reached ${stage} stage.`);
  }

  let riskLevel = "R1";
  let recommendedAction = "Show education cards and hotline options.";
  let channelType = "work";

  if (stage === "fill" || misleadingHits >= 2 || normalizedApr >= 24) {
    riskLevel = "R2";
    recommendedAction = "Show alternative channels and upload event if consent granted.";
    channelType = "mixed";
  }

  if (stage === "submit" && (normalizedApr >= 36 || scamHits > 0)) {
    riskLevel = "R3";
    recommendedAction = "Strong warning and prioritize safe alternatives.";
    channelType = "mixed";
  }

  if (whyFlagged.length === 0) {
    whyFlagged.push("No high-risk marker found, default monitoring mode.");
  }

  return {
    risk_level: riskLevel,
    why_flagged: whyFlagged,
    recommended_action: recommendedAction,
    channel_type: channelType
  };
}
