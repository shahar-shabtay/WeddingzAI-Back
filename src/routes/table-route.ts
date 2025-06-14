import express from "express";
import tableController from "../controllers/table-controller";
import auth from "../common/auth-middleware";

/**
 * @swagger
 * tags:
 *   name: Tables
 *   description: API for managing wedding tables
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     Table:
 *       type: object
 *       required:
 *         - id
 *         - seats
 *       properties:
 *         id:
 *           type: string
 *           description: Unique table identifier
 *         seats:
 *           type: integer
 *           description: Number of seats at the table
 *         location:
 *           type: string
 *           description: Description of table location
 *       example:
 *         id: "1"
 *         seats: 8
 *         location: "Near window"
 */

const router = express.Router();

router.use(auth);

/**
 * @swagger
 * /tables/mine:
 *   get:
 *     summary: Get tables assigned to the current user
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tables
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Table'
 */
router.get("/mine", tableController.getMine.bind(tableController));

/**
 * @swagger
 * /tables/available/{guestCount}:
 *   get:
 *     summary: Get available tables for a given guest count
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: guestCount
 *         required: true
 *         schema:
 *           type: integer
 *         description: Number of guests
 *     responses:
 *       200:
 *         description: Available tables
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Table'
 */
router.get(
  "/available/:guestCount",
  tableController.getAvailableTables.bind(tableController)
);

/**
 * @swagger
 * /tables/{id}:
 *   get:
 *     summary: Get a table by ID
 *     tags: [Tables]
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
 *         description: Table object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Table'
 *       404:
 *         description: Table not found
 */
router.get("/:id", tableController.getById.bind(tableController));

/**
 * @swagger
 * /tables:
 *   get:
 *     summary: Get all tables
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all tables
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Table'
 */
router.get("/", tableController.getAll.bind(tableController));

/**
 * @swagger
 * /tables/{id}:
 *   delete:
 *     summary: Delete a table by ID
 *     tags: [Tables]
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
 *         description: Table deleted
 *       404:
 *         description: Table not found
 */
router.delete("/:id", tableController.deleteTable.bind(tableController));

/**
 * @swagger
 * /tables:
 *   post:
 *     summary: Create a new table
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Table'
 *     responses:
 *       201:
 *         description: Table created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Table'
 */
router.post("/", tableController.createItem.bind(tableController));

/**
 * @swagger
 * /tables/{id}:
 *   patch:
 *     summary: Update a table by ID
 *     tags: [Tables]
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
 *             $ref: '#/components/schemas/Table'
 *     responses:
 *       200:
 *         description: Table updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Table'
 *       404:
 *         description: Table not found
 */
router.patch("/:id", tableController.updateItem.bind(tableController));

export default router;
