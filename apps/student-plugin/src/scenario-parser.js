/**
 * Parse pasted “page text” to auto-fill scenario fields.
 * Does NOT infer Q1 (purpose) or Q3 (repayment source) — those stay manual.
 */

const APR_MAX = 200;

/**
 * Full demo copy covering APR, principal, months, stage, consent, Q2 amount range, optional URL.
 * Q1 / Q3 are intentionally not inferable from keywords here (user selects manually).
 */
export const SAMPLE_SCENARIO_TEXT_EN = `Campus Quick Loan — demo marketing copy (paste into Page text).
Official link seen on page: https://demo-loan.example.edu/apply
APR: 19.8% per year (annualized). Loan principal: ¥12,000. Term: 24 months installment.
User journey stage: I am filling the application form (not submitted yet).
Consent: consent granted for this session risk check.
Borrowed amount for Q2 range: 12000 CNY.
(Q1 purpose and Q3 repayment source: please choose manually in the dropdowns.)`;

export const SAMPLE_SCENARIO_TEXT_ZH = `【演示·校园极速贷】营销文案（请整段粘贴到「页面文本」）
页面链接：https://demo-loan.example.edu/apply
综合年化 APR：24.5%（示例）
借款本金：8000元 | 可分12期还款
当前阶段：填写表单中（尚未点击提交）
同意状态：已授权本次风控所需信息
借款金额（用于问题二区间）：8000元
（问题一用途、问题三还款来源请在下拉框中手动选择）`;

function clampApr(n) {
  if (!Number.isFinite(n) || n <= 0 || n >= APR_MAX) return null;
  return Math.round(n * 100) / 100;
}

function parseWanNumber(raw) {
  const s = String(raw).replace(/,/g, "").trim();
  if (!s) return NaN;
  if (/万$/.test(s)) {
    const n = parseFloat(s.replace(/万$/, ""));
    return Number.isFinite(n) ? n * 10000 : NaN;
  }
  return parseFloat(s);
}

/**
 * Prefer explicit loan/principal amounts; fall back to largest plausible CNY amount.
 */
function extractPrincipalYuan(text) {
  if (!text || !text.trim()) return null;

  const labeled = [];
  const reLabeled =
    /(?:本金|借款金额|申请金额|放款金额|授信额度|额度|可借|loan\s*(?:amount|principal)|borrow(?:ed)?\s*amount|principal)[:：\s]*([¥￥]?\s*\d+(?:,\d{3})*(?:\.\d+)?\s*(?:万|元)?|[\d.]+万)/gi;
  let m;
  while ((m = reLabeled.exec(text)) !== null) {
    const v = parseMoneyToken(m[1]);
    if (v != null && v >= 100 && v <= 50_000_000) labeled.push(v);
  }
  if (labeled.length) {
    return Math.max(...labeled);
  }

  const generic = [];
  const reYuan = /[¥￥]\s*(\d+(?:,\d{3})*(?:\.\d+)?)(?!\s*%)/g;
  while ((m = reYuan.exec(text)) !== null) {
    const v = parseFloat(m[1].replace(/,/g, ""));
    if (Number.isFinite(v) && v >= 100 && v <= 50_000_000) generic.push(v);
  }
  const reCn = /(\d+(?:,\d{3})*(?:\.\d+)?)\s*元(?!\s*\/)/g;
  while ((m = reCn.exec(text)) !== null) {
    const v = parseFloat(m[1].replace(/,/g, ""));
    if (Number.isFinite(v) && v >= 100 && v <= 50_000_000) generic.push(v);
  }
  const reWan = /(\d+(?:\.\d+)?)\s*万/g;
  while ((m = reWan.exec(text)) !== null) {
    const v = parseWanNumber(`${m[1]}万`);
    if (Number.isFinite(v) && v >= 100 && v <= 50_000_000) generic.push(v);
  }

  if (!generic.length) return null;
  return Math.max(...generic);
}

