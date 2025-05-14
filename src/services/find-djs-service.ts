// src/services/find-djs-service.ts
import FirecrawlApp from "@mendable/firecrawl-js";

export async function findDjUrls(listingUrl: string): Promise<string[]> {
  const apiKey = process.env.FIRECRAWL_API_KEY!;
  const apiUrl = process.env.FIRECRAWL_API_URL!;
  const app    = new FirecrawlApp({ apiKey, apiUrl });

  const prompt = `
Given the listing page at URL: ${listingUrl},
extract and return an array of all DJ profile URLs found on that page.
Only output JSON like: { "urls": ["https://…", "https://…", …] }.
  `.trim();

  let result;
  try {
    result = await app.extract([listingUrl], { prompt });
  } catch (err: any) {
    // on 402, bail out with empty
    if (err.statusCode === 402) {
      console.warn(`[findDjUrls] Firecrawl 402 on ${listingUrl}, returning []`);
      return [];
    }
    throw err;
  }

  if (!result.success) {
    console.warn(`[findDjUrls] success=false for ${listingUrl}`, result.error);
    return [];
  }

  const data0 = Array.isArray(result.data) ? result.data[0] : result.data as any;
  if (!Array.isArray(data0.urls)) {
    console.warn(`[findDjUrls] malformed response`, data0);
    return [];
  }
  return data0.urls;
}