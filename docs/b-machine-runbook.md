<<<<<<< HEAD
# B-Machine Runbook (Backend + School Console)

## 1) Startup Commands

From repo root:

```bash
npm install
npm run check
npm run start
```

Default backend address:

- `http://localhost:8787`

Optional upstream config for finance channel:

```bash
export FINANCE_UPSTREAM_URL="https://example.com/finance-options"
```

## 2) API curl Examples

### Health check

```bash
curl "http://localhost:8787/health"
```

### POST /api/risk-events

```bash
curl -X POST "http://localhost:8787/api/risk-events" \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "evt_demo_001",
    "timestamp": "2026-04-15T16:00:00.000Z",
    "risk_level": "R2",
    "why_flagged": ["Keyword match: high-pressure loan ad"],
    "recommended_action": "Show alternatives and cool-down prompt",
    "consent_state": "granted",
    "channel_type": "finance",
    "why_recommended": ["Lower-risk regulated provider available"]
  }'
```

### GET /api/risk-events

```bash
curl "http://localhost:8787/api/risk-events?risk_level=R2&channel_type=finance&from=2026-04-01T00:00:00.000Z&to=2026-04-30T23:59:59.000Z"
```

### GET /api/risk-events/export.csv

```bash
curl -L "http://localhost:8787/api/risk-events/export.csv?risk_level=R2" -o risk-events.csv
```

### GET /api/channels/work-study

```bash
curl "http://localhost:8787/api/channels/work-study"
```

### GET /api/channels/finance

```bash
curl "http://localhost:8787/api/channels/finance"
```

## 3) School Console (Minimal UI)

Open:

- `apps/school-console/index.html`

Features in v1:

- risk-events list rendering
- risk_level filtering
- CSV export trigger (`/api/risk-events/export.csv`)
- detail fields: `why_flagged` and `why_recommended` (fallback `-`)

## 4) A-Machine Integration Config

For A-machine event sender, set:

```bash
API_BASE_URL=http://localhost:8787
```

Expected endpoints used by A-machine:

- `POST /api/risk-events`
- `GET /api/channels/work-study`
- `GET /api/channels/finance`
=======
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
>>>>>>> a3a06c2fdb10a320b8f63a37ede0481e42074734
