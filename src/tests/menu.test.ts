import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { Express } from "express";
import userModel from "../models/user-model";
import menuService from "../services/menu-service";

dotenv.config();

let app: Express;
let token: string;
let userId: string;

const testUser = {
  email: "menutest@example.com",
  password: "password123",
  firstPartner: "Alice",
  secondPartner: "Bob"
};

jest.mock("../common/file-upload", () => ({
  saveImageLocally: jest.fn().mockResolvedValue("/uploads/menu/test.png")
}));

beforeAll(async () => {
  app = await initApp();
  await userModel.deleteMany();

  // Register user
  await request(app).post("/api/auth/register").send(testUser);

  // Login user
  const loginRes = await request(app).post("/api/auth/login").send({
    email: testUser.email,
    password: testUser.password
  });

  token = loginRes.body.accessToken;

  // Get userId from DB
  const user = await userModel.findOne({ email: testUser.email });
  userId = user!._id.toString();

  // MOCK menuService.generateImageViaGPT + getPromptFromGPT
  jest.spyOn(menuService, "getPromptFromGPT").mockResolvedValue("Mock prompt");
  jest.spyOn(menuService, "generateImageViaGPT").mockResolvedValue("https://example.com/fake-background.png");
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("Menu API Tests", () => {
  test("Generate background", async () => {
    const res = await request(app)
      .post("/api/menu/background")
      .set("Authorization", `Bearer ${token}`)
      .send({ prompt: "Romantic floral wedding menu" });

    expect(res.statusCode).toBe(200);
    expect(res.body.backgroundUrl).toBeDefined();
  });

  test("Create menu with background", async () => {
    const res = await request(app)
      .post("/api/menu/create-menu")
      .set("Authorization", `Bearer ${token}`)
      .send({
        userId,
        coupleNames: "Alice & Bob",
        designPrompt: "Romantic floral wedding menu",
        backgroundUrl: "https://example.com/fake-background.png"
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Menu created with background");
  });

  test("Update dishes", async () => {
    const res = await request(app)
      .put(`/api/menu/${userId}/dishes`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        dishes: [
          {
            name: "Dish 1",
            description: "Delicious dish",
            category: "Main",
            isVegetarian: false
          }
        ]
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.dishes.length).toBe(1);
  });

  test("Get menu by userId", async () => {
    const res = await request(app)
      .get(`/api/menu/${userId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.userId).toBe(userId);
  });

  test("Update finals", async () => {
    const res = await request(app)
      .put(`/api/menu/${userId}/finals`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        finals: {
          finalPng: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAA==",
          finalCanvasJson: "{}"
        }
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});