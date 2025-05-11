import express, { Router } from "express";
import budgetController from "../controllers/budget.controller";
import authMiddleware from "../common/auth-middleware";

const router = express.Router();

// All routes are protected with authentication

router.post(
  "/",
  authMiddleware,
  budgetController.create.bind(budgetController)
);

router.get(
  "/",
  authMiddleware,
  budgetController.getBudget.bind(budgetController)
);

export default router;
