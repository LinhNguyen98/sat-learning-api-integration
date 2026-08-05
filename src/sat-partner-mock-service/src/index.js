const express = require('express');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
app.use(express.json());

const PORT = 3002;
const WEBHOOK_SECRET = 'super-secret-key-123';

const transactions = {};

// 1. Register transaction session
app.post('/partner/v1/checkout', (req, res) => {
  const { order_id, amount, callback_url } = req.body;

  if (!order_id || !amount) {
    return res.status(400).json({ error: 'Missing order_id or amount' });
  }

  const transaction_id = `TXN-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  transactions[transaction_id] = {
    transaction_id,
    order_id,
    amount,
    status: 'SUCCESS', // default simulated status
    callback_url: callback_url || 'http://sat-order-payment-service:3000/api/v1/payments/webhook'
  };

  console.log(`Registered transaction ${transaction_id} for order ${order_id}`);

  res.status(201).json({
    transaction_id,
    status: 'SUCCESS',
    checkout_url: `http://localhost:3002/pay?txn_id=${transaction_id}`
  });
});

// 2. Trigger webhook manually (for testing/automation)
app.post('/partner/v1/trigger-webhook', async (req, res) => {
  const { transaction_id } = req.body;
  const txn = transactions[transaction_id];

  if (!txn) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  const webhookPayload = {
    order_id: txn.order_id,
    transaction_id: txn.transaction_id,
    status: txn.status,
    amount: txn.amount
  };

  const rawPayload = JSON.stringify(webhookPayload);
  const signature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(rawPayload)
    .digest('hex');

  console.log(`Sending Webhook callback for ${txn.order_id} to ${txn.callback_url}`);

  try {
    const response = await axios.post(txn.callback_url, webhookPayload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature
      }
    });

    res.json({
      message: 'Webhook triggered and sent successfully',
      partner_response: response.data
    });
  } catch (err) {
    console.error('Failed to deliver webhook:', err.message);
    res.status(500).json({
      error: 'Failed to deliver webhook to callback service',
      details: err.message
    });
  }
});

// 3. Simple UI fallback page for manual payment trigger
app.get('/pay', async (req, res) => {
  const { txn_id } = req.query;
  const txn = transactions[txn_id];

  if (!txn) {
    return res.status(404).send('<h3>Transaction Not Found</h3>');
  }

  // Auto trigger callback and show success
  const webhookPayload = {
    order_id: txn.order_id,
    transaction_id: txn.transaction_id,
    status: txn.status,
    amount: txn.amount
  };

  const rawPayload = JSON.stringify(webhookPayload);
  const signature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(rawPayload)
    .digest('hex');

  try {
    await axios.post(txn.callback_url, webhookPayload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature
      }
    });
    res.send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding-top: 50px;">
          <h2 style="color: #4CAF50;">Payment Completed Successfully!</h2>
          <p>Order ID: <strong>${txn.order_id}</strong></p>
          <p>Transaction ID: <strong>${txn.transaction_id}</strong></p>
          <p>Webhook callback was triggered and signature verified.</p>
          <a href="http://localhost:8000/api/v1/orders/${txn.order_id}" target="_blank">View Order Status</a>
        </body>
      </html>
    `);
  } catch (err) {
    res.send(`<h3>Error triggering webhook callback: ${err.message}</h3>`);
  }
});

// 4. Prometheus metrics stub
app.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(`# HELP http_requests_total Total HTTP Requests
http_requests_total 10
`);
});

app.listen(PORT, () => console.log(`SAT Partner Mock Service listening on port ${PORT}`));
