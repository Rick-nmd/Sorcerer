# API Contract (MVP+)

## Base Rules

- Base path: `/api`
- Response envelope:
  - `trace_id: string`
  - `success: boolean`
  - `message: string`
  - `data: object | array | null`
  - `error_code: string | null`

## Endpoints

### `POST /api/risk-events`

Purpose: ingest student-side event summary (no page full text).

Required fields:

- `event_id`
- `timestamp`
- `risk_level` (`R1|R2|R3`)
- `why_flagged` (array of reasons)
- `recommended_action`
- `consent_state` (`granted|revoked|not_granted`)
- `channel_type` (`work|finance|mixed`)
- `why_recommended` (array of recommendation reasons)

Optional fields:

- `cost_snapshot.apr`
- `cost_snapshot.principal`
- `cost_snapshot.months`
- `cost_snapshot.estimated_monthly_payment`

Validation failure:

- `error_code = INVALID_SCHEMA`

Consent failure:

- `error_code = CONSENT_REQUIRED`

### `GET /api/risk-events`

Purpose: school console query.

Query params:

- `risk_level`
- `channel_type`
- `from`
- `to`
- `page`
- `page_size`

Response shape:

```json
{
  "trace_id": "trace_x",
  "success": true,
  "message": "OK",
  "data": {
    "items": [],
    "total": 0,
    "page": 1,
    "page_size": 50
  },
  "error_code": null
}
```

### `GET /api/risk-events/export.csv`

Purpose: export evidence chain for demo/defense.

CSV columns:

- `event_id`
- `timestamp`
- `risk_level`
- `channel_type`
- `consent_state`
- `why_flagged`
- `why_recommended`

### `GET /api/channels/work-study`

Purpose: work-study options list (mock/static in MVP+).

### `GET /api/channels/finance`

Purpose: licensed finance options.

For MVP+:

- one semi-real upstream path (if available)
- fallback to mock with `data_source=mock`
- upstream failure code: `UPSTREAM_UNAVAILABLE`

Example error-tolerant response:

```json
{
  "trace_id": "trace_x",
  "success": true,
  "message": "Upstream unavailable, fallback to mock: ...",
  "data": [
    {
      "recommendation_id": "finance_mock_001",
      "data_source": "mock"
    }
  ],
  "error_code": "UPSTREAM_UNAVAILABLE"
}
```
