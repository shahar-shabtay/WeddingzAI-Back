import { Response } from "express";
import axios from "axios";
import dotenv from "dotenv";
import { AuthRequest } from "../common/auth-middleware";
dotenv.config();

const AIML_API_URL = "https://api.aimlapi.com/v1/chat/completions";
const AIML_API_KEY = process.env.AIMLAPI_KEY!;
const MODEL = "gpt-4o-mini";
const MAX_TOKENS = 3000;

interface VendorPrefs {
  vendor_type: string;
  wed_city: string;
  wed_date: string;
}

async function generateVendorList({ vendor_type, wed_city, wed_date }: VendorPrefs) {
  const prompt = `
You are a wedding planner AI assistant.
Output strictly one valid JSON array (no extra text).

Generate 5 top-rated Israeli ${vendor_type} in ${wed_city} for a wedding on ${wed_date}.
Each vendor must have:

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
Return only the JSON array.`.trim();

  const { data } = await axios.post(
    AIML_API_URL,
    {
      model: MODEL,
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt },
      ],
      max_tokens: MAX_TOKENS,
    },
    {
      headers: {
        Authorization: `Bearer ${AIML_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  let text = data.choices?.[0]?.message?.content?.trim() || "";
  if (text.startsWith("```")) text = text.replace(/^```(?:json)?\s*/, "");
  if (text.endsWith("```")) text = text.replace(/```$/, "").trim();

  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start < 0 || end < 0) throw new Error("No JSON array found in AI response");

  return JSON.parse(text.slice(start, end + 1));
}

export const getVendorList = async (req: AuthRequest, res: Response): Promise<void> => {
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
      res.status(err.response.status).json({ error: err.response.data.message || err.response.data });
      return;
    }
    res.status(500).json({ error: err.message });
  }
};