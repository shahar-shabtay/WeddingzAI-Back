import { RateLimitError } from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface SongSuggestion {
  title: string;
  artist: string;
  description: string;
  link: string;
}

const apiKey = process.env.GOOGLE_API_KEY as string;
const genAI  = new GoogleGenerativeAI(apiKey);
const model  = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

const systemPrompt = `You are a wedding music expert. Given a user's wedding style and preferences, suggest 3 songs that would be perfect for their wedding.
For each song, provide:
1. Title (song name)
2. Artist
3. Link (YouTube link if possible)

**Respond with raw JSON only**, do **not** wrap in markdown or code fences.
Bring only songs in english.
Your output must be a JSON array, e.g.:

[
  {
    "title": "Song Name",
    "artist": "Artist Name",
    "link": "https://youtube.com/..."
  },
  … two more …
]`;

export async function suggestSongsFromAI(prompt: string): Promise<SongSuggestion[]> {
  const fullPrompt = `${systemPrompt}\nUser: ${prompt}`;

  try {
    const result  = await model.generateContent(fullPrompt);
    const rawResp = result.response;
    const text    = await rawResp.text();      // raw string, no fences

    // guard empty
    if (!text) throw new Error('Empty response from AI');

    // parse JSON
    const songs = JSON.parse(text) as SongSuggestion[];
    return songs;

  } catch (err) {
    // let controller handle rate‐limit specially
    if (err instanceof RateLimitError) throw err;
    console.error('AI service error:', err);
    throw new Error(err instanceof Error ? err.message : String(err));
  }
}