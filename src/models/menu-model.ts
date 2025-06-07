// src/models/menu-model.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IDish {
  _id?: Types.ObjectId;
  name: string;
  description: string;
  category: string;
  isVegetarian: boolean;
}

export interface IMenu extends Document {
  userId: string;
  coupleNames: string;
  designPrompt: string;
  backgroundUrl: string;
  dishes: IDish[];
  finalPng?: string;
  finalCanvasJson?: string;
  createdAt: Date;
  updatedAt: Date;
}

const dishSchema = new Schema<IDish>(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    isVegetarian: { type: Boolean, required: true, default: false },
  },
  { _id: true }
);

const menuSchema = new Schema<IMenu>(
  {
    userId: { type: String, required: true },
    coupleNames: { type: String, required: true },
    designPrompt: { type: String, required: true },
    backgroundUrl: { type: String, required: true },
    dishes: { type: [dishSchema], default: [] },
    finalPng: { type: String },
    finalCanvasJson: { type: String }, 
  },
  { timestamps: true }
);

export default mongoose.model<IMenu>("Menu", menuSchema);