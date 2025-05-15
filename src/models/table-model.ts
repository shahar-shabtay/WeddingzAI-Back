import mongoose, { Schema, Document } from "mongoose";
import { PopulatedDoc } from "mongoose";
import { IGuest } from "./guest-model";
import { IUser } from "./user-model";

export interface ITable extends Document {
  userId: PopulatedDoc<IUser>;
  name: string;
  shape: "round" | "rectangle";
  capacity: number;
  position: {
    x: { type: Number; default: 0 };
    y: { type: Number; default: 0 };
  };
  guests: PopulatedDoc<IGuest>[];
}

const tableSchema = new Schema<ITable>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  name: { type: String, required: true },
  shape: {
    type: String,
    enum: ["round", "rectangle"],
    default: "rectangle",
  },
  capacity: { type: Number, default: 8 },
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
  },
  guests: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "guests",
    },
  ],
});

const tableModel = mongoose.model<ITable>("tables", tableSchema);

export default tableModel;
