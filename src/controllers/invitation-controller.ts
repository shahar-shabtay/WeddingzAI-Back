import { Response } from "express";
import { OpenAI, RateLimitError } from "openai";
import { BaseController } from "./base-controller";
import Invitation, { IInvitation } from "../models/invitation-model";
import { AuthRequest } from "../common/auth-middleware";

const api = new OpenAI({
  apiKey: process.env.AIMLAPI_KEY,
  baseURL: "https://api.aimlapi.com/v1",
});

class InvitationController extends BaseController<IInvitation> {
  constructor() {
    super(Invitation);
  }

  async createInvitation(req: AuthRequest, res: Response): Promise<void> {
    const prompt = req.body.prompt;
    const userId = this.getUserId(req);
  
    if (!prompt || !userId) {
      this.sendError(res, "Missing prompt or user ID", 400);
      return;
    }
  
    try {
      console.log("🎨 Generating invitation with prompt:", prompt);
  
      const response = await api.images.generate({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1024",
      });
  
      const imageUrl = response.data?.[0]?.url;
  
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
  
      if (error instanceof RateLimitError) {
        this.sendError(res, "Rate limit exceeded", 429);
        return;
      }
  
      this.sendError(res, error, 500);
    }
  }
}  
export default new InvitationController();
