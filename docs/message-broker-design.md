# Message Broker Design

## RabbitMQ Routing Layout
- **Exchange**: `payment.exchange` (topic)
- **Main Queue**: `payment.completed.queue` (bind: `payment.completed`)
- **Dead Letter Exchange (DLX)**: `payment.dlx` (direct)
- **Dead Letter Queue (DLQ)**: `payment.completed.dlq` (bind: `payment.failed`)

## Reliability
- **Acknowledgments**: Manual `channel.ack(msg)` is called only after successful DB update.
- **DLQ Redirection**: Messages exceeding 3 retry cycles are routed to the DLQ to ensure non-blocking queue behavior.
