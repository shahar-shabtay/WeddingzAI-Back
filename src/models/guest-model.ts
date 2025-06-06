import mongoose from "mongoose";

export interface IGuest {
  userId: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  phone?: string;
  rsvp?: "yes" | "no" | "maybe";
  rsvpToken: string;
  numberOfGuests?: number; // New field to represent the total guests including the main guest
  tableId?: mongoose.Types.ObjectId | null;
}

// Regular expression for email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const guestSchema = new mongoose.Schema<IGuest>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  fullName: {
    type: String,
    required: [true, "Full name is required"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    trim: true,
    lowercase: true,
    validate: {
      validator: (value: string) => emailRegex.test(value),
      message: (props: { value: string }) =>
        `${props.value} is not a valid email address`,
    },
  },
  phone: {
    type: String,
    trim: true,
  },
  rsvp: {
    type: String,
    enum: ["yes", "no", "maybe"],
    default: "maybe",
  },
  rsvpToken: {
    type: String,
    required: true,
    unique: true,
  },
  numberOfGuests: {
    type: Number,
    min: [1, "At least one guest must be specified"],
    default: 1,
  },
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "tables",
    default: null,
  },
});

// Ensure each email is unique per user
guestSchema.index({ userId: 1, email: 1 }, { unique: true });

const guestModel = mongoose.model<IGuest>("guests", guestSchema);

export default guestModel;
