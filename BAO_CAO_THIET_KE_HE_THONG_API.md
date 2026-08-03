# BÁO CÁO THIẾT KẾ HỆ THỐNG API - SAT LEARNING PLATFORM

## 1. Tổng quan Nghiệp vụ
Hệ thống xử lý đăng ký và thanh toán khóa học luyện thi SAT tích hợp với Đối tác Cổng thanh toán (Partner Mock Service).

## 2. Kiến trúc Microservices & Tích hợp
- **Order/Payment Service**: Quản lý đơn hàng khóa học & nhận Webhook.
- **Partner Mock Service**: Giả lập Cổng thanh toán đối tác.
- **Message Broker**: RabbitMQ xử lý luồng sự kiện bất đồng bộ.
- **Observability**: Prometheus & Grafana theo dõi metrics.
