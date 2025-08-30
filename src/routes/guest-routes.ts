import { Router } from "express";
import authMiddleware from "../common/auth-middleware";
import guestsController from "../controllers/guest-controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Guests
 *   description: API for managing wedding guests and invitations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Guest:
 *       type: object
 *       required:
 *         - name
 *         - email
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *         table:
 *           type: string
 *         rsvpStatus:
 *           type: string
 *           enum: [pending, accepted, declined]
 *       example:
 *         name: "John Doe"
 *         email: "john@example.com"
 *         phone: "+1234567890"
 *         table: "Table 5"
 *         rsvpStatus: "accepted"
 */

/**
 * @swagger
 * /guests/rsvp:
 *   get:
 *     summary: Public RSVP entry point
 *     tags: [Guests]
 *     responses:
 *       200:
 *         description: Public RSVP response page or data
 */
router.get("/rsvp", guestsController.rsvpResponse);

/**
 * @swagger
 * /guests/rsvp-response:
 *   get:
 *     summary: Get RSVP response (public)
 *     tags: [Guests]
 *     responses:
 *       200:
 *         description: RSVP response processed
 *   post:
 *     summary: Submit RSVP response (public)
 *     tags: [Guests]
 *     requestBody:
 *       description: RSVP form submission
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               guestId:
 *                 type: string
 *               rsvpStatus:
 *                 type: string
 *                 enum: [accepted, declined]
 *     responses:
 *       200:
 *         description: RSVP updated
 */
router.get("/rsvp-response", guestsController.rsvpResponse);
router.post("/rsvp-response", guestsController.rsvpResponse);

/**
 * @swagger
 * /guests:
 *   get:
 *     summary: Get all guests (admin)
 *     tags: [Guests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all guests
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Guest'
 */
router.get("/", authMiddleware, guestsController.getAll.bind(guestsController));

/**
 * @swagger
 * /guests/mine:
 *   get:
 *     summary: Get guests related to the current user
 *     tags: [Guests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's guests
 */
router.get("/mine", authMiddleware, guestsController.getMine.bind(guestsController));

/**
 * @swagger
 * /guests/{id}:
 *   get:
 *     summary: Get guest by ID
 *     tags: [Guests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Guest data
 *       404:
 *         description: Guest not found
 */
router.get("/:id", authMiddleware, guestsController.getById.bind(guestsController));

/**
 * @swagger
 * /guests:
 *   post:
 *     summary: Create a new guest
 *     tags: [Guests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Guest'
 *     responses:
 *       201:
 *         description: Guest created
 */
router.post("/", authMiddleware, guestsController.create);

/**
 * @swagger
 * /guests/send-invitation:
 *   post:
 *     summary: Send invitation to guests
 *     tags: [Guests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               guestIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Invitations sent
 */
router.post("/send-invitation", authMiddleware, guestsController.sendInvitation);

/**
 * @swagger
 * /guests/{id}:
 *   delete:
 *     summary: Delete a guest by ID
 *     tags: [Guests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Guest deleted
 *       404:
 *         description: Guest not found
 */
router.delete("/:id", authMiddleware, guestsController.remove);

/**
 * @swagger
 * /guests/{id}:
 *   put:
 *     summary: Update a guest by ID
 *     tags: [Guests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Guest'
 *     responses:
 *       200:
 *         description: Guest updated
 *       404:
 *         description: Guest not found
 */
router.put("/:id", authMiddleware, guestsController.update);

/**
 * @swagger
 * /guests/assign:
 *   patch:
 *     summary: Assign a guest to a table
 *     tags: [Guests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               guestId:
 *                 type: string
 *               table:
 *                 type: string
 *     responses:
 *       200:
 *         description: Guest assigned
 */
router.patch("/assign", authMiddleware, guestsController.assignGuestToTable);

/**
 * @swagger
 * /guests/unassign:
 *   patch:
 *     summary: Unassign a guest from a table
 *     tags: [Guests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               guestId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Guest unassigned
 */
router.patch("/unassign", authMiddleware, guestsController.unassignGuest);

export default router;
