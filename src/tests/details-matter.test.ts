import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { Express } from "express";
import vendorQueue from "../queue/Vendors-Queue";
import userModel from "../models/user-model";
import { testUser } from "./tests_data/auth_test_data";
import * as detailsMatterService from "../services/details-matter-service";

// Mock the AI service
jest.mock("../services/details-matter-service", () => ({
  suggestSongsFromAI: jest.fn()
}));

dotenv.config();

let app: Express;
const baseUrl = "/api/details-matter";
const authBaseUrl = "/api/auth";

// Mock song suggestions
const mockSongSuggestions = [
  {
    title: "Perfect",
    artist: "Ed Sheeran",
    description: "A romantic ballad perfect for a vintage outdoor wedding",
    link: "https://youtube.com/watch?v=2Vv-BfVoq4g"
  },
  {
    title: "All of Me",
    artist: "John Legend",
    description: "A beautiful love song that fits the romantic outdoor setting",
    link: "https://youtube.com/watch?v=450p7goxZqg"
  }
];

beforeAll(async () => {
    app = await initApp();
    await userModel.deleteMany();
    jest.spyOn(console, 'error').mockImplementation(() => { });
    console.log("beforeAll");
});

afterAll(async () => {
    console.log("afterAll");
    await mongoose.connection.close();
    await vendorQueue.close();
    (console.error as jest.Mock).mockRestore();
    jest.clearAllMocks();
});

describe("Details Matter Test Suite", () => {
    beforeAll(async () => {
        // Register a test user
        const registerResponse = await request(app).post(`${authBaseUrl}/register`).send(testUser)
        expect(registerResponse.statusCode).toBe(200);

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
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Test for suggesting songs with valid prompt
    test("Details Matter - Suggest Songs with Valid Prompt", async () => {
        // Mock successful AI response
        (detailsMatterService.suggestSongsFromAI as jest.Mock).mockResolvedValue(mockSongSuggestions);

        const response = await request(app)
            .post(`${baseUrl}/suggest`)
            .set("Authorization", `Bearer ${testUser.accessToken}`)
            .send({
                prompt: "We're having a romantic outdoor wedding in the summer with a vintage theme"
            });

        expect(response.statusCode).toBe(200);
        expect(response.body).toBeDefined();
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        
        // Verify song suggestion structure
        const song = response.body[0];
        expect(song).toHaveProperty('title');
        expect(song).toHaveProperty('artist');
        expect(song).toHaveProperty('description');
        expect(song).toHaveProperty('link');
    });

    // Test for suggesting songs without prompt
    test("Details Matter - Suggest Songs without Prompt", async () => {
        const response = await request(app)
            .post(`${baseUrl}/suggest`)
            .set("Authorization", `Bearer ${testUser.accessToken}`)
            .send({});

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBeDefined();
    });

    // Test for suggesting songs without authentication
    test("Details Matter - Suggest Songs without Authentication", async () => {
        const response = await request(app)
            .post(`${baseUrl}/suggest`)
            .send({
                prompt: "We're having a romantic outdoor wedding"
            });

        expect(response.statusCode).toBe(401);
        expect(response.body.message).toMatch(/unauthorized/i);
    });

    // Test for suggesting songs with empty prompt
    test("Details Matter - Suggest Songs with Empty Prompt", async () => {
        const response = await request(app)
            .post(`${baseUrl}/suggest`)
            .set("Authorization", `Bearer ${testUser.accessToken}`)
            .send({
                prompt: ""
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBeDefined();
    });

    // Test for suggesting songs with invalid prompt type
    test("Details Matter - Suggest Songs with Invalid Prompt Type", async () => {
        // Mock AI service to throw error for invalid input
        (detailsMatterService.suggestSongsFromAI as jest.Mock).mockRejectedValue(new Error('Invalid prompt type'));

        const response = await request(app)
            .post(`${baseUrl}/suggest`)
            .set("Authorization", `Bearer ${testUser.accessToken}`)
            .send({
                prompt: 123 // Invalid type
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBeDefined();
    });
}); 