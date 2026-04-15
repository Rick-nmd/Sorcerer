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

Validation failure:

- `error_code = INVALID_SCHEMA`

Consent failure:

- `error_code = CONSENT_REQUIRED`

Request example:

```json
{
  "event_id": "evt_001",
  "timestamp": "2026-04-15T16:00:00.000Z",
  "risk_level": "R2",
  "why_flagged": ["Keyword match: aggressive loan ad"],
  "recommended_action": "Show safer alternatives",
  "consent_state": "granted",
  "channel_type": "finance",
  "why_recommended": ["Regulated option available"]
}
```

Success response example:

```json
{
  "trace_id": "trace_1710000000000",
  "success": true,
  "message": "Event accepted",
  "data": { "event_id": "evt_001" },
  "error_code": null
}
```

Consent-required response example:

```json
{
  "trace_id": "trace_1710000000001",
  "success": false,
  "message": "Consent required for high-risk event processing",
  "data": null,
  "error_code": "CONSENT_REQUIRED"
}
```

### `GET /api/risk-events`

Purpose: school console query.

Query params:

- `risk_level`
- `channel_type`
- `from`
- `to`
- `page`
- `page_size`

<<<<<<< HEAD
Supported filters in B-side v1:

- `risk_level`: `R1|R2|R3`
- `channel_type`: `work|finance|mixed`
- `from`: ISO datetime (inclusive)
- `to`: ISO datetime (inclusive)

Response example:

```json
{
  "trace_id": "trace_1710000000010",
  "success": true,
  "message": "OK",
  "data": [
    {
      "event_id": "evt_001",
      "timestamp": "2026-04-15T16:00:00.000Z",
      "risk_level": "R2",
      "channel_type": "finance",
      "consent_state": "granted",
      "why_flagged": ["Keyword match: aggressive loan ad"],
      "why_recommended": ["Regulated option available"]
    }
  ],
=======
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
>>>>>>> a3a06c2fdb10a320b8f63a37ede0481e42074734
  "error_code": null
}
```

### `GET /api/risk-events/export.csv`

Purpose: export evidence chain for demo/defense.

<<<<<<< HEAD
Supported filters: same as `GET /api/risk-events` (`risk_level`, `channel_type`, `from`, `to`).

CSV columns (minimum):
=======
CSV columns:
>>>>>>> a3a06c2fdb10a320b8f63a37ede0481e42074734

- `event_id`
- `timestamp`
- `risk_level`
- `channel_type`
- `consent_state`
<<<<<<< HEAD

Response content type: `text/csv; charset=utf-8`
=======
- `why_flagged`
- `why_recommended`
>>>>>>> a3a06c2fdb10a320b8f63a37ede0481e42074734

### `GET /api/channels/work-study`

Purpose: work-study options list (mock/static in MVP+).

Response example:

```json
{
  "trace_id": "trace_1710000000020",
  "success": true,
  "message": "OK",
  "data": [
    {
      "job_id": "ws_001",
      "title": "Library Assistant (Part-time)",
      "channel_type": "work",
      "provider_name": "Campus Library",
      "hourly_rate": 18,
      "next_action": "Submit resume at campus portal"
    }
  ],
  "error_code": null
}
```

### `GET /api/channels/finance`

Purpose: licensed finance options.

For MVP+:

- one semi-real upstream path (if available)
- fallback to mock with `data_source=mock`
- upstream failure code: `UPSTREAM_UNAVAILABLE`

<<<<<<< HEAD
Behavior:

- Backend tries `FINANCE_UPSTREAM_URL` first.
- If upstream unavailable or not configured, API returns mock alternatives.
- In fallback mode, response carries `error_code=UPSTREAM_UNAVAILABLE` and `message` marks fallback.

Fallback response example:

```json
{
  "trace_id": "trace_1710000000030",
  "success": true,
  "message": "Upstream unavailable; fallback to mock",
  "data": [
    {
      "recommendation_id": "finance_mock_001",
      "title": "Bank Education Installment (Demo)",
      "channel_type": "finance",
      "apr": 8.5,
      "provider_name": "Demo Bank",
      "next_action": "Bring student ID and apply via official portal",
      "why_recommended": [
        "Lower APR than typical predatory products",
        "Regulated provider with clear contract terms"
      ],
=======
Example error-tolerant response:

```json
{
  "trace_id": "trace_x",
  "success": true,
  "message": "Upstream unavailable, fallback to mock: ...",
  "data": [
    {
      "recommendation_id": "finance_mock_001",
>>>>>>> a3a06c2fdb10a320b8f63a37ede0481e42074734
      "data_source": "mock"
    }
  ],
  "error_code": "UPSTREAM_UNAVAILABLE"
}
```
