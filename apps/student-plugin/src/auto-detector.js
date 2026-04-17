(function () {
  const FLAG = "__loanshield_auto_flow_done__";
  if (window[FLAG]) return;
  window[FLAG] = true;

  const BACKEND_BASE = "http://127.0.0.1:8787";

  const PURPOSE_OPTIONS = [
    { value: "daily_expenses", label: "Daily expenses (food, shopping)" },
    { value: "electronics", label: "Electronics (phone, laptop)" },
    { value: "education_training", label: "Education & training (certificates, courses)" },
    { value: "entertainment_social", label: "Entertainment & social (travel, gatherings)" },
    { value: "medical_emergency", label: "Medical emergency" },
    { value: "other", label: "Other" }
  ];
  const AMOUNT_OPTIONS = [
    { value: "below_1000", label: "Below ¥1000" },
    { value: "1000_5000", label: "¥1000 - ¥5000" },
    { value: "5000_10000", label: "¥5000 - ¥10000" },
    { value: "10000_50000", label: "¥10000 - ¥50000" },
    { value: "above_50000", label: "Above ¥50000" }
  ];
  const REPAY_OPTIONS = [
    { value: "parents_allowance", label: "Allowance from parents" },
    { value: "work_study_income", label: "Part-time job / work-study income" },
    { value: "scholarship_aid", label: "Scholarship or financial aid" },
    { value: "other_loans_rollover", label: "Other loan channels (debt rollover)" },
    { value: "no_clear_plan", label: "No clear plan yet" }
  ];

  function safeNum(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  function pos(v) {
    const n = safeNum(v);
    return n && n > 0 ? n : null;
  }
  function collectKeywordMatches(text, patterns) {
    return patterns.filter((item) => item.re.test(text)).map((item) => item.label);
  }

  function detectContractAmount(text) {
    const m =
      /(?:借款|合同金额|本金|授信|可借)[^\d]{0,10}[¥￥]?\s*(\d+(?:,\d{3})*(?:\.\d+)?)/i.exec(text) ||
      /借\s*[¥￥]?\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:元|人民币|cny)/i.exec(text);
    return m ? Number(String(m[1]).replace(/,/g, "")) : null;
  }
  function detectMonthlyRepayment(text) {
    const m =
      /(?:每月(?:仅)?(?:固定)?还(?:款)?|月供|每期还款)[^\d]{0,10}[¥￥]?\s*(\d+(?:,\d{3})*(?:\.\d+)?)/i.exec(text) ||
      /monthly\s*payment[^\d]{0,10}(\d+(?:,\d{3})*(?:\.\d+)?)/i.exec(text);
    return m ? Number(String(m[1]).replace(/,/g, "")) : null;
  }
  function detectPeriods(text) {
    const m = /(\d{1,3})\s*(?:期|个月|months?)/i.exec(text);
    return m ? Number(m[1]) : null;
  }
  function detectUpfrontFees(text) {
    const fees = [];
    const re =
      /(?:收取|缴纳|扣除|代扣|预扣|前置扣费|支付|需付|需缴|需收)[^0-9]{0,10}[¥￥]?\s*(\d+(?:,\d{3})*(?:\.\d+)?)[^。；，,\n]{0,30}(?:审核费|服务费|手续费|管理费|会员费|担保费|保证金|账户管理费|咨询费|渠道费)/gi;
    let m;
    while ((m = re.exec(text)) !== null) {
      const amount = Number(String(m[1]).replace(/,/g, ""));
      if (Number.isFinite(amount) && amount > 0) fees.push(amount);
    }
    return fees;
  }
  function detectBaseApr(text) {
    let m;
    m = /(?:年化|apr|annual)[^\d]{0,10}(\d+(?:\.\d+)?)\s*%/i.exec(text);
    if (m) return Number(m[1]);
    m = /(?:月息|月利率|monthly\s*rate)[^\d]{0,10}(\d+(?:\.\d+)?)\s*%/i.exec(text);
    if (m) return Number(m[1]) * 12;
    m = /(?:日息|日利率|daily\s*rate)[^\d]{0,10}(\d+(?:\.\d+)?)\s*%/i.exec(text);
    if (m) return Number(m[1]) * 365;
    return null;
  }
  function irrAnnual(principal, monthly, periods) {
    const P = pos(principal);
    const M = pos(monthly);
    const N = pos(periods);
    if (!P || !M || !N) return null;
    function npv(r) {
      let v = P;
      for (let i = 1; i <= N; i += 1) {
        v -= M / Math.pow(1 + r, i);
      }
      return v;
    }
    let lo = 0;
    let hi = null;
    let prevR = 0;
    let prevV = npv(prevR);
    if (!Number.isFinite(prevV)) return null;
    for (let r = 0.0005; r <= 5; r += 0.0005) {
      const v = npv(r);
      if (!Number.isFinite(v)) return null;
      if (prevV * v < 0) {
        lo = prevR;
        hi = r;
        break;
      }
      prevR = r;
      prevV = v;
    }
    if (hi == null) return null;
    for (let i = 0; i < 100; i += 1) {
      const mid = (lo + hi) / 2;
      const vm = npv(mid);
      const vl = npv(lo);
      if (vl * vm <= 0) hi = mid;
      else lo = mid;
    }
    return (Math.pow(1 + (lo + hi) / 2, 12) - 1) * 100;
  }

  function computeRisk(effectiveApr, hasUpfrontFee, hitTerms) {
    let level = "R1";
    if (effectiveApr >= 24) level = "R3";
    else if (effectiveApr >= 12) level = "R2";
    if ((hasUpfrontFee || hitTerms.length > 0) && level === "R1") level = "R2";
    if ((hasUpfrontFee && hitTerms.length >= 2) || effectiveApr >= 36) level = "R3";
    return level;
  }

  function isLikelyLoanPage(text) {
    return /(借款|贷款|分期|月供|到账|放款|年化|月息|日息|服务费|审核费|校园|学生|额度|loan|apr|installment|credit)/i.test(
      text
    );
  }

  function getReport() {
    const text = (document.body?.innerText || "").replace(/\s+/g, " ");
    if (!text || !isLikelyLoanPage(text)) return null;

    const contract = detectContractAmount(text);
    const monthly = detectMonthlyRepayment(text);
    const periods = detectPeriods(text);
    const fees = detectUpfrontFees(text);
    const upfrontFee = fees.reduce((s, x) => s + x, 0);
    const disbursed = contract && upfrontFee ? Math.max(contract - upfrontFee, 0) : contract || 0;
    const baseApr = detectBaseApr(text);
    const effectiveApr = irrAnnual(disbursed, monthly, periods);

    if (!contract || !monthly || !periods || !effectiveApr) return null;
    const hitTerms = collectKeywordMatches(text, [
      { label: "秒批/快速到账", re: /秒批|快速到账|秒放|立即放款|3分钟到账/i },
      { label: "无抵押/无担保", re: /无抵押|无担保|0抵押|0担保/i },
      { label: "不查征信", re: /不查征信|无征信/i },
      { label: "学生/校园专属", re: /学生|校园|大学生/i },
      { label: "应急诱导", re: /应急|急用|周转/i },
      { label: "模糊收费", re: /费用另算|少量费用|无任何费用/i }
    ]);
    const riskLevel = computeRisk(effectiveApr, upfrontFee > 0, hitTerms);
    return { text, contract, monthly, periods, upfrontFee, disbursed, baseApr, effectiveApr, hitTerms, riskLevel };
  }

  function buildSelect(id, options) {
    return `<select id="${id}" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:8px;">${options
      .map((o) => `<option value="${o.value}">${o.label}</option>`)
      .join("")}</select>`;
  }

  function showModal({ title, bodyHtml, confirmText = "Next", cancelText = "Close", onConfirm, onCancel }) {
    const overlay = document.createElement("div");
    overlay.style.cssText =
      "position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:2147483646;display:flex;align-items:center;justify-content:center;padding:16px;";
    const modal = document.createElement("div");
    modal.style.cssText =
      "width:640px;max-width:100%;max-height:88vh;overflow:auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:16px;font-family:Arial,sans-serif;color:#111827;";
    modal.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px;">
        <strong style="font-size:18px;">${title}</strong>
      </div>
      <div style="font-size:14px;line-height:1.55;">${bodyHtml}</div>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px;">
        <button id="ls-cancel" style="border:1px solid #cbd5e1;background:#f8fafc;color:#334155;border-radius:8px;padding:8px 12px;cursor:pointer;">${cancelText}</button>
        <button id="ls-confirm" style="border:0;background:#2563eb;color:#fff;border-radius:8px;padding:8px 12px;cursor:pointer;">${confirmText}</button>
      </div>
    `;
    overlay.appendChild(modal);
    document.documentElement.appendChild(overlay);

    modal.querySelector("#ls-cancel")?.addEventListener("click", () => {
      overlay.remove();
      if (onCancel) onCancel();
    });
    modal.querySelector("#ls-confirm")?.addEventListener("click", () => {
      if (onConfirm) onConfirm(modal, overlay);
    });
  }

  async function fetchSupportResources() {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/support/resources?lang=en`);
      const json = await res.json();
      if (res.ok && json?.success && json?.data) return json.data;
    } catch (_e) {
      // fallback below
    }
    return {
      education: [{ title: "Three Questions Before Borrowing", description: "Verify principal, all fees, and full repayment cost before any submit action." }],
      wellbeing: [{ title: "Campus Counseling and Stress Support", description: "If pressure is high, contact campus counseling or trusted support before borrowing." }]
    };
  }

  async function submitSchoolEvent(report, answers) {
    const payload = {
      event_id: `auto_${Date.now()}`,
      session_id: `auto_session_${location.host.replace(/[^a-zA-Z0-9_]/g, "_")}`,
      timestamp: new Date().toISOString(),
      risk_level: report.riskLevel,
      why_flagged: [
        `Auto trigger from lending form behavior on ${location.host}`,
        `Contract ${report.contract}, upfront fee ${report.upfrontFee}, disbursed ${report.disbursed}, monthly ${report.monthly}, periods ${report.periods}`,
        `Base APR ${report.baseApr != null ? report.baseApr.toFixed(2) + "%" : "n/a"}, Effective APR ${report.effectiveApr.toFixed(2)}%`
      ],
      recommended_action: "Auto popup workflow triggered. Encourage cooling-off, alternatives, and support resources.",
      consent_state: "granted",
      channel_type: report.riskLevel === "R1" ? "work" : "mixed",
      why_recommended: ["Automatic browser-side risk interception before application submit."],
      source: "browser",
      cost_snapshot: {
        apr: Number(report.effectiveApr.toFixed(2)),
        principal: report.contract,
        months: report.periods,
        estimated_monthly_payment: report.monthly,
        estimated_total_repayment: Number((report.monthly * report.periods).toFixed(2)),
        estimated_total_interest: Number((report.monthly * report.periods - report.disbursed).toFixed(2)),
        overdue_one_month_extra: Number((report.monthly * 0.15).toFixed(2))
      },
      cooling_off: {
        loan_purpose: answers.loanPurpose,
        loan_amount_range: answers.loanAmountRange,
        repayment_source: answers.repaymentSource
      }
    };
    try {
      await fetch(`${BACKEND_BASE}/api/risk-events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (_e) {
      // keep UX even if backend unavailable
    }
  }

  async function runFlow(report) {
    const answers = {};

    // 1) reflective questions
    await new Promise((resolve) => {
      showModal({
        title: "Cooling-off Reflection (Auto Triggered)",
        bodyHtml: `
          <p>We detected form-filling behaviour on a lending page. Please complete these three questions before continuing.</p>
          <div style="margin:8px 0 6px;"><strong>1) What is the primary purpose of this loan?</strong></div>
          ${buildSelect("ls-q1", PURPOSE_OPTIONS)}
          <div style="margin:10px 0 6px;"><strong>2) What is the expected loan amount range?</strong></div>
          ${buildSelect("ls-q2", AMOUNT_OPTIONS)}
          <div style="margin:10px 0 6px;"><strong>3) How do you plan to repay this loan?</strong></div>
          ${buildSelect("ls-q3", REPAY_OPTIONS)}
        `,
        confirmText: "Continue",
        cancelText: "Dismiss",
        onConfirm(modal, overlay) {
          answers.loanPurpose = modal.querySelector("#ls-q1")?.value || "other";
          answers.loanAmountRange = modal.querySelector("#ls-q2")?.value || "other";
          answers.repaymentSource = modal.querySelector("#ls-q3")?.value || "no_clear_plan";
          overlay.remove();
          resolve();
        },
        onCancel() {
          resolve();
        }
      });
    });

    // 2) detailed risk items
    await new Promise((resolve) => {
      showModal({
        title: "Detailed Risk Items",
        bodyHtml: `
          <ul style="margin:0 0 0 18px;">
            <li>Contract amount: <strong>${report.contract}</strong></li>
            <li>Upfront fee (pre-deducted): <strong>${report.upfrontFee}</strong></li>
            <li>Actual disbursed principal: <strong>${report.disbursed}</strong></li>
            <li>Monthly repayment: <strong>${report.monthly}</strong> × ${report.periods} periods</li>
            <li>Base APR: <strong>${report.baseApr != null ? report.baseApr.toFixed(2) + "%" : "N/A"}</strong></li>
            <li>Effective APR (cashflow IRR): <strong>${report.effectiveApr.toFixed(2)}%</strong></li>
            <li>Hidden-fee delta: <strong>${(report.effectiveApr - (report.baseApr || 0)).toFixed(2)}%</strong></li>
            <li>Detected terms: <strong>${report.hitTerms.length ? report.hitTerms.join(", ") : "None"}</strong></li>
          </ul>
        `,
        confirmText: "Next",
        onConfirm(_m, overlay) {
          overlay.remove();
          resolve();
        },
        onCancel() {
          resolve();
        }
      });
    });

    // 3) risk alert
    await new Promise((resolve) => {
      const color = report.riskLevel === "R3" ? "#b91c1c" : report.riskLevel === "R2" ? "#b45309" : "#047857";
      showModal({
        title: "Risk Alert",
        bodyHtml: `
          <p style="font-size:16px;">Current risk level: <strong style="color:${color};">${report.riskLevel}</strong></p>
          <p>This page uses low-friction lending marketing with potential hidden cost risk. Please pause before submitting.</p>
        `,
        confirmText: "Next",
        onConfirm(_m, overlay) {
          overlay.remove();
          resolve();
        },
        onCancel() {
          resolve();
        }
      });
    });

    // 4) alternatives popup
    await new Promise((resolve) => {
      const alternatives =
        report.riskLevel === "R1"
          ? ["Campus work-study board", "Library assistant role", "Teaching support shifts"]
          : ["Campus work-study board (priority)", "Student affairs emergency aid", "Regulated education credit (compare full repayment schedule)"];
      showModal({
        title: "Recommended Alternatives",
        bodyHtml: `<ul style="margin:0 0 0 18px;">${alternatives.map((x) => `<li>${x}</li>`).join("")}</ul>`,
        confirmText: "Next",
        onConfirm(_m, overlay) {
          overlay.remove();
          resolve();
        },
        onCancel() {
          resolve();
        }
      });
    });

    // 5) safety education + wellbeing
    const resources = await fetchSupportResources();
    await new Promise((resolve) => {
      const eduHtml = (resources.education || [])
        .slice(0, 2)
        .map((x) => `<li><strong>${x.title}</strong><br/>${x.description || ""}</li>`)
        .join("");
      const wellHtml = (resources.wellbeing || [])
        .slice(0, 2)
        .map((x) => `<li><strong>${x.title}</strong><br/>${x.description || ""}</li>`)
        .join("");
      showModal({
        title: "Safety Education & Wellbeing Support",
        bodyHtml: `
          <p><strong>Safety education</strong></p>
          <ul style="margin:0 0 8px 18px;">${eduHtml || "<li>No education items available.</li>"}</ul>
          <p><strong>Wellbeing support</strong></p>
          <ul style="margin:0 0 0 18px;">${wellHtml || "<li>No wellbeing items available.</li>"}</ul>
        `,
        confirmText: "Finish",
        onConfirm(_m, overlay) {
          overlay.remove();
          resolve();
        },
        onCancel() {
          resolve();
        }
      });
    });

    await submitSchoolEvent(report, answers);
  }

  let interactionCount = 0;
  let flowStarted = false;

  function tryStart() {
    if (flowStarted) return;
    const report = getReport();
    if (!report) return;
    const key = `loanshield:auto:flow:${location.host}${location.pathname}:${report.contract}:${report.monthly}:${report.periods}:${report.upfrontFee}`;
    if (sessionStorage.getItem(key) === "1") return;
    flowStarted = true;
    sessionStorage.setItem(key, "1");
    runFlow(report).catch(() => {
      // keep host page stable
    });
  }

  function onFormBehavior(e) {
    const t = e.target;
    if (!t) return;
    const tag = String(t.tagName || "").toLowerCase();
    const isField = tag === "input" || tag === "textarea" || tag === "select";
    if (!isField) return;
    interactionCount += 1;
    if (interactionCount >= 2) {
      tryStart();
    }
  }

  // Trigger condition: detecting form-filling behaviour on lending pages.
  document.addEventListener("focusin", onFormBehavior, true);
  document.addEventListener("input", onFormBehavior, true);
  document.addEventListener("change", onFormBehavior, true);
})();
