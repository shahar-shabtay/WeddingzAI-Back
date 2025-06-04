// src/services/menu-service.ts
import axios from "axios";
import Menu, { IMenu, IDish } from "../models/menu-model";

class MenuService {
  async getPromptFromGPT(userInput: string): Promise<string> {
    console.log("[MenuService.getPromptFromGPT] Received input:", userInput);
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
                "The prompt should request a background only (no text or letters), with a blank space in the center " +
                "for menu text, in the user's desired style. Leave a large white rectangle in the center of the image, " +
                "approximately 700x500 pixels in size, aligned vertically. Do not set a background around the menu design; " +
                "I need this for use as the background of a menu, but you don’t add text or letters!",
            },
            {
              role: "user",
              content: userInput,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.DALLE_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = response.data.choices?.[0]?.message?.content?.trim();
      console.log("[MenuService.getPromptFromGPT] Prompt from GPT:", result);
      if (!result) {
        throw new Error("OpenAI returned empty prompt");
      }
      return result;
    } catch (error: any) {
      console.error("[MenuService.getPromptFromGPT] Error:", error?.message || error);
      throw error;
    }
  }

  async generateImageViaGPT(userInput: string): Promise<string> {
    console.log("[MenuService.generateImageViaGPT] Starting image generation for:", userInput);
    try {
      const dallEPrompt = await this.getPromptFromGPT(userInput);
      console.log("[MenuService.generateImageViaGPT] DALL·E Prompt:", dallEPrompt);

      const response = await axios.post(
        `${process.env.DALLE_URL}`,
        {
          model: "dall-e-3",
          prompt: `${dallEPrompt}, No text, No letters, No words! Leave in the center a big white space in rectangle shape`,
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
      console.log("[MenuService.generateImageViaGPT] Image URL:", imageUrl);
      if (!imageUrl) {
        throw new Error("No image URL returned from DALL·E");
      }
      return imageUrl;
    } catch (error: any) {
      console.error("[MenuService.generateImageViaGPT] Error:", error?.message || error);
      throw error;
    }
  }

  async createMenu(userId: string, coupleNames: string, designPrompt: string, backgroundUrl: string): Promise<IMenu> {
    return Menu.create({ userId, coupleNames, designPrompt, backgroundUrl, dishes: [] });
  }

  async updateDishes(userId: string, dishes: IDish[]): Promise<IMenu | null> {
    return Menu.findByIdAndUpdate(userId, { dishes }, { new: true });
  }

  async saveMenuFiles(userId: string, pngBase64: string, pdfBase64: string): Promise<IMenu | null> {
    return Menu.findByIdAndUpdate(userId, { finalPng: pngBase64, finalPdf: pdfBase64 }, { new: true });
  }
}

export default new MenuService();