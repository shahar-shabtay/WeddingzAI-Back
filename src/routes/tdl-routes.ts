import express from "express";
import multer from "multer";
import authMiddleware from "../common/auth-middleware";
import tdlController from "../controllers/tdl-controller";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// POST
router.post("/upload-form",
  authMiddleware,upload.single("file"),
  (req, res, next) => tdlController.upload(req, res, next)); // Create new TDL.
router.post("/task", authMiddleware, tdlController.addTask); // Add Task to TDL

// GET
router.get("/", authMiddleware, tdlController.getAll.bind(tdlController)); // Get all TDLs
router.get("/mine", authMiddleware, tdlController.getMine.bind(tdlController)); // Get user TDL
router.get("/:id", authMiddleware, tdlController.getById.bind(tdlController)); // Get by TDL by ID

// DELETE
router.delete("/task", authMiddleware, tdlController.deleteTask); // Delete Task from TDL

// PUT
router.put("/task", authMiddleware, tdlController.updateTask); // Update Task in TDL
router.put("/date", authMiddleware, tdlController.updateWeddingDate); // Update Wedding Date

// PATCH
router.patch("/task/done", authMiddleware, tdlController.setTaskDone);// Mark Task Done

export default router;