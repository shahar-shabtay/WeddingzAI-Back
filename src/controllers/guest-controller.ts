import { Response, NextFunction } from 'express';
import guestModel, { IGuest } from '../models/guest-model';
import { BaseController } from './base-controller';
import { AuthRequest } from '../common/auth-middleware';

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
        res
          .status(400)
          .json({ message: 'fullName and email are required' });
        return;
      }

      const existing = await guestModel.findOne({ userId, email });
      if (existing) {
        res
          .status(409)
          .json({ message: 'Guest with this email already exists' });
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
}

export default new GuestsController();
