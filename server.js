const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Example Routes
app.get('/api/hello', (req, res) => {
    res.json({ message: 'Hello, World!' });
});

app.post('/api/data', (req, res) => {
    const { name } = req.body;
    res.json({ message: `Hello, ${name}!` });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
