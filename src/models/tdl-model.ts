import mongoose, { Schema, Document } from "mongoose";

const todoSchema = new Schema({
  task: { type: String, required: true },
  dueDate: { type: String },
  priority: { type: String },
  aiSent: { type: Boolean, default: false }
}, { _id: false });

const sectionSchema = new Schema({
  sectionName: { type: String },
  todos: [todoSchema]
}, { _id: false });

const tdlSchema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  tdl: {
    weddingTodoListName: String,
    firstPartner: String,
    secondPartner: String,
    weddingDate: String,
    estimatedBudget: String,
    sections: [sectionSchema]
  }
}, { timestamps: true });

export interface ITDL extends Document {
  userId: mongoose.Types.ObjectId;
  tdl: {
    weddingTodoListName: string;
    firstPartner: string;
    secondPartner: string;
    weddingDate: string;
    estimatedBudget: string;
    sections: Array<{
      sectionName: string;
      todos: Array<{
        task: string;
        dueDate: string;
        priority: string;
        aiSent: boolean;
      }>
    }>
  };
  createdAt: Date;
  updatedAt: Date;
}

const tdlModel = mongoose.model<ITDL>("TDL", tdlSchema);
export default tdlModel;