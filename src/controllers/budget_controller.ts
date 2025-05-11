import { Request, Response } from "express";
import budgetModel, { IBudget } from "../models/budget_model";
import { BaseController } from "./base-controller";
import { AuthRequest } from "../common/auth-middleware";

class BudgetController extends BaseController<IBudget> {
  constructor() {
    super(budgetModel);
  }

  async create(req: AuthRequest, res: Response) {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    const budgetData: Omit<IBudget, "user" | "createdAt" | "updatedAt"> =
      req.body;
    try {
      const budget = new budgetModel({
        user: userId,
        ...budgetData,
      });

      await budget.save();
      res.status(201).json(budget);
    } catch (error) {
      res.status(500).json({ message: "Failed to create budget", error });
    }
  }

  async getBudget(req: AuthRequest, res: Response) {
    console.log("get budget------------");
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    try {
      const budget = await budgetModel.findOne({ user: userId });
      if (!budget) {
        res.status(404).json({ message: "Budget not found" });
        return;
      }

      res.status(200).json(budget);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch budget", error });
    }
  }
}

export default new BudgetController();
