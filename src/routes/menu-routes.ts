import express from "express";
import menuController from "../controllers/menu-controller";
import authMiddleware from "../common/auth-middleware";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Custom endpoints
router.post("/upload-background", menuController.uploadBackground, (req, res) => menuController.handleUploadBackground(req, res));

router.post("/background", menuController.generateBackground);
router.put("/dishes", menuController.updateDishes);
router.put("/save", menuController.saveMenuFiles);
router.post("/", menuController.createMenu);
// Standard CRUD
router.get("/:userId", menuController.getMine.bind(menuController));

router.get("/", menuController.getAll.bind(menuController));
router.put("/:id", menuController.updateItem.bind(menuController));
router.delete("/:id", menuController.deleteItem.bind(menuController));

export default router;