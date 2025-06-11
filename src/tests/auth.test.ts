import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { Express } from "express";
import vendorQueue from "../queue/Vendors-Queue";


import {
    testUser,
    testUser2,
    MissingFieldsTestUser,
    invalidEmailTestUser,
    premiumUser,
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
    await vendorQueue.close();
});

describe("Authentication and Authorization Test Suite", () => {

    // User Registration Tests
    describe("User Registration", () => {

        // Test user registration with 2 valid users
        test("Successful registration", async () => {
            const response = await request(app).post(`${baseUrl}/register`).send(testUser);
            expect(response.statusCode).toBe(200);
            const response2 = await request(app).post(`${baseUrl}/register`).send(testUser2);
            expect(response2.statusCode).toBe(200);
        });

        // Register with email already taken
        test("Register - Email already taken", async () => {
            const response = await request(app).post(`${baseUrl}/register`).send(testUser);
            expect(response.statusCode).toBe(400);
            expect(response.body.message).toBe("Email already exists.");
        });

        // Register with missing email and password
        test("Register - Missing email and password", async () => {
            const response = await request(app).post(`${baseUrl}/register`).send(MissingFieldsTestUser);
            expect(response.statusCode).toBe(400);
            expect(response.body.message).toBe("Email and password are required.");
        });

        // Register with invalid email format
        test("Register - Invalid email format", async () => {
            const response = await request(app).post(`${baseUrl}/register`).send(invalidEmailTestUser);
            expect(response.statusCode).toBe(400);
        });

        // Register with short password
        test("Register - Short password", async () => {
            const response = await request(app).post(`${baseUrl}/register`).send(shortPasswordTestUser);
            expect(response.statusCode).toBe(400);
            expect(response.body.message).toBe("Password must be at least 6 characters long.");
        });
    });


    // User Login Tests
    describe("User Login", () => {

        // Test user login with valid credentials
        test("Successful login", async () => {
            const response = await request(app).post(`${baseUrl}/login`).send(testUser);
            expect(response.statusCode).toBe(200);
            expect(response.body.accessToken).toBeDefined();
            expect(response.body.refreshToken).toBeDefined();
            expect(response.body._id).toBeDefined();

            testUser.accessToken = response.body.accessToken;
            testUser.refreshToken = response.body.refreshToken;
            testUser._id = response.body._id;
        });

        // Test user login with invalid email
        test("Login - Invalid email", async () => {
            const response = await request(app).post(`${baseUrl}/login`).send({
                email: "invalid@exmaple.com",
                password: testUser2.password
            });
            expect(response.statusCode).toBe(400);
            expect(response.body.message).toBe("Invalid Email or Password");
        });

        // Test user login with invalid password
        test("Login - Invalid credentials", async () => {
            const response = await request(app).post(`${baseUrl}/login`).send({
                email: testUser2.email,
                password: "wrongpassword"
            });
            expect(response.statusCode).toBe(400);
            expect(response.body.message).toBe("Invalid Email or Password");
        });
    });

    // User details modification tests
    describe("User Details Modification Tests", () => {
        test("Successful login", async () => {
            const response = await request(app).post(`${baseUrl}/login`).send(testUser);

            expect(response.statusCode).toBe(200);
            expect(response.body.accessToken).toBeDefined();
            expect(response.body.refreshToken).toBeDefined();
            expect(response.body._id).toBeDefined();

            testUser.accessToken = response.body.accessToken;
            testUser.refreshToken = response.body.refreshToken;
            testUser._id = response.body._id;
        });

        // Update User Details
        test("Update User Details", async () => {
            const response = await request(app).put(`${baseUrl}/user`)
                .send({
                    firstPartner: "Updated Gabi",
                    secondPartner: "Updated Michal",
                    avatar: "https://example.com/avatar.jpg",
                    weddingDate: "2026-12-31",
                    weddingVenue: "Updated Venue",
                })
                .set("Authorization", `Bearer ${testUser.accessToken}`);
            expect(response.statusCode).toBe(200);
        });

        // Reset User Password
        test("Reset Password", async () => {
            const response = await request(app).put(`${baseUrl}/resetpass`)
                .send({
                    newPassword: "newpassword123",
                })
                .set("Authorization", `Bearer ${testUser.accessToken}`);
            expect(response.body.message).toBe("Password updated successfully");
            expect(response.statusCode).toBe(200);
        });

        // Update User with taken email
        test("Update User Email - Failed", async () => {
            const response = await request(app).put(`${baseUrl}/user`)
                .send({
                    email: testUser2.email
                })
                .set("Authorization", `Bearer ${testUser.accessToken}`);
            expect(response.statusCode).toBe(404);
            expect(response.body.message).toBe("Email already taken");
        });
    });

    describe("User Premium Status", () => {
        // Get User Premium Status
        test("Get User Premium Status", async () => {
            const response = await request(app).get(`${baseUrl}/prem`)
                .set("Authorization", `Bearer ${testUser.accessToken}`);
            expect(response.statusCode).toBe(200);
            expect(response.body.isPremium).toBeDefined();
            expect(response.body.isPremium).toBe(false);
        });

        // Get User Premium Status without token
        test("Get User Premium Status without token", async () => {
            const response = await request(app).get(`${baseUrl}/prem`);
            expect(response.statusCode).toBe(401);
            expect(response.body.message).toBe("Unauthorized: No token provided");
        });

        beforeAll(async () => {
            // Register a premium user
            const response = await request(app).post(`${baseUrl}/register`).send(premiumUser);
            expect(response.statusCode).toBe(200);

            // Login to get tokens
            const loginResponse = await request(app).post(`${baseUrl}/login`).send(premiumUser);
            expect(loginResponse.statusCode).toBe(200);
            premiumUser.accessToken = loginResponse.body.accessToken;
            premiumUser.refreshToken = loginResponse.body.refreshToken;
            premiumUser._id = loginResponse.body._id;
        });

        // Get Premium User Premium Status
        test("Get Premium User Premium Status", async () => {
            const response = await request(app).get(`${baseUrl}/prem`)
                .set("Authorization", `Bearer ${premiumUser.accessToken}`);
            expect(response.statusCode).toBe(200);
            expect(response.body.isPremium).toBeDefined();
            expect(response.body.isPremium).toBe(false);     ///// Change this to true when premium feature is implemented
        });
    });

    // Token Handling Tests
    describe("Token Handling", () => {
        test("Refresh token", async () => {
            const response = await request(app).post(`${baseUrl}/refresh`).send({
                refreshToken: testUser.refreshToken,
            });
            expect(response.statusCode).toBe(200);
            expect(response.body.refreshToken).toBeDefined();
            expect(response.body.accessToken).toBeDefined();

            testUser.accessToken = response.body.accessToken;
            testUser.refreshToken = response.body.refreshToken;
        });

        test("Refresh request without Refresh token", async () => {
            const response = await request(app).post(`${baseUrl}/refresh`).send({});
            expect(response.statusCode).toBe(400);
            expect(response.body.message).toBe("Missing Token");
        });


        test("Refresh request with invalid Refresh token", async () => {
            const response = await request(app).post(`${baseUrl}/refresh`).send({
                refreshToken: testUser.refreshToken + "invalid",
            });
            expect(response.statusCode).toBe(403);
            expect(response.body.message).toBe("Token expired or invalid");
        });

    });

    // User Logout Tests
    describe("User Logout Tests", () => {

        // Successful Logout
        test("Successful Logout", async () => {
            const loginResponse = await request(app).post(`${baseUrl}/login`).send({
                email: testUser2.email,
                password: testUser2.password,
            });
            expect(loginResponse.statusCode).toBe(200);

            const response = await request(app).post(`${baseUrl}/logout`).send({
                refreshToken: loginResponse.body.refreshToken,
            });
            expect(response.statusCode).toBe(200);
            expect(response.body.message).toBe("Logged Out");
        });

        // Logout without refresh token
        test("Logout without refresh token", async () => {
            const response = await request(app).post(`${baseUrl}/logout`).send({});
            expect(response.statusCode).toBe(400);
            expect(response.body.message).toBe("Missing Token");
        });

        beforeAll(async () => {
            // Login User to get refresh token
            const loginResponse = await request(app).post(`${baseUrl}/login`).send({
                email: testUser2.email,
                password: testUser2.password,
            });
            expect(loginResponse.statusCode).toBe(200);
        });

        // Logout with invalid refresh token
        test("Logout with invalid refresh token", async () => {
            const response = await request(app).post(`${baseUrl}/logout`).send({
                refreshToken: testUser2.refreshToken + "invalid",
            });
            expect(response.statusCode).toBe(403);
            expect(response.body.message).toBe("Invalid Token");
        });

    });

    // User not found tests
    describe("User Not Found Tests", () => {
        beforeAll(async () => {

            // Login to get tokens
            const loginResponse = await request(app).post(`${baseUrl}/login`).send(testUser2);
            expect(loginResponse.statusCode).toBe(200);
            testUser2.accessToken = loginResponse.body.accessToken;
            testUser2.refreshToken = loginResponse.body.refreshToken;
            testUser2._id = loginResponse.body._id;

            // Delete the user to simulate user not found
            await userModel.findOneAndDelete({ email: testUser2.email });
        });

        // Logout - User not found
        test("Logout - User not found", async () => {
            const response = await request(app).post(`${baseUrl}/logout`).send({
                refreshToken: testUser2.refreshToken,
            });
            expect(response.statusCode).toBe(400);
            expect(response.body.message).toBe("User not found");
        });

        // Get User Premium Status - User not found
        test("Get User Premium Status - User not found", async () => {
            const response = await request(app).get(`${baseUrl}/prem`)
                .set("Authorization", `Bearer ${testUser2.accessToken}`);
            expect(response.statusCode).toBe(404);
            expect(response.body.message).toBe("User not found");
        });

        // Update User Details - User not found
        test("Update User Details - User not found", async () => {
            const response = await request(app).put(`${baseUrl}/user`)
                .send({
                    firstPartner: "Updated Partner1",
                    secondPartner: "Updated Partner2",
                    avatar: "https://example.com/avatar.jpg",
                    weddingDate: "2026-12-31",
                    weddingVenue: "Updated Venue",
                })
                .set("Authorization", `Bearer ${testUser2.accessToken}`);
            expect(response.statusCode).toBe(404);
            expect(response.body.message).toBe("User not found");
        });

        // Reset User Password - User not found
        test("Reset User Password - User not found", async () => {
            const response = await request(app).put(`${baseUrl}/resetpass`)
                .send({
                    newPassword: "newpassword123",
                })
                .set("Authorization", `Bearer ${testUser2.accessToken}`);
            expect(response.statusCode).toBe(404);
            expect(response.body.message).toBe("User not found");
        });

        // Refresh Token - User not found
        test("Refresh Token - User not found", async () => {
            const response = await request(app).post(`${baseUrl}/refresh`).send({
                refreshToken: testUser2.refreshToken,
            });
            expect(response.statusCode).toBe(400);
            expect(response.body.message).toBe("User not found");
        });

    });


    // Server Errors Tests
    describe("Server Errors", () => {
        test("Should return null if TOKEN_SECRET is missing", () => {
            const originalSecret = process.env.TOKEN_SECRET;
            delete process.env.TOKEN_SECRET;

            const tokens = generateTokens("testUserId");
            expect(tokens).toBeNull();

            process.env.TOKEN_SECRET = originalSecret;
        });

        beforeAll(async () => {
            // Register a user to test server errors
            const response = await request(app).post(`${baseUrl}/register`).send(testUser2);
            expect(response.statusCode).toBe(200);

            // Login to get tokens
            const loginResponse = await request(app).post(`${baseUrl}/login`).send(testUser2);
            expect(loginResponse.statusCode).toBe(200);
            testUser2.accessToken = loginResponse.body.accessToken;
            testUser2.refreshToken = loginResponse.body.refreshToken;
            testUser2._id = loginResponse.body._id;
        });

        // Server Error - Logout Token when TOKEN_SECRET is missing
        test("Server Error - Logout when TOKEN_SECRET is missing", async () => {
            const originalSecret = process.env.TOKEN_SECRET;
            delete process.env.TOKEN_SECRET;

            const response = await request(app).post(`${baseUrl}/logout`).send({
                refreshToken: testUser2.refreshToken,
            });
            expect(response.statusCode).toBe(500);
            expect(response.body.message).toBe("Server Error");

            process.env.TOKEN_SECRET = originalSecret;
        });

        // Server Error - Refresh Token when TOKEN_SECRET is missing
        test("Server Error - Refresh Token when TOKEN_SECRET is missing", async () => {

            const originalSecret = process.env.TOKEN_SECRET;
            delete process.env.TOKEN_SECRET;

            const response = await request(app).post(`${baseUrl}/refresh`).send({
                refreshToken: testUser2.refreshToken,
            });
            expect(response.statusCode).toBe(500);
            expect(response.body.message).toBe("Server Error");

            process.env.TOKEN_SECRET = originalSecret;
        });

        afterAll(() => {
            // Restore the TOKEN_SECRET after the test
        });

    });

    // Google Sign-In Tests
    describe("Google Sign-In Tests", () => {

        // Unsuccessful Google login
        test("Google login - invalid credential", async () => {
            const response = await request(app).post(`${baseUrl}/google`).send({
                credential: "InvalidTokenCredential"
            });
            expect(response.statusCode).not.toBe(200);
        });

    });

});

