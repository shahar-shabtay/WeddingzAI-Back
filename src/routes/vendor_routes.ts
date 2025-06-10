import express from "express";
import { vendorController } from "../controllers/vendor-controller";
import authMiddleware  from "../common/auth-middleware";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);


// GET
router.get("/summary", vendorController.getVendorSummary); // Get all user vendor - summary
router.get("/", vendorController.getAllVendors); // Get all vendors
router.get('/mine',  vendorController.getUserVendors.bind(vendorController)); // get all user vendor - details
router.get("/booked", vendorController.getUserBookedVendors.bind(vendorController)); // get all user booked vendors
router.get("/relevant", vendorController.refetchRelevantVendors); // Update the relevant vendors for user
router.get("/type/:type", vendorController.getByType); // get vendor by type
router.get("/search", vendorController.search); // serach by field
router.get("/:id", vendorController.getById.bind(vendorController)); // get vendor by ID

// POST
router.post("/research/background", vendorController.startBackgroundResearch); // find vendors

//PATCH
router.patch("/book", vendorController.toggleBooked);
router.patch("/cancel", vendorController.cancelBook);
export default router;