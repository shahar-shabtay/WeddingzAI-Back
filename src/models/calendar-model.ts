import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: String, required: true },
  description: String,
  color: String,
});

const calendarSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  events: [eventSchema],
});

export const CalendarModel = mongoose.model('Calendar', calendarSchema);