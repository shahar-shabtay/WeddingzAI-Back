import express from "express";
import tableController from "../controllers/table-controller";
import auth from "../common/auth-middleware";

const router = express.Router();

router.use(auth);

router.get("/mine", tableController.getMine.bind(tableController));
router.get(
  "/available/:guestCount",
  tableController.getAvailableTables.bind(tableController)
);
router.get("/:id", tableController.getById.bind(tableController));
router.get("/", tableController.getAll.bind(tableController));
router.delete("/:id", tableController.deleteItem.bind(tableController));
router.post("/", tableController.createItem.bind(tableController));
router.patch("/:id", tableController.updateItem.bind(tableController));

export default router;
