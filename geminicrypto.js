require("dotenv").config();
const axios = require("axios");
const { MongoClient } = require("mongodb");

// Load environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const MONGO_URI = process.env.MONGO_URI;

// Gemini API configuration
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

// Generate follow-up questions using Gemini REST API
async function generateFollowUpQuestions(userQuery) {
    const prompt = `You are an AI expert in finance and cryptocurrency scams. Your task is to analyze crypto projects and determine if they are likely scams. Given the user query: "${userQuery}", generate a list of follow-up questions to gather more information about the project and its creators. Follow-up questions:`;
    
    const response = await axios.post(GEMINI_URL, {
        contents: [{
            parts: [{ text: prompt }]
        }]
    });

    return response.data.candidates[0].content.parts[0].text.trim();
}

// Search Tavily for answers
async function searchTavilyForAnswers(followUpQuestions) {
    const answers = {};
    const questions = followUpQuestions.split("\n");

    for (const question of questions) {
        if (question.trim()) {
            const response = await axios.post("https://api.tavily.com/search", {
                api_key: TAVILY_API_KEY,
                query: question.trim(),
                max_results: 5,
                search_depth: "advanced"
            });
            answers[question.trim()] = response.data;
        }
    }

    return answers;
}

// Generate final analysis using Gemini REST API
async function generateFinalAnalysis(userQuery, followUpAnswers) {
    const prompt = `You are an AI expert in finance and cryptocurrency scams. Your task is to analyze crypto projects and determine if they are likely scams. Given the user query: "${userQuery}" and the following information: ${JSON.stringify(followUpAnswers)}, provide a detailed analysis of whether the crypto project is likely a scam or not. Include evidence and reasoning.`;

    const response = await axios.post(GEMINI_URL, {
        contents: [{
            parts: [{ text: prompt }]
        }]
    });

    return response.data.candidates[0].content.parts[0].text.trim();
}

// Analyze crypto project
async function analyzeCryptoProject(userQuery) {
    const followUpQuestions = await generateFollowUpQuestions(userQuery);
    const followUpAnswers = await searchTavilyForAnswers(followUpQuestions);
    const finalAnalysis = await generateFinalAnalysis(userQuery, followUpAnswers);

    return {
        userQuery,
        followUpQuestions,
        followUpAnswers,
        finalAnalysis
    };
}

// Store analysis in MongoDB
async function storeAnalysisInDb(result) {
    const client = new MongoClient(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        await client.connect();
        const db = client.db("crypto_analysis");
        const collection = db.collection("user_queries");

        result.timestamp = new Date();
        await collection.insertOne(result);
        console.log("Data inserted:", result);
    } catch (err) {
        console.error("Insertion error:", err);
    } finally {
        await client.close();
    }
}

// Main function
async function main() {
    const userQuery = "Is Trump Coin a scam?"; // Replace with user query from database
    const result = await analyzeCryptoProject(userQuery);
    await storeAnalysisInDb(result);
}

// Run the script
main().catch(console.error);
