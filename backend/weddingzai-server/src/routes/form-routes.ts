import express from "express";
import multer from "multer";
import formController from "../controllers/form-controller";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/upload-form", upload.single("file"), formController.uploadFormJson);

export default router;
