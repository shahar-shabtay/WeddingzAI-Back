import { Response } from "express";
import { BaseController } from "./base-controller";
import Invitation, { IInvitation } from "../models/invitation-model";
import { AuthRequest } from "../common/auth-middleware";
import invitationService from "../services/invitation-service";
import { data } from "cheerio/dist/commonjs/api/attributes";

class InvitationController extends BaseController<IInvitation> {
  constructor() {
    super(Invitation);
  }

  async createInvitation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const prompt = req.body.prompt;
      const userId = req.user?._id; 

      if (!prompt || !userId) {
        res.status(400).json({message: "Missing prompt or user ID"});
        return;
      }

      const image = await invitationService.createInvitation(userId, prompt);
      res.status(200).json({message: "success", data:image});
    } catch (error) {
      console.error("❌ Error creating invitation:", error);
      res.status(500).json({message: error});
    }
  }
}

export default new InvitationController();