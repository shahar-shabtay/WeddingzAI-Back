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

  async update(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req);
      if (!userId) throw new Error("Unauthorized");

      const updatedData = req.body;

      const existingBudget = await this.model.findOne({ user: userId });
      if (!existingBudget) {
        res.status(404).json({ message: "No budget found to update" });
        return;
      }

      existingBudget.totalBudget = updatedData.totalBudget;
      existingBudget.categories = updatedData.categories;

      await existingBudget.save();
      this.sendSuccess(res, existingBudget, "Budget updated");
      return;
    } catch (err: any) {
      this.sendError(res, err, err.message === "Unauthorized" ? 401 : 500);
      return;
    }
  }
}

export default new BudgetController();
