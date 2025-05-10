import { Router } from 'express';
import authMiddleware from '../common/auth-middleware';
import vendorsCtrl from '../controllers/vendor-controller';

const router = Router();

// CRUD via BaseController:
router.get(   '/djs',        authMiddleware, vendorsCtrl.getAll.bind(vendorsCtrl)      );
router.get(   '/djs/mine',   authMiddleware, vendorsCtrl.getMine.bind(vendorsCtrl)       );
router.get(   '/djs/:id',    authMiddleware, vendorsCtrl.getById.bind(vendorsCtrl)       );
router.delete('/djs/:id',    authMiddleware, vendorsCtrl.deleteItem.bind(vendorsCtrl)   );

// Scraping endpoints:
router.post(  '/djs/find',   authMiddleware, vendorsCtrl.find        );
router.post(  '/djs/scrape', authMiddleware, vendorsCtrl.scrape      );

export default router;