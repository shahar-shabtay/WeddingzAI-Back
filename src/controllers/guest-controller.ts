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

  public update = async (
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

      const { id } = req.params;
      const { fullName, email, phone, rsvp } = req.body;

      const updatedGuest = await guestModel.findOneAndUpdate(
        { _id: id, userId },
        { fullName, email, phone, rsvp },
        { new: true }
      );

      if (!updatedGuest) {
        res.status(404).json({ message: 'Guest not found' });
        return;
      }

      res.status(200).json({ message: 'Guest updated', data: updatedGuest });
    } catch (err) {
      next(err);
    }
  };

  public remove = async (
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

      const { id } = req.params;

      const deleted = await guestModel.findOneAndDelete({ _id: id, userId });

      if (!deleted) {
        res.status(404).json({ message: 'Guest not found' });
        return;
      }

      res.status(200).json({ message: 'Guest deleted', data: deleted });
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
  
      const recipients = guests
        .filter((g) => g.email)
        .map((g) => ({
          email: g.email!,
          fullName: g.fullName,
        }));
  
      if (recipients.length === 0) {
        res.status(400).json({ message: 'No guests with valid emails found' });
        return;
      }
  
      await sendInvitationEmails(recipients, partner1, partner2, weddingDate);
  
      res.status(200).json({ message: 'Invitations sent to all guests' });
    } catch (err) {
      next(err);
    }
  };
  
}

export default new GuestsController();