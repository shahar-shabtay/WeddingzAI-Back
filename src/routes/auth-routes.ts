import express from "express";
// import { authMiddleware } from "../controllers/auth-controller";
import authMiddleware from "../common/auth-middleware";
import authController from "../controllers/auth-controller";

const router = express.Router();

router.post("/auth/register", authController.register);

router.post("/auth/login", authController.login);

router.post("/auth/logout", authController.logout);

router.post("/auth/refresh", authController.refresh);

router.put("/auth/user", authMiddleware, authController.updateUser);

router.post("/auth/google", authController.googleSignIn);

router.put("/auth/resetpass", authMiddleware, authController.updatePassword);

router.get("/auth/prem", authMiddleware, authController.getUserPremiumStatus);

export default router;
