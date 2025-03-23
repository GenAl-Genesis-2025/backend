require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Query = require('./models/query');
const { analyzeCryptoProject } = require('./modules/geminicrypto');
const { extractPercentage } = require('./modules/geminicrypto');

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
app.post('/api/setUserQuery', async (req, res) => {
    console.log("successfully connected");
    const output = await analyzeCryptoProject(req.body.text);
    console.log(output.finalAnalysis);
    res.json({message: output.finalAnalysis, probability: extractPercentage(output.finalAnalysis)});
    // Save query
    try {
        const newQuery = new Query({
            nameOfCryptoCoin: req.query.text,
            analysisOfCoin: output.finalAnalysis,
            scamLikelihood: extractPercentage(output.finalAnalysis),
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
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});