function clampPositive(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function normalizeText(text = "") {
  return String(text || "").trim();
}

function collectKeywordMatches(text, patterns) {
  return patterns.filter((item) => item.re.test(text)).map((item) => item.label);
}

function collectRateCandidates(pageText = "") {
  const text = normalizeText(pageText);
  const candidates = [];
  let m;

  const annualExplicit =
    /(?:综合年化|年化利率|年利率|annual\s*(?:percentage\s*)?rate|apr)[^\d]{0,10}(\d+(?:\.\d+)?)\s*%/gi;
  while ((m = annualExplicit.exec(text)) !== null) {
    const v = clampPositive(m[1]);
    if (v && v < 300) candidates.push({ apr: v, source: "annual_explicit", raw: `${m[0]}` });
  }

  const monthlyRate = /(?:月利率|月息|monthly\s*rate)[^\d]{0,10}(\d+(?:\.\d+)?)\s*%/gi;
  while ((m = monthlyRate.exec(text)) !== null) {
    const v = clampPositive(m[1]);
    if (v && v < 50) {
      candidates.push({ apr: Number((v * 12).toFixed(2)), source: "monthly_rate", raw: `${m[0]}` });
    }
  }

  const dailyRate = /(?:日利率|日息|daily\s*rate)[^\d]{0,10}(\d+(?:\.\d+)?)\s*%/gi;
  while ((m = dailyRate.exec(text)) !== null) {
    const v = clampPositive(m[1]);
    if (v && v < 5) {
      candidates.push({ apr: Number((v * 365).toFixed(2)), source: "daily_rate", raw: `${m[0]}` });
    }
  }

  return candidates;
}

function extractAmountsFromText(pageText = "") {
  const text = normalizeText(pageText);
  const out = {
    contract_amount: null,
    disbursed_amount: null,
    upfront_deduction_amount: null,
    total_repayment: null,
    monthly_repayment: null,
    periods: null
  };

  const contractMatch =
    /(?:合同金额|借款金额|本金|批款金额|loan\s*(?:amount|principal)|principal)[^\d]{0,10}[¥￥]?\s*(\d+(?:,\d{3})*(?:\.\d+)?)/i.exec(
      text
    ) || /(?:借|贷)\s*[¥￥]?\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:元|cny|人民币)/i.exec(text);
  if (contractMatch) {
    out.contract_amount = Number(String(contractMatch[1]).replace(/,/g, ""));
  }

  const disbursedMatch =
    /(?:到账金额|到手金额|实到金额)[^0-9]{0,8}[¥￥]?\s*(\d+(?:,\d{3})*(?:\.\d+)?)/i.exec(text) ||
    /(?:到账|到手|实到)[^0-9]{0,8}[¥￥]\s*(\d+(?:,\d{3})*(?:\.\d+)?)/i.exec(text) ||
    /(?:到账|到手|实到)[^0-9]{0,8}(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:元|cny|人民币)/i.exec(text);
  if (disbursedMatch) {
    out.disbursed_amount = Number(String(disbursedMatch[1]).replace(/,/g, ""));
  }

  const deductionMatch =
    /(?:代扣|预扣|前置扣费|放款时(?:一次性)?代扣|先扣)[^0-9]{0,8}[¥￥]?\s*(\d+(?:,\d{3})*(?:\.\d+)?)/i.exec(text) ||
    /(?:代扣|预扣|前置扣费|放款时(?:一次性)?代扣|先扣)[^0-9]{0,8}(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:元|cny|人民币)/i.exec(text);
  if (deductionMatch) {
    out.upfront_deduction_amount = Number(String(deductionMatch[1]).replace(/,/g, ""));
  }

  // Amount before fee label, e.g. "缴纳200元审核服务费".
  const upfrontFeeAmountBeforeLabel =
    /(?:缴纳|收取|扣除|支付|需付|需缴|需收)[^0-9]{0,8}[¥￥]?\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:元|cny|人民币)?[^。；，,\n]{0,20}(?:审核费|服务费|手续费|管理费|咨询费|会员费|担保费|保证金|账户管理费)/i.exec(
      text
    );
  if (!out.upfront_deduction_amount && upfrontFeeAmountBeforeLabel) {
    out.upfront_deduction_amount = Number(String(upfrontFeeAmountBeforeLabel[1]).replace(/,/g, ""));
  }

  const totalRepayMatch =
    /(?:还款总额|总还款|应还总额|total\s*repayment)[^\d]{0,10}[¥￥]?\s*(\d+(?:,\d{3})*(?:\.\d+)?)/i.exec(text);
  if (totalRepayMatch) {
    out.total_repayment = Number(String(totalRepayMatch[1]).replace(/,/g, ""));
  }

  const monthlyRepayMatch =
    /(?:每月(?:仅)?(?:固定)?还(?:款)?|月供|每期还款|monthly\s*payment|installment)[^\d]{0,10}[¥￥]?\s*(\d+(?:,\d{3})*(?:\.\d+)?)/i.exec(
      text
    );
  if (monthlyRepayMatch) {
    out.monthly_repayment = Number(String(monthlyRepayMatch[1]).replace(/,/g, ""));
  }

  const periodsMatch = /(\d{1,3})\s*(?:期|个月|months?)/i.exec(text);
  if (periodsMatch) {
    out.periods = Number(periodsMatch[1]);
  }

  return out;
}

