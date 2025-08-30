import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AIMLAPI_KEY,
  baseURL: process.env.AI_BASE_URL || "https://api.aimlapi.com/v1",
});

export default openai;