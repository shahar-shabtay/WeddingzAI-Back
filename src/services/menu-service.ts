// src/services/menu-service.ts
import axios from "axios";
import Menu, { IMenu, IDish } from "../models/menu-model";
import fs from "fs";
import path from "path";

interface FinalsData {
  finalPng: string;
  finalCanvasJson: string;
}
class MenuService {
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
              "You are an assistant that writes prompts for DALL·E to create wedding menu backgrounds. " +
              "The prompt should request a wedding-themed background image with exact dimensions of 1050 pixels wide by 950 pixels tall. " +
              "In this image, there must be a white rectangle in the very center measuring exactly 1000 pixels wide by 900 pixels tall, " +
              "surrounded by a uniform 25-pixel-thick border so that only a 25-pixel margin remains on each side. " +
              "Ensure the white rectangle and its border fill almost the entire canvas, leaving minimal space around. " +
              "Do not include any text or letters inside or around the rectangle."

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
      console.error("[MenuService.getPromptFromGPT] Error:", error?.message || error);
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
      console.error("[MenuService.generateImageViaGPT] Error:", error?.message || error);
      throw error;
    }
  }

  async createOrUpdateMenuWithBackground(
    userId: string,
    coupleNames: string,
    designPrompt: string,
    backgroundUrl: string
  ): Promise<IMenu> {
    const existingMenu = await Menu.findOne({ userId });

    if (existingMenu) {
      existingMenu.coupleNames = coupleNames;
      existingMenu.designPrompt = designPrompt;
      existingMenu.backgroundUrl = backgroundUrl;
      return existingMenu.save();
    } else {
      return Menu.create({ userId, coupleNames, designPrompt, backgroundUrl, dishes: [] });
    }
  }

  async updateDishesByUserId(userId: string, dishes: IDish[]) {
  return await Menu.findOneAndUpdate(
    { userId },
    { dishes },
    { new: true }
  );
}

  async getMenuByUserId(userId: string): Promise<IMenu | null> {
    return await Menu.findOne({ userId });
  }

  async updateFinals(userId: string, finals: FinalsData) {
    // המרת base64 ל-buffer
    const matches = finals.finalPng.match(/^data:image\/png;base64,(.+)$/);
    if (!matches) {
      throw new Error("Invalid PNG data");
    }
    const base64Data = matches[1];
    const imgBuffer = Buffer.from(base64Data, "base64");

    const userDir = path.join(__dirname, "../../uploads/menu", userId);
    if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, {recursive: true});

    const pngFilename = `final.png`;
    const pngPath = path.join(userDir, pngFilename);
    fs.writeFileSync(pngPath, imgBuffer);

    const canvasFilename = `canvas.json`;
    const canvasPath = path.join(userDir, canvasFilename);
    fs.writeFileSync(canvasPath, JSON.stringify(finals.finalCanvasJson, null, 2));

    const relativePngPath = path.relative(path.join(__dirname, "../uploads"), pngPath).replace(/\\/g, "/");
    const relativeCanvasPath = path.relative(path.join(__dirname, "../uploads"), canvasPath).replace(/\\/g, "/");

    const menu = await Menu.findOneAndUpdate(
      { userId },
      {
        finalPng: relativePngPath,
        finalCanvasJson: relativeCanvasPath,
      },
      { new: true, upsert: true }
    );

    return menu;
  }
}

export default new MenuService();