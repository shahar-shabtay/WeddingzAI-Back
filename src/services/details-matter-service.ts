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

const systemPrompt = `You are a wedding music expert. Given a user's wedding style and preferences, suggest songs that would be perfect for their wedding. 

CRITICAL REQUIREMENTS:
- ONLY suggest songs if you can provide a REAL, VERIFIABLE YouTube link
- DO NOT make up or generate fake YouTube links
- If you cannot find a real YouTube link for a song, DO NOT include that song in your suggestions
- Only include songs where you are certain the YouTube link is valid and accessible

For each song, provide:
1. Title (song name)
2. Artist
3. Description (explanation of why it fits their style)
4. Link (REAL YouTube link only - must be verifiable)

Format your response as a JSON array with these fields:
[
  {
    "title": "Song Name",
    "artist": "Artist Name", 
    "description": "Why this song fits",
    "link": "https://youtube.com/watch?v=REAL_VIDEO_ID"
  }
]

Important:
- Each suggestion should be unique and tailored to the user's specific request
- The description should clearly connect the song to the user's preferences
- ONLY include songs with REAL, VERIFIABLE YouTube links
- If you cannot find real YouTube links, return an empty array []
- Make sure the response is valid JSON
- DO NOT generate or make up YouTube links`;



export async function suggestSongsFromAI(prompt: string): Promise<SongSuggestion[]> {
  if (!prompt || prompt.trim().length === 0) {
    throw new Error('No prompt provided');
  } 
  
  try {
    const completion = await api.chat.completions.create({
        model: "gpt-4o", // Fixed model name
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
        max_tokens: 2000, // Increased for better responses
      });

      const response = completion.choices[0].message.content;
      if (!response) {
        throw new Error('No content in AI response');
      }

      console.log(`[DetailsMatterService] Raw AI response:`, response);

      // Clean the response before parsing
      let cleanedResponse = response.trim();
      
      // Remove markdown code blocks if present
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      let songs: any[];
      try {
        songs = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error('[DetailsMatterService] JSON parse error:', parseError);
        console.error('[DetailsMatterService] Failed to parse response:', cleanedResponse);
        throw new Error('Invalid JSON response from AI');
      }

      // Validate that we got an array
      if (!Array.isArray(songs)) {
        console.error('[DetailsMatterService] AI response is not an array:', songs);
        throw new Error('AI response is not an array');
      }

      console.log(`[DetailsMatterService] AI returned ${songs.length} songs`);
      
      // Filter and validate songs
      const validSongs = songs.filter((song, index) => {
        // Check if song object exists and has required properties
        if (!song || typeof song !== 'object') {
          console.log(`[DetailsMatterService] Filtering out song at index ${index} - not an object`);
          return false;
        }

        // Validate required properties
        if (!song.title || typeof song.title !== 'string' || song.title.trim().length === 0) {
          console.log(`[DetailsMatterService] Filtering out song at index ${index} - invalid title:`, song.title);
          return false;
        }

        if (!song.artist || typeof song.artist !== 'string' || song.artist.trim().length === 0) {
          console.log(`[DetailsMatterService] Filtering out song "${song.title}" - invalid artist:`, song.artist);
          return false;
        }

        if (!song.description || typeof song.description !== 'string' || song.description.trim().length === 0) {
          console.log(`[DetailsMatterService] Filtering out song "${song.title}" - invalid description:`, song.description);
          return false;
        }

        if (!song.link || typeof song.link !== 'string' || song.link.trim().length === 0) {
          console.log(`[DetailsMatterService] Filtering out song "${song.title}" - no link or invalid link type`);
          return false;
        }
        
        // Check if it's a valid YouTube URL
        const youtubeRegex = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;
        const isValid = youtubeRegex.test(song.link);
        
        if (!isValid) {
          console.log(`[DetailsMatterService] Filtering out song "${song.title}" - invalid YouTube URL: ${song.link}`);
          return false;
        }
        
        return true;
      });
      
      console.log(`[DetailsMatterService] Returning ${validSongs.length} valid songs with YouTube links`);
      return validSongs;

  } catch (err) {
    if (err instanceof RateLimitError) throw err;
    console.error('AI service error:', err);
    throw new Error(err instanceof Error ? err.message : String(err));
  }
}