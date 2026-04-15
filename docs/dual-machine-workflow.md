# Dual-Machine Workflow (GitHub)

This guide keeps A/B machine development simple while still allowing final merge on one main computer.

## Branch Strategy

- `main`: stable demo branch only
- `dev`: integration branch
- `feat/a-*`: machine A features
- `feat/b-*`: machine B features

## Ownership

- Machine A:
  - `apps/student-plugin/`
- Machine B:
  - `services/school-backend/`
  - `apps/school-console/`
- Shared:
  - `contracts/`
  - `docs/api-contract.md`

## Contract-First Rule

Day 1 must freeze:

- event payload fields
- response envelope
- error code set

If contract changes:

1. open PR
2. update `docs/api-contract.md`
3. both machines rebase and re-test

## Daily Rhythm

- Fixed sync windows:
  - 12:30
  - 20:30
- Each sync must run:
  - R1 script
  - R2 script
  - R3 script

## Merge Back to Main Computer

At delivery time:

1. Main computer pulls latest `dev`
2. Squash/merge validated feature PRs
3. Run full demo scripts locally
4. Tag release candidate `v0.1.0-mvpplus`
