import FirecrawlApp from "@mendable/firecrawl-js";

export async function findDjUrls(listingUrl: string): Promise<string[]> {
  const apiKey = process.env.FIRECRAWL_API_KEY!;
  const apiUrl = process.env.FIRECRAWL_API_URL!;
  const app = new FirecrawlApp({ apiKey, apiUrl });

  // Prompt: להוציא את כל כתובות ה-DJ מתוך העמוד
  const prompt = `
Given the listing page at URL: ${listingUrl},
extract and return an array of all DJ profile URLs found on that page.
Only output JSON like: { "urls": ["https://…", "https://…", …] }.
  `.trim();

  const result = await app.extract(
    [listingUrl],
    { prompt }
  );

  if (!result.success) {
    throw new Error("findDjUrls failed: " + result.error);
  }

  // FirecrawlJS מחזיר data[0] כ־object
  const data0 = Array.isArray(result.data)
    ? result.data[0]
    : (result.data as any);

  if (!data0.urls || !Array.isArray(data0.urls)) {
    throw new Error("Unexpected response format for findDjUrls");
  }

  return data0.urls as string[];
}