import express from 'express';
import * as controller from '../controllers/calendar-controller';
import authMiddleware from '../common/auth-middleware';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Calendar
 *   description: Calendar management API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Calendar:
 *       type: object
 *       required:
 *         - title
 *         - date
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         date:
 *           type: string
 *         desription:
 *           type: string
 *         color:
 *           type: string
 *       example:
 *         title: "Book DJ"
 *         date: "10-10-2025"
 *         description: "book a cheap dj"
 *         color: "blue"
 */


/**
 * @swagger
 * /calendar/{userId}/events:
 *   get:
 *     summary: Get all events for a user
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of events
 *       404:
 *         description: Calendar not found
 */
router.get('/:userId/events', controller.getEvents);

/**
 * @swagger
 * /calendar/{userId}/events:
 *   post:
 *     summary: Create a new event
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               date:
 *                 type: string
 *               description:
 *                 type: string
 *               color:
 *                 type: string
 *     responses:
 *       201:
 *         description: Event created
 *       500:
 *         description: Error creating event
 */
router.post('/:userId/events', controller.createEvent);

/**
 * @swagger
 * /calendar/{userId}/events/{eventId}:
 *   put:
 *     summary: Update an existing event
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               date:
 *                 type: string
 *               description:
 *                 type: string
 *               color:
 *                 type: string
 *     responses:
 *       200:
 *         description: Event updated
 *       500:
 *         description: Error updating event
 */
router.put('/:userId/events/:eventId', controller.updateEvent);

/**
 * @swagger
 * /calendar/{userId}/events/{eventId}:
 *   delete:
 *     summary: Delete an event
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Event deleted
 *       500:
 *         description: Error deleting event
 */
router.delete('/:userId/events/:eventId', controller.deleteEvent);

export default router;