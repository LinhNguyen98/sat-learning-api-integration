# 10. Kong & Keycloak Integration

## 1. Authentication Concept
The integration relies on Kong API Gateway acting as a secure PEP (Policy Enforcement Point). 

- Internal services are isolated inside the Docker network.
- Public route `/api/v1/orders` requires verification.
- Kong's `jwt` plugin intercepts incoming requests, reads the `Authorization: Bearer <token>` header, and verifies its cryptographic signature against Keycloak's public key.
- Webhook routes are bypass routes that verify signatures using HMAC application logic.

## 2. Kong Routing Configuration
Our declarative `kong.yml` defines the routes and ties the JWT plugin to `sat-order-service`:

```yaml
_format_version: "3.0"
_transform: true

services:
  - name: sat-order-service
    url: http://sat-order-payment-service:3000
    routes:
      - name: order-create-route
        paths:
          - /api/v1/orders
        plugins:
          - name: jwt
            config:
              claims_to_verify:
                - exp
      - name: webhook-route
        paths:
          - /api/v1/payments/webhook
        # No JWT plugin applied here to allow Webhook calls from partner

  - name: sat-partner-mock-service
    url: http://sat-partner-mock-service:3002
    routes:
      - name: partner-routes
        paths:
          - /partner/v1/checkout
```

## 3. Keycloak Setup
We export the Keycloak realm metadata to `keycloak-realm.json`. It includes:
- Realm Name: `sat-learning`
- Client ID: `kong-gateway`
- User: `student1` with password `password123`
- JWT Public key info configured into Kong's Consumer credential catalog.
