import { GoogleGenerativeAI } from '@google/generative-ai';
import { OpenAI, RateLimitError } from 'openai';

export interface SongSuggestion {
  title: string;
  artist: string;
  description: string;
  link: string;
}

const api = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_URL,
});

const systemPrompt = `You are a wedding music expert. Given a user's wedding style and preferences, suggest 3 songs that would be perfect for their wedding. 
For each song, provide:
1. Title (song name)
2. Artist
3. Description (explanation of why it fits their style)
4. Link (YouTube link if possible)

Format your response as a JSON array with these fields:
[
  {
    "title": "Song Name",
    "artist": "Artist Name",
    "description": "Why this song fits",
    "link": "https://youtube.com/..."
  }
]

Important:
- Each suggestion should be unique and tailored to the user's specific request
- The description should clearly connect the song to the user's preferences
- Try to find actual YouTube links for the songs
- If you can't find a YouTube link, leave the link field empty
- Make sure the response is valid JSON`;



export async function suggestSongsFromAI(prompt: string): Promise<SongSuggestion[]> {
  if (!prompt) {
    throw new Error('No promt insert');
  } 
  try {
    const completion = await api.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const response = completion.choices[0].message.content;
      if (!response) {
        throw new Error('No content in AI response');
      }

      const songs = JSON.parse(response) as SongSuggestion[];
      return songs;

  } catch (err) {
    if (err instanceof RateLimitError) throw err;
    console.error('AI service error:', err);
    throw new Error(err instanceof Error ? err.message : String(err));
  }
}