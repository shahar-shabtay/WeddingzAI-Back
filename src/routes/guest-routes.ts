import { Router } from "express";
import authMiddleware from "../common/auth-middleware";
import guestsController from "../controllers/guest-controller";

const router = Router();

// Public RSVP route
router.get("/rsvp", guestsController.rsvpResponse);
router.get("/rsvp-response", guestsController.rsvpResponse);
router.post("/rsvp-response", guestsController.rsvpResponse);

// Authenticated routes
router.get(
  "/",
  authMiddleware,
  guestsController.getAll.bind(guestsController)
);
router.get(
  "/mine",
  authMiddleware,
  guestsController.getMine.bind(guestsController)
);
router.get(
  "/:id",
  authMiddleware,
  guestsController.getById.bind(guestsController)
);

router.post("/", authMiddleware, guestsController.create);
router.post(
  "/send-invitation",
  authMiddleware,
  guestsController.sendInvitation
);

router.delete("/:id", authMiddleware, guestsController.remove);
router.put("/:id", authMiddleware, guestsController.update);

router.patch(
  "/assign",
  authMiddleware,
  guestsController.assignGuestToTable
);

router.patch(
  "/unassign",
  authMiddleware,
  guestsController.unassignGuest
);

export default router;
