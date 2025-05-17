import mongoose, { Schema, Document } from "mongoose";

export interface IInvitation extends Document {
  userId: string;
  prompt: string;
  imageUrl: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const invitationSchema = new Schema<IInvitation>(
  {
    userId: { type: String, required: true },
    prompt: { type: String, required: true },
    imageUrl: { type: String, required: true },
  },
  { timestamps: true }
);

const Invitation = mongoose.model<IInvitation>("Invitation", invitationSchema);

export default Invitation;
