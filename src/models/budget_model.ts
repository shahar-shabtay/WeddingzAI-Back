import mongoose, { PopulatedDoc } from "mongoose";
import { IUser } from "./user-model";

export interface IBudget {
  user: PopulatedDoc<IUser>;
  totalBudget: number;
  categories: {
    name: string;
    amount: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const budgetSchema = new mongoose.Schema<IBudget>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    totalBudget: {
      type: Number,
      required: [true, "Total budget is required"],
      min: [0, "Total budget cannot be negative"],
    },
    categories: [
      {
        name: {
          type: String,
          required: [true, "Category name is required"],
        },
        amount: {
          type: Number,
          required: [true, "Category amount is required"],
          min: [0, "Category amount cannot be negative"],
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const budgetModel = mongoose.model<IBudget>("budgets", budgetSchema);

export default budgetModel;
