const express = require('express');
const axios = require('axios');
const amqp = require('amqplib');

const app = express();
app.use(express.json());

const PARTNER_MOCK_URL = process.env.PARTNER_MOCK_URL || 'http://partner-mock-service:3002';
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672';
const orders = {};

app.post('/api/v1/orders', async (req, res) => {
  const { user_id, course_id, amount } = req.body;
  const order_id = `ord_${Date.now()}`;
  orders[order_id] = { order_id, user_id, course_id, amount, status: 'PENDING' };

  try {
    const partnerRes = await axios.post(`${PARTNER_MOCK_URL}/partner/v1/checkout`, {
      order_id, amount, callback_url: 'http://payment-service:3001/api/v1/payments/webhook'
    });
    res.status(201).json({ order_id, status: 'PENDING', payment_url: partnerRes.data.checkout_url });
  } catch (err) {
    res.status(500).json({ error: 'Failed to contact partner', details: err.message });
  }
});

async function consumeEvents() {
  try {
    const conn = await amqp.connect(RABBITMQ_URL);
    const ch = await conn.createChannel();
    await ch.assertQueue('payment_completed');
    ch.consume('payment_completed', (msg) => {
      if (msg) {
        const payload = JSON.parse(msg.content.toString());
        if (orders[payload.order_id]) orders[payload.order_id].status = 'PAID';
        ch.ack(msg);
      }
    });
  } catch (err) { console.error(err.message); }
}
consumeEvents();
app.listen(3000, () => console.log('Order Service running on port 3000'));
