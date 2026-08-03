const express = require('express');
const app = express();
app.use(express.json());
app.post('/api/v1/orders', (req, res) => res.status(201).json({ status: 'PENDING', message: 'SAT Course Order Created' }));
app.listen(3000, () => console.log('SAT Order Payment Service running on port 3000'));
