# 02. Business Workflow

This document models the primary transactional integration workflow between the Student, the SAT Learning platform, and the Payment Partner.

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student (Browser)
    participant Gateway as Kong API Gateway
    participant OrderService as SAT Order & Payment Service
    participant Partner as Partner Payment Mock
    participant Broker as RabbitMQ Broker

    Student->>Gateway: POST /api/v1/orders (with Keycloak JWT)
    Note over Student,Gateway: Authenticated Route
    Gateway->>OrderService: Route validated request
    OrderService->>OrderService: Create Order (status: PENDING)
    OrderService->>Partner: POST /partner/v1/checkout (Register transaction)
    Partner-->>OrderService: Return 201 Created (checkout_url, txn_id)
    OrderService-->>Gateway: Return 201 Created (checkout_url, order_id)
    Gateway-->>Student: Return checkout_url to redirect

    Note over Student,Partner: Student completes payment on Partner's Mock Page
    Student->>Partner: Click "Pay Now" on mock UI

    Partner->>OrderService: POST /api/v1/payments/webhook (Signature Header)
    Note over Partner,OrderService: Signature verified using HMAC-SHA256
    OrderService-->>Partner: 200 OK (Acknowledge received webhook)
    
    OrderService->>Broker: Publish message "payment_completed" to exchange "payment.exchange"
    
    Note over Broker,OrderService: Asynchronous Queue Consumer triggers
    Broker->>OrderService: Consume event "payment_completed"
    OrderService->>OrderService: Update Order status to PAID
    OrderService->>OrderService: Activate Student Course Access
```

## Step-by-Step Flow Explanation
1. **Initiate Order**: The student requests a checkout session by sending the course selection and student ID. This request passes through Kong Gateway and requires authentication via Keycloak-issued JWT.
2. **Register Payment Gateway**: The Order & Payment Service registers the transaction with the Partner Mock Service.
3. **Redirect Client**: The client receives a `checkout_url` directing them to the mock checkout portal.
4. **Mock Processing**: The student simulates payment completion.
5. **Asynchronous Webhook**: The payment gateway calls the backend webhook asynchronously. The webhook is validated for authenticity using a shared secret signature.
6. **Queue Event**: Upon validation, the payment webhook handler publishes a message to RabbitMQ and responds with HTTP 200 immediately.
7. **Process Course Activation**: A background worker consumes the event, updates the database, and unlocks the student's learning portal.
