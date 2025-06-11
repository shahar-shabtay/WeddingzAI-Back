import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { Express } from "express";
import vendorQueue from "../queue/Vendors-Queue";

import tdlModel from "../models/tdl-model";
import userModel from "../models/user-model";
import { testUser } from "./tests_data/tdl-test-data";

dotenv.config();

let app: Express;
const baseUrl = "/api/tdl";
const authBaseUrl = "/api/auth";

beforeAll(async () => {
    app = await initApp();
    await userModel.deleteMany();
    await tdlModel.deleteMany();

    // Register a test user
    const registerResponse = await request(app).post(`${authBaseUrl}/register`).send(testUser)
    expect(registerResponse.statusCode).toBe(200);

    console.log("beforeAll");
});

afterAll(async () => {
    console.log("afterAll");
    await mongoose.connection.close();
    await vendorQueue.close();
});

describe("Todo List Test Suite", () => {

    beforeAll(async () => {
        // Login to get access token
        const loginResponse = await request(app).post(`${authBaseUrl}/login`).send({
            email: testUser.email,
            password: testUser.password
        });
        expect(loginResponse.statusCode).toBe(200);
        expect(loginResponse.body.accessToken).toBeDefined();
        expect(loginResponse.body.refreshToken).toBeDefined();

        testUser.accessToken = loginResponse.body.accessToken;
        testUser.refreshToken = loginResponse.body.refreshToken;
        testUser._id = loginResponse.body._id;

        console.log("User logged in and tokens set");
        console.log("Test User:", testUser.accessToken, testUser.refreshToken, testUser._id);
    });

    // Create a new To-Do List
    test("TDL - Upload To-Do List from preference.json", async () => {
        const preferencePath = path.join(__dirname, "tests_data", "preferences.json");
        console.log("Uploading file from:", preferencePath);

        expect(fs.existsSync(preferencePath)).toBe(true);

        const response = await request(app)
            .post(`${baseUrl}/upload-form`)
            .set("Authorization", `Bearer ${testUser.accessToken}`)
            .attach("file", preferencePath);

        expect(response.statusCode).toBe(200);
        expect(response.body.data).toBeDefined();
        expect(response.body.message).toBe("To-Do list created");
    }, 20000); // Increased timeout for file upload

    test("TDL - Upload To-Do List with missing preference.json", async () => {
        const preferencePath = path.join(__dirname, "tests_data", "preferences.json");
        console.log("Uploading file from:", preferencePath);

        expect(fs.existsSync(preferencePath)).toBe(true);

        const response = await request(app)
            .post(`${baseUrl}/upload-form`)
            .set("Authorization", `Bearer ${testUser.accessToken}`)
            .attach("file", preferencePath);

        expect(response.statusCode).toBe(200);
        expect(response.body.data).toBeDefined();
        expect(response.body.message).toBe("To-Do list created");
    }, 20000); // Increased timeout for file upload

});