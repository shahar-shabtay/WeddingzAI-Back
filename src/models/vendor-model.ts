// src/models/vendor-model.ts

import mongoose, { Document, Schema } from "mongoose";

export interface IVendor extends Document {
  name: string;
  vendorType: string;
  
  // Images
  coverImage: string;
  profileImage: string;
  eventImages: string[]; 
  
  // Description and details
  about: string;
  price_range: string;
  services: string;
  area: string;
  genres: string;
  max_companions: string;
  price_include: string;
  max_guests: string;
  min_guests: string;
  end_time: string;
  seasons: string;

  // Q&A
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  
  // Reviews
  reviews: Array<{
    reviewer: string;
    date: string;
    comment: string;
  }>;
  
  // Contact info
  socialMedia: {
    facebook: string;
    instagram: string;
    twitter: string;
    youtube: string;
    [key: string]: string; // Allow for additional platforms
  };
  website: string;
  phone: string;
  
  // Metadata
  sourceUrl: string;
  scrapedAt: Date;

  details: [];
}

const vendorSchema = new Schema<IVendor>(
  {
    name: { type: String, required: true },
    vendorType: { type: String, required: true, index: true },
    
    coverImage: { type: String, default: "" },
    profileImage: { type: String, default: "" },
    eventImages: { type: [String], default: [] },
    
    about: { type: String, default: "" },
    price_range: { type: String, default: "" },
    services: { type: String, default: "" },
    area: { type: String, default: "" },
    genres: {type: String, default: ""},
    max_companions: {type: String, default: ""},
    price_include: {type: String, default: ""},
    max_guests: {type: String, default: ""},
    min_guests: {type: String, default: ""},
    end_time: {type: String, default: ""},
    seasons: {type: String, default: ""},
    
    faqs: {
      type: [
        {
          question: { type: String, required: true },
          answer: { type: String, required: true },
        },
      ],
      default: [],
    },
    
    reviews: {
      type: [
        {
          reviewer: { type: String, required: true },
          date: { type: String, required: true },
          comment: { type: String, required: true },
        },
      ],
      default: [],
    },
    
    socialMedia: {
      facebook: { type: String, default: "" },
      instagram: { type: String, default: "" },
      twitter: { type: String, default: "" },
      youtube: { type: String, default: "" },
    },
    
    website: { type: String, default: "" },
    phone: { type: String, default: "" },
    
    sourceUrl: { type: String, required: true, unique: true },
    scrapedAt: { type: Date, default: Date.now },
    details: {type: [], default: []},
  },
  { timestamps: true }
);

// Indexes for common query patterns
vendorSchema.index({ vendorType: 1, name: 1 });
vendorSchema.index({ sourceUrl: 1 }, { unique: true });

export const VendorModel = mongoose.model<IVendor>("Vendor", vendorSchema);