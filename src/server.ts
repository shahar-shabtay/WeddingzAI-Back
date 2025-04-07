import express, { Application, Request, Response, Express } from "express";
import cors from "cors";
import path from 'path';
import dotenv from "dotenv";
import mongoose from "mongoose";

// Import routes
import formUploadRoutes from "./routes/form-routes";
import authRoutes from "./routes/auth_routes";

// const app: Application = express();
const app = express();
dotenv.config();

const apiBase = "/api";

// CORS Configuration to allow specific origin
const corsOptions = {
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// App Options
app.use(express.json());
app.use(cors(corsOptions));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "*");
  res.header("Access-Control-Allow-Headers", "*");
  next();
})


// Routes
app.use(apiBase, formUploadRoutes);
app.use(apiBase, authRoutes);

// Add GET / route for project owners
app.get("/", (req: Request, res: Response) => {
  res.json({
    owners: ["Gavriel Matatov", "Gal Ternovsky", "Shahar Shabtay", "Gefen Kidmi", "Ziv Klien"],
    project: "WeddingZai Server",
  });
});


app.listen(PORT, () => {
console.log(`Server running on http://localhost:${PORT}`);
});

const initApp = async () => {
  return new Promise<Express>((resolve, reject) => {
    const db = mongoose.connection;
    db.on("error", (err) => {
      console.error(err);
    });
    db.once("open", () => {
      console.log("Connected to MongoDB");
    });

    if (process.env.MONGO_URI === undefined) {
      //console.error("MONGO_URI is not set");
      reject();
    } else {
      mongoose.connect(process.env.MONGO_URI).then(() => {
        console.log("initApp finish");
        resolve(app);
      });
    }
  });
};

export default initApp;
