# Defense Presentation Script

## 3-5 Minute Flow

### 1. Problem and Positioning

Open with the core problem:

- students facing urgent money stress can be pushed toward predatory lending;
- simple blocking is not enough;
- schools need a privacy-first and explainable intervention loop.

One-line product statement:

> Sorcerer detects risky borrowing journeys, interrupts them with explainable warnings, and redirects students toward legitimate work-study, regulated finance, and support resources.

### 2. Student-Side Demo

Open the student plugin demo and narrate:

1. Paste a risky page text sample.
2. Set APR, repayment months, and stage (`browse` / `fill` / `submit`).
3. Show self-check answers and layered consent scopes.
4. Click `Analyze Risk`.

Call out what appears:

- risk level (`R1/R2/R3`);
- cost transparency;
- explainability notes;
- alternative channels;
- anti-fraud education and wellbeing support.

Then click `Upload Event` and explain:

- only summary event fields are sent;
- `session_id` links the event to the student's own consent history;
- `R2/R3` uploads require consent.

### 3. School-Side Demo

Open the school console and narrate:

1. Refresh the dashboard.
2. Show risk summaries by level, channel, consent, and source.
3. Show event rows with `session_id`, source, and explainability fields.
4. Show consent audit and latest consent profiles.
5. Enter a `student_session_id` and load the student drilldown view.
6. Show network signals and append-only audit trail.

Key message:

> The school sees only the minimum summary data needed for intervention and governance, not full browsing content.

### 4. Commercialization Closed Loop

Explain the diversion strategy:

- first offer work-study opportunities;
- then show verified regulated finance channels when necessary;
- support resources stay visible even if the student does not upload high-risk events.

Emphasize that this is not a pure detection tool:

> The product closes the loop by turning a risky borrowing moment into an employment, regulated finance, or support decision.

### 5. Production Readiness Points

Close with the engineering highlights:

- API-key RBAC for admin, school, integration, and network roles;
- append-only SHA-256 audit chain;
- consent-gated upload for high-risk events;
- semi-real finance adapter with mock fallback;
- smoke test script for repeatable end-to-end verification.

## Suggested Demo Order

1. Run `R2` to show a successful consented upload.
2. Run `R3` with revoked consent to show the gate.
3. Show the same `session_id` in the school console drilldown.
4. Finish with support resources and commercialization alternatives.