function inferAnnualizedCostRate({ principal, periods, monthlyRepayment, totalRepayment }) {
  const actualPrincipal = clampPositive(principal);
  const n = clampPositive(periods);
  if (!actualPrincipal || !n) return null;

  const inferredTotalRepayment =
    clampPositive(totalRepayment) || (clampPositive(monthlyRepayment) ? Number(monthlyRepayment) * n : null);
  if (!inferredTotalRepayment || inferredTotalRepayment <= actualPrincipal) return null;

  const years = n / 12;
  if (!Number.isFinite(years) || years <= 0) return null;
  const totalCost = inferredTotalRepayment - actualPrincipal;
  const annualized = (totalCost / actualPrincipal / years) * 100;
  if (!Number.isFinite(annualized) || annualized <= 0 || annualized > 5000) return null;
  return Number(annualized.toFixed(2));
}

function inferAprByIrr({ principal, periods, monthlyRepayment, totalRepayment, firstPaymentCredit = 0 }) {
  const P = clampPositive(principal);
  const n = clampPositive(periods);
  if (!P || !n) return null;

  const M = clampPositive(monthlyRepayment) || (clampPositive(totalRepayment) ? Number(totalRepayment) / n : null);
  if (!M) return null;

  const firstPayment = Math.max(M - (clampPositive(firstPaymentCredit) || 0), 0);

  function npv(rate) {
    let value = P; // t=0 cash-in
    value -= firstPayment / Math.pow(1 + rate, 1);
    for (let i = 2; i <= n; i += 1) {
      value -= M / Math.pow(1 + rate, i);
    }
    return value;
  }

  // Find a sign-change bracket first to avoid false nulls.
  let lo = 0;
  let hi = null;
  let prevRate = 0;
  let prevVal = npv(prevRate);
  if (!Number.isFinite(prevVal)) return null;

  for (let rate = 0.001; rate <= 5; rate += 0.001) {
    const val = npv(rate);
    if (!Number.isFinite(val)) return null;
    if (prevVal === 0) {
      lo = prevRate;
      hi = prevRate;
      break;
    }
    if (prevVal * val < 0) {
      lo = prevRate;
      hi = rate;
      break;
    }
    prevRate = rate;
    prevVal = val;
  }

  if (hi == null) return null;
  if (hi === lo) {
    const annualApr = (Math.pow(1 + lo, 12) - 1) * 100;
    return Number(annualApr.toFixed(2));
  }

  for (let i = 0; i < 120; i += 1) {
    const mid = (lo + hi) / 2;
    const val = npv(mid);
    if (!Number.isFinite(val)) return null;
    const loVal = npv(lo);
    if (loVal * val <= 0) hi = mid;
    else lo = mid;
  }

  const monthlyRate = (lo + hi) / 2;
  const annualApr = (Math.pow(1 + monthlyRate, 12) - 1) * 100;
  if (!Number.isFinite(annualApr) || annualApr <= 0 || annualApr > 5000) return null;
  return Number(annualApr.toFixed(2));
}

