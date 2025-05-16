import dotenv from "dotenv";
dotenv.config();

import express, { Application, Request, Response, Express } from "express";
import cors from "cors";
import path from "path";
import mongoose from "mongoose";

// Routes
import tdlRoutes from "./routes/tdl-routes";
import authRoutes from "./routes/auth-routes";
import guestRoutes from "./routes/guest-routes";
import detailsMatterRoutes from "./routes/details-matter-routes";
import vendorsRoute from "./routes/vendor_routes";
import budgetRoutes from "./routes/budget_routes";
import fileRoutes from "./routes/file-routes";

const app = express();
const apiBase = "/api";

// CORS
const corsOptions = {
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(express.json());
app.use(cors(corsOptions));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "*");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});

// Static files
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// API routes
app.use("/api/budget", budgetRoutes);
app.use(apiBase, tdlRoutes);
app.use(apiBase, authRoutes);
app.use(apiBase, detailsMatterRoutes);
app.use(apiBase, vendorsRoute);
app.use(apiBase, guestRoutes); // includes /api/rsvp
app.use(apiBase, fileRoutes);

// Root route
app.get("/", (req: Request, res: Response) => {
  res.json({
    owners: [
      "Gavriel Matatov",
      "Gal Ternovsky",
      "Shahar Shabtay",
      "Gefen Kidmi",
      "Ziv Klien",
    ],
    project: "WeddingZai Server",
  });
});

// Init
const initApp = async (): Promise<Express> => {
  return new Promise((resolve, reject) => {
    const db = mongoose.connection;
    db.on("error", console.error);
    db.once("open", () => console.log("Connected to MongoDB"));

    if (!process.env.MONGO_URI) return reject("Missing MONGO_URI");

    mongoose.connect(process.env.MONGO_URI).then(() => {
      console.log("initApp finish");
      resolve(app);
    });
  });
};

export default initApp;
