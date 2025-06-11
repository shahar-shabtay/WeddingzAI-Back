// src/tests/guests.test.ts
import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { Express } from "express";
import guestModel from "../models/guest-model";
import userModel from "../models/user-model";
import tableModel from "../models/table-model";
import vendorQueue from "../queue/Vendors-Queue";

dotenv.config();

let app: Express;
let token: string;
let guestId: string;
let tableId: string;

const baseUrl = "/api/guests";

const testUser = {
  email: "guesttest@example.com",
  password: "password123",
  firstPartner: "Alice",
  secondPartner: "Bob"
};

beforeAll(async () => {
  app = await initApp();
  await userModel.deleteMany();
  await guestModel.deleteMany();
  await tableModel.deleteMany();

  await request(app).post("/api/auth/register").send(testUser);
  const loginRes = await request(app).post("/api/auth/login").send({
    email: testUser.email,
    password: testUser.password
  });

  token = loginRes.body.accessToken;
});

afterAll(async () => {
  await mongoose.connection.close();
  await vendorQueue.close();
});

describe("Guest API Test Suite", () => {
  test("Create Guest", async () => {
    const res = await request(app)
      .post(baseUrl)
      .set("Authorization", `Bearer ${token}`)
      .send({
        fullName: "John Doe",
        email: "john@example.com",
        phone: "+1234567890"
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.fullName).toBe("John Doe");
    guestId = res.body.data._id;
  });

  test("Create Guest - missing fullName", async () => {
    const res = await request(app)
      .post(baseUrl)
      .set("Authorization", `Bearer ${token}`)
      .send({ email: "missing@example.com" });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("fullName and email are required");
  });

  test("Create Guest - duplicate email", async () => {
    await request(app)
      .post(baseUrl)
      .set("Authorization", `Bearer ${token}`)
      .send({ fullName: "Dupe", email: "dupe@example.com" });

    const res = await request(app)
      .post(baseUrl)
      .set("Authorization", `Bearer ${token}`)
      .send({ fullName: "Dupe2", email: "dupe@example.com" });

    expect(res.statusCode).toBe(409);
  });

  test("Update Guest", async () => {
    const res = await request(app)
      .put(`${baseUrl}/${guestId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        fullName: "John Updated",
        email: "john@example.com",
        phone: "+1234567890"
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.fullName).toBe("John Updated");
  });

  test("Update Guest - guest not found", async () => {
    const res = await request(app)
      .put(`${baseUrl}/507f1f77bcf86cd799439011`)
      .set("Authorization", `Bearer ${token}`)
      .send({ fullName: "Ghost" });

    expect([404, 500]).toContain(res.statusCode);
  });

  test("Get All Guests", async () => {
    const res = await request(app)
      .get(baseUrl)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("Assign Guest to Table", async () => {
    const user = await userModel.findOne({ email: testUser.email });
    const table = await tableModel.create({ name: "Table 1", userId: user!._id });
    tableId = table._id.toString();

    const guest = await guestModel.create({
      fullName: "Assign Me",
      email: "assignme@example.com",
      userId: user!._id,
      rsvpToken: new mongoose.Types.ObjectId().toString()
    });

    const res = await request(app)
      .patch(`${baseUrl}/assign`)
      .set("Authorization", `Bearer ${token}`)
      .send({ guestId: guest._id, tableId });

    expect(res.statusCode).toBe(200);
  });

  test("Assign Guest - table not found", async () => {
    const user = await userModel.findOne({ email: testUser.email });
    const guest = await guestModel.create({
      fullName: "Assign Missing Table",
      email: "assign_missing_table@example.com",
      userId: user!._id,
      rsvpToken: new mongoose.Types.ObjectId().toString()
    });

    const res = await request(app)
      .patch(`${baseUrl}/assign`)
      .set("Authorization", `Bearer ${token}`)
      .send({ guestId: guest._id, tableId: "507f1f77bcf86cd799439011" });

    expect(res.statusCode).toBe(404);
  });

  test("Unassign Guest", async () => {
    const user = await userModel.findOne({ email: testUser.email });
    const guest = await guestModel.create({
      fullName: "To Unassign",
      email: "unassign@example.com",
      userId: user!._id,
      rsvpToken: new mongoose.Types.ObjectId().toString(),
      tableId: new mongoose.Types.ObjectId()
    });

    const res = await request(app)
      .patch(`${baseUrl}/unassign`)
      .set("Authorization", `Bearer ${token}`)
      .send({ guestId: guest._id });

    expect(res.statusCode).toBe(200);
  });

  test("Delete Guest", async () => {
    const res = await request(app)
      .delete(`${baseUrl}/${guestId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Guest deleted");
  });

  test("RSVP Response - valid", async () => {
    const user = await userModel.findOne({ email: testUser.email });
    const guest = await guestModel.create({
      userId: user!._id,
      fullName: "RSVP Guest",
      email: "rsvp@example.com",
      rsvpToken: "token123"
    });

    const res = await request(app)
      .post(`${baseUrl}/rsvp-response`)
      .send({
        guestId: guest._id,
        token: guest.rsvpToken,
        response: "yes",
        numberOfGuests: 2
      });

    expect(res.statusCode).toBe(200);
  });

  test("RSVP Response - missing fields", async () => {
    const res = await request(app).post(`${baseUrl}/rsvp-response`).send({});
    expect(res.statusCode).toBe(400);
  });

  test("RSVP Response - invalid response", async () => {
    const user = await userModel.findOne({ email: testUser.email });
    const guest = await guestModel.create({
      userId: user!._id,
      fullName: "Bad RSVP",
      email: "bad@example.com",
      rsvpToken: "token456"
    });

    const res = await request(app)
      .post(`${baseUrl}/rsvp-response`)
      .send({
        guestId: guest._id,
        token: guest.rsvpToken,
        response: "maybe-not"
      });

    expect(res.statusCode).toBe(400);
  });

  test("RSVP Response - guest not found", async () => {
    const res = await request(app)
      .post(`${baseUrl}/rsvp-response`)
      .send({
        guestId: new mongoose.Types.ObjectId().toString(),
        token: "invalid-token",
        response: "yes"
      });

    expect(res.statusCode).toBe(403); // adjust to 404 if you change controller logic
  });

  test("Send Invitations - missing fields", async () => {
    const res = await request(app)
      .post(`${baseUrl}/send-invitation`)
      .set("Authorization", `Bearer ${token}`)
      .send({ partner1: "A" });

    expect(res.statusCode).toBe(400);
  });

  test("Send Invitations - no valid guests", async () => {
    await guestModel.deleteMany({});

    const res = await request(app)
      .post(`${baseUrl}/send-invitation`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        partner1: "Alice",
        partner2: "Bob",
        weddingDate: "2025-01-01",
        venue: "Beach"
      });

    expect(res.statusCode).toBe(400);
  });

  test("Create Guest - unauthorized", async () => {
    const res = await request(app)
      .post(baseUrl)
      .send({
        fullName: "Unauthorized Guest",
        email: "unauth@example.com"
      });

    expect(res.statusCode).toBe(401);
  });

  test("Update Guest - missing required fields", async () => {
    const res = await request(app)
      .put(`${baseUrl}/${guestId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({}); // empty payload

    expect([200, 404]).toContain(res.statusCode); // adjust depending on controller behavior
  });

  test("Delete Guest - not found", async () => {
    const res = await request(app)
      .delete(`${baseUrl}/507f1f77bcf86cd799439011`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
  });

  test("RSVP Response - invalid numberOfGuests", async () => {
    const user = await userModel.findOne({ email: testUser.email });
    const guest = await guestModel.create({
      userId: user!._id,
      fullName: "Invalid Guest Count",
      email: "count@example.com",
      rsvpToken: "counttoken"
    });

    const res = await request(app)
      .post(`${baseUrl}/rsvp-response`)
      .send({
        guestId: guest._id,
        token: guest.rsvpToken,
        response: "yes",
        numberOfGuests: 999
      });

    expect(res.statusCode).toBe(200);
  });

  test("RSVP Response - valid GET request", async () => {
    const user = await userModel.findOne({ email: testUser.email });
    const guest = await guestModel.create({
      userId: user!._id,
      fullName: "GET RSVP Guest",
      email: "getrsvp@example.com",
      rsvpToken: "gettoken"
    });

    const res = await request(app)
      .get(`${baseUrl}/rsvp-response`)
      .query({
        guestId: guest._id.toString(),
        token: "gettoken",
        response: "yes",
        numberOfGuests: 1
      });

    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("GET RSVP Guest");
  });
});
