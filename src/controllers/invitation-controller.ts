// invitation-controller.ts
import { Response } from "express";
import axios from "axios";
import { BaseController } from "./base-controller";
import Invitation, { IInvitation } from "../models/invitation-model";
import { AuthRequest } from "../common/auth-middleware";

class InvitationController extends BaseController<IInvitation> {
  constructor() {
    super(Invitation);
  }

  // Change to arrow function to preserve 'this' context
  createInvitation = async (req: AuthRequest, res: Response): Promise<void> => {
    const prompt = req.body.prompt;
    const userId = req.user?._id;
  
    if (!prompt || !userId) {
      this.sendError(res, "Missing prompt or user ID", 400);
      return;
    }
  
    try {
      console.log("🎨 Generating invitation with prompt:", prompt);
  
      const response = await axios.post(
        'https://api.openai.com/v1/images/generations',
        {
          model: 'dall-e-3',
          prompt,
          n: 1,
          size: '1024x1024',
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.DALLE_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );
  
      const imageUrl = response.data.data[0].url;
  
      if (!imageUrl) {
        console.error("❌ No image URL returned from DALL·E");
        this.sendError(res, "Image generation failed", 500);
        return;
      }
  
      const savedInvitation = await this.model.create({
        userId,
        prompt,
        imageUrl,
      });
  
      console.log("✅ Invitation saved:", savedInvitation);
      this.sendSuccess(res, savedInvitation, "Invitation created");
    } catch (error) {
      console.error("❌ Error generating invitation:", error);
      this.sendError(res, error, 500);
    }
  }
}

export default new InvitationController();