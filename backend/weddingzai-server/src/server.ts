import express, { Application, Request, Response } from "express";

import cors from "cors";
import uploadRoutes from "./routes/upload-routes";
import formUploadRoutes from "./routes/form-routes";

const app: Application = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

const apiBase = "/api";

app.use(apiBase, uploadRoutes);
app.use(apiBase, formUploadRoutes);

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
