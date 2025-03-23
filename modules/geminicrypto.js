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
    const prompt = `You are an AI expert in finance and cryptocurrency scams. Your task is to analyze crypto projects and determine if they are likely scams. Given the user query: "${userQuery}" and the following information: ${JSON.stringify(followUpAnswers)}, provide a clear, concise, and human-friendly analysis of whether the crypto project is likely a scam or not. Follow these guidelines:
1. Start with a brief summary of your findings.
2. Provide evidence and reasoning to support your conclusion.
3. Use simple, non-technical language that is easy for clients to understand.
4. End with a percentage (0%-100%) indicating how likely the project is to be a scam.
5. Offer actionable advice or next steps for the client.

Write the analysis as if you are explaining it to a non-expert client.`;

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
    const percentageMatch = analysis.match(/(\d+)(?:\s*)%/);
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
module.exports = {analyzeCryptoProject, extractPercentage};
main().catch(console.error);
