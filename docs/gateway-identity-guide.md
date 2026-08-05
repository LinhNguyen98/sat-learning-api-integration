# Gateway and Identity Integration Guide

## Keycloak Configurations
Keycloak acts as the OpenID Connect (OIDC) identity provider. 
- **Realm**: `sat-learning`
- **Keys**: Implements a static RSA public/private keypair so Kong Gateway can verify JWTs in DB-less mode.
- **Client**: `sat-platform`

## Kong Gateway Configurations
Kong runs in DB-less mode, utilizing the JWT plugin on the order creation routes:
- Endpoint `/api/v1/orders` checks for `Authorization: Bearer <JWT_Token>` and decrypts it using the Keycloak public key configured in consumers.
- Endpoint `/api/v1/payments/webhook` bypasses JWT verification, relying on HMAC-SHA256 signature headers.
