# Feedback — Nguyễn Quang Linh

**Project:** [sat-learning-api-integration](./sat-learning-api-integration/)  
**Reviewed against:** `trainees/sample/practical-test.md`, `trainees/sample/Standard.md`  
**Date:** 2026-08-04

---

## Verdict

**Result: Fail** (Final score **50**; Pass if ≥71)

The 2nd submission adds **Kong** (`kong.yml` with JWT plugin), **K8s manifests** (Kong, Keycloak, RabbitMQ, services, Prometheus/Grafana YAML), and expanded Vietnamese design docs (`HE_THONG_THANH_TOAN_KHOA_HOC_SAT.md`, README). Runnable code is still **minimal**: `docker-compose.yml` only starts two Express stubs and RabbitMQ — **no Kong, Keycloak, or observability in compose**. `sat-order-payment-service` imports `amqplib` but **never connects or publishes**; partner mock is a one-line checkout; webhook handler only logs.

| Area | Weight | Score |
| --- | --- | --- |
| Architecture | 30% | 16/30 |
| Contract | 25% | 10/25 |
| Security | 20% | 8/20 |
| Test / ops | 15% | 9/15 |
| Presentation | 10% | 7/10 |
| **Final score** | **100%** | **50** |

---

## Practical-test checklist

### Standard

| # | Requirement | Result | Notes |
| --- | --- | --- | --- |
| 1 | Distinct business domain | **Pass** | EdTech SAT course registration + payment |
| 2 | Workflow + partner + API docs | **Partial** | Detailed prose in `HE_THONG_*` and README; **no OpenAPI 3.0 file**; API tables not machine-verifiable |
| 3 | Tech stack + ≥1 partner mock | **Partial** | `sat-partner-mock-service` exists; **no checkout→webhook→order state** behavior |

### Advanced

| # | Requirement | Result | Notes |
| --- | --- | --- | --- |
| 4 | Kong + Keycloak | **Partial** | `kong.yml` + `k8s/manifests/keycloak-deployment.yaml`; **not in docker-compose**; JWT plugin not demonstrable locally; no realm export in repo |
| 5 | Deploy to Kubernetes | **Partial** | Manifests present; Kong deployment **lacks ConfigMap mount** for declarative config |
| 6 | Message broker | **Partial** | RabbitMQ in compose and K8s; **no AMQP usage** in application code |
| 7 | Observability | **Partial** | `prometheus.yml` + `k8s/observability/*` files; **not wired** to running compose stack; EFK claimed in docs only |

---

## Course standards

### API Design (3.1 / 3.4) — partial (documentation)

- Endpoint list in design docs (`POST /api/v1/orders`, webhook) — REST-shaped
- Gap: no `openapi.yaml`, no error model, idempotency, pagination, or versioning in a contract file

### Integration patterns (3.2) — fail (implementation)

- Documented webhook + RabbitMQ `payment_completed` flow not coded
- No retry, timeout, circuit breaker, DLQ, or idempotent webhook handling

### Security & platform roles (3.3–3.5) — partial

- Kong JWT plugin declared in YAML; Keycloak described in architecture text
- Gap: no working token flow, no client-credentials S2S, no webhook signature; secrets not managed beyond defaults

### Design pack — partial

- Strong narrative docs (`DOCUMENTATION.md`, `HE_THONG_*`) and K8s folder structure
- Missing: OpenAPI, Postman/Newman, runbook, architecture review checklist (≥10 items), EVNICT mapping

---

## What went well

1. **Documentation depth** improved substantially — business flow, component table, and Advanced matrix in README match course module structure.
2. **K8s and Kong artifacts** show awareness of the reference stack (gateway, IdP, broker, observability folders).
3. **Domain choice** (SAT course payment partner) is clear and appropriate for bank/webhook-style integration labs.
4. `test_api.py` and `prometheus` `/metrics` stub indicate intent toward ops/testing (needs real assertions).

---

## Gaps & improvements

| Priority | Item | Remediation |
| --- | --- | --- |
| High | Implement webhook + RabbitMQ | Partner mock calls webhook; order service publishes/consumes and sets `PAID` |
| High | OpenAPI 3.0 | Add `openapi.yaml`; align Express handlers and Kong routes |
| High | Runnable compose | Include Kong + Keycloak + mount `kong.yml`; import realm JSON |
| Medium | Fix K8s Kong | ConfigMap volume for declarative config; smoke-test `kubectl apply` |
| Medium | Security | Keycloak realm export; demonstrate 401 without JWT on Kong |
| Low | Contract/integration tests | Finish `test_api.py` or Postman/Newman against gateway |
| Low | Capstone checklist | EVNICT row (payment partner) + formal architecture review |

---

## Pillar scorecard (quick)

| Pillar | Status |
| --- | --- |
| 3.1 API Design | Partial (prose only) |
| 3.2 System Integration | Fail |
| 3.3 OAuth2 & Security | Partial |
| 3.4 OpenAPI & Docs | Fail |
| 3.5 AMP / IdP / Gateway | Partial |
| 3.6 Reference stack | Partial (files > runtime) |

---

## Recommendation

**Not acceptable** for pass until Standard items 2–3 are **working code** with OpenAPI, not only K8s/YAML and markdown. Next iteration: one `docker compose up` demo through Kong with JWT, order create, partner webhook, and RabbitMQ state update — then harden K8s and observability.
