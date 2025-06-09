import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { Express } from "express";

import {
    testUser,
    testUser2,
    invalidEmailTestUser,
    noPasswordTestUser,
    shortPasswordTestUser
} from "./tests_data/auth_test_data";

import userModel from "../models/user-model";
import { generateTokens } from "../controllers/auth-controller";

dotenv.config();

let app: Express;
const baseUrl = "/api/auth";

beforeAll(async () => {
    app = await initApp();
    await userModel.deleteMany();
    console.log("beforeAll");
});

afterAll(async () => {
    console.log("afterAll");
    await mongoose.connection.close();
});

describe("Authentication and Authorization Test Suite", () => {

    // Test user registration with 2 valid users
    describe("User Registration", () => {
        test("Successful registration", async () => {
            const response = await request(app).post(`${baseUrl}/register`).send(testUser);
            expect(response.statusCode).toBe(200);

            const response2 = await request(app).post(`${baseUrl}/register`).send(testUser2);
            expect(response2.statusCode).toBe(200);

        });
    })

    // Register with email already taken
    test("Register - Email already taken", async () => {
      const response = await request(app).post(`${baseUrl}/register`).send(testUser);
      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe("Email already exists.");
    });
});



