import express from "express";
import multer from "multer";
import authMiddleware from "../common/auth-middleware";
import tdlController from "../controllers/tdl-controller";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Apply auth middleware to all routes
router.use(authMiddleware);


// POST
router.post("/upload-form",upload.single("file"),
  (req, res, next) => tdlController.upload(req, res, next)); // Create new TDL.
router.post("/task", tdlController.addTask); // Add Task to TDL

// GET
router.get("/", tdlController.getAll.bind(tdlController)); // Get all TDLs
router.get("/mine", tdlController.getMine.bind(tdlController)); // Get user TDL
router.get("/:id", tdlController.getById.bind(tdlController)); // Get by TDL by ID

// DELETE
router.delete("/task", tdlController.deleteTask); // Delete Task from TDL

// PUT
router.put("/task", tdlController.updateTask); // Update Task in TDL
router.put("/date", tdlController.updateWeddingDate); // Update Wedding Date

// PATCH
router.patch("/done", tdlController.setTaskDone);// Mark Task Done

export default router;