import express from "express";
import { authMiddleware } from "../controllers/auth_controller";
import authController from "../controllers/auth_controller";

const router = express.Router();

router.post("/register", authController.register);

router.post("/login", authController.login);

router.post("/logout", authController.logout);

router.post("/refresh", authController.refresh);

router.put("/user", authMiddleware, authController.updateUser);

router.post("/google", authController.googleSignIn);

export default router;
