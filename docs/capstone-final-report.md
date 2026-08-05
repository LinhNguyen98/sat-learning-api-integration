# 🏆 Capstone API Integration Project — Final Master Report

**Đề tài**: SAT Learning Course Enrollment & Payment API Integration System  
**Học viên / Tác giả**: DevOps & API Integration Engineering  
**Tech Stack**: Node.js (Express) • RabbitMQ • Kong API Gateway • Keycloak IdP • Kubernetes • Prometheus & Grafana  

---

## 📋 MỤC LỤC & TỔNG QUAN YÊU CẦU

Tài liệu này tổng hợp toàn bộ kết quả thực hiện cho cả **7 Yêu cầu (Standard 1-3 & Advanced 4-7)** của bài thực hành cuối khóa.

```
┌─────────────────────────────────────────────────────────────┐
│                    STANDARD REQUIREMENTS                    │
├──────────────────────┬──────────────────────┬───────────────┤
│ 1. Business Domain   │ 2. Workflow & API    │ 3. Tech Stack │
│ SAT Course Checkout  │ Sync & Async Flows   │ Node.js, Mocks│
  └──────────────────────┴──────────────────────┴───────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    ADVANCED REQUIREMENTS                    │
├──────────────────────┬──────────────────────┬───────────────┤
│ 4. Gateway & IdP     │ 5. Kubernetes Cluster│ 6. Broker DLQ │
│ Kong + Keycloak JWT  │ Manifests k8s/*.yaml │ RabbitMQ Async│
├──────────────────────┴──────────────────────┴───────────────┤
│ 7. Full Observability Solution                              │
│ Metrics Monitoring (Prometheus + Grafana)                   │
└─────────────────────────────────────────────────────────────┘
```

---

## PART 1: STANDARD REQUIREMENTS (1 - 3)

### 1. Business Domain (Yêu cầu 1)
Hệ thống **SAT Learning Platform** đóng vai trò là sàn luyện thi trực tuyến, đóng vai trò trung tâm kết nối giữa Người học (Student), Cổng thanh toán (Payment Partner) và hệ thống lớp học thông qua kiến trúc hướng sự kiện (Event-driven Architecture).

### 2. Main Workflow & API Integration Patterns (Yêu cầu 2)
Quy trình nghiệp vụ xử lý đơn hàng trải qua 5 bước tích hợp tiêu chuẩn:
1. **Khởi tạo đơn hàng**: Học viên gửi thông tin đăng ký khóa học qua API Gateway.
2. **Khởi tạo thanh toán đối tác**: Order Service đăng ký phiên thanh toán với Partner Gateway và nhận về URL giao dịch.
3. **Đăng nhập và Thanh toán**: Học viên thanh toán trên giao diện đối tác.
4. **Callback Webhook**: Đối tác gửi thông báo trạng thái thanh toán có chữ ký số xác thực về lại hệ thống.
5. **Cập nhật trạng thái**: Hệ thống gửi event qua Message Broker để xử lý cấp quyền khóa học một cách bất đồng bộ.

### 3. Tech Stack & Mock Services (Yêu cầu 3)
- **Order Service**: Viết trên nền tảng Node.js / Express.js chịu trách nhiệm quản lý đơn hàng.
- **Partner Mock Service**: Giả lập API thanh toán ngân hàng, có cơ chế tự động ký chữ ký HMAC-SHA256 gửi về Webhook.

---

## PART 2: ADVANCED REQUIREMENTS (4 - 7)

### 4. Gateway & Identity Provider (Yêu cầu 4)
- **Kong Gateway**: Chặn mọi traffic bên ngoài, thực hiện định tuyến và bật plugin `jwt` để xác thực token.
- **Keycloak IdP**: Phát hành token JWT thông qua luồng Client Credentials và Password Grant cho người dùng hệ thống.

### 5. Kubernetes Deployment (Yêu cầu 5)
Hệ thống manifests Kubernetes đầy đủ được thiết kế để phân tách các service vào namespace riêng biệt, kết nối qua mạng nội bộ Service Mesh và mount ConfigMap thành công.

### 6. Message Broker & DLQ Topology (Yêu cầu 6)
RabbitMQ được thiết kế với cơ chế xử lý ngoại lệ (Fault tolerance):
- Các message bị lỗi DB hoặc timeout sẽ được nack và lưu số lần retry (`x-death`).
- Khi vượt quá 3 lần, message tự động định tuyến sang Dead Letter Exchange (DLX) và lưu lại ở Dead Letter Queue (DLQ).

### 7. Observability Solution (Yêu cầu 7)
Hạ tầng thu thập số liệu thông qua Prometheus định kỳ scrape endpoint `/metrics` của dịch vụ và hiển thị trực quan thông tin hiệu năng trên các biểu đồ Grafana Dashboard.
