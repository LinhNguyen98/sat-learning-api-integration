# API Documentation - SAT Learning Integration

## 1. Order Service (`POST /api/v1/orders`)
- **Request**: `{"user_id": "usr_1001", "course_id": "sat_math_2026", "amount": 2500000}`
- **Response**: `{"order_id": "ord_889911", "status": "PENDING", "payment_url": "http://partner-mock:3002/checkout/tx_7788"}`

## 2. Partner Mock Service (`POST /partner/v1/checkout`)
- **Request**: `{"order_id": "ord_889911", "amount": 2500000, "callback_url": "http://payment-service:3001/api/v1/payments/webhook"}`
- **Response**: `{"transaction_id": "tx_7788", "checkout_url": "..."}`

## 3. Payment Service (`POST /api/v1/payments/webhook`)
- **Request**: `{"transaction_id": "tx_7788", "order_id": "ord_889911", "status": "SUCCESS", "amount": 2500000}`
- **Response**: `{"code": "00", "message": "Webhook processed successfully"}`
