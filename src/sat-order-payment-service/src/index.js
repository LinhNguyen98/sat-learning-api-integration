const express = require('express');
const amqp = require('amqplib');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
app.use(express.json());

const PORT = 3000;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const PARTNER_URL = process.env.PARTNER_URL || 'http://localhost:3002';
const WEBHOOK_SECRET = 'super-secret-key-123';

// In-memory Database
const orders = {};
const transactions = {};

// Metrics Counters
let totalHttpRequests = 0;
let totalOrderCreations = 0;
let totalWebhookCalls = 0;

// Middleware to count requests
app.use((req, res, next) => {
  totalHttpRequests++;
  next();
});

// RabbitMQ variables
let channel = null;
const EXCHANGE = 'payment.exchange';
const ROUTING_KEY = 'payment.completed';
const QUEUE = 'payment.completed.queue';

const DLX = 'payment.dlx';
const DLQ = 'payment.completed.dlq';
const DLQ_ROUTING_KEY = 'payment.failed';

// Connect and Setup RabbitMQ
async function initRabbitMQ() {
  try {
    const conn = await amqp.connect(RABBITMQ_URL);
    channel = await conn.createChannel();

    // Setup DLX & DLQ
    await channel.assertExchange(DLX, 'direct', { durable: true });
    await channel.assertQueue(DLQ, { durable: true });
    await channel.bindQueue(DLQ, DLX, DLQ_ROUTING_KEY);

    // Setup Main Exchange & Queue with DLX configuration
    await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
    await channel.assertQueue(QUEUE, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': DLX,
        'x-dead-letter-routing-key': DLQ_ROUTING_KEY
      }
    });
    await channel.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);

    console.log('RabbitMQ exchanges, queues, and DLQ successfully set up.');

    // Start Consumer
    startQueueConsumer();
  } catch (error) {
    console.error('Failed to initialize RabbitMQ, retrying in 5 seconds...', error.message);
    setTimeout(initRabbitMQ, 5000);
  }
}

// AMQP Consumer
function startQueueConsumer() {
  channel.consume(QUEUE, async (msg) => {
    if (!msg) return;

    try {
      const content = JSON.parse(msg.content.toString());
      console.log(`[AMQP Consumer] Received event:`, content);

      const { order_id, transaction_id, status } = content;

      // Idempotency check: check if order is already PAID
      const order = orders[order_id];
      if (!order) {
        console.warn(`[AMQP Consumer] Order ${order_id} not found.`);
        channel.ack(msg);
        return;
      }

      if (order.status === 'PAID') {
        console.log(`[AMQP Consumer] Order ${order_id} is already PAID. Skipping.`);
        channel.ack(msg);
        return;
      }

      // Simulate transient error retry (just as an example, but we succeed immediately here)
      // Update order status
      if (status === 'SUCCESS') {
        order.status = 'PAID';
        order.transaction_id = transaction_id;
        order.updated_at = new Date().toISOString();
        console.log(`[AMQP Consumer] Order ${order_id} successfully marked as PAID.`);
      } else {
        order.status = 'FAILED';
        order.transaction_id = transaction_id;
        order.updated_at = new Date().toISOString();
        console.log(`[AMQP Consumer] Order ${order_id} marked as FAILED.`);
      }

      channel.ack(msg);
    } catch (err) {
      console.error('[AMQP Consumer] Error processing message:', err.message);
      // Determine retry count
      const deathHeader = msg.properties.headers && msg.properties.headers['x-death'];
      const retryCount = deathHeader ? deathHeader[0].count : 0;

      if (retryCount >= 3) {
        console.error(`[AMQP Consumer] Max retries exceeded. Routing to DLQ.`);
        channel.reject(msg, false); // Sends to DLX/DLQ
      } else {
        console.log(`[AMQP Consumer] Re-queuing message for retry. Count: ${retryCount + 1}`);
        channel.nack(msg, false, true); // Re-queue
      }
    }
  });
}

// 1. Prometheus Metrics Endpoint
app.get('/metrics', (req, res) => {
  const pendingOrders = Object.values(orders).filter(o => o.status === 'PENDING').length;
  const paidOrders = Object.values(orders).filter(o => o.status === 'PAID').length;
  const failedOrders = Object.values(orders).filter(o => o.status === 'FAILED').length;

  res.set('Content-Type', 'text/plain');
  res.send(`# HELP http_requests_total Total HTTP Requests
http_requests_total ${totalHttpRequests}
# HELP sat_order_status_count Count of orders by status
sat_order_status_count{status="PENDING"} ${pendingOrders}
sat_order_status_count{status="PAID"} ${paidOrders}
sat_order_status_count{status="FAILED"} ${failedOrders}
# HELP order_creations_total Total orders created
order_creations_total ${totalOrderCreations}
# HELP webhook_calls_total Total webhook calls received
webhook_calls_total ${totalWebhookCalls}
`);
});

