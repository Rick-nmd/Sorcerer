# Sorcerer - Campus Risk MVP+

This repository contains the MVP+ implementation plan and starter project structure for a campus anti-predatory-lending product with a "diversion instead of blocking only" strategy.

## Product Loop

`Detect -> Intervene -> Explain -> Risk Tier -> Recommend Legitimate Alternatives`

- Work-study channel (campus jobs / partner labor platforms)
- Licensed finance channel (bank / regulated institutions)
- School backend receives **event summaries only** (privacy-first)

## Repository Structure

- `apps/student-plugin/` - Student-side detection/intervention client
- `apps/school-console/` - School risk dashboard UI
- `services/school-backend/` - Event ingest API and adapter services
- `contracts/schemas/` - Shared JSON schemas between A/B machines
- `docs/` - API contract, privacy/ethics, collaboration workflow

## Collaboration Model (Two Machines)

- Machine A: plugin + recommendation UI + event sender
- Machine B: backend + school console + external adapter
- Contract-first: freeze schema and API before feature coding

Detailed workflow: `docs/dual-machine-workflow.md`
Release checklist: `docs/release-readiness.md`
Production roadmap: `docs/production-integration-roadmap.md`

## Quick Start

1. Install dependencies:
   - `npm install`
2. Validate schemas:
   - `npm run check`
3. Start full demo (recommended):
   - `npm run demo`
4. Open school console:
   - `http://localhost:8787/console` (or the port printed in terminal)
5. Open student plugin demo:
   - `http://localhost:5173` (or the port printed in terminal)
6. Run integrated smoke checks (in another terminal):
   - `npm run smoke:dev`

## Scope

See `docs/scope-mvp-plus.md` for MVP+ scope boundaries and done criteria.
See `docs/defense-presentation-script.md` for the final presentation flow.
