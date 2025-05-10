// src/controllers/vendors_controller.ts

import { Request, Response } from "express";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const AIML_API_URL = "https://api.aimlapi.com/v1/chat/completions";
const AIML_API_KEY = process.env.AIMLAPI_KEY!;
const MODEL         = "gpt-4o-mini";
const MAX_TOKENS    = 3000;

if (!AIML_API_KEY) {
  throw new Error("Please set AIMLAPI_KEY in your .env");
}

interface VendorPrefs {
  vendor_type: string;
  wed_city:     string;
  wed_date:     string;
}

async function generateVendorList({ vendor_type, wed_city, wed_date }: VendorPrefs) {
  const prompt = `
You are a wedding planner AI assistant.
Output strictly one valid JSON array (no extra text).

Generate 5 top-rated Israeli ${vendor_type} in ${wed_city} for a wedding on ${wed_date}.
For each vendor return an object with exactly these fields:

{
  "id": string,
  "category": string,
  "name": string,
  "address": string,
  "rating": number,
  "price_range": string,
  "about": string,
  "contact": {
    "phone": string,
    "email": string,
    "instagram": string | null,
    "facebook": string | null
  },
  "reviews": [
    { "reviewer": string, "rating": number, "comment": string }
  ],
  "coverImage": string,
  "logoUrl": string,
  "imageUrls": string[],
  "videoUrls": string[]
}

Use plausible but invented data where necessary.
Return JSON array only—no markdown or commentary.
  `.trim();

  const { data } = await axios.post(
    AIML_API_URL,
    {
      model: MODEL,
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user",   content: prompt },
      ],
      max_tokens: MAX_TOKENS,
    },
    {
      headers: {
        Authorization: `Bearer ${AIML_API_KEY}`,
        "Content-Type":  "application/json",
      },
    }
  );

  let text = data.choices?.[0]?.message?.content?.trim() || "";
  // strip code fences if present
  if (text.startsWith("```")) text = text.replace(/^```(?:json)?\s*/, "");
  if (text.endsWith("```"))   text = text.replace(/```$/, "").trim();

  // extract JSON array
  const start = text.indexOf("[");
  const end   = text.lastIndexOf("]");
  if (start < 0 || end < 0) {
    console.error("Raw AI output:\n", text);
    throw new Error("No JSON array found in AI response");
  }
  const jsonArray = text.slice(start, end + 1);
  return JSON.parse(jsonArray);
}

export const getVendorList = async (req: Request, res: Response): Promise<void> => {
  const { vendor_type, wed_city, wed_date } = req.body as VendorPrefs;

  if (!vendor_type || !wed_city || !wed_date) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  try {
    const vendorList = await generateVendorList({ vendor_type, wed_city, wed_date });
    res.status(200).json({ vendorList });
  } catch (err: any) {
    if (axios.isAxiosError(err) && err.response) {
      console.error("AI API returned error:", err.response.data);
       res
        .status(err.response.status)
        .json({ error: err.response.data.message || err.response.data });
    }
    console.error("Error generating vendor list:", err.message);
    res.status(500).json({ error: err.message });
  }
};