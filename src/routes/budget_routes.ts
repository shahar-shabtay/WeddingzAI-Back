import express, { Router } from "express";
import budgetController from "../controllers/budget_controller";
import authMiddleware from "../common/auth-middleware";

/**
 * @swagger
 * tags:
 *   name: Budget
 *   description: API for managing event budget
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     Budget:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Budget ID
 *         user:
 *           type: string
 *           description: User ID
 *         totalBudget:
 *           type: number
 *           description: Total budget amount
 *         categories:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *                 description: Category entry ID
 *               name:
 *                 type: string
 *               amount:
 *                 type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       example:
 *         _id: "64a1fabc1234567890def123"
 *         user: "64a1faa1234567890defabc"
 *         totalBudget: 5000
 *         categories:
 *           - _id: "68306f3a7ab535ba6c001425"
 *             name: "Venue"
 *             amount: 2000
 *           - _id: "6835e224907c9d684391643"
 *             name: "Catering"
 *             amount: 1500
 *         createdAt: "2025-06-14T12:34:56.789Z"
 *         updatedAt: "2025-06-14T12:34:56.789Z"
 *     BudgetInput:
 *       type: object
 *       required:
 *         - totalBudget
 *         - categories
 *       properties:
 *         totalBudget:
 *           type: number
 *           description: Total budget amount to set
 *         categories:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               amount:
 *                 type: number
 *       example:
 *         totalBudget: 63
 *         categories:
 *           - name: "DJ"
 *             amount: 3
 *           - name: "asd"
 *             amount: 1
 */

const router = express.Router();

// All routes are protected with authentication

/**
 * @swagger
 * /budget:
 *   post:
 *     summary: Create or set the budget for the event
 *     tags: [Budget]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Budget'
 *           example:
 *             totalBudget: 50000
 *     responses:
 *       201:
 *         description: Budget created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Budget'
 */
router.post(
  "/",
  authMiddleware,
  budgetController.create.bind(budgetController)
);

/**
 * @swagger
 * /budget:
 *   get:
 *     summary: Get the current event budget
 *     tags: [Budget]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current budget retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Budget'
 */
router.get(
  "/",
  authMiddleware,
  budgetController.getBudget.bind(budgetController)
);

/**
 * @swagger
 * /budget:
 *   put:
 *     summary: Update the event budget
 *     tags: [Budget]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Budget'
 *           example:
 *             totalBudget: 50000
 *             categories:
 *               - name: "DJ"
 *                 amount: 1500
 *     responses:
 *       200:
 *         description: Budget updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Budget'
 */
router.put("/", authMiddleware, budgetController.update.bind(budgetController));

export default router;
