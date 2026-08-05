# 🎓 SAT Learning - Partner Integration Architecture & API Lab

Dự án xây dựng hệ thống Microservices tích hợp thanh toán khóa học SAT trực tuyến, đáp ứng đầy đủ các yêu cầu kiến trúc từ Cơ bản đến **Nâng cao (Advanced)**.

---

## 1. BUSINESS DOMAIN & INTEGRATION WORKFLOW

* **Domain**: EdTech Platform (Luyện thi SAT Trực tuyến).
* **Workflow**: 
  1. Học viên chọn và đăng ký khóa học SAT.
  2. `Order Service` tạo đơn hàng ở trạng thái `PENDING`.
  3. Chuyển hướng học viên sang `Partner Payment Mock Service`.
  4. Partner xử lý và trả kết quả về qua **Webhook**.
  5. `Payment Service` nhận kết quả và phát sự kiện `payment_completed` vào **RabbitMQ**.
  6. `Order Service` lắng nghe RabbitMQ và cập nhật trạng thái đơn sang `PAID` để kích hoạt khóa học.

---

## 2. TECHNICAL STACK & ADVANCED IMPLEMENTATION

### 🏛️ Gateway & Identity Provider
* **Kong API Gateway**: Quản lý, điều hướng và cân bằng tải tập trung cho các API endpoints (Port `8000` / `8001`).
* **Keycloak (OAuth2/OIDC)**: Đóng vai trò Identity Provider (Port `8080`), tích hợp JWT Authentication plugin trên Kong để bảo vệ tài nguyên API.

### ⚙️ Microservices & Message Broker
* **Services**: Express.js (`sat-order-payment-service`, `sat-partner-mock-service`).
* **Message Broker (RabbitMQ)**: Xử lý truyền tin bất đồng bộ (Asynchronous Event-Driven Messaging) giữa các dịch vụ qua AMQP protocol (Port `5672` / `15672`).

### ☸️ Deployment Infrastructure
* **Docker Compose**: Hỗ trợ chạy local toàn bộ môi trường development chỉ với 1 lệnh.
* **Kubernetes (K8s) Manifests**: Đóng gói sẵn trọn bộ file triển khai sản xuất trong thư mục `k8s/manifests/` (Deployments, Services, ConfigMaps, Ingress cho Kong, Keycloak, RabbitMQ và các Services).

### 📊 Observability Solution
* **Prometheus + Grafana**: Thu thập metrics (`/metrics`) từ Microservices & Kong Gateway, trực quan hóa sức khỏe hệ thống qua Dashboard (`k8s/observability/prometheus-grafana-k8s.yaml`).
* **EFK Stack (FluentBit / Elasticsearch / Kibana)**: Cấu hình gom log tập trung từ các container/pod để phục vụ tracing & debugging.

---

## 3. HƯỚNG DẪN KHỞI ĐỘNG (RUN & DEPLOY)

### Triển khai trên Kubernetes (K8s Cluster)
```bash
# 1. Apply toàn bộ hạ tầng & Microservices
kubectl apply -f k8s/manifests/

# 2. Apply hạ tầng Giám sát Observability
kubectl apply -f k8s/observability/
