import axios from 'axios';
import Invitation, { IInvitation } from '../models/invitation-model';

export class InvitationService {
  async generateImage(prompt: string): Promise<string> {
    const response = await axios.post(
      `${process.env.DALLE_URL}`,
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
      throw new Error('No image URL returned from DALL·E');
    }

    return imageUrl;
  }

  async createInvitation(userId: string, prompt: string): Promise<IInvitation> {
    const imageUrl = await this.generateImage(prompt);
    return await Invitation.create({ userId, prompt, imageUrl });
  }
}

export default new InvitationService();