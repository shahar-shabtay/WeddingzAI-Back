// src/controllers/tdl-controller.ts

import { Response, NextFunction } from "express";
import { BaseController } from "./base-controller";
import tdlModel, { ITDL } from "../models/tdl-model";
import { AuthRequest } from "../common/auth-middleware";
import { createTdlFromFile, addTask, updateTask, deleteTask , updateWeddingDateWithAI} from "../services/tdl-service";

class TDLController extends BaseController<ITDL> {
  constructor() {
    super(tdlModel);
  }

  upload = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const fp = req.file?.path;
      if (!fp) throw new Error("No file uploaded");

      const uid = this.getUserId(req);
      if (!uid) throw new Error("Unauthorized");

      const saved = await createTdlFromFile(fp, uid);
      this.sendSuccess(res, saved, "To-Do list created");
    } catch (err: any) {
      this.sendError(res, err);
    }
  };

  getByUser = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const uid = this.getUserId(req);
      if (!uid) throw new Error("Unauthorized");

      // Find all TDL docs for this user
      const docs = await tdlModel.find({ userId: uid }).sort({ createdAt: -1 });
      this.sendSuccess(res, docs, "Fetched your to-do lists");
    } catch (err: any) {
      this.sendError(res, err);
    }
  };

  // POST /api/tdl/task — add a task to a section
  addTask = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const uid = this.getUserId(req);
      if (!uid) throw new Error("Unauthorized");
      const { sectionName, task, dueDate, priority } = req.body;
      const updated = await addTask(uid, sectionName, task, dueDate, priority);
      this.sendSuccess(res, updated, "Task added");
    } catch (err: any) {
      this.sendError(res, err);
    }
  };

  // PUT /api/tdl/task — update a task in a section
  updateTask = async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    try {
      const uid = this.getUserId(req);
      if (!uid) throw new Error("Unauthorized");
      const { sectionName, index, updates } = req.body;
      const updated = await updateTask(uid, sectionName, index, updates);
      this.sendSuccess(res, updated, "Task updated");
    } catch (err: any) {
      this.sendError(res, err);
    }
  };

  // DELETE /api/tdl/task — remove a task from a section
  deleteTask = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const uid = this.getUserId(req);
      if (!uid) throw new Error("Unauthorized");
      const { sectionName, index } = req.body;
      const updated = await deleteTask(uid, sectionName, index);
      this.sendSuccess(res, updated, "Task deleted");
    } catch (err: any) {
      this.sendError(res, err);
    }
  };

 updateWeddingDate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const uid = this.getUserId(req);
      if (!uid) throw new Error("Unauthorized");

      const { newWeddingDate } = req.body;
      if (typeof newWeddingDate !== "string") {
        throw new Error("Invalid wedding date format");
      }

      const updated = await updateWeddingDateWithAI(uid, newWeddingDate);
      this.sendSuccess(res, updated, "Wedding date updated");
    } catch (err: any) {
      this.sendError(res, err);
    }
  };

}

export default new TDLController();