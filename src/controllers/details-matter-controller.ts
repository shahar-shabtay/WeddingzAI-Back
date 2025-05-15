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