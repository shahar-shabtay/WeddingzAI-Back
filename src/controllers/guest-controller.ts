import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import guestModel, { IGuest } from "../models/guest-model";
import tableModel from "../models/table-model";
import { BaseController } from "./base-controller";
import { AuthRequest } from "../common/auth-middleware";
import { sendInvitationEmails } from "../services/gmail-service";
import fs from "fs/promises";
import path from "path";

class GuestsController extends BaseController<IGuest> {
  constructor() {
    super(guestModel);
  }

  public create = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const { fullName, email, phone, rsvp, numberOfGuests } = req.body;

      if (!fullName || !email) {
        res.status(400).json({ message: "fullName and email are required" });
        return;
      }

      const existing = await guestModel.findOne({ userId, email });
      if (existing) {
        res
          .status(409)
          .json({ message: "Guest with this email already exists" });
        return;
      }

      const rsvpToken = crypto.randomBytes(16).toString("hex");

      const newGuest = await guestModel.create({
        userId,
        fullName,
        email,
        phone,
        rsvp,
        rsvpToken,
        numberOfGuests,
      });

      res.status(201).json({ message: "Guest created", data: newGuest });
    } catch (err) {
      console.error("create error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  public update = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const { id } = req.params;
      const { fullName, email, phone, rsvp, numberOfGuests } = req.body;

      const updatedGuest = await guestModel.findOneAndUpdate(
        { _id: id, userId },
        { fullName, email, phone, rsvp, numberOfGuests },
        { new: true }
      );

      if (!updatedGuest) {
        res.status(404).json({ message: "Guest not found" });
        return;
      }

      res.status(200).json({ message: "Guest updated", data: updatedGuest });
    } catch (err) {
      console.error("update error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  public remove = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const { id } = req.params;

      const deleted = await guestModel.findOneAndDelete({ _id: id, userId });

      if (!deleted) {
        res.status(404).json({ message: "Guest not found" });
        return;
      }

      res.status(200).json({ message: "Guest deleted", data: deleted });
    } catch (err) {
      console.error("remove error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  public sendInvitation = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const { partner1, partner2, weddingDate, venue } = req.body;

      if (!partner1 || !partner2 || !weddingDate) {
        res.status(400).json({ message: "Missing required fields" });
        return;
      }

      const guests = await guestModel.find({ userId });

      const recipients = guests
        .filter((g) => g.email && g.rsvpToken)
        .map((g) => ({
          email: g.email!,
          fullName: g.fullName,
          guestId: g._id.toString(),
          rsvpToken: g.rsvpToken!,
          numberOfGuests: g.numberOfGuests ?? 1,
          userId: g.userId.toString(),
        }));

      if (recipients.length === 0) {
        res.status(400).json({ message: "No guests with valid emails found" });
        return;
      }

      await sendInvitationEmails(
        recipients,
        partner1,
        partner2,
        weddingDate,
        venue
      );

      res.status(200).json({ message: "Invitations sent to all guests" });
    } catch (err) {
      console.error("sendInvitation error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  public rsvpResponse = async (req: Request, res: Response): Promise<void> => {
    try {
      const { guestId, token, response, numberOfGuests } =
        req.method === "POST" ? req.body : req.query;

      if (!guestId || !token || !response) {
        res.status(400).send("Missing guestId, token, or response.");
        return;
      }

      if (!["yes", "no", "maybe"].includes(response as string)) {
        res.status(400).send("Invalid RSVP response.");
        return;
      }

      const guest = await guestModel.findById(guestId);
      if (!guest || guest.rsvpToken !== token) {
        res.status(403).send("Invalid token or guest not found.");
        return;
      }

      guest.rsvp = response as "yes" | "no" | "maybe";

      const parsedCount = parseInt(numberOfGuests as string);
      if (!isNaN(parsedCount) && parsedCount >= 1 && parsedCount <= 20) {
        guest.numberOfGuests = parsedCount;
      }

      await guest.save();

      if (req.method === "POST") {
        res.status(200).send("OK");
      } else {
        const templatePath = path.join(
          __dirname,
          "../templates/rsvp-response.html"
        );
        let html = await fs.readFile(templatePath, "utf8");

        html = html
          .replace(/{{fullName}}/g, guest.fullName)
          .replace(/{{response}}/g, response as string)
          .replace(
            /{{bgImageUrl}}/g,
            "http://localhost:4000/static/main-bg.png"
          )
          .replace(/{{numberOfGuests}}/g, String(guest.numberOfGuests ?? 1));

        res.set("Content-Type", "text/html");
        res.send(html);
      }
    } catch (err) {
      console.error("rsvpResponse error:", err);
      res.status(500).send("Something went wrong.");
    }
  };

  public assignGuestToTable = async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const { guestId, tableId } = req.body;

      const guest = await guestModel.findOne({ _id: guestId, userId });
      if (!guest) {
        res.status(404).json({ message: "Guest not found" });
        return;
      }

      const table = await tableModel.findOne({ _id: tableId, userId });
      if (!table) {
        res.status(404).json({ message: "Table not found" });
        return;
      }

      guest.tableId = tableId;
      await guest.save();

      table.guests.push(guest._id);
      await table.save();

      res.status(200).json({ message: "Guest assigned to table", data: guest });
    } catch (err) {
      console.error("assignGuestToTable error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  public unassignGuest = async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const { guestId } = req.body;

      const guest = await guestModel.findOne({ _id: guestId, userId });
      if (!guest) {
        res.status(404).json({ message: "Guest not found" });
        return;
      }

      const tableId = guest.tableId;

      guest.tableId = null;
      await guest.save();

      if (tableId) {
        const table = await tableModel.findOne({ _id: tableId, userId });
        if (table) {
          table.guests = table.guests.filter(
            (guestObjectId) => guestObjectId?.toString() !== guestId
          );
          await table.save();
        }
      }

      res
        .status(200)
        .json({ message: "Guest unassigned from table", data: guest });
    } catch (err) {
      console.error("unassignGuest error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  };
}

export default new GuestsController();
