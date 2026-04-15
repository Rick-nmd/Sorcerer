# Privacy and Ethics Statement (MVP+)

## Core Principles

- Protection-first: provide support before judgment.
- Privacy-first: local analysis by default.
- Explainability-first: every risk flag must show reasons.

## Data Minimization

The system does **not** collect:

- full page content
- full browsing history
- sensitive free-text form content

The system may store summary event fields only:

- timestamp
- risk level
- trigger reasons
- recommendation type
- consent state

## Consent Rules

- R2/R3 upload requires explicit consent.
- Revoke action must be available and logged.
- Audit record stores action metadata only.

## Fairness Rules

The MVP+ policy does not infer risk from:

- family wealth
- location
- school ranking

## Human-in-the-Loop

Any high-risk recommendation must be:

- explainable
- reviewable
- manually overrideable in demo mode
