// src/models/dj-model.ts

import mongoose, { Schema, Document } from "mongoose";

export interface IDj extends Document {
  name: string;
  about: string;
  rating?: number;
  profileImage?: string;      // raw.profile_image
    coverImage?: string;     // ← add this

  logoUrl?: string;           // raw.profile_image או raw.logo_url
  facebookUrl?: string;
  instagramUrl?: string;
  location?: string;
  priceRange?: string;
  extraInfo?: Record<string, any>;
  eventImages: string[];      // raw.event_photos
  imageUrls: string[];        // אם תרצי לתמוך גם ב־raw.image_urls
  videoUrls: string[];        // raw.video_urls
  reviews: { reviewer: string; rating: number; comment: string }[];
  faqs:    { question: string; answer: string }[];
  tabs:    string[];
  sourceUrl: string;
  scrapedAt: Date;
}

const DjSchema = new Schema<IDj>(
  {
    name:         { type: String, required: true, unique: true },
    about:        { type: String, required: true },

    rating:       { type: Number },

    // תמונת פרופיל וכיסוי
    profileImage: { type: String },
    logoUrl:      { type: String },

    // קישורים לרשתות חברתיות
    facebookUrl:  { type: String },
    instagramUrl: { type: String },

    location:     { type: String },
    priceRange:   { type: String },
    extraInfo:    { type: Schema.Types.Mixed },

    // מערכים של תמונות / סרטונים
    eventImages:  { type: [String], default: [] },
    imageUrls:    { type: [String], default: [] },
    videoUrls:    { type: [String], default: [] },

    // ביקורות ו־FAQs
    reviews: {
      type: [
        {
          reviewer: { type: String },
          rating:   { type: Number },
          comment:  { type: String },
        }
      ],
      default: []
    },
    faqs: {
      type: [
        {
          question: { type: String },
          answer:   { type: String },
        }
      ],
      default: []
    },

    // לשוניות נוספות
    tabs:         { type: [String], default: [] },

    sourceUrl:    { type: String, required: true, unique: true },
    scrapedAt:    { type: Date,   default: () => new Date() },
  },
  { timestamps: true }
);

export const DjModel = mongoose.model<IDj>("Dj", DjSchema);