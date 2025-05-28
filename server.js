// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const bodyParser = require('body-parser');
// const mongoose = require('mongoose');
// const Query = require('./models/query');
// const { analyzeCryptoProject } = require('./modules/geminicrypto');
// const { extractPercentage } = require('./modules/geminicrypto');

// const app = express();
// const PORT = 5001;

// // Middleware
// app.use(cors());
// app.use(bodyParser.json());

// mongoose.connect(process.env.MONGO_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
// }).then(() => console.log('MongoDB Connected'))
//   .catch(err => console.error('MongoDB connection error:', err));

// // getting the user query and sending it to the database
// app.post('/api/setUserQuery', async (req, res) => {
//     console.log("successfully connected");
//     const output = await analyzeCryptoProject(req.body.text);
//     console.log(output.finalAnalysis);
//     res.json({message: output.finalAnalysis, probability: extractPercentage(output.finalAnalysis)});
//     // Save query
//     try {
//         const newQuery = new Query({
//             nameOfCryptoCoin: req.query.text,
//             analysisOfCoin: output.finalAnalysis,
//             scamLikelihood: extractPercentage(output.finalAnalysis),
//             typeOfQuery: 'user_input',
//         });
        
//         const savedQuery = await newQuery.save();
//         res.json({ 
//             message: 'Query saved',
//             data: savedQuery 
//         });
//     } catch (error) {
//         res.status(500).json({ 
//             message: 'Error saving query',
//             error: error.message 
//         });
//     }
// });

// // Start Server
// app.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`);
// });


require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Query = require('./models/query');
const { analyzeCryptoProject, extractPercentage } = require('./modules/geminicrypto');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware: configure CORS to accept requests from your frontend deployed on Vercel
app.use(cors({
    origin: ['https://frontend-of-scam-guard-ainew.vercel.app', 'http://localhost:3000'], // add your frontend URLs here
    methods: ['GET', 'POST', 'OPTIONS'],
}));

app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB connection error:', err));

// API endpoint
app.post('/api/setUserQuery', async (req, res) => {
    try {
        const userText = req.body.text;
        console.log('Received text:', userText);

        const output = await analyzeCryptoProject(userText);
        const finalAnalysis = output.finalAnalysis;
        const probability = extractPercentage(finalAnalysis);

        // Save query to DB
        const newQuery = new Query({
            nameOfCryptoCoin: userText,
            analysisOfCoin: finalAnalysis,
            scamLikelihood: probability,
            typeOfQuery: 'user_input',
        });
        const savedQuery = await newQuery.save();

        // Send single JSON response after DB save
        res.json({
            message: finalAnalysis,
            probability: probability,
            status: 'success',
            savedQuery: savedQuery,
        });
    } catch (error) {
        console.error('Error processing query:', error);
        res.status(500).json({
            message: 'Error processing query',
            error: error.message,
            status: 'error',
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