function parseMoneyToken(token) {
  if (!token) return null;
  const t = token.replace(/\s/g, "");
  if (/万/.test(t)) return parseWanNumber(t);
  const n = parseFloat(t.replace(/[¥￥,元]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function amountToRangeValue(amountYuan) {
  if (!Number.isFinite(amountYuan) || amountYuan <= 0) return null;
  if (amountYuan < 1000) return "below_1000";
  if (amountYuan < 5000) return "1000_5000";
  if (amountYuan < 10000) return "5000_10000";
  if (amountYuan < 50000) return "10000_50000";
  return "above_50000";
}

function extractMonths(text) {
  if (!text) return null;
  const lower = text.toLowerCase();

  const m1 = lower.match(
    /(?:分|分期|还款期|期数|term|repayment\s*term)[:：\s]*(\d{1,2})\s*(?:期|个月|个月期|月|months?)\b/i
  );
  if (m1) {
    const n = parseInt(m1[1], 10);
    if (n >= 1 && n <= 120) return n;
  }

  const m2 = lower.match(/(\d{1,2})\s*(?:期|个月)(?!免息)(?![0-9])/);
  if (m2) {
    const n = parseInt(m2[1], 10);
    if (n >= 1 && n <= 120) return n;
  }

  const m3 = lower.match(/(\d{1,2})\s*months?\b/i);
  if (m3) {
    const n = parseInt(m3[1], 10);
    if (n >= 1 && n <= 120) return n;
  }

  return null;
}

function extractStage(text) {
  if (!text) return null;
  const t = text;

  // Prefer fill/browse before submit — phrases like "尚未点击提交" still mention 提交 but mean not submitted yet.
  if (/填写表单|填表|填写中|正在填写|fill(?:ing)?|application\s+form|enter(?:ing)?\s+details/i.test(t)) {
    return "fill";
  }
  if (/仅浏览|随便看看|浏览页面|browse|browsing|viewing\s+only/i.test(t)) {
    return "browse";
  }
  if (
    /提交申请|已提交|点击提交|申请已提交|submit(?:ted)?|application\s+submitted|final\s+submit/i.test(t)
  ) {
    return "submit";
  }
  return null;
}

function extractConsent(text) {
  if (!text) return null;
  const t = text.toLowerCase();

  if (/(?:撤销|撤回|已撤销|revoked|withdraw\s+consent)/i.test(t)) {
    return "revoked";
  }
  if (/(?:未同意|未授权|不同意|not\s+granted|denied|no\s+consent)/i.test(t)) {
    return "not_granted";
  }
  if (/(?:已同意|已授权|同意授权|consent\s+granted|i\s+agree|granted)/i.test(t)) {
    return "granted";
  }
  return null;
}

function extractFirstUrl(text) {
  if (!text) return null;
  const m = text.match(/https?:\/\/[^\s\]<>)"']+/i);
  return m ? m[0].replace(/[.,;:)]+$/, "") : null;
}

function extractApr(text) {
  if (!text) return null;
  const lower = text.toLowerCase();

  const explicit = lower.match(
    /(?:综合年化|年化利率|年利率|annual\s*(?:percentage\s*)?rate|apr)[:：\s]*(\d+(?:\.\d+)?)\s*%/i
  );
  if (explicit) {
    const v = clampApr(Number(explicit[1]));
    if (v != null) return v;
  }

  const aprWord = lower.match(/\bapr\s*[:：]?\s*(\d+(?:\.\d+)?)\s*%/i);
  if (aprWord) {
    const v = clampApr(Number(aprWord[1]));
    if (v != null) return v;
  }

  const annualZh = lower.match(/年化\s*(\d+(?:\.\d+)?)\s*%/i);
  if (annualZh) {
    const v = clampApr(Number(annualZh[1]));
    if (v != null) return v;
  }

  const monthly = lower.match(/(?:月利率|monthly\s*rate)[^\d]{0,10}(\d+(?:\.\d+)?)\s*%/i);
  if (monthly) {
    const monthRate = Number(monthly[1]);
    if (Number.isFinite(monthRate) && monthRate > 0 && monthRate < 50) {
      return clampApr(monthRate * 12);
    }
  }

  const daily = lower.match(/(?:日利率|日息|daily\s*rate)[^\d]{0,10}(\d+(?:\.\d+)?)\s*%/i);
  if (daily) {
    const dayRate = Number(daily[1]);
    if (Number.isFinite(dayRate) && dayRate > 0 && dayRate < 5) {
      return clampApr(dayRate * 365);
    }
  }

  const generic = lower.match(/(\d+(?:\.\d+)?)\s*%/);
  if (generic) {
    let genericValue = Number(generic[1]);
    // If text contains daily-rate wording, generic % is likely daily interest, not APR.
    if (/(?:日利率|日息|daily\s*rate)/i.test(lower) && Number.isFinite(genericValue)) {
      genericValue *= 365;
    }
    const v = clampApr(genericValue);
    if (v != null) return v;
  }

  return null;
}

/**
 * @returns {{
 *   apr: number|null,
 *   principal: number|null,
 *   months: number|null,
 *   stage: 'browse'|'fill'|'submit'|null,
 *   consent: 'granted'|'not_granted'|'revoked'|null,
 *   loanAmountRange: string|null,
 *   scenarioUrl: string|null
 * }}
 */
export function parseScenarioText(rawText) {
  const text = rawText || "";
  const apr = extractApr(text);
  const principal = extractPrincipalYuan(text);
  const months = extractMonths(text);
  const stage = extractStage(text);
  const consent = extractConsent(text);
  const scenarioUrl = extractFirstUrl(text);

  let loanAmountRange = null;
  const rangeFromPrincipal = principal != null ? amountToRangeValue(principal) : null;
  if (rangeFromPrincipal) {
    loanAmountRange = rangeFromPrincipal;
  }

  return {
    apr,
    principal,
    months,
    stage,
    consent,
    loanAmountRange,
    scenarioUrl
  };
}

/** Back-compat: APR-only helper used by older code paths. */
export function extractAprFromText(rawText) {
  const apr = extractApr(rawText || "");
  return apr != null ? { value: apr, source: "parsed" } : null;
}
