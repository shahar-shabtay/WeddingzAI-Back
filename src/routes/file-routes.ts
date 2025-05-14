import express from "express";
import multer from "multer";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const router = express.Router();

// Set a default value if DOMAIN_BASE is not defined
const base = process.env.DOMAIN_BASE;
console.log(base);

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const ext = file.originalname.split('.')
            .filter(Boolean)
            .slice(1)
            .join('.');
        cb(null, `${Date.now()}.${ext}`);
    },
});

const upload = multer({ storage: storage });

router.post('/file', upload.single("file"), function (req, res) {
    if (!req.file) {
        res.status(400).send({ error: "No file uploaded" });
        return;
    }

    const fileUrl = `${base}/uploads/${req.file.filename}`;
    console.log(`File uploaded: ${fileUrl}`);

    res.status(200).send({ url: fileUrl });
    
});

export default router;