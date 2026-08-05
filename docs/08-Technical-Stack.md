# 08. Technical Stack

Here is the tech-stack breakdown for implementing the SAT Learning course payment microservices:

## 1. Programming Languages & Runtime
- **Node.js (v18+) & Express.js**:
  - Light-weight, high performance, and rapid scaffolding.
  - Large ecosystem of libraries for cryptography (`crypto`), network requests (`axios`), and message broker integration (`amqplib`).

## 2. Infrastructure Components
- **Kong API Gateway (v3.4)**:
  - High-performance API Gateway built on top of NGINX.
  - Deployed in DB-less mode using declarative configurations (`kong.yml`) for stateless, reproducible deployments.
- **Keycloak Identity Provider (v22.0)**:
  - Complete identity provider supporting OAuth2 / OpenID Connect.
  - Secures endpoints via JWT validation tokens.
- **RabbitMQ (v3-management)**:
  - Standard AMQP broker ensuring high message delivery reliability.
  - Equipped with the management plugin dashboard for monitoring queues, connections, and message rates.

## 3. Observability
- **Prometheus (v2.45)**:
  - TSDB metrics scraper. Hooks directly to Express's `/metrics` paths and Kong metrics.
- **Grafana (v10.0)**:
  - Visual dashboard system tracking performance metrics, request failures, and broker queues.

## 4. Developer / Test Toolkit
- **Python (v3.10+)**:
  - Leverages standard libraries (`requests`, `hashlib`, `unittest`) to run fully automated end-to-end integration tests.
- **Docker Compose**:
  - Runs local orchestration to simulate all components in a single dev command.
