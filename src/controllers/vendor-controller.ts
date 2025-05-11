// src/controllers/vendors-controller.ts

import { RequestHandler } from 'express';
import { BaseController } from './base-controller';
import { DjModel, IDj } from '../models/dj-model';
import { AuthRequest } from '../common/auth-middleware';
import { findDjUrls } from '../services/find-djs-service';
import { scrapeAndSaveDj } from '../services/dj-scrape-service';

class VendorsController extends BaseController<IDj> {
  constructor() {
    super(DjModel);
  }

  public find: RequestHandler = (req, res) => {
    const { listingUrl } = req.body as { listingUrl?: string };
    if (!listingUrl) {
      res.status(400).json({ message: 'Missing listingUrl' });
      return;
    }

    res
      .status(202)
      .json({ success: true, message: 'Scraping started in background.' });

    (async () => {
      try {
        const urls = await findDjUrls(listingUrl);
        for (const url of urls) {
          await scrapeAndSaveDj(url);
        }
        console.log(`✅ Done scraping ${urls.length} DJs`);
      } catch (err) {
        console.error('🔥 Background job error:', err);
      }
    })();
  };

  public scrape: RequestHandler = async (req, res, next) => {
    try {
      const { url } = req.body as { url?: string };
      if (!url) {
        res.status(400).json({ message: 'Missing URL in request body' });
        return;
      }
      const dj = await scrapeAndSaveDj(url);
      res.json({ success: true, dj });
    } catch (err) {
      next(err);
    }
  };
}

export default new VendorsController();