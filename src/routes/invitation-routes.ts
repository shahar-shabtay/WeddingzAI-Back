import express from 'express';
import invitationController from '../controllers/invitation-controller';
import authMiddleware from '../common/auth-middleware';

const router = express.Router();

router.post('/invitation/create', authMiddleware, invitationController.createInvitation);

export default router;
