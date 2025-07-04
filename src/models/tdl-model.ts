import mongoose, { Schema, Document } from "mongoose";

// A single to-do item with optional AI flag and completion status
const todoSchema = new Schema({
  task:     { type: String, required: true },
  dueDate:  { type: String },
  priority: { type: String },
  aiSent:   { type: Boolean, default: false },
  done:     { type: Boolean, default: false }
}, { _id: true }); 

// A section grouping multiple to-dos
const sectionSchema = new Schema({
  sectionName: { type: String },
  todos:       [todoSchema]
}, { _id: false });

// Root TDL document, scoped to a user
const tdlSchema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  tdl: {
    weddingTodoListName: String,
    firstPartner:        String,
    secondPartner:       String,
    weddingDate:         String,
    estimatedBudget:     String,
    sections:            [sectionSchema]
  }
}, { timestamps: true });

export interface ITodo {
  _id: mongoose.Types.ObjectId;
  task: string;
  dueDate: string;
  priority: string;
  aiSent: boolean;
  done: boolean;
}

export interface ISection {
  sectionName: string;
  todos: ITodo[];
}

export interface ITDL extends Document {
  userId: mongoose.Types.ObjectId;
  tdl: {
    weddingTodoListName: string;
    estimatedBudget: string;
    sections: ISection[];
    firstPartner:        string;
    secondPartner:       string;
    weddingDate:         string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const tdlModel = mongoose.model<ITDL>("TDL", tdlSchema);
export default tdlModel;