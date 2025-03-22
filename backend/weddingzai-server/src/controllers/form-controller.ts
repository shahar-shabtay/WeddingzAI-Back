import { Request, Response } from "express";
import { promises as fs } from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GOOGLE_API_KEY as string;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const generateTodoList = async (preferences: any) => {
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
    

  try {
    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();

    // Strip Markdown code blocks if present
    if (text.startsWith("```json")) text = text.replace(/^```json/, "").trim();
    if (text.endsWith("```")) text = text.replace(/```$/, "").trim();

    try {
      return JSON.parse(text);
    } catch {
      console.warn("Could not parse Gemini response as JSON. Returning raw text.");
      return text;
    }
  } catch (error) {
    console.error("Error generating to-do list:", error);
    return "Failed to generate a to-do list.";
  }
};

const uploadFormJson = async (req: Request, res: Response): Promise<Response> => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const data = await fs.readFile(req.file.path, "utf8");
    const jsonData = JSON.parse(data);
    const todoList = await generateTodoList(jsonData);

    return res.status(200).json({
      message: "Form preferences uploaded successfully",
      fileName: req.file.originalname,
      todoList,
    });
  } catch (error) {
    console.error("Error processing uploaded file:", error);
    return res.status(400).json({ error: "Invalid JSON format or read failure." });
  } finally {
    await fs.unlink(req.file.path).catch(() => {});
  }
};

export default { uploadFormJson };
