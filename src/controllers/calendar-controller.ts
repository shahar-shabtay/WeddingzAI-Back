import { Request, Response } from 'express';
import * as calendarService from '../services/calendar-service';

export const getEvents = (req: Request, res: Response): Promise<void> => {
  const userId = req.params.userId;

  return calendarService.getCalendarByUserId(userId)
    .then((calendar) => {
      if (!calendar) {
        res.status(404).json({ message: 'Calendar not found' });
        return;
      }
      res.json(calendar.events);
    })
    .catch((err) => {
      res.status(500).json({ message: err.message });
    });
};

export const createEvent = (req: Request, res: Response): Promise<void> => {
  const userId = req.params.userId;

  return calendarService.getCalendarByUserId(userId)
    .then((calendar) => {
      if (!calendar) {
        return calendarService.createCalendarForUser(userId);
      }
      return calendar;
    })
    .then(() => calendarService.addEvent(userId, req.body))
    .then((event) => {
      res.status(201).json(event);
    })
    .catch((err) => {
      res.status(500).json({ message: err.message });
    });
};

export const updateEvent = (req: Request, res: Response): Promise<void> => {
  const userId = req.params.userId;
  const eventId = req.params.eventId;

  return calendarService.updateEvent(userId, eventId, req.body)
    .then((updatedEvent) => {
      res.json(updatedEvent);
    })
    .catch((err) => {
      res.status(500).json({ message: err.message });
    });
};

export const deleteEvent = (req: Request, res: Response): Promise<void> => {
  const userId = req.params.userId;
  const eventId = req.params.eventId;

  return calendarService.deleteEvent(userId, eventId)
    .then(() => {
      res.status(204).end();
    })
    .catch((err) => {
      res.status(500).json({ message: err.message });
    });
};