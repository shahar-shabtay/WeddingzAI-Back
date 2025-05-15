
// src/controllers/vendor-controller.ts

import { Response } from "express";
import { BaseController } from "./base-controller";
import { VendorModel, IVendor } from "../models/vendor-model";
import { vendorService } from "../services/vendors-service";
import { AuthRequest } from "../common/auth-middleware";

export class VendorController extends BaseController<IVendor> {
  constructor() {
    super(VendorModel);
  }


  // הוסף את הפונקציה הזו לקובץ src/controllers/vendor-controller.ts
/**
 * Start a vendor research task in the background
 */
async startBackgroundResearch(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { query } = req.body;
    
    if (!query || typeof query !== "string") {
      // שינוי: במקום להשתמש ב-this.sendError, שולחים תשובה ישירות
      res.status(400).json({ 
        success: false, 
        error: "Query is required and must be a string" 
      });
      return;
    }
    
    console.log(`[VendorController] Starting background research for query: "${query}"`);
    
    // התחלת התהליך ברקע ללא המתנה לסיום
    vendorService.processVendorResearch(query)
      .then(result => {
        console.log(`[VendorController] Background research completed. Found ${result.scrapedVendors.length} vendors of type ${result.vendorType}`);
      })
      .catch(err => {
        console.error(`[VendorController] Background research failed:`, err);
      });
    
    // שינוי: במקום להשתמש ב-this.sendSuccess, שולחים תשובה ישירות
    res.status(200).json({
      message: "Research started in background",
      success: true,
      vendorType: "pending" // הערך יוחלף לאחר האנליזה
    });
  } catch (err: any) {
    console.error("[VendorController] Error starting background research:", err);
    // שינוי: במקום להשתמש ב-this.sendError, שולחים תשובה ישירות
    res.status(500).json({ 
      success: false, 
      error: err.message || "Unexpected error" 
    });
  }
}
  /**
   * Process a vendor research task from the user's query
   */
  async processResearchTask(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { query } = req.body;
      
      if (!query || typeof query !== "string") {
        this.sendError(res, new Error("Query is required and must be a string"), 400);
        return;
      }
      
      console.log(`[VendorController] Processing research task with query: "${query}"`);
      const result = await vendorService.processVendorResearch(query);
      
      if (result.error) {
        console.log(`[VendorController] Research task completed with error: ${result.error}`);
        this.sendError(res, new Error(result.error), 400);
        return;
      }
      
      console.log(`[VendorController] Research task completed successfully: Found ${result.urlsFound} vendors, scraped ${result.scrapedVendors.length}`);
      this.sendSuccess(res, result, `Successfully researched ${result.vendorType} vendors`);
      return;
    } catch (err: any) {
      console.error("[VendorController] Unexpected error:", err);
      this.sendError(res, err);
      return;
    }
  }

  /**
   * Get vendors filtered by type
   */
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

  /**
   * Search vendors by name or attribute
   */
  async search(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { query, type } = req.query;
      console.log(`[VendorController] Searching vendors with query: "${query}" ${type ? `and type: ${type}` : ''}`);
      
      // Build the search filter
      const filter: any = {};
      
      if (query && typeof query === 'string') {
        // Search by name using case-insensitive regex
        filter.name = { $regex: query, $options: 'i' };
      }
      
      if (type && typeof type === 'string') {
        // Filter by vendor type
        filter.vendorType = type;
      }
      
      const vendors = await this.model.find(filter);
      console.log(`[VendorController] Search found ${vendors.length} vendors`);
      
      this.sendSuccess(res, vendors);
    } catch (err: any) {
      this.sendError(res, err, 400);
    }
  }
}

// Create singleton instance
export const vendorController = new VendorController();