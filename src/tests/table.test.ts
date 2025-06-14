import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import dotenv from "dotenv";
import tableModel from "../models/table-model";
import userModel from "../models/user-model";
import { testUser } from "./tests_data/auth_test_data";
import type { Express } from "express";

dotenv.config();

let app: Express;
const baseUrl = "/api/tables";
const authBaseUrl = "/api/auth";

beforeAll(async () => {
  app = await initApp();
  await userModel.deleteMany();
  await tableModel.deleteMany();
  jest.spyOn(console, "error").mockImplementation(() => {});
  const res = await request(app).post(`${authBaseUrl}/register`).send({
    firstPartner: testUser.firstPartner,
    secondPartner: testUser.secondPartner,
    email: testUser.email,
    password: testUser.password,
  });
  expect(res.status).toBe(200);
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("Table Routes Integration", () => {
  beforeAll(async () => {
    const res = await request(app).post(`${authBaseUrl}/login`).send({
      email: testUser.email,
      password: testUser.password,
    });
    expect(res.status).toBe(200);
    testUser.accessToken = res.body.accessToken;
  });

  test("GET /tables without token returns 401", async () => {
    const res = await request(app).get(baseUrl);
    expect(res.status).toBe(401);
  });

  test("GET /tables returns empty array", async () => {
    const res = await request(app)
      .get(baseUrl)
      .set("Authorization", `Bearer ${testUser.accessToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(0);
    expect(res.body.message).toBe("Success");
  });

  let createdTableId: string;

  test("POST /tables creates a table", async () => {
    const newTable = { name: "Test Table", shape: "rectangle", capacity: 5 };
    const res = await request(app)
      .post(baseUrl)
      .set("Authorization", `Bearer ${testUser.accessToken}`)
      .send(newTable);
    expect(res.status).toBe(200);
    expect(res.body.data._id).toBeDefined();
    expect(res.body.data.name).toBe(newTable.name);
    expect(res.body.data.shape).toBe(newTable.shape);
    expect(res.body.data.capacity).toBe(newTable.capacity);
    expect(res.body.message).toBe("Created");
    createdTableId = res.body.data._id;
  });

  test("GET /tables/mine returns created table", async () => {
    const res = await request(app)
      .get(`${baseUrl}/mine`)
      .set("Authorization", `Bearer ${testUser.accessToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0]._id).toBe(createdTableId);
    expect(res.body.message).toBe("Tables with guests fetched successfully");
  });

  test("GET /tables/:id returns that table", async () => {
    const res = await request(app)
      .get(`${baseUrl}/${createdTableId}`)
      .set("Authorization", `Bearer ${testUser.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(createdTableId);
    expect(res.body.message).toBe("Success");
  });

  test("PATCH /tables/:id updates the table", async () => {
    const res = await request(app)
      .patch(`${baseUrl}/${createdTableId}`)
      .set("Authorization", `Bearer ${testUser.accessToken}`)
      .send({ capacity: 10 });
    expect(res.status).toBe(200);
    expect(res.body.data.capacity).toBe(10);
    expect(res.body.message).toBe("Updated");
  });

  test("DELETE /tables/:id deletes the table", async () => {
    const res = await request(app)
      .delete(`${baseUrl}/${createdTableId}`)
      .set("Authorization", `Bearer ${testUser.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Table deleted and guests unassigned");
  });

  test("GET /tables/:id after delete returns 404", async () => {
    const res = await request(app)
      .get(`${baseUrl}/${createdTableId}`)
      .set("Authorization", `Bearer ${testUser.accessToken}`);
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });
});
