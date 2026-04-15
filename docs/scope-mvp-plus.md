# MVP+ Scope Freeze

This repository implements the agreed MVP+ target:

1. Student-side risk detection and intervention loop (local-first behavior).
2. Commercialization diversion loop with two channels:
   - Work-study opportunities.
   - Licensed finance options.
3. School backend that receives event summaries only (not page full text).
4. One semi-real external API adapter with mock fallback.

## Explicitly Included

- Risk levels R1/R2/R3.
- Explainable fields: `risk_level`, `why_flagged`, `recommended_action`.
- Recommendation explainability field: `why_recommended`.
- Consent gating before sending high-sensitivity events to backend.
- School console with filtering and CSV export.

## Explicitly Excluded

- Real institution contracts or production banking integrations.
- Real parent notification and real school system integration.
- Full compliance audit workflow and SSO integration.

## Done Criteria

- 3 end-to-end demo scenarios pass: low, medium, high risk.
- Backend stores and visualizes summary events.
- At least one public/test API is called by backend adapter.
