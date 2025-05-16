import express from "express";
import detailsMatterController from "../controllers/details-matter-controller";
import authMiddleware from "../common/auth-middleware";

const router = express.Router();

// Route for song suggestions
router.post("/details-matter/suggest", authMiddleware, detailsMatterController.suggestSongs);

export default router; 