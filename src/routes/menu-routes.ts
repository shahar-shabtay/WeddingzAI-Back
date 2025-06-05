import express from "express";
import menuController from "../controllers/menu-controller";
import authMiddleware from "../common/auth-middleware";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);


router.post("/background", menuController.generateBackground);
router.post("/create-menu", menuController.createMenuWithBackground);
router.get("/user/:userId", menuController.getMenuByUserId);
router.put('/user/:userId/dishes', menuController.updateDishesByUserId);
export default router;