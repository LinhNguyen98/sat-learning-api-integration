# 09. Implementation Guide & Runbook

This guide describes how to run and test the complete system integration locally.

## Prerequisite Setup
Ensure you have the following installed on your developer machine:
- Docker and Docker Compose
- Python 3.x with the `requests` library (`pip install requests`)

---

## 1. Starting the Orchestration Stack
Launch the services (Order-Payment service, Partner mock service, RabbitMQ, Keycloak, Kong, Prometheus, and Grafana) by running:
```bash
docker compose up -d --build
```
Verify all containers are active:
```bash
docker compose ps
```

---

## 2. Dynamic Configurations & Realm Setup
Keycloak config imports automatically from `keycloak-realm.json` on startup. 
- **Admin Portal**: `http://localhost:8080` (Credentials: `admin`/`admin`)
- **Gateway Endpoint**: `http://localhost:8000` (All API requests go here)

---

## 3. Local Verification Run
Execute the python script to run a complete end-to-end checkout, callback, and queue transaction flow:
```bash
python test_api.py
```
This script will:
1. Verify calling `/api/v1/orders` without a header fails with `401 Unauthorized`.
2. Authenticate against Keycloak with credentials and request a Bearer Token.
3. Call `/api/v1/orders` with the token.
4. Verify the order's initial state is `PENDING`.
5. Trigger the Partner Checkout redirection simulation.
6. Verify the partner webhook signs the callback header correctly.
7. Call order service webhook with signature verification.
8. Query order state again to verify it has been updated to `PAID` via the RabbitMQ message queue handler.

---

## 4. Monitoring
- **RabbitMQ Dashboard**: `http://localhost:15672` (Credentials: `guest`/`guest`)
- **Prometheus Dashboard**: `http://localhost:9090`
- **Grafana Dashboard**: `http://localhost:3001`
- **Kong Admin API**: `http://localhost:8001`
