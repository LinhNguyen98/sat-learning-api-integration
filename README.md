# SAT Learning - Partner Integration Architecture & API Lab

Dự án Capstone nghiên cứu thiết kế, tích hợp hệ thống đăng ký và thanh toán khóa học SAT trực tuyến qua API Gateway (Kong), Identity Provider (Keycloak), và Message Broker (RabbitMQ).

---

## 📁 Cấu trúc thư mục dự án

```
sat-learning-api-integration/
├── docs/                             # Tài liệu đặc tả chuẩn bài Lab
│   ├── 01-Business-Requirement.md    # Mục tiêu nghiệp vụ
│   ├── 02-Business-Workflow.md       # Sơ đồ quy trình (Sequence diagram)
│   ├── 03-System-Architecture.md     # Sơ đồ kiến trúc kết nối S2S
│   ├── 04-Database-Design.md         # Thiết kế dữ liệu & State Machine
│   ├── 05-API-Design.md              # Đặc tả tham số API REST
│   ├── 06-Partner-Integration.md     # Tích hợp cổng thanh toán & HMAC signature
│   ├── 07-openapi.yaml               # Đặc tả API chuẩn OpenAPI 3.0
│   ├── 08-Technical-Stack.md         # Chi tiết ngăn xếp công nghệ
│   ├── 09-Implementation-Guide.md    # Hướng dẫn cài đặt & Kiểm thử
│   ├── 10-Kong-Keycloak-Integration.md # Thiết kế cấu hình Gateway & IdP
│   ├── 11-Kubernetes-Deployment.md   # Hướng dẫn deploy cụm K8s
│   ├── 12-RabbitMQ-Integration.md    # Cấu hình hàng đợi RabbitMQ & DLQ
│   ├── 13-Observability.md           # Giám sát Prometheus & Grafana
│   ├── architecture-review.md        # Checklist 15 tiêu chí kiến trúc
│   └── integration-mapping.md        # Bảng phân loại EVNICT đối tác
├── infra/                            # Cấu hình cài đặt hạ tầng
│   ├── keycloak/                     # Realm export (Keycloak)
│   └── kong/                         # Cấu hình định tuyến Gateway (Kong)
├── k8s/                              # File manifests triển khai Kubernetes
│   ├── 00-namespace.yaml
│   ├── 01-configmap-secrets.yaml
│   ├── 02-rabbitmq.yaml
│   ├── 03-order-api.yaml
│   ├── 04-mocks.yaml
│   ├── 05-kong-ingress.yaml
│   └── 06-observability.yaml
├── monitoring/                       # Giám sát Prometheus & Grafana
│   └── prometheus.yml
├── src/                              # Mã nguồn dịch vụ microservices
│   ├── sat-order-payment-service/    # Service Quản lý đơn hàng SAT
│   └── sat-partner-mock-service/     # Service Giả lập cổng thanh toán đối tác
├── .env.example                      # File mẫu môi trường cấu hình
├── docker-compose.yml                # Docker compose khởi động
└── test_api.py                       # Python script kiểm thử tự động
```

---

## 🚀 Khởi chạy nhanh dự án

### 1. Khởi động toàn bộ Container Stack
```bash
docker compose up -d --build
```

### 2. Kiểm thử luồng tự động
```bash
python test_api.py
```
Script này tự động kiểm tra xác thực JWT, gọi API tạo đơn hàng qua Kong Gateway, trigger webhook thanh toán từ đối tác và verify cập nhật đơn hàng thành công qua RabbitMQ.
