import mongoose from "mongoose";

export interface IGuest {
  userId: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  phone?: string;
  rsvp?: "yes" | "no" | "maybe";
  rsvpToken: string;
}

// Regular expression for email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const guestSchema = new mongoose.Schema<IGuest>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true
  },
  fullName: {
    type: String,
    required: [true, "Full name is required"],
    trim: true
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    trim: true,
    lowercase: true,
    validate: {
      validator: (value: string) => emailRegex.test(value),
      message: (props: { value: string }) =>
        `${props.value} is not a valid email address`
    }
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
  rsvpToken: {
    type: String,
    required: true,
    unique: true
  }
});

guestSchema.index({ userId: 1, email: 1 }, { unique: true });

const guestModel = mongoose.model<IGuest>("guests", guestSchema);

export default guestModel;
