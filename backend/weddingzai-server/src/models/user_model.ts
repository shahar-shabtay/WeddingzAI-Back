import mongoose from "mongoose";

export interface IUser {
  username: string;
  email: string;
  password: string;
  refreshTokens?: string[],
  _id?: string;
  avatar?: string;
}

// Regular expression for email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
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
  }
});

const userModel = mongoose.model<IUser>("users", userSchema);

export default userModel;