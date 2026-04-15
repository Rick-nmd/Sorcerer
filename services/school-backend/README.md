# School Backend (Machine B)

Scope:

- receive event summaries from plugin
- validate minimal payload contract
- provide query and export API for school console
- expose finance channel adapter with mock fallback

Primary APIs:

- `POST /api/risk-events`
- `GET /api/risk-events`
- `GET /api/risk-events/export.csv`
- `GET /api/channels/finance`
