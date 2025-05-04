import { RequestHandler } from "express";
import budgetModel, { IBudget } from "../models/budget_model";

export const createBudget: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    const budgetData: Omit<IBudget, 'userId' | 'createdAt' | 'updatedAt'> = req.body;
    const budget = new budgetModel({
      userId,
      ...budgetData,
    });

    await budget.save();
    res.status(201).json(budget);
  } catch (error) {
    next(error);
  }
};

export const getBudget: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    const budget = await budgetModel.findOne({ userId });
    if (!budget) {
      res.status(404).json({ message: "Budget not found" });
      return;
    }

    res.json(budget);
  } catch (error) {
    next(error);
  }
};

export const updateBudget: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    const updateData: Partial<Omit<IBudget, 'userId' | 'createdAt' | 'updatedAt'>> = req.body;
    const budget = await budgetModel.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true }
    );

    if (!budget) {
      res.status(404).json({ message: "Budget not found" });
      return;
    }

    res.json(budget);
  } catch (error) {
    next(error);
  }
};

export const deleteBudget: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    const budget = await budgetModel.findOneAndDelete({ userId });
    if (!budget) {
      res.status(404).json({ message: "Budget not found" });
      return;
    }

    res.json({ message: "Budget deleted successfully" });
  } catch (error) {
    next(error);
  }
}; 