// src/tests/vendors.test.ts
import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { Express } from "express";
import userModel from "../models/user-model";
import { VendorModel } from "../models/vendor-model";
import tdlModel from "../models/tdl-model";
import vendorQueue from "../queue/Vendors-Queue";

dotenv.config();

let app: Express;
let token: string;
let testVendorId: string;

const baseUrl = "/api/vendors";

const testUser = {
  email: "vendortest@example.com",
  password: "password123",
  firstPartner: "Alice",
  secondPartner: "Bob"
};

jest.setTimeout(60000);

beforeAll(async () => {
  app = await initApp();
  await userModel.deleteMany();
  await VendorModel.deleteMany();
  await tdlModel.deleteMany();

  await request(app).post("/api/auth/register").send(testUser);
  const loginRes = await request(app).post("/api/auth/login").send({
    email: testUser.email,
    password: testUser.password
  });

  token = loginRes.body.accessToken;

  const user = await userModel.findOne({ email: testUser.email });

  await tdlModel.create({
    userId: user!._id,
    tdl: {
      sections: [
        {
          name: "Vendors",
          todos: [
            {
              task: "Find a DJ for the wedding",
              aiSent: true
            }
          ]
        }
      ]
    }
  });

  const vendor = await VendorModel.create({
    name: "Test DJ Vendor",
    vendorType: "DJ",
    about: "Best DJ for weddings",
    services: "DJ services",
    price_range: "$1000-$3000",
    sourceUrl: "https://test-vendor.com",
    scrapedAt: new Date()
  });

  testVendorId = vendor.id.toString();

  user!.myVendors.push(vendor.id);
  await user!.save();
});

afterAll(async () => {
  await mongoose.connection.close();
  await vendorQueue.close();
});

describe("Vendors API Test Suite", () => {

  test("Get All Vendors (no auth)", async () => {
    const res = await request(app).get(`${baseUrl}/all`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("Get Relevant Vendors", async () => {
    const res = await request(app)
      .get(`${baseUrl}/relevant`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("Get Vendor Summary", async () => {
    const res = await request(app)
      .get(`${baseUrl}/summary`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(typeof res.body.total).toBe("number");
    expect(typeof res.body.counts).toBe("object");
  });

  test("Get User Vendors", async () => {
    const res = await request(app)
      .get(`${baseUrl}/mine`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("Get User Booked Vendors", async () => {
    const res = await request(app)
      .get(`${baseUrl}/booked`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("Book a Vendor", async () => {
    const res = await request(app)
      .patch(`${baseUrl}/book`)
      .set("Authorization", `Bearer ${token}`)
      .send({ vendorId: testVendorId });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test("Cancel Booked Vendor", async () => {
    const res = await request(app)
      .patch(`${baseUrl}/cancel`)
      .set("Authorization", `Bearer ${token}`)
      .send({ vendorId: testVendorId });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test("Get Vendors by Type", async () => {
    const res = await request(app)
      .get(`${baseUrl}/type/DJ`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("Search Vendors", async () => {
    const res = await request(app)
      .get(`${baseUrl}/search`)
      .query({ query: "DJ" })
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("Get Vendor by ID", async () => {
    const res = await request(app)
      .get(`${baseUrl}/${testVendorId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data._id).toBe(testVendorId);
  });

  // NEGATIVE TESTS:

  test("Get Vendors by Unknown Type", async () => {
    const res = await request(app)
      .get(`${baseUrl}/type/UNKNOWN`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("Search Vendors - no result", async () => {
    const res = await request(app)
      .get(`${baseUrl}/search`)
      .query({ query: "nonexistentvendor" })
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(0);
  });

  test("Get Vendor by Invalid ID", async () => {
    const res = await request(app)
      .get(`${baseUrl}/507f1f77bcf86cd799439011`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
  });

});