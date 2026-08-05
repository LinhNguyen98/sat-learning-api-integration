# HỆ THỐNG THANH TOÁN KHÓA HỌC SAT TRỰC TUYẾN

Tài liệu mô tả chi tiết thiết kế, nghiệp vụ và hạ tầng kỹ thuật của hệ thống thanh toán khóa học SAT trực tuyến. Hệ thống được triển khai theo kiến trúc Microservices, quản lý API qua Kong API Gateway, xác thực người dùng bằng Keycloak (Identity Provider), truyền tin bất đồng bộ qua Message Broker (RabbitMQ), triển khai trên Kubernetes và giám sát bằng Prometheus, Grafana, EFK Stack.

---

## 1. MỤC TIÊU & NGHIỆP VỤ HỆ THỐNG (BUSINESS DOMAIN & WORKFLOW)

### 1.1 Mục tiêu bài Lab
- Xây dựng hệ thống Microservices xử lý nghiệp vụ đăng ký và thanh toán khóa học luyện thi SAT.
- Tích hợp bảo mật và quản lý API tập trung qua **Kong API Gateway** kết hợp **Keycloak (OAuth2/OIDC)**.
- Xử lý giao tiếp bất đồng bộ, đáng tin cậy giữa các microservices qua **Message Broker (RabbitMQ)**.
- Tích hợp thanh toán với **Partner Payment Gateway Mock** qua cơ chế Webhook/Callback.
- Đóng gói triển khai hạ tầng linh hoạt với **Docker Compose** và **Kubernetes (K8s) Cluster**.
- Thiết lập giải pháp giám sát & quản lý log tập trung (**Prometheus + Grafana** & **EFK Stack**).

### 1.2 Luồng nghiệp vụ (Business Flow)
1. **Học viên**: Chọn khóa học SAT và gửi yêu cầu đăng ký thanh toán.
2. **Kong Gateway & Keycloak**: Xác thực Token JWT của học viên qua Keycloak trước khi cho phép request đi vào hệ thống.
3. **Sat Order & Payment Service**:
   - Khởi tạo đơn hàng mới với trạng thái `PENDING`.
   - Chuyển hướng học viên đến cổng thanh toán đối tác (`sat-partner-mock-service`).
4. **Sat Partner Mock Service**:
   - Xử lý giả lập giao dịch thanh toán phía đối tác (Ngân hàng / Ví điện tử).
   - Gửi phản hồi kết quả giao dịch (`SUCCESS` / `FAILED`) về lại qua đường **Webhook**.
5. **Sat Order & Payment Service**:
   - Tiếp nhận dữ liệu Webhook và phát sự kiện `payment_completed` vào **RabbitMQ**.
   - Consumer lắng nghe sự kiện từ RabbitMQ, cập nhật trạng thái đơn hàng sang `PAID` và tự động kích hoạt quyền truy cập khóa học SAT cho học viên.

---

## 2. KIẾN TRÚC VÀ CÁC THÀNH PHẦN HỆ THỐNG (ARCHITECTURE)

### 2.1 Sơ đồ kiến trúc tổng quan

```text
[ Client / Web SAT Platform ]
             │
             ▼
[ Kong API Gateway (Port 8000) ]
             │
 ┌───────────┼────────────────────────┐
 │ (JWT)     │                        │
 ▼           ▼                        ▼
[ Keycloak ] [ sat-order-payment-service ] [ sat-partner-mock-service ]
(Port 8080)   (Port 3000)                   (Port 3002)
                 │                               │
                 └───────────► [ RabbitMQ ] ◄────┘
                                (Port 5672)
                                     │
    ┌────────────────────────────────┴────────────────────────────────┐
    ▼                                                                 ▼
[ Prometheus (9090) + Grafana (3001) ]            [ EFK Stack (FluentBit / ES / Kibana) ]
     (Metrics Monitoring)                                  (Centralized Logging)
```

### 2.2 Danh sách Dịch vụ & Hạ tầng kỹ thuật

| Thành phần | Port | Vai trò & Chức năng |
| :--- | :--- | :--- |
| **Kong API Gateway** | `8000` / `8001` | Điều hướng request, cân bằng tải, quản lý tập trung và tích hợp Auth Plugin. |
| **Keycloak** | `8080` | Identity Provider quản lý người dùng, cấp phát JWT Token theo chuẩn OAuth2/OIDC. |
| **sat-order-payment-service** | `3000` | Quản lý đơn hàng khóa học SAT, tiếp nhận Webhook và Publisher/Consumer RabbitMQ. |
| **sat-partner-mock-service** | `3002` | Giả lập cổng thanh toán đối tác, phát sinh giao dịch và gửi Webhook. |
| **RabbitMQ** | `5672` / `15672` | Message Broker xử lý sự kiện truyền tin bất đồng bộ. |
| **Prometheus & Grafana** | `9090` / `3001` | Thu thập metrics hệ thống, theo dõi lượng request và trực quan hóa Dashboard. |
| **EFK Stack** | `5601` (Kibana) | Thu thập, lưu trữ và phân tích log tập trung từ các dịch vụ. |

