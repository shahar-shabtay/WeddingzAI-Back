import { Request, Response } from "express";
import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GOOGLE_API_KEY as string;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });


const generateTodoList = async (preferences: any) => {
    const prompt = `
    You are an expert wedding planner. Based on the couple's wedding preferences, generate a detailed wedding to-do list.
    The JSON contains key details such as:
    - Number of guests
    - Entertainment choice (DJ or Band)
    - Type of wedding (Traditional, Modern, etc.)
    - Venue type (Outdoor or Indoor)
    - Budget
    - Catering style
    - Color scheme
    - Photography style
    - Transportation
    - Honeymoon destination

    Here are the preferences:
    ${JSON.stringify(preferences, null, 2)}

    Now, create a **detailed wedding to-do list** tailored to these preferences. The list should be practical, covering all the essential tasks in preparation for the wedding.
    Return the to-do list as a JSON object.
    `;

    try {
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Error generating to-do list:", error);
        return "Failed to generate a to-do list.";
    }
};


const uploadJsonFile = async (req: Request, res: Response) => {
    if (!req.file) {
        console.log("No file uploaded");
        res.status(400).json({ error: "No file uploaded" });
        return;
    }

    fs.readFile(req.file.path, "utf8", async (err, data) => {
        if (err) {
            res.status(500).json({ error: "Error reading file" });
            return;
        }

        try {
            const jsonData = JSON.parse(data);
            const todoList = await generateTodoList(jsonData.preferences);
            console.log("Generated to-do list:", todoList);
            if (req.file) {
                res.json({ 
                    message: "Valid JSON file uploaded", 
                    fileName: req.file.originalname, 
                    todoList 
                });
            }
        } catch (error) {
            res.status(400).json({ error: "Invalid JSON format" });
            return;
        }

        // Cleanup: Remove the uploaded file
        if (req.file) {
            fs.unlink(req.file.path, () => { });
        }
    });
};

export default { uploadJsonFile };