import express from "express";
import multer from "multer";
import authMiddleware from "../common/auth-middleware";
import tdlController from "../controllers/tdl-controller";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Todo List
 *   description: API for managing wedding todo lists (TDLs)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Todo:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         task:
 *           type: string
 *         dueDate:
 *           type: string
 *           format: date-time
 *         priority:
 *           type: string
 *           enum: [Low, Medium, High]
 *         done:
 *           type: boolean
 *
 *     Section:
 *       type: object
 *       properties:
 *         sectionName:
 *           type: string
 *         todos:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Todo'
 *
 *     TDL:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         userId:
 *           type: string
 *         tdl:
 *           type: object
 *           properties:
 *             weddingDate:
 *               type: string
 *               format: date-time
 *             sections:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Section'
 */


// POST
/**
 * @swagger
 * /tdl/upload-form:
 *   post:
 *     summary: Upload wedding preferences file and generate To-Do list
 *     tags: [Todo List]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: |
 *                   Upload a JSON file with the following structure:
 *                   
 *                   ```json
 *                   {
 *                     "firstPartner": "Gabi",
 *                     "secondPartner": "Michal",
 *                     "hasDateAndVenue": "",
 *                     "weddingDate": "",
 *                     "venue": "",
 *                     "guestCount": "Under 100",
 *                     "weddingStyle": "",
 *                     "venueType": "Garden / Outdoor 🌳",
 *                     "dateRange": "October–December 🍂",
 *                     "importantPart": "Ceremony 💍",
 *                     "planningPriority": "Budget 💸",
 *                     "mustHave": "Photo Booth 📸",
 *                     "ceremonyTime": "Morning 🌞",
 *                     "additionalNotes": ""
 *                   }
 *                   ```
 *                   
 *                   Make sure the file has `.json` extension and contains valid JSON.
 *     responses:
 *       200:
 *         description: To-Do list created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: To-Do list created
 *                 data:
 *                   $ref: '#/components/schemas/TDL'
 *       400:
 *         description: No file uploaded
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/upload-form", upload.single("file"),
  (req, res, next) => tdlController.upload(req, res, next)); // Create new TDL.


/**
 * @swagger
 * /tdl/task:
 *   post:
 *     summary: Add a new task to the user's wedding task list
 *     tags: [Todo List]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - task
 *             properties:
 *               task:
 *                 type: string
 *                 example: "Book wedding photographer"
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-08-10"
 *               priority:
 *                 type: string
 *                 enum: [Low, Medium, High]
 *                 example: "High"
 *     responses:
 *       200:
 *         description: Task added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Task added
 *                 data:
 *                   $ref: '#/components/schemas/TDL'
 *       400:
 *         description: Missing task text
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: TDL not found or section not found
 *       500:
 *         description: Internal server error
 */
router.post("/task", tdlController.addTask); // Add Task to TDL


// GET
/**
 * @swagger
 * /tdl:
 *   get:
 *     summary: Get all TDLs
 *     tags: [Todo List]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved all TDLs
 *       500:
 *         description: Internal server error
 */
router.get("/", tdlController.getAll.bind(tdlController)); // Get all TDLs


/**
 * @swagger
 * /tdl/mine:
 *   get:
 *     summary: Get user's TDLs
 *     tags: [Todo List]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user's TDLs
 *       500:
 *         description: Internal server error
 */
router.get("/mine", tdlController.getMine.bind(tdlController)); // Get user TDL


/**
 * @swagger
 * /tdl/{id}:
 *   get:
 *     summary: Get TDL by ID
 *     tags: [Todo List]
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
 *         description: Successfully retrieved TDL by ID
 *       400:
 *         description: Invalid ObjectId
 *       404:
 *         description: TDL not found
 */
router.get("/:id", tdlController.getById.bind(tdlController)); // Get by TDL by ID


// DELETE
/**
 * @swagger
 * /tdl/task:
 *   delete:
 *     summary: Delete a task from a To‑Do List
 *     tags: [Todo List]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Section name and ID of the task to delete
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sectionName:
 *                 type: string
 *                 description: Name of the section containing the task
 *               todoId:
 *                 type: string
 *                 description: The ID of the task to delete
 *             required:
 *               - sectionName
 *               - todoId
 *             example:
 *               sectionName: "Planning"
 *               todoId: "60c72b2f9b1e8b42d8fa3a10"
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Task updated
 *                 data:
 *                   $ref: '#/components/schemas/TDL'
 *       400:
 *         description: Missing fields or invalid request
 *       401:
 *         description: Unauthorized (no or invalid token)
 *       404:
 *         description: Task not found
 *       500:
 *         description: Internal server error
 */
router.delete("/task", tdlController.deleteTask); // Delete Task from TDL


// PUT
/**
 * @swagger
 * /tdl/task:
 *   put:
 *     summary: Update a task in the To‑Do List
 *     tags: [Todo List]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Task ID, current section name, and updated task data
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - todoId
 *               - sectionName
 *               - updates
 *             properties:
 *               todoId:
 *                 type: string
 *                 example: 665f1a2c3d98e213a1cd4f9a
 *               sectionName:
 *                 type: string
 *                 example: Planning
 *               updates:
 *                 type: object
 *                 properties:
 *                   task:
 *                     type: string
 *                     example: Book photographer
 *                   dueDate:
 *                     type: string
 *                     format: date-time
 *                     example: 2025-06-15T00:00:00.000Z
 *                   priority:
 *                     type: string
 *                     enum: [Low, Medium, High]
 *                     example: Medium
 *                   done:
 *                     type: boolean
 *                     example: false
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Task updated
 *                 data:
 *                   $ref: '#/components/schemas/TDL'
 *       400:
 *         description: Missing fields for update
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Todo or section not found
 *       500:
 *         description: Internal server error
 */
router.put("/task", tdlController.updateTask); // Update Task in TDL


/**
 * @swagger
 * /tdl/date:
 *   put:
 *     summary: Update the wedding date and auto-reschedule all tasks
 *     tags: [Todo List]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newWeddingDate
 *             properties:
 *               newWeddingDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-09-14"
 *     responses:
 *       200:
 *         description: Wedding date updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Wedding date updated
 *                 data:
 *                   $ref: '#/components/schemas/TDL'
 *       400:
 *         description: Invalid wedding date format
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: TDL not found for user
 *       500:
 *         description: Internal server error
 */
router.put("/date", tdlController.updateWeddingDate); // Update Wedding Date

// PATCH
/**
 * @swagger
 * /tdl/done:
 *   patch:
 *     summary: Mark a task as done or not done
 *     tags: [Todo List]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sectionName
 *               - todoId
 *               - done
 *             properties:
 *               sectionName:
 *                 type: string
 *                 example: "1-2 months before"
 *               todoId:
 *                 type: string
 *                 example: "60f6d2a67f1b2a001cc8d4c1"
 *               done:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Task completion status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Task completion status updated
 *                 data:
 *                   $ref: '#/components/schemas/TDL'
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Task or section not found
 *       500:
 *         description: Internal server error
 */
router.patch("/done", tdlController.setTaskDone);// Mark Task Done

export default router;