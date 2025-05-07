import { promises as fs } from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import tdlModel, { ITDL } from "../models/tdl-model";

dotenv.config();
const apiKey = process.env.GOOGLE_API_KEY as string;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

/**
 * Calls Gemini to generate the todo-list JSON.
 */
export async function generateTodoList(preferences: any): Promise<any> {
  const currentDate = new Date().toISOString().split("T")[0];
  const prompt = `
You are an expert wedding planner. Based on the couple's wedding preferences, generate a detailed wedding to-do list.
    Here are the preferences:
    ${JSON.stringify(preferences, null, 2)}

    Important Notes:
    - The current date is **${currentDate}**.
    - The **wedding date** is provided in the preferences.
    - If the wedding is **far in the future (e.g., 1 year from now)**, spread out tasks over months to allow for gradual planning.
    - If the wedding is **soon (e.g., in a few weeks)**, prioritize urgent tasks and streamline the planning process.
    - The **estimated budget** should impact vendor recommendations, venue options, and overall planning decisions.
    - Tasks must have realistic **due dates** based on the time remaining until the wedding.
    - Phases should reflect the urgency of the tasks and consider the wedding's timeframe.

    Return only the to-do list as a JSON object, using this exact format:

    {
    "weddingTodoListName": string,
    "bride": string,
    "groom": string,
    "weddingDate": string,
    "estimatedBudget": string,
    "sections": [
        {
        "sectionName": string,
        "todos": [
            {
            "task": string,
            "dueDate": string,
            "priority": string
            }
        ]
        }
    ]
    }

    Additional Guidelines:
    - Calculate **task due dates** based on the time remaining until the wedding.
    - For **urgent weddings (less than 2 months away)**, compress planning phases and focus on essential tasks.
    - For **long-term weddings (6+ months away)**, spread tasks evenly across months.
    - Ensure a logical progression from early planning to wedding day execution.
    - Do NOT include any explanations or Markdown code blocks. Respond with raw JSON only.
    `;

  const result = await model.generateContent(prompt);
  let text = result.response.text().trim();
  if (text.startsWith("```json")) text = text.replace(/^```json/, "").trim();
  if (text.endsWith("```"))      text = text.replace(/```$/, "").trim();
  return JSON.parse(text);
}


export async function createTdlFromFile(
  filePath: string,
  userId: string
): Promise<ITDL> {
  const raw = await fs.readFile(filePath, "utf8");
  const prefs = JSON.parse(raw);
  const tdlJson = await generateTodoList(prefs);
  const doc = await tdlModel.create({ userId, tdl: tdlJson });
  await fs.unlink(filePath).catch(() => {}); // cleanup
  return doc;
}