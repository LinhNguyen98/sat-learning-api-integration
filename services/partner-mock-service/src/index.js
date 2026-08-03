const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

app.post('/partner/v1/checkout', (req, res) => {
  const { order_id, amount, callback_url } = req.body;
  const transaction_id = `tx_${Date.now()}`;
  res.json({
    transaction_id,
    checkout_url: `http://localhost:3002/checkout/${transaction_id}?order_id=${order_id}&amount=${amount}&callback=${encodeURIComponent(callback_url)}`
  });
});

app.post('/partner/v1/simulate-success', async (req, res) => {
  const { transaction_id, order_id, amount, callback_url } = req.body;
  try {
    await axios.post(callback_url, { transaction_id, order_id, amount, status: 'SUCCESS' });
    res.json({ message: 'Webhook triggered' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(3002, () => console.log('Partner Mock Service running on port 3002'));
