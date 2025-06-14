import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { Express } from "express";
import vendorQueue from "../queue/Vendors-Queue";
import userModel from "../models/user-model";
import { testUser } from "./tests_data/auth_test_data";
import invitationService from "../services/invitation-service";
import { IInvitation, ISentence } from "../models/invitation-model";

// Mock the invitation service
jest.mock("../services/invitation-service", () => ({
  __esModule: true,
  default: {
    generateImageViaGPT: jest.fn(),
    createOrUpdateInvitationWithBackground: jest.fn(),
    updateSentencesByUserId: jest.fn(),
    updateHoursByUserId: jest.fn(),
    getInvitationByUserId: jest.fn(),
    updateFinals: jest.fn()
  }
}));

// Mock the file upload
jest.mock("../common/file-upload", () => ({
  saveImageLocally: jest.fn().mockResolvedValue("/uploads/invitation/test.png")
}));

dotenv.config();

let app: Express;
const baseUrl = "/api/invitation";
const authBaseUrl = "/api/auth";

// Mock data
const mockInvitation = {
  _id: "684d713a2757ca1e7838e59b",
  userId: "testUserId",
  coupleNames: "John & Jane",
  designPrompt: "Romantic outdoor wedding",
  backgroundUrl: "http://example.com/background.png",
  sentences: [
    { _id: "684d713a2757ca1e7838e59c", title: "Welcome to our wedding" },
    { _id: "684d713a2757ca1e7838e59d", title: "Join us in celebration" }
  ],
  ceremonyHour: "19:30",
  receptionHour: "20:30",
  venue: "Garden Venue",
  date: "2024-12-31",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

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

describe("Invitation Test Suite", () => {
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

    // Test generating background
    test("Invitation - Generate Background with Valid Prompt", async () => {
        const mockBackgroundUrl = "http://example.com/background.png";
        (invitationService.generateImageViaGPT as jest.Mock).mockResolvedValue(mockBackgroundUrl);

        const response = await request(app)
            .post(`${baseUrl}/background`)
            .set("Authorization", `Bearer ${testUser.accessToken}`)
            .send({
                prompt: "Romantic outdoor wedding background"
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.backgroundUrl).toBe(mockBackgroundUrl);
    });

    // Test generating background without prompt
    test("Invitation - Generate Background without Prompt", async () => {
        const response = await request(app)
            .post(`${baseUrl}/background`)
            .set("Authorization", `Bearer ${testUser.accessToken}`)
            .send({});

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("Prompt required");
    });

    // Test creating invitation with background
    test("Invitation - Create Invitation with Background", async () => {
        (invitationService.createOrUpdateInvitationWithBackground as jest.Mock).mockResolvedValue(mockInvitation);

        const response = await request(app)
            .post(`${baseUrl}/create-invitation`)
            .set("Authorization", `Bearer ${testUser.accessToken}`)
            .send({
                userId: testUser._id,
                backgroundUrl: "http://example.com/background.png",
                coupleNames: "John & Jane",
                designPrompt: "Romantic outdoor wedding",
                date: "2024-12-31",
                venue: "Garden Venue"
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe("Invitation created with background");
        expect(response.body.backgroundUrl).toBeDefined();
    });

    // Test creating invitation with missing required fields
    test("Invitation - Create Invitation with Missing Fields", async () => {
        const response = await request(app)
            .post(`${baseUrl}/create-invitation`)
            .set("Authorization", `Bearer ${testUser.accessToken}`)
            .send({
                userId: testUser._id
                // Missing required fields
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe("Missing userId or image URL");
    });

    // Test updating sentences
    test("Invitation - Update Sentences", async () => {
        const updatedInvitation = { 
            ...mockInvitation, 
            sentences: [{ _id: "684d713a2757ca1e7838e59e", title: "New sentence" }] 
        };
        (invitationService.updateSentencesByUserId as jest.Mock).mockResolvedValue(updatedInvitation);

        const response = await request(app)
            .put(`${baseUrl}/${testUser._id}/sentences`)
            .set("Authorization", `Bearer ${testUser.accessToken}`)
            .send({
                sentences: [{ title: "New sentence" }]
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.sentences).toHaveLength(1);
    });

    // Test updating hours
    test("Invitation - Update Hours", async () => {
        const updatedInvitation = { 
            ...mockInvitation, 
            ceremonyHour: "18:00",
            receptionHour: "19:00"
        };
        (invitationService.updateHoursByUserId as jest.Mock).mockResolvedValue(updatedInvitation);

        const response = await request(app)
            .put(`${baseUrl}/${testUser._id}/hours`)
            .set("Authorization", `Bearer ${testUser.accessToken}`)
            .send({
                ceremonyHour: "18:00",
                receptionHour: "19:00"
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.ceremonyHour).toBe("18:00");
        expect(response.body.receptionHour).toBe("19:00");
    });

    // Test getting invitation by user ID
    test("Invitation - Get Invitation by User ID", async () => {
        (invitationService.getInvitationByUserId as jest.Mock).mockResolvedValue(mockInvitation);

        const response = await request(app)
            .get(`${baseUrl}/${testUser._id}`)
            .set("Authorization", `Bearer ${testUser.accessToken}`);

        expect(response.statusCode).toBe(200);
        // Compare only the relevant fields, ignoring date string format differences
        const { createdAt, updatedAt, ...responseBody } = response.body;
        const { createdAt: mockCreatedAt, updatedAt: mockUpdatedAt, ...mockBody } = mockInvitation;
        expect(responseBody).toEqual(mockBody);
    });

    // Test getting non-existent invitation
    test("Invitation - Get Non-existent Invitation", async () => {
        (invitationService.getInvitationByUserId as jest.Mock).mockResolvedValue(null);

        const response = await request(app)
            .get(`${baseUrl}/nonexistentid`)
            .set("Authorization", `Bearer ${testUser.accessToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toBeNull();
    });

    // Test updating finals
    test("Invitation - Update Finals", async () => {
        const mockFinals = {
            finalPng: "data:image/png;base64,test",
            finalCanvasJson: { test: "data" }
        };
        (invitationService.updateFinals as jest.Mock).mockResolvedValue({
            ...mockInvitation,
            finalPng: "path/to/final.png",
            finalCanvasJson: "path/to/canvas.json"
        });

        const response = await request(app)
            .put(`${baseUrl}/${testUser._id}/finals`)
            .set("Authorization", `Bearer ${testUser.accessToken}`)
            .send({
                finals: mockFinals
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.invitation).toBeDefined();
    });

    // Test updating finals with missing data
    test("Invitation - Update Finals with Missing Data", async () => {
        const response = await request(app)
            .put(`${baseUrl}/${testUser._id}/finals`)
            .set("Authorization", `Bearer ${testUser.accessToken}`)
            .send({
                finals: {
                    // Missing required fields
                }
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("Missing final data");
    });
}); 