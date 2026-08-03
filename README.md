# SAT Learning - Partner Integration Architecture & API Lab

## 1. Business Domain & Integration Workflow
- **Domain**: EdTech Platform (Luyện thi SAT Trực tuyến).
- **Workflow**: User đăng ký khóa học -> Order Service tạo đơn `PENDING` -> Chuyển hướng sang Payment Partner Mock -> Partner trả về kết quả qua Webhook -> Payment Service gửi event vào RabbitMQ -> Order Service cập nhật trạng thái `PAID`.

## 2. Technical Stack
- **Gateway & Identity**: Kong API Gateway, Keycloak (OAuth2/OIDC)
- **Services**: Express.js (Order, Payment, Partner Mock Service)
- **Message Broker**: RabbitMQ
- **Deployment**: Docker Compose & Kubernetes Manifests
- **Observability**: Prometheus + Grafana, EFK Stack (FluentBit / Elasticsearch / Kibana)