// 2. Create Order API
app.post('/api/v1/orders', async (req, res) => {
  const { student_id, course_code, amount } = req.body;

  if (!student_id || !course_code || !amount) {
    return res.status(400).json({
      type: 'https://api.satlearning.edu.vn/errors/bad-request',
      title: 'Bad Request',
      status: 400,
      detail: 'Missing required fields: student_id, course_code, or amount',
      instance: req.originalUrl
    });
  }

  totalOrderCreations++;
  const orderId = `ORD-SAT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  const order = {
    order_id: orderId,
    student_id,
    course_code,
    amount,
    status: 'PENDING',
    transaction_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  orders[orderId] = order;

  // Call Partner Checkout API to obtain redirection URL
  try {
    const partnerResponse = await axios.post(`${PARTNER_URL}/partner/v1/checkout`, {
      order_id: orderId,
      amount: amount,
      callback_url: `http://sat-order-payment-service:3000/api/v1/payments/webhook`
    });

    const { checkout_url } = partnerResponse.data;

    res.status(201).json({
      order_id: orderId,
      status: 'PENDING',
      payment_url: checkout_url,
      created_at: order.created_at
    });
  } catch (err) {
    console.error('Error connecting to Partner Checkout Service:', err.message);
    // Even if partner fails, order is pending, return order but report partner integration error
    res.status(201).json({
      order_id: orderId,
      status: 'PENDING',
      payment_url: `http://localhost:3002/pay?order_id=${orderId}`, // fallback
      created_at: order.created_at,
      warning: 'Partner gateway offline, returned direct checkout fallback.'
    });
  }
});

// 3. Get Order Details API
app.get('/api/v1/orders/:order_id', (req, res) => {
  const { order_id } = req.params;
  const order = orders[order_id];

  if (!order) {
    return res.status(404).json({
      type: 'https://api.satlearning.edu.vn/errors/not-found',
      title: 'Order Not Found',
      status: 404,
      detail: `Order with ID ${order_id} could not be found.`,
      instance: req.originalUrl
    });
  }

  res.json(order);
});

// 4. Webhook Callback API
app.post('/api/v1/payments/webhook', (req, res) => {
  totalWebhookCalls++;
  const signature = req.headers['x-webhook-signature'];

  if (!signature) {
    console.warn('Rejecting webhook call: Missing X-Webhook-Signature');
    return res.status(401).json({
      type: 'https://api.satlearning.edu.vn/errors/unauthorized',
      title: 'Unauthorized Webhook',
      status: 401,
      detail: 'Missing signature verification header.'
    });
  }

  // Calculate HMAC SHA256 signature
  const rawPayload = JSON.stringify(req.body);
  const calculatedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(rawPayload)
    .digest('hex');

  if (signature !== calculatedSignature) {
    console.warn(`Rejecting webhook call: Signature mismatch. Received: ${signature}`);
    return res.status(401).json({
      type: 'https://api.satlearning.edu.vn/errors/unauthorized',
      title: 'Unauthorized Webhook',
      status: 401,
      detail: 'Signature verification failed.'
    });
  }

  const { order_id, transaction_id, status, amount } = req.body;

  if (!order_id || !transaction_id || !status) {
    return res.status(400).json({ error: 'Missing mandatory fields in body' });
  }

  // Idempotency check: if transaction already processed
  if (transactions[transaction_id]) {
    console.log(`Webhook transaction ${transaction_id} already logged. Replying 200 OK.`);
    return res.json({ message: 'Webhook already processed', order_id });
  }

  // Save Transaction Log
  transactions[transaction_id] = {
    transaction_id,
    order_id,
    amount,
    status,
    signature,
    received_at: new Date().toISOString()
  };

  // Publish to RabbitMQ
  if (channel) {
    const eventMsg = JSON.stringify({ order_id, transaction_id, status, amount });
    channel.publish(EXCHANGE, ROUTING_KEY, Buffer.from(eventMsg), { persistent: true });
    console.log(`Published payment event for order ${order_id} to RabbitMQ`);
  } else {
    console.error('RabbitMQ channel not available! Processing synchronously as fallback.');
    const order = orders[order_id];
    if (order) {
      order.status = status === 'SUCCESS' ? 'PAID' : 'FAILED';
      order.transaction_id = transaction_id;
      order.updated_at = new Date().toISOString();
    }
  }

  res.json({ message: 'Payment webhook received & processing queued', order_id });
});

// Start Server & Connect Broker
app.listen(PORT, () => {
  console.log(`SAT Order Payment Service listening on port ${PORT}`);
  initRabbitMQ();
});
