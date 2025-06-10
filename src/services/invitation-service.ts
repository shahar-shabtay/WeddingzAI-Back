import axios from "axios";
import Invitation, { IInvitation, ISentence } from "../models/invitation-model";
import fs from "fs";
import path from "path";

interface FinalsData {
  finalPng: string;
  finalCanvasJson: string;
}
class InvitationService {
  // Send user prompt to chat to get new prompt for Dall e
  async getPromptFromGPT(userInput: string): Promise<string> {
    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: 
              "You are an assistant that writes prompts for DALL·E to create wedding invitation backgrounds. " +
              "Do not include any text or letters inside no numbers."

            },
            {
              role: "user",
              content: userInput,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = response.data.choices?.[0]?.message?.content?.trim();
      if (!result) {
        throw new Error("OpenAI returned empty prompt");
      }
      return result;
    } catch (error: any) {
      console.error("[InvitationService.getPromptFromGPT] Error:", error?.message || error);
      throw error;
    }
  }

  // Send the prompt to dall e to get background
  async generateImageViaGPT(userInput: string): Promise<string> {
    try {
      const dallEPrompt = await this.getPromptFromGPT(userInput);

      const response = await axios.post(
        `${process.env.DALLE_URL}`,
        {
          model: "dall-e-3",
          prompt: `${dallEPrompt}, No text, No letters, No words!`,
          n: 1,
          size: "1024x1024",
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.DALLE_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      const imageUrl = response.data.data?.[0]?.url;
      if (!imageUrl) {
        throw new Error("No image URL returned from DALL·E");
      }
      return imageUrl;
    } catch (error: any) {
      console.error("[InvitationService.generateImageViaGPT] Error:", error?.message || error);
      throw error;
    }
  }

  async createOrUpdateInvitationWithBackground(
    userId: string,
    coupleNames: string,
    designPrompt: string,
    backgroundUrl: string,
    date: string,
    venue: string,
  ): Promise<IInvitation> {
    const existingInvition = await Invitation.findOne({ userId });

    if (existingInvition) {
      existingInvition.coupleNames = coupleNames;
      existingInvition.designPrompt = designPrompt;
      existingInvition.backgroundUrl = backgroundUrl;
      return existingInvition.save();
    } else {
      return Invitation.create({ userId, coupleNames, designPrompt, backgroundUrl, sentences: [] , date, venue});
    }
  }

  async updateSentencesByUserId(userId: string, sentences: ISentence[]) {
  return await Invitation.findOneAndUpdate(
    { userId },
    { sentences },
    { new: true }
  );
  }

  async updateHoursByUserId(userId: string, ceremonyHour: string, receptionHour: string) {
  return await Invitation.findOneAndUpdate(
    { userId },
    { ceremonyHour, receptionHour },
    { new: true }
  );
}

  async getInvitationByUserId(userId: string): Promise<IInvitation | null> {
    return await Invitation.findOne({ userId });
  }

  async updateFinals(userId: string, finals: FinalsData) {
    // המרת base64 ל-buffer
    const matches = finals.finalPng.match(/^data:image\/png;base64,(.+)$/);
    if (!matches) {
      throw new Error("Invalid PNG data");
    }
    const base64Data = matches[1];
    const imgBuffer = Buffer.from(base64Data, "base64");

    const userDir = path.join(__dirname, "../../uploads/invitation", userId);
    if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, {recursive: true});

    const pngFilename = `final.png`;
    const pngPath = path.join(userDir, pngFilename);
    fs.writeFileSync(pngPath, imgBuffer);

    const canvasFilename = `canvas.json`;
    const canvasPath = path.join(userDir, canvasFilename);
    fs.writeFileSync(canvasPath, JSON.stringify(finals.finalCanvasJson, null, 2));

    const relativePngPath = path.relative(path.join(__dirname, "../uploads"), pngPath).replace(/\\/g, "/");
    const relativeCanvasPath = path.relative(path.join(__dirname, "../uploads"), canvasPath).replace(/\\/g, "/");

    const invitation = await Invitation.findOneAndUpdate(
      { userId },
      {
        finalPng: relativePngPath,
        finalCanvasJson: relativeCanvasPath,
      },
      { new: true, upsert: true }
    );

    return invitation;
  }
}

export default new InvitationService();