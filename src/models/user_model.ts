import mongoose from "mongoose";

export interface IUser {
  firstPartner: string;
  secondPartner: string;
  email: string;
  password: string;
  refreshTokens?: string[],
  _id?: string;
  avatar?: string;
  is_premium?: boolean;
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
  }
});

const userModel = mongoose.model<IUser>("users", userSchema);

export default userModel;