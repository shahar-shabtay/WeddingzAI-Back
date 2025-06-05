// src/controllers/menu-controller.ts

import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import Menu, { IMenu } from "../models/menu-model";
import menuService from "../services/menu-service";
import { BaseController } from "./base-controller";
import { AuthRequest } from "../common/auth-middleware";
import {downloadImageToServer} from "../common/file-upload";

export class MenuController extends BaseController<IMenu> {
  constructor() {
    super(Menu);
  }

  // Generate menu background via AI
  async generateBackground(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        res.status(400).json({ error: "Prompt required" });
        return;
      }
      const url = await menuService.generateImageViaGPT(prompt);
      res.json({ backgroundUrl: url });
    } catch (err: any) {
      console.error("[MenuController.generateBackground] Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  }


  async createMenuWithBackground(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { userId, coupleNames, designPrompt, backgroundUrl } = req.body;

    if (!userId || !coupleNames || !designPrompt || !backgroundUrl) {
      res.status(400).json({ error: "Missing fields" });
    }

    // מגדירים את התיקייה ושם הקובץ לשמירה
    const folderPath = path.join(__dirname, "../../uploads/menus/backgrounds");
    const fileName = `${userId}.png`;

    // מורידים ושומרים את התמונה לשרת
    const localImagePath = await downloadImageToServer(backgroundUrl, folderPath, fileName);

    // אם תרצה, ניתן לשמור רק את הנתיב היחסי ב־DB (למשל ללא __dirname)
    const relativePath = `/uploads/menus/backgrounds/${fileName}`;

    // יוצרים את התפריט במסד הנתונים עם הנתיב לשרת
    const menu = await menuService.createMenuWithBackground(
      userId,
      coupleNames,
      designPrompt,
      relativePath
    );

    res.status(201).json(menu);
  } catch (error) {
    console.error("createMenuWithBackground error:", error);
    res.status(500).json({ error: "Failed to create menu with background" });
  }
}


}

export default new MenuController();