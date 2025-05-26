// src/controllers/menu-controller.ts
import { Response } from "express";
import { BaseController } from "./base-controller";
import Menu, { IMenu } from "../models/menu-model";
import { AuthRequest } from "../common/auth-middleware";
import menuService from "../services/menu-service";

class MenuController extends BaseController<IMenu> {
  constructor() {
    super(Menu);
  }

  async createMenu(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { coupleNames, designPrompt, dishes } = req.body;
      const userId = req.user?._id;

      if (!coupleNames || !designPrompt || !dishes || !userId) {
        res.status(400).json({ message: "Missing required fields" });
        return;
      }

      if (!Array.isArray(dishes) || dishes.length === 0) {
        res.status(400).json({ message: "At least one dish is required" });
        return;
      }

      const menu = await menuService.createMenu(userId, coupleNames, designPrompt, dishes);
      res.status(200).json({ message: "success", data: menu });
    } catch (error) {
      console.error("❌ Error creating menu:", error);
      res.status(500).json({ message: error });
    }
  }
}

export default new MenuController();