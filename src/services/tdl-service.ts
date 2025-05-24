import { promises as fs } from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import tdlModel, { ITDL } from "../models/tdl-model";
import userModel from "../models/user-model";

dotenv.config();
const apiKey = process.env.GOOGLE_API_KEY as string;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function generateTodoList(preferences: any): Promise<any> {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  let effectiveWedding: Date;
  let outputWeddingDate: string;

  if (!preferences.weddingDate) {
    effectiveWedding = new Date(today);
    effectiveWedding.setMonth(effectiveWedding.getMonth() + 18);
    outputWeddingDate = "Not defined";
  } else {
    effectiveWedding = new Date(preferences.weddingDate);
    outputWeddingDate = effectiveWedding.toISOString().slice(0, 10);
  }

  preferences.weddingDate = effectiveWedding.toISOString().slice(0, 10);
  const currentDate = todayStr;

  const prompt = `
You are an expert wedding planner. Based on the couple's wedding preferences, generate a detailed wedding to-do list.
Be sure to include vendor-focused tasks such as hair styling, photography, attire and shoes selection, guest favors, wedding rings, makeup and getting-ready coordination, bachelorette party planning, and any other key vendor bookings.
Make separate Task for each vendor type.
Here are the preferences:
${JSON.stringify(preferences, null, 2)}

Important Notes:
- Today's date is **${currentDate}**.
- Use the wedding date **${preferences.weddingDate}** to schedule tasks, don’t use it as the real date.
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
        {
          "task": string,
          "dueDate": "YYYY-MM-DD",
          "priority": "High"|"Medium"|"Low",
          "aiSent": false,
          "done": false
        }
      ]
    }
  ]
}
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
        dueDate: currentDate,
        priority: "High",
        aiSent: false,
        done: false,
        deleted: false
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
        done: todo.done ?? false,
        deleted: todo.deleted ?? false
      }))
    }))
  };

  const doc = await tdlModel.create({ userId, tdl: structuredTdl });
  await fs.unlink(filePath).catch(() => {});
  return doc;
}

export async function addTask(
  userId: string,
  sectionName: string,
  task: string,
  dueDate?: string,
  priority?: string
): Promise<ITDL> {
  const doc = await tdlModel.findOne({ userId });
  if (!doc) throw new Error("TDL not found for user");

  const section = doc.tdl.sections.find(s => s.sectionName === sectionName);
  if (!section) throw new Error(`Section "${sectionName}" not found`);

  section.todos.push({
    task,
    dueDate: dueDate || "",
    priority: priority || "",
    aiSent: false,
    done: false,
    deleted: false
  });

  doc.markModified("tdl.sections");
  return doc.save();
}

export async function updateTask(
  userId: string,
  sectionName: string,
  index: number,
  updates: {
    task?: string;
    dueDate?: string;
    priority?: string;
    done?: boolean;
    deleted?: boolean;
  }
): Promise<ITDL> {
  const doc = await tdlModel.findOne({ userId });
  if (!doc) throw new Error("TDL not found for user");

  const section = doc.tdl.sections.find(s => s.sectionName === sectionName);
  if (!section) throw new Error(`Section "${sectionName}" not found`);

  const todo = section.todos[index];
  if (!todo) throw new Error(`Todo at index ${index} not found`);

  if (updates.task     !== undefined) todo.task     = updates.task;
  if (updates.dueDate  !== undefined) todo.dueDate  = updates.dueDate;
  if (updates.priority !== undefined) todo.priority = updates.priority;
  if (updates.done     !== undefined) todo.done     = updates.done;
  if (updates.deleted  !== undefined) todo.deleted  = updates.deleted;

  doc.markModified("tdl.sections");
  return doc.save();
}

export async function deleteTask(
  userId: string,
  sectionName: string,
  index: number
): Promise<ITDL> {
  return updateTask(userId, sectionName, index, { deleted: true });
}

export async function updateWeddingDateWithAI(
  userId: string,
  newWeddingDate: string
): Promise<ITDL> {
  const doc = await tdlModel.findOne({ userId });
  if (!doc) throw new Error("TDL not found for user");

  const parsed = new Date(newWeddingDate);
  if (isNaN(parsed.getTime())) throw new Error("Invalid wedding date format");

  const payload = {
    oldWeddingDate: doc.tdl.weddingDate,
    newWeddingDate,
    sections: doc.tdl.sections.map(s => ({
      sectionName: s.sectionName,
      todos: s.todos.map(t => ({
        task: t.task,
        dueDate: t.dueDate,
        priority: t.priority,
        done: t.done,
        deleted: t.deleted ?? false,
        aiSent: t.aiSent ?? false
      }))
    }))
  };

  const prompt = `
You are a wedding-planning AI. I have an existing to-do list grouped into seven fixed phases:

${JSON.stringify(payload, null, 2)}

Re-bucket every task into the same seven phases:
  "12 Months Before",
  "9–12 Months Before",
  "6–9 Months Before",
  "3–6 Months Before",
  "1–3 Months Before",
  "1–4 Weeks Before",
  "Wedding Day"

For each task, recalculate its dueDate so that its relative position to the wedding is preserved under the NEW wedding date (${newWeddingDate}), and recalculate priority ("High","Medium","Low") based on how far ahead of the new date it now occurs.

Return ONLY raw JSON in this form:
{
  "sections": [
    {
      "sectionName": string,
      "todos": [
        { "task": string, "dueDate": "YYYY-MM-DD", "priority": string }
      ]
    }
  ]
}
`;

  const result = await model.generateContent(prompt);
  let aiJson = result.response.text().trim();
  aiJson = aiJson.replace(/^```json\s*/, "").replace(/```$/, "").trim();
  const out = JSON.parse(aiJson) as {
    sections: Array<{
      sectionName: string;
      todos: Array<{ task: string; dueDate: string; priority: string }>;
    }>;
  };

  doc.tdl.weddingDate = newWeddingDate;

  for (const secAI of out.sections) {
    const section = doc.tdl.sections.find(s => s.sectionName === secAI.sectionName);
    if (!section) continue;

    for (let i = 0; i < secAI.todos.length; i++) {
      const aiTodo = secAI.todos[i];
      const todo = section.todos[i];
      if (!todo) continue;
      todo.dueDate = aiTodo.dueDate;
      todo.priority = aiTodo.priority;
      todo.done = todo.done;
      todo.deleted = todo.deleted ?? false;
      todo.aiSent = todo.aiSent ?? false;
    }
  }

  doc.markModified("tdl.sections");
  await userModel.findByIdAndUpdate(userId, { weddingDate: newWeddingDate });
  return doc.save();
}
