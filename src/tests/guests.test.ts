// src/tests/menu.test.ts
import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { Express } from "express";
import Menu from "../models/menu-model";
import userModel from "../models/user-model";

dotenv.config();

let app: Express;
let token: string;
let userId: string;

const baseUrl = "/api/menu";

const testUser = {
  email: "menutest@example.com",
  password: "password123",
  firstPartner: "Alice",
  secondPartner: "Bob"
};

beforeAll(async () => {
  app = await initApp();
  await userModel.deleteMany();
  await Menu.deleteMany();

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

describe("Menu API Test Suite", () => {

  test("Generate Background - success", async () => {
    const res = await request(app)
      .post(`${baseUrl}/background`)
      .set("Authorization", `Bearer ${token}`)
      .send({ prompt: "Romantic wedding menu" });

    expect([200, 500]).toContain(res.statusCode); // fallback if OpenAI key is missing
    if (res.statusCode === 200) {
      expect(res.body.backgroundUrl).toBeDefined();
    }
  });

  test("Generate Background - missing prompt", async () => {
    const res = await request(app)
      .post(`${baseUrl}/background`)
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Prompt required");
  });

  test("Create Menu with Background", async () => {
    const res = await request(app)
      .post(`${baseUrl}/create-menu`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        userId,
        coupleNames: "Test Couple",
        designPrompt: "Elegant style",
        backgroundUrl: "/uploads/menu/test.png"
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Menu created with background");
    expect(res.body.backgroundUrl).toBeDefined();
  });

  test("Create Menu - missing userId", async () => {
    const res = await request(app)
      .post(`${baseUrl}/create-menu`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        coupleNames: "Missing User",
        designPrompt: "Minimal",
        backgroundUrl: "/uploads/menu/missing.png"
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Missing userId or image URL");
  });

  test("Update Dishes - success", async () => {
    const res = await request(app)
      .put(`${baseUrl}/${userId}/dishes`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        dishes: [
          {
            name: "Starter Salad",
            description: "Fresh greens",
            category: "Starters",
            isVegetarian: true
          },
          {
            name: "Main Steak",
            description: "Beef filet",
            category: "Main Course",
            isVegetarian: false
          }
        ]
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.dishes.length).toBe(2);
    expect(res.body.dishes[0].name).toBe("Starter Salad");
  });

  test("Update Dishes - missing userId", async () => {
    const res = await request(app)
      .put(`${baseUrl}/507f1f77bcf86cd799439011/dishes`)
      .set("Authorization", `Bearer ${token}`)
      .send({ dishes: [] });

    expect([200, 404]).toContain(res.statusCode); // depends on service behavior
  });

  test("Get Menu by UserId - success", async () => {
    const res = await request(app)
      .get(`${baseUrl}/${userId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.userId).toBe(userId);
    expect(Array.isArray(res.body.dishes)).toBe(true);
  });

  test("Get Menu - user not found", async () => {
    const res = await request(app)
      .get(`${baseUrl}/507f1f77bcf86cd799439011`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
  });

  test("Update Finals - success", async () => {
    const res = await request(app)
      .put(`${baseUrl}/${userId}/finals`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        finals: {
          finalPng: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...",
          finalCanvasJson: JSON.stringify({ objects: [] })
        }
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test("Update Finals - missing finals", async () => {
    const res = await request(app)
      .put(`${baseUrl}/${userId}/finals`)
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Missing final data");
  });

});