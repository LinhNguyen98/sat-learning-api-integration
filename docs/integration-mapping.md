# EVNICT Partner Category Mapping

| Business Partner | EVNICT Category | Auth Method | Pattern |
| :--- | :--- | :--- | :--- |
| **Payment Gateway (Bank)** | Third-party (Bank) | OAuth2 Client Credentials | Sync REST + Webhook |
| **E-invoice Service** | Digital Infrastructure | API Key | Async (RabbitMQ event) |
| **Logistics Partner** | External Partner | OAuth2 Client Credentials | Async REST + Webhook |
| **Keycloak (IdP)** | Internal / Identity | OIDC | — |
| **Kong (Gateway)** | Internal / Edge | JWT validation | — |

---

# Business Step → API Endpoint Mapping

| # | Business Step | Method | Endpoint | Partner | Pattern | Auth |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | Customer tạo đơn | POST | `/api/v1/orders` | — | Sync | JWT (Keycloak) |
| **2** | Khởi tạo thanh toán | POST | `/partner/v1/checkout` | Bank Gateway | Sync | Client Credentials |
| **3** | Bank callback thanh toán | POST | `/api/v1/payments/webhook` | ← Bank | Webhook | Idempotency-Key |
| **4** | Thông báo kho hàng | event | `order.paid` (RabbitMQ) | Warehouse | Async | Internal |
| **5** | Tạo hóa đơn điện tử | event | `order.paid` → E-invoice | E-invoice | Async | Internal |
| **6** | Đặt vận chuyển | POST | `/mock/shipments` | Logistics | Async REST | Client Credentials |
| **7** | Logistics callback | POST | `/api/v1/payments/webhook` | ← Logistics | Webhook | Idempotency-Key |
| **8** | Tra cứu đơn hàng | GET | `/api/v1/orders/{id}` | — | Sync | JWT |
| **9** | Tra cứu vận chuyển | GET | `/mock/shipments/{id}` | — | Sync | JWT |
| **10** | Huỷ đơn hàng | PATCH | `/api/v1/orders/{id}/cancel` | — | Sync | JWT |

---

# Pattern Decisions

| Pattern | Bước áp dụng | Lý do |
| :--- | :--- | :--- |
| **Synchronous REST** | Order → Payment | Cần confirm ngay trước khi tiếp tục |
| **Webhook (Push)** | Payment/Logistics → Order | Partner chủ động push khi xong |
| **Async Message (RabbitMQ)** | Order → Warehouse/E-invoice | Decouple, không cần real-time |
