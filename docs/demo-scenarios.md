# Demo Scenarios (A/B Joint Debug)

## Scenario 1 - R1 Low Risk

- Stage: `browse`
- APR: `12`
- Sample text: "Student support information and budgeting tips."
- Expected:
  - risk level `R1`
  - local intervention only
  - one work-study recommendation

## Scenario 2 - R2 Medium Risk

- Stage: `fill`
- APR: `28`
- Sample text: "Apply in 1 minute, low interest, no review."
- Expected:
  - risk level `R2`
  - cooldown panel (15s)
  - work + finance recommendations
  - upload succeeds when `consent_state=granted`

## Scenario 3 - R3 High Risk

- Stage: `submit`
- APR: `42`
- Sample text: "Guaranteed approval, transfer fee first."
- Expected:
  - risk level `R3`
  - strong warning banner
  - work + finance recommendations
  - backend records event with `why_flagged` and `why_recommended`

## Joint Debug Routine

1. B-machine runs backend and shares URL.
2. A-machine sets `API_BASE_URL` in demo UI.
3. Run scenarios in order R1 -> R2 -> R3.
4. B-machine verifies event visibility in school console.
