#!pip install google-generativeai flask pymongo requests

import google.generativeai as genai
import requests
from pymongo import MongoClient
from datetime import datetime
from google.colab import userdata

#load gemini
GEMINI_API_KEY = userdata.get("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.0-flash')

TAVILY_API_KEY = userdata.get("TAVILY_TOKEN")

# Generate the follow-up questions based on the query with prompt engineering
def generate_follow_up_questions(user_query):
    prompt = f"""
    You are an AI expert in finance and cryptocurrency scams. Your task is to analyze crypto projects and determine if they are likely scams. Given the user query: \"{user_query}\", generate a single follow-up question to gather more information about the project and its creators.
    Follow-up questions:
    """
    # I AM CHANGING THIS TO ONLY ONE QUESTION FOR TESTING PURPOSES ("generate a list of follow-up questions")
    response = model.generate_content(prompt)
    follow_up_questions = response.text.strip()
    return follow_up_questions

  # Use Tavily API to search for answers to the questions (this uses too many tokens)
def search_tavily_for_answers(follow_up_questions):
    answers = {}
    for question in follow_up_questions.split("\n"):  # Split questions by newline
        if question.strip():  # Skip empty lines
            url = "https://api.tavily.com/search"
            payload = {
                "api_key": TAVILY_API_KEY,
                "query": question.strip(),
                "max_results": 1,  # Limit to top 5 results
                "search_depth": "basic"  # Use advanced search for deeper results
            }
            response = requests.post(url, json=payload)
            answers[question.strip()] = response.json()
    return answers
  

def analyze_crypto_project(user_query):
    # Step 1: Generate follow-up questions using Gemini
    follow_up_questions = generate_follow_up_questions(user_query)

    # Step 2: Search for answers to follow-up questions using Tavily
    follow_up_answers = search_tavily_for_answers(follow_up_questions)

    # Step 3: Generate final analysis using Gemini
    final_analysis = generate_final_analysis(user_query, follow_up_answers)

    # Step 4: Return results
    return {
        "user_query": user_query,
        "follow_up_questions": follow_up_questions,
        "follow_up_answers": follow_up_answers,
        "final_analysis": final_analysis
    }


from pymongo import MongoClient
from datetime import datetime
from getpass import getpass
import certifi

MONGO_PASS = getpass("Enter your MongoDB password: ")

MONGO_URI = f"mongodb+srv://laurentcousineau:{MONGO_PASS}@cluster0.cindm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())

try:
    client.admin.command("ping")
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print("Ping failed:", e)

db = client["crypto_analysis"]
collection = db["user_queries"]

def store_analysis_in_db(result):
    result["timestamp"] = datetime.now()
    try:
        collection.insert_one(result)
        print("Data inserted:", result)
    except Exception as err:
        print("Insertion error:", err)

# Test insertion
# test_data = {"test": "hello world"}
# store_analysis_in_db(test_data)

user_query = "Is Trump Coin a scam?" #THIS NEEDS TO BE THE USER QUERY FROM THE DATABASE
result = analyze_crypto_project(user_query)

store_analysis_in_db(result)
