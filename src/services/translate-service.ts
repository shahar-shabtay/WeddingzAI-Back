// src/services/translate-service.ts

// Pull in the default export
const translate = require("@vitalets/google-translate-api").default as (
  text: string,
  opts: { to: string }
) => Promise<{ text: string }>;

/**
 * Translate Hebrew → English if there are Hebrew letters.
 * Otherwise return the original.
 */
export async function translateText(text: string): Promise<string> {
  if (!/[א-ת]/.test(text)) return text;

  try {
    const res = await translate(text, { to: "en" });
    return res.text;
  } catch (err) {
    console.warn("[translateText] google-translate-api failed, returning original:", err);
    return text;
  }
}