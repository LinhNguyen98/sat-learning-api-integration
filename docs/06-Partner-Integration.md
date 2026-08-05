# 06. Partner Integration

## Integration Pattern
The integration between the SAT Learning Platform and the Payment Partner follows the **Redirect & Asynchronous Callback** pattern:
1. **Redirect**: The platform initiates checkout and returns a payment redirection link to the browser client.
2. **Callback**: Once the transaction is finalized, the partner calls a designated callback Webhook asynchronously.

## Webhook Signature Verification
To prevent spoofing or replay attacks, the webhook request payload is signed using **HMAC-SHA256** with a shared secret key.

### Signing Algorithm
1. The partner constructs the message body payload as a JSON string.
2. A hash is calculated using the payload and a shared API secret:
   $$\text{Signature} = \text{HMAC-SHA256}(\text{SharedSecret}, \text{PayloadBody})$$
3. The signature value is transmitted in the custom request header:
   `X-Webhook-Signature: <hex_signature>`
4. The SAT Order & Payment Service recalculates the hash on receipt and rejects requests with mismatched signatures (`401 Unauthorized`).

```javascript
// Verification implementation outline:
const crypto = require('crypto');
const secret = 'super-secret-key-123';

function verifySignature(req) {
  const incomingSignature = req.headers['x-webhook-signature'];
  const payload = JSON.stringify(req.body);
  const calculatedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return incomingSignature === calculatedSignature;
}
```

## Idempotency Policy
Webhook endpoints can be invoked multiple times due to gateway retries. 
- The Order Service maintains a transaction status lookup list.
- If a webhook reports a transaction that is already processed (verified via `transaction_id`), the service immediately replies `200 OK` and avoids publishing redundant duplicate messages to the RabbitMQ broker.
