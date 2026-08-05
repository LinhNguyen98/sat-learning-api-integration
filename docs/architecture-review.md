# Architecture Review Checklist

## SAT Learning — Capstone

| # | Item | Status | Notes / Gap / Remediation |
| :--- | :--- | :--- | :--- |
| **1** | Resource-oriented URIs (nouns, hierarchy) | ✅<br>Pass | `/api/v1/orders`, `/api/v1/orders/{id}` — no verbs except `/cancel` (PATCH action) |
| **2** | Idempotency-Key header cho POST thanh toán | ✅<br>Pass | `POST /api/v1/orders` và `POST /api/v1/payments/webhook` đều enforce Idempotency-Key |
| **3** | Stateless design — không giữ session server-side | ✅<br>Pass | In-memory store là demo only; production dùng DB |
| **4** | OAuth2 Client Credentials (S2S) | ✅<br>Pass | Order Service → Payment Mock dùng Client Credentials via Keycloak |
| **5** | OIDC cho user identity | ✅<br>Pass | frontend-app client dùng Authorization Code + PKCE |
| **6** | Kong Gateway enforce 401 (JWT validate) | ✅<br>Pass | Plugin `jwt` cấu hình trong `kong.yml` |
| **7** | Rate limiting tại Gateway | ✅<br>Pass | Kong plugin: 100 req/min per consumer |
| **8** | IdP / Gateway / Backend phân tách rõ | ✅<br>Pass | 3 boxes riêng: Keycloak (IdP), Kong (GW), Services (Backend) |
| **9** | Circuit breaker tại Payment Gateway call | ✅<br>Pass | RetryDelegatingHandler với 3x retry + exponential backoff |
| **10** | DLQ cấu hình cho message queue | ✅<br>Pass | `payment.dlx` exchange + `payment.completed.dlq` trong RabbitMQ |
| **11** | Pagination cho list endpoint | ✅<br>Pass | `GET /api/v1/orders?page=&size=` với totalPages, totalCount |
| **12** | OpenAPI 3.0 reviewed (no errors) | ✅<br>Pass | `docs/openapi.yaml` — validated against spec |
| **13** | Unified error model (code + message + details[]) | ✅<br>Pass | ApiResponse<T> với code, message, details[] |
| **14** | Health-check endpoint | ✅<br>Pass | `/health` , `/health/ready` , `/health/live` |
| **15** | Secrets không commit | ✅<br>Pass | Chỉ có `.env.example` ; credentials trong Docker env vars |

---

## EVNICT Partner Integration Coverage

| Category | Partner Simulated | Method |
| :--- | :--- | :--- |
| **Third-party (Bank)** | Payment Gateway Mock | OAuth2 + Sync + Webhook |
| **Digital Infrastructure (E-invoice)** | E-invoice Mock | Async RabbitMQ event |
| **External Partner (Logistics)** | Logistics Mock | OAuth2 + Async REST + Webhook |
| **Internal / Identity** | Keycloak (IdP) | OIDC |
| **Internal / Edge** | Kong (Gateway) | JWT validation |
