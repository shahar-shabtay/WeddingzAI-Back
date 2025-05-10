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
router.get("/", authMiddleware, (req, res) => tdlController.getAll(req, res));

// List only mine
router.get("/mine", authMiddleware, (req, res) => tdlController.getMine(req, res));

// Get by ID
router.get("/:id", authMiddleware, (req, res) =>
  tdlController.getById(req, res)
);

// Delete
router.delete("/:id", authMiddleware, (req, res) =>
  tdlController.deleteItem(req, res)
);

export default router;