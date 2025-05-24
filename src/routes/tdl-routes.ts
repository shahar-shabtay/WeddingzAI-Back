// src/routes/tdl-routes.ts

import express from "express";
import multer from "multer";
import authMiddleware from "../common/auth-middleware";
import tdlController from "../controllers/tdl-controller";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Create new
router.post(
  "/upload-form",
  authMiddleware,
  upload.single("file"),
  (req, res, next) => tdlController.upload(req, res, next)
);

// List all
router.get("/", authMiddleware, tdlController.getAll.bind(tdlController));

// List only mine
router.get("/mine", authMiddleware, tdlController.getMine.bind(tdlController));

// Get by ID
router.get("/:id", authMiddleware, tdlController.getById.bind(tdlController));

// Delete Task
router.delete("/task", authMiddleware, tdlController.deleteTask);

// Get user tdl
router.get("/user/:id", authMiddleware,tdlController.getByUser);

// Add task
router.post("/task", authMiddleware, tdlController.addTask);

// Update task
router.put("/task", authMiddleware, tdlController.updateTask);

// Update wedding date
router.put("/date",authMiddleware,tdlController.updateWeddingDate);

// make task done

export default router;