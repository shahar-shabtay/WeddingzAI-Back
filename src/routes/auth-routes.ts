import express from "express";
// import { authMiddleware } from "../controllers/auth-controller";
import authMiddleware from "../common/auth-middleware";
import authController from "../controllers/auth-controller";

const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: API for user authentication (register, login, logout, refresh token, update user, reset password, google authntication)
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         firstPartner:
 *           type: string
 *           description: First partner's name
 *         secondPartner:
 *          type: string
 *          description: Second partner's name
 *         email:
 *           type: string
 *           description: The user email
 *         password:
 *           type: string
 *           description: The user password
 *         avatar:
 *           type: string
 *           description: The user avatar url
 *         weddingDate:
 *           type: string
 *           description: The wedding date
 *         weddingVenue:
 *           type: string
 *           description: The wedding venue
 *       example:
 *         firstPartner: 'Gabi'
 *         secondPartner: 'Michal'
 *         email: 'gabi@gmail.com'
 *         password: 'password123'
 *         avatar: ''
 *         weddingDate: '2025-06-15'
 *         weddingVenue: 'Tel Aviv Beach'
 */


/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       description: User registration details
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User registered successfully
 *         content:
 *            application/json:
 *             schema:
 *              $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input data (Password too short, email already exists)
 *       500:
 *         description: Internal server error
 */
router.post("/auth/register", authController.register);


/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login an existing user
 *     tags: [Authentication]
 *     requestBody:
 *       description: User login details (email and password)
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "gabi@gmail.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: User logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 _id:
 *                   type: string
 *                 firstPartner:
 *                    type: string
 *                 secondPartner:
 *                    type: string
 *                 email:
 *                    type: string
 *                 avatar:
 *                    type: string
 *                 weddingDate:
 *                    type: string
 *                 weddingVenue:
 *                    type: string
 *                 bookingVendors:
 *                    type: array
 *       400:
 *         description: Invalid credentials
 *       500:
 *         description: Internal server error
 */
router.post("/auth/login", authController.login);


/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout the current user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json: 
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *             required:
 *               - refreshToken
 *     responses:
 *       200:
 *         description: User logged out successfully
 *         content:
 *          application/json:
 *           schema:
 *            type: object
 *            properties:
 *              message:
 *                type: string
 *                example: "Logged Out"
 *       400:
 *         description: Bad request (missing or invalid refresh token, user not found)
 *       403:
 *         description: Invalid Token
 *       500:
 *         description: Internal server error
 */
router.post("/auth/logout", authController.logout);


/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh the access token for the user
 *     tags: [Authentication]
 *     requestBody:
 *       description: Token refresh details
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Access token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 refreshToken:
 *                   type: string
 *                 accessToken:
 *                   type: string
 *                 _id:
 *                   type: string
 *       400:
 *         description: Invalid refresh token
 *       403:
 *         description: Token expired or invalid
 *       500:
 *         description: Internal server error
 */
router.post("/auth/refresh", authController.refresh);


/**
 * @swagger
 * /auth/user:
 *   put:
 *     summary: Update the user details
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: User updated details
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "gabinew@gmail.com"
 *               firstPartner:
 *                 type: string
 *                 example: "New First Partner Name"
 *               secondPartner:
 *                 type: string
 *                 example: "New Second Partner Name"
 *               avatar:
 *                 type: string
 *                 format: uri
 *                 example: "/storage/newAvatar.jpg"
 *               weddingDate:
 *                 type: string
 *                 example: "2026-06-15"
 *               weddingVenue:
 *                 type: string
 *                 example: "New Wedding Venue"

 *     responses:
 *       200:
 *         description: User updated successfully 
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 email:
 *                   type: string
 *                 firstPartner:
 *                   type: string
 *                 secondPartner:
 *                   type: string
 *                 avatar:
 *                   type: string
 *                 weddingDate:
 *                   type: string
 *                 weddingVenue:
 *                   type: string
 * 
 *       404:
 *         description: User not found or Email already taken
 *       401:
 *         description: Token expired
 *       403:
 *         description: Invalid Token
 *       500:
 *         description: Internal server error
 */
router.put("/auth/user", authMiddleware, authController.updateUser);


/**
 * @swagger
 * /auth/google:
 *   post:
 *     summary: Authenticate or register a user using Google Sign-In
 *     tags: [Authentication]
 *     requestBody:
 *       description: Google OAuth credential token
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - credential
 *             properties:
 *               credential:
 *                 type: string
 *                 description: The Google OAuth ID token
 *     responses:
 *       200:
 *         description: User authenticated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 _id:
 *                   type: string
 *                 firstPartner:
 *                    type: string
 *                 secondPartner:
 *                    type: string
 *                 email:
 *                    type: string
 *                 avatar:
 *                    type: string
 *                 weddingDate:
 *                    type: string
 *                 weddingVenue:
 *                    type: string
 *                 bookingVendors:
 *                    type: array
 *       400:
 *         description: Google token verification failed or missing configuration
 *       500:
 *         description: Internal server error
 */
router.post("/auth/google", authController.googleSignIn);


/**
 * @swagger
 * /auth/resetpass:
 *   put:
 *     summary: Update the user password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: User password reset details
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: "newPassword123"
 *     responses:
 *       200:
 *         description: Password updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password updated successfully"
 *       400:
 *         description: Invalid input data (Old password incorrect, new password too short)
 *       401:
 *         description: Token expired
 *       403:
 *         description: Invalid Token
 *       404: 
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.put("/auth/resetpass", authMiddleware, authController.updatePassword);


/** 
 * @swagger
 * /auth/prem:
 *   get:
 *     summary: Get the user's premium status
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's premium status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                isPremium:
 *                 type: boolean
 *                 example: true
 *                message:
 *                  type: string
 *                  example: "User is premium"
 *       401:
 *         description: Token expired
 *       403:
 *         description: Invalid Token
 *       404: 
 *         description: User not found
 *       500:
 *         description: Internal server error
*/ 
router.get("/auth/prem", authMiddleware, authController.getUserPremiumStatus);

export default router;
