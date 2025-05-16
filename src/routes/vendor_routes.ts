// import { Router } from 'express';
// import authMiddleware from '../common/auth-middleware';
// import vendorsCtrl from '../controllers/vendor-controller';

// const router = Router();

// // CRUD via BaseController:
// router.get(   '/djs',        authMiddleware, vendorsCtrl.getAll.bind(vendorsCtrl)      );
// router.get(   '/djs/mine',   authMiddleware, vendorsCtrl.getMine.bind(vendorsCtrl)       );
// router.get(   '/djs/:id',    authMiddleware, vendorsCtrl.getById.bind(vendorsCtrl)       );
// router.delete('/djs/:id',    authMiddleware, vendorsCtrl.deleteItem.bind(vendorsCtrl)   );

// // Scraping endpoints:
// router.post(  '/djs/find',   authMiddleware, vendorsCtrl.find        );
// router.post(  '/djs/scrape', authMiddleware, vendorsCtrl.scrape      );

// export default router;

// src/routes/vendor-routes.ts

import express from "express";
import { vendorController } from "../controllers/vendor-controller";
import authMiddleware  from "../common/auth-middleware";
import { auth } from "google-auth-library";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Research routes
router.post("/ai-research",authMiddleware, vendorController.processResearchTask);

// CRUD routes
router.get("/", authMiddleware, vendorController.getAll);
router.get("/:id", authMiddleware, vendorController.getById);
router.get("/mine", authMiddleware, vendorController.getMine);
router.delete("/:id", authMiddleware, vendorController.deleteItem);

// Additional routes
router.get("/type/:type", authMiddleware, vendorController.getByType);
router.get("/search", authMiddleware, vendorController.search);


router.post("/research/background",authMiddleware, vendorController.startBackgroundResearch);


export default router;