require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Query = require('./models/query');

const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// getting the user query and sending it to the database
app.get('/api/setUserQuery', async (req, res) => {
    try {
        const newQuery = new Query({
            nameOfCryptoCoin: req.query.text,
            typeOfQuery: 'user_input',
        });
        
        const savedQuery = await newQuery.save();
        res.json({ 
            message: 'Query saved',
            data: savedQuery 
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error saving query',
            error: error.message 
        });
    }
    console.log(req.query.text);
});

app.post('/api/data', (req, res) => {
    const { name } = req.body;
    res.json({ message: `Hello, ${name}!` });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Database User Username: Cluster63098
// Database User Password: dXNrU2N0WE5X