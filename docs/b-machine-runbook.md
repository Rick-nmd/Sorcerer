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

<<<<<<< HEAD
### 6) Seed and reset demo data

```bash
curl -X POST "http://localhost:8787/api/demo/seed"
curl -X POST "http://localhost:8787/api/demo/reset"
```

## A/B Collaboration Notes
=======
## 3) School Console (Minimal UI)
>>>>>>> 0d8f8c9 (Document dev regression acceptance results for B-machine.)

<<<<<<< HEAD
- A-machine plugin should point `API_BASE_URL` to B-machine backend URL.
- If API key auth is enabled, configure matching `x-api-key` in both student and console UIs.
- Required payload fields must match `contracts/schemas/risk-event.schema.json`.
- Use demo scripts in `docs/demo-scenarios.md` for R1/R2/R3 run-through.
=======
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

## 5) B-Machine Acceptance Log (dev)

Date: 2026-04-16

Environment:

- branch: `dev`
- install/check: `npm install` and `npm run check` passed
- note: default `8787` was already occupied in local machine, so acceptance run used `PORT=8899` and `PORT=8900`

Regression results:

- `/console` accessibility
  - fixed route mapping in backend
  - `GET /console` now returns redirect (`301`) to `/console/`, and console static page is reachable
- R2/R3 consent gate
  - `POST /api/risk-events` with `risk_level=R3` and non-granted consent returns `403` with `error_code=CONSENT_REQUIRED`
- risk-events multi-filter query
  - `GET /api/risk-events` with `risk_level + channel_type + from + to` correctly returns narrowed events
- CSV export fields
  - `GET /api/risk-events/export.csv` includes required columns:
    `event_id,timestamp,risk_level,channel_type,consent_state`
- finance live/fallback
  - fallback verified on instance without `FINANCE_UPSTREAM_URL`:
    returns mock data with `error_code=UPSTREAM_UNAVAILABLE`
  - live verified on instance with `FINANCE_UPSTREAM_URL=http://localhost:8901`:
    returns upstream data and marks `data_source=upstream`
>>>>>>> 71633de (Document dev regression acceptance results for B-machine.)
