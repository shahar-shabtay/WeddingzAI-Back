import { Request, Response } from "express";
import { promises as fs } from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GOOGLE_API_KEY as string;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const generateTodoList = async (preferences: any) => {
    const prompt = `
  You are an expert wedding planner. Based on the couple's wedding preferences, generate a detailed wedding to-do list.
  Here are the preferences:
  ${JSON.stringify(preferences, null, 2)}
  
  Now, create a detailed wedding to-do list tailored to these preferences. Return only the to-do list as a JSON object.
  `;
  
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
  
      // Try to parse the text as JSON
      try {
        const parsed = JSON.parse(text);
        return parsed;
      } catch (parseError) {
        console.warn("Could not parse Gemini response as JSON. Returning raw text.");
        return text; // fallback to plain text
      }
    } catch (error) {
      console.error("Error generating to-do list:", error);
      return "Failed to generate a to-do list.";
    }
  };

const uploadFormJson = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  try {
    const data = await fs.readFile(req.file.path, "utf8");
    const jsonData = JSON.parse(data);
    const todoList = await generateTodoList(jsonData);

    res.status(200).json({
      message: "Form preferences uploaded successfully",
      fileName: req.file.originalname,
      todoList,
    });
  } catch (error) {
    console.error("Error processing uploaded file:", error);
    res.status(400).json({ error: "Invalid JSON format or read failure." });
  } finally {
    // Cleanup uploaded file
    await fs.unlink(req.file.path).catch(() => {});
  }
};

export default { uploadFormJson };
