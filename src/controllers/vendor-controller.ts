
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
      
      await vendorQueue.add({ query, userId });
      res.status(202).json({
        message: "Research job queued",
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
      
      const vendors = await this.model.find({ vendorType: type });
      
      this.sendSuccess(res, vendors);
    } catch (err: any) {
      this.sendError(res, err, 400);
    }
  }

  // Search vendors by name or attribute
  async search(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { query, type } = req.query;
      
      const filter: any = {};
      
      if (query && typeof query === 'string') {
        filter.name = { $regex: query, $options: 'i' };
      }
      
      if (type && typeof type === 'string') {
        filter.vendorType = type;
      }
      
      const vendors = await this.model.find(filter);
      
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
}

  async getVendorSummary(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const user = await userModel.findById(userId).populate("myVendors");
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

  async getAllVendors(req: AuthRequest, res: Response): Promise<void> {
    try {

      const vendors = await vendorService.getAllVendors();


      this.sendSuccess(res, vendors, "Fetched vendors");
    } catch (err: any) {
      this.sendError(res, err, 500);
    }
  }

  async getUserBookedVendors(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        this.sendError(res, new Error("Unauthorized"), 401);
        return;
      }
  
      const user = await userModel
        .findById(userId)
        .populate('bookedVendors.vendorId') // populate vendorId references
        .lean();
  
      if (!user || !user.bookedVendors || user.bookedVendors.length === 0) {
        this.sendSuccess(res, [], "No booked vendors found");
        return;
      }
  
      const bookedVendorsWithDetails = user.bookedVendors.map((entry: any) => ({
        vendorType: entry.vendorType,
        vendor: entry.vendorId, // this is the populated vendor object
      }));
  
      this.sendSuccess(res, bookedVendorsWithDetails, "Fetched booked vendors");
    } catch (err: any) {
      this.sendError(res, err, 500);
    }
  }
  

  async refetchRelevantVendors(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?._id?.toString(); // or req.userId
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const vendors = await vendorService.getRelevantVendorsByTDL(userId);
      res.status(200).json({ success: true, data: vendors });
    } catch (err) {
      console.error("[VendorController] refetchRelevantVendors:", err);
      res.status(500).json({ error: "Failed to fetch relevant vendors" });
    }
  }

async toggleBooked(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?._id;
    const { vendorId } = req.body;

    if (!userId || !vendorId) {
      res.status(400).json({ success: false, error: "Missing user or vendor ID" });
      return;
    }

    const result = await vendorService.toggleBookedVendor(userId, vendorId);

    res.status(200).json({
      success: true,
      ...result, // includes added, message, vendorType
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || "Internal server error"
    });
  }
}

  async cancelBook(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?._id;
    const { vendorId } = req.body;

    if (!userId || !vendorId) {
      res.status(400).json({ success: false, error: "Missing user or vendor ID" });
      return;
    }

    const removed = await vendorService.cancelBookedVendor(userId, vendorId);
    if (!removed) {
      res.status(404).json({ success: false, message: "Vendor not booked" });
      return;
    }

    res.status(200).json({ success: true, message: "Booking canceled" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
  
}

export const vendorController = new VendorController();