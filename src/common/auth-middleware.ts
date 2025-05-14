// src/middleware/auth-middleware.ts

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { IUser } from "../models/user-model";

export interface AuthRequest extends Request {
  user?: Pick<
    IUser,
    "_id" | "email" | "firstPartner" | "secondPartner" | "avatar"
  >;
}

interface TokenPayload {
  _id: string;
  email: string;
  firstPartner: string;
  secondPartner: string;
  avatar?: string;
}

const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized: No token provided" });
    return;
  }

  const token = authHeader.split(" ")[1];

  const secret = process.env.TOKEN_SECRET;
  if (!secret) {
    res.status(500).json({ message: "Server error: Missing token secret" });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as TokenPayload;

    req.user = {
      _id: decoded._id,
      email: decoded.email,
      firstPartner: decoded.firstPartner,
      secondPartner: decoded.secondPartner,
      avatar: decoded.avatar,
    };

    next();
  } catch (error) {
    console.error("Token error:", error);
    res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
  }
};

export default authMiddleware;
