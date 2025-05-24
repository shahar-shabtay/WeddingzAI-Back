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

    jwt.verify(token, secret, (err, data) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          console.log("Access token expired");
          return res.status(401).send({ message: "Token Expired" });
        }
        console.log("Invalid token:", err.message);
        return res.status(403).send({ message: "Invalid Token" });
      }

      req.user = {
        _id: (data as TokenPayload)._id,
        email: (data as TokenPayload).email,
        firstPartner: (data as TokenPayload).firstPartner,
        secondPartner: (data as TokenPayload).secondPartner,
        avatar: (data as TokenPayload).avatar,
      };
      next();
    });

  } catch (error) {
    console.error("Token error:", error);
    res.status(403).json({ message: "Unauthorized: Invalid or expired token" });
  }
};

export default authMiddleware;
