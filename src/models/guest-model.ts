import mongoose from "mongoose";

export interface IGuest {
  userId: string;
  fullName: string;
  email?: string;
  phone?: string;
  rsvp?: "yes" | "no" | "maybe";
  mealPreference?: string;
  notes?: string;
}

const guestSchema = new mongoose.Schema<IGuest>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true
  },
  fullName: {
    type: String,
    required: [true, "Guest name is required"],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  rsvp: {
    type: String,
    enum: ["yes", "no", "maybe"],
    default: "maybe"
  },
  mealPreference: {
    type: String
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

const guestModel = mongoose.model<IGuest>("guests", guestSchema);

export default guestModel;
