
import request from "supertest";
import express, { Express } from "express";
import guestRoutes from "../routes/guest-routes";
import mongoose from "mongoose";
import dotenv from "dotenv";
import guestModel from "../models/guest-model";

dotenv.config();

let app: Express;

beforeAll(async () => {
  app = express();
  app.use(express.json());
  app.use("/api", guestRoutes);

  if (!process.env.MONGO_URI) throw new Error("MONGO_URI not defined");
  await mongoose.connect(process.env.MONGO_URI);
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe("Guest Controller Tests", () => {
  let createdGuestId: string = "";

  test("POST /api/guests - should create a guest", async () => {
    const response = await request(app)
      .post("/api/guests")
      .set("Authorization", "Bearer testtoken") // Adjust for your actual auth logic
      .send({
        fullName: "RSVP Test Guest",
        email: "rsvp@example.com",
        phone: "0500000000",
        rsvp: "maybe",
      });

    expect(response.statusCode).toBe(201);
    createdGuestId = response.body.data._id;
  });

  test("GET /api/guests/mine - should return guest list", async () => {
    const response = await request(app)
      .get("/api/guests/mine")
      .set("Authorization", "Bearer testtoken");

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test("PUT /api/guests/:id - should update guest", async () => {
    const response = await request(app)
      .put(`/api/guests/${createdGuestId}`)
      .set("Authorization", "Bearer testtoken")
      .send({
        fullName: "Updated RSVP Guest",
        email: "rsvp@example.com",
        phone: "0501111111",
        rsvp: "yes",
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.fullName).toBe("Updated RSVP Guest");
  });

  test("DELETE /api/guests/:id - should delete guest", async () => {
    const response = await request(app)
      .delete(`/api/guests/${createdGuestId}`)
      .set("Authorization", "Bearer testtoken");

    expect(response.statusCode).toBe(200);
  });

  test("GET /api/rsvp - should fail with invalid query", async () => {
    const response = await request(app)
      .get("/api/rsvp")
      .query({ guestId: "123", token: "abc", response: "yes" });

    expect(response.statusCode).toBe(403); // Assuming guest doesn't exist
  });
});
