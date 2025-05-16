import express from "express";
import { suggestSongs } from "../controllers/details-matter-controller";
import { authMiddleware } from "../controllers/auth_controller";

const router = express.Router();

// All routes are protected with authentication
router.use(authMiddleware);

// Route for song suggestions
router.post("/suggest", suggestSongs);
import detailsMatterController from "../controllers/details-matter-controller";

const router = express.Router();

// Route for song suggestions
router.post("/details-matter/suggest", authMiddleware, detailsMatterController.suggestSongs);

export default router; 