// src/services/dj-scrape-service.ts

import FirecrawlApp from "@mendable/firecrawl-js";
import { DjModel, IDj } from "../models/dj-model";
import slugify from "slugify";

// --- Firecrawl response types ---
interface FirecrawlReview { reviewer: string; rating: number; comment: string }
interface FirecrawlFaq    { question: string; answer: string }
interface FirecrawlDj {
  name: string;
  rating: number;
  profile_image: string;
  about: string;
  facebook?: string;
  instagram?: string;
  location?: string;
  price_range?: string;
  extra_info?: Record<string, any>;
  event_photos?: string[];
  reviews?: FirecrawlReview[];
  faqs?: FirecrawlFaq[];
  tabs?: string[];
}

export async function scrapeAndSaveDj(pageUrl: string): Promise<IDj> {
  // 0) If we already have this URL, skip and return existing
  const existing = await DjModel.findOne({ sourceUrl: pageUrl }).exec();
  if (existing) {
    console.log(`[dj-scrape-service] Skipping, already scraped: ${pageUrl}`);
    return existing;
  }

  const apiKey  = process.env.FIRECRAWL_API_KEY!;
  const baseUrl = process.env.FIRECRAWL_API_URL!;

  // 1) Extract raw data from Firecrawl
  const app = new FirecrawlApp({ apiKey, apiUrl: baseUrl });
  const prompt = [
    "Extract DJ profile data including:",
    "- name",
    "- rating",
    "- profile_image",
    "- about",
    "- facebook",
    "- instagram",
    "- location",
    "- price_range",
    "- extra_info",
    "- event_photos",
    "- reviews",
    "- faqs",
    "- tabs",
  ].join("\n");
  const result = await app.extract([pageUrl], { prompt });
  if (!result.success) {
    throw new Error(result.error || "Firecrawl extract failed");
  }
  const raw = (Array.isArray(result.data) ? result.data[0] : result.data) as FirecrawlDj;

  // 2) Build the upsert document with raw fields
  const update: Partial<IDj> = {
    name:         raw.name,
    rating:       raw.rating,
    coverImage:   raw.profile_image,
    logoUrl:      raw.profile_image,
    profileImage: raw.profile_image,
    about:        raw.about,
    facebookUrl:  raw.facebook,
    instagramUrl: raw.instagram,
    location:     raw.location,
    priceRange:   raw.price_range,
    extraInfo:    raw.extra_info,
    eventImages:  raw.event_photos ?? [],
    reviews:      (raw.reviews ?? []).map(r => ({
                     reviewer: r.reviewer,
                     rating:   r.rating,
                     comment:  r.comment,
                   })),
    faqs:         (raw.faqs ?? []).map(f => ({
                     question: f.question,
                     answer:   f.answer,
                   })),
    tabs:         raw.tabs ?? [],
    sourceUrl:    pageUrl,
    scrapedAt:    new Date(),
  };

  // 3) Insert new document
  const saved = await DjModel.create(update);

  console.log(`[dj-scrape-service] Saved DJ "${saved.name}" (_id=${saved._id})`);
  return saved;
}