# HỆ THỐNG THANH TOÁN KHÓA HỌC SAT TRỰC TUYẾN

Tài liệu mô tả chi tiết thiết kế và tích hợp hệ thống thanh toán khóa học SAT trực tuyến qua kiến trúc Microservices, API Gateway (Kong) và Message Broker (RabbitMQ).

---

## 1. MỤC TIÊU & NGHIỆP VỤ HỆ THỐNG

### 1.1 Mục tiêu bài Lab
- Xây dựng mô hình microservices xử lý nghiệp vụ đăng ký và thanh toán khóa học luyện thi SAT.
- Tích hợp thành công với Partner Payment Gateway Mock qua cơ chế Webhook/Callback.
- Sử dụng Message Broker (RabbitMQ) để xử lý truyền tin bất đồng bộ giữa các service.
- Quản lý API tập trung qua Kong API Gateway và triển khai hạ tầng container hóa với Docker Compose / Kubernetes.

### 1.2 Luồng nghiệp vụ (Business Flow)
1. Học viên: Chọn khóa học SAT và gửi yêu cầu khởi tạo đơn thanh toán.
2. Order & Payment Service:
   - Tạo đơn hàng mới ở trạng thái PENDING.
   - Gọi API sang Partner Payment Mock Service để tạo giao dịch thanh toán phía đối tác.
3. Partner Payment Mock Service:
   - Tiếp nhận thông tin, giả lập quá trình xử lý giao dịch phía cổng thanh toán.
   - Gửi Webhook phản hồi kết quả thanh toán (SUCCESS / FAILED) về lại Order & Payment Service.
4. Order & Payment Service:
   - Tiếp nhận Webhook, bắn sự kiện payment_completed vào RabbitMQ.
   - Cập nhật trạng thái đơn hàng sang PAID và kích hoạt quyền truy cập khóa học cho học viên.

---

## 2. KIẾN TRÚC VÀ CÁC THÀNH PHẦN (ARCHITECTURE)

### 2.1 Sơ đồ kiến trúc hệ thống

[ Client / Web SAT Platform ]
             │
             ▼
    [ Kong API Gateway ]
   (Port: 8000 / 8001)
             │
   ┌─────────┴────────────────────────┐
   ▼                                  ▼
[ sat-order-payment-service ]   [ sat-partner-mock-service ]
   (Port: 3000)                    (Port: 3002)
   │                                  │
   └───────────► [ RabbitMQ ] ◄───────┘
                 (Port: 5672)

### 2.2 Danh sách Microservices & Hạ tầng

| Thành phần | Port | Chức năng chính |
| :--- | :--- | :--- |
| sat-order-payment-service | 3000 | Quản lý đơn hàng khóa học SAT, tiếp nhận Webhook thanh toán và phát event lên RabbitMQ. |
| sat-partner-mock-service | 3002 | Giả lập cổng thanh toán đối tác (Ngân hàng / Ví điện tử). |
| RabbitMQ | 5672 / 15672 | Message Broker xử lý luồng sự kiện thanh toán bất đồng bộ. |
| Kong API Gateway | 8000 / 8001 | Gateway điều hướng, cân bằng tải và quản lý tập trung các API endpoints. |
| Prometheus & Grafana | 9090 / 3001 | Hệ thống thu thập metrics và giám sát (Observability). |

---

## 3. CHI TIẾT API SPECIFICATION

### 3.1 Tạo đơn hàng khóa học SAT
- Endpoint: POST /api/v1/orders
- Headers: Content-Type: application/json
- Request Body:
{
  "student_id": "STU12345",
  "course_code": "SAT-MATH-PRO",
  "amount": 1500000
}
- Response (201 Created):
{
  "order_id": "ORD-SAT-9981",
  "status": "PENDING",
  "payment_url": "http://localhost:3002/partner/v1/checkout?order_id=ORD-SAT-9981",
  "created_at": "2026-08-03T16:00:00Z"
}

### 3.2 Webhook Nhận Kết Quả Thanh Toán Từ Đối Tác
- Endpoint: POST /api/v1/payments/webhook
- Headers: Content-Type: application/json
- Request Body:
{
  "order_id": "ORD-SAT-9981",
  "transaction_id": "TXN-887766",
  "status": "SUCCESS",
  "signature": "a1b2c3d4e5f6"
}
- Response (200 OK):
{
  "message": "Payment processed successfully",
  "order_id": "ORD-SAT-9981",
  "status": "PAID"
}

---

## 4. HƯỚNG DẪN CHẠY VÀ KỊCH BẢN TEST (TESTING)

### 4.1 Khởi động hệ thống bằng Docker Compose
docker-compose up -d --build

### 4.2 Kịch bản kiểm thử tự động với curl

Bước 1: Khởi tạo đơn hàng mua khóa học SAT
curl -X POST http://localhost:8000/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{"student_id":"STU101","course_code":"SAT-VERBAL","amount":2000000}'

Bước 2: Giả lập Webhook gọi từ cổng thanh toán đối tác
curl -X POST http://localhost:8000/api/v1/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{"order_id":"ORD-SAT-9981","transaction_id":"TXN-1122","status":"SUCCESS"}'

---

## 5. CẤU TRÚC THƯ MỤC DỰ ÁN

sat-learning-api-integration/
├── sat-order-payment-service/       # Microservice Quản lý đơn hàng SAT
│   ├── src/
│   └── package.json
├── sat-partner-mock-service/       # Microservice Giả lập đối tác thanh toán
│   ├── src/
│   └── package.json
├── k8s/                             # Manifests triển khai Kubernetes
│   ├── manifests/
│   └── observability/
├── BAO_CAO_THIET_KE_HE_THONG_API.md  # Báo cáo tổng quan thiết kế API
├── DOCUMENTATION.md                 # Tài liệu kỹ thuật chung
├── HE_THONG_THANH_TOAN_KHOA_HOC_SAT.md # Tài liệu chi tiết nghiệp vụ
├── docker-compose.yml               # Cấu hình khởi động Docker
├── prometheus.yml                   # Cấu hình giám sát Prometheus
├── test_api.py                      # Script Python test tự động
├── push_to_github.bat               # Script tự động đẩy code (Batch)
└── push_to_github.ps1               # Script tự động đẩy code (PowerShell)