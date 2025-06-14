import { Request, Response } from 'express';
import * as calendarService from '../services/calendar-service';

export const getEvents = async (req: Request, res: Response): Promise<void> => {
  const userId = req.params.userId;

  try {
    const calendar = await calendarService.getCalendarByUserId(userId);
    if (!calendar) {
      res.status(404).json({ message: 'Calendar not found' });
      return;
    }
    res.json(calendar.events);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const createEvent = async (req: Request, res: Response): Promise<void> => {
  const userId = req.params.userId;

  try {
    let calendar = await calendarService.getCalendarByUserId(userId);
    if (!calendar) {
      calendar = await calendarService.createCalendarForUser(userId);
    }
    const event = await calendarService.addEvent(userId, req.body);
    res.status(201).json(event);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const updateEvent = async (req: Request, res: Response): Promise<void> => {
  const userId = req.params.userId;
  const eventId = req.params.eventId;

  try {
    const updatedEvent = await calendarService.updateEvent(userId, eventId, req.body);
    res.json(updatedEvent);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteEvent = async (req: Request, res: Response): Promise<void> => {
  const userId = req.params.userId;
  const eventId = req.params.eventId;

  try {
    await calendarService.deleteEvent(userId, eventId);
    res.status(204).end();
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};