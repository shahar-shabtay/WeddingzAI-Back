import express, { Router } from "express";
import {
  createBudget,
  getBudget,
  updateBudget,
  deleteBudget,
} from "../controllers/budget.controller";
import { authMiddleware } from "../controllers/auth_controller";

const router: Router = express.Router();

// All routes are protected with authentication
router.use(authMiddleware);

router.post("/", createBudget);
router.get("/", getBudget);
router.put("/", updateBudget);
router.delete("/", deleteBudget);

export default router; 