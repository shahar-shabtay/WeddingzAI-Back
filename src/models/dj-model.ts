// src/models/dj-model.ts

import mongoose, { Document, Schema, Types } from "mongoose";

export interface IDj extends Document {
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
  sourceUrl:    string;
  scrapedAt:    Date;
}

const DjSchema = new Schema<IDj>({
  name:          { type: String, required: true },
  rating:        { type: Number, default: 0 },
  coverImage:    String,
  profileImage:  String,
  about:         String,
  price_range:   { type: String, default: "" },
  services:      { type: String, default: "" },
  area:          { type: String, default: "" },
  hour_limits:   { type: String, default: "" },
  genres:        { type: String, default: "" },
  eventImages:   { type: [String], default: [] },
  faqs:          {
    type: [{
      question: String,
      answer:   String,
    }],
    default: []
  },
  brideReviews:  {
    type: [{
      reviewer: String,
      date:     String,
      comment:  String,
    }],
    default: []
  },
  socialMedia: {
    facebook:  String,
    instagram: String,
    twitter:   String,
    youtube:   String,
  },
  website:      { type: String, default: "" },
  sourceUrl:    { type: String, required: true, unique: true },
  scrapedAt:    { type: Date,   default: Date.now },
}, {
  timestamps: true
});

export const DjModel = mongoose.model<IDj>("Dj", DjSchema);