// src/routes/menu-routes.ts
import express from 'express';
import menuController from '../controllers/menu-controller';
import authMiddleware from '../common/auth-middleware';

const router = express.Router();

router.post('/create', authMiddleware, menuController.createMenu);

export default router;