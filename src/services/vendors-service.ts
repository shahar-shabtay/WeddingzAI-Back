import FirecrawlApp from "@mendable/firecrawl-js";
import { VendorType, VENDOR_TYPES } from "../config/vendors-types";
import { VendorModel, IVendor } from "../models/vendor-model";
import tdlModel from "../models/tdl-model";
import userModel from "../models/user-model";
// import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";


// const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
// const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export const model = {
  async generateContent(prompt: string) {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini", // or gpt-4.1 / gpt-4o
      messages: [{ role: "user", content: prompt }],
    });

    const content = res.choices?.[0]?.message?.content ?? "";

    // return Gemini-like structure
    return {
      response: {
        text: () => content,
      },
    };
  },
};
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

  // analyze the vendor type from task
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
    const listingUrl = encodeURI(vendorType.listingUrl);

    // --- Venues: collect URLs only from the main content container ---
    if (vendorType.name.toLowerCase() === "venues") {
      try {
        const resp = await (await import("axios")).default.get(listingUrl, { responseType: "arraybuffer" });
        const html = typeof resp.data === "string" ? resp.data : Buffer.from(resp.data).toString("utf8");
        const cheerio = await import("cheerio");
        const $ = cheerio.load(html);

        // candidates only from k2 main list views (avoid header/breadcrumbs/menus)
        const candidates: string[] = [];
        $('#k2Container .itemListView a[href], #k2Container .itemList a[href]').each((_i, el) => {
          const raw = $(el).attr('href') || '';
          if (!raw || raw.startsWith('#') || raw.startsWith('mailto:') || raw.startsWith('tel:')) return;
          try { candidates.push(new URL(raw, listingUrl).toString()); } catch {}
        });

        const base = new URL(listingUrl);
        const host = base.host;

        // identify category pages under /מקום-לאירוע/*.html (not the root)
        const categoryUrls = Array.from(new Set(
          candidates.filter(u => {
            try {
              const x = new URL(u);
              const p = decodeURI(x.pathname);
              return (
                x.host === host &&
                p.startsWith("/מקום-לאירוע/") &&
                p.endsWith(".html") &&
                p !== decodeURI(base.pathname)
              );
            } catch { return false; }
          })
        ));

        // main page may already include direct profiles
        const profilesFromMain = Array.from(new Set(
          candidates.filter(u => {
            try {
              const x = new URL(u);
              const p = decodeURI(x.pathname.toLowerCase());
              const depth = p.split('/').filter(Boolean).length;
              return (
                x.host === host &&
                !p.startsWith('/מקום-לאירוע/') &&
                p.endsWith('.html') &&
                depth <= 1
              );
            } catch { return false; }
          })
        ));

        const profileSet = new Set<string>(profilesFromMain);

        // visit each category and collect only within k2 main list
        for (const catUrl of categoryUrls) {
          try {
            const r = await (await import("axios")).default.get(catUrl, { responseType: "arraybuffer" });
            const htmlCat = typeof r.data === 'string' ? r.data : Buffer.from(r.data).toString('utf8');
            const $cat = (await import('cheerio')).load(htmlCat);

            $cat('#k2Container .itemListView a[href], #k2Container .itemList a[href]').each((_i, el) => {
              const raw = $cat(el).attr('href') || '';
              if (!raw || raw.startsWith('#') || raw.startsWith('mailto:') || raw.startsWith('tel:')) return;
              try {
                const abs = new URL(raw, catUrl);
                const p = decodeURI(abs.pathname.toLowerCase());
                const depth = p.split('/').filter(Boolean).length;
                const looksLikeProfile =
                  abs.host === host &&
                  !p.startsWith('/מקום-לאירוע/') &&
                  p.endsWith('.html') &&
                  depth <= 1; // /name.html
                if (looksLikeProfile) profileSet.add(abs.toString());
              } catch {}
            });
          } catch (e) {
            console.warn(`[VendorService] Venues category fetch failed ${catUrl}:`, e);
          }
        }

        const finalUrls = Array.from(profileSet);
        console.log(`[VendorService] findVendorUrls (Venues) total: ${finalUrls.length}`);
        return finalUrls;
      } catch (e) {
        console.warn(`[VendorService] Venues main scrape failed for ${listingUrl}:`, e);
        return [];
      }
    }

    try {
      console.log(`[VendorService] ${listingUrl}`);
      result = await this.firecrawlApp.extract([listingUrl],  { prompt });
    } catch (err: any) {
      if (err.statusCode === 402) {
        console.warn(`[VendorService] Firecrawl 402 on ${listingUrl}, returning []`);
        return [];
      }
      throw err;
    }

    // Print the raw extract result once for debugging (shape sometimes varies)
    try {
      console.debug(`[VendorService] extract raw (truncated):`, JSON.stringify(result).slice(0, 500) + '...');
    } catch {}

    if (!result || result.success === false) {
      console.warn(`[VendorService] success=false for ${listingUrl}`, (result && (result as any).error) || "");
    }

    // Normalize possible shapes returned by Firecrawl extract
    const datum: any =
      Array.isArray((result as any)?.data) ? (result as any).data[0] : (result as any)?.data;

    let urls: string[] = [];

    if (Array.isArray(datum?.urls)) {
      urls = datum.urls as string[];
    } else if (Array.isArray(datum)) {
      // Some prompts/models return the array directly
      urls = datum as string[];
    } else if (typeof datum?.urls === "string") {
      // Occasionally the field is a JSON string
      try {
        const parsed = JSON.parse(datum.urls);
        if (Array.isArray(parsed)) urls = parsed as string[];
      } catch {}
    }

    // If empty, retry with a stricter prompt that forbids prose/fences
    if (!urls || urls.length === 0) {
      const retryPrompt = `
        From the listing page at URL: ${listingUrl}
        return ONLY JSON with the form: {"urls": ["https://...","https://..."]}
        No markdown, no explanation, no extra keys, no trailing text. Ensure absolute URLs.
      `.trim();

      try {
        const retryRes = await this.firecrawlApp.extract([listingUrl], { prompt: retryPrompt });
        const retryDatum: any =
          Array.isArray((retryRes as any).data) ? (retryRes as any).data[0] : (retryRes as any).data;

        if (Array.isArray(retryDatum?.urls)) {
          urls = retryDatum.urls as string[];
        } else if (Array.isArray(retryDatum)) {
          urls = retryDatum as string[];
        } else if (typeof retryDatum?.urls === "string") {
          try {
            const parsed = JSON.parse(retryDatum.urls);
            if (Array.isArray(parsed)) urls = parsed as string[];
          } catch {}
        }
      } catch (e) {
        console.warn(`[VendorService] retry extract failed for ${listingUrl}:`, e);
      }
    }

    if (!urls || urls.length === 0) {
      console.warn(`[VendorService] malformed/empty extract for ${listingUrl}`, datum);
      return [];
    }

    // Normalize to absolute, deduplicate, and filter obvious junk
    const norm = new Set<string>();
    for (const u of urls) {
      if (!u || typeof u !== "string") continue;
      try {
        const abs = new URL(u, listingUrl).toString();
        if (!abs.startsWith("http")) continue;
        // discard mailto/tel
        if (abs.startsWith("mailto:") || abs.startsWith("tel:")) continue;
        norm.add(abs);
      } catch {
        continue;
      }
    }

    const finalUrls = Array.from(norm);
    console.log(`[VendorService] findVendorUrls for ${vendorType.name}: ${finalUrls.length} urls`);
    return finalUrls;
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
      weekend: raw.weekend || "",
      serv_location:raw.serv_location || "",
      shoot_type: raw.shoot_type || "",
      check_in:  raw.check_in || "",
      check_out: raw.check_out || "",
      max_vendors: raw.max_vendors || "",
      location_facilities: Array.isArray(raw.location_facilities) ? raw.location_facilities : [],
      close_venues:  Array.isArray(raw.close_venues) ? raw.close_venues : [],
      size_range:   raw.size_range || "",
      accessorise:  raw.accessorise || "",
      buy_options:  raw.buy_options || "",
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

    return saved;
  }

  // Process the entire vendor research workflow
  async processVendorResearch(userQuery: string, userId: string): Promise<VendorResearchResult> {
  try {
    const vendorType = this.analyzeVendorType(userQuery);
    console.log(`[VendorService] Analyzed vendor type for query="${userQuery}":`, vendorType ? vendorType.name : "unknown");
    if (!vendorType) {
      return {
        vendorType: "unknown",
        urlsFound: 0,
        scrapedVendors: [],
        error: "Could not determine vendor type from your query. Please be more specific.",
      };
    }

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

              if (!todo.aiSent) {
                todo.aiSent = true;
                updated = true;
                break;
              } else {
              }
            }
          }
          if (updated) break;
        }

        if (updated) {
          tdlDoc.markModified("tdl.sections");
          await tdlDoc.save();
        }
      }
    } catch (err) {
      console.error(`[VendorService] Error updating aiSent field in TDL:`, err);
    }

    // Fetch vendor URLs from listing
      const vendorUrls = await this.findVendorUrls(vendorType);
      console.log(`[VendorService] Found ${vendorUrls.length} vendor URLs for type=${vendorType.name}`);
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

    const relevantVendors = await this.getRelevantVendorsByTDL(userId);
    const vendorIds = relevantVendors.map((v) => v._id);

    await userModel.findByIdAndUpdate(userId, {
        $addToSet: { myVendors: { $each: vendorIds } },
    });
    console.log(`[VendorService] Added ${vendorIds.length} relevant vendors to user ${userId}'s myVendors.`);
    console.log(`[VendorService] processVendorResearch completed for userId=${userId}, vendorType=${vendorType.name}, urlsFound=${vendorUrls.length}, scrapedVendors=${scrapedVendors.length}`);
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

      const searchFields = type.searchField && Array.isArray(type.searchField) && type.searchField.length > 0
        ? type.searchField
        : [ "about" ]; 

      const vendors = await VendorModel.find({ vendorType: type.name });

      const descriptions = vendors.map((v, i) => {
        const fieldValues = searchFields.map((field) => {
          const value = (v as any)[field];

          if (Array.isArray(value)) {
            return `${field}: ${value.join(", ")}`;
          } else {
            return `${field}: ${value || ""}`;
          }
        }).join("\n");

        return `Vendor ${i + 1}: ${v.name}\n${fieldValues}`;
      }).join("\n\n");

      const prompt = `
        Given the task: "${task.task}", select the most relevant vendors from the list below based on the following fields: ${searchFields.join(", ")}.
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
        console.log(`[VendorService] Task "${task.task}" matched ${matched.length} vendors.`);
        results.push(...matched);
      } catch (err) {
        console.error(`[VendorService] OpenAI error in getRelevantVendorsByTDL:`, err);
        continue; 
      }
    }

    try {
      await userModel.findByIdAndUpdate(userId, {
        $addToSet: { myVendors: { $each: results.map((v) => v._id) } },
      });
    } catch (err) {
      console.error(`[VendorService] Failed to update myVendors for user ${userId}:`, err);
    }

    return results;
  }

  // get user match vendors
  async getUserVendors(userId: string): Promise<IVendor[]> {
    const user = await userModel.findById(userId).populate("myVendors");
    if (!user || !Array.isArray(user.myVendors)) return [];
    return user.myVendors as IVendor[];
  }

  // book vendor
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

  // unbook vendor
  async cancelBookedVendor(userId: string, vendorId: string): Promise<boolean> {
    const user = await userModel.findById(userId);
    if (!user) throw new Error("User not found");

    const index = user.bookedVendors.findIndex((v: any) =>
      v.vendorId.toString() === vendorId
    );

    if (index === -1) return false;

    user.bookedVendors.splice(index, 1);
    await user.save();
    return true;
  }

}

export const vendorService = new VendorService();
