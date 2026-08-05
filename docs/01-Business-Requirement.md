# 01. Business Requirement

## 1. Overview
The SAT Learning Platform provides high-quality online mock tests and study materials for students preparing for the SAT exam. In order to monetize the service, the platform must allow students to browse, choose, register, and pay for premium SAT courses securely and seamlessly.

## 2. Business Objectives
- **Increase Conversions**: Provide a frictionless, secure checkout flow integrated with domestic and international payment partners (credit card, e-wallet).
- **Automation**: Automate course enrollment upon successful payment confirmation, removing manual administrative intervention.
- **Reliability & Consistency**: Ensure that even if network failures occur between the payment partner and the platform, student transactions are not lost, and course access is granted reliably.

## 3. Functional Requirements
- **FR-1: Course Catalog & Selection**: Students can select a premium SAT course package (e.g., SAT-MATH-PRO, SAT-VERBAL-ADV).
- **FR-2: Order Initialization**: Create a course registration order with state `PENDING`.
- **FR-3: Secure Redirection**: Direct the user to the Payment Partner's hosted checkout page.
- **FR-4: Asynchronous Payment Notification**: Receive payment status updates from the payment gateway via webhooks.
- **FR-5: Course Activation**: Instantly upgrade the student's privileges and notify the student of course access once payment is confirmed (`PAID`).

## 4. Non-Functional Requirements
- **NFR-1: Security**: APIs exposing student data or initiating orders must require JWT token verification. Webhooks must be verified using HMAC-SHA256 signatures to prevent spoofing.
- **NFR-2: Reliability**: Use a Message Broker (RabbitMQ) for asynchronous payment processing. Handle transient network issues with retries and a Dead Letter Queue (DLQ).
- **NFR-3: Observability**: Track total orders, payment success rates, API latencies, and consumer queue sizes via Prometheus & Grafana.