---

## 3. CHI TIẾT API SPECIFICATION

### 3.1 Tạo đơn hàng khóa học SAT
- **Endpoint**: `POST /api/v1/orders`
- **Headers**: 
  - `Content-Type: application/json`
  - `Authorization: Bearer <JWT_TOKEN_FROM_KEYCLOAK>`
- **Request Body**:
```json
{
  "student_id": "STU12345",
  "course_code": "SAT-MATH-PRO",
  "amount": 1500000
}
```
- **Response (201 Created)**:
```json
{
  "order_id": "ORD-SAT-9981",
  "status": "PENDING",
  "payment_url": "http://localhost:3002/partner/v1/checkout?order_id=ORD-SAT-9981",
  "created_at": "2026-08-04T08:00:00Z"
}
```

### 3.2 Webhook Nhận Kết Quả Thanh Toán Từ Đối Tác
- **Endpoint**: `POST /api/v1/payments/webhook`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "order_id": "ORD-SAT-9981",
  "transaction_id": "TXN-887766",
  "status": "SUCCESS",
  "signature": "a1b2c3d4e5f6"
}
```
- **Response (200 OK)**:
```json
{
  "message": "Payment processed successfully",
  "order_id": "ORD-SAT-9981",
  "status": "PAID"
}
```

---

## 4. HƯỚNG DẪN TRIỂN KHAI VÀ THIẾT LẬP (DEPLOYMENT)

### 4.1 Triển khai trên Kubernetes (K8s Cluster)
- Triển khai hạ tầng Core Microservices & Gateway:
  `kubectl apply -f k8s/manifests/`
- Triển khai các thành phần Giám sát Observability (Prometheus, Grafana, EFK):
  `kubectl apply -f k8s/observability/`

### 4.2 Triển khai Nhanh bằng Docker Compose (Local Dev)
- Khởi động môi trường local:
  `docker-compose up -d --build`

### 4.3 Kịch bản kiểm thử API tự động bằng curl

- Bước 1: Khởi tạo đơn hàng mua khóa học SAT
  `curl -X POST http://localhost:8000/api/v1/orders -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_KEYCLOAK_JWT_TOKEN" -d '{"student_id":"STU101","course_code":"SAT-VERBAL","amount":2000000}'`

- Bước 2: Giả lập Webhook gọi từ cổng thanh toán đối tác
  `curl -X POST http://localhost:8000/api/v1/payments/webhook -H "Content-Type: application/json" -d '{"order_id":"ORD-SAT-9981","transaction_id":"TXN-1122","status":"SUCCESS"}'`

---

## 5. CẤU TRÚC THƯ MỤC DỰ ÁN (PROJECT STRUCTURE)

```text
sat-learning-api-integration/
├── sat-order-payment-service/       # Microservice Quản lý đơn hàng SAT & Event Publisher
│   ├── src/
│   └── package.json
├── sat-partner-mock-service/       # Microservice Giả lập cổng thanh toán đối tác
│   ├── src/
│   └── package.json
├── k8s/                             # Manifests triển khai Kubernetes
│   ├── manifests/                  # K8s Manifests (Kong, Keycloak, RabbitMQ, Services)
│   └── observability/              # K8s Manifests (Prometheus, Grafana, EFK Stack)
├── kong.yml                        # Cấu hình Declarative Kong Gateway & Keycloak JWT
├── docker-compose.yml              # Cấu hình khởi động Docker Compose
├── BAO_CAO_THIET_KE_HE_THONG_API.md  # Báo cáo thiết kế API
├── DOCUMENTATION.md                 # Tài liệu kỹ thuật chung
├── HE_THONG_THANH_TOAN_KHOA_HOC_SAT.md # Tài liệu chi tiết nghiệp vụ & hạ tầng
├── README.md                       # Tài liệu tổng quan dự án
├── push_to_github.bat               # Script tự động đẩy code lên GitHub (Windows Batch)
└── push_to_github.ps1               # Script tự động đẩy code lên GitHub (PowerShell)
```
