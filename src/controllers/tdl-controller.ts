// src/controllers/tdl-controller.ts

import { Response, NextFunction } from "express";
import { BaseController } from "./base-controller";
import tdlModel, { ITDL } from "../models/tdl-model";
import { AuthRequest } from "../common/auth-middleware";
import {
  createTdlFromFile,
  addTask,
  updateTask,
  deleteTask,
  updateWeddingDateWithAI,
  setTaskDone
} from "../services/tdl-service";

class TDLController extends BaseController<ITDL> {
  constructor() {
    super(tdlModel);
  }

  upload = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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

  getByUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const uid = this.getUserId(req);
      if (!uid) throw new Error("Unauthorized");

      const docs = await tdlModel.find({ userId: uid }).sort({ createdAt: -1 });
      this.sendSuccess(res, docs, "Fetched your to-do lists");
    } catch (err: any) {
      this.sendError(res, err);
    }
  };

  addTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const uid = this.getUserId(req);
      if (!uid) throw new Error("Unauthorized");

      const { task, dueDate, priority } = req.body;
      if (!task) throw new Error("Missing task text");

      const updated = await addTask(uid, task, dueDate, priority);
      this.sendSuccess(res, updated, "Task added");
    } catch (err: any) {
      this.sendError(res, err);
    }
  };

  updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const uid = this.getUserId(req);
    if (!uid) throw new Error("Unauthorized");

    const { todoId, sectionName, updates } = req.body;
    if (!todoId || !sectionName || !updates) {
      throw new Error("Missing fields for update");
    }

    const updated = await updateTask(uid, sectionName, todoId, updates);
    this.sendSuccess(res, updated, "Task updated");
  } catch (err: any) {
    this.sendError(res, err);
  }
};

  deleteTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const uid = this.getUserId(req);
      if (!uid) throw new Error("Unauthorized");
      const { sectionName, todoId } = req.body;
      const updated = await deleteTask(uid, sectionName, todoId);
      this.sendSuccess(res, updated, "Task deleted");
    } catch (err: any) {
      this.sendError(res, err);
    }
  };

  updateWeddingDate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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

  setTaskDone = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const uid = this.getUserId(req);
      if (!uid) throw new Error("Unauthorized");

      const { sectionName, todoId, done } = req.body;
      if (!sectionName || !todoId || typeof done !== "boolean") {
        throw new Error("Missing required fields for updating task completion status");
      }

      const updated = await setTaskDone(uid, sectionName, todoId, done);
      this.sendSuccess(res, updated, "Task completion status updated");
    } catch (err: any) {
      this.sendError(res, err);
    }
  };
}

export default new TDLController();
