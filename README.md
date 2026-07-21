# LoanShield

> A campus-focused risk-intervention prototype that helps students pause, understand potential borrowing risks, and find safer next steps.

[![HackDKU 2026](https://img.shields.io/badge/HackDKU-2026-7C3AED?style=flat-square)](https://github.com/Rick-1091/Sorcerer)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=222)](https://developer.mozilla.org/docs/Web/JavaScript)
[![Privacy-first](https://img.shields.io/badge/Design-Privacy--first-2E8B57?style=flat-square)](#privacy-by-design)

**[View live demo](https://loanshield-demo.onrender.com/student)** · **[Open the school console](https://loanshield-demo.onrender.com/console)**

## Why LoanShield?

Students can encounter online borrowing offers at moments of financial pressure. LoanShield is designed around a simple principle:

> **Intervention over surveillance.**

Rather than merely blocking a page, the prototype creates a cooling-off moment, explains risk in plain language, and directs students toward safer support options.

## Experience flow

`Detect → Pause → Explain → Assess → Redirect`

1. **Detect** lending-like form-filling behaviour in the student-side demo.
2. **Pause** with three reflection questions before a decision is made.
3. **Explain** repayment and effective-APR-style context in accessible language.
4. **Assess** the event with a tiered risk model.
5. **Redirect** students to legitimate alternatives, including campus work-study and regulated finance options.

## What is included

| Area | What it does |
| --- | --- |
| Student client | Demonstrates detection, a cooling-off flow, and recommendations. |
| School console | Displays aggregated support events and risk-level summaries. |
| Shared backend | Receives event summaries through a lightweight Express API. |
| Product contracts | Keeps the client and backend aligned through shared JSON schemas. |

## Privacy by design

- The school-facing flow is designed around **event summaries**, not intrusive browsing records.
- Student consent and clear explanation are central to the prototype.
- This is an educational HackDKU prototype, not a lending, credit-scoring, or surveillance product.

## Run locally

```bash
npm install
npm run check
npm run demo
```

Then open:

- Student demo: `http://localhost:5173`
- School console: `http://localhost:8787/console`

For a quick integration check:

```bash
npm run smoke:dev
```

## Project structure

```text
apps/
  student-plugin/     # Student-facing detection and intervention demo
  school-console/     # School support dashboard
services/
  school-backend/     # Express API for event summaries
contracts/schemas/    # Shared client/backend data contracts
docs/                 # Product scope, ethics, API, demo, and deployment notes
```

## Hackathon context

Built for **HackDKU 2026 — FINtech Track** by Team Sorcerer. The project focuses on turning a high-stakes financial decision into a more informed and support-oriented experience.

---

*Built as a learning prototype. It does not provide financial advice or make decisions for students.*