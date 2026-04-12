import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function listModels() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("No API key");
    return;
  }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  console.log("Fetching models...");
  
  // Actually, GoogleGenerativeAI doesn't have a listModels method directly on the instance in 0.24.1?
  // Let's just do a direct REST fetch.
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
  const data = await response.json();
  
  if (data.models) {
    console.log("Embedding Models Available:");
    data.models.filter((m: any) => m.name.includes("embed")).forEach((m: any) => {
      console.log(`- ${m.name}`);
    });
  } else {
    console.log(data);
  }
}

listModels();
