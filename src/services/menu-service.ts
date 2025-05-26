// src/services/menu-service.ts
import axios from 'axios';
import Menu, { IMenu } from '../models/menu-model';

export class MenuService {
  async generateImage(prompt: string, dishes: Array<{name: string, description: string}>, coupleNames: string): Promise<string> {
    const dishesText = dishes.map(dish => `${dish.name}: ${dish.description}`).join('\n');
    
    const enhancedPrompt = `Create a wedding menu design. ${prompt}
    Couple Names: ${coupleNames}
    Menu Items:
    ${dishesText}
    
    Important guidelines:
    - Keep the design clean and casual
    - Make sure all dishes are easy to read
    - Use clear, readable typography
    - Keep the layout simple and organized
    - Focus on making the menu items stand out
    - Use wedding-appropriate colors and elements
    - Ensure all dishes are clearly visible and accurately listed
    - Maintain a professional and sophisticated look
    - Avoid any non-wedding related elements`;

    const response = await axios.post(
      `${process.env.DALLE_URL}`,
      {
        model: 'dall-e-3',
        prompt: enhancedPrompt,
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
      throw new Error('No image URL returned from DALL·E');
    }

    return imageUrl;
  }

  async createMenu(
    userId: string, 
    coupleNames: string, 
    designPrompt: string, 
    dishes: Array<{name: string, description: string}>
  ): Promise<IMenu> {
    const imageUrl = await this.generateImage(designPrompt, dishes, coupleNames);
    return await Menu.create({ 
      userId, 
      coupleNames, 
      designPrompt, 
      dishes, 
      imageUrl 
    });
  }
}

export default new MenuService();