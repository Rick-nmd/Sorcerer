# School Console (Machine B)

Scope:

- risk-event list page
- risk-level and time filters
- detail view with explanation chain
- CSV export for demo evidence

Data source:

- `GET /api/risk-events`
- `GET /api/risk-events/export.csv`

## Local Access

1. Start backend from project root:
   - `npm run start`
2. Open:
   - `http://localhost:8787/console`

## Features in MVP+

- Load event list from backend
- Filter by risk level/channel type/date range
- Inspect `why_flagged` and `why_recommended`
- Export evidence CSV
