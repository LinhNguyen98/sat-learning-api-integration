const express = require('express');
const amqp = require('amqplib');

const app = express();
app.use(express.json());
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672';

app.post('/api/v1/payments/webhook', async (req, res) => {
  const { transaction_id, order_id, status, amount } = req.body;
  if (status === 'SUCCESS') {
    try {
      const conn = await amqp.connect(RABBITMQ_URL);
      const ch = await conn.createChannel();
      await ch.assertQueue('payment_completed');
      ch.sendToQueue('payment_completed', Buffer.from(JSON.stringify({ transaction_id, order_id, amount })));
      return res.json({ code: '00', message: 'Webhook received' });
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }
  res.status(400).json({ error: 'Invalid status' });
});
app.listen(3001, () => console.log('Payment Service running on port 3001'));
