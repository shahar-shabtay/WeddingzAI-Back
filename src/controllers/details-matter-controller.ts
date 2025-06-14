// src/controllers/details-matter.controller.ts
import { Request, Response } from 'express';
import { RateLimitError } from 'openai';
import * as service from '../services/details-matter-service';
import { AuthRequest } from '../common/auth-middleware';

async function suggestSongsHandler(req: Request, res: Response): Promise<void> {
  const { prompt } = req.body;
  if (!prompt) {
    res.status(400).json({ error: 'Missing prompt in request body' });
    return;
  }

  if (typeof prompt !== 'string') {
    res.status(400).json({ error: 'Prompt must be a string' });
    return;
  }

  if (prompt.trim() === '') {
    res.status(400).json({ error: 'Prompt cannot be empty' });
    return;
  }

  try {
    const songs = await service.suggestSongsFromAI(prompt);
    res.status(200).json(songs);
    return;
  } catch (err) {
    if (err instanceof RateLimitError) {
      console.error('Rate limit error:', err);
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Please wait a few seconds before trying again',
        retryAfter: 5, // seconds
      });
      return;
    }
    console.error('SuggestSongs error:', err);
    res.status(500).json({
      error: 'An error occurred while processing your request',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
    return;
  }
}

export default suggestSongsHandler;