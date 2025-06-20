import { promises as fs } from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import mongoose from "mongoose";
import tdlModel, { ITDL } from "../models/tdl-model";
import userModel from "../models/user-model";
import { endOfDay } from "date-fns"; // הוסף בתחילת הקובץ
import {syncCalendarWithTDL, createCalendarForUser} from "./calendar-service";

dotenv.config();
const apiKey = process.env.GOOGLE_API_KEY as string;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Utility: Determine section from due date
export function getSectionName(weddingDate: Date, taskDate: Date): string {
  const msInDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.floor((weddingDate.getTime() - taskDate.getTime()) / msInDay);

  if (diffDays >= 335) return "12 Months Before";
  if (diffDays >= 270) return "9–12 Months Before";
  if (diffDays >= 180) return "6–9 Months Before";
  if (diffDays >= 90)  return "3–6 Months Before";
  if (diffDays >= 30)  return "1–3 Months Before";
  if (diffDays >= 1)   return "1–4 Weeks Before";
  return "Wedding Day";
}

// Calls Gemini to generate the todo-list JSON.
export async function generateTodoList(preferences: any): Promise<any> {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  let effectiveWedding: Date;
  let outputWeddingDate: string | null = null;

  if (!preferences.weddingDate) {
    effectiveWedding = new Date(today);
    effectiveWedding.setMonth(effectiveWedding.getMonth() + 18);
    outputWeddingDate = null;
  } else {
    effectiveWedding = new Date(preferences.weddingDate);
    outputWeddingDate = effectiveWedding.toISOString().slice(0, 10);
  }

  preferences.weddingDate = effectiveWedding.toISOString().slice(0, 10);

  const prompt = `
You are an expert wedding planner. Based on the couple's wedding preferences, generate a detailed wedding to-do list.
Be sure to include vendor-focused tasks such as hair styling, photography, attire and shoes selection, guest favors, wedding rings, makeup and getting-ready coordination, bachelorette party planning, and any other key vendor bookings.
Make seperate Task for each vendor type.
Here are the preferences:
${JSON.stringify(preferences, null, 2)}

Important Notes:
- Today's date is **${todayStr}**.
- Use the wedding date **${preferences.weddingDate}** to schedule tasks, dont use it as the real date.
- The very first task in “12 Months Before” must be “Choose wedding date” if the user didn’t supply one.
- Focus especially on vendor research, selection, and booking.
- Organize into exactly these seven sections:
    1. 12 Months Before
    2. 9–12 Months Before
    3. 6–9 Months Before
    4. 3–6 Months Before
    5. 1–3 Months Before
    6. 1–4 Weeks Before
    7. Wedding Day

Return ONLY raw JSON in this exact shape:
{
  "weddingTodoListName": string,
  "firstPartner": string,
  "secondPartner": string,
  "weddingDate": string,
  "estimatedBudget": string,
  "sections": [
    {
      "sectionName": string,
      "todos": [
        { "task": string,
          "dueDate": "YYYY-MM-DD",
          "priority": "High"|"Medium"|"Low",
          "aiSent": false,
          done: false
        }
      ]
    }
  ]
}

Additional Guidelines:
- Spread tasks evenly across each bucket.
- For urgent weddings (<2mos), compress early buckets but still output all 7.
- Do NOT include Markdown or explanatory text—raw JSON only.
`;

  const result = await model.generateContent(prompt);
  let text = result.response.text().trim();
  if (text.startsWith("```json")) text = text.replace(/^```json/, "").trim();
  if (text.endsWith("```")) text = text.replace(/```$/, "").trim();
  const tdl = JSON.parse(text);

  tdl.weddingDate = outputWeddingDate;

  if (outputWeddingDate === "Not defined") {
    const first = tdl.sections.find((s: any) => s.sectionName === "12 Months Before");
    if (first) {
      first.todos.unshift({
        task: "Choose wedding date",
        dueDate: todayStr,
        priority: "High",
        aiSent: false,
        done: false
      });
    }
  }

  return tdl;
}

export async function createTdlFromFile(filePath: string, userId: string): Promise<ITDL> {
  const raw = await fs.readFile(filePath, "utf8");
  const prefs = JSON.parse(raw);
  const tdlJson = await generateTodoList(prefs);

  const structuredTdl = {
    weddingTodoListName: tdlJson.weddingTodoListName,
    firstPartner: tdlJson.firstPartner,
    secondPartner: tdlJson.secondPartner,
    weddingDate: tdlJson.weddingDate,
    estimatedBudget: tdlJson.estimatedBudget,
    sections: (tdlJson.sections || []).map((section: any) => ({
      sectionName: section.sectionName,
      todos: (section.todos || []).map((todo: any) => ({
        task: todo.task,
        dueDate: todo.dueDate,
        priority: todo.priority,
        aiSent: todo.aiSent ?? false,
        done: todo.done ?? false
      }))
    }))
  };

  const doc = await tdlModel.create({ userId, tdl: structuredTdl });
  await createCalendarForUser(userId);
  await syncCalendarWithTDL(userId);
  await fs.unlink(filePath).catch(() => {});
  return doc;
}

export async function addTask(
  userId: string,
  task: string,
  dueDate?: string,
  priority?: string
): Promise<ITDL> {
  const doc = await tdlModel.findOne({ userId });
  if (!doc) throw new Error("TDL not found for user");

  const newSectionName = getSectionName(
    new Date(doc.tdl.weddingDate),
    dueDate ? new Date(dueDate) : new Date()
  );

  const section = doc.tdl.sections.find(s => s.sectionName === newSectionName);
  if (!section) throw new Error(`Target section "${newSectionName}" not found`);

  section.todos.push({
    _id: new mongoose.Types.ObjectId(),
    task,
    dueDate: dueDate || new Date().toISOString().slice(0, 10),
    priority: priority || "Medium",
    aiSent: false,
    done: false
  });

  doc.markModified("tdl.sections");
  await doc.save();
  await syncCalendarWithTDL(userId);
  return doc;
}

export async function updateTask(
  userId: string,
  _oldSectionName: string,
  todoId: string,
  updates: {
    task?: string;
    dueDate?: string;
    priority?: string;
    done?: boolean;
  }
): Promise<ITDL> {
  const doc = await tdlModel.findOne({ userId });
  if (!doc) throw new Error("TDL not found for user");

  let foundSection = null;
  let todo = null;

  for (const section of doc.tdl.sections) {
    const match = section.todos.find(t => t._id.toString() === todoId);
    if (match) {
      foundSection = section;
      todo = match;
      break;
    }
  }

  if (!foundSection || !todo) {
    throw new Error("Todo not found");
  }

  const updatedDueDate = updates.dueDate ?? todo.dueDate;
  const weddingDate = new Date(doc.tdl.weddingDate);
  const taskDate = new Date(updatedDueDate);
  const newSectionName = getSectionName(weddingDate, taskDate);

  todo.task = updates.task ?? todo.task;
  todo.dueDate = updatedDueDate;
  todo.priority = updates.priority ?? todo.priority;
  todo.done = updates.done ?? todo.done;
  todo.aiSent = false;
  
  if (foundSection.sectionName !== newSectionName) {
    foundSection.todos = foundSection.todos.filter(t => t._id.toString() !== todoId);
    const newSection = doc.tdl.sections.find(s => s.sectionName === newSectionName);
    if (!newSection) throw new Error(`Target section "${newSectionName}" not found`);
    newSection.todos.push(todo);
    newSection.todos.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  } else {
    foundSection.todos.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }

  doc.markModified("tdl.sections");
  await doc.save();
  await syncCalendarWithTDL(userId);
  return doc;
}

export async function deleteTask(
  userId: string,
  sectionName: string,
  todoId: string
): Promise<ITDL> {
  const doc = await tdlModel.findOne({ userId });
  if (!doc) throw new Error("TDL not found for user");

  const section = doc.tdl.sections.find(s => s.sectionName === sectionName);
  if (!section) throw new Error(`Section "${sectionName}" not found`);

  section.todos = section.todos.filter(t => t._id.toString() !== todoId);

  doc.markModified("tdl.sections");
  await doc.save();
  await syncCalendarWithTDL(userId);
  return doc;
}

export async function updateWeddingDateWithAI(
  userId: string,
  newWeddingDateStr: string
): Promise<ITDL> {
  const doc = await tdlModel.findOne({ userId });
  if (!doc) throw new Error("TDL not found for user");

  const newWeddingDate = new Date(newWeddingDateStr);
  if (isNaN(newWeddingDate.getTime())) throw new Error("Invalid wedding date format");

  const getDefaultDueDate = (sectionName: string, weddingDate: Date): string => {
    const date = new Date(weddingDate);
    switch (sectionName) {
      case "12 Months Before":
        date.setMonth(date.getMonth() - 12);
        break;
      case "9–12 Months Before":
        date.setMonth(date.getMonth() - 10);
        break;
      case "6–9 Months Before":
        date.setMonth(date.getMonth() - 8);
        break;
      case "3–6 Months Before":
        date.setMonth(date.getMonth() - 4);
        break;
      case "1–3 Months Before":
        date.setMonth(date.getMonth() - 2);
        break;
      case "1–4 Weeks Before":
        date.setDate(date.getDate() - 21);
        break;
      case "Wedding Day":
        break;
      default:
        break;
    }
    return date.toISOString().slice(0, 10);
  };

  for (const section of doc.tdl.sections) {
    for (const todo of section.todos) {
      todo.dueDate = getDefaultDueDate(section.sectionName, newWeddingDate);
      todo.aiSent = false;
    }
    section.todos.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }

  doc.tdl.weddingDate = newWeddingDateStr;
  doc.markModified("tdl.sections");
  await userModel.findByIdAndUpdate(userId, { weddingDate: newWeddingDateStr });
  await doc.save();
  await syncCalendarWithTDL(userId);
  return doc;
}

export async function setTaskDone(
  userId: string,
  sectionName: string,
  todoId: string,
  done: boolean
): Promise<ITDL> {
  const doc = await tdlModel.findOne({ userId });
  if (!doc) throw new Error("TDL not found for user");

  const section = doc.tdl.sections.find(s => s.sectionName === sectionName);
  if (!section) throw new Error(`Section "${sectionName}" not found`);

  const todo = section.todos.find(t => t._id.toString() === todoId);
  if (!todo) throw new Error("Todo not found");

  todo.done = done;

  doc.markModified("tdl.sections");
  return doc.save();
}