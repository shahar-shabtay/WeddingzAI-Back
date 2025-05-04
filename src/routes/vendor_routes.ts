import express from "express";
import { getVendorList } from "../controllers/vendors_controller";

const router = express.Router();
router.post("/vendors", getVendorList);
export default router;