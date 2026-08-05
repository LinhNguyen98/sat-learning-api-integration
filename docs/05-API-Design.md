# 05. API Design

## Endpoints Summary

### 1. Create SAT Course Order
Creates a pending course purchase transaction, returns the payment URL.
- **HTTP Method**: `POST`
- **Path**: `/api/v1/orders`
- **Security**: Requires OAuth2 Bearer Token (JWT).
- **Request Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <JWT_TOKEN>`
- **Request Body**:
```json
{
  "student_id": "STU-9988",
  "course_code": "SAT-MATH-PRO",
  "amount": 1500000
}
```
- **Response Headers**:
  - `Content-Type: application/json`
- **Response Body (`201 Created`)**:
```json
{
  "order_id": "ORD-SAT-12345",
  "status": "PENDING",
  "payment_url": "http://localhost:8000/partner/v1/checkout?order_id=ORD-SAT-12345",
  "created_at": "2026-08-05T08:00:00.000Z"
}
```

---

### 2. Retrieve Order Details
Allows querying order status.
- **HTTP Method**: `GET`
- **Path**: `/api/v1/orders/:order_id`
- **Security**: Requires OAuth2 Bearer Token (JWT).
- **Response Body (`200 OK`)**:
```json
{
  "order_id": "ORD-SAT-12345",
  "student_id": "STU-9988",
  "course_code": "SAT-MATH-PRO",
  "amount": 1500000,
  "status": "PAID",
  "transaction_id": "TXN-776655",
  "created_at": "2026-08-05T08:00:00.000Z",
  "updated_at": "2026-08-05T08:05:00.000Z"
}
```

---

### 3. Partner Mock Checkout Page
Standard endpoint to submit payment transaction to the partner.
- **HTTP Method**: `POST`
- **Path**: `/partner/v1/checkout`
- **Security**: Public route.
- **Request Body**:
```json
{
  "order_id": "ORD-SAT-12345",
  "amount": 1500000,
  "callback_url": "http://sat-order-payment-service:3000/api/v1/payments/webhook"
}
```
- **Response Body (`201 Created`)**:
```json
{
  "transaction_id": "TXN-776655",
  "status": "SUCCESS",
  "checkout_url": "http://localhost:3002/pay?txn_id=TXN-776655"
}
```

---

### 4. Payment webhook callback
Target URL for payment update.
- **HTTP Method**: `POST`
- **Path**: `/api/v1/payments/webhook`
- **Security**: Validated via Webhook signature header (`X-Webhook-Signature`).
- **Request Headers**:
  - `X-Webhook-Signature: <HMAC_SHA256_HASH>`
- **Request Body**:
```json
{
  "order_id": "ORD-SAT-12345",
  "transaction_id": "TXN-776655",
  "status": "SUCCESS",
  "amount": 1500000
}
```
- **Response Body (`200 OK`)**:
```json
{
  "message": "Webhook processed successfully",
  "order_id": "ORD-SAT-12345"
}
```

## Standard Error Response Format
All errors follow the RFC 7807 problem details pattern:
```json
{
  "type": "https://api.satlearning.edu.vn/errors/unauthorized",
  "title": "Unauthorized Request",
  "status": 401,
  "detail": "Bearer token is invalid or expired.",
  "instance": "/api/v1/orders"
}
```
