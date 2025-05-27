// src/models/menu-model.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IMenu extends Document {
  userId: string;
  coupleNames: string;
  designPrompt: string;
  dishes: Array<{
    name: string;
    description: string;
  }>;
  imageUrl: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const menuSchema = new Schema<IMenu>(
  {
    userId: { type: String, required: true },
    coupleNames: { type: String, required: true },
    designPrompt: { type: String, required: true },
    dishes: [{
      name: { type: String, required: true },
      description: { type: String, required: true }
    }],
    imageUrl: { type: String, required: true },
  },
  { timestamps: true }
);

const Menu = mongoose.model<IMenu>("Menu", menuSchema);

export default Menu;