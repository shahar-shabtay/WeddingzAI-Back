import { CalendarModel } from '../models/calendar-model';

export const getCalendarByUserId = (userId: string) => CalendarModel.findOne({ userId });

export const createCalendarForUser = (userId: string) => CalendarModel.create({ userId, events: [] });

export const addEvent = async (userId: string, eventData: any) => {
  const calendar = await CalendarModel.findOne({ userId });
  if (!calendar) throw new Error('Calendar not found');
  calendar.events.push(eventData);
  await calendar.save();
  return calendar.events[calendar.events.length - 1];
};

export const updateEvent = async (userId: string, eventId: string, eventData: any) => {
  const calendar = await CalendarModel.findOne({ userId });
  if (!calendar) throw new Error('Calendar not found');
  const event = calendar.events.id(eventId);
  if (!event) throw new Error('Event not found');
  Object.assign(event, eventData);
  await calendar.save();
  return event;
};

export const deleteEvent = async (userId: string, eventId: string) => {
  const calendar = await CalendarModel.findOne({ userId });
  if (!calendar) throw new Error('Calendar not found');

  const index = calendar.events.findIndex((e: any) => e._id.toString() === eventId);
  if (index === -1) throw new Error('Event not found');

  calendar.events.splice(index, 1); // הסרה
  await calendar.save();
};