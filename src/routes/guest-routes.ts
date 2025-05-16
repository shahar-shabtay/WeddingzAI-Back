// src/routes/guest-routes.ts

import { Router } from 'express';
import authMiddleware from '../common/auth-middleware';
import guestsController from '../controllers/guest-controller';

const router = Router();

// CRUD via BaseController
router.get(    '/guests',             authMiddleware, guestsController.getAll.bind(guestsController));
router.get(    '/guests/mine',        authMiddleware, guestsController.getMine.bind(guestsController));
router.get(    '/guests/:id',         authMiddleware, guestsController.getById.bind(guestsController));

router.post(   '/guests',             authMiddleware, guestsController.create);
router.post(   '/guests/send-invitation', authMiddleware, guestsController.sendInvitation);

router.delete( '/guests/:id',         authMiddleware, guestsController.remove); 

router.put(    '/guests/:id',         authMiddleware, guestsController.update);

export default router;