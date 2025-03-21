import express from "express";
import multer from "multer";
import uploadController  from "../controllers/upload-controller";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/upload", upload.single("file"), uploadController.uploadJsonFile);

router.post("/todo", uploadController.uploadJsonFile);

export default router;
