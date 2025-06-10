import express from "express";
import invitationController from "../controllers/invitation-controller";
import authMiddleware from "../common/auth-middleware";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);


router.post("/background", invitationController.generateBackground);
router.post("/create-invitation", invitationController.createInvitationWithBackground);
router.get("/:userId", invitationController.getInvitationByUserId);
router.put('/:userId/sentences', invitationController.updateSentencesByUserId);
router.put('/:userId/hours', invitationController.updateHoursByUserId);
router.put("/:userId/finals", invitationController.updateFinals);
export default router;