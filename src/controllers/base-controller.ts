import { Response } from "express";
import mongoose, { Model } from "mongoose";
import { AuthRequest } from "../common/auth-middleware";

// A generic controller providing basic CRUD and user-scoped retrieval.
export class BaseController<T> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  // Extracts the authenticated user's ID from the request.
  protected getUserId(req: AuthRequest): string | null {
    return req.user?._id || null;
  }

  //  Sends a standard success response.
  protected sendSuccess(res: Response, data: any, message = "Success") {
    return res.status(200).json({ message, data });
  }

  //  Sends a standardized error response.
  protected sendError(res: Response, error: any, code = 500) {
    console.error("Controller Error:", error);
    return res
      .status(code)
      .json({ error: error?.message || "Unexpected error" });
  }

  /**
   * POST / — create new document with user ID
   */
  async createItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req);
      if (!userId) throw new Error("Unauthorized");
      const newItem = await this.model.create({ ...req.body, userId: userId });
      this.sendSuccess(res, newItem, "Created");
    } catch (err: any) {
      const status = err.message === "Unauthorized" ? 401 : 400;
      this.sendError(res, err, status);
    }
  }

  //  GET /    — list all documents
  async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const items = await this.model.find();
      this.sendSuccess(res, items);
    } catch (err: any) {
      this.sendError(res, err, 400);
    }
  }

  // GET /:id — get document by its ID
  async getById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id;

    // ** בדיקת תקינות ObjectId **
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: "Invalid ObjectId" });
      return;
    }

    const item = await this.model.findById(id);
    if (!item) {
      console.warn("[BaseController] Item not found for ID:", id);
      res.status(404).json({ message: "Not found" });
      return;
    }

    this.sendSuccess(res, item);
  } catch (err: any) {
    console.error("[BaseController] getById error:", err);
    this.sendError(res, err, 400);
  }
}

  // GET /mine — get all documents belonging to the authenticated user
  async getMine(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req);
      if (!userId) throw new Error("Unauthorized");
      const items = await this.model.find({ userId });
      this.sendSuccess(res, items);
    } catch (err: any) {
      const status = err.message === "Unauthorized" ? 401 : 400;
      this.sendError(res, err, status);
    }
  }

  // DELETE /:id — delete a document by its ID
  async deleteItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await this.model.findByIdAndDelete(req.params.id);
      this.sendSuccess(res, result);
    } catch (err: any) {
      this.sendError(res, err, 400);
    }
  }

  /**
   * PATCH /:id — update a document by its ID
   */
  async updateItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      const updated = await this.model.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      if (!updated) {
        this.sendError(res, new Error("Not found"), 404);
        return;
      }
      this.sendSuccess(res, updated, "Updated");
    } catch (err: any) {
      this.sendError(res, err, 400);
    }
  }
}
