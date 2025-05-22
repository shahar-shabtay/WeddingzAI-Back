import express from "express";
import { vendorController } from "../controllers/vendor-controller";
import authMiddleware  from "../common/auth-middleware";
import { auth } from "google-auth-library";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Research routes
// router.post("/ai-research",authMiddleware, vendorController.processResearchTask);

// CRUD routes
router.get("/relevant", authMiddleware, vendorController.getRelevantVendors.bind(vendorController));
router.get("/summary", authMiddleware, vendorController.getVendorSummary);
router.get("/", authMiddleware, vendorController.getAll.bind(vendorController));
router.get("/:id", authMiddleware, vendorController.getById);
router.get("/mine", authMiddleware, vendorController.getMine);
router.delete("/:id", authMiddleware, vendorController.deleteItem);

// Additional routes
router.get("/type/:type", authMiddleware, vendorController.getByType);
router.get("/search", authMiddleware, vendorController.search);



router.post("/research/background",authMiddleware, vendorController.startBackgroundResearch);


export default router;