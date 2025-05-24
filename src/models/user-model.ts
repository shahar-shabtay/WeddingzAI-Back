import mongoose from "mongoose";
import { IVendor } from "./vendor-model";

export interface IUser {
  firstPartner: string;
  secondPartner: string;
  email: string;
  password: string;
  refreshTokens?: string[],
  _id?: string;
  avatar?: string;
  is_premium?: boolean;
  myVendors: IVendor[];
  weddingDate?: string;
  weddingVenue?: string;
}

// Regular expression for email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema<IUser>({
  firstPartner: {
    type: String,
    required: false,
  },
  secondPartner: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: (value: string) => emailRegex.test(value),
      message: (props: { value: string }) =>
        `${props.value} is not a valid email address`,
    },
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters long"],
  },
  refreshTokens: {
    type: [String],
    default: []
  },
  avatar: {
    type: String
  },
  is_premium: {
    type: Boolean,
    default: false
  },
  myVendors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor", // this must match your Vendor model name
    default: [],
  }],
  weddingDate: {
    type: String,
    required: false,
    default: "TBD"
  },
  weddingVenue: {
    type: String,
    required: false,
    default: "TBD"
  },
});

const userModel = mongoose.model<IUser>("users", userSchema);

export default userModel;