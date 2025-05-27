// src/services/vendor-service.ts

import FirecrawlApp from "@mendable/firecrawl-js";
import { VendorType, VENDOR_TYPES } from "../config/vendors-types";
import { VendorModel, IVendor } from "../models/vendor-model";
import tdlModel from "../models/tdl-model";
import userModel from "../models/user-model";
import openai from "../common/openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 


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

  // Analyze the user query to determine which vendor type they're looking for
  analyzeVendorType(userInput: string): VendorType | null {
    const normalizedInput = userInput.toLowerCase();
    
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
    
    if (results.length > 0 && results[0].matchScore > 0) {
      return results[0].vendorType;
    }
    
    return null;
  }

  //  Find vendor URLs from a listing page
  async findVendorUrls(vendorType: VendorType): Promise<string[]> {
    if (!this.firecrawlApp) {
      const apiKey = process.env.FIRECRAWL_API_KEY!;
      const apiUrl = process.env.FIRECRAWL_API_URL!;
      this.firecrawlApp = new FirecrawlApp({ apiKey, apiUrl });
    }
    
    const prompt = vendorType.extractPrompt.replace(
      "{{listingUrl}}", 
      vendorType.listingUrl
    );

    let result;
    try {
      result = await this.firecrawlApp.extract([vendorType.listingUrl], { prompt });
    } catch (err: any) {
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

  // Scrape a vendor's details and save to the database
  async scrapeAndSaveVendor(pageUrl: string, vendorType: VendorType): Promise<IVendor> {
    const existing = await VendorModel.findOne({ sourceUrl: pageUrl }).exec();
    if (existing) {
      return existing;
    }

    if (!this.firecrawlApp) {
      const apiKey = process.env.FIRECRAWL_API_KEY!;
      const apiUrl = process.env.FIRECRAWL_API_URL!;
      this.firecrawlApp = new FirecrawlApp({ apiKey, apiUrl });
    }

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

    const raw = Array.isArray(result.data)
      ? result.data[0]
      : result.data;

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

  // Process the entire vendor research workflow
  async processVendorResearch(userQuery: string, userId: string): Promise<VendorResearchResult> {
  try {
    console.log(`[VendorService] Analyzing query: "${userQuery}"`);
    const vendorType = this.analyzeVendorType(userQuery);

    if (!vendorType) {
      return {
        vendorType: "unknown",
        urlsFound: 0,
        scrapedVendors: [],
        error: "Could not determine vendor type from your query. Please be more specific.",
      };
    }

    console.log(`[VendorService] Detected vendor type: ${vendorType.name}`);

    // Mark aiSent=true in the matching TDL task
    try {
      const tdlDoc = await tdlModel.findOne({ userId });
      if (!tdlDoc || !tdlDoc.tdl || !Array.isArray(tdlDoc.tdl.sections)) {
        console.warn(`[VendorService] No TDL found for userId=${userId}`);
      } else {
        let updated = false;
        for (const section of tdlDoc.tdl.sections) {
          for (const todo of section.todos) {
            const normalized = todo.task.toLowerCase();
            const matchQuery = userQuery.toLowerCase();
            const matchVendor = vendorType.name.toLowerCase();

            if (normalized.includes(matchQuery) || normalized.includes(matchVendor)) {
              console.log(`[VendorService] Matched task: "${todo.task}"`);

              if (!todo.aiSent) {
                todo.aiSent = true;
                updated = true;
                console.log(`[VendorService] Marked aiSent=true for task: "${todo.task}"`);
                break;
              } else {
                console.log(`[VendorService] Task "${todo.task}" already marked aiSent=true`);
              }
            }
          }
          if (updated) break;
        }

        if (updated) {
          tdlDoc.markModified("tdl.sections");
          await tdlDoc.save();
          console.log(`[VendorService] TDL document saved successfully`);
        }
      }
    } catch (err) {
      console.error(`[VendorService] Error updating aiSent field in TDL:`, err);
    }

    // Fetch vendor URLs from listing
    const vendorUrls = await this.findVendorUrls(vendorType);
    if (vendorUrls.length === 0) {
      return {
        vendorType: vendorType.name,
        urlsFound: 0,
        scrapedVendors: [],
        error: `No ${vendorType.name} vendors found at the listing URL.`,
      };
    }

    const MAX_VENDORS = 1000;
    const vendorsToProcess = vendorUrls.slice(0, MAX_VENDORS);
    const scrapedVendors: VendorResearchResult["scrapedVendors"] = [];

    for (const url of vendorsToProcess) {
      try {
        const vendor = await this.scrapeAndSaveVendor(url, vendorType);
        const vendorId = vendor._id?.toString() || vendor.id?.toString() || "";
        scrapedVendors.push({ id: vendorId, name: vendor.name || "", url });
      } catch (err) {
        console.error(`[VendorService] Error scraping ${url}:`, err);
      }
    }

    // ✅ Get relevant vendors using Gemini AI and save to user's myVendors field
    const relevantVendors = await this.getRelevantVendorsByTDL(userId);
    const vendorIds = relevantVendors.map((v) => v._id);

    await userModel.findByIdAndUpdate(userId, {
      $addToSet: { myVendors: { $each: vendorIds } },
    });

    console.log(`[VendorService] Saved ${vendorIds.length} relevant vendors to user ${userId}`);

    return {
      vendorType: vendorType.name,
      urlsFound: vendorUrls.length,
      scrapedVendors,
    };
  } catch (err: any) {
    console.error("[VendorService] Unexpected error:", err);
    return {
      vendorType: "error",
      urlsFound: 0,
      scrapedVendors: [],
      error: `An unexpected error occurred: ${err.message}`,
    };
  }
}

  // AI-based filtering of vendors based on the user's TDL tasks
  async getRelevantVendorsByTDL(userId: string): Promise<IVendor[]> {
  const tdl = await tdlModel.findOne({ userId }).lean();
  if (!tdl || !Array.isArray(tdl.tdl?.sections)) return [];

  const relevantTasks = tdl.tdl.sections
    .flatMap((s: any) => s.todos)
    .filter((t: any) => t.aiSent === true);

  const results: IVendor[] = [];

  for (const task of relevantTasks) {
    const type = this.analyzeVendorType(task.task);
    if (!type) continue;

    const searchField = type.searchField || "about";
    const vendors = await VendorModel.find({ vendorType: type.name });

    const descriptions = vendors.map((v, i) => {
      const value = (v as any)[searchField] || "";
      return `Vendor ${i + 1}: ${v.name}\n${searchField}: ${value}`;
    }).join("\n");

    const prompt = `
      Given the task: "${task.task}", select the most relevant vendors from the list below based on their "${searchField}" field.
      Return a JSON array of the vendor names that best fit the task.

      ${descriptions}
    `;

    try {
      const result = await model.generateContent(prompt);
      let aiContent = result.response.text().trim();

      if (!aiContent) continue;

      if (aiContent.startsWith("```json")) aiContent = aiContent.replace(/^```json/, "").trim();
      if (aiContent.endsWith("```")) aiContent = aiContent.replace(/```$/, "").trim();

      const lowerContent = aiContent.toLowerCase();
      if (
        lowerContent.includes("none of the vendors") ||
        lowerContent.includes("no suitable vendors") ||
        lowerContent.includes("no vendors matched")
      ) continue;

      let selectedNames: string[] = [];
      try {
        const parsed = JSON.parse(aiContent);
        if (Array.isArray(parsed)) {
          selectedNames = parsed;
        } else if (Array.isArray(parsed.vendors)) {
          selectedNames = parsed.vendors;
        } else {
          continue;
        }
      } catch {
        continue;
      }

      if (selectedNames.length === 0) continue;

      const matched = vendors.filter((v) => selectedNames.includes(v.name));
      results.push(...matched);
    } catch {
      continue;
    }
  }

  return results;
}

//   async getRelevantVendorsByTDL(userId: string): Promise<IVendor[]> {
//   const tdl = await tdlModel.findOne({ userId }).lean();
//   if (!tdl || !Array.isArray(tdl.tdl?.sections)) return [];

//   const relevantTasks = tdl.tdl.sections
//     .flatMap((s: any) => s.todos)
//     .filter((t: any) => t.aiSent === true);

//   const results: IVendor[] = [];

//   for (const task of relevantTasks) {
//     const type = this.analyzeVendorType(task.task);
//     if (!type) continue;

//     const vendors = await VendorModel.find({ vendorType: type.name });
//     const descriptions = vendors.map((v, i) => `Vendor ${i + 1}: ${v.name}\nAbout: ${v.about}`).join("\n");

//     const prompt = `
//       Given the task: "${task.task}", select the most relevant vendors from the list below based on their description (about).
//       Return a JSON array of the vendor names that best fit the task.

//       ${descriptions}
//     `;

//     try {
//       const result = await model.generateContent(prompt);
//       let aiContent = result.response.text().trim();

//       if (!aiContent) continue;

//       if (aiContent.startsWith("```json")) aiContent = aiContent.replace(/^```json/, "").trim();
//       if (aiContent.endsWith("```")) aiContent = aiContent.replace(/```$/, "").trim();

//       // Skip meaningless response
//       const lowerContent = aiContent.toLowerCase();
//       if (
//         lowerContent.includes("none of the vendors") ||
//         lowerContent.includes("no suitable vendors") ||
//         lowerContent.includes("no vendors matched")
//       ) continue;

//       // Attempt to parse JSON
//       let selectedNames: string[] = [];
//       try {
//         const parsed = JSON.parse(aiContent);
//         if (Array.isArray(parsed)) {
//           selectedNames = parsed;
//         } else if (Array.isArray(parsed.vendors)) {
//           selectedNames = parsed.vendors;
//         } else {
//           continue; // Unexpected structure, skip silently
//         }
//       } catch {
//         continue; // JSON parse failed, skip silently
//       }

//       if (selectedNames.length === 0) continue;

//       const matched = vendors.filter((v) => selectedNames.includes(v.name));
//       results.push(...matched);
//     } catch {
//       continue; // Gemini error (e.g. quota), silently ignore
//     }
//   }

//   return results;
// }

  async getUserVendors(userId: string): Promise<IVendor[]> {
    const user = await userModel.findById(userId).populate("myVendors");
    if (!user || !Array.isArray(user.myVendors)) return [];
    return user.myVendors as IVendor[];
  }

// src/services/vendor-service.ts
async toggleBookedVendor(userId: string, vendorId: string): Promise<{
  added: boolean;
  message: string;
  vendorType?: string;
}> {
  const user = await userModel.findById(userId);
  if (!user) throw new Error("User not found");

  const vendor = await VendorModel.findById(vendorId);
  if (!vendor) throw new Error("Vendor not found");

  const alreadyBooked = user.bookedVendors.some((bv: any) =>
    typeof bv === 'object'
      ? bv.vendorId.toString() === vendorId
      : bv.toString() === vendorId
  );

  if (alreadyBooked) {
    user.bookedVendors = user.bookedVendors.filter((bv: any) =>
      typeof bv === 'object'
        ? bv.vendorId.toString() !== vendorId
        : bv.toString() !== vendorId
    );
    await user.save();
    return { added: false, message: "UNBOOKED" };
  }

  const sameTypeExists = user.bookedVendors.some((bv: any) =>
    typeof bv === 'object' && bv.vendorType === vendor.vendorType
  );

  if (sameTypeExists) {
    return {
      added: false,
      message: "TYPE_ALREADY_BOOKED",
      vendorType: vendor.vendorType,
    };
  }

  user.bookedVendors.push({ vendorId, vendorType: vendor.vendorType });
  await user.save();
  return { added: true, message: "BOOKED", vendorType: vendor.vendorType };
}

  // vendor-service.ts
  async cancelBookedVendor(userId: string, vendorId: string): Promise<boolean> {
    const user = await userModel.findById(userId);
    if (!user) throw new Error("User not found");

    const index = user.bookedVendors.findIndex((v: any) =>
      v.vendorId.toString() === vendorId
    );

    if (index === -1) return false; // not booked

    user.bookedVendors.splice(index, 1);
    await user.save();
    return true;
  }

}

export const vendorService = new VendorService();