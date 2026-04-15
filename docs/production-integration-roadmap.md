# Production Integration Roadmap

This document maps the currently implemented production-grade scaffolding to the remaining real-world rollout work.

## 1) Institution Integration (Technical Readiness)

Implemented:

- Provider registry API:
  - `POST /api/integrations/providers/register`
  - `GET /api/integrations/providers`
- Offer sync API:
  - `POST /api/integrations/providers/:providerId/offers/sync`
  - `POST /api/integrations/providers/:providerId/webhooks/offers`
- Finance channel now prioritizes institution-synced offers before live/mock fallback.

Remaining (business/legal):

- Legal contract and SLA with partner institutions.
- Security assessment and key exchange.
- Production callback endpoint whitelisting.
- Joint incident response and dispute process.

## 2) Campus Network Monitoring Ingestion

Implemented:

- Network signal ingestion:
  - `POST /api/network/signals`
  - `GET /api/network/signals`
- Risk event derivation from network signals when confidence/category threshold is met.

Remaining (infrastructure/governance):

- Real gateway integration from campus network appliance.
- Privacy impact assessment for network metadata policy.
- Approved hashing/tokenization standard for domain/session identifiers.
- SOC and legal review for retention windows.

## 3) RBAC, Audit, and Operations

Implemented:

- API-key role model (`admin`, `school`, `integration`, `network`) via env vars.
- Append-only audit chain (`/api/audit-events` for admin).
- Persistent local data store for key entities.
- `health`, `ready`, and `metrics` endpoints.
- Container deployment files (`Dockerfile`, `docker-compose.yml`, `.env.example`).

Remaining (production hardening):

- Move from local JSON persistence to managed database + backup policy.
- Replace API keys with centralized IAM/SSO.
- Centralized logging and alerting stack.
- CI/CD policy checks, secrets management, and disaster-recovery drill.
