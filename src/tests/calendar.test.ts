// src/tests/calendar.test.ts
import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { Express } from "express";
import userModel from "../models/user-model";
import {CalendarModel} from "../models/calendar-model";

dotenv.config();

let app: Express;
let token: string;
let calendarEventId: string;

const baseUrl = "/api/calendar";

const testUser = {
  email: "calendartest@example.com",
  password: "password123",
  firstPartner: "Alice",
  secondPartner: "Bob"
};

let userId: string;

beforeAll(async () => {
  app = await initApp();
  await userModel.deleteMany();
  await CalendarModel.deleteMany();

  await request(app).post("/api/auth/register").send(testUser);
  const loginRes = await request(app).post("/api/auth/login").send({
    email: testUser.email,
    password: testUser.password
  });

  token = loginRes.body.accessToken;

  const user = await userModel.findOne({ email: testUser.email });
  userId = user!._id.toString();
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("Calendar API Test Suite", () => {
  test("Get Events - initially empty or 404", async () => {
    const res = await request(app)
      .get(`${baseUrl}/${userId}/events`)
      .set("Authorization", `Bearer ${token}`);

    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(Array.isArray(res.body)).toBe(true);
    }
  });

  test("Create Event", async () => {
    const eventData = {
      title: "Wedding Day",
      date: "2025-12-31",
      description: "The big day!",
      color: "#FF00FF"
    };

    const res = await request(app)
      .post(`${baseUrl}/${userId}/events`)
      .set("Authorization", `Bearer ${token}`)
      .send(eventData);

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe(eventData.title);
    expect(res.body.date).toBe(eventData.date);

    calendarEventId = res.body._id || res.body.id;
  });

  test("Update Event", async () => {
    const updatedData = {
      title: "Wedding Day Updated",
      date: "2025-12-30",
      description: "Updated Description",
      color: "#00FFFF"
    };

    const res = await request(app)
      .put(`${baseUrl}/${userId}/events/${calendarEventId}`)
      .set("Authorization", `Bearer ${token}`)
      .send(updatedData);

    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe(updatedData.title);
    expect(res.body.date).toBe(updatedData.date);
  });

  test("Update Event - Event Not Found", async () => {
    const res = await request(app)
      .put(`${baseUrl}/${userId}/events/507f1f77bcf86cd799439011`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Ghost Event" });

    expect(res.statusCode).toBe(500); // if you want you can change controller to return 404
  });

  test("Delete Event", async () => {
    const res = await request(app)
      .delete(`${baseUrl}/${userId}/events/${calendarEventId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(204);
  });

  test("Delete Event - Not Found", async () => {
    const res = await request(app)
      .delete(`${baseUrl}/${userId}/events/507f1f77bcf86cd799439011`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(500); // if you want you can change controller to return 404
  });

  test("Create Event - Missing Title", async () => {
    const res = await request(app)
      .post(`${baseUrl}/${userId}/events`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        date: "2025-01-01"
      });

    expect([400, 500]).toContain(res.statusCode); // adjust if controller sends validation 400
  });

  test("Get Events - Unauthorized", async () => {
    const res = await request(app)
      .get(`${baseUrl}/${userId}/events`);

    expect(res.statusCode).toBe(401);
  });

  test("Create Event - Unauthorized", async () => {
    const res = await request(app)
      .post(`${baseUrl}/${userId}/events`)
      .send({
        title: "Unauthorized Event",
        date: "2025-01-01"
      });

    expect(res.statusCode).toBe(401);
  });
});