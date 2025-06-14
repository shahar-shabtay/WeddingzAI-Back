
import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import Invitation, { IInvitation } from "../models/invitation-model";
import invitationService from "../services/invitation-service";
import { BaseController } from "./base-controller";
import { AuthRequest } from "../common/auth-middleware";
import { saveImageLocally } from "../common/file-upload";

export class InvitationController extends BaseController<IInvitation> {
  constructor() {
    super(Invitation);
  }

  // Generate invitation background via AI
  async generateBackground(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        res.status(400).json({ error: "Prompt required" });
        return;
      }
      const url = await invitationService.generateImageViaGPT(prompt);
      res.json({ backgroundUrl: url });
    } catch (err: any) {
      console.error("[InvitationController.generateBackground] Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  }


  async createInvitationWithBackground(req: Request, res: Response): Promise<void> {
    const { userId, backgroundUrl, coupleNames, designPrompt, date , venue} = req.body;
    if (!userId || !backgroundUrl) {
      res.status(400).json({ message: "Missing userId or image URL" });
      return;
    }

    try {
      // הגדרת נתיב שמירה מקומי מלא
      const saveDir = path.join(process.cwd(), `/uploads/invitation/${userId}`);

      const publicPathPrefix = `/uploads/invitation/${userId}/background.png`;
      const filename = `background.png`;
      const localImagePath = await saveImageLocally(backgroundUrl, saveDir, publicPathPrefix, filename);

      const invitation = await invitationService.createOrUpdateInvitationWithBackground(
        userId,
        coupleNames,
        designPrompt,
        publicPathPrefix,
        date,
        venue
      );
      res.json({ message: "Invitation created with background", backgroundUrl: localImagePath });
    } catch (error) {
      console.error("Error creating Invitation with background:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async updateSentencesByUserId(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.params.userId;
    const sentences = req.body.sentences;

    if (!userId || !Array.isArray(sentences)) {
      res.status(400).json({ error: 'Missing userId or invalid sentences' });
      return;
    }

    const invitation = await invitationService.updateSentencesByUserId(userId, sentences);

    if (!invitation) {
      res.status(404).json({ error: 'Invitation not found' });
      return;
    }

    res.json(invitation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update sentences' });
  }
}

async updateHoursByUserId(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.params.userId;
    const ceremonyHour = req.body.ceremonyHour;
    const receptionHour = req.body.receptionHour;

    if (!userId || !receptionHour || !ceremonyHour) {
      res.status(400).json({ error: 'Missing userId or hours' });
      return;
    }

    const invitation = await invitationService.updateHoursByUserId(userId, ceremonyHour, receptionHour);

    if (!invitation) {
      res.status(404).json({ error: 'Invitation not found' });
      return;
    }

    res.json(invitation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update hours' });
  }
}

  async getInvitationByUserId(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;
      const invitation = await invitationService.getInvitationByUserId(userId);
      if (!invitation) {
        res.status(200).json(null);
        return;
      }
      res.json(invitation);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invitation not found";
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

      const updateInvitation = await invitationService.updateFinals(userId, finals);

      res.json({ success: true, invitation: updateInvitation });
      return;
    } catch (error) {
      console.error("Error saving finals:", error);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
  }
}

export default new InvitationController();

