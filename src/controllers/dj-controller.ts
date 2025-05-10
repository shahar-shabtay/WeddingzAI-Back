import { Request, Response, NextFunction, RequestHandler } from "express";
import { scrapeAndSaveDj } from "../services/dj-scrape-service";

export const scrapeOneDjController: RequestHandler = async (req, res, next) => {
  console.log("[dj-controller] Received body:", req.body);
  try {
    const { url } = req.body;
    if (!url) {
      res.status(400).json({ message: "Missing URL in request body" });
      return;
    }
    const dj = await scrapeAndSaveDj(url);
    res.json({ success: true, dj });
  } catch (err: any) {
    console.error("[dj-controller] Error:", err);
    next(err);
  }
};