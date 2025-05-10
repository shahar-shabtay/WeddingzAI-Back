import { Router } from "express";
import { scrapeOneDjController } from "../controllers/dj-controller";

const router = Router();
router.post("/scrape-one", scrapeOneDjController);

export default router;