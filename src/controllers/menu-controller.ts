// src/controllers/menu-controller.ts

import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import Menu, { IMenu } from "../models/menu-model";
import menuService from "../services/menu-service";
import { BaseController } from "./base-controller";
import { AuthRequest } from "../common/auth-middleware";
import { saveImageLocally } from "../common/file-upload";

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


  async createMenuWithBackground(req: Request, res: Response): Promise<void> {
    const { userId, backgroundUrl, coupleNames, designPrompt } = req.body;

    if (!userId || !backgroundUrl) {
      res.status(400).json({ message: "Missing userId or image URL" });
      return;
    }

    try {
      // הגדרת נתיב שמירה מקומי מלא
      const saveDir = path.join(process.cwd(), `/uploads/menu/${userId}`);

      const publicPathPrefix = `/uploads/menu/${userId}/background.png`;
      const filename = `background.png`;
      const localImagePath = await saveImageLocally(backgroundUrl, saveDir, publicPathPrefix, filename);

      const menu = await menuService.createOrUpdateMenuWithBackground(
        userId,
        coupleNames,
        designPrompt,
        publicPathPrefix
      );
      res.json({ message: "Menu created with background", backgroundUrl: localImagePath });
    } catch (error) {
      console.error("Error creating menu with background:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async updateDishesByUserId(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.params.userId;
    const dishes = req.body.dishes;

    if (!userId || !Array.isArray(dishes)) {
      res.status(400).json({ error: 'Missing userId or invalid dishes' });
      return;
    }

    const menu = await menuService.updateDishesByUserId(userId, dishes);

    if (!menu) {
      res.status(404).json({ error: 'Menu not found' });
      return;
    }

    res.json(menu);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update dishes' });
  }
}

  async getMenuByUserId(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;
      const menu = await menuService.getMenuByUserId(userId);
      if (!menu) {
        res.status(200).json(null);
        return;
      }
      res.json(menu);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Menu not found";
      res.status(404).json({ error: message });
    }
  }

  async updateFinals(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { finals } = req.body;

      if (!finals || !finals.finalPng || !finals.finalCanvasJson) {
        res.status(400).json({ error: "Missing final data" });
        return;
      }

      const updatedMenu = await menuService.updateFinals(userId, finals);

      res.json({ success: true, menu: updatedMenu });
      return;
    } catch (error) {
      console.error("Error saving finals:", error);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
  }
}

export default new MenuController();

