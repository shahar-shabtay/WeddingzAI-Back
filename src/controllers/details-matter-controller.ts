import { OpenAI, RateLimitError } from 'openai';
import { RequestHandler } from 'express';

const api = new OpenAI({
  apiKey: process.env.AI_API_KEY,
  baseURL: process.env.AI_BASE_URL || "https://api.aimlapi.com/v1",
});

const systemPrompt = `You are a wedding music expert. Given a user's wedding style and preferences, suggest 3 songs that would be perfect for their wedding. 
For each song, provide:
1. Song name
2. Artist
3. A brief explanation of why it fits their style
4. A YouTube link if possible

Format your response as a JSON array with these fields:
{
  "songs": [
    {
      "name": "Song Name",
      "artist": "Artist Name",
      "explanation": "Why this song fits",
      "youtubeLink": "https://youtube.com/..."
    }
  ]
}`;

export const suggestSongs: RequestHandler = async (req, res, next) => {
  const { prompt } = req.body;

  if (!prompt) {
    res.status(400).json({ error: 'Missing prompt in request body' });
    return;
  }

  try {
    const completion = await api.chat.completions.create({
      model: "gpt-4",
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
      res.status(500).json({ error: 'No response from AI' });
      return;
    }
    
    try {
      const songs = JSON.parse(response);
      res.status(200).json(songs);
    } catch (parseError) {
      console.error('Error parsing ChatGPT response:', parseError);
      res.status(500).json({ error: 'Error processing AI response' });
    }

  } catch (error) {
    if (error instanceof RateLimitError) {
      res.status(429).json({ error: 'Rate limit exceeded. Please wait and try again later.' });
    } else {
      console.error('ChatGPT API error:', error);
      res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
  }
}; 
=======
import { Request, Response } from 'express';

const api = new OpenAI({
  apiKey: process.env.AIMLAPI_KEY,
  baseURL: "https://api.aimlapi.com/v1",
});

// Add this at the top of your controller
console.log('🔧 [Details Matter] API Configuration:', {
    hasApiKey: !!process.env.AIMLAPI_KEY,
    baseURL: process.env.AI_BASE_URL || "https://api.aimlapi.com/v1"
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

const detailsMatterController = {
  suggestSongs: async (req: Request, res: Response) => {
    const { prompt } = req.body;

    if (!prompt) {
        console.log('❌ [Details Matter] Missing prompt');
        res.status(400).json({ error: 'Missing prompt in request body' });
        return;
      }

    try {
        console.log('🤖 [Details Matter] Request to AI API:', {
            model: "gpt-3.5-turbo",
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
    
      const completion = await api.chat.completions.create({
        model: "gpt-3.5-turbo",
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

      console.log('✅ [Details Matter] AI API response:', completion);

      const response = completion.choices[0].message.content;
      if (!response) {
        console.log('❌ [Details Matter] No content in AI response');
        res.status(500).json({ error: 'No response from AI' });
        return;
      }
      
      try {
        console.log('🔄 [Details Matter] Parsing AI response:', response);
        const songs = JSON.parse(response);
        res.status(200).json(songs);
        console.log('✅ [Details Matter] Successfully parsed AI response');
      } catch (parseError) {
        console.error('❌ [Details Matter] Error parsing ChatGPT response:', parseError);
        res.status(500).json({ error: 'Error processing AI response' });
      }

    } catch (error) {
      console.error('❌ [Details Matter] Error details:', error);
      if (error instanceof RateLimitError) {
        console.error('⚠️ [Details Matter] Rate limit error:', error);
        res.status(429).json({ 
          error: 'Rate limit exceeded', 
          message: 'Please wait a few seconds before trying again',
          retryAfter: 5 // seconds
        });
      } else {
        console.error('❌ [Details Matter] ChatGPT API error:', error);
        res.status(500).json({ 
          error: 'An error occurred while processing your request',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }
};

export default detailsMatterController; 
