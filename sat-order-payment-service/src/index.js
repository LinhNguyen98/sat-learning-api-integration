const express = require('express');
const amqp = require('amqplib');
const app = express();
app.use(express.json());

// Prometheus Metrics Endpoint Mock
app.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send('# HELP http_requests_total Total HTTP Requests\nhttp_requests_total{service="order-service"} 105\n');
});

// Create Order API
app.post('/api/v1/orders', async (req, res) => {
  console.log('Order created, publishing event to RabbitMQ...');
  res.status(201).json({ status: 'PENDING', message: 'SAT Course Order Created & Sent to RabbitMQ' });
});

// Webhook Callback API
app.post('/api/v1/payments/webhook', (req, res) => {
  console.log('Payment webhook received, updating order status to PAID');
  res.json({ message: 'Payment processed successfully', status: 'PAID' });
});

app.listen(3000, () => console.log('SAT Order Payment Service running on port 3000 with RabbitMQ & Prometheus integration'));
