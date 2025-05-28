import axios from 'axios';
import path from 'path';
import Invitation, { IInvitation } from '../models/invitation-model';
import { saveImageFromUrl } from '../utils/save-image';

export class InvitationService {
  async generateImage(prompt: string): Promise<string> {
    const enhancedPrompt = `Create a wedding invitation design. ${prompt} 
    Important guidelines:
    - Focus on elegant typography and wedding-appropriate design
    - Use wedding-appropriate colors and elements
    - Ensure names and dates are clearly visible and accurate
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
    if (!imageUrl) throw new Error('No image URL returned from DALL·E');
    return imageUrl;
  }

  async createInvitation(userId: string, prompt: string): Promise<IInvitation> {
    const dalleImageUrl = await this.generateImage(prompt);
    const savePath = path.join(__dirname, '..', 'uploads', 'invitations', `${userId}.png`);
    await saveImageFromUrl(dalleImageUrl, savePath, true);
    const relativeImageUrl = `/uploads/invitations/${userId}.png`;
    return await Invitation.create({ userId, prompt, imageUrl: relativeImageUrl });
  }
}

export default new InvitationService();