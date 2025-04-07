import request from "supertest";
import express, { Express } from "express";
import multer from "multer";
import formController from "../controllers/form-controller";
import path from "path";

const upload = multer({ dest: "uploads/" });
let app: Express;

beforeAll(() => {
  app = express();
  app.use(express.json());

  app.post("/api/upload-form", upload.single("file"), async (req, res) => {
    await formController.uploadFormJson(req, res);
  });
});

describe("Form Controller Tests", () => {
  test("Upload valid preferences.json and get to-do list", async () => {

    const filePath = path.join(__dirname, "./tests_data/preferences.json");

    const response = await request(app)
      .post("/api/upload-form")
      .attach("file", filePath);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Form preferences uploaded successfully");
    expect(response.body.todoList).toBeDefined();
    expect(response.body.todoList.sections.length).toBeGreaterThan(0);
  }, 30000); // Allow long timeout for Gemini API call

  test("Upload without file should return 400", async () => {
    const response = await request(app).post("/api/upload-form");

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("No file uploaded");
  });

  test("Upload invalid JSON file returns error", async () => {
    const filePath = path.join(__dirname, "./tests_data/invalid.json");

    const response = await request(app)
      .post("/api/upload-form")
      .attach("file", filePath);

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toMatch(/Invalid JSON format/);
  });
});
