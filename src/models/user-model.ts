import mongoose from "mongoose";

export interface IGuest {
  userId: mongoose.Types.ObjectId;
  fullName: string;
  email?: string;
  phone?: string;
  rsvp?: "yes" | "no" | "maybe";
  mealPreference?: string;
  notes?: string;
  _id?: string;
}

// Regular expression for email validation (optional field)
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
    trim: true,
    lowercase: true,
    validate: {
      validator: (value: string) => !value || emailRegex.test(value),
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
  mealPreference: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  }
});

const guestModel = mongoose.model<IGuest>("guests", guestSchema);

export default guestModel;
