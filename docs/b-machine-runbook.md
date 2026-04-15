# B-Machine Runbook

## Branch

- `feat/b-backend-console`

## Start

From repository root:

1. `npm install`
2. `npm run check`
3. `npm run start`
4. Open school console: `http://localhost:8787/console`

## Core API Test Commands

### 1) Upload event

```bash
curl -X POST http://localhost:8787/api/risk-events \
  -H "Content-Type: application/json" \
  -d '{
    "event_id":"event_b_001",
    "timestamp":"2026-04-15T16:00:00.000Z",
    "risk_level":"R2",
    "why_flagged":["Detected high-risk phrase"],
    "recommended_action":"Show alternatives",
    "consent_state":"granted",
    "channel_type":"mixed",
    "why_recommended":["Income-first","Regulated option"]
  }'
```

### 2) Query with filters

```bash
curl "http://localhost:8787/api/risk-events?risk_level=R2&channel_type=mixed"
```

### 3) Export CSV

```bash
curl -o risk-events.csv "http://localhost:8787/api/risk-events/export.csv"
```

### 4) Work-study channel

```bash
curl "http://localhost:8787/api/channels/work-study"
```

### 5) Finance channel (semi-real with fallback)

```bash
curl "http://localhost:8787/api/channels/finance"
```

## A/B Collaboration Notes

- A-machine plugin should point `API_BASE_URL` to B-machine backend URL.
- Required payload fields must match `contracts/schemas/risk-event.schema.json`.
- Use demo scripts in `docs/demo-scenarios.md` for R1/R2/R3 run-through.
