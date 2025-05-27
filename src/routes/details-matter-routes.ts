import express from "express";
import suggestSongsHandler from "../controllers/details-matter-controller";
import authMiddleware from "../common/auth-middleware";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Route for song suggestions
router.post("/suggest", suggestSongsHandler);

export default router; 