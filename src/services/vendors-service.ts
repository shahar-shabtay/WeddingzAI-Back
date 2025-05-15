// src/services/vendor-service.ts

import FirecrawlApp from "@mendable/firecrawl-js";
import { VendorType, VENDOR_TYPES } from "../config/vendors-types";
import { VendorModel, IVendor } from "../models/vendor-model";

export interface VendorResearchResult {
  vendorType: string;
  urlsFound: number;
  scrapedVendors: Array<{
    id: string;
    name: string;
    url: string;
  }>;
  error?: string;
}

export class VendorService {
  private firecrawlApp: any;

  constructor() {
    const apiKey = process.env.FIRECRAWL_API_KEY!;
    const apiUrl = process.env.FIRECRAWL_API_URL!;
    this.firecrawlApp = new FirecrawlApp({ apiKey, apiUrl });
  }

  /**
   * Analyze the user query to determine which vendor type they're looking for
   */
  analyzeVendorType(userInput: string): VendorType | null {
    const normalizedInput = userInput.toLowerCase();
    
    // Sort vendor types by match score (number of matching keywords)
    const results = VENDOR_TYPES.map(vendorType => {
      const matchScore = vendorType.keywords.reduce((score, keyword) => {
        if (normalizedInput.includes(keyword.toLowerCase())) {
          return score + 1;
        }
        return score;
      }, 0);
      
      return {
        vendorType,
        matchScore
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
    
    // Return the vendor type with the highest match score, if any keywords matched
    if (results.length > 0 && results[0].matchScore > 0) {
      return results[0].vendorType;
    }
    
    // Default to null if no vendor type matched
    return null;
  }

  /**
   * Find vendor URLs from a listing page
   */
  async findVendorUrls(vendorType: VendorType): Promise<string[]> {
    // Ensure we have a valid firecrawlApp instance
    if (!this.firecrawlApp) {
      const apiKey = process.env.FIRECRAWL_API_KEY!;
      const apiUrl = process.env.FIRECRAWL_API_URL!;
      this.firecrawlApp = new FirecrawlApp({ apiKey, apiUrl });
    }
    
    // Replace template variables in the extract prompt
    const prompt = vendorType.extractPrompt.replace(
      "{{listingUrl}}", 
      vendorType.listingUrl
    );

    let result;
    try {
      result = await this.firecrawlApp.extract([vendorType.listingUrl], { prompt });
    } catch (err: any) {
      // on 402, bail out with empty
      if (err.statusCode === 402) {
        console.warn(`[VendorService] Firecrawl 402 on ${vendorType.listingUrl}, returning []`);
        return [];
      }
      throw err;
    }

    if (!result.success) {
      console.warn(`[VendorService] success=false for ${vendorType.listingUrl}`, result.error);
      return [];
    }

    const data0 = Array.isArray(result.data) ? result.data[0] : result.data as any;
    if (!Array.isArray(data0.urls)) {
      console.warn(`[VendorService] malformed response`, data0);
      return [];
    }
    return data0.urls;
  }

  /**
   * Scrape a vendor's details and save to the database
   */
  async scrapeAndSaveVendor(pageUrl: string, vendorType: VendorType): Promise<IVendor> {
    // Check if this vendor URL has already been scraped
    const existing = await VendorModel.findOne({ sourceUrl: pageUrl }).exec();
    if (existing) {
      console.log(`[VendorService] Skip, already scraped: ${pageUrl}`);
      return existing;
    }

    // Ensure we have a valid firecrawlApp instance
    if (!this.firecrawlApp) {
      const apiKey = process.env.FIRECRAWL_API_KEY!;
      const apiUrl = process.env.FIRECRAWL_API_URL!;
      this.firecrawlApp = new FirecrawlApp({ apiKey, apiUrl });
    }

    // Replace template variables in the scrape prompt
    const prompt = vendorType.scrapePrompt.replace(
      /\{\{pageUrl\}\}/g, 
      pageUrl
    );

    let result;
    try {
      result = await this.firecrawlApp.extract([pageUrl], { prompt });
    } catch (err: any) {
      if (err.statusCode === 402) {
        throw new Error(
          "Firecrawl quota exceeded or payment required. Please check your billing plan."
        );
      }
      console.error(`[VendorService] Firecrawl threw:`, err);
      throw err;
    }
    if (!result.success) {
      throw new Error("Firecrawl extract failed: " + result.error);
    }

    // Process the raw scraped data
    const raw = Array.isArray(result.data)
      ? result.data[0]
      : result.data;

    console.log("🔍 Raw Firecrawl output:", JSON.stringify(raw, null, 2));

    // Map the scraped data to our generic vendor model
    const doc: Partial<IVendor> = {
      name: raw.name || "",
      vendorType: vendorType.name,
      
      coverImage: raw.coverImage || "",
      profileImage: raw.profileImage || "",
      eventImages: Array.isArray(raw.eventImages) ? raw.eventImages : [],
      
      about: raw.about || "",
      price_range: raw.price_range || "",
      services: raw.services || "",
      area: raw.area || "",
      genres: raw.genres || "",
      max_companions: raw.max_companions || "",
      price_include: raw.price_include || "",
      max_guests: raw.max_guests || "",
      min_guests: raw.min_guests || "",
      end_time: raw.end_time || "",
      seasons:raw.seasons || "",

      faqs: Array.isArray(raw.faqs) ? raw.faqs : [],
      reviews: Array.isArray(raw.brideReviews) ? raw.brideReviews: [],
      
      socialMedia: {
        facebook: raw.socialMedia?.facebook || "",
        instagram: raw.socialMedia?.instagram || "",
        twitter: raw.socialMedia?.twitter || "",
        youtube: raw.socialMedia?.youtube || "",
      },
      
      website: raw.website || "",
      phone: raw.phone || "",
      
      sourceUrl: pageUrl,
      scrapedAt: new Date(),
      details: raw.details || [],
    };

    // Save to the database using our generic vendor model
    const saved = await VendorModel.findOneAndUpdate(
      { sourceUrl: pageUrl },
      doc,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).exec();

    console.log(
      `[VendorService] Saved ${vendorType.name} "${saved.name}" (_id=${saved._id})`
    );
    return saved;
  }

  /**
   * Process the entire vendor research workflow
   */
  async processVendorResearch(userQuery: string): Promise<VendorResearchResult> {
    try {
      // 1. Analyze the query to determine vendor type
      console.log(`[VendorService] Analyzing query: "${userQuery}"`);
      const vendorType = this.analyzeVendorType(userQuery);
      
      if (!vendorType) {
        return {
          vendorType: "unknown",
          urlsFound: 0,
          scrapedVendors: [],
          error: "Could not determine vendor type from your query. Please be more specific."
        };
      }
      
      console.log(`[VendorService] Detected vendor type: ${vendorType.name}`);
      
      // 2. Find vendor URLs from the listing page
      console.log(`[VendorService] Finding ${vendorType.name} URLs from ${vendorType.listingUrl}`);
      const vendorUrls = await this.findVendorUrls(vendorType);
      
      if (vendorUrls.length === 0) {
        return {
          vendorType: vendorType.name,
          urlsFound: 0,
          scrapedVendors: [],
          error: `No ${vendorType.name} vendors found at the listing URL.`
        };
      }
      
      console.log(`[VendorService] Found ${vendorUrls.length} ${vendorType.name} URLs`);
      
      // 3. Process each vendor URL (with a limit to avoid excessive API usage)
      const MAX_VENDORS = 5; // Adjust as needed
      const vendorsToProcess = vendorUrls.slice(0, MAX_VENDORS);
      
      const scrapedVendors = [];
      for (const url of vendorsToProcess) {
        try {
          console.log(`[VendorService] Scraping ${vendorType.name} at ${url}`);
          const vendor = await this.scrapeAndSaveVendor(url, vendorType);
          
          // Safely handle the MongoDB ObjectId
          const vendorId = vendor._id ? vendor._id.toString() : vendor.id?.toString() || '';
          
          scrapedVendors.push({
            id: vendorId,
            name: vendor.name || '',
            url: url
          });
        } catch (err) {
          console.error(`[VendorService] Error scraping ${url}:`, err);
          // Continue with the next URL even if one fails
        }
      }
      
      return {
        vendorType: vendorType.name,
        urlsFound: vendorUrls.length,
        scrapedVendors: scrapedVendors
      };
    } catch (err: any) {
      console.error("[VendorService] Unexpected error:", err);
      return {
        vendorType: "error",
        urlsFound: 0,
        scrapedVendors: [],
        error: `An unexpected error occurred: ${err.message}`
      };
    }
  }
}

// Create a singleton instance for easy importing
export const vendorService = new VendorService();