(function () {
  const FLAG = "__loanshield_auto_flow_done__";
  if (window[FLAG]) return;
  window[FLAG] = true;

  function resolveBackendBase() {
    if (typeof window === "undefined" || !window.location) return "";
    const { protocol, hostname, origin } = window.location;
    const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1";
    if (isLocalHost && (protocol === "http:" || protocol === "https:")) {
      // Local demo often runs backend on the same origin/port as /console.
      return origin;
    }
    if (protocol === "http:") {
      // Non-HTTPS pages can still call localhost backend during local demos.
      return "http://127.0.0.1:8787";
    }
    if (protocol === "file:") {
      return "http://127.0.0.1:8787";
    }
    // Public HTTPS pages should not force localhost backend (mixed-content / blocked network).
    return "";
  }

  const BACKEND_BASE = resolveBackendBase();
  const REGULATED_EDUCATION_CREDIT_URL = "https://example.org/regulated-student-credit";

  /** Same structure as demo `buildMockWorkStudyOptions` / finance cards in `app.js`. */
  const STATIC_CAMPUS_WORK = [
    {
      recommendation_id: "work_001",
      channel_type: "work",
      title: "Library Assistant (Campus)",
      provider_name: "Campus Library",
      next_action: "Submit availability and student ID to apply.",
      why_recommended: [
        "Stable part-time income can reduce borrowing urgency.",
        "Campus role has transparent hourly payment."
      ],
      data_source: "mock"
    },
    {
      recommendation_id: "work_002",
      channel_type: "work",
      title: "Teaching Support Assistant",
      provider_name: "Academic Affairs Office",
      next_action: "Apply through campus work-study portal.",
      why_recommended: ["Short shifts fit class schedule.", "Lower financial risk than emergency lending."],
      data_source: "mock"
    }
  ];

  const STATIC_STUDENT_AFFAIRS_AID = {
    recommendation_id: "campus_aid_001",
    channel_type: "campus_support",
    title: "Student Affairs Emergency Aid",
    provider_name: "Student Affairs Office",
    next_action:
      "Book an appointment or submit a short hardship form (bring student ID). Ask about emergency grants, meal assistance, or tuition deferral before taking a loan.",
    why_recommended: [
      "May cover urgent needs without interest or rollover traps.",
      "Staff can connect you to scholarships and on-campus resources before you borrow."
    ],
    data_source: "mock"
  };

  const STATIC_REGULATED_FINANCE = {
    recommendation_id: "finance_regulated_001",
    channel_type: "finance",
    title: "Regulated Education Credit",
    provider_name: "Partnered Regulated Institution",
    apr: 8.5,
    term_months: 12,
    eligibility: "Full-time student, no active delinquency in campus account.",
    integration_status: "demo",
    institution_verified: true,
    application_url: REGULATED_EDUCATION_CREDIT_URL,
    next_action: "Compare APR and full repayment schedule before approval.",
    why_recommended: [
      "Lower APR than typical predatory products.",
      "Regulated provider with clear contract terms."
    ],
    data_source: "mock"
  };

  function escapeHtml(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function safeHref(url) {
    if (!url) return REGULATED_EDUCATION_CREDIT_URL;
    try {
      const u = new URL(url);
      if (u.protocol === "http:" || u.protocol === "https:") return u.toString();
    } catch (_e) {
      /* ignore */
    }
    return REGULATED_EDUCATION_CREDIT_URL;
  }

  function renderCampusAlternativeCard(item) {
    const why = Array.isArray(item.why_recommended) ? item.why_recommended.join("; ") : item.why_recommended || "";
    return `
      <article style="border:1px solid #dbeafe;border-radius:10px;padding:12px;margin-bottom:12px;background:#f8fafc;">
        <h3 style="margin:0 0 8px;font-size:15px;">${escapeHtml(item.title)}</h3>
        <p style="margin:4px 0;font-size:13px;"><strong>Channel:</strong> ${escapeHtml(item.channel_type)}</p>
        <p style="margin:4px 0;font-size:13px;"><strong>Provider:</strong> ${escapeHtml(item.provider_name)}</p>
        <p style="margin:4px 0;font-size:13px;"><strong>Next action:</strong> ${escapeHtml(item.next_action)}</p>
        <p style="margin:4px 0;font-size:13px;"><strong>Why recommended:</strong> ${escapeHtml(why)}</p>
        <p style="margin:4px 0;font-size:13px;"><strong>Data source:</strong> ${escapeHtml(item.data_source || "local")}</p>
      </article>
    `;
  }

  function renderFinanceAlternativeCard(item) {
    const url = safeHref(item.application_url || REGULATED_EDUCATION_CREDIT_URL);
    const why = Array.isArray(item.why_recommended) ? item.why_recommended.join("; ") : item.why_recommended || "";
    const verified = item.institution_verified ? "Yes" : "Pending";
    return `
      <article style="border:1px solid #c7d2fe;border-radius:10px;padding:12px;margin-bottom:12px;background:#eef2ff;">
        <h3 style="margin:0 0 8px;font-size:15px;">${escapeHtml(item.title)}</h3>
        <p style="margin:4px 0;font-size:13px;"><strong>Provider:</strong> ${escapeHtml(item.provider_name)}</p>
        <p style="margin:4px 0;font-size:13px;"><strong>APR:</strong> ${escapeHtml(item.apr != null ? `${item.apr}%` : "—")}</p>
        <p style="margin:4px 0;font-size:13px;"><strong>Term:</strong> ${escapeHtml(item.term_months != null ? `${item.term_months} months` : "—")}</p>
        <p style="margin:4px 0;font-size:13px;"><strong>Eligibility:</strong> ${escapeHtml(item.eligibility || "—")}</p>
        <p style="margin:4px 0;font-size:13px;"><strong>Integration status:</strong> ${escapeHtml(item.integration_status || "—")}</p>
        <p style="margin:4px 0;font-size:13px;"><strong>Institution verified:</strong> ${escapeHtml(verified)}</p>
        <p style="margin:4px 0;font-size:13px;"><strong>Next action:</strong> ${escapeHtml(item.next_action)}</p>
        <p style="margin:4px 0;font-size:13px;"><strong>Why recommended:</strong> ${escapeHtml(why)}</p>
        <p style="margin:4px 0;font-size:13px;"><strong>Data source:</strong> ${escapeHtml(item.data_source || "local")}</p>
        <p style="margin:8px 0 0;font-size:13px;">
          <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;font-weight:600;">Open regulated education credit (compare full schedule)</a>
        </p>
      </article>
    `;
  }

  async function buildAlternativesBodyHtml(riskLevel) {
    let campusItems = [...STATIC_CAMPUS_WORK];
    let financeFromApi = [];

    if (BACKEND_BASE) {
      try {
        const [wRes, fRes] = await Promise.all([
          fetch(`${BACKEND_BASE}/api/channels/work-study`),
          fetch(`${BACKEND_BASE}/api/channels/finance`)
        ]);
        const wJson = await wRes.json().catch(() => ({}));
        const fJson = await fRes.json().catch(() => ({}));
        if (wRes.ok && wJson?.success && Array.isArray(wJson.data) && wJson.data.length) {
          campusItems = wJson.data.filter((x) => x && x.channel_type !== "finance");
        }
        if (fRes.ok && fJson?.success && Array.isArray(fJson.data) && fJson.data.length) {
          financeFromApi = fJson.data;
        }
      } catch (_e) {
        /* use static */
      }
    }

    const isHigherRisk = riskLevel === "R2" || riskLevel === "R3";
    const campusList = isHigherRisk ? [...campusItems, STATIC_STUDENT_AFFAIRS_AID] : campusItems;

    let financeItems = [];
    if (isHigherRisk) {
      financeItems = [STATIC_REGULATED_FINANCE];
      for (const row of financeFromApi) {
        if (!row || row.channel_type !== "finance") continue;
        const t = String(row.title || "").toLowerCase();
        if (t.includes("regulated") && t.includes("education")) continue;
        financeItems.push({
          ...row,
          application_url:
            /regulated|education credit|education installment/i.test(String(row.title || "")) ||
            String(row.application_url || "").includes("regulated-student-credit")
              ? REGULATED_EDUCATION_CREDIT_URL
              : row.application_url
        });
      }
    }

    let html = '<p style="margin:0 0 10px;font-size:13px;color:#475569;">Aligned with the web demo: campus channels first, then verified finance when risk is elevated.</p>';
    html += '<p style="margin:12px 0 6px;font-weight:700;font-size:14px;">Campus alternatives</p>';
    html += campusList.map(renderCampusAlternativeCard).join("");
    if (isHigherRisk && financeItems.length) {
      html += '<p style="margin:16px 0 6px;font-weight:700;font-size:14px;">Verified finance options</p>';
      html += financeItems.map(renderFinanceAlternativeCard).join("");
    }
    return html;
  }

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
    let m = /分\s*(\d{1,3})\s*(?:期|个月)/i.exec(text);
    if (m) return Number(m[1]);
    m = /(?:共|总计|合计)\s*(\d{1,3})\s*(?:期|个月)/i.exec(text);
    if (m) return Number(m[1]);
    // Avoid matching "前3期免息" as total term (no lookbehind for older engines)
    const re = /(\d{1,3})\s*(?:期|个月|months?)/gi;
    let match;
    while ((match = re.exec(text)) !== null) {
      const idx = match.index;
      if (idx > 0 && text[idx - 1] === "前") continue;
      return Number(match[1]);
    }
    return null;
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
    const disbursed =
      contract && upfrontFee > 0 ? Math.max(contract - upfrontFee, 0) : contract != null ? contract : 0;
    const baseApr = detectBaseApr(text);
    const effectiveApr =
      contract != null && monthly != null && periods != null && disbursed > 0
        ? irrAnnual(disbursed, monthly, periods)
        : null;

    const hitTerms = collectKeywordMatches(text, [
      { label: "秒批/快速到账", re: /秒批|快速到账|秒放|立即放款|3分钟到账/i },
      { label: "无抵押/无担保", re: /无抵押|无担保|0抵押|0担保/i },
      { label: "不查征信", re: /不查征信|无征信/i },
      { label: "学生/校园专属", re: /学生|校园|大学生/i },
      { label: "应急诱导", re: /应急|急用|周转/i },
      { label: "模糊收费", re: /费用另算|少量费用|无任何费用/i }
    ]);

    const partial = !contract || !monthly || !periods || effectiveApr == null;
    let riskLevel;
    if (!partial) {
      riskLevel = computeRisk(effectiveApr, upfrontFee > 0, hitTerms);
    } else {
      riskLevel = hitTerms.length >= 2 || upfrontFee > 0 ? "R3" : "R2";
    }

    return {
      text,
      contract,
      monthly,
      periods,
      upfrontFee,
      disbursed,
      baseApr,
      effectiveApr,
      hitTerms,
      riskLevel,
      partial
    };
  }

  function fmtMoney(v) {
    if (v == null || Number.isNaN(Number(v))) return "N/A";
    return String(v);
  }

  function fmtAprPct(v) {
    if (v == null || Number.isNaN(Number(v))) {
      return "N/A（页面未识别完整本金/月供/期数，无法计算 IRR）";
    }
    return `${Number(v).toFixed(2)}%`;
  }

  function flowStorageKey() {
    return `loanshield:auto:flow:v3:${location.origin}${location.pathname}`;
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
    if (!BACKEND_BASE) {
      return {
        education: [
          {
            title: "How to Spot Predatory Loan Traps",
            description: "Verify principal, hidden fees, and full repayment cost before submitting any application.",
            url: "https://consumer.ftc.gov/"
          },
          {
            title: "Three Questions Before Borrowing",
            description: "Check real need, repayment source, and lower-risk alternatives before borrowing.",
            url: "https://www.consumerfinance.gov/"
          }
        ],
        wellbeing: [
          {
            title: "Campus Counseling and Stress Support",
            description: "If pressure is high, contact campus counseling or trusted support before borrowing.",
            url: "https://findahelpline.com/"
          },
          {
            title: "Crisis and Peer Support Options",
            description: "If threats or debt stress affect safety and sleep, ask for crisis or peer support immediately.",
            url: "https://www.opencounseling.com/suicide-hotlines"
          }
        ]
      };
    }
    try {
      const res = await fetch(`${BACKEND_BASE}/api/support/resources?lang=en`);
      const json = await res.json();
      if (res.ok && json?.success && json?.data) return json.data;
    } catch (_e) {
      // fallback below
    }
    return {
      education: [
        {
          title: "How to Spot Predatory Loan Traps",
          description: "Verify principal, hidden fees, and full repayment cost before submitting any application.",
          url: "https://consumer.ftc.gov/"
        },
        {
          title: "Three Questions Before Borrowing",
          description: "Check real need, repayment source, and lower-risk alternatives before borrowing.",
          url: "https://www.consumerfinance.gov/"
        }
      ],
      wellbeing: [
        {
          title: "Campus Counseling and Stress Support",
          description: "If pressure is high, contact campus counseling or trusted support before borrowing.",
          url: "https://findahelpline.com/"
        },
        {
          title: "Crisis and Peer Support Options",
          description: "If threats or debt stress affect safety and sleep, ask for crisis or peer support immediately.",
          url: "https://www.opencounseling.com/suicide-hotlines"
        }
      ]
    };
  }

  function buildWhyGuidanceText(report) {
    const reasons = [];
    if (report.upfrontFee > 0 && report.contract > 0) {
      reasons.push(
        `upfront fee deducted before disbursement (${fmtMoney(report.upfrontFee)} from contract ${fmtMoney(report.contract)})`
      );
    }
    if (report.effectiveApr != null) {
      reasons.push(`cashflow-based Effective APR is ${fmtAprPct(report.effectiveApr)}`);
    }
    if (report.baseApr != null && report.effectiveApr != null && report.effectiveApr > report.baseApr) {
      reasons.push(`effective cost is higher than headline APR (${report.baseApr.toFixed(2)}%)`);
    }
    if (report.hitTerms.length) {
      reasons.push(`marketing cues detected: ${report.hitTerms.slice(0, 2).map((x) => escapeHtml(x)).join(", ")}`);
    }
    if (!reasons.length) {
      return "The page has lending behavior and repayment language, so we recommend a cooling-off check before submission.";
    }
    return `We recommend this guidance because ${reasons.join("; ")}.`;
  }

  async function submitSchoolEvent(report, answers) {
    if (!BACKEND_BASE) return;
    const hasFull =
      report.contract != null &&
      report.monthly != null &&
      report.periods != null &&
      report.effectiveApr != null;
    const totalRepay =
      hasFull && report.monthly != null && report.periods != null
        ? report.monthly * report.periods
        : null;
    const interest =
      hasFull && totalRepay != null ? totalRepay - (report.disbursed || 0) : null;
    const payload = {
      event_id: `auto_${Date.now()}`,
      session_id: `auto_session_${location.host.replace(/[^a-zA-Z0-9_]/g, "_")}`,
      timestamp: new Date().toISOString(),
      risk_level: report.riskLevel,
      why_flagged: [
        `Auto trigger from lending form behaviour on ${location.host}`,
        `Parse: contract=${report.contract}, upfront=${report.upfrontFee}, disbursed=${report.disbursed}, monthly=${report.monthly}, periods=${report.periods}, partial=${Boolean(report.partial)}`,
        `Base APR ${report.baseApr != null ? report.baseApr.toFixed(2) + "%" : "n/a"}, Effective APR ${report.effectiveApr != null ? report.effectiveApr.toFixed(2) + "%" : "n/a"}`
      ],
      recommended_action: "Auto popup workflow triggered. Encourage cooling-off, alternatives, and support resources.",
      consent_state: "granted",
      channel_type: report.riskLevel === "R1" ? "work" : "mixed",
      why_recommended: ["Automatic browser-side risk interception before application submit."],
      source: "browser",
      cost_snapshot: {
        apr: report.effectiveApr != null ? Number(report.effectiveApr.toFixed(2)) : 0,
        principal: report.contract ?? 0,
        months: report.periods ?? 0,
        estimated_monthly_payment: report.monthly ?? 0,
        estimated_total_repayment: totalRepay != null ? Number(totalRepay.toFixed(2)) : 0,
        estimated_total_interest: interest != null ? Number(interest.toFixed(2)) : 0,
        overdue_one_month_extra:
          report.monthly != null ? Number((report.monthly * 0.15).toFixed(2)) : 0
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
    let aborted = false;
    const abort = () => {
      aborted = true;
    };

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
          abort();
          resolve();
        }
      });
    });
    if (aborted) return false;

    // 2) detailed risk items
    await new Promise((resolve) => {
      const delta =
        report.effectiveApr != null
          ? (report.effectiveApr - (report.baseApr || 0)).toFixed(2) + "%"
          : "N/A";
      showModal({
        title: "Detailed Risk Items",
        bodyHtml: `
          <p><strong>Why this guidance</strong></p>
          <p style="margin:0 0 10px;">${escapeHtml(buildWhyGuidanceText(report))}</p>
          <ul style="margin:0 0 0 18px;">
            <li>Contract amount: <strong>${fmtMoney(report.contract)}</strong></li>
            <li>Upfront fee (pre-deducted): <strong>${fmtMoney(report.upfrontFee)}</strong></li>
            <li>Actual disbursed principal: <strong>${fmtMoney(report.disbursed)}</strong></li>
            <li>Monthly repayment: <strong>${fmtMoney(report.monthly)}</strong> × ${fmtMoney(report.periods)} periods</li>
            <li>Base APR: <strong>${report.baseApr != null ? report.baseApr.toFixed(2) + "%" : "N/A"}</strong></li>
            <li>Effective APR (cashflow IRR): <strong>${fmtAprPct(report.effectiveApr)}</strong></li>
            <li>Hidden-fee delta: <strong>${delta}</strong></li>
            <li>Detected terms: <strong>${report.hitTerms.length ? report.hitTerms.map((t) => escapeHtml(t)).join(", ") : "None"}</strong></li>
          </ul>
        `,
        confirmText: "Next",
        onConfirm(_m, overlay) {
          overlay.remove();
          resolve();
        },
        onCancel() {
          abort();
          resolve();
        }
      });
    });
    if (aborted) return false;

    // 3) risk alert
    await new Promise((resolve) => {
      const color = report.riskLevel === "R3" ? "#b91c1c" : report.riskLevel === "R2" ? "#b45309" : "#047857";
      showModal({
        title: "Risk Alert",
        bodyHtml: `
          <p style="font-size:16px;">Current risk level: <strong style="color:${color};">${escapeHtml(report.riskLevel)}</strong></p>
          <p>This page uses low-friction lending marketing with potential hidden cost risk. Please pause before submitting.</p>
        `,
        confirmText: "Next",
        onConfirm(_m, overlay) {
          overlay.remove();
          resolve();
        },
        onCancel() {
          abort();
          resolve();
        }
      });
    });
    if (aborted) return false;

    // 4) alternatives popup (detailed cards like demo + regulated credit link)
    const alternativesBodyHtml = await buildAlternativesBodyHtml(report.riskLevel);
    await new Promise((resolve) => {
      showModal({
        title: "Recommended Alternatives",
        bodyHtml: alternativesBodyHtml,
        confirmText: "Next",
        onConfirm(_m, overlay) {
          overlay.remove();
          resolve();
        },
        onCancel() {
          abort();
          resolve();
        }
      });
    });
    if (aborted) return false;

    // 5) safety education + wellbeing
    const resources = await fetchSupportResources();
    await new Promise((resolve) => {
      const eduHtml = (resources.education || [])
        .slice(0, 2)
        .map(
          (x) => {
            const link = safeHref(x.url || "");
            return `<li><strong>${escapeHtml(x.title)}</strong><br/>${escapeHtml(x.description || "")}${link ? `<br/><a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">Open resource</a>` : ""}</li>`;
          }
        )
        .join("");
      const wellHtml = (resources.wellbeing || [])
        .slice(0, 2)
        .map(
          (x) => {
            const link = safeHref(x.url || "");
            return `<li><strong>${escapeHtml(x.title)}</strong><br/>${escapeHtml(x.description || "")}${link ? `<br/><a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">Open resource</a>` : ""}</li>`;
          }
        )
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
          abort();
          resolve();
        }
      });
    });
    if (aborted) return false;

    await submitSchoolEvent(report, answers);
    return true;
  }

  let interactionCount = 0;
  let flowStarted = false;

  function tryStart() {
    if (flowStarted) return;
    if (sessionStorage.getItem(flowStorageKey()) === "1") return;
    const report = getReport();
    if (!report) return;
    flowStarted = true;
    runFlow(report)
      .then((completed) => {
        if (completed) sessionStorage.setItem(flowStorageKey(), "1");
      })
      .catch(() => {
        // keep host page stable
      })
      .finally(() => {
        flowStarted = false;
      });
  }

  function onFormBehavior(e) {
    const t = e.target;
    if (!t) return;
    const tag = String(t.tagName || "").toLowerCase();
    const isField = tag === "input" || tag === "textarea" || tag === "select";
    if (!isField) return;
    interactionCount += 1;
    if (interactionCount >= 1) {
      tryStart();
    }
  }

  // Trigger condition: detecting form-filling behaviour on lending pages.
  document.addEventListener("focusin", onFormBehavior, true);
  document.addEventListener("input", onFormBehavior, true);
  document.addEventListener("change", onFormBehavior, true);
})();
