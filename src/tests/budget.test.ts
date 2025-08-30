// src/tests/budget.test.ts
import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { Express } from "express";
import budgetModel from "../models/budget_model";
import userModel from "../models/user-model";
import { testUser } from "./tests_data/auth_test_data";

dotenv.config();

let app: Express;
let token: string;
let userId: string;

const baseUrl = "/api/budget";

beforeAll(async () => {
  app = await initApp();
  await userModel.deleteMany();
  await budgetModel.deleteMany();

  // Register and login test user
  await request(app).post("/api/auth/register").send(testUser);
  const loginRes = await request(app).post("/api/auth/login").send({
    email: testUser.email,
    password: testUser.password,
  });

  token = loginRes.body.accessToken;

  const user = await userModel.findOne({ email: testUser.email });
  userId = user!._id.toString();
});

test("GET /api/budget without token returns 401", async () => {
  const res = await request(app).get(baseUrl);
  expect(res.statusCode).toBe(401);
});

test("POST /api/budget without token returns 401", async () => {
  const res = await request(app)
    .post(baseUrl)
    .send({ totalBudget: 50000, categories: [{ name: "Test", amount: 100 }] });
  expect(res.statusCode).toBe(401);
});

test("PUT /api/budget without token returns 401", async () => {
  const res = await request(app)
    .put(baseUrl)
    .send({ totalBudget: 50000, categories: [{ name: "Test", amount: 100 }] });
  expect(res.statusCode).toBe(401);
});

test("GET /api/budget before creation returns 404", async () => {
  // Clear any existing budget
  await budgetModel.deleteMany();
  const res = await request(app)
    .get(baseUrl)
    .set("Authorization", `Bearer ${token}`);
  expect(res.statusCode).toBe(404);
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("Budget API Test Suite", () => {
  test("Create Budget - success", async () => {
    const res = await request(app)
      .post(baseUrl)
      .set("Authorization", `Bearer ${token}`)
      .send({
        totalBudget: 50000,
        categories: [{ name: "DJ", amount: 3 }],
      });

    expect([200, 201]).toContain(res.statusCode);
    if (
      res.statusCode === 200 ||
      (res.statusCode === 201 && res.body.totalBudget !== undefined)
    ) {
      expect(res.body.totalBudget).toBe(50000);
      expect(Array.isArray(res.body.categories)).toBe(true);
      expect(res.body.categories.length).toBe(1);
    }
  });

  test("Create Budget - missing totalBudget", async () => {
    const res = await request(app)
      .post(baseUrl)
      .set("Authorization", `Bearer ${token}`)
      .send({ categories: [] });

    expect([400, 500]).toContain(res.statusCode);
  });

  test("Get Budget - success", async () => {
    const res = await request(app)
      .get(baseUrl)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.totalBudget).toBe(50000);
    expect(Array.isArray(res.body.categories)).toBe(true);
  });

  test("Update Budget - success", async () => {
    const res = await request(app)
      .put(baseUrl)
      .set("Authorization", `Bearer ${token}`)
      .send({
        totalBudget: 50000,
        categories: [
          { name: "DJ", amount: 3 },
          { name: "Venue", amount: 20000 },
        ],
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.totalBudget).toBe(50000);
    expect(res.body.data.categories.length).toBe(2);
  });

  test("Update Budget - missing total budget", async () => {
    const res = await request(app)
      .put(baseUrl)
      .set("Authorization", `Bearer ${token}`)
      .send({ categories: [{ name: "Photographer", amount: 5000 }] });

    expect(res.statusCode).toBe(500);
  });
});
