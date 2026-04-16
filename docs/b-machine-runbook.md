# School-Side Runbook (Backend + Console)

This runbook is for the **school backend** and the **school console** UI served at `/console`.

## 1) Startup

From repo root:

```bash
npm install
npm run check
npm run start
```

Default backend URL:

- `http://localhost:8787`

If the port is occupied, pick another port:

```bash
PORT=8899 npm run start
```

Open the console:

- `http://localhost:<PORT>/console`

## 2) Optional finance upstream

```bash
export FINANCE_UPSTREAM_URL="https://example.com/finance-options"
```

## 3) Quick curl checks

### Health

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
curl "http://localhost:8787/api/risk-events?risk_level=R2&channel_type=finance"
```

### CSV export

```bash
curl -L "http://localhost:8787/api/risk-events/export.csv" -o risk-events.csv
```

### Channels

```bash
curl "http://localhost:8787/api/channels/work-study"
curl "http://localhost:8787/api/channels/finance"
```

### Demo seed / reset

```bash
curl -X POST "http://localhost:8787/api/demo/seed"
curl -X POST "http://localhost:8787/api/demo/reset"
```

## 4) Student-side integration (cross-machine)

Point the student UI `Backend URL` to the school backend URL, for example:

```bash
API_BASE_URL=http://localhost:8787
```

If API key auth is enabled, configure matching `x-api-key` headers in both student UI and console UI.

## 5) Dev acceptance notes (example)

When validating locally, it is common for `8787` to be occupied. In that case, run on another `PORT` and use that value everywhere (console URL + student `Backend URL` + smoke tests).

Regression checklist:

- `/console` loads from the backend static route
- R2/R3 consent gate returns `403` with `CONSENT_REQUIRED` when consent is not granted
- `GET /api/risk-events` supports filters (`risk_level`, `channel_type`, `from`, `to`, `source`)
- CSV export includes the expected columns
- Finance endpoint returns live data when configured, otherwise mock fallback with `UPSTREAM_UNAVAILABLE`
