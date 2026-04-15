# Student Plugin (Machine A)

Scope:

- lending-page detection
- intervention UI
- explainable risk reasons
- alternative recommendation card
- event sender to backend API

Key output fields:

- `risk_level`
- `why_flagged`
- `recommended_action`
- `why_recommended`

## Local Run

1. Start backend in project root:
   - `npm run start`
2. Start plugin demo server:
   - `npm run start:a`
3. Open `http://localhost:5173`.
4. Set `API_BASE_URL` to B-machine backend URL when cross-machine testing.

## Demo Steps

1. Paste loan-page text and choose stage (`browse`/`fill`/`submit`).
2. Click `Analyze Risk` to generate:
   - `risk_level`
   - `why_flagged`
   - `recommended_action`
   - channel recommendations with `why_recommended`
3. Click `Upload Event` to send event summary to `POST /api/risk-events`.
