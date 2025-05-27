import express from 'express';
import * as controller from '../controllers/calendar-controller';
import authMiddleware from '../common/auth-middleware';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);


router.get('/:userId/events', controller.getEvents);
router.post('/:userId/events', controller.createEvent);
router.put('/:userId/events/:eventId', controller.updateEvent);
router.delete('/:userId/events/:eventId', controller.deleteEvent);

export default router;