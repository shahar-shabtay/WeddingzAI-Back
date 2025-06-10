import { Request, Response } from "express";
import tableModel, { ITable } from "../models/table-model";
import guestModel from "../models/guest-model";
import { BaseController } from "./base-controller";
import { AuthRequest } from "../common/auth-middleware";

class TablesController extends BaseController<ITable> {
  constructor() {
    super(tableModel);
  }

  public getAvailableTables = async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const guestCount = parseInt(req.params.guestCount, 10);

      const tables = await tableModel.find({ userId });
      const guests = await guestModel.find({ userId });

      const tableOccupancy: Record<string, number> = {};
      guests.forEach((guest) => {
        if (guest.tableId) {
          const tableId = guest.tableId.toString();
          tableOccupancy[tableId] =
            (tableOccupancy[tableId] || 0) + (guest.numberOfGuests ?? 1);
        }
      });

      const availableTables = tables
        .filter((table) => {
          const occupied = tableOccupancy[table._id.toString()] || 0;
          const freeSeats = table.capacity - occupied;
          return freeSeats >= guestCount;
        })
        .map((table) => {
          const occupied = tableOccupancy[table._id.toString()] || 0;
          return {
            ...table.toObject(),
            freeSeats: table.capacity - occupied,
          };
        });

      res
        .status(200)
        .json({ message: "Available tables found", data: availableTables });
    } catch (err: unknown) {
      console.error("Error fetching available tables:", err);
      const error = err as Error;
      res.status(400).json({
        message: "Error fetching available tables",
        error: error.message,
      });
    }
  };

  public async getMine(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req);
      if (!userId) throw new Error("Unauthorized");

      const tables = await this.model.find({ userId }).populate("guests");

      this.sendSuccess(res, tables, "Tables with guests fetched successfully");
    } catch (err: any) {
      const status = err.message === "Unauthorized" ? 401 : 400;
      this.sendError(res, err, status);
    }
  }
}

export default new TablesController();
