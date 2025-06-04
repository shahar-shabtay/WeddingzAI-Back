// src/controllers/menu-controller.ts

import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import Menu, { IMenu } from "../models/menu-model";
import menuService from "../services/menu-service";
import { BaseController } from "./base-controller";

// ----- Multer setup -----
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../../uploads/menus/backgrounds"));
  },
  filename: function (req, file, cb) {
    const userId = req.body.userId || "anonymous";
    const ext = path.extname(file.originalname);
    cb(null, `${userId}-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

export class MenuController extends BaseController<IMenu> {
  constructor() {
    super(Menu);
  }

  // Multer middleware for background upload
  uploadBackground = upload.single("file");

  // Handles background image upload
  async handleUploadBackground(req: Request, res: Response) {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    const fileUrl = `/uploads/menus/backgrounds/${req.file.filename}`;
    res.json({ backgroundUrl: fileUrl });
  }

  // Generate menu background via AI
  async generateBackground(req: Request, res: Response): Promise<void> {
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

  // Create menu
  async createMenu(req: Request, res: Response): Promise<void> {
    try {
      const { userId, coupleNames, designPrompt, backgroundUrl } = req.body;
      if (!userId || !coupleNames || !designPrompt || !backgroundUrl) {
        res.status(400).json({ error: "Missing fields" });
        return;
      }
      const menu = await menuService.createMenu(userId, coupleNames, designPrompt, backgroundUrl);
      res.status(201).json(menu);
    } catch (err: any) {
      console.error("[MenuController.createMenu] Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  }

  // Update all dishes in menu
  async updateDishes(req: Request, res: Response): Promise<void> {
    try {
      const { userId, dishes } = req.body;
      if (!userId || !Array.isArray(dishes)) {
        res.status(400).json({ error: "userId & dishes required" });
        return;
      }
      const menu = await menuService.updateDishes(userId, dishes);
      if (!menu) {
        res.status(404).json({ error: "Menu not found" });
        return;
      }
      res.json(menu);
    } catch (err: any) {
      console.error("[MenuController.updateDishes] Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  }

  // Save PNG & PDF to DB
  async saveMenuFiles(req: Request, res: Response): Promise<void> {
    try {
      const { userId, pngBase64, pdfBase64 } = req.body;
      if (!userId || !pngBase64 || !pdfBase64) {
        res.status(400).json({ error: "userId, pngBase64, pdfBase64 required" });
        return;
      }
      const menu = await menuService.saveMenuFiles(userId, pngBase64, pdfBase64);
      if (!menu) {
        res.status(404).json({ error: "Menu not found" });
        return;
      }
      res.json(menu);
    } catch (err: any) {
      console.error("[MenuController.saveMenuFiles] Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  }

}

export default new MenuController();