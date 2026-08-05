# 13. Observability & Monitoring

The system monitors runtime health and metrics using Prometheus metrics scrapes.

## 1. Metrics Configuration
Each service exposes a Prometheus-compatible endpoint at `/metrics`:
- **HTTP Metrics**: Track incoming request count (`http_requests_total`) and duration (`http_request_duration_seconds`).
- **Payment Metrics**: Track order count by status (`sat_order_status_count{status="PENDING|PAID|FAILED"}`).
- **RabbitMQ Queue Metrics**: Track pending and failed events.

## 2. Scraping Configuration (`prometheus.yml`)
Prometheus collects statistics by pulling `/metrics` data at intervals:
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'sat-order-service'
    static_configs:
      - targets: ['sat-order-payment-service:3000']
  - job_name: 'sat-partner-mock'
    static_configs:
      - targets: ['sat-partner-mock-service:3002']
  - job_name: 'kong-gateway'
    static_configs:
      - targets: ['kong-gateway:8001']
```

## 3. Grafana Dashboards
Visual representations configured in Grafana:
- **Throughput Gauge**: Showing total registration requests per minute.
- **Payment Success Ratio**: A pie chart comparing `PAID` vs. `FAILED` statuses.
- **RabbitMQ Message Rate**: Line graph representing publish vs. deliver rates.
