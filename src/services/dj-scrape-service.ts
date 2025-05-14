// src/services/dj-scrape-service.ts

import FirecrawlApp from "@mendable/firecrawl-js";
import { DjModel, IDj } from "../models/dj-model";

interface FirecrawlFaq      { question: string; answer: string }
interface FirecrawlReview   { reviewer: string; date: string; comment: string }

interface FirecrawlDj {
  name:          string;
  rating?:       number;
  coverImage?:   string;
  profileImage?: string;
  about?:        string;
  price_range?:  string;
  services?:     string;
  area?:         string;
  hour_limits?:  string;
  genres?:       string;
  eventImages?:  string[];
  faqs?:         FirecrawlFaq[];
  brideReviews?: FirecrawlReview[];
  socialMedia?:  {
    facebook?:  string;
    instagram?: string;
    twitter?:   string;
    youtube?:   string;
  };
  website?:     string;
  phone?:     string;
}

export async function scrapeAndSaveDj(pageUrl: string): Promise<IDj> {
  const existing = await DjModel.findOne({ sourceUrl: pageUrl }).exec();
  if (existing) {
    console.log(`[dj-scrape-service] Skip, already scraped: ${pageUrl}`);
    return existing;
  }

  const apiKey = process.env.FIRECRAWL_API_KEY!;
  const apiUrl = process.env.FIRECRAWL_API_URL!;
  const app    = new FirecrawlApp({ apiKey, apiUrl });

  const prompt = `
You are scraping a DJ profile page at ${pageUrl}.  
On the page you will find these sections in order:

1) Header: DJ’s name and star-rating.  
2) Cover + About: profile image, followed by About block.  
4) Extra info (optional), with exactly these keys (use empty string if missing):
   - price_range  
   - services  
   - area  
   - hour_limits  
   - genres  
5) Event photos (optional).  
6) FAQs (optional): return as an array of objects, each with:
   { question: string; answer: string }  
7) Bride’s Words (optional): return as an array of objects, each with:
   { reviewer: string; date: string; comment: string }  
8) Social media links (optional): facebook, instagram, twitter, youtube  
9) Website link (optional)
10) phone number (optional)

Return ONLY valid JSON (or an array) matching this TypeScript interface:

\`\`\`ts
export interface Dj {
  _id:           string;
  name:          string;
  rating?:       number;
  coverImage?:   string;
  profileImage?: string;
  about?:        string;
  price_range?:  string;
  services?:     string;
  area?:         string;
  hour_limits?:  string;
  genres?:       string;
  eventImages?:  string[];
  faqs?:         { question: string; answer: string }[];
  brideReviews?: { reviewer: string; date: string; comment: string }[];
  socialMedia?:  {
    facebook?:  string;
    instagram?: string;
    twitter?:   string;
    youtube?:   string;
  };
  website?:     string;
  phone?:     string;
}
\`\`\`

Use empty string (\`""\`) or empty array (\`[]\`) for any missing field.  
Translate all text to English.  
HTML URL: ${pageUrl}
  `.trim();

  let result;
  try {
    result = await app.extract([pageUrl], { prompt });
  } catch (err: any) {
    if (err.statusCode === 402) {
      throw new Error(
        "Firecrawl quota exceeded or payment required. Please check your billing plan."
      );
    }
    console.error("[dj-scrape-service] Firecrawl threw:", err);
    throw err;
  }
  if (!result.success) {
    throw new Error("Firecrawl extract failed: " + result.error);
  }

  const raw = Array.isArray(result.data)
    ? (result.data[0] as FirecrawlDj)
    : (result.data as FirecrawlDj);

  console.log("🔍 Raw Firecrawl output:", JSON.stringify(raw, null, 2));

  const doc: Partial<IDj> = {
    name:         raw.name           || "",
    rating:       raw.rating         ?? 0,
    coverImage:   raw.coverImage     || "",
    profileImage: raw.profileImage   || "",

    about:        raw.about          || "",
    price_range:  raw.price_range    || "",
    services:     raw.services       || "",
    area:         raw.area           || "",
    hour_limits:  raw.hour_limits    || "",
    genres:       raw.genres         || "",

    eventImages:  Array.isArray(raw.eventImages)  ? raw.eventImages   : [],
    faqs:         Array.isArray(raw.faqs)         ? raw.faqs          : [],
    brideReviews: Array.isArray(raw.brideReviews) ? raw.brideReviews  : [],

    socialMedia: {
      facebook:  raw.socialMedia?.facebook  || "",
      instagram: raw.socialMedia?.instagram || "",
      twitter:   raw.socialMedia?.twitter   || "",
      youtube:   raw.socialMedia?.youtube   || "",
    },

    website:   raw.website     || "",
    phone:     raw.phone     || "",
    sourceUrl: pageUrl,
    scrapedAt: new Date(),
  };

  const saved = await DjModel.findOneAndUpdate(
    { sourceUrl: pageUrl },
    doc,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).exec();

  console.log(
    `[dj-scrape-service] Saved DJ "${saved.name}" (_id=${saved._id})`
  );
  return saved;
}