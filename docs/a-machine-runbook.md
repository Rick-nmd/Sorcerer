# A-Machine Runbook

## Branch

- `feat/a-plugin-loop`

## Goal

- Build student-side flow:
  - risk detection
  - intervention
  - dual-channel recommendation
  - event upload to school backend

## Start

From repository root:

1. `npm install`
2. `npm run start` (starts backend on `http://localhost:8787`)
3. `npm run start:a` (serves plugin demo at `http://localhost:5173`)
4. Open `http://localhost:5173` in browser.

## Cross-Machine Collaboration

- Set UI `API_BASE_URL` to B-machine backend URL, for example:
  - `http://192.168.1.20:8787`
- Keep payload fields aligned with `contracts/schemas/risk-event.schema.json`.
- Analyze flow now prefers backend recommendation channels (`/api/channels/*`) and
  falls back to local recommendations if backend is unavailable.

## Validation Checklist

- `Analyze Risk` generates `risk_level`, `why_flagged`, `recommended_action`.
- R2/R3 triggers 15-second cooldown panel.
- Recommendation cards include work + finance channels for R2/R3.
- Recommendation cards show `Data Source` (`live`/`mock`/`local`).
- `Upload Event` receives backend response with envelope fields.
- `npm run smoke:dev` passes after backend startup.

## Example Event Payload

```json
{
  "event_id": "event_123",
  "timestamp": "2026-04-15T15:30:00.000Z",
  "risk_level": "R2",
  "why_flagged": ["Detected 2 high-risk marketing phrase(s)."],
  "recommended_action": "Show alternative channels and upload event if consent granted.",
  "consent_state": "granted",
  "channel_type": "mixed",
  "why_recommended": [
    "Income-based solution reduces debt pressure.",
    "Regulated institution with transparent contract terms."
  ]
}
```