function extractFeeItems(pageText = "", contractPrincipal = 0, months = 12) {
  const text = normalizeText(pageText);
  const items = [];
  const safePrincipal = Number(contractPrincipal) > 0 ? Number(contractPrincipal) : 0;
  const safeMonths = Number(months) > 0 ? Number(months) : 12;
  let m;

  const monthlyFeePct =
    /(?:(?:每月|月)\s*(?:服务费|管理费|手续费|咨询费|担保费|会员费|账户管理费)|monthly\s*(?:service|management)?\s*fee)[^\d]{0,10}(\d+(?:\.\d+)?)\s*%/gi;
  while ((m = monthlyFeePct.exec(text)) !== null) {
    const pct = clampPositive(m[1]);
    if (pct) {
      items.push({ kind: "monthly_fee_pct", raw: `${pct}% per month`, annual_apr_delta: Number((pct * 12).toFixed(2)) });
    }
  }

  const oneTimeFeePct =
    /(?:手续费|服务费|管理费|咨询费|审核费|担保费|风险保证金|征信费|会员费|账户管理费|insurance fee|service fee|management fee|processing fee)[^\d]{0,10}(\d+(?:\.\d+)?)\s*%/gi;
  while ((m = oneTimeFeePct.exec(text)) !== null) {
    const pct = clampPositive(m[1]);
    if (pct) {
      items.push({ kind: "one_time_fee_pct", raw: `${pct}% one-time`, annual_apr_delta: Number(((pct * 12) / safeMonths).toFixed(2)) });
    }
  }

  const feeAmountWithSign =
    /(?:手续费|服务费|管理费|咨询费|审核费|担保费|风险保证金|征信费|会员费|账户管理费|service fee|management fee|processing fee)[^\d¥￥]{0,12}[¥￥]\s*(\d+(?:,\d{3})*(?:\.\d+)?)/gi;
  while ((m = feeAmountWithSign.exec(text)) !== null) {
    const fee = Number(String(m[1]).replace(/,/g, ""));
    if (Number.isFinite(fee) && fee > 0 && safePrincipal > 0) {
      const pct = (fee / safePrincipal) * 100;
      items.push({ kind: "one_time_fee_amount", raw: `${fee} CNY one-time`, annual_apr_delta: Number(((pct * 12) / safeMonths).toFixed(2)) });
    }
  }

  const feeAmountWithUnit =
    /(?:手续费|服务费|管理费|咨询费|审核费|担保费|风险保证金|征信费|会员费|账户管理费|service fee|management fee|processing fee)[^\d]{0,12}(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:元|cny|人民币)/gi;
  while ((m = feeAmountWithUnit.exec(text)) !== null) {
    const fee = Number(String(m[1]).replace(/,/g, ""));
    if (Number.isFinite(fee) && fee > 0 && safePrincipal > 0) {
      const pct = (fee / safePrincipal) * 100;
      items.push({ kind: "one_time_fee_amount", raw: `${fee} CNY one-time`, annual_apr_delta: Number(((pct * 12) / safeMonths).toFixed(2)) });
    }
  }

  const feeAmountBeforeLabel =
    /(?:缴纳|收取|扣除|支付|需付|需缴|需收)[^0-9]{0,8}[¥￥]?\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:元|cny|人民币)?[^。；，,\n]{0,20}(?:审核费|服务费|手续费|管理费|咨询费|会员费|担保费|保证金|账户管理费)/gi;
  while ((m = feeAmountBeforeLabel.exec(text)) !== null) {
    const fee = Number(String(m[1]).replace(/,/g, ""));
    if (Number.isFinite(fee) && fee > 0 && safePrincipal > 0) {
      const pct = (fee / safePrincipal) * 100;
      items.push({ kind: "one_time_fee_amount", raw: `${fee} CNY one-time`, annual_apr_delta: Number(((pct * 12) / safeMonths).toFixed(2)) });
    }
  }

  return items;
}

