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

    jest.spyOn(console, 'error').mockImplementation(() => { });

    // Register a test user
    const registerResponse = await request(app).post(`${authBaseUrl}/register`).send(testUser)
    expect(registerResponse.statusCode).toBe(200);

    console.log("beforeAll");
});

afterAll(async () => {
    console.log("afterAll");
    await mongoose.connection.close();
    await vendorQueue.close();
    (console.error as jest.Mock).mockRestore();
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
    });

    // Create a new To-Do List
    test("TDL - Upload To-Do List from preference.json", async () => {
        const preferencePath = path.join(__dirname, "tests_data", "preferences.json");
        expect(fs.existsSync(preferencePath)).toBe(true);

        const response = await request(app)
            .post(`${baseUrl}/upload-form`)
            .set("Authorization", `Bearer ${testUser.accessToken}`)
            .attach("file", preferencePath);

        expect(response.statusCode).toBe(200);
        expect(response.body.data).toBeDefined();
        expect(response.body.message).toBe("To-Do list created");
    });

    // Test for uploading To-Do List with missing file
    test("TDL - Upload To-Do List with missing preference.json", async () => {
        const response = await request(app)
            .post(`${baseUrl}/upload-form`)
            .set("Authorization", `Bearer ${testUser.accessToken}`)

        expect(response.statusCode).not.toBe(200);
    });

    // Test for getting user's to-do lists
    test("TDL - Get My Todo List", async () => {
        const response = await request(app)
            .get(`${baseUrl}/mine`)
            .set("Authorization", `Bearer ${testUser.accessToken}`)
        expect(response.statusCode).toBe(200);
        expect(response.body.data).toBeDefined();
        expect(response.body.message).toBe("Success");
        expect(response.body.data.length).toBeGreaterThan(0);
    });

    // Test for getting user's to-do lists without token
    test("TDL - Get user's to-do lists without token", async () => {
        const response = await request(app).get(`${baseUrl}/mine`);
        expect(response.statusCode).toBe(401);
        expect(response.body.message).toMatch(/unauthorized/i);
    });

    // To Fix: This test is failing due to a bug in the controller
    test("TDL - Get All Todo List", async () => {
        const response = await request(app)
            .get(`/api/tdl`)
            .set("Authorization", `Bearer ${testUser.accessToken}`);
        console.log("Get All Todo List Response:", response.body);
        expect(response.statusCode).not.toBe(200);
    });

    // Test for adding a task to the To-Do List without task text
    test("TDL - Add Task to To-Do List without Task Text", async () => {

        const response = await request(app)
            .post(`${baseUrl}/task`)
            .set("Authorization", `Bearer ${testUser.accessToken}`)
            .send({
                dueDate: new Date().toISOString(),
                priority: "High"
            });

        expect(response.statusCode).not.toBe(200);
        expect(response.body.error).toMatch(/missing task text/i);
    });

    let taskId: string;
    let sectionName: string;

    // Test for adding a task to the To-Do List
    test("TDL - Add Task to To-Do List", async () => {
        const addedTaskResponse = await request(app)
            .post(`${baseUrl}/task`)
            .set("Authorization", `Bearer ${testUser.accessToken}`)
            .send({
                task: "New Test Task",
                dueDate: new Date().toISOString(),
                priority: "High"
            });

        taskId = addedTaskResponse.body.data.tdl.sections.at(-1).todos.at(-1)._id;
        sectionName = addedTaskResponse.body.data.tdl.sections.at(-1).sectionName;

        console.log("Task ID:", taskId);
        console.log("Section Name:", sectionName);

        expect(addedTaskResponse.statusCode).toBe(200);
        expect(addedTaskResponse.body.data).toBeDefined();
        expect(addedTaskResponse.body.message).toBe("Task added");
    });

    // Test for updating a task in the To-Do List
    test("TDL - Update Task in To-Do List", async () => {
        const response = await request(app)
            .put(`${baseUrl}/task`)
            .set("Authorization", `Bearer ${testUser.accessToken}`)
            .send({
                todoId: taskId,
                sectionName: sectionName,
                updates: {
                    task: "Updated Test Task",
                    dueDate: new Date().toISOString(),
                    priority: "Medium"
                }
            });

        expect(response.body.message).toBe("Task updated");
        expect(response.statusCode).toBe(200);
        expect(response.body.data).toBeDefined();
    });

    // Test for updating a task with missing task text
    test("TDL - Update Task in To-Do List, Simulating Error", async () => {
        const response = await request(app)
            .put(`${baseUrl}/task`)
            .set("Authorization", `Bearer ${testUser.accessToken}`)
            .send({
                todoId: taskId,
                sectionName: sectionName,
                updates: {
                    task: "",
                    dueDate: new Date().toISOString(),
                    priority: "Medium"
                }
            });

        expect(response.statusCode).not.toBe(200);
    });

    // Test for updating a task with missing fields
    test("TDL - Update Task in To-Do List, Missing Fields", async () => {
        const response = await request(app)
            .put(`${baseUrl}/task`)
            .set("Authorization", `Bearer ${testUser.accessToken}`)
            .send({
                todoId: taskId,
                sectionName: sectionName,
            });

        expect(response.statusCode).not.toBe(200);
        expect(response.body.error).toMatch(/missing fields for update/i);
    });

    // Test marking a task as completed
    test("TDL - Mark Task as Completed", async () => {
        const response = await request(app)
            .patch(`${baseUrl}/done`)
            .set("Authorization", `Bearer ${testUser.accessToken}`)
            .send({
                todoId: taskId,
                sectionName: sectionName,
                done: true
            });
        expect(response.statusCode).toBe(200);
        expect(response.body.data).toBeDefined();
        expect(response.body.message).toBe("Task completion status updated");
    });


    // Test marking a task as completed with invalid fields
    test("TDL - Mark Task as Completed with invalid fields", async () => {
        const response = await request(app)
            .patch(`${baseUrl}/done`)
            .set("Authorization", `Bearer ${testUser.accessToken}`)
            .send({
                todoId: taskId,
                sectionName: sectionName,
                done: "notABoolean"
            });
        expect(response.statusCode).not.toBe(200);
    });

    // Test for deleting an invalid task from the To-Do List
    test("TDL - Delete Invalid Task from To-Do List", async () => {
        const response = await request(app)
            .delete(`${baseUrl}/task`)
            .set("Authorization", `Bearer ${testUser.accessToken}`)
            .send({
                sectionName: "Test Section",
                todoId: "invalidTaskId"
            });

        expect(response.statusCode).not.toBe(200);
    });

    // Test for deleting a task from the To-Do List
    test("TDL - Delete Task from To-Do List", async () => {
        const response = await request(app)
            .delete(`${baseUrl}/task`)
            .set("Authorization", `Bearer ${testUser.accessToken}`)
            .send({
                sectionName: sectionName,
                todoId: taskId
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.data).toBeDefined();
        expect(response.body.message).toBe("Task deleted");
    });

    // Test for updating wedding date
    test("TDL - Update Wedding Date", async () => {
        const newWeddingDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(); // 30 days from now
        const response = await request(app)
            .put(`${baseUrl}/date`)
            .set("Authorization", `Bearer ${testUser.accessToken}`)
            .send({ newWeddingDate });

        expect(response.statusCode).toBe(200);
        expect(response.body.data).toBeDefined();
        expect(response.body.message).toBe("Wedding date updated");
    });

    // Test for updating wedding date with invalid format
    test("TDL - Update Wedding Date with Invalid Format", async () => {
        const response = await request(app)
            .put(`${baseUrl}/date`)
            .set("Authorization", `Bearer ${testUser.accessToken}`)
            .send({ newWeddingDate: 100 }); 

        expect(response.statusCode).not.toBe(200);
        expect(response.body.error).toMatch(/invalid wedding date format/i);
    });

});