# Release Readiness Checklist (MVP+)

## Goal

Provide a unified A+B demo branch that can be run and presented with minimal setup.

## Branch Status

- Base integration branch: `dev`
- Included feature branches:
  - `feat/a-plugin-loop`
  - `feat/b-backend-console`

## Local Start Commands

1. Install dependencies:
   - `npm install`
2. Validate contracts:
   - `npm run check`
3. Start backend:
   - `npm run start`
4. Open school console:
   - `http://localhost:8787/console`
5. Start student demo (default):
   - `npm run start:a`
6. If port 5173 is occupied:
   - PowerShell: `$env:A_PLUGIN_PORT=5299; npm run start:a`

## Required Demo Proof

- Risk gate:
  - R2/R3 with `consent_state != granted` returns `403` + `CONSENT_REQUIRED`
- Event flow:
  - Student event upload appears in school console list
- Export:
  - `/api/risk-events/export.csv` returns CSV with expected columns
- Alternative channels:
  - `work-study` endpoint returns options
  - `finance` endpoint returns live data when available and mock fallback otherwise

## End-to-End Script Order

1. Run R1 scenario from `docs/demo-scenarios.md`.
2. Run R2 scenario and verify uploaded event appears in console.
3. Run R3 scenario and verify consent gate behavior.
4. Export CSV and include in defense package.
