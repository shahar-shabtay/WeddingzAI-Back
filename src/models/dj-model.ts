import { Schema, model, Document } from "mongoose";

export interface IDj extends Document {
  name: string;
  rating: number;
  logoUrl: string;
  about: string;
  facebookUrl?: string;
  instagramUrl?: string;
  location?: string;
  priceRange?: string;
  extraInfo?: Record<string, any>;
  eventImages: string[];
  reviews: { reviewer: string; rating: number; comment: string }[];
  faqs: { question: string; answer: string }[];
  profileImage: string;
  sourceUrl: string;
  scrapedAt: Date;
}

const DjSchema = new Schema<IDj>({
  name:        { type: String, required: true },
  rating:      { type: Number, required: true },
  logoUrl:     { type: String, required: true },
  about:       { type: String, required: true },
  facebookUrl: { type: String },
  instagramUrl:{ type: String },
  location:    { type: String },
  priceRange:  { type: String },
  extraInfo:   { type: Schema.Types.Mixed },
  eventImages: { type: [String], default: [] },
  reviews: [{
    reviewer: String,
    rating:   Number,
    comment:  String,
  }],
  faqs: [{
    question: String,
    answer:   String,
  }],
  profileImage:{ type: String, required: true },
  sourceUrl:   { type: String, required: true, unique: true },
  scrapedAt:   { type: Date,   default: () => new Date() },
});

export const DjModel = model<IDj>("Dj", DjSchema);