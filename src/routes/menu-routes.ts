import express from "express";
import menuController from "../controllers/menu-controller";
import authMiddleware from "../common/auth-middleware";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Menu
 *   description: Menu management API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Dish:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         category:
 *           type: string
 *         isVegetarian:
 *           type: boolean
 *     Menu:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         userId:
 *           type: string
 *         coupleNames:
 *           type: string
 *         designPrompt:
 *           type: string
 *         backgroundUrl:
 *           type: string
 *         dishes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Dish'
 *         finalPng:
 *           type: string
 *           description: Path to the final PNG image
 *         finalCanvasJson:
 *           type: string
 *           description: Path to the final Canvas JSON
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */


/**
 * @swagger
 * /menu/background:
 *   post:
 *     summary: Generate menu background using AI
 *     tags: [Menu]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               prompt:
 *                 type: string
 *     responses:
 *       200:
 *         description: Background URL returned
 *       400:
 *         description: Missing prompt
 *       500:
 *         description: Error generating background
 */
router.post("/background", menuController.generateBackground);

/**
 * @swagger
 * /menu/create-menu:
 *   post:
 *     summary: Create a new menu with background
 *     tags: [Menu]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               coupleNames:
 *                 type: string
 *               designPrompt:
 *                 type: string
 *               backgroundUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Menu created
 *       400:
 *         description: Missing userId or image URL
 *       500:
 *         description: Error creating menu
 */
router.post("/create-menu", menuController.createMenuWithBackground);

/**
 * @swagger
 * /menu/{userId}:
 *   get:
 *     summary: Get menu by userId
 *     tags: [Menu]
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
 *         description: Menu retrieved
 *       404:
 *         description: Menu not found
 */
router.get("/:userId", menuController.getMenuByUserId);

/**
 * @swagger
 * /menu/{userId}/dishes:
 *   put:
 *     summary: Update menu dishes by userId
 *     tags: [Menu]
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
 *               dishes:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Dish'
 *     responses:
 *       200:
 *         description: Dishes updated
 *       404:
 *         description: Menu not found
 *       500:
 *         description: Error updating dishes
 */
router.put('/:userId/dishes', menuController.updateDishesByUserId);

/**
 * @swagger
 * /menu/{userId}/finals:
 *   put:
 *     summary: Update menu finals (final PNG and canvas JSON)
 *     tags: [Menu]
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
 *               finals:
 *                 $ref: '#/components/schemas/Finals'
 *     responses:
 *       200:
 *         description: Finals updated
 *       400:
 *         description: Missing final data
 *       500:
 *         description: Error saving finals
 */
router.put("/:userId/finals", menuController.updateFinals);
export default router;