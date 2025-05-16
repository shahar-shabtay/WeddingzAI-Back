// src/controllers/tdl-controller.ts

import { Response, NextFunction } from "express";
import { BaseController } from "./base-controller";
import tdlModel, { ITDL } from "../models/tdl-model";
import { AuthRequest } from "../common/auth-middleware";
import { createTdlFromFile } from "../services/tdl-service";

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
}

export default new TDLController();