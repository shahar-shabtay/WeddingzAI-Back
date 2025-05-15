import { Response, NextFunction } from 'express';
import guestModel, { IGuest } from '../models/guest-model';
import { BaseController } from './base-controller';
import { AuthRequest } from '../common/auth-middleware';
import { sendInvitationEmails } from '../services/gmail-service';

class GuestsController extends BaseController<IGuest> {
  constructor() {
    super(guestModel);
  }

  public create = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const { fullName, email, phone, rsvp } = req.body;

      if (!fullName || !email) {
        res.status(400).json({ message: 'fullName and email are required' });
        return;
      }

      const existing = await guestModel.findOne({ userId, email });
      if (existing) {
        res.status(409).json({ message: 'Guest with this email already exists' });
        return;
      }

      const newGuest = await guestModel.create({
        userId,
        fullName,
        email,
        phone,
        rsvp,
      });

      res.status(201).json({ message: 'Guest created', data: newGuest });
    } catch (err) {
      next(err);
    }
  };

  public sendInvitation = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const { partner1, partner2, weddingDate } = req.body;

      if (!partner1 || !partner2 || !weddingDate) {
        res.status(400).json({ message: 'Missing required fields' });
        return;
      }

      const guests = await guestModel.find({ userId });
      const recipients = guests.map((g) => g.email).filter(Boolean);

      if (recipients.length === 0) {
        res.status(400).json({ message: 'No guests with valid emails found' });
        return;
      }

      await sendInvitationEmails(recipients, partner1, partner2, weddingDate); // ✅ use plural function

      res.status(200).json({ message: 'Invitations sent to all guests' });
    } catch (err) {
      next(err);
    }
  };
}

export default new GuestsController();
