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

Chi tiết sơ đồ kiến trúc hệ thống và hướng dẫn xem tài liệu được quy hoạch trong thư mục [docs/](file:///d:/Download/sat-learning-api-integration/docs):

- [Tài liệu Thiết kế Kiến trúc](file:///d:/Download/sat-learning-api-integration/docs/03-System-Architecture.md)
- [Đặc tả Thiết kế Cơ sở dữ liệu](file:///d:/Download/sat-learning-api-integration/docs/04-Database-Design.md)
- [Đặc tả các Endpoint API REST](file:///d:/Download/sat-learning-api-integration/docs/05-API-Design.md)

---

## 3. CẤU TRÚC THƯ MỤC DỰ ÁN SAU QUY HOẠCH

```
sat-learning-api-integration/
├── docs/                             # Danh sách tài liệu kỹ thuật
├── infra/                            # Cấu hình cài đặt Keycloak & Kong Gateway
├── k8s/                              # File manifests triển khai Kubernetes (00-namespace -> 06-observability)
├── monitoring/                       # Giám sát Prometheus & Grafana
├── src/                              # Mã nguồn dịch vụ (Order Service & Partner Mock)
├── docker-compose.yml                # Docker compose khởi động
└── test_api.py                       # Python script kiểm thử tự động
```
