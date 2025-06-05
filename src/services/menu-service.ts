// src/services/menu-service.ts
import axios from "axios";
import Menu, { IMenu, IDish } from "../models/menu-model";

class MenuService {
  // Send user prompt to chat to get new prompt for Dall e
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
                "You are an assistant that writes prompts for DALL·E to create wedding menu backgrounds." +
                "The prompt should request a background only (no text or letters), " +
                "with a large white rectangle in the center of the image sized 1000 pixels wide by 900 pixels tall," +
                " with a 25 pixel thick border around the rectangle. The rectangle and border should be centered vertically and horizontally." +
                "leaving plenty of space around the rectangle. "+
                "Do not add any text or letters inside or around the rectangle."
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

  // Send the prompt to dall e to get background
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

  async createOrUpdateMenuWithBackground(
    userId: string,
    coupleNames: string,
    designPrompt: string,
    backgroundUrl: string
  ): Promise<IMenu> {
    const existingMenu = await Menu.findOne({ userId });

    if (existingMenu) {
      // Update existing menu
      existingMenu.coupleNames = coupleNames;
      existingMenu.designPrompt = designPrompt;
      existingMenu.backgroundUrl = backgroundUrl;
      // Optionally reset dishes or other fields if needed
      return existingMenu.save();
    } else {
      // Create new menu
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
}

export default new MenuService();