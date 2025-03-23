require("dotenv").config();
const axios = require("axios");
const { MongoClient } = require("mongodb");

// Load environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const MONGO_URI = process.env.MONGO_URI;

// Gemini API configuration
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// Generate follow-up questions using Gemini REST API
async function generateFollowUpQuestions(userQuery) {
    const prompt = `Max 400 characters. You are an AI expert in finance and cryptocurrency scams. Your task is to analyze crypto projects and determine if they are likely scams. Given the user query: "${userQuery}", generate a list of follow-up questions to gather more information about the project and its creators. Follow-up questions:`;
    
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
    const prompt = `You are an AI expert in finance and cryptocurrency scams. Your task is to analyze crypto projects and determine if they are likely scams. Given the user query: "${userQuery}" and the following information: ${JSON.stringify(followUpAnswers)}, provide a brief, but correct, analysis of whether the crypto project is likely a scam or not. Include some evidence and reasoning. Also include as a percent from 0%-100% how likely the crypto project is to be a scam.`;

    const response = await axios.post(GEMINI_URL, {
        contents: [{
            parts: [{ text: prompt }]
        }]
    });

    return response.data.candidates[0].content.parts[0].text.trim();
}

// Extract the percentage likelihood from the analysis text
function extractPercentage(analysis) {
    // Use regex to find a percentage (e.g., "50%", "75%")
    const percentageMatch = analysis.match(/\b(\d{1,3})%\b/);
    if (percentageMatch) {
        return parseInt(percentageMatch[1], 10); // Convert to integer
    }
    return null; // Return null if no percentage is found
}

// Remove the percentage from the analysis text
function removePercentage(analysis) {
    // Use regex to remove the percentage (e.g., "50%", "75%")
    return analysis.replace(/\b(\d{1,3})%\b/, "").trim();
}

// Analyze crypto project
async function analyzeCryptoProject(userQuery) {
    console.log("Creating follow up questions...");
    const followUpQuestions = await generateFollowUpQuestions(userQuery);
    console.log("Searching the web...");
    const followUpAnswers = await searchTavilyForAnswers(followUpQuestions);
    console.log("Doing final analysis...");
    const finalAnalysis = await generateFinalAnalysis(userQuery, followUpAnswers);

    // Extract the percentage likelihood
    const scamLikelihood = extractPercentage(finalAnalysis);

    // Remove the percentage from the analysis text
    const analysisWithoutPercentage = removePercentage(finalAnalysis);

    return {
        userQuery,
        followUpQuestions,
        followUpAnswers,
        finalAnalysis: analysisWithoutPercentage, // Analysis without the percentage
        scamLikelihood // Percentage likelihood as a separate field
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
}

// Run the script
module.exports = analyzeCryptoProject;
main().catch(console.error);
