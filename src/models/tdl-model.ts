import mongoose, { Document, Schema, Types } from "mongoose";

export interface ITDL extends Document {
  userId: Types.ObjectId;
  tdl: any;
  createdAt: Date;
}

const tdlSchema = new Schema<ITDL>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  tdl: {
    type: Schema.Types.Mixed,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const tdlModel = mongoose.model<ITDL>("tdls", tdlSchema);
export default tdlModel;