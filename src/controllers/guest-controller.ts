// src/controllers/guests-controller.ts

import { RequestHandler } from 'express';
import { BaseController } from './base-controller';
import guestModel, { IGuest } from '../models/guest-model';
import { AuthRequest } from '../common/auth-middleware';

class GuestsController extends BaseController<IGuest> {
  constructor() {
    super(guestModel);
  }

  // Get all guests for authenticated user
  public getForUser: RequestHandler = async (req: AuthRequest, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const guests = await guestModel.find({ userId });
      res.json(guests);
    } catch (err) {
      next(err);
    }
  };

  // Add a new guest
  public add: RequestHandler = async (req: AuthRequest, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { fullName, email, phone, rsvp } = req.body;

      if (!fullName || !email) {
        return res
          .status(400)
          .json({ message: 'fullName and email are required' });
      }

      const existingGuest = await guestModel.findOne({ email, userId });
      if (existingGuest) {
        return res
          .status(409)
          .json({ message: 'Guest with this email already exists' });
      }

      const newGuest = await guestModel.create({
        userId,
        fullName,
        email,
        phone,
        rsvp,
      });

      res.status(201).json(newGuest);
    } catch (err) {
      next(err);
    }
  };

  // Delete guest by ID
  public delete: RequestHandler = async (req: AuthRequest, res, next) => {
    try {
      const userId = req.user?.id;
      const guestId = req.params.id;

      const guest = await guestModel.findOneAndDelete({
        _id: guestId,
        userId,
      });

      if (!guest) {
        return res.status(404).json({ message: 'Guest not found' });
      }

      res.status(200).json({ message: 'Guest deleted' });
    } catch (err) {
      next(err);
    }
  };
}

export default new GuestsController();
