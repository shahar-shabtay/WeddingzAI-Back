
// src/controllers/vendor-controller.ts

import { Response } from "express";
import { BaseController } from "./base-controller";
import { VendorModel, IVendor } from "../models/vendor-model";
import { vendorService } from "../services/vendors-service";
import { AuthRequest } from "../common/auth-middleware";
import vendorQueue from "../queue/Vendors-Queue";
import userModel from "../models/user-model";

export class VendorController extends BaseController<IVendor> {
  constructor() {
    super(VendorModel);
  }

  // Add a vendor research task to queue
  async startBackgroundResearch(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { query , userId} = req.body;
      
      if (!query || typeof query !== "string") {
        res.status(400).json({ success: false, error: "Query is required and must be a string" });
        return;
      }
      
<<<<<<< HEAD
      console.log(`[VendorController] Starting background research for query: "${query}"`);
      await vendorQueue.add({ query, userId });      
      res.status(200).json({
        message: "Research started in background",
=======
            console.log(`[VendorController] Queuing background research for query: "${query}"`);
      await vendorQueue.add({ query, userId });
      res.status(202).json({
        message: "Research job queued",
>>>>>>> 3290df8 (Add crud for tdl)
        success: true,
        vendorType: "pending"
      });
    } catch (err: any) {
      console.error("[VendorController] Error queuing task:", err);
      res.status(500).json({ success: false, error: err.message || "Unexpected error" });
    }
  }

  // Get vendors filtered by type
  async getByType(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { type } = req.params;
      console.log(`[VendorController] Getting vendors by type: ${type}`);
      
      const vendors = await this.model.find({ vendorType: type });
      console.log(`[VendorController] Found ${vendors.length} vendors of type: ${type}`);
      
      this.sendSuccess(res, vendors);
    } catch (err: any) {
      this.sendError(res, err, 400);
    }
  }

  // Search vendors by name or attribute
  async search(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { query, type } = req.query;
      console.log(`[VendorController] Searching vendors with query: "${query}" ${type ? `and type: ${type}` : ''}`);
      
      const filter: any = {};
      
      if (query && typeof query === 'string') {
        filter.name = { $regex: query, $options: 'i' };
      }
      
      if (type && typeof type === 'string') {
        filter.vendorType = type;
      }
      
      const vendors = await this.model.find(filter);
      console.log(`[VendorController] Search found ${vendors.length} vendors`);
      
      this.sendSuccess(res, vendors);
    } catch (err: any) {
      this.sendError(res, err, 400);
    }
  }

  // Get relevant vendors based on user's TDL tasks that were sent to AI
  async getRelevantVendors(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?._id;
    if (!userId) 
    {
        this.sendError(res, new Error("Unauthorized"), 401);
        return;
<<<<<<< HEAD
    }

    const user = await userModel.findById(userId).populate("myVendors");
    if (!user?.myVendors) 
    {
      this.sendSuccess(res, [], "No relevant vendors found");
      return;
    }

    this.sendSuccess(res, user.myVendors, "Vendors matched to your TDL tasks");
  } catch (err: any) {
    console.error("[VendorController] Failed to get relevant vendors:", err);
    this.sendError(res, err);
  }
=======
      }
      const dj = await scrapeAndSaveDj(url);
      res.json({ success: true, dj });
    } catch (err) {
      next(err);
    }
  };
>>>>>>> 3290df8 (Add crud for tdl)
}

async getVendorSummary(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = await userModel.findById(userId).populate("myVendors").lean();
    if (!user || !user.myVendors || !Array.isArray(user.myVendors)) {
      res.status(200).json({ total: 0, counts: {} });
      return;
    }

    const counts: Record<string, number> = {};
    user.myVendors.forEach((v: any) => {
      counts[v.vendorType] = (counts[v.vendorType] || 0) + 1;
    });

    res.status(200).json({ total: user.myVendors.length, counts });
  } catch (err) {
    console.error("[VendorController] Error in getVendorSummary", err);
    res.status(500).json({ error: "Failed to load vendor summary" });
  }
}

async getUserVendors(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?._id;
    if (!userId) {
      this.sendError(res, new Error("Unauthorized"), 401);
      return;
    }

    const user = await userModel.findById(userId).populate('myVendors').lean();
    if (!user || !user.myVendors) {
      this.sendSuccess(res, [], "No vendors found");
      return;
    }

    this.sendSuccess(res, user.myVendors, "Fetched user vendors");
  } catch (err: any) {
    this.sendError(res, err, 500);
  }
}


  
}

export const vendorController = new VendorController();