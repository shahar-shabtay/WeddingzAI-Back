// src/models/menu-model.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface ISentence {
  _id?: Types.ObjectId;
  title: string;
}

export interface IInvitation extends Document {
  userId: string;
  coupleNames: string;
  designPrompt: string;
  backgroundUrl: string;
  sentences: ISentence[];
  date?: String;
  finalPng?: string;
  finalCanvasJson?: string;
  createdAt: Date;
  updatedAt: Date;
  ceremonyHour?: string;
  receptionHour?: string;
  venue: string;
}

const sentenceSchema = new Schema<ISentence>(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },
    title: { type: String, required: true },
  },
  { _id: true }
);

const invitationSchema = new Schema<IInvitation>(
  {
    userId: { type: String, required: true },
    coupleNames: { type: String, required: true },
    designPrompt: { type: String, required: true },
    backgroundUrl: { type: String, required: true },
    sentences: { type: [sentenceSchema], default: [] },
    ceremonyHour: { type: String, default: "20:30", required: true},
    receptionHour:  { type: String, default: "19:30", required: true},
    venue:  { type: String, default: "", required: true},
    date:         {type: String},
    finalPng: { type: String },
    finalCanvasJson: { type: String }, 
  },
  { timestamps: true }
);

export default mongoose.model<IInvitation>("Invitation", invitationSchema);