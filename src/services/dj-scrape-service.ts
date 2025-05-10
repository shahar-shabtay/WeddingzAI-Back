// src/services/dj-scrape-service.ts

import axios from "axios";
import FirecrawlApp from "@mendable/firecrawl-js";
import { DjModel, IDj } from "../models/dj-model";

interface FirecrawlReview {
  reviewer: string;
  rating: number;
  comment: string;
}

interface FirecrawlFaq {
  question: string;
  answer: string;
}

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
}

export async function scrapeAndSaveDj(pageUrl: string): Promise<IDj> {
  const apiKey  = process.env.FIRECRAWL_API_KEY!;
  const baseUrl = process.env.FIRECRAWL_API_URL!;

  try {
    const sanity = await axios.post(
      `${baseUrl}/v1/extract`,
      { urls: [pageUrl], prompt: "Extract DJ profile data including name, rating, profile_image, about, facebook, instagram, location, price_range, extra_info, event_photos, reviews, faqs" },
      {
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        validateStatus: () => true
      }
    );
    console.log("[dj-scrape-service] axios sanity status:", sanity.status);
  } catch (e) {
    console.warn("[dj-scrape-service] axios sanity threw:", e);
  }

  const app = new FirecrawlApp({ apiKey, apiUrl: baseUrl });
  let result;
  try {
    result = await app.extract([pageUrl], {
      prompt: "Extract DJ profile data including name, rating, profile_image, about, facebook, instagram, location, price_range, extra_info, event_photos, reviews, faqs"
    });
  } catch (err) {
    console.error("[dj-scrape-service] SDK threw:", err);
    throw err;
  }

  if (!result.success) {
    throw new Error(result.error || "Firecrawl extract failed");
  }

  const raw: FirecrawlDj = Array.isArray(result.data)
    ? result.data[0]
    : (result.data as FirecrawlDj);

  const djDoc: Partial<IDj> = {
    name:         raw.name,
    rating:       raw.rating,
    logoUrl:      raw.profile_image,
    about:        raw.about,
    facebookUrl:  raw.facebook,
    instagramUrl: raw.instagram,
    location:     raw.location,
    priceRange:   raw.price_range,
    extraInfo:    raw.extra_info,
    eventImages:  raw.event_photos ?? [],
    reviews:      (raw.reviews ?? []).map((r: FirecrawlReview) => ({
      reviewer: r.reviewer,
      rating:   r.rating,
      comment:  r.comment,
    })),
    faqs:         (raw.faqs ?? []).map((f: FirecrawlFaq) => ({
      question: f.question,
      answer:   f.answer,
    })),
    profileImage: raw.profile_image,
    sourceUrl:    pageUrl,
    scrapedAt:    new Date(),
  };

  const saved = await DjModel.findOneAndUpdate(
    { sourceUrl: pageUrl },
    djDoc,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).exec();

  console.log("[dj-scrape-service] Saved _id:", saved._id);
  return saved;
}