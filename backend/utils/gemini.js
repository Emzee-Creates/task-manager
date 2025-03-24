require("dotenv").config();
const axios = require("axios");

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent";
const API_KEY = process.env.GEMINI_API_KEY;

async function prioritizeTasks(tasks) {
    const prompt = `Prioritize these tasks based on urgency, importance, and deadlines. Return only a JSON object with a "prioritizedTasks" array, nothing else. Tasks: ${JSON.stringify(tasks)}`;
  
    try {
      const response = await axios.post(`${GEMINI_API_URL}?key=${API_KEY}`, {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
  
      let rawText = response.data.candidates[0].content.parts[0].text;
      rawText = rawText.replace(/```json|```/g, "").trim();
  
      const parsedResponse = JSON.parse(rawText);
  
      // Fix double-nesting issue
      return parsedResponse.prioritizedTasks || parsedResponse; 
    } catch (error) {
      console.error("❌ AI Prioritization Error:", error.response?.data || error.message);
      return tasks; // Return original tasks if AI fails
    }
  }
  
  
module.exports = { prioritizeTasks };
