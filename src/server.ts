import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response, Express } from "express";
import cors from "cors";
import path from "path";
import mongoose from "mongoose";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUI from "swagger-ui-express";

// Routes
import authRoutes from "./routes/auth-routes";
import tdlRoutes from "./routes/tdl-routes";
import guestRoutes from "./routes/guest-routes";
import detailsMatterRoutes from "./routes/details-matter-routes";
import vendorsRoute from "./routes/vendor_routes";
import budgetRoutes from "./routes/budget_routes";
import fileRoutes from "./routes/file-routes";
import tableRoutes from "./routes/table-route";
import invitationRoutes from "./routes/invitation-routes";
import menuRoutes from "./routes/menu-routes";
import calendarRoutes from "./routes/calendar-routes";

const app = express();

const apiBase = "/api";

// CORS options
const corsOptions = {
  origin: "*", // אם תרצה להגביל דומיינים תגדיר פה
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Swagger Documentation
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Web Dev 2025 REST API",
      version: "1.0.0",
      description: "REST server including authentication using JWT",
    },
    servers: [{ url: "http://localhost:" + process.env.PORT + "/api" }, 
    { url: process.env.DOMAIN_BASE}],
  },
  apis: ["./src/routes/*.ts"],
};
const specs = swaggerJsDoc(options);
app.use(`${apiBase}/api-docs`, swaggerUI.serve, swaggerUI.setup(specs));


// Static files middleware - חייב להיות לפני ה-API routes
app.use('/static', express.static(path.join(__dirname, './static')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res) => {
    res.set('Access-Control-Allow-Origin', '*');
  }
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// JSON Body parser
app.use(express.json());

// CORS middleware
app.use(cors(corsOptions));

// API routes
app.use(`${apiBase}/guests`, guestRoutes);
app.use(`${apiBase}/auth`, authRoutes); 
app.use(`${apiBase}/budget`, budgetRoutes);
app.use(`${apiBase}/tdl`, tdlRoutes);
app.use(`${apiBase}/tables`, tableRoutes);
app.use(`${apiBase}/details-matter`, detailsMatterRoutes);
app.use(`${apiBase}/vendors`, vendorsRoute);
app.use(`${apiBase}/file`, fileRoutes);
app.use(`${apiBase}/invitation`, invitationRoutes);
app.use(`${apiBase}/menu`, menuRoutes);
app.use(`${apiBase}/calendar`, calendarRoutes);

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

// MongoDB connection and app initialization
const initApp = async (): Promise<Express> => {
  return new Promise<Express>((resolve, reject) => {
    const db = mongoose.connection;

    db.on("error", (err) => {
      console.error("MongoDB connection error:", err);
      reject(err);
    });

    db.once("open", () => {
      console.log("Connected to MongoDB");
    });

    if (!process.env.MONGO_URI) {
      reject(new Error("MONGO_URI not defined in environment variables"));
      return;
    }

    mongoose.connect(process.env.MONGO_URI)
      .then(() => {
        console.log("MongoDB connected");
        resolve(app);
      })
      .catch((err) => {
        console.error("Failed to connect to MongoDB:", err);
        reject(err);
      });
  });
};

export default initApp;