function dedupeStrings(items = []) {
  return [...new Set(items.filter(Boolean))];
}

function classifyByApr(apr) {
  if (apr >= 24) return "R3";
  if (apr >= 12) return "R2";
  return "R1";
}

function computeRiskSignals(pageText = "") {
  const text = normalizeText(pageText);
  const keywordBuckets = {
    interest_terms: collectKeywordMatches(text, [
      { label: "月息", re: /月息|monthly\s*rate/i },
      { label: "日息", re: /日息|daily\s*rate/i },
      { label: "年化", re: /年化|apr|annual/i },
      { label: "首月免息/前X期免息", re: /首月免息|前\d+期免息|interest[-\s]?free/i },
      { label: "低息/零息", re: /低息|零息|贴息|as low as|low interest/i },
      { label: "计息基数不明", re: /按合同金额计息|计息基数|base amount/i }
    ]),
    hidden_fee_terms: collectKeywordMatches(text, [
      { label: "服务费", re: /服务费|service fee/i },
      { label: "手续费", re: /手续费|processing fee/i },
      { label: "管理费", re: /管理费|management fee/i },
      { label: "会员费", re: /会员费|membership fee/i },
      { label: "咨询费", re: /咨询费|consulting fee/i },
      { label: "审核费", re: /审核费|review fee/i },
      { label: "担保费/保证金", re: /担保费|保证金|risk deposit/i },
      { label: "征信费", re: /征信费|credit check fee/i },
      { label: "账户管理费", re: /账户管理费|account management fee/i },
      { label: "前置扣费/代扣/预扣", re: /前置扣费|代扣|预扣|先扣/i },
      { label: "一次性费用", re: /一次性收取|one[-\s]?time fee/i }
    ]),
    amount_terms: collectKeywordMatches(text, [
      { label: "合同金额/借款金额", re: /合同金额|借款金额|本金|loan amount|principal/i },
      { label: "放款/到账金额", re: /放款|到账|到手|实到/i },
      { label: "每期/月还款", re: /每期还款|月供|每月还款|installment|monthly payment/i },
      { label: "还款总额", re: /还款总额|总还款|应还总额|total repayment/i },
      { label: "借款期数", re: /\d+\s*(期|个月|months?)/i }
    ]),
    inducement_terms: collectKeywordMatches(text, [
      { label: "秒批/快速到账", re: /秒批|快速到账|3分钟到账|即时到账|instant/i },
      { label: "无抵押/无担保", re: /无抵押|无担保|0抵押|0担保|no collateral|no guarantee/i },
      { label: "无征信/不查征信", re: /无征信|不查征信|no credit check/i },
      { label: "低门槛/零门槛", re: /低门槛|零门槛|门槛低/i },
      { label: "随借随还", re: /随借随还|flexible repayment/i },
      { label: "不影响征信", re: /不影响征信|won't affect credit/i },
      { label: "学生/校园专属", re: /学生专属|校园专属|大学生|student|campus/i },
      { label: "应急导向", re: /应急|急用|周转|紧急/i }
    ]),
    penalty_terms: collectKeywordMatches(text, [
      { label: "逾期罚息", re: /逾期罚息|penalty interest|late fee/i },
      { label: "违约金", re: /违约金|liquidated damages/i },
      { label: "催收", re: /催收|collection|电话轰炸|联系人/i },
      { label: "强制续贷", re: /强制续贷|借新还旧|rollover/i },
      { label: "绑定会员才能借", re: /绑定会员|开通会员方可借款|membership required/i },
      { label: "提前还款高额收费", re: /提前还款.*违约金|提前结清.*手续费/i }
    ]),
    ambiguous_terms: collectKeywordMatches(text, [
      { label: "费用另算", re: /费用另算|另行收取|另算/i },
      { label: "少量费用", re: /少量费用|少许费用/i },
      { label: "无任何费用", re: /无任何费用|zero fee/i },
      { label: "%起/低至", re: /%起|低至/i }
    ])
  };

  const studentTargeting = /学生|校园|大学生|考证|实习|校园消费|student|campus/i.test(text);
  return { keywordBuckets, studentTargeting };
}

function buildBehaviorFlags({ keywordBuckets, contractAmount, disbursedAmount, feeItems, baseApr, effectiveApr }) {
  const hasUpfrontDeduction =
    Number.isFinite(contractAmount) && Number.isFinite(disbursedAmount) && disbursedAmount > 0 && disbursedAmount < contractAmount;
  const hasFeeSignal = (keywordBuckets.hidden_fee_terms || []).length > 0 || feeItems.length > 0;
  const hasPromoSignal = (keywordBuckets.inducement_terms || []).length > 0 || (keywordBuckets.ambiguous_terms || []).length > 0;
  const hasAmbiguousCharge = (keywordBuckets.ambiguous_terms || []).length > 0;

  const effective = Number.isFinite(effectiveApr) ? effectiveApr : baseApr;
  const behaviors = {
    upfront_deduction_pattern: hasUpfrontDeduction,
    fake_discount_pattern: hasPromoSignal && effective - baseApr >= 2,
    hidden_fee_pattern: hasFeeSignal && (!hasUpfrontDeduction || feeItems.length > 0),
    induced_borrowing_pattern: hasPromoSignal
  };

  const behaviorCount = Object.values(behaviors).filter(Boolean).length;
  return { behaviors, behaviorCount, hasAmbiguousCharge };
}

function buildRecommendedAction(riskLevel) {
  if (riskLevel === "R3") {
    return "High risk. Pause application, verify all costs in writing, and avoid borrowing before independent review.";
  }
  if (riskLevel === "R2") {
    return "Medium risk. Do not submit yet; disclose full fee breakdown and verify effective APR based on actual disbursed amount.";
  }
  return "Low risk. Continue only after confirming principal equals disbursed amount and no hidden fees exist.";
}

export function analyzeRisk({ apr, pageText = "", principal = 0, months = 12 }) {
  const whyFlagged = [];
  const text = normalizeText(pageText);
  const rateCandidates = collectRateCandidates(text);

  const directApr = clampPositive(apr) || 0;
  const parsedApr = rateCandidates.length ? Math.max(...rateCandidates.map((item) => item.apr)) : null;
  // Use text-derived APR as source of truth when available.
  // Manual APR input is only a fallback when no rate cue exists in the copied page text.
  const baseApr = parsedApr != null ? parsedApr : directApr;

  const amounts = extractAmountsFromText(text);
  const contractAmount = clampPositive(amounts.contract_amount) || clampPositive(principal) || null;
  let disbursedAmount = clampPositive(amounts.disbursed_amount);
  const upfrontDeduction = clampPositive(amounts.upfront_deduction_amount);
  if (!disbursedAmount && contractAmount && upfrontDeduction && upfrontDeduction < contractAmount) {
    disbursedAmount = Number((contractAmount - upfrontDeduction).toFixed(2));
  }
  const periods = clampPositive(amounts.periods) || clampPositive(months) || 12;

  const feeItems = extractFeeItems(text, contractAmount || principal, periods);
  const deductionFromFeeItems = feeItems
    .filter((item) => item.kind === "one_time_fee_amount")
    .map((item) => {
      const amountMatch = /(\d+(?:\.\d+)?)\s*CNY/i.exec(item.raw || "");
      return amountMatch ? Number(amountMatch[1]) : null;
    })
    .filter((n) => Number.isFinite(n) && n > 0)
    .reduce((sum, n) => sum + n, 0);
  if (!disbursedAmount && contractAmount && deductionFromFeeItems > 0 && deductionFromFeeItems < contractAmount) {
    disbursedAmount = Number((contractAmount - deductionFromFeeItems).toFixed(2));
  }

  const firstPaymentCredit =
    /抵扣首月|抵扣首期|用于首月还款|抵扣首月部分还款/i.test(text) && (upfrontDeduction || deductionFromFeeItems)
      ? Number((upfrontDeduction || deductionFromFeeItems || 0).toFixed(2))
      : 0;
  if (contractAmount && disbursedAmount && disbursedAmount < contractAmount) {
    const hiddenFee = contractAmount - disbursedAmount;
    const pct = (hiddenFee / contractAmount) * 100;
    feeItems.push({
      kind: "upfront_deduction",
      raw: `Contract ${contractAmount} CNY vs disbursed ${disbursedAmount} CNY (deduction ${hiddenFee} CNY)`,
      annual_apr_delta: Number(((pct * 12) / periods).toFixed(2))
    });
  }

  const feeAnnualDelta = feeItems.reduce((sum, item) => sum + (item.annual_apr_delta || 0), 0);
  const annualizedCostRate = inferAnnualizedCostRate({
    principal: disbursedAmount || contractAmount,
    periods,
    monthlyRepayment: amounts.monthly_repayment,
    totalRepayment: amounts.total_repayment
  });
  const irrApr = inferAprByIrr({
    principal: disbursedAmount || contractAmount,
    periods,
    monthlyRepayment: amounts.monthly_repayment,
    totalRepayment: amounts.total_repayment,
    firstPaymentCredit
  });

  const effectiveApr = irrApr != null ? Number(irrApr.toFixed(2)) : annualizedCostRate != null ? Number(annualizedCostRate.toFixed(2)) : null;
  const normalizedMonthlyRepayment =
    clampPositive(amounts.monthly_repayment) ||
    (clampPositive(amounts.total_repayment) && periods ? Number((Number(amounts.total_repayment) / periods).toFixed(2)) : null);
  const normalizedContractAmount = contractAmount != null ? Number(contractAmount) : null;
  const normalizedDisbursedAmount = disbursedAmount != null ? Number(disbursedAmount) : null;
  const normalizedUpfrontFee =
    normalizedContractAmount != null && normalizedDisbursedAmount != null && normalizedDisbursedAmount < normalizedContractAmount
      ? Number((normalizedContractAmount - normalizedDisbursedAmount).toFixed(2))
      : 0;

  const { keywordBuckets, studentTargeting } = computeRiskSignals(text);
  const { behaviors, behaviorCount, hasAmbiguousCharge } = buildBehaviorFlags({
    keywordBuckets,
    contractAmount,
    disbursedAmount,
    feeItems,
    baseApr,
    effectiveApr
  });

  let riskLevel = classifyByApr(effectiveApr ?? baseApr);

  const hasAnyBehavior = behaviorCount > 0;
  const hasInducement = behaviors.induced_borrowing_pattern || keywordBuckets.inducement_terms.length > 0;
  if ((hasAnyBehavior || hasInducement) && riskLevel === "R1") {
    riskLevel = "R2";
  }

  const severePenaltySignal = keywordBuckets.penalty_terms.length >= 2;
  const veryHighApr = (effectiveApr ?? 0) >= 36;
  const multiSevereTrap =
    behaviorCount >= 3 && (severePenaltySignal || (effectiveApr ?? 0) >= 24 || keywordBuckets.penalty_terms.length > 0);
  if (veryHighApr || severePenaltySignal || multiSevereTrap || (studentTargeting && severePenaltySignal)) {
    riskLevel = "R3";
  }

  if (
    effectiveApr != null &&
    !hasAnyBehavior &&
    !hasInducement &&
    contractAmount &&
    disbursedAmount &&
    contractAmount === disbursedAmount &&
    effectiveApr < 12
  ) {
    riskLevel = "R1";
  }

  if (effectiveApr != null && effectiveApr > 0) {
    whyFlagged.push(
      `Estimated effective APR ${effectiveApr}% from cash flow (annualized cost rate ${annualizedCostRate || "n/a"}%, IRR APR ${irrApr || "n/a"}).`
    );
    whyFlagged.push(
      `Base APR (promotional/declared) is ${baseApr}%; hidden-fee delta vs effective APR is ${Number(
        (effectiveApr - baseApr).toFixed(2)
      )}%.`
    );
  } else {
    whyFlagged.push(
      "Cash-flow inputs are incomplete (actual disbursed principal + installment + periods). Effective APR cannot be computed reliably."
    );
  }

  if (contractAmount && disbursedAmount && disbursedAmount < contractAmount) {
    whyFlagged.push(`Contract amount (${contractAmount}) is higher than actual disbursed amount (${disbursedAmount}).`);
  }
  if (rateCandidates.length) {
    whyFlagged.push(`Rate cues extracted: ${dedupeStrings(rateCandidates.map((item) => item.source)).join(", ")}.`);
    if (directApr > 0 && parsedApr != null && Math.abs(directApr - parsedApr) > 0.01) {
      whyFlagged.push(
        `Manual APR input (${directApr}%) differs from text-derived APR (${parsedApr}%), using text-derived value.`
      );
    }
  }
  if (feeItems.length) {
    whyFlagged.push(`Fee/cost items extracted: ${dedupeStrings(feeItems.map((item) => item.raw)).join("; ")}.`);
  }
  if (keywordBuckets.inducement_terms.length) {
    whyFlagged.push(`Inducement language: ${keywordBuckets.inducement_terms.join("; ")}.`);
  }
  if (keywordBuckets.penalty_terms.length) {
    whyFlagged.push(`Penalty/collection risk cues: ${keywordBuckets.penalty_terms.join("; ")}.`);
  }
  if (studentTargeting) {
    whyFlagged.push("Student-targeted language detected; increased scrutiny applied.");
  }
  if (hasAmbiguousCharge) {
    whyFlagged.push(`Ambiguous charging wording detected: ${keywordBuckets.ambiguous_terms.join("; ")}.`);
  }

  const recommendedAction = buildRecommendedAction(riskLevel);
  const channelType = riskLevel === "R1" ? "work" : "mixed";

  return {
    risk_level: riskLevel,
    why_flagged: whyFlagged,
    recommended_action: recommendedAction,
    channel_type: channelType,
    nominal_apr: Number(baseApr.toFixed(2)),
    effective_apr: effectiveApr == null ? null : Number(effectiveApr.toFixed(2)),
    hidden_fee_apr_delta: effectiveApr == null ? Number(feeAnnualDelta.toFixed(2)) : Number((effectiveApr - baseApr).toFixed(2)),
    deceptive_phrases: dedupeStrings(keywordBuckets.inducement_terms),
    extracted_fee_items: feeItems,
    keyword_buckets: keywordBuckets,
    behavior_flags: behaviors,
    student_targeting: studentTargeting,
    contract_amount: normalizedContractAmount,
    upfront_fee_amount: normalizedUpfrontFee,
    disbursed_amount: normalizedDisbursedAmount,
    monthly_repayment: normalizedMonthlyRepayment,
    periods
  };
}
