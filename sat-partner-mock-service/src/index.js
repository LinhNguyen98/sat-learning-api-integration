const express = require('express');
const app = express();
app.use(express.json());
app.post('/partner/v1/checkout', (req, res) => res.json({ status: 'SUCCESS', checkout_url: 'http://localhost:3002/pay' }));
app.listen(3002, () => console.log('SAT Partner Mock Service running on port 3002'));
