import express from "express";
import menuController from "../controllers/menu-controller";
import authMiddleware from "../common/auth-middleware";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);


router.post("/background", menuController.generateBackground);
router.post("/create-menu", menuController.createMenuWithBackground);
router.get("/:userId", menuController.getMenuByUserId);
router.put('/:userId/dishes', menuController.updateDishesByUserId);
router.put("/:userId/finals", menuController.updateFinals);
export default router;