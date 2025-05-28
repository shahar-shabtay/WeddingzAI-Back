import { Router } from 'express';
import authMiddleware from '../common/auth-middleware';
import guestsController from '../controllers/guest-controller';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Public RSVP route
router.get('/rsvp', guestsController.rsvpResponse);
router.get('/rsvp-response', guestsController.rsvpResponse);
router.post('/rsvp-response', guestsController.rsvpResponse);

// Authenticated routes
router.get('/', guestsController.getAll.bind(guestsController));
router.get('/mine', guestsController.getMine.bind(guestsController));
router.get('/:id', guestsController.getById.bind(guestsController));

router.post('/', guestsController.create);
router.post('/send-invitation', guestsController.sendInvitation);

router.delete('/:id', guestsController.remove); 
router.put('/:id', guestsController.update);

export default router;
