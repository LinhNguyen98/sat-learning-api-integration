# Observability Guide

## Prometheus Scrapes
Each node service exposes `/metrics`. Prometheus queries:
- `sat-order-payment-service:3000`
- `sat-partner-mock-service:3002`
- `kong-gateway:8001`

## Dashboards (Grafana)
Grafana monitors:
- HTTP traffic rate and response duration.
- Total payment order states (`PENDING`, `PAID`, `FAILED`).
