// src/controllers/menu-controller.ts

import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import Menu, { IMenu } from "../models/menu-model";
import menuService from "../services/menu-service";
import { BaseController } from "./base-controller";
import { AuthRequest } from "../common/auth-middleware";

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

      // יוצרים את התפריט במסד הנתונים עם הנתיב לשרת
      const menu = await menuService.createOrUpdateMenuWithBackground(
        userId,
        coupleNames,
        designPrompt,
        backgroundUrl
      );

      res.status(201).json(menu);
    } catch (error) {
      console.error("createMenuWithBackground error:", error);
      res.status(500).json({ error: "Failed to create menu with background" });
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
        res.status(404).json({ error: "Menu not found" });
        return;
      }
      res.json(menu);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Menu not found";
      res.status(404).json({ error: message });
    }
  }


}

export default new MenuController();