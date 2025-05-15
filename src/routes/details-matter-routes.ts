import express from "express";
import { suggestSongs } from "../controllers/details-matter-controller";
import { authMiddleware } from "../controllers/auth_controller";

const router = express.Router();

// All routes are protected with authentication
router.use(authMiddleware);

// Route for song suggestions
router.post("/suggest", suggestSongs);

export default router; 